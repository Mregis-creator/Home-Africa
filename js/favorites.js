/**
 * Favorites Manager for HOME AFRICA
 * 
 * Handles saving/removing favorite listings (apartments, cars, land)
 * Stores in localStorage for anonymous users, can be upgraded to Supabase for logged-in users
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'home_africa_favorites';

  /**
   * Get all favorites (localStorage fallback)
   */
  function getFavorites() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error reading favorites:', e);
      return [];
    }
  }

  /**
   * Save favorites to localStorage (fallback)
   */
  function saveFavorites(favorites) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error('Error saving favorites:', e);
    }
  }

  /**
   * Get favorites from Supabase
   */
  async function getFavoritesFromSupabase() {
    try {
      var client = getSupabaseClient();
      if (!client) return null;

      var { data: { user } } = await client.auth.getUser();
      if (!user) return null;

      var { data, error } = await client
        .from('favorites')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    } catch (e) {
      console.error('Error fetching favorites from Supabase:', e);
      return null;
    }
  }

  /**
   * Create notification for a user
   */
  async function createNotification(client, recipientId, type, title, body, actionUrl) {
    try {
      await client
        .from('notifications')
        .insert({
          user_id: recipientId,
          type: type,
          title: title,
          body: body,
          action_url: actionUrl,
          read_at: null
        });
    } catch (e) {
      console.warn('Failed to create notification:', e);
    }
  }

  /**
   * Save favorite to Supabase
   */
  async function saveFavoriteToSupabase(favorite) {
    try {
      var client = getSupabaseClient();
      if (!client) return false;

      var { data: { user } } = await client.auth.getUser();
      if (!user) return false;

      var { error } = await client
        .from('favorites')
        .insert({
          user_id: user.id,
          listing_id: favorite.id,
          listing_type: favorite.type,
          data: favorite.data
        });

      if (error) throw error;

      // Notify listing owner (best-effort, no await)
      try {
        var buyerName = user.email?.split('@')[0] || 'Someone';
        var { data: listing } = await client
          .from('listings')
          .select('user_id, title, price')
          .eq('id', favorite.id)
          .single();
        if (listing?.user_id && listing.user_id !== user.id) {
          var actionUrl = (favorite.type === 'car' ? 'car-detail.html' :
                          favorite.type === 'land' ? 'land-detail.html' :
                          'apartment-detail.html') + '?id=' + favorite.id;
          createNotification(client, listing.user_id, 'favorite',
            'New favorite on your listing',
            buyerName + ' saved "' + (listing.title || 'your listing') + '" to favorites',
            actionUrl);
        }
      } catch (e) { /* non-critical */ }

      return true;
    } catch (e) {
      console.error('Error saving favorite to Supabase:', e);
      return false;
    }
  }

  /**
   * Remove favorite from Supabase
   */
  async function removeFavoriteFromSupabase(listingId, listingType) {
    try {
      var client = getSupabaseClient();
      if (!client) return false;

      var { data: { user } } = await client.auth.getUser();
      if (!user) return false;

      var { error } = await client
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('listing_id', listingId)
        .eq('listing_type', listingType);

      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Error removing favorite from Supabase:', e);
      return false;
    }
  }

  /**
   * Check if a listing is favorited
   */
  function isFavorited(listingId, listingType) {
    var favorites = getFavorites();
    return favorites.some(function (fav) {
      return fav.id === listingId && fav.type === listingType;
    });
  }

  /**
   * Toggle favorite status (with Supabase integration)
   */
  async function toggleFavorite(listingId, listingType, data) {
    // Try Supabase first
    var supabaseSuccess = false;
    
    try {
      var client = getSupabaseClient();
      if (client) {
        var { data: { user } } = await client.auth.getUser();
        if (user) {
          var isFav = isFavorited(listingId, listingType);
          if (isFav) {
            supabaseSuccess = await removeFavoriteFromSupabase(listingId, listingType);
          } else {
            supabaseSuccess = await saveFavoriteToSupabase({
              id: listingId,
              type: listingType,
              data: data || {}
            });
          }
        }
      }
    } catch (e) {
      console.error('Supabase favorite toggle failed, falling back to localStorage:', e);
    }

    // Fallback to localStorage
    var favorites = getFavorites();
    var index = favorites.findIndex(function (fav) {
      return fav.id === listingId && fav.type === listingType;
    });

    if (index !== -1) {
      // Remove favorite
      favorites.splice(index, 1);
      saveFavorites(favorites);
      return { favorited: false, count: favorites.length };
    } else {
      // Add favorite
      favorites.push({
        id: listingId,
        type: listingType,
        data: data || {},
        createdAt: new Date().toISOString()
      });
      saveFavorites(favorites);
      return { favorited: true, count: favorites.length };
    }
  }

  /**
   * Get favorites count
   */
  function getFavoritesCount() {
    return getFavorites().length;
  }

  /**
   * Get favorites by type
   */
  function getFavoritesByType(listingType) {
    var favorites = getFavorites();
    return favorites.filter(function (fav) {
      return fav.type === listingType;
    });
  }

  /**
   * Remove favorite by ID and type
   */
  function removeFavorite(listingId, listingType) {
    var favorites = getFavorites();
    var filtered = favorites.filter(function (fav) {
      return !(fav.id === listingId && fav.type === listingType);
    });
    saveFavorites(filtered);
    return { count: filtered.length };
  }

  /**
   * Clear all favorites
   */
  function clearFavorites() {
    localStorage.removeItem(STORAGE_KEY);
    return { count: 0 };
  }

  // Export to global scope
  window.HomeAfricaFavorites = {
    getFavorites: getFavorites,
    isFavorited: isFavorited,
    toggleFavorite: toggleFavorite,
    getFavoritesCount: getFavoritesCount,
    getFavoritesByType: getFavoritesByType,
    removeFavorite: removeFavorite,
    clearFavorites: clearFavorites
  };

  /**
   * Initialize favorite buttons on the page
   */
  function initFavoriteButtons() {
    var buttons = document.querySelectorAll('.favorite-btn');
    buttons.forEach(function (btn) {
      var listingId = btn.getAttribute('data-listing-id');
      var listingType = btn.getAttribute('data-listing-type');
      var icon = btn.querySelector('i');

      if (!listingId || !listingType) return;

      // Set initial state
      if (window.HomeAfricaFavorites.isFavorited(listingId, listingType)) {
        icon.classList.remove('bi-heart');
        icon.classList.add('bi-heart-fill');
        btn.classList.add('favorited');
      }

      // Add click handler
      btn.addEventListener('click', async function (e) {
        e.preventDefault();
        e.stopPropagation();

        // Collect listing data from the card
        var card = btn.closest('.card, .property-card');
        var listingData = {
          title: card.querySelector('.card-title')?.textContent || '',
          price: card.querySelector('.price-gradient, .text-primary')?.textContent || '',
          image: card.querySelector('img')?.src || '',
          location: card.querySelector('.card-text')?.textContent || ''
        };

        // Toggle favorite
        var result = await window.HomeAfricaFavorites.toggleFavorite(listingId, listingType, listingData);

        // Update UI
        if (result.favorited) {
          icon.classList.remove('bi-heart');
          icon.classList.add('bi-heart-fill');
          btn.classList.add('favorited');
          // Show brief notification
          showNotification('Added to favorites!');
          // Track analytics
          if (window.HomeAfricaAnalytics) {
            window.HomeAfricaAnalytics.trackFavoriteAdded(listingId, listingType);
          }
        } else {
          icon.classList.remove('bi-heart-fill');
          icon.classList.add('bi-heart');
          btn.classList.remove('favorited');
          showNotification('Removed from favorites');
          // Track analytics
          if (window.HomeAfricaAnalytics) {
            window.HomeAfricaAnalytics.trackFavoriteRemoved(listingId, listingType);
          }
        }

        // Update favorites count in navbar if exists
        updateFavoritesCount(result.count);
      });
    });
  }

  /**
   * Show brief notification
   */
  function showNotification(message) {
    var existing = document.getElementById('favorites-notification');
    if (existing) existing.remove();

    var notification = document.createElement('div');
    notification.id = 'favorites-notification';
    notification.textContent = message;
    notification.style.cssText = 'position:fixed;top:20px;right:20px;background:linear-gradient(90deg,#0ff 0%,#8fff00 100%);color:#222;padding:0.75rem 1.5rem;border-radius:8px;font-weight:bold;z-index:10001;animation:slideIn 0.3s ease-out;box-shadow:0 4px 20px rgba(0,255,255,0.3);';

    var style = document.createElement('style');
    style.textContent = '@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }';
    document.head.appendChild(style);

    document.body.appendChild(notification);

    setTimeout(function () {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(function () {
        notification.remove();
      }, 300);
    }, 2000);
  }

  /**
   * Update favorites count in navbar
   */
  function updateFavoritesCount(count) {
    var countBadge = document.getElementById('favorites-count-badge');
    if (countBadge) {
      countBadge.textContent = count;
      countBadge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initFavoriteButtons();
      updateFavoritesCount(window.HomeAfricaFavorites.getFavoritesCount());
    });
  } else {
    initFavoriteButtons();
    updateFavoritesCount(window.HomeAfricaFavorites.getFavoritesCount());
  }

  // Inject CSS for favorite buttons
  var style = document.createElement('style');
  style.textContent = `
    .favorite-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.9);
      border: 2px solid rgba(0, 255, 255, 0.5);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10;
      transition: all 0.3s ease;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }
    .favorite-btn:hover {
      background: rgba(0, 255, 255, 0.9);
      border-color: #0ff;
      transform: scale(1.1);
    }
    .favorite-btn i {
      font-size: 1.2rem;
      color: #ff4444;
      transition: all 0.3s ease;
    }
    .favorite-btn.favorited i {
      color: #ff4444;
      animation: heartBeat 0.3s ease;
    }
    .favorite-btn.favorited {
      background: rgba(255, 68, 68, 0.9);
      border-color: #ff4444;
    }
    .favorite-btn.favorited i {
      color: white;
    }
    @keyframes heartBeat {
      0% { transform: scale(1); }
      50% { transform: scale(1.3); }
      100% { transform: scale(1); }
    }
  `;
  document.head.appendChild(style);

})();
