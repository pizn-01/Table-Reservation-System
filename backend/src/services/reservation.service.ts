import { supabaseAdmin } from '../config/database';
import { AppError, NotFoundError } from '../middleware/errorHandler';
import { CreateReservationDto, UpdateReservationDto, ReservationFilterQuery } from '../types/api.types';
import { ReservationStatus } from '../types/enums';
import { addMinutesToTime, timeRangesOverlap, getTodayDate, timeToMinutes } from '../utils/time';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';
import { emailService } from './email.service';

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  [ReservationStatus.PENDING]: [ReservationStatus.CONFIRMED, ReservationStatus.CANCELLED],
  [ReservationStatus.CONFIRMED]: [ReservationStatus.ARRIVING, ReservationStatus.SEATED, ReservationStatus.CANCELLED, ReservationStatus.NO_SHOW],
  [ReservationStatus.ARRIVING]: [ReservationStatus.SEATED, ReservationStatus.CANCELLED, ReservationStatus.NO_SHOW],
  [ReservationStatus.SEATED]: [ReservationStatus.COMPLETED],
  [ReservationStatus.COMPLETED]: [],
  [ReservationStatus.CANCELLED]: [],
  [ReservationStatus.NO_SHOW]: [],
};

export class ReservationService {
  /**
   * List reservations with filtering and pagination.
   */
  async list(restaurantId: string, filters: ReservationFilterQuery) {
    const { page, limit, offset } = parsePagination(filters);

    let query = supabaseAdmin
      .from('reservations')
      .select('*, tables(id, table_number, name, floor_areas(name))', { count: 'exact' })
      .eq('restaurant_id', restaurantId);

    // Apply filters
    if (filters.date) {
      query = query.eq('reservation_date', filters.date);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.tableId) {
      query = query.eq('table_id', filters.tableId);
    }
    if (filters.search) {
      query = query.or(
        `guest_first_name.ilike.%${filters.search}%,guest_last_name.ilike.%${filters.search}%,guest_email.ilike.%${filters.search}%`
      );
    }

    // Sorting
    const sortBy = filters.sortBy || 'start_time';
    const sortOrder = filters.sortOrder === 'desc' ? false : true;
    query = query.order(sortBy, { ascending: sortOrder });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw new AppError('Failed to fetch reservations', 500);

    return {
      reservations: (data || []).map(this.formatReservation),
      meta: buildPaginationMeta(page, limit, count || 0),
    };
  }

  /**
   * Get a single reservation by ID.
   */
  async getById(reservationId: string, restaurantId: string) {
    const { data, error } = await supabaseAdmin
      .from('reservations')
      .select('*, tables(id, table_number, name, floor_areas(name))')
      .eq('id', reservationId)
      .eq('restaurant_id', restaurantId)
      .single();

    if (error || !data) throw new NotFoundError('Reservation');
    return this.formatReservation(data);
  }

  /**
   * Create a new reservation.
   */
  async create(restaurantId: string, dto: CreateReservationDto, createdBy?: string) {
    // Get restaurant settings
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('name, default_reservation_duration_min, max_party_size, opening_time, closing_time, min_advance_booking_hours, max_advance_booking_days')
      .eq('id', restaurantId)
      .single();

    if (!org) throw new AppError('Restaurant not found', 404);

    const duration = org.default_reservation_duration_min || 90;
    const maxParty = org.max_party_size || 20;

    // Validate party size
    if (dto.partySize > maxParty) {
      throw new AppError(`Party size cannot exceed ${maxParty}`, 400);
    }

    // Validate reservation date is not in past
    const today = getTodayDate();
    if (dto.reservationDate < today) {
      throw new AppError('Cannot book reservations in the past', 400);
    }

    // Validate advance booking limits
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + (org.max_advance_booking_days || 30));
    const maxDateStr = maxDate.toISOString().split('T')[0];
    
    if (dto.reservationDate > maxDateStr) {
      throw new AppError(`Can only book up to ${org.max_advance_booking_days || 30} days in advance`, 400);
    }

    // Validate operating hours
    const openTime = org.opening_time;
    const closeTime = org.closing_time;
    
    if (timeToMinutes(dto.startTime) < timeToMinutes(openTime)) {
      throw new AppError(`Restaurant does not open until ${openTime}`, 400);
    }

