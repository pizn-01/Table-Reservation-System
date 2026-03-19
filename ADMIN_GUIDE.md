# GUIDE 1: Administrator & Restaurant Owner Guide

## Welcome to the Table Reservation System

This guide helps restaurant owners and managers set up and manage the reservation system for your establishment.

---

## TABLE OF CONTENTS
1. [Initial Setup](#initial-setup)
2. [Restaurant Configuration](#restaurant-configuration)
3. [Floor Plan & Table Management](#floor-plan--table-management)
4. [Staff Team Management](#staff-team-management)
5. [Dashboard & Monitoring](#dashboard--monitoring)
6. [Managing Reservations](#managing-reservations)
7. [Troubleshooting](#troubleshooting)

---

## INITIAL SETUP

### Step 1: Create Your Account

1. Visit `https://table-reservation-system.vercel.app/signup`
2. Enter your email address and create a strong password
3. You will receive a confirmation email — click the link to verify
4. Log in with your credentials

### Step 2: Complete the Setup Wizard

After logging in, you'll see the **Setup Wizard** with 4 steps:

#### Step 1: Restaurant Details
- **Restaurant Name:** Legal name of your establishment
- **Address:** Full street address
- **Phone:** Customer contact number
- **Opening Time:** When your restaurant opens (e.g., 5:00 PM)
- **Closing Time:** When your restaurant closes (e.g., 10:00 PM)
- **Maximum Party Size:** Largest reservation you accept (e.g., 20 guests)

Click "Continue" when complete.

#### Step 2: Floor Plan
You have two options:

**Option A: Upload CSV File (Recommended)**
1. Prepare a CSV file with columns: `table_number,name,capacity,area,type`
2. Example rows:
   ```
   1,Window Table,2,Main Dining,Premium
   2,Center,4,Main Dining,Standard
   3,Patio,6,Outdoor,Standard
   ```
3. Click "Choose File" and select your CSV
4. Click "Upload"

**Option B: Add Tables Manually**
If you don't have a CSV:
1. Skip upload
2. After setup, go to **Admin → Tables Management**
3. Use "Add Table" button to create tables individually

#### Step 3: Operational Rules
- **Allow Table Merging:** Can staff combine tables for larger parties?
- **Allow Walk-Ins:** Accept reservations for same-day arrivals?
- **Default Reservation Duration:** How long guests typically stay (default 90 min)
- **Max Advance Booking:** How far in advance guests can book (default 30 days)

#### Step 4: Team Invitations
Invite your staff:
1. Enter staff member's email address
2. Select their role:
   - **Host:** Basic booking and customer management
   - **Manager:** Can view analytics and manage staff
   - **Admin:** Full access to system settings
3. Click "Send Invite"
4. They'll receive email invitation to join

Click "Complete Setup" when finished.

---

## RESTAURANT CONFIGURATION

### Accessing Settings

1. Log in to your account
2. Click your profile icon (top right)
3. Select "Settings"

### Key Settings

#### Operating Hours
- Determines when online booking is available
- Customers cannot book before opening or after closing
- **Note:** Late reservations that would end after closing time are automatically rejected

#### Reservation Rules
- **Default Duration:** Standard reservation time (affects availability calculations)
- **Min Advance Booking:** How soon before arrival guests must book (prevents day-of confusion)
- **Max Party Size:** Largest party your restaurant will seat
- **Require Payment:** Deposit collection (if integrated with payment provider)

#### Timezone
- Critical for accurate time display
- Default is **Europe/London**
- Change if operating in different timezone

---

## FLOOR PLAN & TABLE MANAGEMENT

### Step 1: Navigate to Tables Management

1. Click **Dashboard** (main menu)
2. Select **Admin** tab
3. Click **Tables Management**

### Add a New Table

1. Click **"+ Add Table"** button
2. Fill in:
   - **Table Number:** Unique identifier (e.g., "101", "W-3")
   - **Name:** Display name (optional, e.g., "Window Seat 1")
   - **Capacity:** Number of guests it seats (e.g., 2, 4, 6)
   - **Min Capacity:** Smallest party to seat here (optional, e.g., 2)
   - **Area:** Select floor area (e.g., "Main Dining", "Patio")
   - **Type:** Table type (e.g., "Standard", "Premium", "VIP")
3. Click "Save"

### Edit Table Properties

1. Find table in the list
2. Click **Edit** button (pencil icon)
3. Modify any fields
4. Click "Save"

### Deactivate a Table

1. Find table in list
2. Click **Deactivate** button (archive icon)
3. Confirm action
4. Table is hidden from booking but data is preserved

### Create Floor Areas

**What are floor areas?**
Areas organize your tables logically (e.g., Main Dining, Patio, Private Room)

**To create area:**
1. In Tables Management, click **Areas** tab
2. Click **"+ Add Area"**
3. Enter area name
4. Set display order (affects menu order)
5. Click "Save"

**To assign tables to area:**
1. Edit table (see "Edit Table Properties" above)
2. In Area dropdown, select floor area
3. Click "Save"

### View Floor Plan (Visual Layout)

1. Go to Admin → **Floor Map** tab
2. See all tables displayed by area
3. Tables show current status:
   - 🟢 **Green:** Available
   - 🔵 **Blue:** Has incoming reservation
   - 🔴 **Red:** Currently occupied
   - ⚫ **Gray:** Outside operating hours

---

## STAFF TEAM MANAGEMENT

### Inviting New Staff

1. Go to **Admin → Staff Management**
2. Click **"+ Invite Staff"**
3. Enter their email address
4. Select role:
   - **Host:** Can create and view reservations
   - **Manager:** + Can view reports and adjust operational settings
   - **Admin:** Full system access
5. Click "Send Invite"
6. They'll receive email with join link (valid for 7 days)

### Managing Staff

#### View All Staff
1. Go to **Admin → Staff Management**
2. See all team members with:
   - Name and email
   - Role
   - Last active time
   - Invitation status

#### Change Staff Role
1. Find staff member in list
2. Click "Edit" button
3. Select new role from dropdown
4. Click "Save"
5. Changes take effect immediately

#### Remove Staff
1. Find staff member in list
2. Click "Remove" button
3. Confirm removal
4. Staff loses access to POS system (data preserved)

### Staff Login

Staff members should:
1. Go to `https://table-reservation-system.vercel.app/staff-login`
2. Enter email and password
3. They'll see the **POS Dashboard** with today's reservations

---

## DASHBOARD & MONITORING

### Main KPI Cards

Your dashboard displays four key metrics:

#### 📅 Today's Bookings
- Total reservations scheduled for today
- Refreshes every minute

#### 👥 Seated Now
- Guests currently dining (staff marks manually)
- Helps monitor occupancy

#### 🪑 Total Tables
- Count of all active tables in your restaurant
- Quick review of capacity

#### 👨‍💼 Total Staff
- Active team members with system access
- Verify all staff are added

### Reservation Tab

**View all reservations:**
1. Click **Reservations** tab in admin dashboard
2. See list of all bookings with:
   - Guest name
   - Party size
   - Date and time
   - Table assignment
   - Current status

**Update Reservation Status:**
1. Find reservation in list
2. Click status dropdown
3. Select new status:
   - **Confirmed:** Booking confirmed, waiting for guest
   - **Arriving:** Guest has arrived, waiting to be seated
   - **Seated:** Guest is currently dining
   - **Completed:** Guest has finished and left
   - **No-Show:** Guest didn't arrive
   - **Cancelled:** Booking cancelled
4. Click "Save"

**Export as CSV:**
1. Click **"Export CSV"** button
2. File downloads with all reservation data
3. Use for accounting, reporting, or external systems

---

## MANAGING RESERVATIONS

### Monitoring Today's Service

1. Go to **Admin → Floor Map** tab
2. Select today's date
3. You'll see:
   - Each table with its current status
   - Guest names and party sizes
   - Estimated departure times
   - Available tables highlighted

### Creating a Staff Reservation

Sometimes staff book for walk-ins or phone calls:

1. Click **Admin → Reservations** tab
2. Click **"+ New Reservation"**
3. Fill in:
   - **Date & Time:** When guest will arrive
   - **Table:** Which table to assign
   - **Party Size:** Number of guests
   - **Guest Name:** First and last name
   - **Phone/Email:** Contact information
   - **Special Requests:** Any dietary needs, preferences
4. Click "Create"
5. Confirmation appears with reservation details

### Modifying an Existing Reservation

1. Find reservation in **Reservations** tab
2. Click **Edit** button
3. Change any of:
   - Date/Time
   - Table assignment
   - Guest contact info
   - Special requests
4. Click "Save"

### Cancelling a Reservation

1. Find reservation in **Reservations** tab
2. Click **"..."** (more options)
3. Select "Cancel"
4. Optionally add reason
5. Click "Confirm Cancel"

### Handling No-Shows

1. If guest doesn't arrive within 15 minutes of reservation time:
   - Click reservation
   - Change status to "No-Show"
2. Table becomes available for walkups
3. No-show counts against guest's record (used in future marketing)

---

## TROUBLESHOOTING

### Issue: "Online booking unavailable" message on website

**Cause:** Outside your operating hours

**Solution:** Check that:
1. Verify your operating hours are correct in Settings
2. Verify system time is correct
3. If booking outside hours needed, temporarily adjust hours

### Issue: Staff members cannot log in

**Possible causes:**

1. **Invitation not accepted**
   - Ask staff to check email for invite link
   - Invite expires in 7 days

2. **Wrong email address**
   - Check invite was sent to correct email
   - Can resend invite from Staff Management tab

3. **Account not activated**
   - Staff should click email invitation link
   - If lost, resend invitation

### Issue: Tables not appearing on floor plan

**Cause:** Tables deactivated or not assigned to area

**Solution:**
1. Go to **Tables Management**
2. Check table "is_active" status
3. Verify table is assigned to a floor area
4. Reactivate if necessary

### Issue: Customer report says "No availability" for open date

**Cause:** All tables already booked OR time falls outside operating hours

**Verify:**
1. Check floor plan for that date/time
2. If tables are free and hours are open, this shouldn't occur
3. Contact technical support with reservation details

### Issue: Reservation shows wrong time

**Cause:** Timezone setting mismatch

**Fix:**
1. Go to **Settings**
2. Verify timezone matches your restaurant location
3. Consider whether daylight saving time affects times
4. Update if needed (may require staff refresh)

---

## BEST PRACTICES

### Daily Operations
✅ **Log in each morning** to review day's bookings
✅ **Update statuses** as guests arrive and depart (helps staff and customer analytics)
✅ **Handle cancellations promptly** to open slots for others
✅ **Monitor "Seated Now"** to balance workload across areas
✅ **Back up your data** monthly (contact support for export)

### Reservation Management
✅ Set realistic default reservation duration (most casual dining 90 min, fine dining 120+ min)
✅ Update operating hours if changing seasons
✅ Review no-shows weekly (may indicate issues with customer reliability)
✅ Archive old table data at year-end for reporting

### Building Guest Experience
✅ Use special requests field for important preferences
✅ Tag repeat customers as VIP for priority seating
✅ Follow up on cancelled reservations (offer alternative times)
✅ Monitor email confirmation delivery

---

## CONTACTING SUPPORT

**Technical Issues:**
- Email: `support@table-reservation.dev`
- Response time: Within 2 business hours

**Billing/Account:**
- Email: `billing@table-reservation.dev`

**Emergency (System Down):**
- Phone: `+44 (0)20 XXXX XXXX`
- Status page: `https://status.table-reservation.dev`

---

**Last Updated:** March 2026
**Document Version:** 1.0
