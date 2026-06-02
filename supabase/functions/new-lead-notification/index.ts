// HOME AFRICA - New Lead Notification Edge Function
// Triggered when a user sends an inquiry about a listing

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { sendEmail, getBaseEmailTemplate } from '../_shared/email-service.ts';

interface LeadPayload {
  merchantEmail: string;
  merchantName?: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  leadMessage?: string;
  productTitle: string;
  productType: 'apartment' | 'car' | 'land';
  productImage?: string;
  productUrl: string;
  leadId: string;
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
    const payload: LeadPayload = await req.json();
    
    const {
      merchantEmail,
      merchantName,
      leadName,
      leadEmail,
      leadPhone,
      leadMessage,
      productTitle,
      productType,
      productUrl,
    } = payload;

    if (!merchantEmail || !leadName || !leadEmail) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const typeEmoji = productType === 'apartment' ? '🏢' : productType === 'car' ? '🚗' : '🌿';
    const typeLabel = productType.charAt(0).toUpperCase() + productType.slice(1);

    const content = `
      <div class="title-bar">
        <h1>🎯 New Lead Alert!</h1>
      </div>
      
      <p class="body-text">
        Hi ${merchantName || 'there'}, great news! Someone is interested in your listing.
      </p>
      
      <div class="highlight-box">
        <h3>${typeEmoji} ${productTitle}</h3>
        <div class="info-row">
          <span class="info-label">Property Type</span>
          <span class="info-value">${typeLabel}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Lead Name</span>
          <span class="info-value">${leadName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value">${leadEmail}</span>
        </div>
        ${leadPhone ? `
        <div class="info-row">
          <span class="info-label">Phone</span>
          <span class="info-value">${leadPhone}</span>
        </div>
        ` : ''}
      </div>
      
      ${leadMessage ? `
      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="color: #666; font-size: 14px; margin-bottom: 10px;">💬 Message from ${leadName}:</p>
        <p style="color: #333; font-style: italic; font-size: 16px;">"${leadMessage}"</p>
      </div>
      ` : ''}
      
      <center>
        <a href="${productUrl}" class="cta-button">
          View Listing & Respond →
        </a>
      </center>
      
      <div style="background: #fff8e1; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
        <p style="color: #856404; font-size: 14px; margin: 0;">
          <strong>💡 Pro Tip:</strong> Respond within 2 hours to increase your chances of closing the deal by 80%!
        </p>
      </div>
      
      <p class="body-text">
        This lead has been added to your CRM. Track all your leads in your 
        <a href="https://home-africa.com/merchant-dashboard.html" style="color: #00d084;">Merchant Dashboard</a>.
      </p>
    `;

    const result = await sendEmail({
      to: merchantEmail,
      subject: `🎯 New Lead: ${leadName} is interested in your ${typeLabel}`,
      html: getBaseEmailTemplate(content, 'New Lead Notification'),
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Lead notification error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
