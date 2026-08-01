// Email/SMS Notification Service
// Using EmailJS for email notifications (free tier available)
// For SMS, you can integrate with Twilio, AWS SNS, or similar services

class NotificationService {
  constructor() {
    // EmailJS configuration. The REAL EmailJS setup lives in
    // js/email-service-emailjs.js (the single source of truth). These remain
    // placeholders on purpose; this class must NOT re-init EmailJS with a bogus
    // key. Left here only so legacy references don't break.
    this.emailjsPublicKey = 'YOUR_EMAILJS_PUBLIC_KEY';
    this.emailjsServiceId = 'YOUR_EMAILJS_SERVICE_ID';
    this.emailjsTemplateId = 'YOUR_EMAILJS_TEMPLATE_ID';

    // Do not initialize EmailJS with placeholder credentials.
    const looksConfigured = this.emailjsPublicKey && this.emailjsPublicKey.indexOf('YOUR_') !== 0;
    if (typeof emailjs !== 'undefined' && looksConfigured) {
      emailjs.init(this.emailjsPublicKey);
    }
  }

  // Send email notification
  async sendEmail(to, subject, message, templateParams = {}) {
    try {
      if (typeof emailjs === 'undefined') {
        console.warn('EmailJS not loaded. Email notification skipped.');
        // Store in localStorage as fallback
        this.storeNotification('email', to, subject, message);
        return { success: false, message: 'EmailJS not configured' };
      }

      const params = {
        to_email: to,
        subject: subject,
        message: message,
        ...templateParams
      };

      const response = await emailjs.send(
        this.emailjsServiceId,
        this.emailjsTemplateId,
        params
      );

      return { success: true, response };
    } catch (error) {
      console.error('Email sending error:', error);
      // Store in localStorage as fallback
      this.storeNotification('email', to, subject, message);
      return { success: false, error: error.message };
    }
  }

  // Send SMS notification (requires backend API)
  async sendSMS(phoneNumber, message) {
    try {
      // This would typically call your backend API which integrates with SMS service
      // For now, we'll store it for manual processing
      this.storeNotification('sms', phoneNumber, 'SMS Notification', message);
      
      // Example: If you have a backend endpoint
      // const response = await fetch('/api/send-sms', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ phone: phoneNumber, message })
      // });
      
      return { success: true, message: 'SMS queued for sending' };
    } catch (error) {
      console.error('SMS sending error:', error);
      return { success: false, error: error.message };
    }
  }

  // Notify merchant about new booking
  async notifyBooking(merchantEmail, merchantPhone, bookingDetails) {
    const emailSubject = 'New Booking Request - HOME AFRICA';
    const emailMessage = `
      You have received a new booking request:
      
      Listing: ${bookingDetails.listingTitle}
      Customer: ${bookingDetails.customerName}
      Phone: ${bookingDetails.customerPhone}
      Date: ${bookingDetails.date}
      Time: ${bookingDetails.time}
      ${bookingDetails.message ? `Message: ${bookingDetails.message}` : ''}
      
      Please contact the customer to confirm the appointment.
    `;

    const smsMessage = `New booking: ${bookingDetails.customerName} for ${bookingDetails.listingTitle} on ${bookingDetails.date}`;

    // Send both email and SMS
    const emailResult = await this.sendEmail(merchantEmail, emailSubject, emailMessage);
    const smsResult = await this.sendSMS(merchantPhone, smsMessage);

    return { email: emailResult, sms: smsResult };
  }

  // Notify merchant about new review
  async notifyReview(merchantEmail, reviewDetails) {
    const subject = 'New Review on Your Listing - HOME AFRICA';
    const message = `
      You have received a new review:
      
      Listing: ${reviewDetails.listingTitle}
      Reviewer: ${reviewDetails.reviewerName}
      Rating: ${reviewDetails.rating}/5
      Review: ${reviewDetails.reviewText}
    `;

    return await this.sendEmail(merchantEmail, subject, message);
  }

  // Notify user about search alert match
  async notifySearchAlert(userEmail, userPhone, listingDetails) {
    const emailSubject = 'New Listing Matches Your Search - HOME AFRICA';
    const emailMessage = `
      A new listing matches your saved search:
      
      ${listingDetails.title}
      Price: RWF ${listingDetails.price}
      Location: ${listingDetails.location || 'N/A'}
      
      View listing: ${listingDetails.url}
    `;

    const smsMessage = `New match: ${listingDetails.title} - RWF ${listingDetails.price}`;

    const emailResult = await this.sendEmail(userEmail, emailSubject, emailMessage);
    const smsResult = await this.sendSMS(userPhone, smsMessage);

    return { email: emailResult, sms: smsResult };
  }

  // Store notification in localStorage (fallback)
  storeNotification(type, recipient, subject, message) {
    const notifications = JSON.parse(localStorage.getItem('pendingNotifications') || '[]');
    notifications.push({
      type,
      recipient,
      subject,
      message,
      timestamp: new Date().toISOString(),
      sent: false
    });
    localStorage.setItem('pendingNotifications', JSON.stringify(notifications));
  }

  // Get pending notifications
  getPendingNotifications() {
    return JSON.parse(localStorage.getItem('pendingNotifications') || '[]');
  }

  // Clear sent notifications
  clearSentNotifications() {
    localStorage.setItem('pendingNotifications', JSON.stringify([]));
  }
}

// Create global instance
const notificationService = new NotificationService();

