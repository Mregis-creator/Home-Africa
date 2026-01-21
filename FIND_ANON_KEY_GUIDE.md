# 🔍 How to Find Your anon public Key

## 📍 Step-by-Step Location Guide

### Step 1: Go to Settings
- In Supabase dashboard (left sidebar)
- Click **⚙️ Settings** (gear icon at the bottom)
- Or look for **"Project Settings"** in the menu

### Step 2: Click "API"
- In the Settings menu (left side)
- Click **"API"** 
- This opens the API settings page

### Step 3: Find "Project API keys" Section

You'll see several sections on this page. Look for:

**"Project API keys"** section (usually near the middle/bottom of the page)

### Step 4: Look for the Table/List

In the "Project API keys" section, you'll see a table or list with columns like:

| Name | Key | Description |
|------|-----|-------------|
| `anon` | `public` | [long key string] | Your anonymous public key |
| `service_role` | `secret` | [long key string] | Your service role key |

### Step 5: Find the Right Row

Look for the row that says:
- **Name:** `anon`
- **Key:** `public`
- **NOT** the one that says `service_role` `secret`

### Step 6: Copy the Key

- In that row, you'll see a long string (starts with `eyJhbG...`)
- Click the **copy icon** 📋 next to it
- Or click the **"Reveal"** button if it's hidden, then copy

---

## 🎯 Visual Guide

```
Supabase Dashboard
│
├── Left Sidebar
│   └── ⚙️ Settings (click this)
│       │
│       └── API (click this)
│           │
│           ├── Project URL
│           │   └── https://xxxxx.supabase.co [📋 Copy]
│           │
│           └── Project API keys
│               │
│               ├── anon | public | eyJhbG... [📋 Copy] ← THIS ONE!
│               │
│               └── service_role | secret | eyJhbG... [Don't copy]
```

---

## 🔍 Alternative: What It Looks Like

The anon public key section might look like this:

```
Project API keys

┌─────────────────────────────────────────────────────────┐
│ Name          │ Key    │ Key Value                      │
├─────────────────────────────────────────────────────────┤
│ anon          │ public │ eyJhbGciOiJIUzI1NiIsInR5cCI... │ [📋]
│ service_role  │ secret │ eyJhbGciOiJIUzI1NiIsInR5cCI... │ [📋]
└─────────────────────────────────────────────────────────┘
```

**Copy the one in the `anon` | `public` row!**

---

## 💡 Tips

### If You Can't See the Key:
- Some interfaces hide the key initially
- Look for a **"Reveal"** or **"Show"** button
- Click it to reveal the full key
- Then copy it

### The Key Format:
- Starts with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
- Very long string (200+ characters)
- Contains dots (.) separating parts
- Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### If You See Multiple Keys:
- Look for the one labeled **"anon"** and **"public"**
- Ignore any key labeled **"service_role"** or **"secret"**

---

## 🆘 Still Can't Find It?

### Option 1: Check Different Sections
- Scroll down the API page
- The keys might be in a different section
- Look for "API Keys", "Keys", or "Credentials"

### Option 2: Try This Path
1. Settings → API
2. Scroll down to find "Project API keys"
3. Look for a table or list
4. Find row with `anon` and `public`

### Option 3: Search for "anon"
- Press Ctrl+F (or Cmd+F on Mac)
- Search for: `anon`
- This will highlight where it is

### Option 4: Check Project Overview
- Sometimes keys are shown in the project overview
- Look at the main dashboard
- Check for "API Keys" or "Quick Start" section

---

## ✅ What You're Looking For

**Correct Key:**
- Name: `anon`
- Type: `public`
- Long string starting with `eyJhbG...`

**Wrong Key (Don't Copy):**
- Name: `service_role`
- Type: `secret`
- Also starts with `eyJhbG...` but different

---

## 🎯 Quick Checklist

- [ ] I'm in Settings → API
- [ ] I see "Project API keys" section
- [ ] I found the row with `anon` and `public`
- [ ] I copied the long key string
- [ ] The key starts with `eyJhbG...`

---

**Still stuck?** Tell me what you see on your screen and I'll help you find it!

