# Supabase Security Configuration Guide

This guide provides step-by-step instructions for configuring security settings in your Supabase project dashboard to enhance the PrayerApp's security posture.

## Table of Contents
1. [Password Policies](#password-policies)
2. [Authentication Settings](#authentication-settings)
3. [API Rate Limiting](#api-rate-limiting)
4. [CORS Configuration](#cors-configuration)
5. [Email Templates](#email-templates)
6. [Multi-Factor Authentication (MFA)](#multi-factor-authentication-mfa)

---

## Password Policies

### Accessing Password Settings

1. Navigate to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **Settings** → **Password Policies**

### Recommended Configuration

#### Minimum Requirements
```
✅ Minimum password length: 12 characters
✅ Require uppercase letters: Yes
✅ Require lowercase letters: Yes
✅ Require numbers: Yes
✅ Require special characters: Yes
✅ Password history: Last 3 passwords
```

#### Step-by-Step Setup

**1. Set Minimum Password Length**
- Locate "Minimum password length" field
- Enter: `12`
- Click "Save"

**2. Enable Character Requirements**
Check the following boxes:
- ✅ Require at least one uppercase letter (A-Z)
- ✅ Require at least one lowercase letter (a-z)
- ✅ Require at least one number (0-9)
- ✅ Require at least one special character (!@#$%^&*)

**3. Configure Password History**
- Enable "Prevent password reuse"
- Set to: `3` (prevents reusing last 3 passwords)

**4. Additional Settings**
```
Password reset expiration: 1 hour (3600 seconds)
Password reset rate limit: 5 requests per hour
```

### Verification

Test the new password policy:
1. Go to your app's registration page
2. Try creating an account with weak password: `test123`
3. Should receive error: "Password does not meet minimum requirements"
4. Try with strong password: `MySecure@Pass2024`
5. Should succeed ✅

---

## Authentication Settings

### Email Confirmation

Navigate to: **Authentication** → **Settings** → **Email Confirmation**

```
✅ Enable email confirmations
✅ Require email verification before login
⚙️  Email confirmation expiration: 24 hours
```

**Benefits:**
- Prevents fake email registrations
- Ensures users have valid email addresses
- Reduces spam accounts

### Session Settings

Navigate to: **Authentication** → **Settings** → **Sessions**

```
⚙️  JWT Expiry: 3600 seconds (1 hour)
⚙️  Refresh Token Expiry: 604800 seconds (7 days)
✅ Enable automatic token refresh
```

**Security Benefits:**
- Short JWT expiry limits damage from token theft
- Automatic refresh provides good UX while maintaining security
- 7-day refresh token requires re-authentication weekly

### Account Lockout

Navigate to: **Authentication** → **Settings** → **Security**

```
✅ Enable account lockout after failed login attempts
⚙️  Failed login attempts before lockout: 5
⚙️  Lockout duration: 900 seconds (15 minutes)
✅ Send email notification on account lockout
```

**Protection Against:**
- Brute force attacks
- Credential stuffing
- Automated login attempts

---

## API Rate Limiting

### Accessing Rate Limit Settings

Navigate to: **Settings** → **API** → **Rate Limiting**

### Recommended Limits

#### Anonymous Requests (Unauthenticated)
```
⚙️  Requests per second: 10
⚙️  Requests per minute: 100
⚙️  Requests per hour: 1,000
```

#### Authenticated Requests
```
⚙️  Requests per second: 50
⚙️  Requests per minute: 500
⚙️  Requests per hour: 10,000
```

#### Specific Endpoints

**Authentication Endpoints:**
```
POST /auth/v1/signup: 5 requests per 5 minutes per IP
POST /auth/v1/token: 10 requests per 5 minutes per IP
POST /auth/v1/recover: 3 requests per hour per email
```

**Database Queries:**
```
GET /rest/v1/*: 100 requests per minute per user
POST /rest/v1/*: 50 requests per minute per user
```

**Real-time Subscriptions:**
```
WebSocket connections: 5 concurrent connections per user
Channel subscriptions: 10 channels per connection
```

### Configuration Steps

1. Navigate to **Settings** → **API** → **Rate Limiting**
2. Click "Add Custom Limit"
3. Configure each endpoint pattern
4. Set limits based on your application's needs
5. Click "Save Changes"

### Monitoring Rate Limits

View rate limit metrics:
```
Dashboard → Logs → API Logs
Filter by: "Rate limit exceeded"
```

Set up alerts:
```
Dashboard → Settings → Alerts
Create alert: "Rate limit exceeded > 100 times in 5 minutes"
Notification: Email to admins
```

---

## CORS Configuration

### Accessing CORS Settings

Navigate to: **Settings** → **API** → **CORS**

### Production Configuration

```javascript
Allowed Origins:
- https://yourdomain.com
- https://www.yourdomain.com
- https://app.yourdomain.com

Allowed Methods:
- GET
- POST
- PUT
- PATCH
- DELETE
- OPTIONS

Allowed Headers:
- authorization
- content-type
- x-client-info
- apikey

Allow Credentials: Yes
Max Age: 86400 (24 hours)
```

### Development Configuration

For local development, you may need to add:
```
http://localhost:3000
http://127.0.0.1:3000
```

**⚠️ Security Warning:**
Remove localhost origins before deploying to production!

### Verification

Test CORS configuration:
```bash
curl -H "Origin: https://yourdomain.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  -X OPTIONS \
  https://yourproject.supabase.co/rest/v1/profiles
```

Expected response should include:
```
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE
```

---

## Email Templates

### Configure Secure Email Templates

Navigate to: **Authentication** → **Email Templates**

### 1. Confirmation Email

```html
<h2>Confirm Your Email Address</h2>
<p>Thanks for signing up for PrayerApp!</p>
<p>Click the link below to confirm your email address and activate your account:</p>
<a href="{{ .ConfirmationURL }}">Confirm Email</a>
<p>This link expires in 24 hours.</p>
<p><small>If you didn't sign up for PrayerApp, please ignore this email.</small></p>
```

**Security Features:**
- Clear call-to-action
- Expiration notice
- Warning for unsolicited emails

### 2. Password Reset Email

```html
<h2>Reset Your Password</h2>
<p>We received a request to reset your password for PrayerApp.</p>
<p>Click the link below to create a new password:</p>
<a href="{{ .ConfirmationURL }}">Reset Password</a>
<p>This link expires in 1 hour.</p>
<p><strong>If you didn't request this, please ignore this email and consider changing your password.</strong></p>
```

**Security Features:**
- Short expiration (1 hour)
- Strong warning for unsolicited resets
- Advises password change if suspicious

### 3. Magic Link Email

```html
<h2>Sign In to PrayerApp</h2>
<p>Click the link below to sign in:</p>
<a href="{{ .ConfirmationURL }}">Sign In</a>
<p>This link expires in 1 hour and can only be used once.</p>
<p><strong>If you didn't request this, someone may be attempting to access your account. Please contact support immediately.</strong></p>
```

**Security Features:**
- Single-use links
- Short expiration
- Security alert

---

## Multi-Factor Authentication (MFA)

### Enable MFA for Admins

Navigate to: **Authentication** → **Settings** → **MFA**

### Global MFA Settings

```
✅ Enable Multi-Factor Authentication (MFA)
✅ Allow users to enroll in MFA
⚙️  MFA methods: TOTP (Authenticator Apps)
✅ Require MFA for admin users (super_admin role)
⚙️  Grace period for MFA setup: 7 days
```

### Enforcing MFA for Admins

Run this SQL in **SQL Editor**:

```sql
-- Create policy to require MFA for admin access
CREATE OR REPLACE FUNCTION check_admin_mfa()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user is admin
  IF NEW.role = 'super_admin' THEN
    -- Check if MFA is enabled
    IF NOT EXISTS (
      SELECT 1 FROM auth.mfa_factors
      WHERE user_id = NEW.id
      AND status = 'verified'
    ) THEN
      -- Allow grace period (7 days after account creation)
      IF NEW.created_at > NOW() - INTERVAL '7 days' THEN
        -- Send warning notification
        PERFORM create_notification(
          NEW.id,
          'security_alert',
          '🔐 MFA Required',
          'As an admin, you must enable Multi-Factor Authentication within 7 days.',
          jsonb_build_object('days_remaining', 7 - EXTRACT(days FROM NOW() - NEW.created_at)),
          168
        );
      ELSE
        -- Downgrade to regular user
        NEW.role := 'user';
        RAISE NOTICE 'Admin % downgraded due to missing MFA', NEW.id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check MFA on profile updates
CREATE TRIGGER enforce_admin_mfa
BEFORE UPDATE ON profiles
FOR EACH ROW
WHEN (NEW.role = 'super_admin' AND OLD.role != 'super_admin')
EXECUTE FUNCTION check_admin_mfa();
```

### Testing MFA

1. **Enable MFA for your admin account:**
   ```typescript
   // In app code
   const { data, error } = await supabase.auth.mfa.enroll({
     factorType: 'totp',
     friendlyName: 'My Authenticator App'
   });

   // Show QR code to user
   const qrCode = data.totp.qr_code;
   ```

2. **Verify MFA setup:**
   ```typescript
   const { data, error } = await supabase.auth.mfa.verify({
     factorId: factorId,
     challengeId: challengeId,
     code: '123456' // User enters code from authenticator app
   });
   ```

3. **Test login with MFA:**
   - Sign out
   - Sign in with email/password
   - Should prompt for MFA code
   - Enter 6-digit code from authenticator app
   - Should successfully authenticate ✅

---

## Security Checklist

Use this checklist to verify all security settings are properly configured:

### Authentication
- [ ] Password minimum length: 12 characters
- [ ] Password complexity requirements enabled
- [ ] Password history: Last 3 passwords
- [ ] Email confirmation required
- [ ] Account lockout after 5 failed attempts
- [ ] MFA enabled and enforced for admins

### API & Rate Limiting
- [ ] Anonymous requests limited: 100/minute
- [ ] Authenticated requests limited: 500/minute
- [ ] Auth endpoint rate limits configured
- [ ] Real-time subscription limits set

### CORS
- [ ] Production domains whitelisted
- [ ] Localhost URLs removed (production only)
- [ ] Credentials allowed for authenticated requests

### Email Security
- [ ] Email templates updated with security warnings
- [ ] Magic link expiration: 1 hour
- [ ] Password reset expiration: 1 hour
- [ ] Confirmation expiration: 24 hours

### Row Level Security (RLS)
- [ ] RLS enabled on all tables
- [ ] Policies tested for each role
- [ ] No policy bypasses in service role usage

### Monitoring
- [ ] Rate limit alerts configured
- [ ] Failed login alerts enabled
- [ ] Admin action audit log active
- [ ] Email notifications for security events

---

## Automated Configuration Script

For quick setup, you can use this SQL script to configure many security settings:

```sql
-- Run in Supabase SQL Editor

-- 1. Create security settings table
CREATE TABLE IF NOT EXISTS security_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert default security settings
INSERT INTO security_settings (setting_key, setting_value) VALUES
  ('password_min_length', '12'),
  ('password_require_uppercase', 'true'),
  ('password_require_lowercase', 'true'),
  ('password_require_numbers', 'true'),
  ('password_require_special', 'true'),
  ('password_history_count', '3'),
  ('login_max_attempts', '5'),
  ('login_lockout_minutes', '15'),
  ('session_jwt_expiry_seconds', '3600'),
  ('session_refresh_expiry_seconds', '604800'),
  ('mfa_required_for_admins', 'true'),
  ('mfa_grace_period_days', '7')
ON CONFLICT (setting_key) DO UPDATE
  SET setting_value = EXCLUDED.setting_value,
      updated_at = NOW();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Security settings configured successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Configure password policies in Supabase Dashboard';
  RAISE NOTICE '2. Set up rate limiting for API endpoints';
  RAISE NOTICE '3. Configure CORS for your production domain';
  RAISE NOTICE '4. Test MFA enrollment and verification';
END $$;
```

---

## Support & Troubleshooting

### Common Issues

**Issue: Users can't sign up**
- Check password meets all requirements (12+ chars, uppercase, lowercase, number, special char)
- Verify email confirmation is not blocking signups
- Check rate limits haven't been exceeded

**Issue: Rate limits too restrictive**
- Review rate limit logs in Dashboard
- Adjust limits based on actual usage patterns
- Consider separate limits for different user roles

**Issue: CORS errors**
- Verify your domain is in the allowed origins list
- Check that `Allow Credentials` is enabled
- Ensure browser is sending the correct `Origin` header

**Issue: MFA not working**
- Verify time synchronization (TOTP requires accurate clocks)
- Check that the secret was properly saved during enrollment
- Try re-enrolling the MFA factor

### Getting Help

- **Supabase Documentation:** https://supabase.com/docs/guides/auth
- **Supabase Discord:** https://discord.supabase.com
- **Support Email:** support@supabase.io

---

## Maintenance Schedule

### Weekly
- [ ] Review failed login attempts
- [ ] Check rate limit violations
- [ ] Monitor MFA enrollment rates

### Monthly
- [ ] Review and update password policies
- [ ] Audit admin account MFA status
- [ ] Test email templates
- [ ] Review CORS configuration

### Quarterly
- [ ] Full security settings audit
- [ ] Update this configuration guide
- [ ] Review Supabase security updates
- [ ] Penetration testing of auth flows

---

**Last Updated:** 2025-11-22
**Configuration Version:** 1.0
**Supabase Version:** Latest
