# Table Reservation System — Super Admin Guide

*For system administrators managing the multi-restaurant platform infrastructure.*

---

## Table of Contents

1. [Overview](#overview)
2. [Access & Authentication](#1-access--authentication)
3. [Platform Dashboard](#2-platform-dashboard)
4. [Restaurant Account Management](#3-restaurant-account-management)
5. [User Account Management](#4-user-account-management)
6. [Platform Settings](#5-platform-settings)
7. [Audit Log](#6-audit-log)
8. [System Architecture](#7-system-architecture)
9. [Deployment & Infrastructure](#8-deployment--infrastructure)

---

## Overview

The Super Admin role provides god-level access to the entire platform. Super Admins can manage all restaurants, users, and system-level settings. This role is restricted to the engineering/operations team.

**Super Admin privileges:**
- Bypasses all RBAC restrictions (role level: 100)
- Can access any restaurant's data regardless of staff membership
- Can create, modify, and deactivate any organization
- Has full access to all API endpoints
- Can view and modify platform-wide settings

---

## 1. Access & Authentication

### Login

1. Navigate to the standard **Login** page.
2. Enter your super admin email and password.
3. The system identifies your account from the `super_admins` table and issues a JWT with `role: super_admin`.
4. You are directed to the admin interface.

### Account Setup

Super Admin accounts are created directly in the database:

```sql
-- 1. Create auth user in Supabase
-- 2. Insert into super_admins table:
INSERT INTO super_admins (user_id, name, email, permissions)
VALUES ('<auth-user-uuid>', 'Admin Name', 'admin@example.com', '["*"]');
```

> **Security:** There is no self-registration path for super admins. Accounts must be provisioned via direct database access.

### Token & Session

- JWT tokens include `role: super_admin` without a `restaurantId`.
- Refresh tokens are supported via `POST /api/v1/auth/refresh`.
- Token expiry follows standard platform configuration.

---

## 2. Platform Dashboard

### Platform Statistics

Access via `GET /api/v1/admin/stats`. Returns:

| Metric | Description |
|--------|-------------|
| **Total Restaurants** | All organizations on the platform |
| **Active Restaurants** | Organizations with `is_active = true` |
| **Total Users** | All staff members across all restaurants |
| **Total Reservations** | All-time reservation count platform-wide |
| **Top Restaurants** | 10 most recently created active restaurants |

---

## 3. Restaurant Account Management

### Listing All Restaurants

`GET /api/v1/admin/organizations?page=1&limit=20&search=keyword`

Returns paginated list of all organizations with:
- ID, name, slug, owner
- Country, timezone, address
- Opening/closing hours
- Setup status (completed/in-progress, current step)
- Active/inactive status
- Creation and last update timestamps

### Viewing Restaurant Details

`GET /api/v1/admin/organizations/:id`

Returns full organization profile plus aggregated counts:
- **Staff count** — Active staff members
- **Table count** — Active tables
- **Reservation count** — Total reservations

### Modifying Restaurant Settings

`PUT /api/v1/admin/organizations/:id`

Any organization field can be updated by super admin, including:
- Name, description, address, phone, email
- Opening/closing hours, timezone
- Reservation policies (duration, advance booking, party size)
- Feature toggles (walk-ins, mergeable tables, payment requirement)

All changes are logged in the **audit log**.

### Activating / Deactivating Restaurants

`PATCH /api/v1/admin/organizations/:id/status`

```json
{ "isActive": false }
```

- **Deactivation:** The restaurant becomes invisible to public API consumers. Existing staff can no longer log in. Existing reservations are not affected.
- **Activation:** Restores full access.
- All status changes are audit-logged.

---

## 4. User Account Management

### Listing All Users

`GET /api/v1/admin/users?page=1&limit=20&search=keyword`

Returns all staff members across all restaurants:
- ID, name, email
- Role
- Active status
- Associated restaurant (name, slug)
- Last active timestamp
- Creation date

### Cross-Restaurant Access

As a super admin, you can access any restaurant's protected endpoints by including the `orgId` in the URL:

```
GET /api/v1/organizations/:orgId/reservations
GET /api/v1/organizations/:orgId/tables
GET /api/v1/organizations/:orgId/staff
GET /api/v1/organizations/:orgId/dashboard
```

The RBAC middleware recognizes the `super_admin` role and grants access without checking restaurant membership.

---

## 5. Platform Settings

### Viewing Settings

`GET /api/v1/admin/settings`

Returns all key-value pairs from the `platform_settings` table.

### Updating Settings

`PUT /api/v1/admin/settings/:key`

```json
{ "value": { "maxRestaurants": 100, "signupEnabled": true } }
```

Settings are stored as JSONB and can hold any structure. Changes are audit-logged.

---

## 6. Audit Log

### Viewing the Audit Log

`GET /api/v1/admin/audit-log?page=1&limit=50&restaurantId=xxx&entityType=organization&action=updated&userId=xxx`

Each audit entry records:

| Field | Description |
|-------|-------------|
| **action** | What happened (e.g., `organization.updated_by_admin`, `platform_settings.updated`, `organization.activated`) |
| **entityType** | What entity was affected (organization, platform_settings, etc.) |
| **entityId** | ID of the affected entity |
| **userId** | Who performed the action |
| **restaurantId** | Which restaurant was affected (if applicable) |
| **changes** | JSON diff showing before/after state |
| **ipAddress** | Request source IP |
| **userAgent** | Client user-agent string |
| **createdAt** | When the action occurred |

### Audit Coverage

The following actions are automatically logged:
- Organization settings changes by super admin
- Organization activation/deactivation
- Platform settings modifications

---

## 7. System Architecture

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth + custom JWT |
| **Email** | Resend (pluggable provider interface) |
| **Hosting** | Vercel (frontend) + Fly.io (backend) |

### Database Tables

| Table | Purpose |
|-------|---------|
| `organizations` | Restaurant accounts and settings |
| `staff_members` | Staff users linked to restaurants |
| `customers` | Customer profiles |
| `customer_restaurant_link` | Per-restaurant customer relationship data |
| `tables` | Table inventory with floor plan positions |
| `floor_areas` | Restaurant floor sections |
| `reservations` | All booking records |
| `waiting_list` | Queue management |
| `api_keys` | Restaurant API keys |
| `super_admins` | Platform super admin accounts |
| `platform_settings` | Global configuration |
| `audit_log` | Change tracking |
| `email_templates` | Custom email templates (future) |

### API Structure

All endpoints are prefixed with `/api/v1`:

| Prefix | Scope | Auth |
|--------|-------|------|
| `/auth/*` | Authentication | Public (rate-limited) |
| `/public/:slug/*` | Guest-facing | Public (rate-limited) |
| `/organizations/:orgId/*` | Restaurant-scoped | JWT + RBAC |
| `/admin/*` | Platform management | Super Admin only |
| `/customers/*` | Customer self-service | JWT (customer) |

### Rate Limiting

| Endpoint Group | Limit |
|---------------|-------|
| General API | Configurable via `rateLimiter.ts` |
| Auth endpoints | Strict (prevent brute-force) |
| Public API | Strict (prevent abuse) |

---

## 8. Deployment & Infrastructure

### Backend Deployment (Fly.io)

Configuration in `fly.toml`:
- Dockerfile-based deployment
- Environment variables set via Fly.io secrets

### Frontend Deployment (Vercel)

Configuration in `vercel.json`:
- SPA routing (all paths → `index.html`)
- Auto-deploy from Git

### Environment Variables

**Backend (`backend/.env`):**
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (bypasses RLS)
- `JWT_SECRET` — Secret for signing JWTs
- `CORS_ORIGINS` — Comma-separated allowed origins
- `RESEND_API_KEY` — Email provider API key
- `RESEND_TEST_EMAIL` — Sandbox mode test email
- `NODE_ENV` — Environment (development/production)
- `PORT` — Server port (default: 3001)

**Frontend (`.env`):**
- `VITE_API_URL` — Backend API URL

### Database Migrations

Migrations are in `backend/migrations/`:
1. `001_initial_schema.sql` — All tables, indexes, RLS policies, and utility functions
2. `002_atomic_reservation_rpc.sql` — Stored procedure for concurrent-safe reservation creation

Run migrations via the Supabase SQL Editor.

### Monitoring

- **Health Check:** `GET /health` returns uptime, environment, and timestamp
- **Error Handling:** Global error handler with structured error responses
- **Logging:** Morgan HTTP request logging in development mode

---

*Last updated: March 2026*
