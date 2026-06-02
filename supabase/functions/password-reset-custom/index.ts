// HOME AFRICA - Custom Password Reset Email Edge Function
// Enhanced version with better styling and tracking

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { sendEmail, getBaseEmailTemplate } from '../_shared/email-service.ts';

interface PasswordResetPayload {
  userEmail: string;
  userName?: string;
  resetToken: string;
  resetUrl: string;
  expiresAt: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const payload: PasswordResetPayload = await req.json();
    
    const {
      userEmail,
      userName,
      resetToken,
      resetUrl,
      expiresAt,
    } = payload;

    if (!userEmail || !resetToken || !resetUrl) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const expiresIn = expiresAt 
      ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))
      : 24;

    const content = `
      <div class="title-bar">
        <h1 style="color: #ff4757;">🔐 Reset Your Password</h1>
      </div>
      
      <p class="body-text">
        Hi ${userName || 'there'}, we received a request to reset your HOME AFRICA password. 
        Click the button below to create a new password.
      </p>
      
      <div style="background: #fff5f5; border: 1px solid #ff4757; border-radius: 12px; padding: 25px; margin: 25px 0;">
        <p style="color: #c62828; font-size: 14px; margin: 0 0 15px 0;">
          <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, 
          please ignore this email or contact support immediately.
        </p>
      </div>
      
      <center>
        <a href="${resetUrl}" class="cta-button" style="background: linear-gradient(90deg, #ff4757 0%, #ff6348 100%); color: #fff !important;">
          Reset Password Now →
        </a>
      </center>
      
      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
          <strong>Or copy and paste this link into your browser:</strong>
        </p>
        <p style="color: #00d084; font-size: 13px; margin: 0; word-break: break-all; font-family: monospace;">
          ${resetUrl}
        </p>
      </div>
      
      <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
        <p style="color: #e65100; font-size: 14px; margin: 0;">
          <strong>⏰ This link expires in ${expiresIn} hour${expiresIn > 1 ? 's' : ''}</strong><br>
          After that, you'll need to request a new password reset.
        </p>
      </div>
      
      <div style="background: #e8f5e9; border-left: 4px solid #00d084; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
        <p style="color: #2e7d32; font-size: 14px; margin: 0;">
          <strong>💡 Password Tips:</strong><br>
          • Use at least 8 characters<br>
          • Mix letters, numbers, and symbols<br>
          • Avoid using personal information
        </p>
      </div>
      
      <p class="body-text">
        Need help? Contact our support team at 
        <a href="mailto:support@home-africa.com" style="color: #00d084;">support@home-africa.com</a>
      </p>
      
      <p class="body-text">
        Best regards,<br>
        <strong>The HOME AFRICA Security Team</strong>
      </p>
    `;

    const result = await sendEmail({
      to: userEmail,
      subject: '🔐 Reset Your HOME AFRICA Password',
      html: getBaseEmailTemplate(content, 'Password Reset'),
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Password reset email error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
