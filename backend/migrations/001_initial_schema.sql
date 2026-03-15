-- ============================================================
-- Table Reservation System — Initial Schema Migration
-- Database: Supabase PostgreSQL
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Organizations ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    owner_id UUID REFERENCES auth.users(id),
    logo_url TEXT,
    country VARCHAR(100) DEFAULT 'United Kingdom',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Europe/London',
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    opening_time TIME NOT NULL DEFAULT '17:00',
    closing_time TIME NOT NULL DEFAULT '22:00',
    currency VARCHAR(10) DEFAULT 'GBP',
    allow_mergeable_tables BOOLEAN DEFAULT FALSE,
    allow_walk_ins BOOLEAN DEFAULT FALSE,
    default_reservation_duration_min INT DEFAULT 90,
    min_advance_booking_hours INT DEFAULT 1,
    max_advance_booking_days INT DEFAULT 30,
    max_party_size INT DEFAULT 20,
    require_payment BOOLEAN DEFAULT FALSE,
    cancellation_policy TEXT,
    setup_completed BOOLEAN DEFAULT FALSE,
    setup_step INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Floor Areas ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS floor_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Tables ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    area_id UUID REFERENCES floor_areas(id) ON DELETE SET NULL,
    table_number VARCHAR(20) NOT NULL,
    name VARCHAR(50),
    capacity INT NOT NULL DEFAULT 2,
    min_capacity INT DEFAULT 1,
    shape VARCHAR(20) DEFAULT 'rectangle',
    type VARCHAR(50),
    is_mergeable BOOLEAN DEFAULT FALSE,
    position_x FLOAT,
    position_y FLOAT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, table_number)
);

-- ─── Staff Members ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS staff_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    restaurant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'host',
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, email)
);

-- ─── Customers ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    notes TEXT,
    is_vip BOOLEAN DEFAULT FALSE,
    total_visits INT DEFAULT 0,
    last_visit_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Customer-Restaurant Link ───────────────────────────

CREATE TABLE IF NOT EXISTS customer_restaurant_link (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    total_visits INT DEFAULT 0,
    last_visit_at TIMESTAMPTZ,
    notes TEXT,
    is_blacklisted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id, restaurant_id)
);

-- ─── Enums ──────────────────────────────────────────────

DO $$ BEGIN
    CREATE TYPE reservation_status AS ENUM (
        'pending', 'confirmed', 'arriving', 'seated',
        'completed', 'cancelled', 'no_show'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reservation_source AS ENUM (
        'website', 'app', 'pos', 'phone', 'walk_in', 'third_party'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ─── Reservations ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    party_size INT NOT NULL DEFAULT 2,
    guest_first_name VARCHAR(100),
    guest_last_name VARCHAR(100),
    guest_email VARCHAR(255),
    guest_phone VARCHAR(50),
    status reservation_status NOT NULL DEFAULT 'pending',
    source reservation_source NOT NULL DEFAULT 'app',
    special_requests TEXT,
    internal_notes TEXT,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'none',
    payment_amount DECIMAL(10, 2),
    confirmed_at TIMESTAMPTZ,
    seated_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES auth.users(id),
    cancellation_reason TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Waiting List ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS waiting_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    customer_email VARCHAR(255),
    party_size INT NOT NULL DEFAULT 2,
    requested_date DATE NOT NULL,
    requested_time TIME,
    preferred_area VARCHAR(50),
    status VARCHAR(20) DEFAULT 'waiting',
    position INT,
    estimated_wait_min INT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Platform / Super Admin Tables ──────────────────────

CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS super_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    permissions JSONB DEFAULT '["*"]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Audit Log ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── API Keys ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(10) NOT NULL,
    permissions JSONB DEFAULT '["reservations.read", "reservations.create"]',
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Email Templates ────────────────────────────────────

CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    template_type VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    variables JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_reservations_restaurant_date ON reservations(restaurant_id, reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_table ON reservations(table_id, reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_customer ON reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_tables_restaurant ON tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_staff_restaurant ON staff_members(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_audit_restaurant ON audit_log(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_waiting_list_restaurant ON waiting_list(restaurant_id, requested_date);
CREATE INDEX IF NOT EXISTS idx_floor_areas_restaurant ON floor_areas(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customer_restaurant ON customer_restaurant_link(customer_id, restaurant_id);

-- ─── Functions ──────────────────────────────────────────

-- Function to increment customer visit count
CREATE OR REPLACE FUNCTION increment_customer_visits(
    p_customer_id UUID,
    p_restaurant_id UUID
) RETURNS VOID AS $$
BEGIN
    -- Update global customer stats
    UPDATE customers
    SET total_visits = total_visits + 1,
        last_visit_at = NOW(),
        updated_at = NOW()
    WHERE id = p_customer_id;

    -- Update restaurant-specific link
    UPDATE customer_restaurant_link
    SET total_visits = total_visits + 1,
        last_visit_at = NOW()
    WHERE customer_id = p_customer_id
      AND restaurant_id = p_restaurant_id;
END;
$$ LANGUAGE plpgsql;

-- ─── Row Level Security ─────────────────────────────────

-- Enable RLS on key tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE floor_areas ENABLE ROW LEVEL SECURITY;

-- Note: Since we use the service_role key in the backend,
-- RLS is bypassed for server-side operations. These policies
-- are for future direct-client access if needed.

-- Allow service role full access (backend uses service_role key)
-- No additional policies needed for server-side access.
