# Multi-Factor Authentication (MFA) Implementation Guide

## Overview

This guide explains how to implement Time-based One-Time Password (TOTP) Multi-Factor Authentication using Supabase's built-in MFA support.

**Security Benefits:**
- Protects against password theft and credential stuffing
- Adds an extra layer of security for sensitive accounts
- Meets compliance requirements (SOC 2, HIPAA, etc.)
- Recommended for admin and author accounts

---

## Prerequisites

### 1. Enable MFA in Supabase Dashboard

1. Go to Supabase Dashboard → Authentication → Settings
2. Scroll to "Multi-Factor Authentication (MFA)"
3. Enable "Time-based One-Time Password (TOTP)"
4. Save changes

### 2. Install QR Code Library (Optional)

For displaying QR codes in the frontend:

```bash
cd frontend
npm install qrcode.react
npm install -D @types/qrcode.react
```

---

## Implementation Steps

### Step 1: MFA Enrollment Flow

Create a settings page where users can enable MFA.

```typescript
// frontend/app/settings/security/page.tsx
'use client';

import { useState } from 'react';
import { enrollMFA, verifyMFAEnrollment, getMFAStatus } from '@/lib/mfa-helpers';
import QRCode from 'qrcode.react';

export default function SecuritySettingsPage() {
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);

  const handleEnrollMFA = async () => {
    setEnrolling(true);
    const result = await enrollMFA('My Authenticator');

    if (result.success && result.qrCode && result.secret && result.factorId) {
      setQrCode(result.qrCode);
      setSecret(result.secret);
      setFactorId(result.factorId);
    } else {
      alert('Failed to enroll in MFA: ' + result.error);
    }
  };

  const handleVerifyMFA = async () => {
    if (!factorId || !verificationCode) {
      alert('Please enter the verification code');
      return;
    }

    const result = await verifyMFAEnrollment(factorId, verificationCode);

    if (result.success) {
      alert('MFA enabled successfully!');
      setMfaEnabled(true);
      setEnrolling(false);
      setQrCode('');
      setSecret('');
      setFactorId('');
      setVerificationCode('');
    } else {
      alert('Verification failed: ' + result.error);
    }
  };

  return (
    <div>
      <h1>Security Settings</h1>

      {!mfaEnabled && !enrolling && (
        <button onClick={handleEnrollMFA}>Enable Two-Factor Authentication</button>
      )}

      {enrolling && qrCode && (
        <div>
          <h2>Scan QR Code</h2>
          <p>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
          <QRCode value={qrCode} size={256} />

          <p>Or enter this code manually: <code>{secret}</code></p>

          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            maxLength={6}
          />
          <button onClick={handleVerifyMFA}>Verify & Enable</button>
        </div>
      )}

      {mfaEnabled && (
        <div>
          <p>✅ Two-Factor Authentication is enabled</p>
        </div>
      )}
    </div>
  );
}
```

### Step 2: MFA Login Flow

Update the login page to handle MFA challenges.

```typescript
// frontend/app/auth/login/page.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { challengeMFA, verifyMFACode, getMFAStatus } from '@/lib/mfa-helpers';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showMFA, setShowMFA] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [challengeId, setChallengeId] = useState('');

  const handleLogin = async () => {
    // Step 1: Sign in with password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('Login failed: ' + error.message);
      return;
    }

    // Step 2: Check if MFA is required
    const mfaStatus = await getMFAStatus();

    if (mfaStatus.enabled && mfaStatus.factors.length > 0) {
      const factor = mfaStatus.factors[0];
      setFactorId(factor.id);

      // Create MFA challenge
      const challenge = await challengeMFA(factor.id);

      if (challenge.success && challenge.challengeId) {
        setChallengeId(challenge.challengeId);
        setShowMFA(true);
      } else {
        alert('MFA challenge failed: ' + challenge.error);
      }
    } else {
      // No MFA required, redirect to dashboard
      window.location.href = '/dashboard';
    }
  };

  const handleMFAVerify = async () => {
    if (!factorId || !challengeId || !mfaCode) {
      alert('Please enter the 6-digit code');
      return;
    }

    const result = await verifyMFACode(factorId, challengeId, mfaCode);

    if (result.success) {
      window.location.href = '/dashboard';
    } else {
      alert('Invalid code: ' + result.error);
      setMfaCode('');
    }
  };

  if (showMFA) {
    return (
      <div>
        <h2>Two-Factor Authentication</h2>
        <p>Enter the 6-digit code from your authenticator app</p>
        <input
          type="text"
          placeholder="000000"
          value={mfaCode}
          onChange={(e) => setMfaCode(e.target.value)}
          maxLength={6}
        />
        <button onClick={handleMFAVerify}>Verify</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Sign In</button>
    </div>
  );
}
```

