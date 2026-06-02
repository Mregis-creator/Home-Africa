# HOME AFRICA Email Automation System - Setup Guide

## Overview
This system provides automated email notifications for key events in the HOME AFRICA platform using Supabase Edge Functions + Resend.

## Supported Email Types

| Event | Template | Recipients |
|-------|----------|------------|
| User Signup | `welcome-email` | New users |
| New Lead | `new-lead-notification` | Merchants/Agents |
| Payment Confirmed | `payment-confirmation` | Users |
| Payment Failed | `payment-confirmation` | Users |
| New Message | `new-message-notification` | Message recipients |
| Role Upgrade | `role-upgrade` | Users whose role changed |
| Engagement (Favorite/Like/Comment) | `engagement-notification` | Listing owners |
| Password Reset | `password-reset-custom` | Users requesting reset |

## Architecture

```
Database Event → Trigger Function → Email Queue → Edge Function → Resend API → User Inbox
```

1. **Database Triggers** detect events (new user, new lead, payment, etc.)
2. **Queue System** ensures reliable delivery with retries
3. **Edge Functions** generate HTML emails and call Resend API
4. **Email Service** (Resend) delivers to user inboxes

## Setup Steps

### Step 1: Get Resend API Key

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your domain:
   - For testing: Use `regismuhakwa@gmail.com` as sender
   - For production: Verify `home-africa.com` domain
4. Create an API key
5. Copy the API key (starts with `re_`)

### Step 2: Set Environment Variables

In Supabase Dashboard:

1. Go to **Project Settings** → **API** → **Edge Functions**
2. Add these secrets:

```
RESEND_API_KEY = re_your_api_key_here
FROM_EMAIL = HOME AFRICA <regismuhakwa@gmail.com>
EDGE_FUNCTION_KEY = your_supabase_service_role_key
```

### Step 3: Deploy Edge Functions

Install Supabase CLI if not already installed:
```bash
npm install -g supabase
```

Login and deploy:
```bash
supabase login
supabase link --project-ref ojaofgrbyzwgwyzbyqnp

# Deploy all functions
supabase functions deploy welcome-email
supabase functions deploy new-lead-notification
supabase functions deploy payment-confirmation
supabase functions deploy new-message-notification
supabase functions deploy role-upgrade
supabase functions deploy engagement-notification
supabase functions deploy password-reset-custom
```

### Step 4: Run SQL Setup

1. Open Supabase SQL Editor
2. Copy contents of `supabase/email-triggers-setup.sql`
3. Run the script

This creates:
- Email queue table
- Database triggers
- Helper functions
- Queue processing functions

### Step 5: Test the System

#### Test Welcome Email:
```sql
-- Insert test into queue
SELECT queue_email(
  'welcome-email',
  'your-test-email@gmail.com',
  '{"userEmail": "your-test-email@gmail.com", "userName": "Test User", "role": "user"}'::jsonb
);

-- Process the queue
SELECT send_queued_emails(1);
```

Check your email inbox!

#### Monitor Queue:
```sql
-- View all queued emails
SELECT * FROM email_queue ORDER BY created_at DESC;

-- Check queue status
SELECT status, COUNT(*) FROM email_queue GROUP BY status;

-- View failed emails
SELECT * FROM email_queue WHERE status = 'failed';
```

## Email Templates

All emails use the HOME AFRICA brand styling:
- Dark gradient header with logo
- Cyan/lime green accent colors
- Professional, modern design
- Mobile-responsive

### Template Variables

#### Welcome Email
```json
{
  "userEmail": "user@example.com",
  "userName": "John Doe",
  "role": "merchant"
}
```

#### New Lead Notification
```json
{
  "merchantEmail": "merchant@example.com",
  "merchantName": "Jane Seller",
  "leadName": "Interested Buyer",
  "leadEmail": "buyer@example.com",
  "leadPhone": "+250...",
  "leadMessage": "Is this still available?",
  "productTitle": "3BR Apartment in Kacyiru",
  "productType": "apartment",
  "productUrl": "https://..."
}
```

#### Payment Confirmation
```json
{
  "userEmail": "user@example.com",
  "userName": "John Doe",
  "amount": 50000,
  "currency": "RWF",
  "paymentMethod": "momo_mtn",
  "reference": "PAY-123456",
  "status": "confirmed",
  "description": "Subscription payment"
}
```

