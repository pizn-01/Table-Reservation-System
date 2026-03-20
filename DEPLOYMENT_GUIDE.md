# Deployment Guide - Table Reservation System

**Status:** Ready for Production Deployment  
**Last Updated:** 2024  
**Version:** 1.0

---

## Pre-Deployment Checklist (1-2 hours)

### Phase 1: Credential Rotation (20 minutes) 🔴 CRITICAL

#### Step 1: Rotate Supabase Credentials
```bash
# In Supabase Dashboard:
# 1. Go to Project Settings → API section
# 2. Locate "Service Role Key" and "Anon Key"
# 3. Click "Rotate" on each key
# 4. Save the new keys securely (screenshot or KeePass)
```

**New Values Needed:**
- `SUPABASE_API_KEY` (anon key) ← Update
- `SUPABASE_SERVICE_ROLE_KEY` (service role) ← Update

#### Step 2: Rotate JWT Secret
```bash
# Generate new secure JWT secret:
openssl rand -base64 64

# Output example:
# tHvolqZVYxOP7PRZ6W6964+Gp4eCiwkLRp2Gx4Buz5uJ01hYkQDYuA/lh4opW5ro9X1y/xJoNGJ8jgUOBC898g==
```

**New Value Needed:**
- `JWT_SECRET` ← Update

#### Step 3: Update Fly.io Secrets
```bash
# Set all secrets securely (they won't echo):
fly secrets set \
  SUPABASE_API_KEY="your_new_anon_key" \
  SUPABASE_SERVICE_ROLE_KEY="your_new_service_role_key" \
  JWT_SECRET="your_new_jwt_secret" \
  -a table-reservation-api

# Verify secrets were set:
fly secrets list -a table-reservation-api
```

Expected output:
```
NAME                         DIGEST CREATED
SUPABASE_API_KEY            sha... 2024-01-15T10:30:00Z
SUPABASE_SERVICE_ROLE_KEY   sha... 2024-01-15T10:30:01Z
JWT_SECRET                  sha... 2024-01-15T10:30:02Z
```

### Phase 2: Environment Validation (15 minutes)

#### Step 1: Verify Database Connection
```bash
# SSH into Fly app and test connection:
fly ssh console -a table-reservation-api

# Inside console:
psql postgres://$POSTGRES_URL/reservation_system -c "SELECT NOW();"

# Expected output: Current timestamp (connection OK)
exit
```

#### Step 2: Verify API Endpoints
```bash
# Test public endpoint:
curl https://api.yourdomain.com/api/v1/public/blackstone/info

# Expected response:
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Blackstone",
    "slug": "blackstone"
  }
}
```

#### Step 3: Check Email Configuration
```bash
# Verify Resend API key is set:
fly secrets list -a table-reservation-api | grep RESEND

# Should show RESEND_API_KEY with a digest
# If missing, add it:
fly secrets set RESEND_API_KEY="your_resend_key" -a table-reservation-api
```

### Phase 3: Backend Deployment (20 minutes)

#### Step 1: Build and Deploy
```bash
# From workspace root:
cd backend

# Build:
npm run build

# Deploy to Fly:
fly deploy -a table-reservation-api

# Watch logs:
fly logs -a table-reservation-api
```

**Expected log output:**
```
2024-01-15T10:35:00Z app[8bb58f00]: ▶ Server running on port 3001
2024-01-15T10:35:01Z app[8bb58f00]: ✓ Database connection established
2024-01-15T10:35:02Z app[8bb58f00]: ✓ CORS enabled for allowed origins
```

#### Step 2: Post-Deployment Verification
```bash
# Wait for app to be healthy:
fly status -a table-reservation-api

# Should show "passing" health checks:
# Health Checks
#   HTTP Requests     (passing)
#   Recent Checks     (3 total)

# Test health endpoint:
curl https://api.yourdomain.com/api/v1/health

# Expected:
{
  "status": "ok",
  "uptime": 45,
  "database": "connected"
}
```

### Phase 4: Frontend Deployment (15 minutes)

#### Step 1: Update Environment Variables
```bash
# In Vercel Dashboard or .env.production:
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_AUTH_DOMAIN=auth.yourdomain.com
```

#### Step 2: Build and Deploy
```bash
# From workspace root:
npm run build

# Deploy to Vercel:
vercel --prod

# Or if deployed:
git push origin main  # Triggers Vercel auto-deploy
```

**Expected deployment:**
```
✓ Deployed
✓ Production domain: https://yourapp.yourdomain.com
✓ Build: 2m 34s
✓ Functions: 4
```

