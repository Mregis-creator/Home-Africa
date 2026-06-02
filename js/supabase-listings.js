/**
 * Supabase Listings Helper
 * Handles listing operations in Supabase
 */

class SupabaseListings {
  constructor() {
    this.supabase = window.supabaseClient;
    if (!this.supabase) {
      console.error('Supabase client not initialized');
    }
  }

  /**
   * Create a listing
   * @param {object} listingData - Listing data
   * @returns {Promise<object>} Created listing
   */
  async createListing(listingData) {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      // Get or create merchant ID (optional - can be null)
      let merchantId = null;
      
      if (listingData.merchantEmail || listingData.merchantName) {
        try {
          // Try to find merchant by email
          const { data: merchant, error: merchantError } = await this.supabase
            .from('users')
            .select('id, merchants!inner(id)')
            .eq('email', listingData.merchantEmail)
            .eq('role', 'merchant')
            .maybeSingle();

          if (!merchantError && merchant && merchant.merchants && merchant.merchants.length > 0) {
            merchantId = merchant.merchants[0].id;
            console.log('✅ Found merchant ID:', merchantId);
          } else {
            console.log('ℹ️ Merchant not found in Supabase, proceeding without merchant_id');
          }
        } catch (merchantLookupError) {
          console.warn('⚠️ Could not lookup merchant, proceeding without merchant_id:', merchantLookupError);
        }
      }

      // Get logged-in user ID
      let userId = null;
      try {
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session?.user) userId = session.user.id;
      } catch (e) { /* ignore */ }

      // Prepare listing record
      const listingRecord = {
        type: listingData.type || 'apartment',
        title: listingData.title || '',
        description: listingData.description || '',
        price: parseFloat(listingData.price) || 0,
        currency: 'RWF',
        status: 'active',
        location: listingData.location ? (typeof listingData.location === 'string' ? { city: listingData.location } : listingData.location) : { city: listingData.city || '', district: listingData.district || '', address: listingData.address || '' },
        images: listingData.images || [],
        metadata: {
          ...(listingData.metadata || {}),
          merchantName: listingData.merchantName || listingData.metadata?.merchantName,
          merchantContact: listingData.merchantContact || listingData.metadata?.merchantContact,
          merchantEmail: listingData.merchantEmail || listingData.metadata?.merchantEmail
        },
        views: 0,
        favorites: 0
      };

      if (userId) listingRecord.user_id = userId;
      
      // Only add merchant_id if we found one (to avoid foreign key constraint errors)
      if (merchantId) {
        listingRecord.merchant_id = merchantId;
      }

      console.log('📝 Inserting listing record:', listingRecord);

      const { data, error } = await this.supabase
        .from('listings')
        .insert([listingRecord])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase insert error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw new Error(`Supabase error: ${error.message} (Code: ${error.code})`);
      }

      if (!data) {
        throw new Error('No data returned from Supabase insert');
      }

      console.log('✅ Listing created in Supabase:', data);
      return data;

    } catch (error) {
      console.error('❌ Error creating listing:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Get listings by type
   * @param {string} type - Listing type (apartment, car, land)
   * @param {object} filters - Filter options
   * @returns {Promise<array>} List of listings
   */
  async getListings(type, filters = {}) {
    if (!this.supabase) {
      return [];
    }

    try {
      let query = this.supabase
        .from('listings')
        .select('*')
        .eq('type', type)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.minPrice) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters.city) {
        query = query.eq('location->>city', filters.city);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('Error getting listings:', error);
      return [];
    }
  }

  /**
   * Get listing by ID
   * @param {string} listingId - Listing ID
   * @returns {Promise<object|null>} Listing or null
   */
  async getListingById(listingId) {
    if (!this.supabase) {
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (error) {
        return null;
      }

      return data;

    } catch (error) {
      console.error('Error getting listing:', error);
      return null;
    }
  }

  /**
   * Update listing views
   * @param {string} listingId - Listing ID
   */
  async incrementViews(listingId) {
    if (!this.supabase) {
      return;
    }

    try {
      await this.supabase.rpc('increment_listing_views', {
        listing_id: listingId
      });
    } catch (error) {
      // If RPC doesn't exist, do manual update
      const { data: listing } = await this.getListingById(listingId);
      if (listing) {
        await this.supabase
          .from('listings')
          .update({ views: (listing.views || 0) + 1 })
          .eq('id', listingId);
      }
    }
  }

  /**
   * Get listings by merchant name
   * @param {string} merchantName - Merchant name
   * @param {string} type - Listing type (optional)
   * @returns {Promise<array>} List of listings
   */
  async getListingsByUser(userId, type = null) {
    if (!this.supabase || !userId) return [];
    try {
      let query = this.supabase
        .from('listings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (type) query = query.eq('type', type);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting listings by user:', error);
      return [];
    }
  }

  async getListingsByMerchant(merchantName, type = null) {
    if (!this.supabase) {
      return [];
    }

    try {
      let query = this.supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // Filter by merchant name in metadata
      query = query.eq('metadata->>merchantName', merchantName);

      // Filter by type if provided
      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('Error getting listings by merchant:', error);
      return [];
    }
  }

  /**
   * Update a listing
   * @param {string} listingId - Listing ID
   * @param {object} updateData - Data to update
   * @returns {Promise<object>} Updated listing
   */
  async updateListing(listingId, updateData) {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      // Prepare update record
      const updateRecord = {};
      
      if (updateData.title !== undefined) updateRecord.title = updateData.title;
      if (updateData.price !== undefined) updateRecord.price = parseFloat(updateData.price) || 0;
      if (updateData.description !== undefined) updateRecord.description = updateData.description;
      
      // Handle location update
      if (updateData.location !== undefined) {
        if (typeof updateData.location === 'string') {
          updateRecord.location = { city: updateData.location };
        } else {
          updateRecord.location = updateData.location;
        }
      }

      // Handle metadata updates (for mileage, size, etc.)
      if (updateData.mileage !== undefined || updateData.size !== undefined) {
        // Get current listing to preserve existing metadata
        const currentListing = await this.getListingById(listingId);
        const currentMetadata = currentListing?.metadata || {};
        
        updateRecord.metadata = {
          ...currentMetadata,
          ...(updateData.mileage !== undefined && { mileage: updateData.mileage }),
          ...(updateData.size !== undefined && { size: updateData.size })
        };
      }

      const { data, error } = await this.supabase
        .from('listings')
        .update(updateRecord)
        .eq('id', listingId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;

    } catch (error) {
      console.error('Error updating listing:', error);
      throw error;
    }
  }

  /**
   * Delete a listing
   * @param {string} listingId - Listing ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteListing(listingId) {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      // Soft delete by setting status to 'deleted'
      const { error } = await this.supabase
        .from('listings')
        .update({ status: 'deleted' })
        .eq('id', listingId);

      if (error) {
        throw error;
      }

      return true;

    } catch (error) {
      console.error('Error deleting listing:', error);
      throw error;
    }
  }
}

// Create global instance
window.supabaseListings = new SupabaseListings();

