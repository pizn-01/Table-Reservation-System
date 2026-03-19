# GUIDE 2: Staff & POS System Operational Guide

## Welcome to the POS Reservation Dashboard

This guide helps restaurant staff manage table operations and guest reservations during daily service.

---

## TABLE OF CONTENTS
1. [Logging In](#logging-in)
2. [Dashboard Overview](#dashboard-overview)
3. [Table Management](#table-management)
4. [Managing Reservations](#managing-reservations)
5. [Daily Service Workflow](#daily-service-workflow)
6. [Troubleshooting](#troubleshooting)

---

## LOGGING IN

### First-Time Login

1. You should receive an email invitation from your manager
2. Click the invitation link in the email
3. Create a password
4. You'll be directed to the **Staff Dashboard**

### Regular Login

1. Go to `https://table-reservation-system.vercel.app/staff-login`
2. Enter your email and password
3. Click "Log In"
4. You'll see today's reservation schedule

**Note:** Your access is limited to your assigned restaurant only.

---

## DASHBOARD OVERVIEW

### What You'll See

The staff dashboard shows:

```
┌─────────────────────────────────────────────────┐
│  📅 TODAY'S RESERVATIONS & TABLE STATUS       │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─ STATISTICS ─────────────────────────────┐  │
│  │ Bookings: 24  │ Seated: 8  │ Available: 4 │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  ┌─ CALENDAR VIEW (24-HOUR GRID) ────────────┐  │
│  │ Table 1  │ 17:00 ──── 19:00: Smith (4)   │  │
│  │ Table 2  │ 17:30 ──── 18:30: Jones (2)   │  │
│  │ Table 3  │ Available                      │  │
│  │ Table 4  │ 20:00 ──── 21:30: Brown (6)   │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  ┌─ NAVIGATION ──────────────────────────────┐  │
│  │ [◀ Prev Day]  Today  [Next Day ▶]        │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  ┌─ AREA TABS ───────────────────────────────┐  │
│  │ Main Dining  |  Patio  |  Private Room   │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
└─────────────────────────────────────────────────┘
```

### Key Statistics

**📅 Bookings:**
- Total confirmed reservations for today
- Includes arriving, seated, and completed guests

**👥 Seated:**
- Guests currently eating
- You manually update this as they sit down

**🪑 Available:**
- Empty tables ready for new guests
- "Available Now" means no reservation currently assigned

---

## TABLE MANAGEMENT

### Viewing Table Status

Each table shows:
- **Table number** (e.g., "T5", "Window-2")
- **Current status**:
  - 🟢 **Green (Available):** Empty, ready for guests
  - 🔵 **Blue (Confirmed):** Reservation arriving soon
  - 🟡 **Amber (Arriving):** Guest has arrived, waiting for table
  - 🔴 **Red (Seated):** Currently dining
  - ⚫ **Gray (Closed):** Table unavailable

### Navigating Between Areas

Your restaurant may have multiple floor areas:

1. Click **Area tabs** at bottom: "Main Dining", "Patio", etc.
2. View tables for that area
3. Each area shows independently on calendar

### Quick Table View

Switch between display modes:

- **Calendar View:** See all tables as a 24-hour timeline (best for overview)
- **Table List:** Simple list with status and current occupant
- **Floor Plan:** Visual map showing table positions (manager/admin)

---

## MANAGING RESERVATIONS

### Viewing Reservation Details

Click on any reservation in the calendar to see:
- Guest name and phone number
- Party size
- Reservation time and estimated end time
- Special requests or dietary requirements
- Check-in status

### Guest Arrivals

**When guests arrive:**

1. Find their reservation on the calendar (look for guest name)
2. Click reservation card
3. Select status: **"Mark Arriving"**
4. Note arrival time (for analytics)
5. Click "Confirm"

The reservation turns amber (🟡) to alert everyone the party is waiting.

### Seating Guests

**When table is ready:**

1. Confirm table is clean and set
2. Click the arriving reservation
3. Select status: **"Mark Seated"**
4. Table turns **red** (🔴)
5. Notify hosts to escort guests to table

### Completing Service

**When guests finish eating and leave:**

1. Click the seated reservation
2. Select status: **"Mark Completed"**
3. Update estimated service time if different from default
4. Click "Confirm"
5. Table turns green (🟢) - available for next guests

**For accounting:** Completion records when guests depart (used for reconciling revenue)

### Handling No-Shows

**If guests don't arrive within 15 minutes of reservation time:**

1. Click reservation
2. Select status: **"No-Show"**
3. Add note (optional): Why they didn't show
4. Click "Confirm"
5. Table immediately available for walk-in guests

### Cancellations

**If guests call to cancel:**

1. Find the reservation
2. Click **"..."** (more options)
3. Select "Cancel"
4. Add cancellation reason
5. Click "Confirm"

Note: This frees the table for other guests to book online.

### Creating Walk-In Reservations

**For unbooked guests arriving without reservation:**

1. Click **"+ New Walk-In"** button
2. Fill in:
   - **Guest Name:** What to call them
   - **Party Size:** Number of people
   - **Table:** Which table to seat them
   - **Estimated Duration:** How long they'll stay
   - **Special Requests:** Allergies, preferences
3. Click "Create"
4. Reservation is created with "Walk-In" source

---

## DAILY SERVICE WORKFLOW

### Opening Shift (90 minutes before service)

1. **Log in** to POS system
2. **Review day's bookings:** Scroll through calendar to see timing
3. **Check preparedness:**
   - Are tables correctly assigned?
   - Are all floors staffed?
   - Do special requests show dietary needs?
4. **Brief team:** Point out high-turnover times, VIP tables, large parties
5. **Prepare waiting area:** Stage seating for early arrivals

### During Service (Ongoing)

**Every 30 minutes:**
- [ ] Review upcoming 60-minute bookings (prep tables early)
- [ ] Check "Available Now" count (resource planning)
- [ ] Update guest statuses (arriving → seated → completed)
- [ ] Scan for gaps in service (long wait times indicate issues)

**As guests arrive:**
- [ ] Mark "Arriving" when they check in
- [ ] Seat when table ready, mark "Seated"
- [ ] Monitor service times (too fast = rushed, too slow = late departures)

**Throughout service:**
- [ ] Note special requests completed (allergies, celebrations)
- [ ] Handle walk-ins with "New Walk-In" button
- [ ] Escalate issues (e.g., late departures blocking next seating)

### End of Shift (Last hour of service)

1. **Review remaining reservations:** Identify any no-shows
2. **Mark completed:** Finalize any lingering reservations
3. **Plan next shift:** Note any issues for handover
4. **Follow up:** Any cancellations or problems to mention to manager?
5. **Log out**

### Closing Shift (30 minutes after final service)

1. **Review today's analytics:**
   - Total revenue
   - Turnover rates
   - No-show count
2. **Report issues:** Any tech problems or overbooking incidents
3. **Data sync:** Ensure all updates saved (or they're auto-saved after each action)
4. **Log out:** You can now leave

---

## COMMON SCENARIOS

### Scenario 1: Guest Runs Late

**Situation:** Reservation at 19:00, guest hasn't arrived by 19:15

**Action:**
1. Don't mark no-show yet (wait until 19:30 minimum)
2. Check if they're in waiting area
3. If calling, update arrival time estimate
4. If cancelling, record cancellation
5. If still arriving, keep "Confirming" status; don't release table yet

### Scenario 2: Previous Guests Running Over

**Situation:** Table 5 had 19:00-20:30 reservation but guests still at 20:45

**Action:**
1. Don't panic — communication is key
2. Check next reservation status (arriving? seated elsewhere?)
3. If next guests arriving:
   - Politely inform current guests their time is up
   - Offer coffee/dessert elsewhere
   - Move them to bar/lounge if available
4. Update status to "Completed" once they leave
5. Quickly reset table for next guests

### Scenario 3: Party Larger Than Booked

**Situation:** Reservation for 4 people, 6 arrive

**Action:**
1. Alert manager/host immediately
2. Don't seat larger party at same table
3. Manager decides:
   - Can we squeeze them (combine 2 tables)?
   - Move them to larger table if available?
   - Ask if some will wait at bar?
4. Update system only after final seating confirmed

### Scenario 4: Guest Has Special Needs

**Situation:** Reservation shows "Wheelchair access needed"

**Action:**
- Prepare accessible table in advance
- When arriving, walk them directly to table
- Ensure staff knows about the accommodation
- After seating, update special request as "Completed"

### Scenario 5: Suspected Double-Booking

**Situation:** Two reservations booking same table, same time

**Background:** System prevents this with table locking, but here's what to do:

1. This should NOT happen (the system prevents it)
2. If you see it, contact manager immediately
3. Do NOT seat both parties
4. Manager will investigate and cancel one reservation

---

## QUICK REFERENCE BUTTONS & ACTIONS

| Button | What It Does | When to Use |
|--------|-------------|-----------|
| 🔔 Mark Arriving | Guest has arrived, waiting for table | When you see them in waiting area |
| 🪑 Mark Seated | Guest is now dining | After you escort them to table |
| ✅ Mark Completed | Guest has finished and left | After they depart |
| ⏸️ Mark No-Show | Guest didn't arrive | After 30-min no-arrival window |
| ❌ Cancel | Guest cancelled reservation | When they call to cancel |
| ➕ New Walk-In | Add unbooked guest | When walk-in arrives |
| 📞 Contact Guest | Call/text guest | Before marking no-show (optional) |
| 📋 View Details | See full reservation info | Before seating, check for requests |
| ⏭️ Next Day | Move to tomorrow's view | At end of shift |

---

## TROUBLESHOOTING

### Problem: I can't see today's reservations

**Solution:**
1. Check you're logged into correct restaurant
2. Click "Today" button to ensure you're on current date
3. Refresh page (Ctrl+R)
4. If still doesn't load, contact manager

### Problem: Table shows wrong status

**Solution:**
1. This usually auto-corrects within 1 minute
2. Try refreshing page
3. Check no one else is updating it simultaneously
4. If status completely wrong, contact manager

### Problem: Guest not in the system but should be booked

**Possible causes:**
1. Booked under different name (check guest's first/last name)
2. Booked for tomorrow, not today (check date)
3. Booking was cancelled (check "Cancelled" status filter)
4. Booking through different restaurant branch
5. Phone/walk-in booking hasn't been entered yet

**Solution:**
- Create walk-in reservation for them
- Mention to manager to update booking system

### Problem: Can't mark guest as seated (button greyed out)

**Reason:** You may not have authority, or guest isn't in "Arriving" status

**Solution:**
1. Click guest's reservation to see current status
2. First mark "Arriving", then "Seated"
3. If button still doesn't work, contact manager

### Problem: System showing old time zone (seems wrong)

**Cause:** Timezone mismatch in restaurant settings

**Solution:**
1. Check reservation times — if 1 hour off, timezone is wrong
2. Contact manager to update in Admin Settings
3. May require page refresh to see change

---

## TIPS FOR GREAT SERVICE FLOW

### ✅ DO's

✅ Check special requests BEFORE seating (allergies can't wait)
✅ Update statuses immediately (helps team coordinate)
✅ Monitor time remaining (prep for next guests)
✅ Group arriving guests (seat multiple parties if possible)
✅ Note issues for handover (for next shift)

### ❌ DON'Ts

❌ Mark "Seated" before table is ready
❌ Double-seat a table (system prevents, but don't try)
❌ Close reservations too early (guests might just be parking)
❌ Rely on memory for large parties (use system notes)
❌ Ignore red flags (guest with allergies needs verification)

---

## YOUR RESPONSIBILITIES

As a staff member using this system:

1. **Accuracy:** Update statuses promptly and truthfully
2. **Communication:** Flag issues to manager, don't work around system
3. **Guest Experience:** Read special requests; honor them
4. **Teamwork:** Coordinate table seating with other staff
5. **Data Protection:** Don't share guest information outside the system

---

## NEED HELP?

**During shift:**
- Ask manager or system administrator
- They have access to admin functions

**After hours:**
- Email: `staff-support@table-reservation.dev`
- Response within next business day

---

**Last Updated:** March 2026
**Document Version:** 1.0

**Key Takeaway:** Your job is to keep the dining room flowing smoothly. This system is your tool — use the statuses to communicate with your team automatically. When you keep the system up to date, everyone works better together.
