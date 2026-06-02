// HOME AFRICA - Welcome Email Edge Function
// Triggered when new user signs up

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { sendEmail, getBaseEmailTemplate, EmailTemplateData } from '../_shared/email-service.ts';

interface WelcomePayload {
  userEmail: string;
  userName?: string;
  role?: string;
}

serve(async (req) => {
  // CORS headers
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
    const { userEmail, userName, role }: WelcomePayload = await req.json();

    if (!userEmail) {
      return new Response(JSON.stringify({ error: 'User email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const name = userName || userEmail.split('@')[0];
    const userRole = role || 'user';

    const content = `
      <div class="title-bar">
        <h1>🎉 Welcome to HOME AFRICA, ${name}!</h1>
      </div>
      
      <p class="body-text">
        You're now part of Rwanda's most trusted real estate and lifestyle platform. 
        We're excited to help you find your dream home, sell your property, or grow your business with us.
      </p>
      
      <div class="highlight-box">
        <h3>What's Next?</h3>
        <div class="info-row">
          <span class="info-label">Your Account Type</span>
          <span class="info-value" style="text-transform: capitalize;">${userRole}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value">${userEmail}</span>
        </div>
      </div>
      
      <p class="body-text">
        ${userRole === 'merchant' 
          ? 'Your merchant dashboard is ready! Start listing properties and connecting with buyers.'
          : userRole === 'agent'
          ? 'Your agent tools are ready! Manage clients and track your commissions.'
          : 'Start browsing thousands of verified properties, cars, and land plots across Rwanda.'}
      </p>
      
      <center>
        <a href="https://home-africa.com/dashboard.html" class="cta-button">
          ${userRole === 'user' ? 'Explore Listings →' : 'Go to Dashboard →'}
        </a>
      </center>
      
      <p class="body-text" style="margin-top: 30px;">
        <strong>Need help?</strong> Our support team is available 24/7. Reply to any of our emails or 
        <a href="mailto:support@home-africa.com" style="color: #00d084;">contact us directly</a>.
      </p>
      
      <p class="body-text">
        Best regards,<br>
        <strong>The HOME AFRICA Team</strong>
      </p>
    `;

    const result = await sendEmail({
      to: userEmail,
      subject: '🏠 Welcome to HOME AFRICA - Your Journey Begins!',
      html: getBaseEmailTemplate(content, 'Welcome to HOME AFRICA'),
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Welcome email error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
