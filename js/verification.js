/**
 * Verification System
 * Handles merchant and listing verification
 */

class VerificationSystem {
  constructor() {
    this.supabase = window.supabaseClient;
  }

  /**
   * Request merchant verification
   * @param {string} merchantId - Merchant ID
   * @param {object} verificationData - Verification documents/data
   */
  async requestMerchantVerification(merchantId, verificationData) {
    try {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Upload verification documents to Supabase Storage
      const documentUrls = [];
      if (verificationData.documents) {
        for (const doc of verificationData.documents) {
          const url = await this.uploadVerificationDocument(merchantId, doc);
          documentUrls.push(url);
        }
      }

      // Create verification request
      const { data, error } = await this.supabase
        .from('verification_requests')
        .insert([{
          merchant_id: merchantId,
          request_type: 'merchant',
          status: 'pending',
          documents: documentUrls,
          business_name: verificationData.businessName,
          tax_id: verificationData.taxId,
          address: verificationData.address,
          phone: verificationData.phone,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Notify admin
      await this.notifyAdminOfVerificationRequest(data.id, 'merchant');

      return data;

    } catch (error) {
      console.error('Error requesting verification:', error);
      throw error;
    }
  }

  /**
   * Upload verification document
   */
  async uploadVerificationDocument(merchantId, file) {
    try {
      if (!window.supabaseStorage) {
        throw new Error('Supabase Storage not initialized');
      }

      const fileName = `verifications/${merchantId}/${Date.now()}_${file.name}`;
      const { data, error } = await window.supabaseStorage.supabase.storage
        .from('verifications')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = window.supabaseStorage.supabase.storage
        .from('verifications')
        .getPublicUrl(fileName);

      return urlData.publicUrl;

    } catch (error) {
      console.error('Error uploading verification document:', error);
      throw error;
    }
  }

  /**
   * Check if merchant is verified
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<boolean>} True if verified
   */
  async isMerchantVerified(merchantId) {
    try {
      if (!this.supabase) return false;

      const { data, error } = await this.supabase
        .from('merchants')
        .select('verified')
        .eq('id', merchantId)
        .single();

      if (error || !data) return false;
      return data.verified === true;

    } catch (error) {
      console.error('Error checking verification:', error);
      return false;
    }
  }

  /**
   * Verify a listing (admin function)
   * @param {string} listingId - Listing ID
   * @param {string} adminId - Admin user ID
   */
  async verifyListing(listingId, adminId) {
    try {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Check if user is admin
      const { data: admin } = await this.supabase
        .from('users')
        .select('role')
        .eq('id', adminId)
        .single();

      if (!admin || admin.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      // Update listing
      const { data, error } = await this.supabase
        .from('listings')
        .update({
          verified: true,
          verified_at: new Date().toISOString(),
          verified_by: adminId
        })
        .eq('id', listingId)
        .select()
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('Error verifying listing:', error);
      throw error;
    }
  }

  /**
   * Get verification badge HTML
   * @param {boolean} verified - Whether verified
   * @returns {string} HTML for verification badge
   */
  getVerificationBadge(verified) {
    if (verified) {
      return '<span class="badge bg-success"><i class="bi bi-check-circle"></i> Verified</span>';
    }
    return '<span class="badge bg-secondary"><i class="bi bi-clock"></i> Pending Verification</span>';
  }

  /**
   * Notify admin of verification request
   */
  async notifyAdminOfVerificationRequest(requestId, type) {
    try {
      // Get admin emails
      const { data: admins } = await this.supabase
        .from('users')
        .select('email')
        .eq('role', 'admin');

      if (admins && admins.length > 0 && window.emailNotifications) {
        for (const admin of admins) {
          await window.emailNotifications.sendEmail({
            to: admin.email,
            subject: `New ${type} Verification Request`,
            type: 'verification_request',
            html: `
              <h2>New Verification Request</h2>
              <p>A new ${type} verification request has been submitted.</p>
              <p>Request ID: ${requestId}</p>
              <p>Please review and approve or reject the request in the admin panel.</p>
            `
          });
        }
      }
    } catch (error) {
      console.error('Error notifying admin:', error);
    }
  }
}

// Create global instance
window.verificationSystem = new VerificationSystem();

