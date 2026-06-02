// HOME AFRICA - Payment Confirmation Email Edge Function
// Triggered when payment status changes to 'confirmed' or 'completed'

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { sendEmail, getBaseEmailTemplate } from '../_shared/email-service.ts';

interface PaymentPayload {
  userEmail: string;
  userName?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  reference: string;
  status: 'confirmed' | 'completed' | 'failed';
  productTitle?: string;
  description?: string;
  receiptUrl?: string;
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
    const payload: PaymentPayload = await req.json();
    
    const {
      userEmail,
      userName,
      amount,
      currency,
      paymentMethod,
      reference,
      status,
      productTitle,
      description,
      receiptUrl,
    } = payload;

    if (!userEmail || !amount || !reference) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isSuccess = status === 'confirmed' || status === 'completed';
    const statusEmoji = isSuccess ? '✅' : '❌';
    const statusColor = isSuccess ? '#00d084' : '#ff4757';
    const statusText = isSuccess ? 'Payment Confirmed' : 'Payment Failed';

    const methodEmoji = paymentMethod.includes('momo') ? '📱' : '🏦';
    const methodName = paymentMethod.includes('momo') ? 'MTN Mobile Money' : 'Bank of Kigali';

    const content = `
      <div class="title-bar">
        <h1 style="color: ${statusColor};">${statusEmoji} ${statusText}</h1>
      </div>
      
      <p class="body-text">
        ${isSuccess 
          ? `Hi ${userName || 'there'}, your payment has been successfully processed. Thank you for choosing HOME AFRICA!`
          : `Hi ${userName || 'there'}, we encountered an issue processing your payment. Please review the details below.`
        }
      </p>
      
      <div class="highlight-box" style="border-color: ${statusColor}; background: ${isSuccess ? 'linear-gradient(135deg, #f0fffa 0%, #f5fff0 100%)' : 'linear-gradient(135deg, #fff5f5 0%, #fff0f0 100%)'};">
        <h3 style="color: ${statusColor};">Transaction Details</h3>
        <div class="info-row">
          <span class="info-label">Reference</span>
          <span class="info-value" style="font-family: monospace;">${reference}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Amount</span>
          <span class="info-value">${currency} ${amount.toLocaleString()}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Method</span>
          <span class="info-value">${methodEmoji} ${methodName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status</span>
          <span class="info-value" style="color: ${statusColor};">${status.toUpperCase()}</span>
        </div>
        ${productTitle ? `
        <div class="info-row">
          <span class="info-label">For</span>
          <span class="info-value">${productTitle}</span>
        </div>
        ` : ''}
        ${description ? `
        <div class="info-row">
          <span class="info-label">Description</span>
          <span class="info-value">${description}</span>
        </div>
        ` : ''}
      </div>
      
      ${isSuccess ? `
      <center>
        ${receiptUrl ? `
        <a href="${receiptUrl}" class="cta-button" style="margin-right: 10px;">
          Download Receipt 📄
        </a>
        ` : ''}
        <a href="https://home-africa.com/profile.html" class="cta-button">
          View Order →
        </a>
      </center>
      
      <div style="background: #e8f5e9; border-left: 4px solid #00d084; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
        <p style="color: #2e7d32; font-size: 14px; margin: 0;">
          <strong>✓ What's Next?</strong> You'll receive a confirmation call within 24 hours. Your receipt is attached for your records.
        </p>
      </div>
      ` : `
      <center>
        <a href="https://home-africa.com/support.html" class="cta-button" style="background: linear-gradient(90deg, #ff4757 0%, #ff6348 100%); color: #fff !important;">
          Contact Support for Help →
        </a>
      </center>
      
      <div style="background: #ffebee; border-left: 4px solid #ff4757; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
        <p style="color: #c62828; font-size: 14px; margin: 0;">
          <strong>⚠️ Common Issues:</strong> Insufficient balance, wrong PIN, or network timeout. Please try again or contact support.
        </p>
      </div>
      `}
      
      <p class="body-text">
        Transaction Date: ${new Date().toLocaleString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </p>
    `;

    const result = await sendEmail({
      to: userEmail,
      subject: `${statusEmoji} Payment ${isSuccess ? 'Confirmed' : 'Failed'} - ${currency} ${amount}`,
      html: getBaseEmailTemplate(content, `Payment ${isSuccess ? 'Confirmation' : 'Failed'}`),
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Payment email error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
