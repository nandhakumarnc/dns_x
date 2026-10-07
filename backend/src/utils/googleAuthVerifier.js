import dns from 'dns';

dns.promises.setServers(['8.8.8.8', '1.1.1.1']);

/**
 * Validates Google account format and checks DNS MX records for Google Workspace / Gmail.
 * Never requests, validates, or handles user passwords.
 *
 * @param {string} email - Google email or Gmail ID
 * @returns {Promise<{ verified: boolean, error?: string, email?: string, username?: string, provider?: string, accountType?: string, domain?: string, verifiedAt?: string }>}
 */
export async function verifyGoogleAccount(email) {
  // 1. Mandatory Email Validation
  if (!email || typeof email !== 'string') {
    return {
      verified: false,
      error: 'Google account / Gmail address is required. Input cannot be empty.',
    };
  }

  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) {
    return {
      verified: false,
      error: 'Google account / Gmail address is required. Input cannot be empty.',
    };
  }

  // RFC 5322 basic pattern
  const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
  if (!emailRegex.test(trimmedEmail)) {
    return {
      verified: false,
      error: 'Invalid Gmail address format. Please enter a valid Google account (e.g. username@gmail.com).',
    };
  }

  const [localPart, domain] = trimmedEmail.split('@');
  if (!localPart || !domain) {
    return {
      verified: false,
      error: 'Incomplete email address.',
    };
  }

  // 2. Direct Gmail / Googlemail Verification
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    // Google username requirements: 6-30 chars, alphanumeric or periods
    const normalizedLocal = localPart.replace(/\./g, '');
    if (normalizedLocal.length < 6) {
      return {
        verified: false,
        error: 'Google account username is too short (minimum 6 characters required by Google).',
      };
    }
    if (normalizedLocal.length > 30) {
      return {
        verified: false,
        error: 'Google account username is too long (maximum 30 characters allowed by Google).',
      };
    }
    if (!/^[a-z0-9.]+$/.test(localPart)) {
      return {
        verified: false,
        error: 'Google usernames can only contain letters (a-z), numbers (0-9), and periods (.).',
      };
    }
    if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
      return {
        verified: false,
        error: 'Google usernames cannot begin, end, or contain consecutive periods.',
      };
    }

    return {
      verified: true,
      email: trimmedEmail,
      username: localPart,
      provider: 'google',
      accountType: 'consumer',
      domain: 'gmail.com',
      verifiedAt: new Date().toISOString(),
    };
  }

  // 3. Custom Domain (Google Workspace) Verification via DNS MX
  try {
    const mxRecords = await dns.promises.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return {
        verified: false,
        error: `Domain '${domain}' has no active MX records configured in DNS.`,
      };
    }

    const googleMx = mxRecords.some(r => {
      const ex = (r.exchange || '').toLowerCase();
      return (
        ex.includes('google.com') ||
        ex.includes('googlemail.com') ||
        ex.includes('aspmx.l.google.com') ||
        ex.includes('smtp.google.com')
      );
    });

    if (!googleMx) {
      return {
        verified: false,
        error: `Domain '${domain}' is not registered with Google Workspace (no Google MX mail servers found). Please use an active Google account.`,
      };
    }

    return {
      verified: true,
      email: trimmedEmail,
      username: localPart,
      provider: 'google',
      accountType: 'workspace',
      domain: domain,
      verifiedAt: new Date().toISOString(),
    };
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'NODATA' || err.code === 'ENODATA') {
      return {
        verified: false,
        error: `The domain '${domain}' does not exist or has no DNS mail records.`,
      };
    }
    return {
      verified: false,
      error: `Could not verify domain '${domain}' against DNS infrastructure: ${err.message}`,
    };
  }
}
