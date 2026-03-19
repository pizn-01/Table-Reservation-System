# Table Reservation System — Restaurant Staff Guide

*For restaurant staff using the POS system and staff dashboard.*

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Staff Login](#1-staff-login)
3. [Staff Dashboard Overview](#2-staff-dashboard-overview)
4. [Creating Reservations (Staff-Initiated)](#3-creating-reservations)
5. [Viewing Incoming Reservations](#4-viewing-incoming-reservations)
6. [Managing Reservation Status](#5-managing-reservation-status)
7. [Table Management](#6-table-management)
8. [Waiting List](#7-waiting-list)
9. [Customer Records](#8-customer-records)
10. [Quick Reference](#9-quick-reference)

---

## Getting Started

### Staff Roles & Permissions

Your access level depends on your assigned role:

| Role | View Reservations | Create/Edit Reservations | Manage Tables | Manage Staff |
|------|:-:|:-:|:-:|:-:|
| **Viewer** | ✅ | ❌ | ❌ | ❌ |
| **Host** | ✅ | ✅ | ❌ | ❌ |
| **Manager** | ✅ | ✅ | ✅ (create/edit) | ❌ |
| **Admin** | ✅ | ✅ | ✅ (full control) | ✅ |

### Accepting Your Invitation

1. You will receive an **invitation email** from the restaurant administrator.
2. Click **"Accept Invitation"** in the email.
3. You will be taken to an account setup page. Set your:
   - **Name** — Your display name
   - **Password** — A secure password for your account
4. Click **"Create Account"**.
5. You will be logged in automatically and taken to the staff dashboard.

> **Note:** The invitation link can only be used once. If you have trouble accepting, contact your administrator.

---

## 1. Staff Login

1. Navigate to the **Staff Login** page (e.g., `yoursite.com/staff-login`).
2. Enter your **email address** and **password**.
3. Click **"Sign In"**.
4. Upon successful login, you will be directed to the staff dashboard.

> **Forgot your password?** Click "Forgot Password?" on the login page. A reset link will be sent to your registered email.

---

## 2. Staff Dashboard Overview

After logging in, the dashboard displays key operational information at a glance:

### Today's Summary

| Metric | Description |
|--------|-------------|
| **Today's Reservations** | Total bookings for the current day |
| **Covers** | Total guest count across all today's active bookings |
| **Currently Seated** | Number of guests currently at tables |
| **Waiting List** | Active entries on the waiting list |

### Reservation Status Breakdown

Today's reservations are grouped by status:

| Status | Description | Color |
|--------|-------------|-------|
| **Pending** | Awaiting confirmation | Yellow |
| **Confirmed** | Ready for the guest's arrival | Blue |
| **Arriving** | Guest is on their way or at the door | Orange |
| **Seated** | Guest is at the table | Green |
| **Completed** | Visit finished | Grey |
| **Cancelled** | Booking was cancelled | Red |
| **No-Show** | Guest did not arrive | Dark Red |

### Quick Stats

- **All-Time Reservations** — Total reservations ever made at this restaurant
- **Active Tables** — Number of tables currently available in the system
- **Upcoming Reservations** — Bookings in the next 7 days

### Recent Reservations

The dashboard shows the **5 most recent** reservations with guest name, party size, date, time, status, and table assignment for quick reference.

### Weekly Trend

A 7-day trend chart shows reservation volume per day, excluding cancellations and no-shows.

---

## 3. Creating Reservations

Staff members with **Host** role or higher can create reservations on behalf of guests (walk-ins, phone calls, POS entries).

### Step-by-Step

1. Navigate to **Reservations** and click **"New Reservation"**.
2. Fill in the reservation details:

   | Field | Required? | Notes |
   |-------|:-:|-------|
   | **Date** | ✅ | The reservation date |
   | **Start Time** | ✅ | When the guest arrives |
   | **End Time** | Optional | Auto-calculated from default duration (default: 90 min) |
   | **Party Size** | ✅ | Number of guests (max defined in restaurant settings) |
   | **Table** | Optional | Select a specific table, or leave blank for auto-assignment |

3. Enter guest information:

   | Field | Required? | Notes |
   |-------|:-:|-------|
   | **First Name** | ✅ | Guest's first name |
   | **Last Name** | Optional | Guest's surname |
   | **Email** | ✅ | Confirmation email will be sent automatically |
   | **Phone** | Optional | Contact number |
   | **Special Requests** | Optional | Dietary needs, celebrations, accessibility |

4. Set the **Source** to indicate how the reservation was made:

   | Source | When to Use |
   |--------|-------------|
   | `POS` | Created at the point-of-sale terminal |
   | `Phone` | Taken over the phone |
   | `Walk-in` | Guest walked in without prior booking |
   | `Website` | Auto-set for online bookings (read-only) |

5. Click **"Create Reservation"**.

### What Happens Automatically

- ✅ The system checks for table conflicts (time overlap) and **blocks double-bookings**.
- ✅ A **confirmation email** is sent to the guest's email address.
- ✅ The reservation appears in the calendar view and reservation list.
- ✅ A **customer record** is automatically created or linked for the guest.
- ✅ The customer-restaurant relationship is established for visit tracking.

---

## 4. Viewing Incoming Reservations

### Reservation List View

Access all reservations from the **Reservations** section. You can:

| Action | Description |
|--------|-------------|
| **Filter by date** | View reservations for a specific day |
| **Filter by status** | Show only Confirmed, Pending, etc. |
| **Filter by table** | View bookings for a specific table |
| **Search** | Find by guest name, email, or phone |
| **Sort** | By time, date, or status (ascending/descending) |

### Calendar View

The calendar view shows all reservations grouped by table and floor area for a specific date:

- Each **row** represents a table
- **Reservation blocks** show the time range and guest name
- Blocks are **color-coded by status** for quick identification
- Tables are **grouped by floor area** (e.g., Main Dining, Patio)
- **Cancelled** reservations are excluded from the calendar view

### Reservation Details

Click any reservation to view full details:

- Guest name, email, phone
- Date, time, duration, party size
- Table assignment and floor area
- Status and status history timestamps
- Special requests
- Internal notes (staff-only — never visible to guests)
- Payment method and status
- Source (website, POS, phone, walk-in)
- Creation and last update timestamps

---

## 5. Managing Reservation Status

### Status Flow

Reservations follow a defined lifecycle:

```
Pending → Confirmed → Arriving → Seated → Completed
              ↓           ↓
          Cancelled    No-Show
```

### Valid Status Transitions

| Current Status | Can Transition To |
|---------------|-------------------|
| **Pending** | Confirmed, Cancelled |
| **Confirmed** | Arriving, Seated, Cancelled, No-Show |
| **Arriving** | Seated, Cancelled, No-Show |
| **Seated** | Completed |
| **Completed** | *(terminal — no further changes)* |
| **Cancelled** | *(terminal)* |
| **No-Show** | *(terminal)* |

> **Important:** Invalid status transitions (e.g., Completed → Cancelled) are blocked by the system and will return an error.

### Updating Status

1. Open the reservation details.
2. Click the appropriate status action button (e.g., **"Confirm"**, **"Seat"**, **"Complete"**).
3. The system records the transition timestamp automatically:
   - **Confirmed** → records `confirmedAt`
   - **Seated** → records `seatedAt`
   - **Completed** → records `completedAt` and increments the customer's visit count
   - **Cancelled** → records `cancelledAt`, `cancelledBy`, and optional reason

### Cancelling a Reservation

1. Open the reservation and click **"Cancel"**.
2. Optionally provide a **cancellation reason**.
3. The system records who cancelled and when.
4. The table is freed immediately for other bookings.

### Handling No-Shows

1. If a guest does not arrive for their confirmed reservation, open the reservation.
2. Click **"Mark as No-Show"**.
3. The reservation is recorded as a no-show for tracking purposes.
4. No-show history is tracked per customer and visible in their customer record.

### Modifying a Reservation

1. Open the reservation and click **"Edit"**.
2. Modify any field: date, time, party size, table, guest details, special requests, or internal notes.
3. Save changes.

> **Note:** Only staff with **Host** role or higher can make changes. Table conflict detection does not currently apply to modifications — verify availability manually when moving reservations.

---

## 6. Table Management

### Viewing Tables

Navigate to **Staff → Tables** to view all tables. The view includes:

- **Interactive floor plan** — Visual representation of the restaurant layout
- Tables displayed with their number, name, capacity, and current status
- Tables grouped by floor area
- Three view modes: **Standard**, **Split**, **Merged**

### Table Properties

Each table has the following properties:

| Property | Description |
|----------|-------------|
| **Table Number** | Unique identifier (e.g., "T1", "#5") |
| **Name** | Display label (auto-generated as "Table [number]") |
| **Capacity** | Maximum seats |
| **Min Capacity** | Minimum seats (default: 1) |
| **Shape** | Rectangle, Round, or Square (affects floor plan display) |
| **Type** | Custom label (e.g., "Booth", "High-Top", "Standard") |
| **Mergeable** | Whether this table can be combined with adjacent tables |
| **Area** | Which floor area it belongs to |

### Table Actions *(Manager or Admin role required)*

| Action | Description |
|--------|-------------|
| **Add Table** | Create a new table with number, capacity, shape, and area assignment |
| **Edit Table** | Modify table properties (name, capacity, shape, area) |
| **Delete Table** | Soft-delete — deactivates the table without removing data |
| **Drag & Drop** | Reposition tables on the floor plan to match the physical layout |

### Floor Areas

Tables are organized into floor areas (e.g., Main Dining, Patio, Bar, Private Room).

| Action | Required Role |
|--------|:--:|
| **Create Area** | Manager+ |
| **Edit Area** | Manager+ |
| **Delete Area** | Admin only |

### Checking Table Availability

Use the **Availability** check to see which tables are free for a given date, time, and party size. This is useful for:
- Walk-in guests asking about availability
- Phone inquiries about open tables
- Overriding the online booking system for VIP arrangements

---

## 7. Waiting List

When all tables are booked, add guests to the waiting list.

### Adding to the Waiting List

1. Navigate to the **Waiting List** section.
2. Click **"Add to Waiting List"**.
3. Fill in:

   | Field | Required? | Notes |
   |-------|:-:|-------|
   | **Customer Name** | ✅ | Guest's name |
   | **Phone / Email** | Optional | Contact details |
   | **Party Size** | ✅ | Number of guests |
   | **Requested Date** | ✅ | When they want to dine |
   | **Requested Time** | Optional | Preferred time slot |
   | **Preferred Area** | Optional | e.g., "Patio", "Window" |
   | **Notes** | Optional | Any special requirements |

4. Click **"Add"**.
5. The guest is assigned a **queue position** automatically.

### Managing the Waiting List

| Action | Description |
|--------|-------------|
| **Notify** | Mark the guest as notified (a table may be available) |
| **Seat** | Guest has been seated — removes from active wait list |
| **Expire** | Guest left or no longer waiting |
| **Remove** | Delete the entry entirely |

> Queue positions are automatically recalculated when entries are seated, expired, or removed.

---

## 8. Customer Records

The system automatically creates and links customer records when reservations are made.

### Viewing Customer Information

Navigate to **Customers** to see all customers who have visited the restaurant:

| Field | Description |
|-------|-------------|
| **Name** | Customer's full name |
| **Email** | Email address |
| **Phone** | Phone number |
| **VIP Status** | Whether the customer is flagged as VIP |
| **Total Visits** | Number of completed visits |
| **Last Visit** | Date of most recent completed reservation |
| **Notes** | Staff-only internal notes |

### Customer Search

Search for customers by **name**, **email**, or **phone number**.

### Blacklisting

Restaurant administrators can blacklist customers who should not be able to book. Blacklisted customers are hidden from the default customer list view.

---

## 9. Quick Reference

### Tips & Shortcuts

- **Refresh data:** The dashboard auto-refreshes, but you can manually reload the page.
- **CSV Export:** Managers can export reservation data as CSV from the Reservations section. Filter by date range before exporting.
- **Internal Notes:** Use the internal notes field on reservations to communicate between staff shifts. These notes are **never visible to guests**.
- **Customer Records:** Customer records are created automatically when reservations are made. You don't need to manually create them.

### Common Workflows

| Scenario | Steps |
|----------|-------|
| **Walk-in guest** | Create reservation → Set source to "Walk-in" → Select available table → Set status to "Seated" |
| **Phone booking** | Create reservation → Set source to "Phone" → Confirm details |
| **No table available** | Add to waiting list → Notify when table opens → Seat guest |
| **Guest wants to cancel** | Find reservation → Click "Cancel" → Enter reason |
| **Guest didn't show up** | Find reservation → Click "Mark as No-Show" |

---

*Last updated: March 2026*
