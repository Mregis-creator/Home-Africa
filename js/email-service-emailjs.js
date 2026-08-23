// HOME AFRICA Email Service - EmailJS Version
// For testing without domain verification
// Sign up at: https://www.emailjs.com

class HomeAfricaEmailService {
  constructor() {
    // EmailJS Configuration - REPLACE THESE WITH YOUR VALUES
    this.serviceId = 'service_fu4ebub';      // Your EmailJS service ID
    this.publicKey = 'jajhnzR1AZ4LnNr20';    // Your EmailJS public key
    
    // Template ID - one generic HTML template handles all email types
    // In EmailJS dashboard, create ONE template with: {{to_email}}, {{to_name}}, {{subject}}, {{html_content}}
    this.templates = {
      generic: 'template_8j64wd6'  // Your existing template (reused for all emails)
    };
  }

  // Initialize EmailJS SDK
  init() {
    if (typeof emailjs !== 'undefined') {
      emailjs.init(this.publicKey);
      console.log('✅ EmailJS initialized');
      return true;
    } else {
      console.error('❌ EmailJS SDK not loaded. Add: <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>');
      return false;
    }
  }

  // Generic send function
  async sendEmail(templateId, templateParams) {
    try {
      if (typeof emailjs === 'undefined') {
        throw new Error('EmailJS SDK not loaded');
      }

      const result = await emailjs.send(
        this.serviceId,
        templateId,
        templateParams
      );

      console.log('✅ Email sent:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Email failed:', error);
      return { success: false, error: error.message || error.text };
    }
  }

  // Base HTML email template with banner image
  getBaseEmailTemplate(content) {
    return `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <!-- Banner Header -->
        <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 0; display: block; background-color: #000000; line-height: 0; font-size: 0;">
          <img src="https://raw.githubusercontent.com/Mregis-creator/Home-Africa/main/TheUltimateBanner.jpeg" 
               alt="HOME AFRICA - Beyond Horizons" 
               style="width: 100%; max-width: 600px; height: auto; display: block; border: 0; outline: 0;" />
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px; background: #ffffff; color: #333;">
          ${content}
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 20px; background: #f8f9fa; color: #666; font-size: 12px; border-top: 1px solid #e0e0e0;">
          <p style="margin: 5px 0;">&copy; 2025 HOME AFRICA. All rights reserved.</p>
          <p style="margin: 5px 0;">This is an automated email. Please do not reply.</p>
        </div>
      </div>
    `;
  }

