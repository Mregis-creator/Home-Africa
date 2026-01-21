# 🔐 Role-Based Access Control (RBAC) System

## Overview

A comprehensive privilege management system has been implemented to control user access based on roles and permissions.

## Roles Defined

### 1. **User** (Default)
- Browse and search listings
- Create "Want to Buy" posts
- View profiles
- Send messages
- Create bookings
- Favorite listings

### 2. **Merchant**
- All user permissions PLUS:
- Create listings
- Edit/delete own listings
- Manage bookings
- Access merchant dashboard
- Create merchant posts
- Verify merchant account

### 3. **Admin**
- All merchant permissions PLUS:
- Edit/delete ALL listings
- Verify listings and merchants
- Manage all users
- Access admin panel
- Manage verification requests
- View analytics
- Manage system settings

### 4. **AI Bot**
- View listings
- Search listings
- Respond to queries

---

## Files Created

1. **`js/rbac.js`** - Core RBAC system
   - Role and permission management
   - Permission checking
   - Role-based UI updates

2. **`js/role-guard.js`** - Page and feature protection
   - Protects admin pages
   - Protects merchant pages
   - Subscription checking

---

## Usage Examples

### Check Permission
```javascript
// Check if user can create listings
if (window.rbac.hasPermission('create_listings')) {
  // Show create listing button
}

// Check if user is admin
if (window.rbac.hasRole('admin')) {
  // Show admin features
}
```

### Protect Page
```javascript
// In page script
if (!window.rbac.hasRole('admin')) {
  window.location.href = 'index.html';
}
```

### Protect Function
```javascript
// Protect a function call
window.roleGuard.protect('delete_listings', () => {
  // Delete listing code
}, () => {
  alert('You cannot delete listings');
});
```

### Check Action on Resource
```javascript
// Check if user can edit a specific listing
const canEdit = window.rbac.canPerformAction('update', 'listing', {
  user_id: listing.merchant_id
});

if (canEdit) {
  // Show edit button
}
```

### Get Role Badge
```javascript
// Display role badge
const badge = window.rbac.getRoleBadge('admin');
document.getElementById('roleBadge').innerHTML = badge;
```

---

## Protected Pages

### Admin Only
- `admin.html` - Admin panel

### Merchant Only
- `dashboard.html` - Merchant dashboard
- `post.html` - Post listings

### Authenticated Users
- `create-post.html` - Create posts
- `messages.html` - Messages
- `profile.html` - Profile
- `network.html` - Network

---

## Database Integration

Roles are stored in the `users` table:
- `role` column: 'user', 'merchant', 'admin', 'ai_bot'

To update a user's role (admin only):
```javascript
await window.rbac.updateUserRole(userId, 'merchant');
```

---

## UI Integration

### Hide/Show Elements by Role

Add `data-role` attribute to hide elements:
```html
<!-- Only visible to admins -->
<button data-role="admin">Delete User</button>

<!-- Only visible to merchants -->
<div data-role="merchant">Merchant Dashboard</div>
```

Add `data-show-role` to show for specific role:
```html
<!-- Only visible to merchants -->
<div data-show-role="merchant">Merchant Content</div>
```

---

## Permission List

### User Permissions
- `view_listings`
- `search_listings`
- `create_post`
- `view_profile`
- `edit_own_profile`
- `send_messages`
- `create_booking`
- `view_own_bookings`
- `favorite_listings`
- `view_own_posts`

### Merchant Permissions
- `create_listings`
- `edit_own_listings`
- `delete_own_listings`
- `view_own_listings`
- `manage_own_listings`
- `view_merchant_bookings`
- `manage_merchant_bookings`
- `view_merchant_dashboard`
- `create_merchant_posts`
- `edit_merchant_profile`
- `verify_merchant_account`
- `view_merchant_analytics`

### Admin Permissions
- `view_all_listings`
- `edit_all_listings`
- `delete_all_listings`
- `verify_listings`
- `verify_merchants`
- `view_all_users`
- `edit_all_users`
- `delete_users`
- `view_all_bookings`
- `manage_all_bookings`
- `view_admin_panel`
- `manage_verification_requests`
- `view_analytics`
- `manage_settings`
- `view_email_notifications`
- `manage_subscriptions`

---

## Setup Instructions

1. **Add RBAC scripts to pages:**
```html
<script src="js/rbac.js"></script>
<script src="js/role-guard.js"></script>
```

2. **Protect admin pages:**
```html
<!-- In admin.html -->
<script>
  if (!window.rbac || !window.rbac.hasRole('admin')) {
    window.location.href = 'index.html';
  }
</script>
```

3. **Update protected-pages.js:**
The existing `protected-pages.js` will work alongside RBAC. RBAC provides more granular control.

---

## Testing

### Test Admin Access
1. Login as admin
2. Try accessing `admin.html` - Should work
3. Logout and try again - Should redirect

### Test Merchant Access
1. Login as merchant
2. Try accessing `dashboard.html` - Should work
3. Login as regular user - Should redirect

### Test Permissions
```javascript
// In browser console
console.log(window.rbac.getCurrentRole());
console.log(window.rbac.getCurrentPermissions());
console.log(window.rbac.hasPermission('create_listings'));
```

---

## Security Notes

1. **Client-side checks are for UX only** - Always validate on backend
2. **Use Supabase RLS policies** - Implement Row Level Security
3. **Check subscriptions** - Merchants need active subscriptions
4. **Audit logs** - Log all permission checks (future enhancement)

---

## Future Enhancements

- [ ] Permission groups/custom roles
- [ ] Time-based permissions
- [ ] IP-based restrictions
- [ ] Audit logging
- [ ] Permission inheritance
- [ ] Resource-level permissions

---

**Status: ✅ RBAC System Implemented**

The privilege management system is now active and protecting your platform!

