# 📧 Email Template Setup - Before Website Hosting

## ⚠️ Images Must Be Hosted Online

Email templates **cannot** use local file paths. You need to host your logo image online before the template will work.

---

## ✅ Quick Solution: Upload to EmailJS (2 minutes)

### Step 1: Upload Logo to EmailJS
1. Go to **EmailJS Dashboard**: https://dashboard.emailjs.com/
2. Click **"Media Library"** in the left sidebar
3. Click **"Upload"** button
4. Select your `images/hero-bg.jpeg` file
5. Wait for upload to complete
6. **Copy the image URL** (will look like: `https://cdn.emailjs.com/...`)

### Step 2: Update Template
1. Open your email template in EmailJS
2. Find this line:
   ```html
   <img src="https://your-domain.com/images/hero-bg.jpeg"
   ```
3. Replace with your EmailJS Media Library URL:
   ```html
   <img src="https://cdn.emailjs.com/YOUR_IMAGE_ID/hero-bg.jpeg"
   ```
4. Save the template

**Done!** Your logo will now display in emails.

---

## 🆓 Alternative: Free Image Hosting

### Option A: Imgur (No Account Needed)
1. Go to https://imgur.com/upload
2. Upload `images/hero-bg.jpeg`
3. Right-click the uploaded image → "Copy image address"
4. Replace the image URL in your template

### Option B: ImgBB
1. Go to https://imgbb.com/
2. Click "Start uploading"
3. Upload your logo
4. Copy the "Direct link" URL
5. Replace in template

### Option C: Cloudinary (Free Tier)
1. Sign up at https://cloudinary.com (free)
2. Upload your logo
3. Copy the image URL
4. Replace in template

---

## 🧪 Temporary: Test Without Logo

If you want to test the template **without** the logo first:

Replace the logo section with:
```html
<div class="logo-wrapper">
  <div class="logo-square" style="background: linear-gradient(135deg, #00ffff 0%, #8fff00 100%);">
    <div style="color: white; font-size: 10px; text-align: center; padding: 10px;">
      HOME<br>AFRICA
    </div>
  </div>
</div>
```

This creates a temporary gradient square with text until you upload the real logo.

---

## 📝 Summary

**Before hosting your website:**
- ✅ Upload logo to EmailJS Media Library (easiest)
- ✅ OR use free image hosting (Imgur, ImgBB)
- ✅ Update image URL in template
- ✅ Test email sending

**After hosting your website:**
- Update image URL to: `https://yourdomain.com/images/hero-bg.jpeg`

---

**The template will work perfectly once you upload the logo image online!** 🚀

