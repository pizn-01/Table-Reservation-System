import { supabaseAdmin } from '../config/database';
import { AppError, NotFoundError } from '../middleware/errorHandler';
import { InviteStaffDto, UpdateStaffDto } from '../types/api.types';
import { UserRole } from '../types/enums';
import { generateToken, generateRefreshToken } from '../middleware/auth';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { emailService } from './email.service';

export class StaffService {
  private createInviteToken(staffRecordId: string): string {
    return jwt.sign(
      { type: 'staff_invite', staffRecordId },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  private parseInviteToken(token: string): string {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      if (decoded?.type !== 'staff_invite' || !decoded?.staffRecordId) {
        throw new AppError('Invalid invitation token', 400);
      }
      return decoded.staffRecordId as string;
    } catch {
      throw new AppError('Invitation token is invalid or expired', 400);
    }
  }

  /**
   * List all staff for a restaurant.
   */
  async list(restaurantId: string, roleFilter?: string) {
    let query = supabaseAdmin
      .from('staff_members')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (roleFilter && roleFilter !== 'all') {
      query = query.eq('role', roleFilter);
    }

    const { data, error } = await query;

    if (error) throw new AppError('Failed to fetch staff', 500);
    return (data || []).map(this.formatStaff);
  }

  /**
   * Get a single staff member.
   */
  async getById(staffId: string, restaurantId: string) {
    const { data, error } = await supabaseAdmin
      .from('staff_members')
      .select('*')
      .eq('id', staffId)
      .eq('restaurant_id', restaurantId)
      .single();

    if (error || !data) throw new NotFoundError('Staff member');
    return this.formatStaff(data);
  }

  /**
   * Invite a new staff member.
   */
  async invite(restaurantId: string, dto: InviteStaffDto) {
    const { data: existing } = await supabaseAdmin
      .from('staff_members')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('email', dto.email)
      .single();

    if (existing) {
      throw new AppError('Staff member with this email already exists in this restaurant', 409);
    }

    const { data, error } = await supabaseAdmin
      .from('staff_members')
      .insert({
        restaurant_id: restaurantId,
        name: dto.name,
        email: dto.email,
        role: dto.role,
        is_active: true, // Explicitly set active on invitation
        invited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new AppError('Failed to invite staff member', 500);

    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('name')
      .eq('id', restaurantId)
      .single();

    const inviteToken = this.createInviteToken(data.id);
    const baseUrl = env.FRONTEND_URL;
    const inviteUrl = `${baseUrl}/accept-invite?token=${inviteToken}`;

    emailService.sendStaffInvite({
      to: dto.email,
      staffName: dto.name,
      restaurantName: org?.name || 'Your Restaurant',
      inviteToken,
      baseUrl,
    }).catch(() => {});

    return {
      ...this.formatStaff(data),
      inviteUrl,
    };
  }

  /**
   * Accept a staff invitation — creates auth user and links to staff record.
   */
  async acceptInvite(inviteToken: string, password: string, name: string) {
    const staffRecordId = this.parseInviteToken(inviteToken);
    // 1. Get pending staff record
    const { data: staffRecord, error: staffErr } = await supabaseAdmin
      .from('staff_members')
      .select('*, organizations(id, name, slug, setup_completed)')
      .eq('id', staffRecordId)
      .is('accepted_at', null)
      .single();

    if (staffErr || !staffRecord) {
      throw new NotFoundError('Invitation not found or already accepted');
    }

    // 2. Create Supabase Auth user
    const roleMap: Record<string, UserRole> = {
      admin: UserRole.RESTAURANT_ADMIN,
      manager: UserRole.MANAGER,
      host: UserRole.HOST,
      viewer: UserRole.VIEWER,
    };

    const userRole = roleMap[staffRecord.role] || UserRole.VIEWER;

    // 2. Handle Supabase Auth user (Create or Link existing)
    let authUser: any = null;
    let createdAuthUserId: string | null = null;

    // Use a more reliable way to find the user.
    // listUsers() returns up to 1000 users by default in recent versions,
    // but we'll use a specific email check to be sure.
    const { data: { users: matchedUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error(`[Staff] Failed to list users during invite accept:`, listError);
    }

    // Always compare emails in a case-insensitive way
    const targetEmail = staffRecord.email.toLowerCase();
    const existingAuthUser = matchedUsers?.find((u: any) => u.email?.toLowerCase() === targetEmail);

    if (existingAuthUser) {
      authUser = existingAuthUser;
      await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        user_metadata: {
          ...authUser.user_metadata,
          name,
          role: userRole,
        },
      }).catch((e) => console.error(`[Staff] Meta update failed for ${authUser.id}:`, e));
    } else {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: staffRecord.email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          role: userRole,
        },
      });

      if (authError || !authData?.user) {
        throw new AppError(authError?.message || 'Failed to create account', 500);
      }
      authUser = authData.user;
      createdAuthUserId = authData.user.id;
    }

    // 3. Link auth user to staff record
    const { error: updateErr } = await supabaseAdmin
      .from('staff_members')
      .update({
        user_id: authUser.id,
        name,
        is_active: true, // Explicitly ensure active
        accepted_at: new Date().toISOString(),
      })
      .eq('id', staffRecordId);

    if (updateErr) {
      // If we created a new auth user in this flow, remove it to avoid orphaned accounts
      if (createdAuthUserId) {
        await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId).catch(() => {});
      }
      throw new AppError('Failed to accept invitation', 500);
    }

    // 4. Generate JWT using the linked/created auth user id
    const org = staffRecord.organizations;
    const token = generateToken({
      sub: authUser.id,
      email: staffRecord.email,
      role: userRole,
      restaurantId: org.id,
    });

    const refreshToken = generateRefreshToken(authUser.id);

    return {
      user: {
        id: authUser.id,
        email: staffRecord.email,
        role: userRole,
        name,
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
   * Update staff member.
   */
  async update(staffId: string, restaurantId: string, dto: UpdateStaffDto) {
    const updateData: Record<string, any> = {};

    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.isActive !== undefined) updateData.is_active = dto.isActive;

    const { data, error } = await supabaseAdmin
      .from('staff_members')
      .update(updateData)
      .eq('id', staffId)
      .eq('restaurant_id', restaurantId)
      .select()
      .single();

    if (error || !data) throw new NotFoundError('Staff member');
    return this.formatStaff(data);
  }

  /**
   * Remove (deactivate) staff member.
   */
  async remove(staffId: string, restaurantId: string) {
    const { data: staff } = await supabaseAdmin
      .from('staff_members')
      .select('role')
      .eq('id', staffId)
      .eq('restaurant_id', restaurantId)
      .single();

    if (!staff) throw new NotFoundError('Staff member');

    const { error } = await supabaseAdmin
      .from('staff_members')
      .update({ is_active: false })
      .eq('id', staffId)
      .eq('restaurant_id', restaurantId);

    if (error) throw new AppError('Failed to remove staff member', 500);
    return { success: true };
  }

  /**
   * Search staff by name, email, or phone.
   */
  async search(restaurantId: string, query: string) {
    const { data, error } = await supabaseAdmin
      .from('staff_members')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`);

    if (error) throw new AppError('Failed to search staff', 500);
    return (data || []).map(this.formatStaff);
  }

  // ─── Formatter ────────────────────────────────────────

  private formatStaff(row: any) {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      isActive: row.is_active,
      invitedAt: row.invited_at,
      acceptedAt: row.accepted_at,
      lastActiveAt: row.last_active_at,
      createdAt: row.created_at,
    };
  }
}

export const staffService = new StaffService();