    let endTime: string;
    try {
      endTime = dto.endTime || addMinutesToTime(dto.startTime, duration);
    } catch (error) {
      throw new AppError(`Reservation would exceed 24-hour boundary. Please choose an earlier time.`, 400);
    }

    if (timeToMinutes(endTime) > timeToMinutes(closeTime)) {
      throw new AppError(`Restaurant closes at ${closeTime}. Please choose an earlier time.`, 400);
    }

    // Create or find customer
    let customerId: string | null = null;
    if (dto.guestEmail) {
      const { data: existingCustomer } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('email', dto.guestEmail)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer } = await supabaseAdmin
          .from('customers')
          .insert({
            first_name: dto.guestFirstName,
            last_name: dto.guestLastName || null,
            email: dto.guestEmail,
            phone: dto.guestPhone || null,
          })
          .select()
          .single();

        if (newCustomer) customerId = newCustomer.id;
      }
    }

    // Use SQL RPC to securely lock table row and insert atomically
    const { data: rpcData, error } = await supabaseAdmin.rpc('create_reservation_atomic', {
      p_restaurant_id: restaurantId,
      p_table_id: dto.tableId || null,
      p_customer_id: customerId,
      p_reservation_date: dto.reservationDate,
      p_start_time: dto.startTime,
      p_end_time: endTime,
      p_party_size: dto.partySize,
      p_guest_first_name: dto.guestFirstName,
      p_guest_last_name: dto.guestLastName || null,
      p_guest_email: dto.guestEmail,
      p_guest_phone: dto.guestPhone || null,
      p_source: dto.source || 'app',
      p_special_requests: dto.specialRequests || null,
      p_created_by: createdBy || null
    });

    if (error) {
      if (error.message.includes('Table is no longer available')) {
        throw new AppError('Table is no longer available for this time slot (booked by another user)', 409);
      }
      throw new AppError(`Failed to create reservation: ${error.message}`, 500);
    }
    
    // Fetch the newly created reservation with relation data
    const { data: createdRes, error: fetchErr } = await supabaseAdmin
      .from('reservations')
      .select('*, tables(id, table_number, name, floor_areas(name))')
      .eq('id', rpcData.id)
      .single();

    if (fetchErr) throw new AppError(`Failed to fetch created reservation: ${fetchErr.message}`, 500);

    // Update customer visit link
    if (customerId) {
      await supabaseAdmin.from('customer_restaurant_link').upsert(
        {
          customer_id: customerId,
          restaurant_id: restaurantId,
        },
        { onConflict: 'customer_id,restaurant_id' }
      );
    }

    const formattedRes = this.formatReservation(createdRes);

    // Send confirmation email asynchronously (do not block the response)
    if (dto.guestEmail && org?.name) {
      emailService.sendReservationConfirmation({
        to: dto.guestEmail,
        guestName: dto.guestFirstName,
        restaurantName: org.name,
        date: dto.reservationDate,
        time: dto.startTime,
        partySize: dto.partySize,
        confirmationId: createdRes.id.split('-')[0].toUpperCase(),
      });
    }

    return formattedRes;
  }

  /**
   * Update a reservation.
   */
  async update(reservationId: string, restaurantId: string, dto: UpdateReservationDto) {
    const { data: current, error: currentErr } = await supabaseAdmin
      .from('reservations')
      .select('id, table_id, reservation_date, start_time, end_time, party_size')
      .eq('id', reservationId)
      .eq('restaurant_id', restaurantId)
      .single();

    if (currentErr || !current) throw new NotFoundError('Reservation');

    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('name, default_reservation_duration_min, max_party_size, opening_time, closing_time, max_advance_booking_days')
      .eq('id', restaurantId)
      .single();

    if (!org) throw new AppError('Restaurant not found', 404);

    const effectiveTableId = dto.tableId !== undefined ? dto.tableId : current.table_id;
    const effectiveDate = dto.reservationDate !== undefined ? dto.reservationDate : current.reservation_date;
    const effectiveStart = dto.startTime !== undefined ? dto.startTime : current.start_time;
    const effectivePartySize = dto.partySize !== undefined ? dto.partySize : current.party_size;
    const effectiveEnd =
      dto.endTime !== undefined
        ? dto.endTime
        : dto.startTime !== undefined
        ? addMinutesToTime(effectiveStart, org.default_reservation_duration_min || 90)
        : current.end_time;

    // Keep update path validation equivalent to create path.
    if (effectivePartySize > (org.max_party_size || 20)) {
      throw new AppError(`Party size cannot exceed ${org.max_party_size || 20}`, 400);
    }

    const today = getTodayDate();
    if (effectiveDate < today) {
      throw new AppError('Cannot book reservations in the past', 400);
    }

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + (org.max_advance_booking_days || 30));
    const maxDateStr = maxDate.toISOString().split('T')[0];
    if (effectiveDate > maxDateStr) {
      throw new AppError(`Can only book up to ${org.max_advance_booking_days || 30} days in advance`, 400);
    }

    if (timeToMinutes(effectiveStart) < timeToMinutes(org.opening_time)) {
      throw new AppError(`Restaurant does not open until ${org.opening_time}`, 400);
    }
    if (timeToMinutes(effectiveEnd) > timeToMinutes(org.closing_time)) {
      throw new AppError(`Restaurant closes at ${org.closing_time}. Please choose an earlier time.`, 400);
    }

    if (effectiveTableId) {
      const { data: conflicts, error: conflictErr } = await supabaseAdmin
        .from('reservations')
        .select('id, start_time, end_time')
        .eq('table_id', effectiveTableId)
        .eq('reservation_date', effectiveDate)
        .neq('id', reservationId)
        .not('status', 'in', `(${ReservationStatus.CANCELLED},${ReservationStatus.NO_SHOW})`);

      if (conflictErr) throw new AppError('Failed to validate table availability', 500);

      for (const conflict of conflicts || []) {
        if (timeRangesOverlap(effectiveStart, effectiveEnd, conflict.start_time, conflict.end_time)) {
          throw new AppError('Table is no longer available for this time slot', 409);
        }
      }
    }

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

    if (dto.tableId !== undefined) updateData.table_id = dto.tableId;
    if (dto.reservationDate !== undefined) updateData.reservation_date = dto.reservationDate;
    if (dto.startTime !== undefined) updateData.start_time = dto.startTime;
    if (dto.endTime !== undefined || dto.startTime !== undefined) updateData.end_time = effectiveEnd;
    if (dto.partySize !== undefined) updateData.party_size = dto.partySize;
    if (dto.guestFirstName !== undefined) updateData.guest_first_name = dto.guestFirstName;
    if (dto.guestLastName !== undefined) updateData.guest_last_name = dto.guestLastName;
    if (dto.guestEmail !== undefined) updateData.guest_email = dto.guestEmail;
    if (dto.guestPhone !== undefined) updateData.guest_phone = dto.guestPhone;
    if (dto.specialRequests !== undefined) updateData.special_requests = dto.specialRequests;
    if (dto.internalNotes !== undefined) updateData.internal_notes = dto.internalNotes;

    const { data, error } = await supabaseAdmin
      .from('reservations')
      .update(updateData)
      .eq('id', reservationId)
      .eq('restaurant_id', restaurantId)
      .select('*, tables(id, table_number, name, floor_areas(name))')
      .single();

    if (error || !data) throw new NotFoundError('Reservation');

    const formattedRes = this.formatReservation(data);

    // Send modification email asynchronously (do not block the response)
    const guestEmail = data.guest_email;
    if (guestEmail && org?.name) {
      emailService.sendReservationModification({
        to: guestEmail,
        guestName: data.guest_first_name || 'Guest',
        restaurantName: org.name,
        date: data.reservation_date,
        time: data.start_time,
        partySize: data.party_size,
        confirmationId: data.id.split('-')[0].toUpperCase(),
      });
    }

    return formattedRes;
  }

  /**
   * Update reservation status with transition validation.
   */
  async updateStatus(
    reservationId: string,
    restaurantId: string,
    newStatus: ReservationStatus,
    userId?: string,
    reason?: string
  ) {
    // Get current reservation
    const { data: current, error: fetchError } = await supabaseAdmin
      .from('reservations')
      .select('status')
      .eq('id', reservationId)
      .eq('restaurant_id', restaurantId)
      .single();

    if (fetchError || !current) throw new NotFoundError('Reservation');

    // Validate transition
    const validNext = VALID_TRANSITIONS[current.status] || [];
    if (!validNext.includes(newStatus)) {
      throw new AppError(
        `Cannot transition from '${current.status}' to '${newStatus}'`,
        400
      );
    }

    const updateData: Record<string, any> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // Set timestamp fields based on status
    switch (newStatus) {
      case ReservationStatus.CONFIRMED:
        updateData.confirmed_at = new Date().toISOString();
        break;
      case ReservationStatus.SEATED:
        updateData.seated_at = new Date().toISOString();
        break;
      case ReservationStatus.COMPLETED:
        updateData.completed_at = new Date().toISOString();
        break;
      case ReservationStatus.CANCELLED:
        updateData.cancelled_at = new Date().toISOString();
        updateData.cancelled_by = userId || null;
        updateData.cancellation_reason = reason || null;
        break;
    }

    const { data, error } = await supabaseAdmin
      .from('reservations')
      .update(updateData)
      .eq('id', reservationId)
      .eq('restaurant_id', restaurantId)
      .select('*, tables(id, table_number, name, floor_areas(name))')
      .single();

    if (error || !data) throw new AppError('Failed to update status', 500);

    // If completed, update customer visit count
    if (newStatus === ReservationStatus.COMPLETED && data.customer_id) {
      await supabaseAdmin.rpc('increment_customer_visits', {
        p_customer_id: data.customer_id,
        p_restaurant_id: restaurantId,
      });
    }

    if (newStatus === ReservationStatus.CANCELLED && data.guest_email) {
      const { data: org } = await supabaseAdmin
        .from('organizations')
        .select('name')
        .eq('id', restaurantId)
        .single();

      if (org?.name) {
        emailService.sendReservationCancellation({
          to: data.guest_email,
          guestName: data.guest_first_name || 'Guest',
          restaurantName: org.name,
          date: data.reservation_date,
          time: data.start_time,
        }).catch(() => {});
      }
    }

    return this.formatReservation(data);
  }

  /**
   * Cancel a reservation.
   */
  async cancel(reservationId: string, restaurantId: string, userId?: string, reason?: string) {
    return this.updateStatus(
      reservationId,
      restaurantId,
      ReservationStatus.CANCELLED,
      userId,
      reason
    );
  }

  /**
   * Get calendar view data (grouped by table for a specific date).
   */
  async getCalendarView(restaurantId: string, date: string) {
    const { data: reservations, error } = await supabaseAdmin
      .from('reservations')
      .select('*, tables(id, table_number, name, capacity, floor_areas(name))')
      .eq('restaurant_id', restaurantId)
      .eq('reservation_date', date)
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true });

    if (error) throw new AppError('Failed to fetch calendar data', 500);

    // Get all tables for this restaurant
    const { data: tables } = await supabaseAdmin
      .from('tables')
      .select('*, floor_areas(id, name)')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('table_number', { ascending: true });

    // Group reservations by table
    const tableMap: Record<string, any[]> = {};
    for (const table of (tables || [])) {
      tableMap[table.id] = [];
    }

    for (const res of (reservations || [])) {
      if (res.table_id && tableMap[res.table_id]) {
        tableMap[res.table_id].push(this.formatReservation(res));
      }
    }

    // Build sections grouped by area
    const areaMap: Record<string, any[]> = {};
    for (const table of (tables || [])) {
      const areaName = table.floor_areas?.name || 'Unassigned';
      if (!areaMap[areaName]) areaMap[areaName] = [];
      areaMap[areaName].push({
        id: table.id,
        tableNumber: table.table_number,
        name: table.name,
        capacity: table.capacity,
        reservations: tableMap[table.id] || [],
      });
    }

    return {
      date,
      sections: Object.entries(areaMap).map(([area, tables]) => ({
        area,
        tables,
      })),
      totalReservations: (reservations || []).length,
    };
  }

  /**
   * Check availability for a specific table on a date/time.
   */
  async checkTableAvailability(
    tableId: string,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    const { data: conflicts } = await supabaseAdmin
      .from('reservations')
      .select('id, start_time, end_time')
      .eq('table_id', tableId)
      .eq('reservation_date', date)
      .not('status', 'in', `(${ReservationStatus.CANCELLED},${ReservationStatus.NO_SHOW})`);

    if (!conflicts || conflicts.length === 0) return true;

    // Check time overlap
    for (const conflict of conflicts) {
      if (timeRangesOverlap(startTime, endTime, conflict.start_time, conflict.end_time)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get available tables for a date/time/party size.
   */
  async getAvailableTables(
    restaurantId: string,
    date: string,
    startTime: string,
    partySize: number
  ) {
    // Get restaurant settings for duration, hours, and capacity
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('default_reservation_duration_min, opening_time, closing_time, max_party_size')
      .eq('id', restaurantId)
      .single();

    if (!org) throw new AppError('Restaurant not found', 404);

    const duration = org.default_reservation_duration_min || 90;
    const maxParty = org.max_party_size || 20;

    // Validate party size
    if (partySize > maxParty) {
      throw new AppError(`Party size cannot exceed ${maxParty}`, 400);
    }

    // Validate operating hours
    const openTime = org.opening_time;
    const closeTime = org.closing_time;
    
    if (timeToMinutes(startTime) < timeToMinutes(openTime)) {
      throw new AppError(`Restaurant does not open until ${openTime}`, 400);
    }

    let endTime: string;
    try {
      endTime = addMinutesToTime(startTime, duration);
    } catch (error) {
      throw new AppError(`Reservation duration would exceed 24 hours. Please choose an earlier time.`, 400);
    }

    if (timeToMinutes(endTime) > timeToMinutes(closeTime)) {
      throw new AppError(`Restaurant closes at ${closeTime}. Please choose an earlier time.`, 400);
    }

    // Get all active tables with sufficient capacity
    const { data: tables } = await supabaseAdmin
      .from('tables')
      .select('*, floor_areas(id, name)')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .gte('capacity', partySize)
      .order('capacity', { ascending: true });

    if (!tables || tables.length === 0) return [];

    // Check each table for conflicts
    const available = [];
    for (const table of tables) {
      const isAvailable = await this.checkTableAvailability(table.id, date, startTime, endTime);
      if (isAvailable) {
        available.push({
          id: table.id,
          tableNumber: table.table_number,
          name: table.name,
          capacity: table.capacity,
          area: table.floor_areas ? { id: table.floor_areas.id, name: table.floor_areas.name } : null,
          type: table.type,
          shape: table.shape,
        });
      }
    }

    return available;
  }

  /**
   * Export reservations as CSV string for a given restaurant and optional date range.
   */
  async exportCsv(restaurantId: string, startDate?: string, endDate?: string): Promise<string> {
    let query = supabaseAdmin
      .from('reservations')
      .select('*, tables(table_number, name)')
      .eq('restaurant_id', restaurantId)
      .order('reservation_date', { ascending: false })
      .order('start_time', { ascending: true });

    if (startDate) query = query.gte('reservation_date', startDate);
    if (endDate) query = query.lte('reservation_date', endDate);

    const { data, error } = await query;
    if (error) throw new AppError('Failed to export reservations', 500);

    // Build CSV
    const headers = [
      'Date', 'Start Time', 'End Time', 'Party Size',
      'Guest Name', 'Email', 'Phone',
      'Table', 'Status', 'Source', 'Special Requests',
      'Payment Status', 'Created At',
    ];

    const rows = (data || []).map((r: any) => [
      r.reservation_date,
      r.start_time,
      r.end_time,
      r.party_size,
      `${r.guest_first_name || ''} ${r.guest_last_name || ''}`.trim(),
      r.guest_email || '',
      r.guest_phone || '',
      r.tables?.name || r.tables?.table_number || '',
      r.status,
      r.source,
      (r.special_requests || '').replace(/"/g, '""'),
      r.payment_status || 'none',
      r.created_at,
    ]);

    const csvLines = [
      headers.join(','),
      ...rows.map((row: string[]) => row.map((v: string) => `"${v}"`).join(',')),
    ];

    return csvLines.join('\n');
  }

  // ─── Formatter ────────────────────────────────────────

  private formatReservation(row: any) {
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      table: row.tables
        ? {
            id: row.tables.id,
            tableNumber: row.tables.table_number,
            name: row.tables.name,
            area: row.tables.floor_areas?.name || null,
          }
        : null,
      reservationDate: row.reservation_date,
      startTime: row.start_time,
      endTime: row.end_time,
      partySize: row.party_size,
      guestFirstName: row.guest_first_name,
      guestLastName: row.guest_last_name,
      guestEmail: row.guest_email,
      guestPhone: row.guest_phone,
      status: row.status,
      source: row.source,
      specialRequests: row.special_requests,
      internalNotes: row.internal_notes,
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      confirmedAt: row.confirmed_at,
      seatedAt: row.seated_at,
      completedAt: row.completed_at,
      cancelledAt: row.cancelled_at,
      cancellationReason: row.cancellation_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const reservationService = new ReservationService();
