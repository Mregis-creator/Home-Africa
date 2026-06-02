// HOME AFRICA Email Service - Shared utility for all Edge Functions
// Uses Resend API for HTML email delivery

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface EmailTemplateData {
  userName?: string;
  userEmail?: string;
  actionUrl?: string;
  productTitle?: string;
  productType?: string;
  productImage?: string;
  merchantName?: string;
  leadName?: string;
  leadEmail?: string;
  leadPhone?: string;
  leadMessage?: string;
  amount?: string;
  currency?: string;
  paymentMethod?: string;
  reference?: string;
  status?: string;
  oldRole?: string;
  newRole?: string;
  messagePreview?: string;
  senderName?: string;
  notificationCount?: number;
  engagementType?: string; // 'favorite', 'like', 'comment', 'share'
  engagementUser?: string;
  commentText?: string;
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'HOME AFRICA <regismuhakwa@gmail.com>';

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: payload.from || FROM_EMAIL,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      return { success: false, error };
    }

    const data = await response.json();
    console.log('Email sent successfully:', data.id);
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
}

// Base HTML email template matching HOME AFRICA branding
export function getBaseEmailTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f8f9fa;
      color: #333;
      line-height: 1.6;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
    }
    .header {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      padding: 0;
      display: block;
      background-color: #000000;
      line-height: 0;
      font-size: 0;
    }
    .header img {
      width: 100%;
      max-width: 600px;
      height: auto;
      display: block;
      border: 0;
      outline: 0;
    }
    .content {
      padding: 40px 30px;
    }
    .title-bar {
      border-left: 4px solid #00ffff;
      padding-left: 20px;
      margin-bottom: 25px;
    }
    .title-bar h1 {
      color: #00d084;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    .title-bar h2 {
      color: #00d084;
      font-size: 20px;
      font-weight: 600;
    }
    .body-text {
      color: #555;
      font-size: 16px;
      line-height: 1.8;
      margin-bottom: 20px;
    }
    .highlight-box {
      background: linear-gradient(135deg, #f0fffa 0%, #f5fff0 100%);
      border: 1px solid #00d084;
      border-radius: 12px;
      padding: 25px;
      margin: 25px 0;
    }
    .highlight-box h3 {
      color: #00d084;
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 15px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #888;
      font-weight: 600;
    }
    .info-value {
      color: #333;
      font-weight: 700;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(90deg, #00ffff 0%, #8fff00 100%);
      color: #000 !important;
      text-decoration: none;
      padding: 15px 40px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 16px;
      margin: 25px 0;
      text-align: center;
    }
    .cta-button:hover {
      box-shadow: 0 4px 20px rgba(0, 255, 255, 0.4);
    }
    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      color: #888;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .footer a {
      color: #00d084;
      text-decoration: none;
    }
    .social-links {
      margin-top: 20px;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: #00d084;
      font-size: 20px;
    }
    .notification-badge {
      display: inline-block;
      background: #ff4757;
      color: #fff;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      line-height: 24px;
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      margin-left: 5px;
    }
    @media (max-width: 600px) {
      .content { padding: 25px 20px; }
      .title-bar h1 { font-size: 20px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <img src="https://raw.githubusercontent.com/Mregis-creator/Home-Africa/main/TheUltimateBanner.jpeg" alt="HOME AFRICA - Beyond Horizons" />
    </div>
    
    <div class="content">
      ${content}
    </div>
    
    <div class="footer">
      <p>© 2026 <a href="https://home-africa.com">HOME AFRICA</a>. All rights reserved.</p>
      <p>This is an automated email. Please do not reply.</p>
      <div class="social-links">
        <a href="#">📘</a>
        <a href="#">📸</a>
        <a href="#">🐦</a>
        <a href="#">💼</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
