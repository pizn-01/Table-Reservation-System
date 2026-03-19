# Frontend Error Handling Guide

This document describes how the frontend should handle API validation errors for production readiness.

## Error Response Format

All API errors follow this JSON format:

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

### HTTP Status Codes Used

| Code | Meaning | Example |
|------|---------|---------|
| **400** | Bad Request / Validation Error | Invalid date, party size too large |
| **401** | Unauthorized | Missing JWT token |
| **403** | Forbidden | User lacks required role/permissions |
| **404** | Not Found | Restaurant or reservation doesn't exist |
| **409** | Conflict | Table double-booked, email already used |
| **500** | Server Error | Database connection failure |

---

## Validation Error Messages

### Date Validation Errors

```
"Cannot book reservations in the past"
→ User selected a date before today
→ Action: Disable past dates in date picker

"Can only book up to 30 days in advance"
→ User selected date > max_advance_booking_days
→ Action: Limit date picker to valid range

"Invalid date format"
→ Date not in YYYY-MM-DD format
→ Action: Ensure date picker outputs correct format
```

### Time Validation Errors

```
"Restaurant does not open until 11:00"
→ Selected start_time is before opening time
→ Action: Show restaurant hours and adjust time picker minimum

"Restaurant closes at 22:00. Please choose an earlier time."
→ Calculated end_time would exceed closing_time
→ Action: Disable time slots that would violate hours

"Time cannot exceed 24 hours"
→ Internal error: Duration calculation failed
→ Action: Use predefined duration or shorter time slots

"End time must be after start time"
→ Invalid time range specified
→ Action: Validate form before submission
```

### Party Size Validation Errors

```
"Party size cannot exceed 20"
→ Requested party size > org.max_party_size
→ Action: Limit party size picker to maximum

"Table capacity (4) is less than party size (6)"
→ Selected table cannot accommodate party
→ Action: Pre-filter available tables based on party size
```

### Concurrent Booking Errors

```
"Table is no longer available for this time slot (booked by another user)"
→ Another visitor booked the same table between submission attempts
→ Action: Show available tables again, allow user to select different table/time

"Table is no longer available for this time slot"
→ RPC-level conflict response
→ Action: Same as above - show fresh availability
```

### Contact Information Errors

```
"First name is required"
"Email is required"
"Phone number is required"
→ Missing required field in form
→ Action: Show field-level validation errors before submission

"Invalid email format"
→ Email doesn't match pattern
→ Action: Add email regex validation on form input

"Email already in use"
→ Email belongs to existing customer/account
→ Action: Allow existing customers to use same email, or show merge option
```

### Restaurant/Organization Errors

```
"Restaurant not found"
→ Invalid restaurant slug or ID
→ Action: Redirect to 404 page or restaurant selector

"No restaurant selected"
→ User context missing restaurant data
→ Action: Redirect to home/restaurant selection
```

---

## Frontend Error Handling Best Practices

### 1. Form-Level Validation

**Do BEFORE submitting:**
```typescript
if (!formData.date || formData.date < today) {
  setError('Please select a future date');
  return;
}

if (!formData.time) {
  setError('Please select a time');
  return;
}

if (formData.partySize > MAX_PARTY_SIZE) {
  setError(`Maximum party size is ${MAX_PARTY_SIZE}`);
  return;
}

if (!isValidEmail(formData.email)) {
  setError('Please enter a valid email');
  return;
}
```

### 2. API Error Handling

**Example from booking wizards:**

```typescript
try {
  const result = await api.post(`/organizations/${orgId}/reservations`, payload);
  navigate('/confirmation', { state: { reservationId: result.data } });
} catch (err) {
  if (err instanceof ApiError) {
    // Backend validation failed
    setSubmitError(err.message); // Shows user-friendly message
  } else {
    // Network error or unknown issue
    setSubmitError('Failed to create reservation. Please try again.');
  }
} finally {
  setIsSubmitting(false);
}
```

### 3. Display Error Messages Prominently

**Error message styling (from existing components):**

```typescript
{submitError && (
  <div style={{
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '0.875rem'
  }}>
    {submitError}
  </div>
)}
```

### 4. Disable Problematic UI Elements

**Examples:**

```typescript
// Disable past dates in date picker
<input
  type="date"
  min={new Date().toISOString().split('T')[0]}
  value={date}
  onChange={(e) => setDate(e.target.value)}
/>

// Disable table selection if no valid availability
{availableTables.length === 0 ? (
  <div>No tables available for this time. Please choose a different time.</div>
) : (
  <TableSelector tables={availableTables} />
)}

// Disable submit button while loading
<button disabled={isSubmitting}>
  {isSubmitting ? 'Processing...' : 'Confirm Reservation'}
</button>
```

