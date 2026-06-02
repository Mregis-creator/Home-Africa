# 📱 Access HOME AFRICA from Your Phone

## 🚀 Quick Setup

### Step 1: Find Your Computer's IP Address

**Windows:**
1. Open Command Prompt (Win + R, type `cmd`, Enter)
2. Run: `ipconfig`
3. Look for **IPv4 Address** under your active network adapter (usually Wi-Fi or Ethernet)
4. Example: `192.168.1.100` or `192.168.0.105`

**Or use PowerShell:**
```powershell
ipconfig | findstr /i "IPv4"
```

### Step 2: Make Sure Phone and Computer Are on Same Network

- ✅ Both devices must be on the **same Wi-Fi network**
- ❌ Mobile data won't work (different network)

### Step 3: Start the Server

**Option A: Using Live Server (VS Code Extension)**
1. Right-click on `index.html` in VS Code
2. Select **"Open with Live Server"**
3. Note the port (usually `5500`)

**Option B: Using Python HTTP Server**
```bash
python -m http.server 8000
```

**Option C: Using the Batch Script**
- Double-click `start-server.bat`
- It will start on port `8000`

### Step 4: Access from Your Phone

1. Open your phone's browser (Chrome, Safari, etc.)
2. Type in the address bar:
   ```
   http://YOUR_IP_ADDRESS:PORT
   ```
   
   **Examples:**
   - If IP is `192.168.1.100` and port is `5500`:
     ```
     http://192.168.1.100:5500
     ```
   - If IP is `192.168.0.105` and port is `8000`:
     ```
     http://192.168.0.105:8000
     ```

3. Navigate to pages:
   - Home: `http://192.168.1.100:5500/index.html`
   - Admin: `http://192.168.1.100:5500/admin.html`
   - Cars: `http://192.168.1.100:5500/cars.html`

---

## 🔥 Firewall Issues?

If you can't access from your phone, Windows Firewall might be blocking it.

### Allow Port Through Firewall:

**Windows Firewall:**
1. Open **Windows Defender Firewall**
2. Click **"Advanced settings"**
3. Click **"Inbound Rules"** → **"New Rule"**
4. Select **"Port"** → Next
5. Select **TCP**, enter port number (e.g., `5500` or `8000`)
6. Allow the connection → Next
7. Check all profiles → Next
8. Name it "HOME AFRICA Server" → Finish

**Or use PowerShell (Run as Administrator):**
```powershell
# For port 5500
New-NetFirewallRule -DisplayName "HOME AFRICA Server" -Direction Inbound -LocalPort 5500 -Protocol TCP -Action Allow

# For port 8000
New-NetFirewallRule -DisplayName "HOME AFRICA Server" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```

---

## 📝 Quick Reference

**Find IP Address:**
```bash
ipconfig | findstr /i "IPv4"
```

**Start Python Server:**
```bash
python -m http.server 8000
```

**Access URL Format:**
```
http://[YOUR_IP]:[PORT]/[page].html
```

---

## ✅ Test Checklist

- [ ] Computer and phone on same Wi-Fi
- [ ] Found computer's IP address
- [ ] Server is running
- [ ] Firewall allows the port
- [ ] Can access from phone browser

---

## 🎯 Pro Tip

**Bookmark the IP address** on your phone for quick access during development!

**Example bookmark:**
- Name: `HOME AFRICA (Dev)`
- URL: `http://192.168.1.100:5500`

---

**Need help? Check the console for errors or try accessing from another device on the same network!** 🚀

