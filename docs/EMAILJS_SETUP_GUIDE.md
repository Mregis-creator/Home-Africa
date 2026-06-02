# 📧 EmailJS Setup Guide - Complete Configuration

This guide will help you set up EmailJS to enable email notifications in your HOME AFRICA platform.

---

## 🎯 What is EmailJS?

EmailJS is a **free client-side email service** that allows you to send emails directly from your frontend code without needing a backend server. Perfect for:
- ✅ Booking confirmations
- ✅ Welcome emails
- ✅ Password resets
- ✅ Notification emails

**Free Tier:** 200 emails/month (perfect for MVP!)

---

## 📋 Step-by-Step Setup

### Step 1: Create EmailJS Account

1. Go to **https://www.emailjs.com/**
2. Click **"Sign Up"** (free account)
3. Sign up with your email or Google account
4. Verify your email address

---

### Step 2: Create Email Service

1. Log in to **EmailJS Dashboard**: https://dashboard.emailjs.com/
2. Go to **"Email Services"** in the left sidebar
3. Click **"Add New Service"**
4. Choose your email provider:
   - **Gmail** (recommended for testing)
   - **Outlook**
   - **Yahoo**
   - **Custom SMTP** (for production)

5. Follow the setup instructions for your provider:
   - **Gmail**: You'll need to enable "Less secure app access" or use App Password
   - **Outlook**: Use App Password
   - **Custom SMTP**: Enter your SMTP credentials

6. **Name your service** (e.g., "HOME AFRICA Email Service")
7. Click **"Create Service"**

---

### Step 3: Create Email Template

