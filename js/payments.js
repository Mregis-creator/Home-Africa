/**
 * Payment Integration - Stripe Checkout
 * Handles merchant account subscription payments
 * 
 * ============================================
 * CURRENT STATUS: DISABLED - FREE ACCESS MODE
 * ============================================
 * All payment functionality is commented out.
 * All features are FREE during initial launch.
 * Uncomment when ready to monetize.
 */

class PaymentSystem {
  constructor() {
    this.stripe = null;
    // DISABLED: Payment system initialization
    // this.init();
  }

  /**
   * Initialize Stripe
   * DISABLED: Commented out for free access mode
   */
  init() {
    /* COMMENTED OUT - Payment initialization (keep for future use)
    // Stripe publishable key - REPLACE WITH YOUR ACTUAL KEY
    const stripeKey = 'pk_test_51Q...'; // TODO: Add your Stripe publishable key
    
    if (typeof Stripe !== 'undefined') {
      this.stripe = Stripe(stripeKey);
    } else {
      console.warn('Stripe.js not loaded. Payment features will not work.');
    }
    */
  }

  /**
   * Create checkout session for merchant subscription
   * DISABLED: Payment not required (free access mode)
   * @param {string} userId - User ID
   * @param {string} email - User email
   * @param {string} planId - Subscription plan ID (basic, standard, premium)
   * @returns {Promise<string>} Checkout session URL
   */
  async createCheckoutSession(userId, email, planId = 'basic') {
    // FREE ACCESS MODE: No payment required
    console.log('Payment disabled: All features are free');
    return null;
    
    /* COMMENTED OUT - Payment checkout code (keep for future use)
    try {
      // Plan pricing (in RWF cents)
      const plans = {
        basic: {
          priceId: 'price_basic_monthly', // TODO: Replace with actual Stripe Price ID
          amount: 50000, // 50,000 RWF = 500 RWF cents (if 1 RWF = 0.01 cent)
          name: 'Basic Merchant Account',
          description: 'Monthly subscription for basic merchant features'
        },
        standard: {
          priceId: 'price_standard_monthly',
          amount: 100000,
          name: 'Standard Merchant Account',
          description: 'Monthly subscription for standard merchant features'
        },
        premium: {
          priceId: 'price_premium_monthly',
          amount: 200000,
          name: 'Premium Merchant Account',
          description: 'Monthly subscription for premium merchant features'
        }
      };

      const plan = plans[planId] || plans.basic;

      // Create checkout session via backend (you'll need to create this endpoint)
      // For now, we'll use a client-side approach with Stripe Checkout
      if (!this.stripe) {
        throw new Error('Stripe not initialized');
      }

      // Note: In production, create checkout sessions via your backend API
      // This is a simplified client-side example
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email,
          planId,
          priceId: plan.priceId,
          successUrl: `${window.location.origin}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/signup.html?canceled=true`
        })
      });

      if (!response.ok) {
        // Fallback: Use direct Stripe Checkout (requires backend setup)
        throw new Error('Backend checkout session creation failed. Please set up your payment endpoint.');
      }

      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      const { error } = await this.stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        throw error;
      }

      return sessionId;

    } catch (error) {
      console.error('Error creating checkout session:', error);
      
      // Fallback: Show manual payment instructions
      this.showManualPaymentInstructions(planId);
      throw error;
    }
    */
  }

  /**
   * Show manual payment instructions (fallback)
   * DISABLED: Not needed in free access mode
   */
  showManualPaymentInstructions(planId) {
    // DISABLED: No payment instructions needed
    return;
    
    /* COMMENTED OUT - Manual payment instructions (keep for future use)
    const plans = {
      basic: { amount: 50000, name: 'Basic' },
      standard: { amount: 100000, name: 'Standard' },
      premium: { amount: 200000, name: 'Premium' }
    };
    
    const plan = plans[planId] || plans.basic;
    
    alert(`Payment integration is being set up.\n\nFor now, please contact us to complete your ${plan.name} subscription (${plan.amount.toLocaleString()} RWF/month).\n\nEmail: payments@home.africa\nPhone: +250 788 123 456`);
    */
  }

  /**
   * Verify payment and activate merchant account
   * DISABLED: No payment verification needed (free access mode)
   * @param {string} sessionId - Stripe checkout session ID
   */
  async verifyPayment(sessionId) {
    // FREE ACCESS MODE: No verification needed
    console.log('Payment verification disabled: All features are free');
    return { success: true };
    
    /* COMMENTED OUT - Payment verification code (keep for future use)
    try {
      // Verify payment via backend
      const response = await fetch(`/api/verify-payment?session_id=${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Payment verification failed');
      }

      const { paid, userId, planId } = await response.json();
      
      if (paid) {
        // Activate merchant account in Supabase
        if (window.supabaseClient) {
          await window.supabaseClient
            .from('users')
            .update({
              role: 'merchant',
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);

          // Store subscription info
          await window.supabaseClient
            .from('merchant_subscriptions')
            .insert([{
              merchant_id: userId,
              plan_id: planId,
              status: 'active',
              started_at: new Date().toISOString()
            }]);
        }

        return { success: true, userId, planId };
      }

      return { success: false, error: 'Payment not completed' };

    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
    */
  }

  /**
   * Check if user has active subscription
   * DISABLED: Always returns true (free access mode)
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if has active subscription
   */
  async hasActiveSubscription(userId) {
    // FREE ACCESS MODE: Always return true
    return true;
    
    /* COMMENTED OUT - Subscription check code (keep for future use)
    try {
      if (!window.supabaseClient) return false;

      const { data, error } = await window.supabaseClient
        .from('merchant_subscriptions')
        .select('status, expires_at')
        .eq('merchant_id', userId)
        .eq('status', 'active')
        .single();

      if (error || !data) return false;

      // Check if subscription hasn't expired
      if (data.expires_at) {
        return new Date(data.expires_at) > new Date();
      }

      return true;

    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
    */
  }
}

// Create global instance
window.paymentSystem = new PaymentSystem();
