/**
 * Email Notification System
 * Handles sending emails for bookings, messages, signups, etc.
 * Uses EmailJS for client-side email sending (no backend required)
 */

class EmailNotificationSystem {
  constructor() {
    this.supabase = window.supabaseClient;
    
    // EmailJS Configuration
    // ⚠️ SETUP REQUIRED: Replace these with your EmailJS credentials
    // Get them from: https://dashboard.emailjs.com/admin/integration
    this.emailjsConfig = {
      publicKey: 'jajhnzR1AZ4LnNr20', // Replace with your EmailJS Public Key
      serviceId: 'service_fu4ebub', // Replace with your EmailJS Service ID
      templateId: 'template_8j64wd6' // Shared EmailJS template (matches email-service-emailjs.js)
    };
    
    // Initialize EmailJS if available
    if (typeof emailjs !== 'undefined' && this.emailjsConfig.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY') {
      try {
        emailjs.init(this.emailjsConfig.publicKey);
        console.log('✅ EmailJS initialized');
      } catch (error) {
        console.warn('⚠️ EmailJS initialization failed:', error);
      }
    }
  }

  /**
   * Check if EmailJS is configured and available
   */
  isEmailJSConfigured() {
    return typeof emailjs !== 'undefined' && 
           this.emailjsConfig.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY' &&
           this.emailjsConfig.serviceId !== 'YOUR_EMAILJS_SERVICE_ID' &&
           this.emailjsConfig.templateId !== 'YOUR_EMAILJS_TEMPLATE_ID';
  }