  // Send welcome email with role-specific business hooks
  async sendWelcomeEmail(userEmail, userName, role = 'user') {
    // Role-specific messaging
    const roleContent = {
      user: {
        headline: 'Find Your Dream Property',
        hook: 'Discover exclusive listings, personalized recommendations, and connect directly with verified agents and property owners.',
        benefits: ['Browse 1000+ verified properties', 'Save favorites & get price alerts', 'Connect with agents instantly'],
        cta: 'Start Exploring',
        ctaUrl: 'https://homeafrica.it.com/listings.html'
      },
      merchant: {
        headline: 'Grow Your Real Estate Business',
        hook: 'Welcome to your new sales channel. List properties, receive qualified leads, and close deals faster with HOME AFRICA\'s marketplace.',
        benefits: ['Post unlimited property listings', 'Receive direct buyer inquiries', 'Track leads & analytics dashboard'],
        cta: 'Merchant Dashboard',
        ctaUrl: 'https://homeafrica.it.com/merchant-dashboard.html'
      },
      agent: {
        headline: 'Elevate Your Real Estate Career',
        hook: 'Manage client portfolios, access exclusive listings, and leverage our platform to close more deals with powerful tools.',
        benefits: ['Manage client portfolios', 'Access premium listings early', 'Commission tracking & reports'],
        cta: 'Agent Dashboard',
        ctaUrl: 'https://homeafrica.it.com/agent-dashboard.html'
      },
      support: {
        headline: 'Your Admin Command Center',
        hook: 'Access user management tools, support tickets, and platform analytics to keep HOME AFRICA running smoothly.',
        benefits: ['User & role management', 'Support ticket system', 'Platform analytics & insights'],
        cta: 'Admin Panel',
        ctaUrl: 'https://homeafrica.it.com/support-dashboard.html'
      },
      dev: {
        headline: 'Developer Access Granted',
        hook: 'Full platform access, API keys, feature flags, and development tools to build the future of HOME AFRICA.',
        benefits: ['API access & documentation', 'Feature flag controls', 'System logs & debugging tools'],
        cta: 'Dev Console',
        ctaUrl: 'https://homeafrica.it.com/dev-dashboard.html'
      }
    };

    // Normalize role and get content
    const normalizedRole = (role || 'user').toLowerCase().trim();
    const r = roleContent[normalizedRole] || roleContent.user;
    const benefitsList = r.benefits.map(b => `<li style="margin: 8px 0; color: #1a202c;">✅ ${b}</li>`).join('');

    const content = `
      <h2 style="color: #00c853; margin-top: 0; font-size: 24px; font-weight: 600;">Hi ${userName},</h2>
      
      <div style="background: linear-gradient(135deg, #0a1929 0%, #0d2b2a 100%); border-left: 4px solid #00e6d8; border-radius: 12px; padding: 25px; margin: 25px 0;">
        <h3 style="color: #00e6d8; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 15px;">${r.headline}</h3>
        <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0;">${r.hook}</p>
      </div>

      <p style="color: #1a202c; font-size: 16px; line-height: 1.6; margin-bottom: 10px;"><strong>Your account type:</strong> <span style="background: linear-gradient(90deg, #00e6d8, #00c853); color: #fff; padding: 4px 14px; border-radius: 20px; font-size: 13px; text-transform: uppercase; display: inline-block; white-space: nowrap; letter-spacing: 1px;">${normalizedRole}</span></p>

      <ul style="list-style: none; padding: 0; margin: 20px 0; font-size: 16px;">
        ${benefitsList}
      </ul>

      <div style="text-align: center; margin: 35px 0;">
        <a href="${r.ctaUrl}" 
           style="background: linear-gradient(90deg, #00e6d8, #00c853); color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          ${r.cta} →
        </a>
      </div>

      <p style="color: #1a202c; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">Need help? Contact us at <a href="mailto:support@homeafrica.it.com" style="color: #00c853;">support@homeafrica.it.com</a></p>
    `;

    return this.sendEmail(this.templates.generic, {
      to_email: userEmail,
      to_name: userName,
      subject: `${r.headline} — Welcome to HOME AFRICA`,
      html_content: this.getBaseEmailTemplate(content)
    });
  }

  // Send lead notification to merchant
  async sendLeadNotification(merchantEmail, merchantName, leadData) {
    const content = `
      <h2 style="color: #00c853; margin-top: 0; font-size: 24px; font-weight: 600;">New Lead Alert!</h2>

      <div style="background: linear-gradient(135deg, #0a1929 0%, #0d2b2a 100%); border-left: 4px solid #00e6d8; border-radius: 12px; padding: 25px; margin: 25px 0;">
        <h3 style="color: #00e6d8; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 15px;">Someone is interested in your listing</h3>
        <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0;">A potential buyer has reached out about <strong>${leadData.productTitle || 'your property'}</strong>.</p>
      </div>

      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h4 style="color: #1a202c; margin-top: 0; font-size: 18px;">Lead Details</h4>
        <p style="color: #1a202c; margin: 8px 0;"><strong>Name:</strong> ${leadData.name}</p>
        <p style="color: #1a202c; margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${leadData.email}" style="color: #00c853;">${leadData.email}</a></p>
        <p style="color: #1a202c; margin: 8px 0;"><strong>Phone:</strong> ${leadData.phone || 'Not provided'}</p>
        <p style="color: #1a202c; margin: 8px 0;"><strong>Property:</strong> ${leadData.productTitle || 'N/A'} (${leadData.productType || 'Property'})</p>
        <div style="background: #fff; border-left: 3px solid #00e6d8; padding: 12px 15px; margin-top: 12px; border-radius: 0 6px 6px 0;">
          <p style="color: #1a202c; margin: 0; font-style: italic;">"${leadData.message}"</p>
        </div>
      </div>

      <div style="text-align: center; margin: 35px 0;">
        <a href="${leadData.productUrl || 'https://homeafrica.it.com/merchant-dashboard.html'}" style="background: linear-gradient(90deg, #00e6d8, #00c853); color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Property →</a>
      </div>

      <p style="color: #1a202c; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">Need help? Contact us at <a href="mailto:support@homeafrica.it.com" style="color: #00c853;">support@homeafrica.it.com</a></p>
    `;

    return this.sendEmail(this.templates.generic, {
      to_email: merchantEmail,
      to_name: merchantName,
      subject: `New Lead: ${leadData.productTitle || 'Property Inquiry'} — HOME AFRICA`,
      html_content: this.getBaseEmailTemplate(content)
    });
  }

