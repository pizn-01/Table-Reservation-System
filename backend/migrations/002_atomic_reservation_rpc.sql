-- ============================================================
-- Migration: Atomic Reservation Creation
-- Description: Creates a Postgres RPC to safely create reservations
--              using row-level locking (FOR UPDATE) to prevent 
--              concurrent double-booking of the same table.
-- ============================================================

CREATE OR REPLACE FUNCTION create_reservation_atomic(
    p_restaurant_id UUID,
    p_table_id UUID,
    p_customer_id UUID,
    p_reservation_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_party_size INT,
    p_guest_first_name VARCHAR,
    p_guest_last_name VARCHAR,
    p_guest_email VARCHAR,
    p_guest_phone VARCHAR,
    p_source reservation_source,
    p_special_requests TEXT,
    p_created_by UUID
) RETURNS JSONB AS $$
DECLARE
    v_conflict_count INT;
    v_reservation_id UUID;
    v_result JSONB;
BEGIN
    -- 1. Lock the table row to prevent concurrent booking for the exact same table
    -- If multiple requests try to book this table simultaneously, they will queue here.
    IF p_table_id IS NOT NULL THEN
        PERFORM id FROM tables 
        WHERE id = p_table_id AND restaurant_id = p_restaurant_id 
        FOR UPDATE;

        -- 2. Check for overlapping reservations for this table
        SELECT COUNT(*) INTO v_conflict_count
        FROM reservations
        WHERE table_id = p_table_id
          AND reservation_date = p_reservation_date
          AND status NOT IN ('cancelled', 'no_show')
          AND (
              (p_start_time < end_time AND p_end_time > start_time)
          );

        IF v_conflict_count > 0 THEN
            RAISE EXCEPTION 'Table is no longer available for this time slot';
        END IF;
    END IF;

    -- 3. Insert the reservation safely
    INSERT INTO reservations (
        restaurant_id, table_id, customer_id, reservation_date, 
        start_time, end_time, party_size, guest_first_name, 
        guest_last_name, guest_email, guest_phone, status, 
        source, special_requests, payment_status, confirmed_at, created_by
    ) VALUES (
        p_restaurant_id, p_table_id, p_customer_id, p_reservation_date,
        p_start_time, p_end_time, p_party_size, p_guest_first_name,
        p_guest_last_name, p_guest_email, p_guest_phone, 'confirmed',
        p_source, p_special_requests, 'bypassed', NOW(), p_created_by
    ) RETURNING id INTO v_reservation_id;

    -- Return the inserted ID
    SELECT jsonb_build_object('id', v_reservation_id) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
