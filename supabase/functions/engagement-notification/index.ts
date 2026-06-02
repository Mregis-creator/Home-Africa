// HOME AFRICA - Engagement Notification Edge Function
// Triggered when someone favorites, likes, or comments on a merchant's listing

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { sendEmail, getBaseEmailTemplate } from '../_shared/email-service.ts';

interface EngagementPayload {
  merchantEmail: string;
  merchantName?: string;
  engagementType: 'favorite' | 'like' | 'comment' | 'share' | 'view';
  productTitle: string;
  productType: string;
  productUrl: string;
  engagementUser?: string;
  commentText?: string;
  totalCount?: number;
  dailyCount?: number;
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
    const payload: EngagementPayload = await req.json();
    
    const {
      merchantEmail,
      merchantName,
      engagementType,
      productTitle,
      productType,
      productUrl,
      engagementUser,
      commentText,
      totalCount,
      dailyCount,
    } = payload;

    if (!merchantEmail || !engagementType || !productTitle) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const typeConfig: Record<string, { emoji: string; title: string; color: string; action: string }> = {
      favorite: {
        emoji: '⭐',
        title: 'New Favorite!',
        color: '#ffc107',
        action: 'added to favorites',
      },
      like: {
        emoji: '❤️',
        title: 'New Like!',
        color: '#ff4757',
        action: 'liked',
      },
      comment: {
        emoji: '💬',
        title: 'New Comment!',
        color: '#00d084',
        action: 'commented on',
      },
      share: {
        emoji: '🔗',
        title: 'Your listing was shared!',
        color: '#2196f3',
        action: 'shared',
      },
      view: {
        emoji: '👀',
        title: 'Getting Attention!',
        color: '#9c27b0',
        action: 'viewed',
      },
    };

    const config = typeConfig[engagementType];
    const typeEmoji = productType === 'apartment' ? '🏢' : productType === 'car' ? '🚗' : '🌿';

    let commentSection = '';
    if (engagementType === 'comment' && commentText) {
      commentSection = `
      <div style="background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 25px 0; border: 1px solid #e0e0e0;">
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #00ffff 0%, #8fff00 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; margin-right: 15px;">
            💬
          </div>
          <div>
            <p style="margin: 0; font-weight: 700; color: #333;">${engagementUser || 'Someone'}</p>
            <p style="margin: 0; font-size: 12px; color: #888;">Just now</p>
          </div>
        </div>
        <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0; font-style: italic;">
          "${commentText}"
        </p>
      </div>
      `;
    }

    const statsSection = (totalCount || dailyCount) ? `
    <div style="background: linear-gradient(135deg, #f0f7ff 0%, #f5f0ff 100%); border-radius: 12px; padding: 20px; margin: 25px 0;">
      <h4 style="color: #333; margin-bottom: 15px; font-size: 16px;">📊 Engagement Stats</h4>
      <div style="display: flex; gap: 30px; flex-wrap: wrap;">
        ${totalCount ? `
        <div>
          <p style="color: #888; font-size: 12px; margin: 0;">Total ${engagementType}s</p>
          <p style="color: #333; font-size: 24px; font-weight: 700; margin: 0;">${totalCount}</p>
        </div>
        ` : ''}
        ${dailyCount ? `
        <div>
          <p style="color: #888; font-size: 12px; margin: 0;">Today</p>
          <p style="color: #00d084; font-size: 24px; font-weight: 700; margin: 0;">+${dailyCount}</p>
        </div>
        ` : ''}
      </div>
    </div>
    ` : '';

    const content = `
      <div class="title-bar">
        <h1 style="color: ${config.color};">${config.emoji} ${config.title}</h1>
      </div>
      
      <p class="body-text">
        Hi ${merchantName || 'there'}, your listing is getting attention!
      </p>
      
      <div style="background: linear-gradient(135deg, #f0fffa 0%, #f5fff0 100%); border-radius: 12px; padding: 25px; margin: 25px 0; border: 2px solid #00d084;">
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <div style="font-size: 40px; margin-right: 20px;">${typeEmoji}</div>
          <div>
            <h3 style="color: #333; margin: 0; font-size: 18px;">${productTitle}</h3>
            <p style="color: #888; margin: 5px 0 0 0; font-size: 14px; text-transform: capitalize;">${productType}</p>
          </div>
        </div>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <p style="font-size: 48px; margin: 0;">${config.emoji}</p>
        <p style="color: #555; font-size: 16px; margin: 10px 0 0 0;">
          <strong>${engagementUser || 'Someone'}</strong> ${config.action} your listing
        </p>
      </div>
      
      ${commentSection}
      ${statsSection}
      
      <center>
        <a href="${productUrl}" class="cta-button">
          View Listing & Engage →
        </a>
      </center>
      
      <div style="background: #fff8e1; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
        <p style="color: #856404; font-size: 14px; margin: 0;">
          <strong>💡 Pro Tip:</strong> Engaging with users who interact with your listings increases your chances of closing deals by 3x!
        </p>
      </div>
      
      <p class="body-text">
        Keep up the great work! Your listings are performing well.
      </p>
      
      <p class="body-text">
        Best regards,<br>
        <strong>The HOME AFRICA Team</strong>
      </p>
    `;

    const result = await sendEmail({
      to: merchantEmail,
      subject: `${config.emoji} ${config.title} - ${productTitle}`,
      html: getBaseEmailTemplate(content, `New ${engagementType.charAt(0).toUpperCase() + engagementType.slice(1)} on Your Listing`),
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Engagement notification error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
