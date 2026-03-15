import { supabaseAdmin } from '../config/database';
import { AppError, NotFoundError } from '../middleware/errorHandler';
import { CreateWaitingListDto } from '../types/api.types';
import { WaitingListStatus } from '../types/enums';

export class WaitingListService {
  /**
   * List waiting list entries for a restaurant on a specific date.
   */
  async list(restaurantId: string, date?: string) {
    let query = supabaseAdmin
      .from('waiting_list')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('position', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (date) {
      query = query.eq('requested_date', date);
    } else {
      // Default to active entries only
      query = query.in('status', [WaitingListStatus.WAITING, WaitingListStatus.NOTIFIED]);
    }

    const { data, error } = await query;
    if (error) throw new AppError('Failed to fetch waiting list', 500);
    return (data || []).map(this.formatEntry);
  }

  /**
   * Add a new entry to the waiting list.
   */
  async add(restaurantId: string, dto: CreateWaitingListDto) {
    // Calculate next position
    const { count } = await supabaseAdmin
      .from('waiting_list')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId)
      .eq('requested_date', dto.requestedDate)
      .in('status', [WaitingListStatus.WAITING, WaitingListStatus.NOTIFIED]);

    const position = (count || 0) + 1;

    const { data, error } = await supabaseAdmin
      .from('waiting_list')
      .insert({
        restaurant_id: restaurantId,
        customer_name: dto.customerName,
        customer_phone: dto.customerPhone || null,
        customer_email: dto.customerEmail || null,
        party_size: dto.partySize,
        requested_date: dto.requestedDate,
        requested_time: dto.requestedTime || null,
        preferred_area: dto.preferredArea || null,
        status: WaitingListStatus.WAITING,
        position,
        notes: dto.notes || null,
      })
      .select()
      .single();

    if (error) throw new AppError('Failed to add to waiting list', 500);
    return this.formatEntry(data);
  }

  /**
   * Update waiting list entry status.
   */
  async updateStatus(entryId: string, restaurantId: string, newStatus: WaitingListStatus) {
    const validTransitions: Record<string, string[]> = {
      [WaitingListStatus.WAITING]: [WaitingListStatus.NOTIFIED, WaitingListStatus.SEATED, WaitingListStatus.EXPIRED],
      [WaitingListStatus.NOTIFIED]: [WaitingListStatus.SEATED, WaitingListStatus.EXPIRED],
      [WaitingListStatus.SEATED]: [],
      [WaitingListStatus.EXPIRED]: [],
    };

    // Get current entry
    const { data: current, error: fetchErr } = await supabaseAdmin
      .from('waiting_list')
      .select('status')
      .eq('id', entryId)
      .eq('restaurant_id', restaurantId)
      .single();

    if (fetchErr || !current) throw new NotFoundError('Waiting list entry');

    const allowed = validTransitions[current.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new AppError(`Cannot transition from '${current.status}' to '${newStatus}'`, 400);
    }

    const { data, error } = await supabaseAdmin
      .from('waiting_list')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', entryId)
      .eq('restaurant_id', restaurantId)
      .select()
      .single();

    if (error || !data) throw new AppError('Failed to update status', 500);

    // If seated or expired, recalculate positions for remaining entries
    if (newStatus === WaitingListStatus.SEATED || newStatus === WaitingListStatus.EXPIRED) {
      await this.recalculatePositions(restaurantId, data.requested_date);
    }

    return this.formatEntry(data);
  }

  /**
   * Remove entry from waiting list.
   */
  async remove(entryId: string, restaurantId: string) {
    const { data: entry, error: fetchErr } = await supabaseAdmin
      .from('waiting_list')
      .select('requested_date')
      .eq('id', entryId)
      .eq('restaurant_id', restaurantId)
      .single();

    if (fetchErr || !entry) throw new NotFoundError('Waiting list entry');

    const { error } = await supabaseAdmin
      .from('waiting_list')
      .delete()
      .eq('id', entryId)
      .eq('restaurant_id', restaurantId);

    if (error) throw new AppError('Failed to remove entry', 500);

    await this.recalculatePositions(restaurantId, entry.requested_date);
    return { success: true };
  }

  /**
   * Recalculate positions after removal/status change.
   */
  private async recalculatePositions(restaurantId: string, date: string) {
    const { data: activeEntries } = await supabaseAdmin
      .from('waiting_list')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('requested_date', date)
      .in('status', [WaitingListStatus.WAITING, WaitingListStatus.NOTIFIED])
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (!activeEntries) return;

    for (let i = 0; i < activeEntries.length; i++) {
      await supabaseAdmin
        .from('waiting_list')
        .update({ position: i + 1 })
        .eq('id', activeEntries[i].id);
    }
  }

  // ─── Formatter ────────────────────────────────────────

  private formatEntry(row: any) {
    return {
      id: row.id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerEmail: row.customer_email,
      partySize: row.party_size,
      requestedDate: row.requested_date,
      requestedTime: row.requested_time,
      preferredArea: row.preferred_area,
      status: row.status,
      position: row.position,
      estimatedWaitMin: row.estimated_wait_min,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const waitingListService = new WaitingListService();
