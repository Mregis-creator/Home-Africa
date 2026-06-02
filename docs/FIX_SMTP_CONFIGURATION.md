# Fix SMTP Configuration Issues

## ⚠️ Current Issues

### 1. **Username is Incorrect**
- **Current:** `home-africa`
- **Should be:** `regismuhakwa@gmail.com` (your full Gmail address)

### 2. **Gmail Warning**
Supabase is warning that Gmail SMTP is designed for **personal emails**, not **transactional emails** (like password resets). This can cause:
- Emails going to spam
- Rate limiting
- Delivery delays
- Lower deliverability

---

## 🔧 **Quick Fix (Use Gmail for Now)**

If you want to use Gmail temporarily:

### **Update Username:**
Change from:
```
home-africa
```

To:
```
regismuhakwa@gmail.com
```

### **Complete Gmail Settings:**
- **Host:** `smtp.gmail.com` ✅
- **Port:** `587` ✅
- **Username:** `regismuhakwa@gmail.com` ⚠️ (needs to be changed)
- **Password:** `[Your Gmail App Password]` (16 characters)
- **Sender Email:** `regismuhakwa@gmail.com`
- **Sender Name:** `Regis Muhakwa`

---

## 🎯 **Better Solution: Use Transactional Email Service**

For **production use**, consider these alternatives:

### **Option 1: SendGrid** (Recommended - Free tier: 100 emails/day)

**Settings:**
- **Host:** `smtp.sendgrid.net`
- **Port:** `587`
- **Username:** `apikey`
- **Password:** `[Your SendGrid API Key]`
- **Sender Email:** `noreply@homeafrica.com` (or your domain)
- **Sender Name:** `HOME AFRICA`

**Setup:**
1. Sign up at [SendGrid.com](https://sendgrid.com) (free)
2. Go to Settings → API Keys
3. Create API Key
4. Copy the API key
5. Use it as the password in Supabase

**Benefits:**
- ✅ Designed for transactional emails
- ✅ Better deliverability
- ✅ Free tier: 100 emails/day
- ✅ Analytics and tracking

---

### **Option 2: Mailgun** (Free tier: 5,000 emails/month)

**Settings:**
- **Host:** `smtp.mailgun.org`
- **Port:** `587`
- **Username:** `[Your Mailgun SMTP Username]`
- **Password:** `[Your Mailgun SMTP Password]`
- **Sender Email:** `noreply@yourdomain.com`
- **Sender Name:** `HOME AFRICA`

**Setup:**
1. Sign up at [Mailgun.com](https://www.mailgun.com) (free)
2. Go to Sending → Domain Settings
3. Get SMTP credentials
4. Use in Supabase

**Benefits:**
- ✅ 5,000 free emails/month
- ✅ Great for transactional emails
- ✅ Excellent deliverability

---

### **Option 3: Use EmailJS** (Already Configured!)

Since you **already have EmailJS configured**, this is the **easiest solution**:

**Advantages:**
- ✅ Already set up in your project
- ✅ No SMTP configuration needed
- ✅ Reliable delivery
- ✅ Works immediately

**I can modify the password reset to use EmailJS instead of Supabase Auth emails.**

---

## 📋 **Action Items**

### **Immediate Fix (Gmail):**
1. [ ] Change Username to: `regismuhakwa@gmail.com`
2. [ ] Make sure Password is Gmail App Password (16 characters)
3. [ ] Save settings
4. [ ] Test password reset
5. [ ] Check spam folder

### **Better Solution (Choose One):**
- [ ] **Option A:** Set up SendGrid (5 minutes)
- [ ] **Option B:** Set up Mailgun (5 minutes)
- [ ] **Option C:** Use EmailJS (I can implement this)

---

## 🚀 **Recommendation**

**For now:** Fix the Username field to use your full Gmail address.

**For production:** Either:
1. Set up SendGrid/Mailgun for better deliverability, OR
2. Use EmailJS (which you already have configured)

**Which would you prefer?** I can help set up SendGrid/Mailgun, or I can modify the password reset to use EmailJS instead.

---

## ⚡ **Quick Test**

After fixing the Username:
1. Save settings in Supabase
2. Go to `signin.html`
3. Click "Forgot Password?"
4. Enter your email
5. Check inbox (and spam) within 2 minutes

If it still doesn't work, the Gmail warning is likely the issue - consider switching to a transactional email service.

