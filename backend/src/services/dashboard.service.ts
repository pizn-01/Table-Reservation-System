import { supabaseAdmin } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { getTodayDate } from '../utils/time';

export class DashboardService {
  /**
   * Get comprehensive dashboard statistics for a restaurant.
   */
  async getStats(restaurantId: string) {
    const today = getTodayDate();

    const [
      todayReservations,
      totalReservations,
      activeTableCount,
      upcomingReservations,
      statusBreakdown,
      recentReservations,
    ] = await Promise.all([
      // Today's reservation count
      supabaseAdmin
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('reservation_date', today),

      // Total all-time reservation count
      supabaseAdmin
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId),

      // Active table count
      supabaseAdmin
        .from('tables')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true),

      // Upcoming reservations (next 7 days, excluding today)
      supabaseAdmin
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .gt('reservation_date', today)
        .not('status', 'in', '(cancelled,no_show)'),

      // Today's reservations by status
      supabaseAdmin
        .from('reservations')
        .select('status')
        .eq('restaurant_id', restaurantId)
        .eq('reservation_date', today),

      // Recent 5 reservations
      supabaseAdmin
        .from('reservations')
        .select('*, tables(table_number, name)')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    // Calculate status breakdown
    const breakdown: Record<string, number> = {};
    for (const row of (statusBreakdown.data || [])) {
      breakdown[row.status] = (breakdown[row.status] || 0) + 1;
    }

    // Calculate today's total covers (sum of party_size for today's active bookings)
    const { data: coversData } = await supabaseAdmin
      .from('reservations')
      .select('party_size')
      .eq('restaurant_id', restaurantId)
      .eq('reservation_date', today)
      .not('status', 'in', '(cancelled,no_show)');

    const todayCovers = (coversData || []).reduce((sum: number, r: any) => sum + (r.party_size || 0), 0);

    // Waiting list count
    const { count: waitingCount } = await supabaseAdmin
      .from('waiting_list')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId)
      .in('status', ['waiting', 'notified']);

    return {
      today: {
        reservations: todayReservations.count || 0,
        covers: todayCovers,
        statusBreakdown: breakdown,
        waitingList: waitingCount || 0,
      },
      totals: {
        allTimeReservations: totalReservations.count || 0,
        activeTables: activeTableCount.count || 0,
        upcomingReservations: upcomingReservations.count || 0,
      },
      recentReservations: (recentReservations.data || []).map((r: any) => ({
        id: r.id,
        guestName: `${r.guest_first_name || ''} ${r.guest_last_name || ''}`.trim(),
        partySize: r.party_size,
        date: r.reservation_date,
        time: r.start_time,
        status: r.status,
        table: r.tables?.name || r.tables?.table_number || null,
      })),
    };
  }

  /**
   * Get weekly reservation trend (last 7 days).
   */
  async getWeeklyTrend(restaurantId: string) {
    const days = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    const results = [];
    for (const day of days) {
      const { count } = await supabaseAdmin
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('reservation_date', day)
        .not('status', 'in', '(cancelled,no_show)');

      results.push({ date: day, count: count || 0 });
    }

    return results;
  }
}

export const dashboardService = new DashboardService();
