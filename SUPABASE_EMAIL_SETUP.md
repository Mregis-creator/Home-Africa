# Supabase Email Configuration Guide

## Issue: Password Reset Emails Not Arriving

If you're seeing "email sent" but not receiving emails, this is likely a Supabase email configuration issue.

---

## Quick Fixes

### 1. **Check Spam/Junk Folder** 📧
- Emails from Supabase often go to spam initially
- Check your spam/junk folder
- Mark as "Not Spam" if found

### 2. **Verify Email Address** ✅
- Make sure the email address you entered is correct
- Check for typos
- Try a different email address

### 3. **Wait a Few Minutes** ⏱️
- Email delivery can take 1-5 minutes
- Don't request multiple resets immediately

---

## Supabase Email Configuration

### **Default Supabase Email Service** (Limited)

By default, Supabase uses their own email service, which has limitations:
- ✅ Works for development/testing
- ⚠️ May have rate limits
- ⚠️ Emails might go to spam
- ⚠️ Limited customization

### **Configure Custom SMTP** (Recommended for Production)

For reliable email delivery, configure custom SMTP:

#### **Step 1: Go to Supabase Dashboard**
1. Open your Supabase project
2. Go to **Settings** → **Auth** → **Email Templates**
3. Scroll down to **SMTP Settings**

#### **Step 2: Configure SMTP Provider**

**Option A: Gmail SMTP** (Free)
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Password: [App Password - see below]
Sender Email: your-email@gmail.com
Sender Name: HOME AFRICA
```

**To get Gmail App Password:**
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate password for "Mail"
5. Use that password in SMTP settings

**Option B: SendGrid** (Free tier: 100 emails/day)
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: [Your SendGrid API Key]
Sender Email: noreply@yourdomain.com
Sender Name: HOME AFRICA
```

**Option C: Mailgun** (Free tier: 5,000 emails/month)
```
SMTP Host: smtp.mailgun.org
SMTP Port: 587
SMTP User: [Your Mailgun SMTP Username]
SMTP Password: [Your Mailgun SMTP Password]
Sender Email: noreply@yourdomain.com
Sender Name: HOME AFRICA
```

**Option D: AWS SES** (Pay as you go)
```
SMTP Host: email-smtp.[region].amazonaws.com
SMTP Port: 587
SMTP User: [AWS Access Key]
SMTP Password: [AWS Secret Key]
Sender Email: noreply@yourdomain.com
Sender Name: HOME AFRICA
```

#### **Step 3: Test Email Configuration**

After configuring SMTP:
1. Go to **Auth** → **Users**
2. Click on a user
3. Click "Send password reset email"
4. Check if email arrives

---

## Email Template Customization

### **Customize Password Reset Email**

1. Go to **Settings** → **Auth** → **Email Templates**
2. Select **Reset Password** template
3. Customize the email content:

```html
<h2>Reset Your Password</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you didn't request this, please ignore this email.</p>
```

---

## Troubleshooting

### **Email Not Sending**

1. **Check Supabase Logs:**
   - Go to **Logs** → **Auth Logs**
   - Look for email sending errors

2. **Verify SMTP Settings:**
   - Double-check host, port, username, password
   - Test SMTP credentials with an email client

3. **Check Rate Limits:**
   - Supabase has rate limits on emails
   - Wait a few minutes between requests

4. **Verify Email Domain:**
   - Some SMTP providers require domain verification
   - Check your SMTP provider's requirements

### **Email Going to Spam**

1. **Configure SPF Record:**
   - Add SPF record to your domain DNS
   - Example: `v=spf1 include:sendgrid.net ~all`

2. **Configure DKIM:**
   - Set up DKIM signing in your SMTP provider
   - Add DKIM records to DNS

3. **Use Custom Domain:**
   - Use `noreply@yourdomain.com` instead of generic email
   - Verify domain with SMTP provider

---

## Testing Password Reset

### **Manual Test:**

1. Go to `signin.html`
2. Click "Forgot Password?"
3. Enter your email
4. Check console for logs (F12 → Console)
5. Check email inbox (and spam folder)
6. Click reset link in email
7. Set new password

### **Check Console Logs:**

Open browser console (F12) and look for:
- `📧 Attempting to send password reset email to: [email]`
- `📧 Password reset response: { data, error }`
- `✅ Supabase API call successful` or `❌ Password reset error`

---

## Alternative: Use EmailJS (Already Configured)

Since you already have EmailJS configured for notifications, you could also use it for password resets:

1. Create a password reset email template in EmailJS
2. Modify the forgot password function to use EmailJS
3. Generate a secure reset token
4. Store token in database with expiration
5. Send email via EmailJS with reset link

This would give you more control over email delivery.

---

## Current Status

**Current Implementation:** Uses Supabase Auth `resetPasswordForEmail()`

**Limitation:** Depends on Supabase email service configuration

**Recommendation:** Configure custom SMTP for production use

---

## Next Steps

1. ✅ Check spam folder first
2. ✅ Verify email address is correct
3. ✅ Configure SMTP in Supabase Dashboard
4. ✅ Test password reset flow
5. ✅ Monitor email delivery

---

## Support

If emails still don't arrive after configuring SMTP:
- Check Supabase Auth logs
- Verify SMTP credentials
- Test SMTP connection separately
- Contact Supabase support if needed

