// HOME AFRICA Email Service - JavaScript Client
// Directly calls Supabase Edge Functions to send emails

class HomeAfricaEmailService {
  constructor(supabaseUrl, supabaseAnonKey) {
    this.supabaseUrl = supabaseUrl || 'https://ojaofgrbyzwgwyzbyqnp.supabase.co';
    this.anonKey = supabaseAnonKey;
    this.functionsUrl = `${this.supabaseUrl}/functions/v1`;
  }

  // Generic function to call any email Edge Function
  async sendEmail(templateName, payload) {
    try {
      const response = await fetch(`${this.functionsUrl}/${templateName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.anonKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Email service error (${templateName}):`, errorText);
        return { success: false, error: errorText };
      }

      const data = await response.json();
      console.log(`✅ Email sent via ${templateName}:`, data);
      return { success: true, data };
    } catch (error) {
      console.error(`Failed to send email (${templateName}):`, error);
      return { success: false, error: error.message };
    }
  }

  // Send welcome email to new user
  async sendWelcomeEmail(userEmail, userName, role = 'user') {
    return this.sendEmail('welcome-email', {
      userEmail,
      userName: userName || userEmail.split('@')[0],
      role
    });
  }

  // Send new lead notification to merchant
  async sendLeadNotification(merchantEmail, merchantName, leadData) {
    return this.sendEmail('new-lead-notification', {
      merchantEmail,
      merchantName,
      leadName: leadData.name,
      leadEmail: leadData.email,
      leadPhone: leadData.phone,
      leadMessage: leadData.message,
      productTitle: leadData.productTitle,
      productType: leadData.productType, // 'apartment', 'car', 'land'
      productUrl: leadData.productUrl
    });
  }

  // Send payment confirmation
  async sendPaymentConfirmation(userEmail, userName, paymentData) {
    return this.sendEmail('payment-confirmation', {
      userEmail,
      userName,
      amount: paymentData.amount,
      currency: paymentData.currency || 'RWF',
      paymentMethod: paymentData.paymentMethod,
      reference: paymentData.reference,
      status: paymentData.status, // 'confirmed' or 'failed'
      description: paymentData.description,
      productTitle: paymentData.productTitle
    });
  }

  // Send new message notification
  async sendMessageNotification(recipientEmail, recipientName, messageData) {
    return this.sendEmail('new-message-notification', {
      recipientEmail,
      recipientName,
      senderName: messageData.senderName,
      messagePreview: messageData.preview,
      threadId: messageData.threadId,
      productTitle: messageData.productTitle,
      unreadCount: messageData.unreadCount || 1
    });
  }

  // Send role upgrade notification
  async sendRoleUpgrade(userEmail, userName, oldRole, newRole, approvedBy) {
    return this.sendEmail('role-upgrade', {
      userEmail,
      userName,
      oldRole,
      newRole,
      approvedBy,
      approvedAt: new Date().toISOString()
    });
  }

  // Send engagement notification (favorite, like, comment)
  async sendEngagementNotification(merchantEmail, merchantName, engagementData) {
    return this.sendEmail('engagement-notification', {
      merchantEmail,
      merchantName,
      engagementType: engagementData.type, // 'favorite', 'like', 'comment', 'share'
      productTitle: engagementData.productTitle,
      productType: engagementData.productType,
      productUrl: engagementData.productUrl,
      engagementUser: engagementData.userName,
      commentText: engagementData.comment,
      totalCount: engagementData.totalCount,
      dailyCount: engagementData.dailyCount
    });
  }

  // Send custom password reset email
  async sendPasswordReset(userEmail, userName, resetUrl, token) {
    return this.sendEmail('password-reset-custom', {
      userEmail,
      userName,
      resetToken: token,
      resetUrl,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    });
  }
}

// Create global instance (set your anon key)
const emailService = new HomeAfricaEmailService(
  'https://ojaofgrbyzwgwyzbyqnp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qYW9mZ3JieXp3Z3d5emJ5cW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE4MTgwMTIsImV4cCI6MjAzNzM5NDAxMn0.xxx' // Replace with your actual anon key
);

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HomeAfricaEmailService, emailService };
}