#### Step 3: Verification
```bash
# Test booking page loads:
curl -s https://yourapp.yourdomain.com/ | grep -i "table reservation"

# Expected: Should contain "Book Your Table" or similar
```

### Phase 5: Database Migrations (5 minutes if needed)

```bash
# If there are new migrations:
cd backend

# Run migrations:
npm run migrate

# Verify schema:
psql postgres://$POSTGRES_URL/reservation_system -c "\dt"

# Should show all tables:
# ├── users
# ├── organizations
# ├── tables
# ├── reservations
# ├── customers
# └── audit_logs
```

**Note (Floorplan snapshots):** A new migration `003_floorplan_versions.sql` was added to support storing JSON snapshots of floorplans. Apply migrations before schema-dependent deploys.


---

## Smoke Tests (20 minutes)

Run these manual tests to confirm everything works:

### Test 1: Public Booking Workflow
```bash
# 1. Open https://yourapp.yourdomain.com
# 2. Click "Book a Table"
# 3. Select tomorrow's date
# 4. Select 7:00 PM time slot
# 5. Select 2 guests
# 6. Select any table
# 7. Enter contact info
# 8. Review and confirm
# 9. Expected: Confirmation page with reservation ID
```

**Success Criteria:**
- No errors in browser console
- Confirmation shows reservation ID beginning with UUID
- "Booking confirmed for 2 guests" text visible

### Test 2: Validation Testing
```bash
# Via curl (see PRODUCTION_READINESS.md test scenarios):
bash test-validations.sh blackstone https://api.yourdomain.com/api/v1

# Expected: "✓ ALL TESTS PASSED"
```

### Test 3: Admin Access
```bash
# 1. Open https://yourapp.yourdomain.com/staff/login
# 2. Enter admin email/password
# 3. Navigate to Dashboard
# 4. Check:
#    - Reservations tab shows current bookings
#    - Tables tab shows all tables
#    - Staff tab shows team members
#    - Floor map displays correctly
```

**Success Criteria:**
- Admin can view all 4 dashboard tabs
- Data loads without errors
- Can navigate between tabs

### Test 4: Error Handling
```bash
# Test validation error display
# 1. Try to book with past date
# 2. Expected error: "Cannot book reservations in the past"
# 3. Try to book beyond 30-day limit
# 4. Expected error: "Can only book up to 30 days in advance"
# 5. Try party size = 50
# 6. Expected error: "Party size cannot exceed 20"
```

---

## Rollback Procedure (if issues occur)

### Immediate Rollback (< 5 minutes)

```bash
# For backend:
fly releases -a table-reservation-api
# Find the last known-good release ID

fly releases rollback <release_id> -a table-reservation-api
# Deploys previous version immediately

# For frontend (on Vercel):
# Go to Deployments tab
# Find last successful deploy
# Click "Redeploy"
```

### Credential Compromise Rollback

```bash
# If credentials were exposed:
# 1. Immediately rotate again:
fly secrets set \
  SUPABASE_API_KEY="emergency_new_key" \
  SUPABASE_SERVICE_ROLE_KEY="emergency_new_key" \
  JWT_SECRET="emergency_new_jwt" \
  -a table-reservation-api

# 2. Check audit logs for unauthorized access:
SELECT * FROM audit_logs 
WHERE action = 'reservation_created' 
AND created_at > now() - interval '1 hour'
ORDER BY created_at DESC;

# 3. Delete suspicious reservations if needed:
DELETE FROM reservations 
WHERE id = 'suspicious_id' 
AND created_by != 'trusted_system_id';
```

---

## Post-Deployment Verification (1 hour)

### Monitoring Dashboard Setup

**Configure Sentry (or similar error tracking):**

```typescript
// In frontend/src/main.tsx:
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://your_sentry_dsn@sentry.io/...",
  environment: "production",
  tracesSampleRate: 0.1,
});
```

**Configure Backend Monitoring:**

```typescript
// In backend/src/app.ts:
const express = require('express');
const Sentry = require("@sentry/node");

Sentry.init({ dsn: process.env.SENTRY_DSN });

const app = express();
app.use(Sentry.Handlers.requestHandler());
```

### Log Monitoring Checklist

- ✅ Confirm Fly logs flowing to monitoring system
- ✅ Set up alerts for:
  - 500 errors > 5 per minute
  - Response time > 2 seconds (p95)
  - Database connection pool exhaustion
  - RPC execution time > 250ms