  // Send payment confirmation
  async sendPaymentConfirmation(userEmail, userName, paymentData) {
    const statusColor = paymentData.status === 'confirmed' ? '#00c853' : (paymentData.status === 'pending' ? '#ffc107' : '#ff4444');
    const statusBg = paymentData.status === 'confirmed' ? 'rgba(0,200,83,0.1)' : (paymentData.status === 'pending' ? 'rgba(255,193,7,0.1)' : 'rgba(255,68,68,0.1)');

    const content = `
      <h2 style="color: #00c853; margin-top: 0; font-size: 24px; font-weight: 600;">Payment ${paymentData.status === 'confirmed' ? 'Confirmed' : 'Update'}</h2>

      <div style="background: linear-gradient(135deg, #0a1929 0%, #0d2b2a 100%); border-left: 4px solid #00e6d8; border-radius: 12px; padding: 25px; margin: 25px 0;">
        <h3 style="color: #00e6d8; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 15px;">Thank you, ${userName}</h3>
        <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0;">Your payment for <strong>${paymentData.productTitle || paymentData.description}</strong> has been received.</p>
      </div>

      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h4 style="color: #1a202c; margin-top: 0; font-size: 18px;">Payment Details</h4>
        <p style="color: #1a202c; margin: 8px 0;"><strong>Amount:</strong> ${paymentData.amount?.toLocaleString()} ${paymentData.currency || 'RWF'}</p>
        <p style="color: #1a202c; margin: 8px 0;"><strong>Method:</strong> ${paymentData.paymentMethod}</p>
        <p style="color: #1a202c; margin: 8px 0;"><strong>Reference:</strong> <code style="background: #e9ecef; padding: 2px 8px; border-radius: 4px;">${paymentData.reference}</code></p>
        <p style="color: #1a202c; margin: 8px 0;"><strong>Description:</strong> ${paymentData.description}</p>
        <p style="color: #1a202c; margin: 8px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <div style="display: inline-block; background: ${statusBg}; color: ${statusColor}; padding: 6px 16px; border-radius: 20px; font-weight: bold; text-transform: uppercase; font-size: 13px; margin-top: 10px; border: 1px solid ${statusColor};">
          ${paymentData.status}
        </div>
      </div>

      <div style="text-align: center; margin: 35px 0;">
        <a href="https://homeafrica.it.com/payments.html" style="background: linear-gradient(90deg, #00e6d8, #00c853); color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Receipt →</a>
      </div>

      <p style="color: #1a202c; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">Questions? Contact us at <a href="mailto:support@homeafrica.it.com" style="color: #00c853;">support@homeafrica.it.com</a></p>
    `;

    return this.sendEmail(this.templates.generic, {
      to_email: userEmail,
      to_name: userName,
      subject: `Payment ${paymentData.status === 'confirmed' ? 'Confirmed' : 'Update'} — ${paymentData.productTitle || 'HOME AFRICA'}`,
      html_content: this.getBaseEmailTemplate(content)
    });
  }

