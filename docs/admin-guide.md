# Table Reservation System — Admin Guide

*For restaurant administrators managing system configuration and operations.*

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Initial Setup Wizard](#1-initial-setup-wizard)
3. [Restaurant Configuration](#2-restaurant-configuration)
4. [Staff Management](#3-staff-management)
5. [Table & Floor Plan Management](#4-table--floor-plan-management)
6. [Reservation Policies](#5-reservation-policies)
7. [Dashboard & Analytics](#6-dashboard--analytics)
8. [API Key Management](#7-api-key-management)
9. [Customer Management](#8-customer-management)
10. [Data Export](#9-data-export)

---

## Getting Started

### Creating Your Account

1. Navigate to the **Sign Up** page.
2. Fill in:

   | Field | Required? | Default |
   |-------|:-:|---------|
   | **Business Name** | ✅ | — |
   | **Owner Name** | ✅ | — |
   | **Email Address** | ✅ | — |
   | **Password** | ✅ | — |
   | **Country** | Optional | United Kingdom |
   | **Timezone** | Optional | Europe/London |

3. Click **"Create Account"**.
4. The system automatically:
   - Creates your restaurant organization with a unique URL slug (auto-generated from your business name)
   - Assigns you the **Admin** role
   - Creates your staff member record
5. You will be redirected to the **Setup Wizard**.

> **Note:** The URL slug (e.g., `blackstone`) is used for public API access and cannot be changed after creation.

---

## 1. Initial Setup Wizard

The setup wizard walks you through configuring your restaurant in 4 steps:

### Step 1: Restaurant Details

| Setting | Description |
|---------|-------------|
| **Name** | Restaurant display name |
| **Address** | Physical location |
| **Phone** | Contact number |
| **Email** | Contact email |
| **Opening Time** | Daily opening hour |
| **Closing Time** | Daily closing hour |
| **Country** | Restaurant country |
| **Timezone** | For date/time calculations |

### Step 2: Floor Plan & Tables

- **Create floor areas** — e.g., Main Dining, Patio, Bar, Private Room
- **Add tables** — Set table numbers, capacities, and shapes
- **CSV Import** — Upload a CSV file to bulk-import tables (see [Bulk Import via CSV](#bulk-import-via-csv))
- **Position tables** — Drag-and-drop tables on the interactive floor plan

### Step 3: Reservation Settings

Configure your booking policies:

| Setting | Description | Default |
|---------|-------------|---------|
| Default reservation duration | How long each booking lasts | 90 min |
| Minimum advance booking time | Earliest booking before arrival | 1 hour |
| Maximum advance booking window | Furthest out a guest can book | 30 days |
| Maximum party size | Largest group allowed | 20 |
| Allow walk-ins | Accept unscheduled guests | Off |
| Require payment | Collect payment at booking | Off |
| Cancellation policy | Text shown to guests | — |

### Step 4: Review & Complete

- Review all settings.
- Click **"Complete Setup"** to activate your restaurant.
- Your restaurant is now live and can accept reservations.

> **Tip:** All settings configured in the wizard can be modified later from the admin dashboard.

---

## 2. Restaurant Configuration

Access restaurant settings from **Admin Dashboard → Settings**.

### General Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **Name** | Restaurant display name | *(set during signup)* |
| **Description** | About your restaurant | — |
| **Address** | Physical location | — |
| **Phone** | Contact number | — |
| **Email** | Contact email | — |
| **Opening Time** | Daily opening hour | 17:00 |
| **Closing Time** | Daily closing hour | 22:00 |
| **Currency** | For payment display | GBP |
| **Timezone** | For date/time calculations | Europe/London |

### Reservation Policies

| Setting | Description | Default |
|---------|-------------|---------|
| **Default Duration** | How long a reservation lasts | 90 min |
| **Min Advance Booking** | Earliest booking before arrival | 1 hour |
| **Max Advance Booking** | Furthest out a guest can book | 30 days |
| **Max Party Size** | Largest group allowed | 20 |
| **Allow Walk-Ins** | Accept unscheduled guests | Off |
| **Require Payment** | Collect payment at booking | Off |
| **Cancellation Policy** | Text shown to guests | — |

### Feature Toggles

| Setting | Description | Default |
|---------|-------------|---------|
| **Allow Mergeable Tables** | Enable combining adjacent tables for larger groups | Off |

---

## 3. Staff Management

### Inviting Staff

1. Go to **Admin Dashboard → Staff**.
2. Click **"Invite Staff Member"**.
3. Enter the staff member's:
   - **Name** — Display name
   - **Email Address** — Must be unique within the restaurant
   - **Role** — Choose from: **Admin**, **Manager**, **Host**, **Viewer**
4. Click **"Send Invitation"**.
5. The system creates a pending staff record in the database.

> **Note:** The invitation email is sent to the staff member with a unique link. They can use this link to create their account password and activate their access.

### Role Definitions

| Role | Access Level | Typical Use | Hierarchy Level |
|------|-------------|-------------|:--:|
| **Admin** | Full access to all features | Restaurant owner / general manager | 80 |
| **Manager** | View + create/edit reservations + manage tables | Floor manager / assistant manager | 60 |
| **Host** | View + create/edit reservations | Front desk / hostess | 40 |
| **Viewer** | View-only access | Trainee / observer | 20 |

> Higher-level roles inherit all permissions of lower-level roles.

### Managing Staff

| Action | Description |
|--------|-------------|
| **Update Role** | Change a staff member's role as responsibilities change |
| **Update Details** | Edit name and phone number |
| **Deactivate** | Remove access (soft-delete — account is deactivated, not permanently deleted) |
| **Search** | Find staff by name, email, or phone |

> **Important:** You cannot deactivate your own admin account. At least one admin must remain active.

---

## 4. Table & Floor Plan Management

### Managing Floor Areas

1. Go to **Tables → Areas**.
2. Create areas representing physical sections of your restaurant (e.g., "Main Dining", "Patio", "Bar").
3. Set **display order** to control how areas appear in the UI.

### Managing Tables

For each table, configure:

| Property | Required? | Description |
|----------|:-:|-------------|
| **Table Number** | ✅ | Unique identifier (e.g., "T1", "#5") |
| **Name** | Auto | Display label (auto-generated as "Table [number]") |
| **Capacity** | ✅ | Maximum seats |
| **Min Capacity** | Optional | Minimum seats (default: 1) |
| **Shape** | Optional | Rectangle, Round, or Square (affects floor plan visual) |
| **Type** | Optional | Custom label (e.g., "Booth", "High-Top", "Standard") |
| **Mergeable** | Optional | Whether this table can be combined with others |
| **Area** | ✅ | Which floor area it belongs to |

### Bulk Import via CSV

1. Go to **Tables → Import**.
2. Upload a CSV file with the following columns:

   | Column | Required? | Notes |
   |--------|:-:|-------|
   | `tableNumber` | ✅ | Unique table number |
   | `capacity` | ✅ | Maximum seats |
   | `area` | ✅ | Floor area name — auto-created if it doesn't exist |
   | `type` | Optional | Table type label |

3. Click **"Import"**.
4. **Existing tables** with matching numbers are updated; new ones are created.

### Interactive Floor Plan

- **Drag-and-drop** tables to position them on the floor plan.
- **Three view modes**:
  - **Standard** — Default view with all tables
  - **Split** — Tables separated by floor area
  - **Merged** — Shows merged table configurations
- Positions are saved automatically via batch position update.
- Table shapes and sizes are visually represented.

---

## 5. Reservation Policies

### Overbooking Prevention

The system uses **atomic database-level locking** to prevent double-bookings:

1. When a table is booked, the system locks the table row in the database using `SELECT ... FOR UPDATE`.
2. Concurrent booking attempts for the same table/time are queued.
3. If a conflict exists after acquiring the lock, the request is rejected with a clear error message.
4. This is implemented via a PostgreSQL stored procedure (`create_reservation_atomic`).

> **Result:** Even if two guests select the same table at the exact same moment, only one booking will succeed. The other guest receives an immediate notification that the table is no longer available.

### Cancellation Handling

| Feature | Details |
|---------|---------|
| Staff cancellation | Staff can cancel with an optional reason |
| Customer self-cancel | Logged-in customers can cancel from their dashboard |
| Table release | Cancelled reservations free the table immediately |
| Audit trail | Cancellation timestamps, reasons, and who cancelled are recorded |

### No-Show Tracking

- Staff can mark confirmed reservations as "No-Show"
- No-show history is tracked per customer
- Customer visit counts reflect only **completed** visits (no-shows are excluded)

---

## 6. Dashboard & Analytics

### Admin Dashboard *(Admin / Manager roles)*

The dashboard provides at-a-glance operational metrics:

| Metric | Description |
|--------|-------------|
| **Today's Reservations** | Count of bookings for the current day |
| **Today's Covers** | Total guest count for today |
| **Currently Seated** | Active diners right now |
| **Waiting List Count** | Active queue entries |
| **All-Time Reservations** | Historical total |
| **Active Tables** | Tables in service |
| **Upcoming Reservations** | Next 7 days |

### Status Breakdown

A summary of today's reservations grouped by status (Pending, Confirmed, Arriving, Seated, Completed, Cancelled, No-Show).

### Recent Reservations

Quick view of the 5 most recent reservations with guest name, party size, date, time, status, and table assignment.

### Weekly Trend

A 7-day trend showing reservation volume per day (excluding cancellations and no-shows).

---

## 7. API Key Management

API keys allow the restaurant's website or POS system to integrate with the reservation system.

### Creating an API Key

1. Go to **Settings → API Keys**.
2. Click **"Generate New Key"**.
3. Set a **name** (e.g., "Website Widget", "POS Terminal").
4. The key is generated and displayed **once** — copy and save it securely.
5. The key prefix is stored for identification; the full key is hashed for security.

> **Security Warning:** API keys cannot be retrieved after creation. If you lose a key, you must generate a new one and update your integrations.

### API Key Permissions

Default permissions for API keys:
- `reservations.read` — View reservations
- `reservations.create` — Create new reservations

### Managing Keys

| Action | Description |
|--------|-------------|
| **Deactivate** | Disable a key without deleting it |
| **Delete** | Permanently remove a key |
| **Last Used** | Track when each key was last used |
| **Expiry** | Set an optional expiration date |

---

## 8. Customer Management

### Customer Database

The system automatically builds a customer database from reservation data. When a guest makes a reservation, the system either:
- **Links** to an existing customer record (matched by email address), or
- **Creates** a new customer record

### Customer Record Details

| Field | Description |
|-------|-------------|
| **Name** | Customer's full name |
| **Email** | Email address |
| **Phone** | Phone number |
| **VIP Status** | Flagged VIP customers |
| **Total Visits** | Completed visits (per restaurant and global) |
| **Last Visit** | Most recent visit date at your location |
| **Staff Notes** | Internal notes specific to your restaurant |
| **Blacklist Status** | Whether the customer is blocked from booking |

### Customer-Restaurant Relationship

Customers are linked to your restaurant via a relationship tracking:
- Per-restaurant visit count
- Last visit date at your specific location
- Internal notes specific to your restaurant
- Blacklist status (per-restaurant)

---

## 9. Data Export

### Reservation CSV Export

1. Navigate to **Reservations → Export**.
2. Set optional **start date** and **end date** filters.
3. Click **"Export CSV"**.
4. A CSV file downloads with the following columns:

| Column | Description |
|--------|-------------|
| Date | Reservation date |
| Start Time | Check-in time |
| End Time | Expected departure |
| Party Size | Number of guests |
| Guest Name | Full name |
| Email | Guest email |
| Phone | Guest phone |
| Table | Assigned table |
| Status | Current status |
| Source | Booking source |
| Special Requests | Guest notes |
| Payment Status | Payment state |
| Created At | When the booking was made |

> **Access:** Manager role or higher required for CSV export.

---

*Last updated: March 2026*
