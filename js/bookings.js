/**
 * Booking System - Supabase Integration
 * Handles property viewing bookings, test drives, consultations
 */

class BookingSystem {
  constructor() {
    this.supabase = window.supabaseClient;
  }

  /**
   * Create a booking
   * @param {object} bookingData - Booking data
   * @returns {Promise<object>} Created booking
   */
  async createBooking(bookingData) {
    try {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Get listing and merchant info
      const { data: listing, error: listingError } = await this.supabase
        .from('listings')
        .select('id, merchant_id, title, metadata')
        .eq('id', bookingData.listingId)
        .single();

      if (listingError || !listing) {
        throw new Error('Listing not found');
      }

      // Get current user ID
      const userId = this.getCurrentUserId();
      if (!userId) {
        throw new Error('User must be logged in to create a booking');
      }

      // Create booking record
      const bookingRecord = {
        listing_id: bookingData.listingId,
        user_id: userId,
        merchant_id: listing.merchant_id,
        booking_type: bookingData.bookingType || 'viewing',
        scheduled_date: bookingData.scheduledDate,
        scheduled_time: bookingData.scheduledTime,
        status: 'pending',
        notes: bookingData.notes || bookingData.message,
        contact_name: bookingData.name,
        contact_phone: bookingData.phone,
        contact_email: bookingData.email || bookingData.contactEmail,
        created_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('bookings')
        .insert([bookingRecord])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Send email notifications
      if (window.emailNotifications) {
        try {
          // Get user email
          const { data: userData } = await this.supabase
            .from('users')
            .select('email, full_name')
            .eq('id', userId)
            .single();

          // Get merchant email
          const { data: merchantData } = await this.supabase
            .from('users')
            .select('email, full_name')
            .eq('id', listing.merchant_id)
            .single();

          await window.emailNotifications.sendBookingConfirmation({
            userEmail: userData?.email || bookingData.email,
            userName: bookingData.name || userData?.full_name,
            listingTitle: listing.title,
            scheduledDate: bookingData.scheduledDate,
            merchantName: listing.metadata?.merchantName || merchantData?.full_name,
            merchantEmail: merchantData?.email
          });
        } catch (emailError) {
          console.warn('Failed to send booking email:', emailError);
          // Don't fail the booking if email fails
        }
      }

      console.log('✅ Booking created:', data);
      return data;

    } catch (error) {
      console.error('❌ Error creating booking:', error);
      throw error;
    }
  }

  /**
   * Get bookings for a user
   * @param {string} userId - User ID (optional, uses current user if not provided)
   * @returns {Promise<array>} List of bookings
   */
  async getUserBookings(userId = null) {
    try {
      if (!this.supabase) return [];

      const targetUserId = userId || this.getCurrentUserId();
      if (!targetUserId) return [];

      const { data, error } = await this.supabase
        .from('bookings')
        .select(`
          *,
          listings (
            id,
            title,
            type,
            images,
            price
          )
        `)
        .eq('user_id', targetUserId)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error getting user bookings:', error);
      return [];
    }
  }

  /**
   * Get bookings for a merchant
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<array>} List of bookings
   */
  async getMerchantBookings(merchantId) {
    try {
      if (!this.supabase) return [];

      const { data, error } = await this.supabase
        .from('bookings')
        .select(`
          *,
          listings (
            id,
            title,
            type,
            images
          ),
          users (
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('merchant_id', merchantId)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error getting merchant bookings:', error);
      return [];
    }
  }

  /**
   * Update booking status
   * @param {string} bookingId - Booking ID
   * @param {string} status - New status (pending, confirmed, cancelled, completed)
   * @returns {Promise<object>} Updated booking
   */
  async updateBookingStatus(bookingId, status) {
    try {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await this.supabase
        .from('bookings')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  }

  /**
   * Get current user ID
   */
  getCurrentUserId() {
    // Try Supabase auth first
    if (this.supabase && this.supabase.auth) {
      try {
        const session = this.supabase.auth.getSession();
        if (session?.data?.session?.user) {
          return session.data.session.user.id;
        }
      } catch (e) {
        // Session check failed, fallback to localStorage
      }
    }
    
    // Fallback to localStorage
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        return user.id;
      } catch (e) {
        // Invalid JSON
      }
    }
    
    return localStorage.getItem('userId');
  }
}

// Create global instance
window.bookingSystem = new BookingSystem();

