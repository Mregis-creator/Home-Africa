# Gmail SMTP Setup for Supabase

## Quick Configuration Guide

Based on your Supabase settings screen, here's what you need to fill in:

---

## ✅ **Fields to Fill:**

### **1. Host**
```
smtp.gmail.com
```

### **2. Port Number**
```
587
```
*(Change from 465 to 587 - this is more reliable for Gmail)*

### **3. Username**
```
regismuhakwa@gmail.com
```
*(Your Gmail address)*

### **4. Password**
```
[Gmail App Password - see below]
```
*(NOT your regular Gmail password - you need an App Password)*

---

## 🔑 **How to Get Gmail App Password**

### **Step 1: Enable 2-Step Verification**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click **2-Step Verification**
3. Follow the steps to enable it (if not already enabled)

### **Step 2: Generate App Password**
1. Go back to [Google Account Security](https://myaccount.google.com/security)
2. Click **App passwords** (under "2-Step Verification")
3. Select app: **Mail**
4. Select device: **Other (Custom name)**
5. Enter name: **Supabase**
6. Click **Generate**
7. **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

### **Step 3: Use App Password in Supabase**
- Paste the 16-character password (without spaces) into the **Password** field in Supabase
- Example: `abcdefghijklmnop`

---

## 📋 **Complete Supabase SMTP Settings**

Fill in these values in your Supabase Dashboard:

| Field | Value |
|-------|-------|
| **Host** | `smtp.gmail.com` |
| **Port** | `587` |
| **Username** | `regismuhakwa@gmail.com` |
| **Password** | `[Your 16-character App Password]` |
| **Sender Email** | `regismuhakwa@gmail.com` ✅ (Already set) |
| **Sender Name** | `Regis Muhakwa` ✅ (Already set) |
| **Minimum Interval** | `60` ✅ (Already set) |

---

## ⚠️ **Important Notes**

1. **Port 587 vs 465:**
   - Port 587 (TLS) is recommended for Gmail
   - Port 465 (SSL) also works but 587 is more reliable
   - Change from 465 to 587

2. **App Password Required:**
   - You CANNOT use your regular Gmail password
   - Must use App Password (16 characters)
   - App Password is different from your account password

3. **Security:**
   - App Passwords are secure and can be revoked anytime
   - If you change your Gmail password, App Passwords still work
   - You can delete App Passwords if compromised

---

## ✅ **After Configuration**

1. **Save** the settings in Supabase
2. **Test** by requesting a password reset
3. **Check** your email inbox (and spam folder)
4. **Verify** the email arrives within 1-2 minutes

---

## 🐛 **Troubleshooting**

### **"Authentication failed" error:**
- Make sure you're using App Password, not regular password
- Verify 2-Step Verification is enabled
- Check that App Password was copied correctly (no spaces)

### **"Connection timeout" error:**
- Verify Host is exactly: `smtp.gmail.com`
- Check Port is `587`
- Make sure your internet connection is working

### **Emails still not arriving:**
- Check spam/junk folder
- Verify sender email is correct
- Wait 1-2 minutes (Gmail can be slow)
- Check Supabase Auth logs for errors

---

## 📧 **Alternative: Use EmailJS**

If Gmail SMTP doesn't work, you can use EmailJS (which you already have configured):
- EmailJS is already set up in your project
- More reliable for transactional emails
- Better deliverability
- No SMTP configuration needed

Let me know if you want me to implement password reset via EmailJS instead!

---

## 🎯 **Quick Checklist**

- [ ] Enable 2-Step Verification on Gmail
- [ ] Generate App Password
- [ ] Fill Host: `smtp.gmail.com`
- [ ] Change Port to: `587`
- [ ] Fill Username: `regismuhakwa@gmail.com`
- [ ] Fill Password: `[16-character App Password]`
- [ ] Save settings
- [ ] Test password reset
- [ ] Check email inbox

---

**Once configured, password reset emails should arrive within 1-2 minutes!** ✅

