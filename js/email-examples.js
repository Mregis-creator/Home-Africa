// HOME AFRICA Email Examples - How to use the email service
// Copy these examples into your signup, payment, message, and listing pages

// ============================================
// EXAMPLE 1: Send Welcome Email After Signup
// Add to signup.html after successful registration
// ============================================

async function onSignupSuccess(userData) {
  // Import or use the global emailService
  const result = await emailService.sendWelcomeEmail(
    userData.email,
    userData.full_name,
    userData.role || 'user'
  );
  
  if (result.success) {
    console.log('Welcome email sent!');
  } else {
    console.error('Failed to send welcome email:', result.error);
  }
}

// Usage in signup flow:
// After supabase.auth.signUp() succeeds, call:
// await onSignupSuccess(authData.user);


// ============================================
// EXAMPLE 2: Send Lead Notification to Merchant
// Add to inquiry/contact form submission
// ============================================

async function onInquirySubmit(leadData, merchantData, productData) {
  const result = await emailService.sendLeadNotification(
    merchantData.email,
    merchantData.name,
    {
      name: leadData.name,
      email: leadData.email,
      phone: leadData.phone,
      message: leadData.message,
      productTitle: productData.title,
      productType: productData.type, // 'apartment', 'car', 'land'
      productUrl: `https://homeafrica.it.com/${productData.type}/${productData.id}`
    }
  );
  
  return result;
}

// Usage when someone submits inquiry form:
// await onInquirySubmit(
//   { name: 'John Doe', email: 'john@example.com', phone: '+250...', message: 'Is this available?' },
//   { email: 'merchant@example.com', name: 'Property Owner' },
//   { title: '3BR Apartment Kacyiru', type: 'apartment', id: '123' }
// );


// ============================================
// EXAMPLE 3: Send Payment Confirmation
// Add to payment processing flow
// ============================================

async function onPaymentSuccess(paymentData, userData) {
  const result = await emailService.sendPaymentConfirmation(
    userData.email,
    userData.name,
    {
      amount: paymentData.amount,
      currency: paymentData.currency || 'RWF',
      paymentMethod: paymentData.method, // 'momo_mtn' or 'bank_bok'
      reference: paymentData.reference,
      status: 'confirmed',
      description: paymentData.description,
      productTitle: paymentData.productTitle
    }
  );
  
  return result;
}

// Usage after payment is confirmed:
// await onPaymentSuccess(
//   { amount: 50000, reference: 'PAY-123456', method: 'momo_mtn', description: 'Subscription' },
//   { email: 'user@example.com', name: 'John Doe' }
// );


// ============================================
// EXAMPLE 4: Send New Message Notification
// Add to message sending function
// ============================================

async function onMessageSend(recipientData, senderData, messageData) {
  const result = await emailService.sendMessageNotification(
    recipientData.email,
    recipientData.name,
    {
      senderName: senderData.name,
      preview: messageData.content.substring(0, 150),
      threadId: messageData.threadId,
      productTitle: messageData.productTitle,
      unreadCount: messageData.unreadCount
    }
  );
  
  return result;
}

// Usage when sending a message:
// await onMessageSend(
//   { email: 'recipient@example.com', name: 'Property Owner' },
//   { name: 'John Doe' },
//   { content: 'Hi, is this still available?', threadId: 'abc123', productTitle: '3BR Apartment', unreadCount: 3 }
// );


// ============================================
// EXAMPLE 5: Send Role Upgrade Notification
// Add to admin panel when upgrading user role
// ============================================

async function onRoleUpgrade(userData, newRole, adminName) {
  const result = await emailService.sendRoleUpgrade(
    userData.email,
    userData.name,
    userData.oldRole,
    newRole,
    adminName
  );
  
  return result;
}

// Usage in admin panel:
// await onRoleUpgrade(
//   { email: 'user@example.com', name: 'John Doe', oldRole: 'user' },
//   'merchant',
//   'Admin User'
// );


// ============================================
// EXAMPLE 6: Send Engagement Notification
// Add to favorite/like/comment actions
// ============================================

async function onEngagement(merchantData, productData, engagementData) {
  const result = await emailService.sendEngagementNotification(
    merchantData.email,
    merchantData.name,
    {
      type: engagementData.type, // 'favorite', 'like', 'comment', 'share'
      productTitle: productData.title,
      productType: productData.type,
      productUrl: productData.url,
      userName: engagementData.userName,
      comment: engagementData.comment,
      totalCount: engagementData.totalCount,
      dailyCount: engagementData.todayCount
    }
  );
  
  return result;
}

// Usage when someone favorites a listing:
// await onEngagement(
//   { email: 'merchant@example.com', name: 'Property Owner' },
//   { title: '3BR Apartment', type: 'apartment', url: 'https://...' },
//   { type: 'favorite', userName: 'John Doe', totalCount: 15, todayCount: 3 }
// );


// ============================================
// EXAMPLE 7: Password Reset
//
// NOT an EmailJS flow. Supabase Auth mints and sends the recovery email itself —
// only it can produce a link that grants the recovery session needed to actually
// change a password. emailService.sendPasswordReset() is deprecated; a link it
// sent would carry a homegrown token that changes nothing.
//
// The real implementation lives in signin.html (request) and
// reset-password.html (set the new password).
// ============================================

async function onPasswordResetRequest(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password.html`
  });

  // Respond identically whether or not the account exists — otherwise this
  // endpoint tells an attacker which emails are registered.
  return { success: !error, error };
}

// Usage in password reset flow:
// await onPasswordResetRequest(
//   { email: 'user@example.com', name: 'John Doe' },
//   'reset-token-123456'
// );


// ============================================
// SETUP INSTRUCTIONS
// ============================================

/*
1. Add this script to your HTML pages (before closing </body>):
   <script src="js/email-service.js"></script>
   <script src="js/email-examples.js"></script>

2. Update the ANON KEY in email-service.js:
   - Get it from Supabase Dashboard → Settings → API → anon/public key
   - Replace the placeholder in the file

3. Call the email functions in your event handlers

4. For testing, you can run directly in browser console:
   
   // Test welcome email
   emailService.sendWelcomeEmail('test@example.com', 'Test User', 'user')
     .then(r => console.log('Result:', r));
*/

// Quick test function
async function testEmailSystem() {
  console.log('Testing email system...');
  
  const result = await emailService.sendWelcomeEmail(
    'regismuhakwa@gmail.com',
    'Test User',
    'merchant'
  );
  
  if (result.success) {
    alert('✅ Test email sent! Check your inbox.');
  } else {
    alert('❌ Failed: ' + result.error);
  }
  
  return result;
}

// Run test: testEmailSystem();
