# Quick Reference: Production Launch Checklist

**Print this document and check off items as you complete deployment.**

---

## 🔴 CRITICAL: Must Complete Before Deploy

### Credential Rotation (20 minutes)

**Step 1: Supabase Credentials**
- [ ] Go to Supabase Dashboard → Project Settings → API
- [ ] Click "Rotate" on Service Role Key (copy new value)
- [ ] Click "Rotate" on Anon Key (copy new value)
- [ ] Paste into secure storage (KeePass/Vault)

**Step 2: Generate New JWT Secret**
```bash
# Run this and save the output:
openssl rand -base64 64
```
- [ ] JWT Secret generated and saved

**Step 3: Update Fly.io Secrets**
```bash
# Copy-paste this command and fill in the values:
fly secrets set \
  SUPABASE_API_KEY="[from_step_1_anon_key]" \
  SUPABASE_SERVICE_ROLE_KEY="[from_step_1_service_role_key]" \
  JWT_SECRET="[from_step_2]" \
  -a table-reservation-api
```
- [ ] Fly.io secrets updated
- [ ] Verified with: `fly secrets list -a table-reservation-api`

---

## 🟡 IMPORTANT: Validation Tests (30 minutes)

### Automated Validation
```bash
# From project root:
bash test-validations.sh blackstone https://api.yourdomain.com/api/v1

# OR locally:
bash test-validations.sh blackstone http://localhost:3001/api/v1
```
- [ ] Test results: ✅ ALL PASSED

### Manual Smoke Tests

**Public Booking (2 minutes)**
1. [ ] Visit https://yourapp.yourdomain.com
2. [ ] Click "Book a Table"
3. [ ] Select tomorrow @ 7:00 PM, 2 guests
4. [ ] Select a table → Continue
5. [ ] Enter name, email, phone → Continue
6. [ ] Review → Confirm
7. [ ] See confirmation page with reservation ID

**Premium Member Booking (1 minute)**
1. [ ] Login as premium member
2. [ ] Click "Book Premium Table"
3. [ ] Select same time/date
4. [ ] Confirm
5. [ ] See confirmation

**Admin Dashboard (1 minute)**
1. [ ] Login as admin
2. [ ] Visit Admin Dashboard
3. [ ] Check: Reservations tab has data
4. [ ] Check: Tables tab shows tables
5. [ ] Check: Staff tab shows team
6. [ ] Check: Floor map displays

**Validation Errors (2 minutes)**
1. [ ] Try to book past date → See error
2. [ ] Try to book before opening → See error
3. [ ] Try to book after closing → See error
4. [ ] Try party size > 20 → See error

---

## 🟢 DEPLOYMENT: Backend (20 minutes)

### Pre-Deploy Verification
```bash
cd backend
npm run build
```
- [ ] Build succeeds with no errors

### Deploy to Production
```bash
fly deploy -a table-reservation-api
```
- [ ] Deployment started
- [ ] Watch logs:
```bash
fly logs -a table-reservation-api
```
- [ ] See message: "Server running on port 3001"
- [ ] See message: "Database connection established"

### Post-Deploy Verification
```bash
# Check health:
fly status -a table-reservation-api
```
- [ ] Status shows "passing" health checks

```bash
# Test API:
curl https://api.yourdomain.com/api/v1/public/blackstone/info
```
- [ ] Returns valid JSON with restaurant info

---

## 🟢 DEPLOYMENT: Frontend (15 minutes)

### Build Frontend
```bash
npm run build
```
- [ ] Build completes successfully
- [ ] No critical errors in output

### Deploy to Vercel
- **Option A:** Auto-deploy via git
  ```bash
  git add .
  git commit -m "Production deployment"
  git push origin main
  ```
  - [ ] Vercel auto-deploys
  - [ ] Check Vercel dashboard for success

- **Option B:** Manual deploy
  ```bash
  vercel --prod
  ```
  - [ ] Deployment complete
  - [ ] See production URL

### Post-Deploy Verification
```bash
# Check site loads:
curl -s https://yourapp.yourdomain.com/ | grep -i "table reservation"
```
- [ ] Frontend loads successfully