  // Send new message notification
  async sendMessageNotification(recipientEmail, recipientName, messageData) {
    const content = `
      <h2 style="color: #00c853; margin-top: 0; font-size: 24px; font-weight: 600;">New Message</h2>

      <div style="background: linear-gradient(135deg, #0a1929 0%, #0d2b2a 100%); border-left: 4px solid #00e6d8; border-radius: 12px; padding: 25px; margin: 25px 0;">
        <h3 style="color: #00e6d8; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 15px;">Hi ${recipientName},</h3>
        <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0;"><strong>${messageData.senderName}</strong> sent you a message about <strong>${messageData.productTitle || 'your listing'}</strong>.</p>
      </div>

      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="color: #1a202c; margin: 0; font-style: italic;">"${messageData.preview}"</p>
      </div>

      ${messageData.unreadCount > 1 ? `<p style="color: #1a202c; font-size: 14px;">You have <strong>${messageData.unreadCount}</strong> unread messages.</p>` : ''}

      <div style="text-align: center; margin: 35px 0;">
        <a href="https://homeafrica.it.com/messages.html?thread=${messageData.threadId}" style="background: linear-gradient(90deg, #00e6d8, #00c853); color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reply Now →</a>
      </div>

      <p style="color: #1a202c; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">Need help? Contact us at <a href="mailto:support@homeafrica.it.com" style="color: #00c853;">support@homeafrica.it.com</a></p>
    `;

    return this.sendEmail(this.templates.generic, {
      to_email: recipientEmail,
      to_name: recipientName,
      subject: `New Message from ${messageData.senderName} — HOME AFRICA`,
      html_content: this.getBaseEmailTemplate(content)
    });
  }

  // Send role upgrade notification
  async sendRoleUpgrade(userEmail, userName, oldRole, newRole, approvedBy) {
    const benefits = {
      merchant: 'Post unlimited listings, receive leads, analytics dashboard',
      agent: 'Manage client portfolios, exclusive listings access',
      support: 'Access user management and support tools',
      dev: 'Full platform access and developer tools'
    };

    const content = `
      <h2 style="color: #00c853; margin-top: 0; font-size: 24px; font-weight: 600;">Role Upgraded!</h2>

      <div style="background: linear-gradient(135deg, #0a1929 0%, #0d2b2a 100%); border-left: 4px solid #00e6d8; border-radius: 12px; padding: 25px; margin: 25px 0;">
        <h3 style="color: #00e6d8; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 15px;">Congratulations, ${userName}!</h3>
        <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0;">Your account has been upgraded from <strong>${oldRole}</strong> to <strong>${newRole}</strong> by ${approvedBy}.</p>
      </div>

      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h4 style="color: #1a202c; margin-top: 0; font-size: 18px;">Your New Benefits</h4>
        <p style="color: #1a202c; margin: 8px 0;">${benefits[newRole] || 'Enhanced platform features'}</p>
        <p style="color: #1a202c; margin: 8px 0; font-size: 14px;"><strong>Upgraded on:</strong> ${new Date().toLocaleDateString()}</p>
      </div>

      <div style="text-align: center; margin: 35px 0;">
        <a href="https://homeafrica.it.com/${newRole}-dashboard.html" style="background: linear-gradient(90deg, #00e6d8, #00c853); color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Dashboard →</a>
      </div>

      <p style="color: #1a202c; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">Need help? Contact us at <a href="mailto:support@homeafrica.it.com" style="color: #00c853;">support@homeafrica.it.com</a></p>
    `;

    return this.sendEmail(this.templates.generic, {
      to_email: userEmail,
      to_name: userName,
      subject: `Account Upgraded to ${newRole} — HOME AFRICA`,
      html_content: this.getBaseEmailTemplate(content)
    });
  }

