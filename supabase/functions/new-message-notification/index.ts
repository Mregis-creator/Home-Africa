// HOME AFRICA - New Message Notification Edge Function
// Triggered when a user receives a new message

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { sendEmail, getBaseEmailTemplate } from '../_shared/email-service.ts';

interface MessagePayload {
  recipientEmail: string;
  recipientName?: string;
  senderName: string;
  senderEmail?: string;
  messagePreview: string;
  threadId: string;
  productTitle?: string;
  unreadCount?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const payload: MessagePayload = await req.json();
    
    const {
      recipientEmail,
      recipientName,
      senderName,
      messagePreview,
      threadId,
      productTitle,
      unreadCount = 1,
    } = payload;

    if (!recipientEmail || !senderName || !messagePreview) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const badge = unreadCount > 1 ? `<span class="notification-badge">${unreadCount}</span>` : '';

    const content = `
      <div class="title-bar">
        <h1>💬 New Message ${badge}</h1>
      </div>
      
      <p class="body-text">
        Hi ${recipientName || 'there'}, you have a new message from <strong>${senderName}</strong>.
      </p>
      
      ${productTitle ? `
      <div style="background: #f0fffa; border: 1px solid #00d084; border-radius: 8px; padding: 15px 20px; margin: 20px 0;">
        <p style="color: #00d084; font-size: 14px; margin: 0; font-weight: 600;">
          📌 Regarding: ${productTitle}
        </p>
      </div>
      ` : ''}
      
      <div style="background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 25px 0; border: 1px solid #e0e0e0;">
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #00ffff 0%, #8fff00 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-right: 15px;">
            👤
          </div>
          <div>
            <p style="margin: 0; font-weight: 700; color: #333;">${senderName}</p>
            <p style="margin: 0; font-size: 12px; color: #888;">Just now</p>
          </div>
        </div>
        <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0; font-style: italic;">
          "${messagePreview.length > 150 ? messagePreview.substring(0, 150) + '...' : messagePreview}"
        </p>
      </div>
      
      <center>
        <a href="https://home-africa.com/messages.html?thread=${threadId}" class="cta-button">
          View & Reply →
        </a>
      </center>
      
      ${unreadCount > 1 ? `
      <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
        <p style="color: #e65100; font-size: 14px; margin: 0;">
          <strong>📬 You have ${unreadCount} unread messages</strong> in your inbox. Don't keep them waiting!
        </p>
      </div>
      ` : ''}
      
      <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
        <p style="color: #1565c0; font-size: 14px; margin: 0;">
          <strong>💡 Tip:</strong> Fast responses build trust. Try to reply within 30 minutes during business hours.
        </p>
      </div>
      
      <p class="body-text" style="margin-top: 30px;">
        Don't want these notifications? 
        <a href="https://home-africa.com/settings.html#notifications" style="color: #00d084;">Manage notification settings</a>
      </p>
    `;

    const result = await sendEmail({
      to: recipientEmail,
      subject: `💬 New message from ${senderName}${unreadCount > 1 ? ` (${unreadCount} unread)` : ''}`,
      html: getBaseEmailTemplate(content, 'New Message'),
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Message notification error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