---

## ✅ POST-LAUNCH: First Day Monitoring (Ongoing)

### Every 30 minutes (First 2 hours)

**Error Dashboard**
- [ ] Open https://sentry.io/organizations/[org]/issues/
- [ ] Errors < 5 per 30 min? ✅
- [ ] No database connection errors? ✅

**Performance**
- [ ] Open Fly.io dashboard
- [ ] Response time < 1000ms? ✅
- [ ] No CPU spikes? ✅
- [ ] Memory usage stable? ✅

**Bookings**
- [ ] Can complete a booking? ✅
- [ ] Confirmation email arrives? ✅
- [ ] Reservation shows in admin? ✅

### Every hour (First 4 hours)

**Database Health**
```bash
fly ssh console -a table-reservation-api
psql postgres://$POSTGRES_URL/reservation_system \
  -c "SELECT count(*) as active_connections FROM pg_stat_activity;"
exit
```
- [ ] Connections < 20? ✅

**Concurrent Booking Test**
- [ ] Open booking in 3 browser tabs
- [ ] Try to book same table on all 3
- [ ] Only 1 succeeds? ✅
- [ ] Other 2 show error about unavailable table? ✅

### At 4 hours

**Overall Status**
- [ ] No critical errors
- [ ] Booking success rate > 99%
- [ ] Performance stable
- [ ] Email delivery working
- [ ] All admin features working

**Stand down monitoring:** If all checks pass ✅

---

## 🚨 EMERGENCY: Rollback Procedure

**If critical issues detected:**

### Immediate Actions (< 5 minutes)
1. [ ] Stop accepting new bookings
   - [ ] Contact ops team
   - [ ] Update status page: "Maintenance in progress"

2. [ ] Rollback backend
   ```bash
   fly releases -a table-reservation-api
   # Find last known-good release
   fly releases rollback [release_id] -a table-reservation-api
   ```
   - [ ] Rollback complete
   - [ ] Verify: `fly status -a table-reservation-api`

3. [ ] Rollback frontend
   - [ ] On Vercel: Deployments tab → Find last working deploy → Redeploy
   - [ ] Verify: Site loads OK

4. [ ] Verify rollback worked
   - [ ] Try public booking
   - [ ] See healthy state
   - [ ] Update status page: "Service restored"

### Post-Incident (< 30 minutes)
- [ ] Gather error logs from Sentry
- [ ] Screenshot Fly.io metrics showing failure point
- [ ] Document what went wrong
- [ ] Schedule incident postmortem

---

## 📞 CONTACTS

**On-Call Support:**
- Backend/Infrastructure: [Name/Phone]
- Database/Supabase: [Name/Phone]  
- Frontend/Vercel: [Name/Phone]

**Emergency Escalation:**
- All hands alert: Slack #emergency
- CEO notification: [Name/Email]

---

## 📋 Sign-Off

**Deployment Team Members:**
- [ ] Lead: _________________ Time: _____
- [ ] Reviewer: _________________ Time: _____
- [ ] Monitor: _________________ Time: _____

**Deployment Status at Launch:**
- [ ] All critical items ✅ COMPLETE
- [ ] All tests ✅ PASSING
- [ ] System ✅ LIVE

**GO-LIVE AUTHORIZED:** _________ (Signature/Initials)

**Date & Time:** ______________________

---

## 🎯 First 24 Hours Checklist

- [ ] Hour 0-1: Monitor errors intensively
- [ ] Hour 1-4: Check every hour
- [ ] Hour 4-8: Check every 2 hours
- [ ] Hour 8-24: Check every 4 hours
- [ ] Hour 24+: Check daily

**End of Day Brief (Plan for 4 PM meeting):**
- [ ] Total bookings: _____
- [ ] Conversion rate: _____%
- [ ] Errors: _____
- [ ] Double-bookings: _____
- [ ] Customer complaints: _____
- [ ] Issues resolved: _____

---

**Print Date:** ______________

**Printed By:** ______________

**Location:** ______________