  /**
   * Send email via EmailJS (client-side, no backend required)
   * Falls back to storing in database if EmailJS is not configured
   * @param {object} emailData - Email data
   */
  async sendEmail(emailData) {
    try {
      // Try EmailJS first (if configured)
      if (this.isEmailJSConfigured()) {
        try {
          const result = await this.sendViaEmailJS(emailData);
          console.log('✅ Email sent via EmailJS:', result);
          
          // Also store in database for record keeping
          await this.storeEmailNotification({ ...emailData, status: 'sent', method: 'emailjs' });
          
          return { success: true, method: 'emailjs', result };
        } catch (emailjsError) {
          console.warn('⚠️ EmailJS failed, storing in database:', emailjsError);
          // Fall through to database storage
        }
      }

      // Fallback: Store in database for manual sending or later processing
      await this.storeEmailNotification({ ...emailData, status: 'pending', method: 'database' });
      console.log('📧 Email notification stored in database (EmailJS not configured)');
      
      return { success: true, method: 'database', message: 'Email stored for manual processing' };

    } catch (error) {
      console.error('❌ Error sending email:', error);
      // Store failed notification for retry
      await this.storeEmailNotification({ ...emailData, status: 'failed', error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email via EmailJS
   * @param {object} emailData - Email data
   */
  async sendViaEmailJS(emailData) {
    if (!this.isEmailJSConfigured()) {
      throw new Error('EmailJS not configured. Please set up EmailJS credentials.');
    }

    // Prepare EmailJS template parameters
    const templateParams = {
      to_email: emailData.to,
      subject: emailData.subject,
      message: emailData.html || emailData.text,
      html_content: emailData.html || emailData.text,
      text_content: emailData.text || emailData.html?.replace(/<[^>]*>/g, ''),
      // Additional fields that might be in emailData
      ...emailData.templateParams
    };

    // Send via EmailJS
    const response = await emailjs.send(
      this.emailjsConfig.serviceId,
      this.emailjsConfig.templateId,
      templateParams
    );

    return response;
  }

  /**
   * Store email notification in database
   */
  async storeEmailNotification(emailData) {
    try {
      if (!this.supabase) return;

      await this.supabase
        .from('email_notifications')
        .insert([{
          recipient_email: emailData.to,
          subject: emailData.subject,
          body: emailData.html || emailData.text,
          type: emailData.type || 'general',
          status: emailData.status || 'pending',
          created_at: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error storing email notification:', error);
    }
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(bookingData) {
    const { userEmail, userName, listingTitle, scheduledDate, merchantName } = bookingData;

    await this.sendEmail({
      to: userEmail,
      subject: `Booking Confirmed: ${listingTitle}`,
      type: 'booking_confirmation',
      html: `
        <h2>Booking Confirmed!</h2>
        <p>Hello ${userName},</p>
        <p>Your booking has been confirmed:</p>
        <ul>
          <li><strong>Property:</strong> ${listingTitle}</li>
          <li><strong>Merchant:</strong> ${merchantName}</li>
          <li><strong>Date & Time:</strong> ${new Date(scheduledDate).toLocaleString()}</li>
        </ul>
        <p>We'll send you a reminder 24 hours before your appointment.</p>
        <p>Best regards,<br>HOME AFRICA Team</p>
      `,
      text: `Booking Confirmed: ${listingTitle} on ${new Date(scheduledDate).toLocaleString()}`
    });

    // Also notify merchant
    await this.sendEmail({
      to: bookingData.merchantEmail,
      subject: `New Booking: ${listingTitle}`,
      type: 'booking_notification',
      html: `
        <h2>New Booking Received</h2>
        <p>Hello ${merchantName},</p>
        <p>You have received a new booking:</p>
        <ul>
          <li><strong>Property:</strong> ${listingTitle}</li>
          <li><strong>Customer:</strong> ${userName}</li>
          <li><strong>Email:</strong> ${userEmail}</li>
          <li><strong>Date & Time:</strong> ${new Date(scheduledDate).toLocaleString()}</li>
        </ul>
        <p>Please confirm the appointment and prepare for the viewing.</p>
      `
    });
  }

  /**
   * Send welcome email after signup
   */
  async sendWelcomeEmail(userEmail, userName, isMerchant = false) {
    await this.sendEmail({
      to: userEmail,
      subject: 'Welcome to HOME AFRICA!',
      type: 'welcome',
      html: `
        <h2>Welcome to HOME AFRICA!</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for joining HOME AFRICA${isMerchant ? ' as a merchant' : ''}!</p>
        ${isMerchant ? '<p>Your merchant account is now active. Start posting your listings!</p>' : ''}
        <p>Explore our platform to find the perfect property, car, or land in Rwanda.</p>
        <p>If you have any questions, feel free to contact us.</p>
        <p>Best regards,<br>HOME AFRICA Team</p>
      `
    });
  }

  /**
   * Send new message notification
   */
  async sendMessageNotification(recipientEmail, senderName, messagePreview) {
    await this.sendEmail({
      to: recipientEmail,
      subject: `New Message from ${senderName}`,
      type: 'message_notification',
      html: `
        <h2>New Message</h2>
        <p>You have received a new message from ${senderName}:</p>
        <p><em>"${messagePreview}"</em></p>
        <p><a href="${window.location.origin}/messages.html">View Message</a></p>
      `
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(userEmail, resetLink) {
    await this.sendEmail({
      to: userEmail,
      subject: 'Reset Your Password - HOME AFRICA',
      type: 'password_reset',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetLink}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });
  }

  /**
   * Send listing inquiry notification
   */
  async sendListingInquiry(merchantEmail, merchantName, listingTitle, inquiryData) {
    await this.sendEmail({
      to: merchantEmail,
      subject: `New Inquiry: ${listingTitle}`,
      type: 'listing_inquiry',
      html: `
        <h2>New Listing Inquiry</h2>
        <p>Hello ${merchantName},</p>
        <p>You have received an inquiry about your listing: <strong>${listingTitle}</strong></p>
        <p><strong>From:</strong> ${inquiryData.name}</p>
        <p><strong>Email:</strong> ${inquiryData.email}</p>
        <p><strong>Phone:</strong> ${inquiryData.phone || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>${inquiryData.message}</p>
        <p><a href="${window.location.origin}/messages.html">Reply</a></p>
      `
    });
  }

  /**
   * Notify seller when someone favorites their listing
   */
  async sendFavoriteNotification(sellerEmail, sellerName, listingTitle, buyerName) {
    await this.sendEmail({
      to: sellerEmail,
      subject: `Someone saved your listing: ${listingTitle}`,
      type: 'favorite_notification',
      html: `
        <h2 style="color:#0077b6;">Your Listing Got Saved!</h2>
        <p>Hello ${sellerName},</p>
        <p><strong>${buyerName || 'A user'}</strong> just saved your listing to their favorites:</p>
        <p style="font-size:1.1rem;font-weight:bold;">${listingTitle}</p>
        <p>They may contact you soon. Make sure your contact details are up to date.</p>
        <p><a href="${window.location.origin}/dashboard.html" style="background:#0077b6;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;">View Dashboard</a></p>
        <p>Best regards,<br>HOME AFRICA Team</p>
      `
    });
  }

  /**
   * Notify seller when their subscription is approved or rejected
   */
  async sendSubscriptionStatusNotification(sellerEmail, sellerName, plan, status) {
    const isApproved = status === 'active';
    await this.sendEmail({
      to: sellerEmail,
      subject: isApproved ? `Your ${plan} Plan is Now Active!` : `Subscription Update: ${plan} Plan`,
      type: 'subscription_status',
      html: `
        <h2 style="color:${isApproved ? '#28a745' : '#dc3545'};">${isApproved ? '🎉 Plan Activated!' : 'Subscription Update'}</h2>
        <p>Hello ${sellerName},</p>
        ${isApproved
          ? `<p>Your <strong>${plan.toUpperCase()}</strong> plan has been activated! Your listings now show the <strong>⚡ Featured</strong> badge.</p>`
          : `<p>Unfortunately your <strong>${plan.toUpperCase()}</strong> subscription request was not approved. Please contact us at <a href="mailto:info@home.africa">info@home.africa</a> if you believe this is an error.</p>`
        }
        <p><a href="${window.location.origin}/premium.html" style="background:#0077b6;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;">View Plans</a></p>
        <p>Best regards,<br>HOME AFRICA Team</p>
      `
    });
  }
}

// Create global instance
window.emailNotifications = new EmailNotificationSystem();

