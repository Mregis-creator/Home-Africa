# Fix: Service Worker Preview Error

## Problem
Error: "Could not register service worker: InvalidStateError: Failed to register a ServiceWorker: The document is in an invalid state."

## Cause
This error occurs when the browser preview tries to register a Service Worker, but:
- The page is served via `file://` protocol (not supported)
- The browser's webview is in an invalid state
- There's a cached service worker registration attempt

## Solutions

### Solution 1: Use a Local Server (Recommended)
Instead of opening files directly, use a local server:

**Option A: Using Python (if installed)**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```
Then open: `http://localhost:8000`

**Option B: Using Node.js (if installed)**
```bash
# Install http-server globally
npm install -g http-server

# Run server
http-server -p 8000
```
Then open: `http://localhost:8000`

**Option C: Using VS Code Live Server Extension**
1. Install "Live Server" extension in VS Code/Cursor
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Solution 2: Clear Browser Cache
1. Open browser DevTools (F12)
2. Go to Application tab
3. Click "Service Workers" in left sidebar
4. Click "Unregister" for any registered service workers
5. Clear browser cache (Ctrl+Shift+Delete)
6. Reload the page

### Solution 3: Ignore the Error (If Preview Still Works)
If the preview still works despite the error, you can ignore it. The error is from the browser's preview feature, not your code.

### Solution 4: Disable Service Worker Registration (If Any)
If you have any service worker registration code (we didn't find any), wrap it in a check:

```javascript
if ('serviceWorker' in navigator && window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
  navigator.serviceWorker.register('/sw.js');
}
```

## Recommended Approach
**Use Live Server extension** - It's the easiest and most reliable way to preview your HTML files with proper HTTP protocol support.