### 5. Retry Logic for Recoverable Errors

```typescript
// For "table no longer available" errors
if (err.message.includes('no longer available')) {
  setError(err.message);
  // Optionally refresh availability
  const fresh = await api.get(
    `/organizations/${orgId}/tables/availability?date=${date}&time=${time}&partySize=${guests}`
  );
  setAvailableTables(fresh.data);
  // Don't clear the error immediately - let user see what happened
  return;
}
```

---

## Error Message Mapping

This table helps developers map all known backend errors to user-friendly messages:

| Backend Error | HTTP | User Message | Action |
|---|---|---|---|
| Cannot book reservations in the past | 400 | Please select a future date | Show date picker error |
| Can only book up to X days in advance | 400 | You can only book up to X days in advance | Adjust date picker max |
| Party size cannot exceed X | 400 | Maximum party size is X guests | Limit party size picker |
| Restaurant does not open until HH:MM | 400 | Restaurant doesn't open until HH:MM | Update time picker minimum |
| Restaurant closes at HH:MM | 400 | Restaurant closes at HH:MM | Update time picker maximum |
| Time cannot exceed 24 hours | 400 | Please choose an earlier start time | Adjust start time |
| End time must be after start time | 400 | End time must be after start time | Validate form |
| Table is no longer available | 409 | This table was just booked! Please choose another time | Refresh availability |
| Table capacity X is less than party size Y | 400 | This table isn't large enough for your party | Pre-filter tables |
| Email already in use | 409 | Email already has an account (allow login) | Show login option |
| Restaurant not found | 404 | Restaurant not found | Redirect to home |
| No restaurant selected | N/A | Please select a restaurant | Show restaurant picker |

---

## Testing Error Scenarios

### Test Case 1: Past Date
1. Open booking page
2. Try to select yesterday's date
3. **Expected:** Date picker shows error or disables past dates
4. **Verify:** User cannot submit with past date

### Test Case 2: Operating Hours
1. Open booking page
2. Select valid future date
3. Select time before opening (e.g., 7:00 AM if opening is 11:00)
4. **Expected:** Error message shows "Restaurant does not open until 11:00"
5. **Verify:** Time picker is constrained to valid hours

### Test Case 3: Party Size
1. Open booking page
2. Try to increase party size beyond maximum (e.g., 50 if max is 20)
3. **Expected:** Party size input disabled or shows error
4. **Verify:** Cannot select invalid party size

### Test Case 4: Double-Booking
1. Open booking in two browser tabs
2. In Tab 1: Select same table/date/time, submit
3. **Expected:** Tab 1 shows confirmation
4. In Tab 2: Select same table, submit quickly
5. **Expected:** Tab 2 shows "Table is no longer available"
6. **Verify:** User can select different table and retry

### Test Case 5: Email Validation
1. Open booking page
2. Enter invalid email (e.g., "notanemail")
3. Click submit
4. **Expected:** Form-level error before API call: "Invalid email format"
5. **Verify:** API is not called with invalid email

---

## Monitoring Error Rates

For production monitoring, track:

1. **Validation Errors** (400s):
   - Track by error type
   - Alert if "Can only book up to X days" > 10% of requests
   - Alert if "Restaurant closes at HH:MM" > 15% of requests

2. **Conflict Errors** (409s):
   - Track double-booking rate
   - Should be < 1% if RPC locking works
   - Alert if > 5%

3. **Server Errors** (500s):
   - Alert if any occur
   - Check database logs immediately

4. **By Endpoint**:
   - `/public/:slug/reserve` - Watch for unusual patterns
   - `/organizations/:id/reservations` - Track authenticated user errors

---

## Configuration Variables

Add to `.env` files:

```env
# Frontend timeout for API requests
VITE_API_TIMEOUT_MS=30000

# Max party size (should match backend)
VITE_MAX_PARTY_SIZE=20

# Max advance booking days
VITE_MAX_ADVANCE_BOOKING_DAYS=30

# Enable debug logging of errors
VITE_DEBUG_ERRORS=false
```

---

## References

- **Backend Error Handler:** `backend/src/middleware/errorHandler.ts`
- **Reservation Service:** `backend/src/services/reservation.service.ts`
- **API Library:** `src/lib/api.ts`
- **Booking Wizards:** 
  - `src/pages/public-reservation/BookATableWizard.tsx`
  - `src/pages/user-reservation/UserReservationWizard.tsx`
  - `src/pages/reservation/ReservationWizard.tsx`
  - `src/pages/PremiumReservation.tsx`

---

## Changelog

- **v1.0** - Initial error handling guide with validation mapping
- Added comprehensive error message matrix
- Added testing scenarios
- Added monitoring guidance
