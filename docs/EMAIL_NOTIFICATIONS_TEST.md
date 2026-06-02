# 📧 Email Notifications - Test & Integration Guide

## ✅ **Current Status**

Your email notification system is **ready** but needs:
1. ✅ EmailJS credentials configured
2. ✅ Integration with booking forms
3. ✅ Integration with signup
4. ✅ Testing

---

## 🔧 **Step 1: Configure EmailJS**

### **Get Your EmailJS Credentials:**

1. **Go to EmailJS Dashboard:** https://dashboard.emailjs.com
2. **Get Public Key:**
   - Go to **Account** → **General**
   - Copy your **Public Key**

3. **Get Service ID:**
   - Go to **Email Services**
   - Select your service (or create one)
   - Copy the **Service ID**

4. **Get Template ID:**
   - Go to **Email Templates**
   - Select your template (or create one)
   - Copy the **Template ID**

### **Update Configuration:**

Open `js/email-notifications.js` and update lines 14-18:

```javascript
this.emailjsConfig = {
  publicKey: 'jajhnzR1AZ4LnNr20',      // Replace this
  serviceId: 'service_fu4ebub',      // Replace this
  templateId: 'template_xl5fs1e'     // Replace this
};
```

---

## 🧪 **Step 2: Test Email System**

### **Quick Test Script:**

Add this to your browser console on any page:

```javascript
// Test email notification system
async function testEmail() {
  if (!window.emailNotifications) {
    console.error('❌ Email notifications not loaded');
    return;
  }

  // Test basic email
  const result = await window.emailNotifications.sendEmail({
    to: 'your-email@example.com',  // Replace with your email
    subject: 'Test Email from HOME AFRICA',
    html: '<h2>Test Email</h2><p>This is a test email from HOME AFRICA!</p>',
    text: 'This is a test email from HOME AFRICA!'
  });

  console.log('Email result:', result);
}

// Run test
testEmail();
```

### **Test Welcome Email:**

```javascript
// Test welcome email
async function testWelcomeEmail() {
  await window.emailNotifications.sendWelcomeEmail(
    'your-email@example.com',  // Replace with your email
    'Test User',
    false  // isMerchant
  );
  console.log('✅ Welcome email sent!');
}

testWelcomeEmail();
```

### **Test Booking Confirmation:**

```javascript
// Test booking confirmation
async function testBookingEmail() {
  await window.emailNotifications.sendBookingConfirmation({
    userEmail: 'your-email@example.com',  // Replace
    userName: 'Test User',
    listingTitle: 'Test Apartment',
    scheduledDate: new Date().toISOString(),
    merchantName: 'Test Merchant',
    merchantEmail: 'merchant@example.com'  // Replace
  });
  console.log('✅ Booking email sent!');
}

testBookingEmail();
```

---

## 🔗 **Step 3: Integrate with Booking Forms**

### **Car Detail Page (`car-detail.html`):**

The booking form is already set up. Just ensure:

1. **EmailJS script is loaded:**
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
   <script src="js/email-notifications.js"></script>
   <script src="js/bookings.js"></script>
   ```

2. **Booking form submission calls:**
   ```javascript
   // In car-detail.html booking form handler
   const bookingData = {
     listingId: carId,
     name: document.getElementById('bookingName').value,
     phone: document.getElementById('bookingPhone').value,
     scheduledDate: document.getElementById('bookingDate').value,
     scheduledTime: document.getElementById('bookingTime').value,
     message: document.getElementById('bookingMessage').value
   };

   // Create booking
   const booking = await window.bookingSystem.createBooking({
     ...bookingData,
     bookingType: 'test_drive'
   });

   // Email is automatically sent by bookingSystem.createBooking()
   ```

### **Apartment Detail Page (`apartment-detail.html`):**

Similar integration needed. Check if booking form exists and integrate.

### **Land Detail Page (`land-detail.html`):**

Similar integration needed. Check if booking form exists and integrate.

---

## 📝 **Step 4: Integrate Welcome Emails**

### **Signup Page (`signup.html`):**

After successful signup, add:

```javascript
// After successful signup
if (window.emailNotifications) {
  await window.emailNotifications.sendWelcomeEmail(
    userEmail,
    userName,
    isMerchant  // true if merchant signup
  );
}
```

### **Check Current Integration:**

Check `signup.html` and `js/auth.js` to see if welcome emails are already integrated.

---

## ✅ **Step 5: Verify Integration Points**

### **Check These Files:**

1. ✅ `js/email-notifications.js` - Email system (ready)
2. ✅ `js/bookings.js` - Booking system (calls emailNotifications)
3. ⚠️ `car-detail.html` - Needs booking form integration check
4. ⚠️ `apartment-detail.html` - Needs booking form integration check
5. ⚠️ `land-detail.html` - Needs booking form integration check
6. ⚠️ `signup.html` - Needs welcome email integration check

---

## 🎯 **Quick Integration Checklist**

- [ ] Configure EmailJS credentials in `js/email-notifications.js`
- [ ] Test email sending with console script
- [ ] Verify booking forms call `window.bookingSystem.createBooking()`
- [ ] Verify signup sends welcome email
- [ ] Test on actual booking submission
- [ ] Test on actual signup
- [ ] Check email delivery in inbox
- [ ] Verify email template renders correctly

---

## 🐛 **Troubleshooting**

### **Email Not Sending:**

1. **Check EmailJS Configuration:**
   ```javascript
   console.log(window.emailNotifications.isEmailJSConfigured());
   // Should return true
   ```

2. **Check Console Errors:**
   - Open browser console (F12)
   - Look for EmailJS errors

3. **Check EmailJS Dashboard:**
   - Go to EmailJS Dashboard → Logs
   - See if emails are being sent

### **Email Template Not Rendering:**

1. **Check Template Variables:**
   - Ensure `{{subject}}` and `{{{html_content}}}` are in template
   - Match variable names exactly

2. **Check HTML Content:**
   - Ensure HTML is properly formatted
   - Test with simple HTML first

---

## 📊 **Next Steps After Testing**

Once emails are working:

1. ✅ Add more email types (inquiry notifications, etc.)
2. ✅ Customize email templates
3. ✅ Add email preferences for users
4. ✅ Set up email analytics
5. ✅ Add email retry logic for failed sends

---

**Ready to test?** Start with Step 1 (configure EmailJS) and then run the test scripts!

