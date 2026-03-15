import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/database';
import { AuthenticatedRequest } from '../types/api.types';

/**
 * Audit service — logs all mutations with before/after snapshots.
 */
export class AuditService {
  async log(params: {
    restaurantId?: string;
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    changes?: Record<string, any>;
    req?: Request;
  }) {
    try {
      await supabaseAdmin.from('audit_log').insert({
        restaurant_id: params.restaurantId || null,
        user_id: params.userId || null,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId || null,
        changes: params.changes || null,
        ip_address: params.req?.ip || null,
        user_agent: params.req?.headers['user-agent'] || null,
      });
    } catch (err) {
      // Don't let audit failures block the main operation
      console.error('Audit log failed:', err);
    }
  }

  /**
   * Query audit log with filters.
   */
  async query(filters: {
    restaurantId?: string;
    entityType?: string;
    action?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 100);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.restaurantId) query = query.eq('restaurant_id', filters.restaurantId);
    if (filters.entityType) query = query.eq('entity_type', filters.entityType);
    if (filters.action) query = query.ilike('action', `%${filters.action}%`);
    if (filters.userId) query = query.eq('user_id', filters.userId);

    const { data, error, count } = await query;

    if (error) {
      console.error('Audit log query failed:', error);
      return { entries: [], total: 0 };
    }

    return {
      entries: (data || []).map((row: any) => ({
        id: row.id,
        restaurantId: row.restaurant_id,
        userId: row.user_id,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        changes: row.changes,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        createdAt: row.created_at,
      })),
      total: count || 0,
    };
  }
}

export const auditService = new AuditService();

/**
 * Audit middleware — automatically logs mutations (POST, PUT, PATCH, DELETE).
 */
export const auditMiddleware = (entityType: string) => {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    // Attach audit info to request for post-response logging
    (req as any)._auditEntityType = entityType;
    next();
  };
};
