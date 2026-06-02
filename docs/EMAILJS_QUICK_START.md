# 📧 EmailJS Quick Start - 5 Minute Setup

## ✅ What's Already Done

- ✅ EmailJS integration code is ready
- ✅ Email notification system is configured
- ✅ Welcome emails will send automatically on signup
- ✅ Booking confirmations will send automatically
- ✅ All email types are configured

## 🚀 What You Need to Do (5 minutes)

### Step 1: Sign Up for EmailJS (2 min)
1. Go to **https://www.emailjs.com/** and sign up (free)

### Step 2: Create Email Service (1 min)
1. Dashboard → **Email Services** → **Add New Service**
2. Choose **Gmail** (easiest for testing)
3. Follow setup instructions
4. Copy the **Service ID** (e.g., `service_xxxxx`)

### Step 3: Create Email Template (1 min)
1. Dashboard → **Email Templates** → **Create New Template**
2. **Subject:** `{{subject}}`
3. **Content:** 
```html
<h2>{{subject}}</h2>
<div>{{{html_content}}}</div>
```
4. Copy the **Template ID** (e.g., `template_xxxxx`)

### Step 4: Get Your Public Key (30 sec)
1. Dashboard → **Account** → **General**
2. Copy your **Public Key** (e.g., `user_xxxxx`)

### Step 5: Update Config (30 sec)
1. Open `js/email-notifications.js`
2. Find line ~15-19
3. Replace the three values:

```javascript
this.emailjsConfig = {
  publicKey: 'YOUR_PUBLIC_KEY_HERE',      // ← Paste your Public Key
  serviceId: 'YOUR_SERVICE_ID_HERE',     // ← Paste your Service ID
  templateId: 'YOUR_TEMPLATE_ID_HERE'    // ← Paste your Template ID
};
```

## ✅ Done!

That's it! Your emails will now send automatically:
- ✅ Welcome emails on signup
- ✅ Booking confirmations
- ✅ Message notifications
- ✅ Password resets

## 🧪 Test It

Open browser console and run:
```javascript
window.emailNotifications.sendEmail({
  to: 'your-email@example.com',
  subject: 'Test Email',
  html: '<h2>Test!</h2><p>EmailJS is working!</p>'
});
```

Check your inbox!

## 📖 Full Guide

See `EMAILJS_SETUP_GUIDE.md` for detailed instructions and troubleshooting.

---

**Free Tier:** 200 emails/month (perfect for MVP!)

