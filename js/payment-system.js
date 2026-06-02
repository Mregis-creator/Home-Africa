/**
 * HOME AFRICA Payment System - Rwanda MoMo & Bank Integration
 * Handles MTN Mobile Money and Bank of Kigali payments
 */

class PaymentSystem {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.userId = null;
    this.config = null;
  }

  async init() {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (session?.user) {
      this.userId = session.user.id;
    }
    await this.loadConfig();
  }

  async loadConfig() {
    const { data } = await this.supabase
      .from('payment_platform_config')
      .select('*')
      .limit(1)
      .single();
    this.config = data;
  }

  // Create a new payment
  async createPayment({ type, amount, method, description, invoiceId, subscriptionId }) {
    try {
      const { data, error } = await this.supabase
        .rpc('create_payment_transaction', {
          p_user_id: this.userId,
          p_payment_type: type,
          p_amount: amount,
          p_payment_method: method,
          p_description: description,
          p_invoice_id: invoiceId || null,
          p_subscription_id: subscriptionId || null
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating payment:', error);
      return { success: false, error: error.message };
    }
  }

  // Get payment by ID
  async getPayment(transactionId) {
    const { data, error } = await this.supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', this.userId)
      .single();

    if (error) return null;
    return data;
  }

  // Get user's payment history
  async getPaymentHistory() {
    const { data, error } = await this.supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data;
  }

  // Upload payment proof (screenshot)
  async uploadProof(transactionId, file) {
    try {
      // Upload to Supabase Storage
      const fileName = `payment-proofs/${transactionId}-${Date.now()}.${file.name.split('.').pop()}`;
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('payments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('payments')
        .getPublicUrl(fileName);

      // Update transaction
      await this.supabase
        .from('payment_transactions')
        .update({
          receipt_url: publicUrl,
          status: 'awaiting_confirmation',
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
        .eq('user_id', this.userId);

      return { success: true, url: publicUrl };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Confirm payment sent (after user pays)
  async confirmPaymentSent(transactionId, { senderPhone, senderName, transactionRef }) {
    try {
      const { error } = await this.supabase
        .from('payment_transactions')
        .update({
          status: 'awaiting_confirmation',
          sender_phone: senderPhone,
          sender_name: senderName,
          momo_transaction_id: transactionRef,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
        .eq('user_id', this.userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Check payment status
  async checkStatus(transactionId) {
    const payment = await this.getPayment(transactionId);
    if (!payment) return null;
    
    return {
      status: payment.status,
      isCompleted: payment.status === 'completed',
      isPending: payment.status === 'pending' || payment.status === 'awaiting_confirmation',
      instructions: payment.payment_instructions
    };
  }

  // Render payment modal
  renderPaymentModal(containerId, paymentData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const instructions = paymentData.instructions || {};
    const isMoMo = paymentData.payment_method === 'momo_mtn';
    const isBank = paymentData.payment_method === 'bank_bok';

    container.innerHTML = `
      <div class="modal fade show" style="display: block; background: rgba(0,0,0,0.5);">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header" style="background: linear-gradient(90deg, #00e6d8 0%, #00c853 100%); color: white;">
              <h5 class="modal-title">
                <i class="bi bi-credit-card"></i> Complete Your Payment
              </h5>
              <button type="button" class="btn-close btn-close-white" onclick="closePaymentModal()"></button>
            </div>
            <div class="modal-body p-4">
              
              <!-- Amount Display -->
              <div class="text-center mb-4">
                <div class="display-4 fw-bold text-primary">${paymentData.amount.toLocaleString()} RWF</div>
                <div class="text-muted">Reference: <code class="bg-light px-2 py-1 rounded">${paymentData.reference}</code></div>
              </div>

              <!-- Payment Method Tabs -->
              <ul class="nav nav-pills nav-fill mb-4">
                <li class="nav-item">
                  <a class="nav-link ${isMoMo ? 'active bg-warning text-dark' : ''}" href="#">
                    <i class="bi bi-phone"></i> MTN MoMo
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link ${isBank ? 'active' : ''}" href="#">
                    <i class="bi bi-bank"></i> Bank Transfer
                  </a>
                </li>
              </ul>

              <!-- MoMo Instructions -->
              ${isMoMo ? `
                <div class="alert alert-warning">
                  <h6><i class="bi bi-phone"></i> Send Money via MTN MoMo</h6>
                  <hr>
                  <div class="row">
                    <div class="col-md-6">
                      <p><strong>Recipient:</strong><br>
                      ${instructions.recipient_name}<br>
                      <span class="fs-4">${instructions.recipient_number}</span></p>
                      
                      <p><strong>Amount:</strong> <span class="fs-4">${instructions.amount} RWF</span></p>
                      
                      <p><strong>Reference (Important!):</strong><br>
                      <code class="bg-dark text-warning px-2 py-1 fs-5">${instructions.reference}</code></p>
                    </div>
                    <div class="col-md-6">
                      <!-- ONE-TAP USSD BUTTON -->
                      <div class="d-grid gap-2 mb-3">
                        <a href="tel:${instructions.ussd_code || '*182#'}" 
                           class="btn btn-warning btn-lg"
                           onclick="trackUssdClick()">
                          <i class="bi bi-phone-fill"></i> Use MoMo
                        </a>
                        <small class="text-center text-muted">Tap to open dialer with pre-filled code</small>
                      </div>
                      
                      <!-- USSD Code Display -->
                      <div class="bg-dark text-warning p-2 rounded mb-2 font-monospace text-center">
                        <small class="text-muted d-block">USSD Code:</small>
                        <code class="fs-6">${instructions.ussd_code || '*182#'}</code>
                      </div>
                      
                      <div class="alert alert-info small py-2">
                        <i class="bi bi-magic"></i> <strong>One-Tap Pay:</strong> Click "Use MoMo" button above to automatically open your dialer with everything filled in. Just review and press call!
                      </div>
                      
                      <h6 class="mt-3">Or Pay Manually:</h6>
                      <ol class="small">
                        ${instructions.instructions?.map(step => `<li>${step}</li>`).join('')}
                      </ol>
                      <div class="mt-2 p-2 bg-light rounded small">
                        <i class="bi bi-info-circle"></i> ${instructions.alternative}
                      </div>
                    </div>
                  </div>
                </div>
              ` : ''}

              <!-- Bank Instructions -->
              ${isBank ? `
                <div class="alert alert-info">
                  <h6><i class="bi bi-bank"></i> Bank Transfer to Bank of Kigali</h6>
                  <hr>
                  <div class="row">
                    <div class="col-md-6">
                      <p><strong>Bank:</strong> ${instructions.bank_name}</p>
                      <p><strong>Account Number:</strong><br>
                      <span class="fs-4 font-monospace">${instructions.account_number}</span></p>
                      <p><strong>Account Name:</strong> ${instructions.account_name}</p>
                      <p><strong>SWIFT:</strong> ${instructions.swift_code}</p>
                    </div>
                    <div class="col-md-6">
                      <p><strong>Amount:</strong> <span class="fs-4">${instructions.amount} RWF</span></p>
                      <p><strong>Reference (Important!):</strong><br>
                      <code class="bg-dark text-info px-2 py-1 fs-5">${instructions.reference}</code></p>
                      
                      <div class="mt-3">
                        <h6>Steps:</h6>
                        <ol class="small">
                          ${instructions.instructions?.map(step => `<li>${step}</li>`).join('')}
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              ` : ''}

              <!-- Important Notice -->
              <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle-fill"></i>
                <strong>Important:</strong> You MUST include the reference code <code>${paymentData.reference}</code> in your payment description/message. This helps us identify your payment quickly.
              </div>

              <!-- Payment Confirmation Form -->
              <div class="card mt-3">
                <div class="card-header bg-light">
                  <h6 class="mb-0"><i class="bi bi-check-circle"></i> I've Made the Payment</h6>
                </div>
                <div class="card-body">
                  <form id="paymentConfirmForm">
                    <div class="row">
                      <div class="col-md-4 mb-3">
                        <label class="form-label">Your Phone (last 4 digits)</label>
                        <input type="text" class="form-control" id="senderPhone" maxlength="4" placeholder="1234">
                      </div>
                      <div class="col-md-4 mb-3">
                        <label class="form-label">Transaction Ref (if any)</label>
                        <input type="text" class="form-control" id="transactionRef" placeholder="MTN123456">
                      </div>
                      <div class="col-md-4 mb-3">
                        <label class="form-label">Upload Proof (Screenshot)</label>
                        <input type="file" class="form-control" id="proofFile" accept="image/*">
                      </div>
                    </div>
                    <button type="button" class="btn btn-success w-100" onclick="submitPaymentConfirmation('${paymentData.transaction_id}')">
                      <i class="bi bi-check-lg"></i> Confirm Payment Sent
                    </button>
                  </form>
                </div>
              </div>

              <!-- Payment Status -->
              <div id="paymentStatus" class="mt-3 text-center" style="display: none;">
                <div class="spinner-border text-primary"></div>
                <p class="mt-2">Verifying payment... This may take a few minutes.</p>
              </div>

            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closePaymentModal()">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Store payment data for later use
    container.dataset.paymentId = paymentData.transaction_id;
  }

  // Render payment history
  renderPaymentHistory(containerId, payments) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!payments || payments.length === 0) {
      container.innerHTML = `
        <div class="text-center p-4 text-muted">
          <i class="bi bi-receipt fs-1"></i>
          <p class="mt-2">No payment history yet</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${payments.map(p => `
              <tr>
                <td><code>${p.internal_reference}</code></td>
                <td>${this.formatPaymentType(p.payment_type)}</td>
                <td>${p.amount.toLocaleString()} ${p.currency}</td>
                <td>${this.formatPaymentMethod(p.payment_method)}</td>
                <td>
                  <span class="badge bg-${this.getStatusColor(p.status)}">
                    ${p.status}
                  </span>
                </td>
                <td>${new Date(p.created_at).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  formatPaymentType(type) {
    const types = {
      subscription: 'Subscription',
      lead_fee: 'Lead Fee',
      sponsored_post: 'Sponsored Post',
      featured_listing: 'Featured Listing',
      invoice_payment: 'Invoice'
    };
    return types[type] || type;
  }

  formatPaymentMethod(method) {
    const methods = {
      momo_mtn: 'MTN MoMo',
      momo_airtel: 'Airtel Money',
      bank_bok: 'Bank of Kigali'
    };
    return methods[method] || method;
  }

  getStatusColor(status) {
    const colors = {
      pending: 'warning',
      awaiting_confirmation: 'info',
      completed: 'success',
      failed: 'danger',
      cancelled: 'secondary',
      refunded: 'dark'
    };
    return colors[status] || 'secondary';
  }
}

// Global instance
let paymentSystem = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  const supabaseClient = window.getSupabaseClient ? window.getSupabaseClient() : window.supabaseClient;
  if (supabaseClient) {
    paymentSystem = new PaymentSystem(supabaseClient);
    await paymentSystem.init();
  }
});

// Global helper functions
function closePaymentModal() {
  const modal = document.querySelector('.modal.show');
  if (modal) {
    modal.style.display = 'none';
    modal.remove();
  }
}

async function submitPaymentConfirmation(transactionId) {
  if (!paymentSystem) return;

  const senderPhone = document.getElementById('senderPhone')?.value;
  const transactionRef = document.getElementById('transactionRef')?.value;
  const proofFile = document.getElementById('proofFile')?.files[0];

  // Show loading
  document.getElementById('paymentStatus').style.display = 'block';

  // Upload proof if provided
  if (proofFile) {
    await paymentSystem.uploadProof(transactionId, proofFile);
  }

  // Confirm payment
  const result = await paymentSystem.confirmPaymentSent(transactionId, {
    senderPhone,
    senderName: '',
    transactionRef
  });

  if (result.success) {
    alert('Payment confirmation submitted! We will verify and update your account shortly.');
    closePaymentModal();
  } else {
    alert('Error: ' + result.error);
    document.getElementById('paymentStatus').style.display = 'none';
  }
}

// Check payment status periodically
async function pollPaymentStatus(transactionId, callback) {
  const checkStatus = async () => {
    const status = await paymentSystem.checkStatus(transactionId);
    if (status) {
      callback(status);
      if (status.isPending) {
        setTimeout(checkStatus, 10000); // Check every 10 seconds
      }
    }
  };
  checkStatus();
}

// Track USSD button click
function trackUssdClick() {
  console.log('USSD button clicked - opening dialer');
  // Can be used for analytics tracking
  // e.g., Google Analytics, Mixpanel, etc.
  if (typeof gtag !== 'undefined') {
    gtag('event', 'momo_ussd_click', {
      event_category: 'payment',
      event_label: 'mtn_momo'
    });
  }
}

// Copy USSD code to clipboard (for sharing or manual entry)
function copyUssdCode(code) {
  navigator.clipboard.writeText(code);
  showNotification('USSD code copied! Paste in dialer', 'success');
}