#### New Message
```json
{
  "recipientEmail": "user@example.com",
  "recipientName": "John Doe",
  "senderName": "Jane Seller",
  "messagePreview": "Hello, I'm interested in...",
  "threadId": "uuid",
  "productTitle": "3BR Apartment",
  "unreadCount": 3
}
```

#### Role Upgrade
```json
{
  "userEmail": "user@example.com",
  "userName": "John Doe",
  "oldRole": "user",
  "newRole": "merchant",
  "approvedBy": "Admin User",
  "approvedAt": "2026-01-01T00:00:00Z"
}
```

#### Engagement Notification
```json
{
  "merchantEmail": "merchant@example.com",
  "merchantName": "Jane Seller",
  "engagementType": "favorite",
  "productTitle": "3BR Apartment",
  "productType": "apartment",
  "productUrl": "https://...",
  "engagementUser": "John Doe",
  "commentText": "Great location!",
  "totalCount": 15,
  "dailyCount": 3
}
```

## Daily Operations

### Check Queue Health
```sql
SELECT 
  status,
  COUNT(*) as count,
  MAX(created_at) as last_activity
FROM email_queue
GROUP BY status;
```

### Retry Failed Emails
```sql
-- Reset failed emails to pending (up to 3 retries)
UPDATE email_queue 
SET status = 'pending', retry_count = retry_count + 1
WHERE status = 'failed' AND retry_count < 3;

-- Process them
SELECT send_queued_emails(50);
```

### Clear Old Sent Emails
```sql
-- Archive or delete emails older than 30 days
DELETE FROM email_queue 
WHERE status = 'sent' AND created_at < NOW() - INTERVAL '30 days';
```

## Integration with Frontend

### From JavaScript/Frontend:

```javascript
// Manually trigger welcome email after signup
async function sendWelcomeEmail(userEmail, userName, role) {
  const { data, error } = await supabase
    .rpc('queue_email', {
      p_template: 'welcome-email',
      p_recipient_email: userEmail,
      p_payload: {
        userEmail,
        userName,
        role
      }
    });
  
  if (error) console.error('Failed to queue welcome email:', error);
  else console.log('Welcome email queued:', data);
}

// Send custom email
async function notifyMerchantOfLead(leadData) {
  const { data, error } = await supabase
    .rpc('queue_email', {
      p_template: 'new-lead-notification',
      p_recipient_email: leadData.merchantEmail,
      p_payload: leadData
    });
}
```

## Troubleshooting

### Emails Not Sending

1. **Check Environment Variables**
   ```bash
   supabase secrets list
   ```

2. **Check Function Logs**
   ```bash
   supabase functions logs welcome-email --tail
   ```

3. **Verify Queue Status**
   ```sql
   SELECT * FROM email_queue WHERE status = 'failed';
   ```

4. **Test Resend API Key**
   ```bash
   curl -X POST 'https://api.resend.com/emails' \
     -H 'Authorization: Bearer re_your_api_key' \
     -H 'Content-Type: application/json' \
     -d '{
       "from": "HOME AFRICA <regismuhakwa@gmail.com>",
       "to": "test@example.com",
       "subject": "Test",
       "html": "<p>Test</p>"
     }'
   ```

### Common Issues

| Issue | Solution |
|-------|----------|
| "RESEND_API_KEY not configured" | Add secret in Supabase Dashboard |
| Emails stuck in "pending" | Run `SELECT send_queued_emails(10);` |
| "Failed" status | Check error_message column for details |
| Template not found | Verify function name matches template column |
| Domain not verified | Complete domain verification in Resend |

## Rate Limits

### Resend (Free Tier)
- 100 emails/day
- 2 emails/second
- 1 domain

### Resend (Paid - $20/month)
- 50,000 emails/month
- 10 emails/second
- Multiple domains

### Supabase Edge Functions
- 500,000 invocations/month (free tier)
- 10 second timeout per invocation

## Next Steps / Future Enhancements

1. **Email Preferences**: Allow users to opt-out of non-essential emails
2. **Batch Processing**: Group multiple notifications into digest emails
3. **A/B Testing**: Test different email templates for better engagement
4. **Analytics**: Track open rates, click rates via Resend dashboard
5. **SMS Notifications**: Add Twilio integration for critical alerts
6. **Push Notifications**: Add web push for real-time alerts

## Support

For issues:
1. Check Resend Dashboard: https://resend.com
2. Check Supabase Logs: Functions → Logs
3. Query email_queue table for detailed error messages

---

**Last Updated:** May 2026  
**Version:** 1.0  
**Maintainer:** HOME AFRICA Dev Team
