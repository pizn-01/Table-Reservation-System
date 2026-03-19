# Security & Deployment Guide

## CRITICAL: Credentials Exposure Recovery

### What Happened
Supabase credentials were accidentally committed to the repository. **All credentials must be rotated immediately.**

### Immediate Actions (Complete within 1 hour)

#### Step 1: Rotate Supabase Credentials
1. Log into Supabase dashboard
2. Go to Project Settings → API
3. Click "Rotate" on ANON_KEY and SERVICE_ROLE_KEY
4. Save new keys securely
5. Delete any old keys from version control

#### Step 2: Rotate JWT Secret
1. Generate new JWT secret:
   ```bash
   openssl rand -base64 32
   ```
2. Store temporarily in secure location
3. Will be set via fly secrets in Step 4

#### Step 3: Verify .env is Not Staged
```bash
git rm --cached backend/.env
git rm --cached .env
```

#### Step 4: Set Fly.io Secrets
```bash
# From project root directory
fly auth login

# Set secrets
fly secrets set \
  SUPABASE_URL="https://your-project.supabase.co" \
  SUPABASE_ANON_KEY="your-new-anon-key" \
  SUPABASE_SERVICE_ROLE_KEY="your-new-service-role-key" \
  JWT_SECRET="your-new-jwt-secret" \
  RESEND_API_KEY="your-resend-key"
```

#### Step 5: Deploy Updated Code
```bash
git add .gitignore backend/.env.example
git commit -m "chore: Remove exposed credentials, add security guide"
git push
fly deploy
```

### Verification
```bash
# Verify secrets are set
fly secrets list

# Check that .env is no longer tracked
git ls-files | grep -E "\.env$|\.env\.[a-z]"  # Should show nothing
```

---

## Development Setup

### Local Development
1. Copy `.env.example` to `backend/.env`
2. Get local Supabase credentials:
   ```bash
   # Use a dedicated dev/test Supabase project
   # Never use production credentials locally
   ```
3. Update placeholders in `.env`
4. Start development server:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

### Testing Environment
- Use separate Supabase project for testing
- Never use production credentials in tests
- Rotate test secrets quarterly

### Production Environment
- ALL secrets managed via `fly secrets set`
- Never committed to repository
- Rotate critical secrets every 90 days
- Audit secret access in Fly.io dashboard

---

## Pre-Launch Security Checklist

- [ ] All credentials rotated
- [ ] No .env files in git history (use `git filter-branch` if needed)
- [ ] All secrets set via `fly secrets set`
- [ ] .gitignore includes `.env` (verified)
- [ ] Environment isolated: dev/staging/production use different credentials
- [ ] SSL/TLS enabled on all endpoints
- [ ] CORS whitelist verified (no wildcards in production)
- [ ] SQL injection prevention verified (parameterized queries)
- [ ] Password hashing verified (bcrypt, scrypt, or Supabase Auth)
- [ ] Rate limiting configured on public endpoints
- [ ] Audit logging enabled
- [ ] Regular security scans scheduled
- [ ] Incident response plan documented

---

## Environment Variable Reference

### Required for Production

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://xyz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin) | Long JWT token |
| `JWT_SECRET` | Secret for signing JWTs | Min 32 characters |
| `RESEND_API_KEY` | Email service API key | `re_xxxxx...` |

### Development Only

| Variable | Description | Default |
|----------|-------------|---------|
| `SUPABASE_ANON_KEY` | Anon/public key | Can use in dev only |
| `NODE_ENV` | Environment | `development` |

---

## Monitoring & Maintenance

### Weekly
- [ ] Review application logs for errors
- [ ] Check API response times
- [ ] Monitor database query performance

### Monthly
- [ ] Review access logs for suspicious activity
- [ ] Update npm dependencies
- [ ] Test backup/restore procedures

### Quarterly
- [ ] Rotate JWT_SECRET and credentials
- [ ] Full security audit
- [ ] Update security documentation

---

## Emergency Procedures

### If Credentials Are Leaked Again
1. Immediately revoke all active tokens
2. Set `JWT_EXPIRES_IN=1h` (temporary hardening)
3. Rotate all secrets via `fly secrets set`
4. Force re-authentication of all users
5. Review audit logs for unauthorized access
6. Consider database restore if compromise occurred
7. Post-incident review

### Database Backup Strategy
- Automated daily backups via Supabase
- Test restore procedure monthly
- Off-site backup copy quarterly
- Recovery Time Objective (RTO): 2 hours
- Recovery Point Objective (RPO): 24 hours

---

**Document Version:** 1.0  
**Last Updated:** March 19, 2026  
**Next Review:** Before production launch
