# 📧 Email Template Logo Setup

## ⚠️ Important: Logo Image Hosting

For email templates, images **must be hosted online** (not local file paths). Here are your options:

---

## Option 1: Use Your Website Domain (Recommended)

1. Upload `images/hero-bg.jpeg` to your website's server
2. In the email template, replace:
   ```html
   <img src="https://your-domain.com/images/hero-bg.jpeg"
   ```
   With your actual domain:
   ```html
   <img src="https://homeafrica.com/images/hero-bg.jpeg"
   ```
   (Replace `homeafrica.com` with your actual domain)

---

## Option 2: Upload to EmailJS Media Library

1. Go to **EmailJS Dashboard** → **Media Library**
2. Click **"Upload"**
3. Upload `images/hero-bg.jpeg`
4. Copy the image URL (will look like `https://cdn.emailjs.com/...`)
5. Replace the image URL in the template

---

## Option 3: Use Image Hosting Service

1. Upload `images/hero-bg.jpeg` to:
   - **Imgur** (free): https://imgur.com
   - **Cloudinary** (free tier): https://cloudinary.com
   - **ImgBB** (free): https://imgbb.com
2. Copy the direct image URL
3. Replace in template

---

## Quick Fix for Testing

For quick testing, you can temporarily use:
```html
<img src="https://via.placeholder.com/120x120/000000/00ffff?text=HOME+AFRICA" alt="HOME AFRICA Logo" class="logo-img" />
```

But **replace with your actual logo** before sending real emails!

---

## Current Template Code

The template now uses:
```html
<div class="logo-container">
  <img src="https://your-domain.com/images/hero-bg.jpeg" alt="HOME AFRICA Logo" class="logo-img" />
</div>
```

**Remember to replace `https://your-domain.com` with your actual hosted image URL!**