1. Go to **"Email Templates"** in the left sidebar
2. Click **"Create New Template"**
3. **Template Name**: "HOME AFRICA Notifications"
4. **Subject**: `{{subject}}`
5. **Content** (HTML):

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0; 
      padding: 0; 
      background-color: #f5f5f5;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: #ffffff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    /* Header with subtle background and logo-first layout */
    .header { 
      background: linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.75) 100%);
      padding: 25px 20px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    /* Subtle glow effect from logo colors */
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(ellipse at top left, rgba(0,255,255,0.15) 0%, transparent 50%),
                  radial-gradient(ellipse at bottom right, rgba(143,255,0,0.12) 0%, transparent 50%);
      pointer-events: none;
    }
    .header-content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    /* Brand name with gradient matching logo circle colors */
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: bold;
      background: linear-gradient(90deg, #00ffff 0%, #00c853 50%, #8fff00 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-shadow: 0 0 20px rgba(0,255,255,0.3);
      letter-spacing: 2px;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .header .tagline {
      margin-top: 5px;
      font-size: 13px;
      color: rgba(255,255,255,0.85);
      letter-spacing: 1.5px;
      font-weight: 300;
      text-transform: uppercase;
      white-space: nowrap;
    }
    /* Subtle decorative border using logo circle colors */
    .header-border {
      height: 3px;
      background: linear-gradient(90deg, 
        #00ffff 0%, 
        #00c853 33%, 
        #8fff00 66%, 
        #00c853 100%);
      opacity: 0.6;
    }
    .content { 
      padding: 30px 20px; 
      background: #ffffff;
      color: #333;
    }
    .content h2 {
      color: #00c853;
      margin-top: 0;
      font-size: 24px;
      font-weight: 600;
      border-left: 4px solid #00ffff;
      padding-left: 15px;
    }
    .footer { 
      text-align: center; 
      padding: 20px; 
      background: rgba(0,0,0,0.03);
      color: #666; 
      font-size: 12px;
      border-top: 1px solid rgba(0,255,255,0.15);
    }
    .footer p {
      margin: 5px 0;
    }
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .header h1 { font-size: 24px; }
      .content { padding: 20px 15px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-content">
        <h1>HOME AFRICA</h1>
        <div class="tagline">Beyond Horizons</div>
      </div>
    </div>
    <div class="header-border"></div>
    <div class="content">
      <h2>{{subject}}</h2>
      <div>{{{html_content}}}</div>
    </div>
    <div class="footer">
      <p>&copy; 2025 HOME AFRICA. All rights reserved.</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
```

6. **Template Variables** (these will be automatically filled):
   - `{{subject}}` - Email subject
   - `{{html_content}}` - HTML email content
   - `{{to_email}}` - Recipient email
   - `{{message}}` - Plain text message

7. Click **"Save"**

---

### Step 4: Get Your Credentials

1. Go to **"Account"** → **"General"** in EmailJS Dashboard
2. Find your **Public Key** (starts with something like `user_xxxxx`)
3. Copy it - you'll need this!

4. Go back to **"Email Services"**
5. Click on your service
6. Copy the **Service ID** (e.g., `service_xxxxx`)

7. Go to **"Email Templates"**
8. Click on your template
9. Copy the **Template ID** (e.g., `template_xxxxx`)

---

### Step 5: Configure Your Application

1. Open `js/email-notifications.js` in your project
2. Find the `emailjsConfig` object (around line 15)
3. Replace the placeholder values:

```javascript
this.emailjsConfig = {
  publicKey: 'jajhnzR1AZ4LnNr20',      // ← Replace with your Public Key
  serviceId: 'service_fu4ebub',      // ← Replace with your Service ID
  templateId: 'template_xl5fs1e'     // ← Replace with your Template ID
};
```

**Example:**
```javascript
this.emailjsConfig = {
  publicKey: 'user_abc123xyz789',
  serviceId: 'service_gmail123',
  templateId: 'template_homeafrica456'
};
```

4. **Save the file**

---

### Step 6: Add EmailJS Script to Pages

EmailJS is already included in detail pages, but make sure it's in pages that send emails:

**Pages that need EmailJS:**
- ✅ `car-detail.html` (already included)
- ✅ `apartment-detail.html` (already included)
- ✅ `land-detail.html` (needs to be added)
- ✅ `signup.html` (needs to be added for welcome emails)
- ✅ `signin.html` (needs to be added for password reset)

**Add this script tag** before `js/email-notifications.js`:

```html
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
<script src="js/email-notifications.js"></script>
```

---

## 🧪 Testing

### Test Email Sending

1. Open your browser console (F12)
2. Navigate to a page with EmailJS loaded
3. Run this test command:

```javascript
// Test email sending
window.emailNotifications.sendEmail({
  to: 'your-test-email@example.com',
  subject: 'Test Email from HOME AFRICA',
  html: '<h2>Test Email</h2><p>This is a test email from HOME AFRICA!</p>',
  text: 'Test Email: This is a test email from HOME AFRICA!'
}).then(result => {
  console.log('Email sent!', result);
}).catch(error => {
  console.error('Email failed:', error);
});
```

4. Check your email inbox (and spam folder)
5. If successful, you'll see: `✅ Email sent via EmailJS`

---

## 📧 Email Types Configured

Your platform will automatically send these emails:

### 1. **Welcome Email** (on signup)
- Sent when new user signs up
- Includes welcome message and platform info

### 2. **Booking Confirmation** (on booking)
- Sent to customer when booking is created
- Sent to merchant when new booking received
- Includes booking details and date/time

### 3. **Message Notification** (on new message)
- Sent when user receives a new message
- Includes sender name and message preview

### 4. **Password Reset** (on password reset request)
- Sent when user requests password reset
- Includes reset link

### 5. **Listing Inquiry** (on inquiry)
- Sent to merchant when listing inquiry received
- Includes customer contact info and message

---

## 🔧 Troubleshooting

### EmailJS not initialized
**Error:** `EmailJS not configured`

**Solution:**
1. Check that you've replaced all three config values in `js/email-notifications.js`
2. Make sure EmailJS script is loaded before `email-notifications.js`
3. Check browser console for errors

---

### Emails going to spam
**Solution:**
1. Add your sending email to contacts
2. Use a custom domain email (not Gmail/Outlook)
3. Set up SPF/DKIM records (advanced)

---

### Rate limit exceeded
**Error:** `429 Too Many Requests`

**Solution:**
- Free tier: 200 emails/month
- Upgrade to paid plan for more emails
- Or emails will be stored in database for manual sending

---

### EmailJS script not loading
**Error:** `emailjs is not defined`

**Solution:**
1. Check internet connection
2. Verify script tag is correct:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
   ```
3. Check browser console for 404 errors

---

## ✅ Verification Checklist

- [ ] EmailJS account created
- [ ] Email service configured (Gmail/Outlook/etc.)
- [ ] Email template created
- [ ] Public Key copied
- [ ] Service ID copied
- [ ] Template ID copied
- [ ] Config updated in `js/email-notifications.js`
- [ ] EmailJS script added to required pages
- [ ] Test email sent successfully
- [ ] Test email received in inbox

---

## 🚀 Production Recommendations

### For Production:

1. **Use Custom SMTP** instead of Gmail/Outlook
   - More professional
   - Better deliverability
   - Higher rate limits

2. **Set up SPF/DKIM records**
   - Improves email deliverability
   - Reduces spam classification

3. **Monitor email usage**
   - Check EmailJS dashboard regularly
   - Upgrade plan if needed

4. **Add email fallback**
   - Current system stores emails in database if EmailJS fails
   - Can be processed manually or via cron job

---

## 📞 Support

- **EmailJS Docs:** https://www.emailjs.com/docs/
- **EmailJS Support:** https://www.emailjs.com/support/
- **EmailJS Dashboard:** https://dashboard.emailjs.com/

---

## 🎉 You're Done!

Once configured, your platform will automatically send emails for:
- ✅ User signups
- ✅ Booking confirmations
- ✅ New messages
- ✅ Password resets
- ✅ Listing inquiries

**All emails are stored in the database as backup**, so even if EmailJS fails, you won't lose any notifications!

---

**Need help?** Check the browser console for detailed error messages, or refer to the EmailJS documentation.

