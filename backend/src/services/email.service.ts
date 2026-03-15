/**
 * Pluggable email service with provider abstraction.
 * Currently uses a bypass (console logging) until an email provider is configured.
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailProvider {
  send(payload: EmailPayload): Promise<{ success: boolean; messageId?: string }>;
}

// ─── Console Provider (Bypass) ─────────────────────────

class ConsoleEmailProvider implements EmailProvider {
  async send(payload: EmailPayload) {
    console.log('─── EMAIL BYPASS ───────────────────────');
    console.log(`To:      ${payload.to}`);
    console.log(`Subject: ${payload.subject}`);
    console.log(`Body:    ${payload.text || payload.html.substring(0, 200)}...`);
    console.log('────────────────────────────────────────');
    return { success: true, messageId: `bypass-${Date.now()}` };
  }
}

// ─── Email Service ─────────────────────────────────────

class EmailService {
  private provider: EmailProvider;

  constructor() {
    // Default to console bypass until a provider is configured
    this.provider = new ConsoleEmailProvider();
  }

  /**
   * Set a different email provider (e.g., Resend, SendGrid, Postmark).
   */
  setProvider(provider: EmailProvider) {
    this.provider = provider;
  }

  /**
   * Send an email.
   */
  async send(payload: EmailPayload) {
    return this.provider.send(payload);
  }

  // ─── Template Helpers ──────────────────────────────────

  /**
   * Send a staff invitation email.
   */
  async sendStaffInvite(params: {
    to: string;
    staffName: string;
    restaurantName: string;
    inviteToken: string;
    baseUrl: string;
  }) {
    const inviteUrl = `${params.baseUrl}/accept-invite?token=${params.inviteToken}`;

    return this.send({
      to: params.to,
      subject: `You're invited to join ${params.restaurantName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to ${params.restaurantName}!</h2>
          <p>Hi ${params.staffName},</p>
          <p>You've been invited to join <strong>${params.restaurantName}</strong> on TableReserve.</p>
          <p>Click the button below to set up your account:</p>
          <a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">
            Accept Invitation
          </a>
          <p style="color:#666;margin-top:24px;font-size:13px;">
            If the button doesn't work, copy and paste this URL into your browser:<br/>
            <a href="${inviteUrl}">${inviteUrl}</a>
          </p>
        </div>
      `,
      text: `Hi ${params.staffName}, you've been invited to join ${params.restaurantName}. Accept your invitation here: ${inviteUrl}`,
    });
  }

  /**
   * Send a reservation confirmation email.
   */
  async sendReservationConfirmation(params: {
    to: string;
    guestName: string;
    restaurantName: string;
    date: string;
    time: string;
    partySize: number;
    confirmationId: string;
  }) {
    return this.send({
      to: params.to,
      subject: `Reservation Confirmed — ${params.restaurantName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your reservation is confirmed!</h2>
          <p>Hi ${params.guestName},</p>
          <p>Your reservation at <strong>${params.restaurantName}</strong> has been confirmed.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Date</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">${params.date}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Time</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">${params.time}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Party Size</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">${params.partySize} guests</td></tr>
            <tr><td style="padding:8px;color:#666;">Confirmation #</td><td style="padding:8px;font-weight:bold;">${params.confirmationId}</td></tr>
          </table>
          <p style="color:#666;font-size:13px;">Need to modify or cancel? Contact the restaurant directly or visit your reservations page.</p>
        </div>
      `,
      text: `Hi ${params.guestName}, your reservation at ${params.restaurantName} is confirmed for ${params.date} at ${params.time} (${params.partySize} guests). Confirmation #${params.confirmationId}`,
    });
  }

  /**
   * Send a reservation cancellation email.
   */
  async sendReservationCancellation(params: {
    to: string;
    guestName: string;
    restaurantName: string;
    date: string;
    time: string;
  }) {
    return this.send({
      to: params.to,
      subject: `Reservation Cancelled — ${params.restaurantName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reservation Cancelled</h2>
          <p>Hi ${params.guestName},</p>
          <p>Your reservation at <strong>${params.restaurantName}</strong> for ${params.date} at ${params.time} has been cancelled.</p>
          <p>If you'd like to rebook, visit our reservation page.</p>
        </div>
      `,
      text: `Hi ${params.guestName}, your reservation at ${params.restaurantName} for ${params.date} at ${params.time} has been cancelled.`,
    });
  }

  /**
   * Send a password reset email (backup — Supabase handles primary flow).
   */
  async sendPasswordReset(params: { to: string; resetUrl: string }) {
    return this.send({
      to: params.to,
      subject: 'Reset Your Password — TableReserve',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your Password</h2>
          <p>You requested a password reset. Click the button below to set a new password:</p>
          <a href="${params.resetUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">
            Reset Password
          </a>
          <p style="color:#666;margin-top:24px;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
      text: `You requested a password reset. Visit this link to set a new password: ${params.resetUrl}`,
    });
  }
}

export const emailService = new EmailService();