### Metrics to Track First Day

| Metric | Healthy Range | Alert Threshold |
|--------|---|---|
| HTTP 2xx rate | > 95% | < 90% |
| HTTP 4xx rate | 2-8% | > 15% |
| HTTP 5xx rate | < 1% | > 3% |
| API Response Time (p95) | < 500ms | > 1000ms |
| DB Connection Pool Usage | < 50% | > 80% |
| Reservation Success Rate | > 99% | < 98% |

### Concurrent Booking Test

```bash
# Test with multiple simultaneous bookings on same table:

# Terminal 1:
for i in {1..10}; do
  curl -X POST https://api.yourdomain.com/api/v1/public/blackstone/reserve \
    -H "Content-Type: application/json" \
    -d "{
      \"reservationDate\": \"2024-12-25\",
      \"startTime\": \"19:00\",
      \"endTime\": \"20:30\",
      \"partySize\": 2,
      \"guestFirstName\": \"Guest$i\",
      \"guestEmail\": \"guest$i@test.com\",
      \"guestPhone\": \"555-000$i\"
    }" &
done
wait

# Expected result: Exactly 1 success (201), rest failures (409)
# This confirms atomic RPC prevents double-booking
```

---

## Day 1 Incident Response

### Common Issues & Fixes

| Issue | Symptom | Fix |
|---|---|---|
| Database connection fails | "Cannot connect to database" errors | Check Fly secrets, verify DB is up |
| API key invalid | 401 on all requests | Re-apply credentials, verify format |
| CORS errors | "Access-Control-Allow-Origin missing" | Check CORS config in backend/config/cors.ts |
| Email not sending | Bookings complete but no emails | Check RESEND_API_KEY, verify email template |
| Frontend 404 | "Cannot find page" on all routes | Check Vercel deployment, verify routes |

### Escalation Procedure

**Level 1 (Can fix immediately):**
- Check Fly/Vercel dashboard for deployment status
- Review error logs in Sentry
- Run validation tests (test-validations.sh)

**Level 2 (May need database access):**
- Check database logs
- Verify schema integrity
- Check RPC function status

**Level 3 (Critical - escalate):**
- Scale up database (if CPU/connection issues)
- Switch to backup database
- Rollback to previous version

---

## Performance Optimization (Week 1+)

### Database Query Optimization

```sql
-- Create indexes for common queries:
CREATE INDEX idx_reservations_date_status 
  ON reservations(reservation_date, status);

CREATE INDEX idx_reservations_table_date 
  ON reservations(table_id, reservation_date, status);

CREATE INDEX idx_customers_email 
  ON customers(email);
```

### Caching Strategy

```bash
# Configure Redis for session/cache:
fly secrets set REDIS_URL="redis://..." -a table-reservation-api

# In backend:
app.use(session({
  store: new RedisStore({ url: process.env.REDIS_URL }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, httpOnly: true, maxAge: 3600000 }
}));
```

### API Response Time Monitoring

```typescript
// Add request timing middleware:
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    if (duration > 1000) {
      console.warn(`SLOW_REQUEST: ${req.path} took ${duration}ms`);
    }
  });
  next();
});
```

---

## Maintenance Schedule

### Daily
- [ ] Check error rate in Sentry (for critical errors)
- [ ] Review reservation creation volume (business metric)

### Weekly
- [ ] Run full validation test suite
- [ ] Review performance metrics
- [ ] Check for npm security vulnerabilities: `npm audit`

### Monthly
- [ ] Rotate API keys (security best practice)
- [ ] Review database logs for slow queries
- [ ] Backup and test restoration procedure
- [ ] Update dependencies (security patches only)

### Quarterly
- [ ] Full security audit
- [ ] Load testing with realistic concurrent users
- [ ] Capacity planning (storage, concurrent connections)

---

## Contact & Support

**On-Call Support:**
- Sentry alerts → Send to on-call engineer
- Database emergencies → Contact Supabase support
- Deployment issues → Check Fly.io status page

**Escalation:**
- Critical production outage → All hands
- Data integrity issue → Database backup team
- Security breach → Security team + legal

---

## Documents Reference

- **PRODUCTION_READINESS.md** - Comprehensive validation checklist
- **SECURITY_GUIDE.md** - Credential rotation and security procedures
- **FRONTEND_ERROR_HANDLING.md** - Error message handling guide
- **test-validations.sh** - Automated validation test script

---

**Deployment Status: Ready ✅**

Once Phase 1 (credential rotation) is complete, you're cleared for production launch.