  // Send engagement notification
  async sendEngagementNotification(merchantEmail, merchantName, engagementData) {
    const actionTexts = {
      favorite: 'added to favorites',
      like: 'liked',
      comment: 'commented on',
      share: 'shared'
    };

    const action = actionTexts[engagementData.type] || engagementData.type;

    const content = `
      <h2 style="color: #00c853; margin-top: 0; font-size: 24px; font-weight: 600;">New Activity on Your Listing</h2>

      <div style="background: linear-gradient(135deg, #0a1929 0%, #0d2b2a 100%); border-left: 4px solid #00e6d8; border-radius: 12px; padding: 25px; margin: 25px 0;">
        <h3 style="color: #00e6d8; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 15px;">Hi ${merchantName},</h3>
        <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0;"><strong>${engagementData.userName}</strong> ${action} <strong>${engagementData.productTitle || 'your listing'}</strong>.</p>
      </div>

      ${engagementData.comment ? `<div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;"><p style="color: #1a202c; margin: 0; font-style: italic;">"${engagementData.comment}"</p></div>` : ''}

      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="color: #1a202c; margin: 8px 0;"><strong>Total ${engagementData.type}s:</strong> ${engagementData.totalCount || 0}</p>
        <p style="color: #1a202c; margin: 8px 0;"><strong>Today:</strong> ${engagementData.dailyCount || 1}</p>
      </div>

      <div style="text-align: center; margin: 35px 0;">
        <a href="${engagementData.productUrl || 'https://homeafrica.it.com/merchant-dashboard.html#analytics'}" style="background: linear-gradient(90deg, #00e6d8, #00c853); color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Analytics →</a>
      </div>

      <p style="color: #1a202c; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">Need help? Contact us at <a href="mailto:support@homeafrica.it.com" style="color: #00c853;">support@homeafrica.it.com</a></p>
    `;

    return this.sendEmail(this.templates.generic, {
      to_email: merchantEmail,
      to_name: merchantName,
      subject: `New ${engagementData.type} on ${engagementData.productTitle || 'your listing'} — HOME AFRICA`,
      html_content: this.getBaseEmailTemplate(content)
    });
  }

  /**
   * Send password reset.
   *
   * @deprecated Password reset now uses Supabase's built-in recovery flow
   * (supabase.auth.resetPasswordForEmail → reset-password.html), which sends its
   * own email. Only Supabase Auth can mint a link that grants the recovery
   * session required to actually change a password — any link this method sends
   * would carry a homegrown token that cannot change anything. Do not re-wire
   * this into the reset path. Kept only so the branded template survives for
   * reference when styling the Supabase email template.
   */
  async sendPasswordReset(userEmail, userName, resetUrl, token) {
    const content = `
      <h2 style="color: #00c853; margin-top: 0; font-size: 24px; font-weight: 600;">Password Reset Request</h2>

      <div style="background: linear-gradient(135deg, #0a1929 0%, #0d2b2a 100%); border-left: 4px solid #00e6d8; border-radius: 12px; padding: 25px; margin: 25px 0;">
        <h3 style="color: #00e6d8; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 15px;">Hi ${userName},</h3>
        <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0;">We received a request to reset your HOME AFRICA password. Click the button below to set a new password.</p>
      </div>

      <div style="text-align: center; margin: 35px 0;">
        <a href="${resetUrl}" style="background: linear-gradient(90deg, #00e6d8, #00c853); color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password →</a>
      </div>

      <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="color: #856404; margin: 0; font-size: 14px;"><strong>Security tip:</strong> This link expires in <strong>24 hours</strong>. If you didn't request this, ignore this email — your account is safe.</p>
      </div>

      <p style="color: #666; font-size: 13px; margin-top: 20px;">If the button doesn't work, copy and paste this link:</p>
      <p style="color: #00c853; font-size: 12px; word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;">${resetUrl}</p>

      <p style="color: #1a202c; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">Need help? Contact us at <a href="mailto:support@homeafrica.it.com" style="color: #00c853;">support@homeafrica.it.com</a></p>
    `;

    return this.sendEmail(this.templates.generic, {
      to_email: userEmail,
      to_name: userName,
      subject: 'Password Reset — HOME AFRICA',
      html_content: this.getBaseEmailTemplate(content)
    });
  }
}

// Create global instance
const emailService = new HomeAfricaEmailService();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  emailService.init();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HomeAfricaEmailService, emailService };
}