### Step 3: Enforce MFA for Admin Users

Add middleware to require MFA for admin routes.

```typescript
// frontend/middleware.ts
export async function middleware(req: NextRequest) {
  const supabase = createMiddlewareClient({ req, res });

  // Check admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // Check MFA assurance level
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (aalData?.currentLevel !== 'aal2') {
      // Redirect to MFA enrollment if not using MFA
      return NextResponse.redirect(new URL('/settings/security/mfa-required', req.url));
    }
  }

  return res;
}
```

---

## Best Practices

### Security
1. **Require MFA for Admin Accounts**: Always enforce MFA for super_admin role
2. **Backup Codes**: Generate recovery codes for account recovery
3. **Rate Limiting**: Limit MFA verification attempts to prevent brute force
4. **Session Management**: Require re-authentication for sensitive operations

### User Experience
1. **Clear Instructions**: Provide step-by-step setup instructions
2. **QR Code + Manual Entry**: Support both methods for enrollment
3. **Multiple Factors**: Allow users to enroll multiple devices
4. **Recovery Options**: Implement account recovery flow for lost devices

### Implementation
1. **Graceful Degradation**: Handle MFA gracefully if user doesn't have it enabled
2. **Remember Device**: Consider "Trust this device for 30 days" option
3. **Audit Logging**: Log all MFA events (enrollment, verification, failures)
4. **Notifications**: Email user when MFA is enabled/disabled

---

## Testing MFA

### Manual Testing Checklist

- [ ] Enroll in MFA with Google Authenticator
- [ ] Verify QR code and manual entry both work
- [ ] Complete enrollment verification
- [ ] Sign out and sign in with MFA
- [ ] Test with invalid MFA code (should fail)
- [ ] Test disabling MFA
- [ ] Test admin route protection with/without MFA

### Automated Tests

```typescript
// __tests__/mfa.test.ts
import { enrollMFA, verifyMFAEnrollment } from '@/lib/mfa-helpers';

describe('MFA Enrollment', () => {
  it('should enroll user in MFA', async () => {
    const result = await enrollMFA('Test Authenticator');
    expect(result.success).toBe(true);
    expect(result.qrCode).toBeDefined();
    expect(result.secret).toBeDefined();
  });

  it('should verify MFA code', async () => {
    // Mock TOTP code generation
    const code = '123456';
    const result = await verifyMFAEnrollment('factor-id', code);
    expect(result.success).toBe(true);
  });
});
```

---

## Troubleshooting

### Common Issues

**Issue: QR Code not scanning**
- Solution: Ensure QR code size is at least 200x200px
- Try manual entry of the secret key

**Issue: MFA codes not working**
- Solution: Check device time synchronization
- Ensure authenticator app is using correct time-based algorithm

**Issue: User locked out after losing device**
- Solution: Implement recovery codes during enrollment
- Provide admin override for account recovery

**Issue: MFA not required after login**
- Solution: Check Assurance Level (AAL) after sign in
- Ensure middleware is checking for AAL2

---

## Security Considerations

### Attack Vectors Mitigated by MFA

1. **Credential Stuffing**: MFA prevents access even with stolen passwords
2. **Phishing**: Attackers can't access account without the second factor
3. **Brute Force**: MFA makes password guessing ineffective
4. **Session Hijacking**: Even with stolen session, sensitive operations require MFA

### Remaining Risks

1. **SIM Swapping**: Use app-based TOTP instead of SMS
2. **Malware**: Device compromises can capture both factors
3. **Social Engineering**: Users can be tricked into providing MFA codes

### Mitigation Strategies

1. Use app-based TOTP (not SMS)
2. Educate users about phishing and social engineering
3. Monitor for unusual login patterns
4. Implement device fingerprinting
5. Require re-authentication for sensitive operations

---

## Resources

- [Supabase MFA Documentation](https://supabase.com/docs/guides/auth/auth-mfa)
- [TOTP RFC 6238](https://datatracker.ietf.org/doc/html/rfc6238)
- [OWASP MFA Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html)
- [Google Authenticator](https://support.google.com/accounts/answer/1066447)
- [Authy App](https://authy.com/)

---

## Next Steps

1. Enable MFA in Supabase dashboard
2. Create security settings page with enrollment flow
3. Update login page to handle MFA challenges
4. Enforce MFA for admin users
5. Implement recovery code generation
6. Add MFA event logging
7. Test thoroughly with real authenticator apps
