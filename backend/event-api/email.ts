import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_ADDRESS = process.env.SMTP_USER || 'events@foai.cloud';
const EVENT_NAME = 'Coastal Talent and Innovation Hack-A-Thon';
const EVENT_SHORT = 'CTIH';

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${EVENT_NAME}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f0f;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f0f;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:12px;overflow:hidden;border:1px solid #2a2a2a;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a1a 0%,#2a2a2a 100%);padding:32px 40px;border-bottom:2px solid #c9a84c;">
              <h1 style="margin:0;font-size:24px;color:#c9a84c;font-weight:700;letter-spacing:1px;">${EVENT_SHORT}</h1>
              <p style="margin:4px 0 0;font-size:13px;color:#888888;letter-spacing:0.5px;">${EVENT_NAME}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;color:#e0e0e0;font-size:15px;line-height:1.7;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #2a2a2a;text-align:center;">
              <p style="margin:0;font-size:12px;color:#666666;">
                &copy; ${new Date().getFullYear()} ${EVENT_NAME}. All rights reserved.
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#555555;">
                Powered by <a href="https://foai.cloud" style="color:#c9a84c;text-decoration:none;">foai.cloud</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send registration confirmation email with event access token.
 */
export async function sendRegistrationConfirmation(
  email: string,
  name: string,
  ticketType: 'in-person' | 'virtual',
  accessToken: string
): Promise<void> {
  const ticketLabel = ticketType === 'in-person' ? 'In-Person' : 'Virtual';

  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#ffffff;">Welcome, ${name}!</h2>
    <p>Your registration for <strong style="color:#c9a84c;">${EVENT_NAME}</strong> has been confirmed.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background-color:#222222;border-radius:8px;padding:20px;border-left:4px solid #c9a84c;">
          <p style="margin:0 0 8px;font-size:13px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Ticket Type</p>
          <p style="margin:0;font-size:18px;color:#ffffff;font-weight:600;">${ticketLabel}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Your Access Token</p>
    <div style="background-color:#222222;border-radius:8px;padding:16px;text-align:center;margin-bottom:24px;">
      <code style="font-size:18px;color:#c9a84c;letter-spacing:2px;">${accessToken}</code>
    </div>
    <p style="color:#999999;font-size:13px;">Keep this token safe — you will need it to access the event platform and check in on the day of the event.</p>
    <p style="margin-top:24px;">We look forward to seeing you there!</p>
  `;

  await transporter.sendMail({
    from: `"${EVENT_SHORT} Events" <${FROM_ADDRESS}>`,
    to: email,
    subject: `Registration Confirmed — ${EVENT_NAME}`,
    html: baseTemplate(content),
  });
}

/**
 * Send sponsor inquiry confirmation email.
 */
export async function sendSponsorInquiryConfirmation(
  email: string,
  contactName: string,
  tier: string
): Promise<void> {
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#ffffff;">Thank you, ${contactName}!</h2>
    <p>We have received your sponsorship inquiry for the <strong style="color:#c9a84c;">${tierLabel}</strong> tier at <strong>${EVENT_NAME}</strong>.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background-color:#222222;border-radius:8px;padding:20px;border-left:4px solid #c9a84c;">
          <p style="margin:0 0 4px;font-size:13px;color:#888888;">Tier of Interest</p>
          <p style="margin:0;font-size:18px;color:#c9a84c;font-weight:600;">${tierLabel}</p>
        </td>
      </tr>
    </table>
    <p>A member of our partnerships team will reach out within <strong>2 business days</strong> to discuss next steps and sponsorship benefits.</p>
    <p style="color:#999999;font-size:13px;margin-top:24px;">If you have any immediate questions, reply directly to this email.</p>
  `;

  await transporter.sendMail({
    from: `"${EVENT_SHORT} Partnerships" <${FROM_ADDRESS}>`,
    to: email,
    subject: `Sponsorship Inquiry Received — ${EVENT_NAME}`,
    html: baseTemplate(content),
  });
}

/**
 * Send sponsor onboarding complete email.
 */
export async function sendSponsorOnboardingComplete(
  email: string,
  contactName: string,
  sponsorPackageId: string
): Promise<void> {
  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#ffffff;">Onboarding Complete, ${contactName}!</h2>
    <p>Your sponsor onboarding for <strong style="color:#c9a84c;">${EVENT_NAME}</strong> has been processed successfully.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background-color:#222222;border-radius:8px;padding:20px;border-left:4px solid #c9a84c;">
          <p style="margin:0 0 4px;font-size:13px;color:#888888;">Sponsor Package ID</p>
          <p style="margin:0;font-size:18px;color:#c9a84c;font-weight:600;">${sponsorPackageId}</p>
        </td>
      </tr>
    </table>
    <p>Here is what happens next:</p>
    <ul style="padding-left:20px;color:#cccccc;">
      <li style="margin-bottom:8px;">Your company logo and bio will appear on the event website within 24 hours.</li>
      <li style="margin-bottom:8px;">Booth assignment details will be sent separately before the event.</li>
      <li style="margin-bottom:8px;">Attendee badges for your named representatives will be available at check-in.</li>
    </ul>
    <p style="color:#999999;font-size:13px;margin-top:24px;">Reference your Package ID in any future correspondence regarding your sponsorship.</p>
  `;

  await transporter.sendMail({
    from: `"${EVENT_SHORT} Partnerships" <${FROM_ADDRESS}>`,
    to: email,
    subject: `Sponsor Onboarding Complete — ${EVENT_NAME}`,
    html: baseTemplate(content),
  });
}
