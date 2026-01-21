/**
 * Supabase Merchants Helper
 * Handles merchant account operations in Supabase
 */

class SupabaseMerchants {
  constructor() {
    this.supabase = window.supabaseClient;
    if (!this.supabase) {
      console.error('Supabase client not initialized');
    }
  }

  /**
   * Create a merchant account
   * @param {string} userId - Supabase Auth UID
   * @param {object} merchantData - Merchant data
   * @returns {Promise<object>} Created merchant
   */
  async createMerchant(userId, merchantData) {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      // First, ensure user exists in users table
      const { data: existingUser, error: userError } = await this.supabase
        .from('users')
        .select('id')
        .eq('email', merchantData.email || merchantData.merchantEmail)
        .single();

      let userIdUuid = null;

      if (existingUser) {
        userIdUuid = existingUser.id;
      } else {
        // Create user first
        // FREE ACCESS MODE: Automatically set role to 'merchant' (no payment required)
        const { data: newUser, error: createUserError } = await this.supabase
          .from('users')
          .insert([{
            email: merchantData.email || merchantData.merchantEmail,
            full_name: merchantData.merchantName || merchantData.name,
            role: 'merchant', // FREE ACCESS: Automatically merchant role
            verified: false,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (createUserError) {
          throw new Error(`Failed to create user: ${createUserError.message}`);
        }

        userIdUuid = newUser.id;
      }

      // Create merchant record
      const merchantRecord = {
        id: userIdUuid,
        business_name: merchantData.merchantName || merchantData.name || 'Business',
        business_type: merchantData.business_type || 'individual',
        address: merchantData.address || '',
        city: merchantData.city || '',
        country: merchantData.country || 'Rwanda',
        verified: merchantData.verified || false,
        rating: merchantData.rating || 0,
        total_reviews: merchantData.totalReviews || merchantData.total_reviews || 0,
        total_listings: merchantData.totalListings || merchantData.total_listings || 0
      };

      const { data, error } = await this.supabase
        .from('merchants')
        .insert([merchantRecord])
        .select()
        .single();

      if (error) {
        // If merchant already exists, update it
        if (error.code === '23505') { // Unique violation
          const { data: updated, error: updateError } = await this.supabase
            .from('merchants')
            .update(merchantRecord)
            .eq('id', userIdUuid)
            .select()
            .single();

          if (updateError) throw updateError;
          return updated;
        }
        throw error;
      }

      console.log('✅ Merchant created in Supabase:', data);
      return data;

    } catch (error) {
      console.error('❌ Error creating merchant:', error);
      throw error;
    }
  }

  /**
   * Check if email is registered as merchant
   * @param {string} email - Email address
   * @returns {Promise<boolean>} True if merchant exists
   */
  async isMerchant(email) {
    if (!this.supabase) {
      return false;
    }

    try {
      // Check in users table with merchant role
      const { data, error } = await this.supabase
        .from('users')
        .select('id, role')
        .eq('email', email)
        .eq('role', 'merchant')
        .single();

      if (error || !data) {
        return false;
      }

      // Also check merchants table
      const { data: merchant, error: merchantError } = await this.supabase
        .from('merchants')
        .select('id')
        .eq('id', data.id)
        .single();

      return !merchantError && merchant !== null;

    } catch (error) {
      console.error('Error checking merchant:', error);
      return false;
    }
  }

  /**
   * Get merchant by email
   * @param {string} email - Email address
   * @returns {Promise<object|null>} Merchant data or null
   */
  async getMerchantByEmail(email) {
    if (!this.supabase) {
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          role,
          merchants (
            id,
            business_name,
            business_type,
            verified,
            rating,
            total_reviews,
            total_listings
          )
        `)
        .eq('email', email)
        .eq('role', 'merchant')
        .single();

      if (error || !data) {
        return null;
      }

      return data;

    } catch (error) {
      console.error('Error getting merchant:', error);
      return null;
    }
  }

  /**
   * Get all merchants
   * @returns {Promise<array>} List of merchants
   */
  async getAllMerchants() {
    if (!this.supabase) {
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('merchants')
        .select(`
          *,
          users (
            email,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('Error getting merchants:', error);
      return [];
    }
  }
}

// Create global instance
window.supabaseMerchants = new SupabaseMerchants();

