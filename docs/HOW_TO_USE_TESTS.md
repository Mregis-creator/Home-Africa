# 🧪 How to Use the Email Notification Tests

## 📋 **What Are These Tests?**

The test files help you **verify that your email notification system is working** before using it in your real application.

---

## 🎯 **What You Have:**

### **1. `test-email-notifications.html`** 
**Purpose:** Interactive web page to test email sending

**What it does:**
- ✅ Checks if EmailJS is configured
- ✅ Lets you send test emails
- ✅ Shows if emails are sent successfully
- ✅ Tests different email types (welcome, booking, etc.)

**How to use:**
1. Open `test-email-notifications.html` in your web browser
2. Enter your email address
3. Click "Send Test Email"
4. Check your inbox!

---

### **2. `EMAIL_NOTIFICATIONS_TEST.md`**
**Purpose:** Written guide with instructions

**What it contains:**
- Step-by-step setup instructions
- Code examples
- Troubleshooting tips

---

## ⚠️ **IMPORTANT: Tests Won't Work Until You Configure EmailJS**

### **Before Testing, You MUST:**

1. **Get EmailJS Credentials:**
   - Go to: https://dashboard.emailjs.com
   - Sign up/login (free account)
   - Get your:
     - Public Key
     - Service ID  
     - Template ID

2. **Update Configuration:**
   - Open: `js/email-notifications.js`
   - Find lines 14-18
   - Replace the placeholder values:
     ```javascript
     this.emailjsConfig = {
       publicKey: 'YOUR_ACTUAL_PUBLIC_KEY',      // ← Replace this
       serviceId: 'YOUR_ACTUAL_SERVICE_ID',      // ← Replace this
       templateId: 'YOUR_ACTUAL_TEMPLATE_ID'     // ← Replace this
     };
     ```

3. **Then Test:**
   - Open `test-email-notifications.html`
   - It will show ✅ if configured correctly
   - Send test emails!

---

## 🚀 **Quick Start Guide:**

### **Step 1: Configure EmailJS** (5 minutes)
1. Sign up at https://www.emailjs.com (free)
2. Create an email service (Gmail recommended)
3. Create an email template
4. Copy your credentials
5. Update `js/email-notifications.js`

### **Step 2: Test** (2 minutes)
1. Open `test-email-notifications.html` in browser
2. Enter your email
3. Click "Send Test Email"
4. Check your inbox!

### **Step 3: Use in Real App**
Once tests work, emails will automatically send when:
- ✅ Someone books a property/car (booking confirmation)
- ✅ Someone signs up (welcome email)
- ✅ Other events you configure

---

## ❓ **Are the Tests Working?**

**Check this:**

1. **Open `test-email-notifications.html` in your browser**
2. **Look at the top** - it will show:
   - ✅ **Green box** = EmailJS configured, ready to test!
   - ⚠️ **Yellow box** = EmailJS not configured yet (need to do Step 1 above)

3. **If configured:**
   - Enter your email
   - Click test buttons
   - Check your inbox for emails!

---

## 🎯 **What Are These Tests Used With?**

### **The tests are used to verify:**

1. **EmailJS Configuration** - Is it set up correctly?
2. **Email Sending** - Can emails be sent?
3. **Email Templates** - Do they look good?
4. **Integration** - Will emails work in your real app?

### **Once tests pass, emails automatically work in:**
- ✅ Booking forms (`car-detail.html`, `apartment-detail.html`, etc.)
- ✅ Signup page (`signup.html`)
- ✅ Anywhere you call `window.emailNotifications.sendEmail()`

---

## 📝 **Summary:**

| File | Purpose | When to Use |
|------|---------|-------------|
| `test-email-notifications.html` | Interactive test page | **After** configuring EmailJS, to test if emails work |
| `EMAIL_NOTIFICATIONS_TEST.md` | Written guide | Reference guide with instructions |
| `js/email-notifications.js` | Email system code | Update this **first** with EmailJS credentials |

---

## ✅ **Next Steps:**

1. **Configure EmailJS** (if not done yet)
   - See `EMAILJS_SETUP_GUIDE.md` for detailed steps

2. **Test the system**
   - Open `test-email-notifications.html`
   - Send test emails
   - Verify they arrive

3. **Use in your app**
   - Tests passing = emails will work automatically!
   - No additional code needed for bookings/signups

---

**Need help?** Check `EMAILJS_SETUP_GUIDE.md` for EmailJS setup instructions!

