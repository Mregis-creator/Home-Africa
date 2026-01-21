# Quick Fix: Blank Admin Panel

## 🔴 Problem
Only seeing background, no content visible.

## ⚡ Quick Fix - Run This in Console (F12)

Copy and paste this entire code block into browser console:

```javascript
// Force show admin panel
const adminPanel = document.getElementById('adminPanel');
if (adminPanel) {
  adminPanel.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 10 !important; width: 100% !important; min-height: 100vh !important;';
}

const navbar = document.querySelector('#adminPanel .navbar');
if (navbar) {
  navbar.style.cssText = 'display: block !important; visibility: visible !important; position: relative !important; z-index: 11 !important;';
}

const adminContainer = document.querySelector('.admin-container');
if (adminContainer) {
  adminContainer.style.cssText = 'display: block !important; visibility: visible !important; position: relative !important; z-index: 10 !important; padding-top: 2rem !important; padding-bottom: 4rem !important;';
}

const innerContainer = document.querySelector('.admin-container .container');
if (innerContainer) {
  innerContainer.style.cssText = 'display: block !important; visibility: visible !important;';
}

const statsRow = document.querySelector('.row.mb-4');
if (statsRow) {
  statsRow.style.cssText = 'display: flex !important; visibility: visible !important;';
}

const tabsNav = document.querySelector('.nav-tabs');
if (tabsNav) {
  tabsNav.style.cssText = 'display: flex !important; visibility: visible !important;';
}

const listingsTab = document.getElementById('listingsTab');
if (listingsTab) {
  listingsTab.style.cssText = 'display: block !important; visibility: visible !important;';
}

// Reload dashboard
if (typeof loadDashboard === 'function') {
  loadDashboard();
} else {
  console.log('loadDashboard function not found');
}

console.log('✅ Admin panel forced visible!');
```

## 🔄 After Running

1. **Refresh the page** (F5)
2. **Content should appear**

---

**Run the code above in console to force show the admin panel!** 🚀

