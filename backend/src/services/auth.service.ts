import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/database';
import { generateToken, generateRefreshToken } from '../middleware/auth';
import { generateUniqueSlug } from '../utils/slug';
import { SignupDto, LoginDto, StaffLoginDto, AuthResponse, JwtPayload } from '../types/api.types';
import { UserRole } from '../types/enums';
import { AppError, NotFoundError, ConflictError } from '../middleware/errorHandler';
import { env } from '../config/env';

export class AuthService {
  /**
   * Register a new restaurant owner + create organization.
   */
  async signup(dto: SignupDto): Promise<AuthResponse> {
    const { data: existingUser } = await supabaseAdmin
      .from('staff_members')
      .select('id')
      .eq('email', dto.email)
      .single();

    if (existingUser) {
      throw new ConflictError('An account with this email already exists');
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
      user_metadata: {
        name: dto.ownerName,
        role: UserRole.RESTAURANT_ADMIN,
      },
    });

    if (authError || !authData.user) {
      throw new AppError(authError?.message || 'Failed to create user', 500);
    }

    const userId = authData.user.id;

    const slug = generateUniqueSlug(dto.businessName);
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: dto.businessName,
        slug,
        owner_id: userId,
        country: dto.country || 'United Kingdom',
        timezone: dto.timezone || 'Europe/London',
      })
      .select()
      .single();

    if (orgError || !org) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new AppError('Failed to create organization', 500);
    }

    await supabaseAdmin.from('staff_members').insert({
      user_id: userId,
      restaurant_id: org.id,
      role: 'admin',
      name: dto.ownerName,
      email: dto.email,
      accepted_at: new Date().toISOString(),
    });

    const token = generateToken({
      sub: userId,
      email: dto.email,
      role: UserRole.RESTAURANT_ADMIN,
      restaurantId: org.id,
    });

    const refreshToken = generateRefreshToken(userId);

    return {
      user: {
        id: userId,
        email: dto.email,
        role: UserRole.RESTAURANT_ADMIN,
        name: dto.ownerName,
      },
      token,
      refreshToken,
      restaurant: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        setupCompleted: org.setup_completed,
      },
    };
  }

  /**
   * Login for restaurant admin/owner.
   */
  async login(dto: LoginDto): Promise<AuthResponse> {
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (authError || !authData.user) {
      throw new AppError('Invalid email or password', 401);
    }

    const userId = authData.user.id;

    const { data: staffMember, error: staffError } = await supabaseAdmin
      .from('staff_members')
      .select('*, organizations(*)')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (staffError || !staffMember) {
      const { data: superAdmin } = await supabaseAdmin
        .from('super_admins')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (superAdmin) {
        const token = generateToken({
          sub: userId,
          email: dto.email,
          role: UserRole.SUPER_ADMIN,
        });

        return {
          user: {
            id: userId,
            email: dto.email,
            role: UserRole.SUPER_ADMIN,
            name: superAdmin.name,
          },
          token,
        };
      }

      throw new AppError('No active staff account found for this email', 401);
    }

    const roleMap: Record<string, UserRole> = {
      admin: UserRole.RESTAURANT_ADMIN,
      manager: UserRole.MANAGER,
      host: UserRole.HOST,
      viewer: UserRole.VIEWER,
    };

    const role = roleMap[staffMember.role] || UserRole.VIEWER;
    const org = staffMember.organizations;

    await supabaseAdmin
      .from('staff_members')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', staffMember.id);

    const token = generateToken({
      sub: userId,
      email: dto.email,
      role,
      restaurantId: org.id,
    });

    const refreshToken = generateRefreshToken(userId);

    return {
      user: {
        id: userId,
        email: dto.email,
        role,
        name: staffMember.name,
      },
      token,
      refreshToken,
      restaurant: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        setupCompleted: org.setup_completed,
      },
    };
  }

  /**
   * Staff-specific login (can specify restaurant slug).
   */
  async staffLogin(dto: StaffLoginDto): Promise<AuthResponse> {
    return this.login({
      email: dto.email,
      password: dto.password,
    });
  }

  /**
   * Customer self-registration (for diners).
   * Creates a customer account WITHOUT a restaurant/organization.
   */
  async customerSignup(dto: {
    firstName: string;
    lastName?: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<AuthResponse> {
    // Check if customer already exists
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('email', dto.email)
      .single();

    if (existingCustomer) {
      throw new ConflictError('An account with this email already exists');
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
      user_metadata: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: UserRole.CUSTOMER,
      },
    });

    if (authError || !authData.user) {
      throw new AppError(authError?.message || 'Failed to create account', 500);
    }

    const userId = authData.user.id;

    // Create customer record
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .insert({
        user_id: userId,
        first_name: dto.firstName,
        last_name: dto.lastName || null,
        email: dto.email,
        phone: dto.phone || null,
      })
      .select()
      .single();

    if (customerError || !customer) {
      // Cleanup: delete auth user if customer creation failed
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new AppError('Failed to create customer profile', 500);
    }

    const token = generateToken({
      sub: userId,
      email: dto.email,
      role: UserRole.CUSTOMER,
    });

    const refreshToken = generateRefreshToken(userId);

    return {
      user: {
        id: userId,
        email: dto.email,
        role: UserRole.CUSTOMER,
        name: dto.firstName,
      },
      token,
      refreshToken,
    };
  }

  /**
   * Customer login.
   */
  async customerLogin(dto: LoginDto): Promise<AuthResponse> {
    // Try to authenticate via Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (authError || !authData.user) {
      throw new AppError('Invalid email or password', 401);
    }

    const userId = authData.user.id;

    // Fetch customer record
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (customerError || !customer) {
      // Auth succeeded but no customer profile - this shouldn't happen normally
      // Could be a staff member trying to use customer endpoint
      throw new AppError('Customer account not found', 401);
    }

    // Update last activity
    await supabaseAdmin
      .from('customers')
      .update({ last_engaged_at: new Date().toISOString() })
      .eq('id', customer.id);

    const token = generateToken({
      sub: userId,
      email: dto.email,
      role: UserRole.CUSTOMER,
    });

    const refreshToken = generateRefreshToken(userId);

    return {
      user: {
        id: userId,
        email: dto.email,
        role: UserRole.CUSTOMER,
        name: customer.first_name,
      },
      token,
      refreshToken,
    };
  }

  /**
   * Get current user profile from JWT.
   */
  async getProfile(userId: string) {
    const { data: staffMember } = await supabaseAdmin
      .from('staff_members')
      .select('*, organizations(id, name, slug, setup_completed)')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (staffMember) {
      return {
        id: userId,
        email: staffMember.email,
        name: staffMember.name,
        role: staffMember.role,
        restaurant: staffMember.organizations,
      };
    }

    const { data: superAdmin } = await supabaseAdmin
      .from('super_admins')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (superAdmin) {
      return {
        id: userId,
        email: superAdmin.email,
        name: superAdmin.name,
        role: UserRole.SUPER_ADMIN,
      };
    }

    throw new NotFoundError('User profile');
  }

  // ─── Password Reset ──────────────────────────────────

  /**
   * Request a password reset — sends reset link via Supabase Auth.
   */
  async forgotPassword(email: string) {
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${env.CORS_ORIGINS.split(',')[0]}/reset-password`,
    });

    if (error) {
      // Don't reveal if email exists or not
      console.error('Password reset error:', error.message);
    }

    // Always return success to prevent email enumeration
    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  /**
   * Reset password using token from Supabase Auth email link.
   */
  async resetPassword(accessToken: string, newPassword: string) {
    const { data: tokenUser, error: tokenErr } = await supabaseAdmin.auth.getUser(accessToken);
    if (tokenErr || !tokenUser?.user?.id) {
      throw new AppError('Failed to reset password. The link may have expired.', 400);
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      tokenUser.user.id,
      { password: newPassword }
    );

    // For Supabase, the user exchanges the reset token client-side for a session,
    // then sends the access_token to this endpoint to set new password
    if (error) {
      throw new AppError('Failed to reset password. The link may have expired.', 400);
    }

    return { message: 'Password has been reset successfully.' };
  }

  // ─── Token Refresh ───────────────────────────────────

  /**
   * Refresh an access token using a refresh token.
   */
  async refreshToken(refreshTokenStr: string) {
    try {
      const decoded = jwt.verify(refreshTokenStr, env.JWT_SECRET) as any;

      if (decoded.type !== 'refresh') {
        throw new AppError('Invalid refresh token', 401);
      }

      const userId = decoded.sub;

      // Look up user to get fresh role/restaurant data
      const { data: staffMember } = await supabaseAdmin
        .from('staff_members')
        .select('*, organizations(*)')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (staffMember) {
        const roleMap: Record<string, UserRole> = {
          admin: UserRole.RESTAURANT_ADMIN,
          manager: UserRole.MANAGER,
          host: UserRole.HOST,
          viewer: UserRole.VIEWER,
        };

        const role = roleMap[staffMember.role] || UserRole.VIEWER;
        const org = staffMember.organizations;

        const token = generateToken({
          sub: userId,
          email: staffMember.email,
          role,
          restaurantId: org.id,
        });

        const newRefreshToken = generateRefreshToken(userId);

        return {
          token,
          refreshToken: newRefreshToken,
          user: {
            id: userId,
            email: staffMember.email,
            role,
            name: staffMember.name,
          },
        };
      }

      // Super admin
      const { data: superAdmin } = await supabaseAdmin
        .from('super_admins')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (superAdmin) {
        const token = generateToken({
          sub: userId,
          email: superAdmin.email,
          role: UserRole.SUPER_ADMIN,
        });

        const newRefreshToken = generateRefreshToken(userId);

        return {
          token,
          refreshToken: newRefreshToken,
          user: {
            id: userId,
            email: superAdmin.email,
            role: UserRole.SUPER_ADMIN,
            name: superAdmin.name,
          },
        };
      }

      throw new AppError('User not found', 401);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }
}

export const authService = new AuthService();
