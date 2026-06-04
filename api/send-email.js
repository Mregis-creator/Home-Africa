export default async function handler(request, response) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'HOME AFRICA <noreply@homeafrica.app>';

  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  if (!RESEND_API_KEY) {
    response.status(500).json({ error: 'Missing RESEND_API_KEY environment variable.' });
    return;
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    response.status(400).json({ error: 'Invalid JSON body.' });
    return;
  }

  const { to, subject, html, text } = body;

  if (!to || !subject) {
    response.status(400).json({ error: 'Request must include `to` and `subject`.' });
    return;
  }

  const payload = {
    from: FROM_EMAIL,
    to,
    subject,
    html: html || `<p>${text || 'No message content provided.'}</p>`,
    text: text || subject
  };

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await resendResponse.json();

    if (!resendResponse.ok) {
      response.status(resendResponse.status).json({ error: data.error || 'Failed to send email.' });
      return;
    }

    response.status(200).json({ success: true, messageId: data.id || null });
  } catch (error) {
    response.status(500).json({ error: error.message || 'Unknown server error.' });
  }
}
