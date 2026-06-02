// HOME AFRICA - Role Upgrade Notification Edge Function
// Triggered when admin changes a user's role

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { sendEmail, getBaseEmailTemplate } from '../_shared/email-service.ts';

interface RoleUpgradePayload {
  userEmail: string;
  userName?: string;
  oldRole: string;
  newRole: string;
  approvedBy?: string;
  approvedAt?: string;
  dashboardUrl?: string;
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
    const payload: RoleUpgradePayload = await req.json();
    
    const {
      userEmail,
      userName,
      oldRole,
      newRole,
      approvedBy,
      approvedAt,
      dashboardUrl,
    } = payload;

    if (!userEmail || !newRole) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const roleEmoji: Record<string, string> = {
      user: '👤',
      merchant: '🏪',
      agent: '🏠',
      support: '🎧',
      dev: '💻',
      admin: '⚙️',
    };

    const roleBenefits: Record<string, string[]> = {
      merchant: [
        'Create unlimited property listings',
        'Receive verified buyer leads',
        'Access lead CRM & tracking',
        'View analytics dashboard',
        'Priority customer support',
      ],
      agent: [
        'Multi-client management tools',
        'Commission tracking & reporting',
        'Client pipeline dashboard',
        'Deal closing tools',
        'Exclusive agent network access',
      ],
      support: [
        'Access user management tools',
        'View support tickets',
        'Content moderation capabilities',
      ],
      dev: [
        'Feature flag controls',
        'System monitoring access',
        'Debug logs & analytics',
      ],
      admin: [
        'Full platform administration',
        'Payment verification access',
        'User & merchant management',
        'System configuration controls',
      ],
    };

    const benefits = roleBenefits[newRole] || ['Enhanced platform access'];

    const content = `
      <div class="title-bar">
        <h1 style="color: #00d084;">🎉 Congratulations!</h1>
      </div>
      
      <p class="body-text">
        Hi ${userName || 'there'}, we're excited to inform you that your HOME AFRICA account has been upgraded!
      </p>
      
      <div style="background: linear-gradient(135deg, #00ffff 0%, #8fff00 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
        <div style="font-size: 48px; margin-bottom: 15px;">${roleEmoji[newRole] || '🌟'}</div>
        <p style="color: #000; font-size: 18px; font-weight: 700; margin: 0;">
          You are now a ${newRole.toUpperCase()}
        </p>
        ${oldRole ? `
        <p style="color: #333; font-size: 14px; margin: 10px 0 0 0;">
          Upgraded from ${oldRole}
        </p>
        ` : ''}
      </div>
      
      <div class="highlight-box">
        <h3>🎁 Your New Benefits</h3>
        ${benefits.map(benefit => `
        <div style="display: flex; align-items: center; margin: 12px 0;">
          <span style="color: #00d084; font-size: 20px; margin-right: 12px;">✓</span>
          <span style="color: #333; font-size: 15px;">${benefit}</span>
        </div>
        `).join('')}
      </div>
      
      ${approvedBy ? `
      <div style="background: #f0f7ff; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <p style="color: #666; font-size: 14px; margin: 0;">
          <strong>Approved by:</strong> ${approvedBy}<br>
          <strong>Date:</strong> ${approvedAt ? new Date(approvedAt).toLocaleString() : new Date().toLocaleString()}
        </p>
      </div>
      ` : ''}
      
      <center>
        <a href="${dashboardUrl || `https://home-africa.com/${newRole}-dashboard.html`}" class="cta-button">
          Access Your ${newRole.charAt(0).toUpperCase() + newRole.slice(1)} Dashboard →
        </a>
      </center>
      
      <div style="background: #e8f5e9; border-left: 4px solid #00d084; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
        <p style="color: #2e7d32; font-size: 14px; margin: 0;">
          <strong>💡 Getting Started:</strong> Check out your new dashboard and explore all the tools now available to you. 
          Need help? Contact our support team anytime.
        </p>
      </div>
      
      <p class="body-text">
        We're excited to see what you'll achieve with your upgraded account!
      </p>
      
      <p class="body-text">
        Best regards,<br>
        <strong>The HOME AFRICA Team</strong>
      </p>
    `;

    const result = await sendEmail({
      to: userEmail,
      subject: `🎉 Account Upgraded: You are now a ${newRole.charAt(0).toUpperCase() + newRole.slice(1)}!`,
      html: getBaseEmailTemplate(content, 'Role Upgrade Confirmation'),
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Role upgrade email error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
