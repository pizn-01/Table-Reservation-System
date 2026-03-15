import crypto from 'crypto';
import { supabaseAdmin } from '../config/database';
import { AppError, NotFoundError } from '../middleware/errorHandler';
import { auditService } from './audit.service';

export class ApiKeyService {
  /**
   * Generate a new API key for a restaurant.
   */
  async create(restaurantId: string, name: string, userId?: string) {
    // Generate a secure random API key with prefix for easy identification
    const rawKey = `tr_live_${crypto.randomBytes(32).toString('hex')}`;
    const hashedKey = this.hashKey(rawKey);

    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .insert({
        restaurant_id: restaurantId,
        name,
        key_hash: hashedKey,
        key_prefix: rawKey.substring(0, 12),
        created_by: userId || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new AppError('Failed to create API key', 500);

    await auditService.log({
      restaurantId,
      userId,
      action: 'api_key.created',
      entityType: 'api_key',
      entityId: data.id,
    });

    // Return the raw key only once — it can't be retrieved later
    return {
      id: data.id,
      name: data.name,
      key: rawKey,
      keyPrefix: data.key_prefix,
      createdAt: data.created_at,
      message: 'Save this key securely. It will not be shown again.',
    };
  }

  /**
   * List API keys for a restaurant (hashed keys only).
   */
  async list(restaurantId: string) {
    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .select('id, restaurant_id, name, key_prefix, is_active, last_used_at, created_at')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch API keys', 500);
    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      keyPrefix: row.key_prefix,
      isActive: row.is_active,
      lastUsedAt: row.last_used_at,
      createdAt: row.created_at,
    }));
  }

  /**
   * Revoke (deactivate) an API key.
   */
  async revoke(keyId: string, restaurantId: string, userId?: string) {
    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', keyId)
      .eq('restaurant_id', restaurantId)
      .select()
      .single();

    if (error || !data) throw new NotFoundError('API key');

    await auditService.log({
      restaurantId,
      userId,
      action: 'api_key.revoked',
      entityType: 'api_key',
      entityId: keyId,
    });

    return { success: true };
  }

  /**
   * Validate an API key and return the associated restaurant ID.
   * Used by public API middleware to authenticate external requests.
   */
  async validate(rawKey: string): Promise<{ restaurantId: string; keyId: string } | null> {
    const hashedKey = this.hashKey(rawKey);

    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .select('id, restaurant_id, is_active')
      .eq('key_hash', hashedKey)
      .single();

    if (error || !data || !data.is_active) return null;

    // Update last used timestamp (fire-and-forget)
    supabaseAdmin
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id)
      .then(() => {});

    return { restaurantId: data.restaurant_id, keyId: data.id };
  }

  /**
   * Hash an API key for secure storage.
   */
  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }
}

export const apiKeyService = new ApiKeyService();
