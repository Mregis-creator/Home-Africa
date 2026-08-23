/**
 * HOME AFRICA - Search Functionality
 * Provides comprehensive search across listings, users, and posts
 */

class HomeAfricaSearch {
  constructor() {
    this.supabase = window.supabaseClient;
    this.currentFilter = 'all';
    this.debounceTimer = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkUrlParams();
  }

  setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // Search on button click
    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.performSearch());
    }

    // Search on Enter key
    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.performSearch();
        }
      });

      // Debounced search as user types (after 500ms of no typing)
      searchInput.addEventListener('input', () => {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          const query = searchInput.value.trim();
          if (query.length >= 2) {
            this.performSearch();
          } else if (query.length === 0) {
            this.showEmptyState();
          }
        }, 500);
      });
    }

    // Filter buttons
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.getAttribute('data-filter');
        this.performSearch(); // Re-search with new filter
      });
    });
  }

  checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query) {
      document.getElementById('searchInput').value = query;
      this.performSearch();
    }
  }

  async performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    
    if (!query || query.length < 2) {
      this.showEmptyState();
      return;
    }

    this.showLoading();

    try {
      const results = {
        listings: [],
        users: [],
        posts: []
      };

      // Search based on current filter
      if (this.currentFilter === 'all' || this.currentFilter === 'listings') {
        results.listings = await this.searchListings(query);
      }

      if (this.currentFilter === 'all' || this.currentFilter === 'users') {
        results.users = await this.searchUsers(query);
      }

      if (this.currentFilter === 'all' || this.currentFilter === 'posts') {
        results.posts = await this.searchPosts(query);
      }

      this.displayResults(results, query);
    } catch (error) {
      console.error('Search error:', error);
      this.showError('An error occurred while searching. Please try again.');
    }
  }

  async searchListings(query) {
    if (!this.supabase) return [];

    try {
      // Search in listings table using full-text search
      const { data, error } = await this.supabase
        .from('listings')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('status', 'active')
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching listings:', error);
      return [];
    }
  }

  async searchUsers(query) {
    if (!this.supabase) return [];

    try {
      // Query the public_user_cards view, not the users table directly:
      //  - the "Users read own row" RLS policy filters public.users to zero rows
      //    for anyone but the owner, so searching it returned nothing at all
      //  - the view exposes only non-PII columns (no email, phone, or KYC fields)
      //  - .ilike() passes the value as a parameter; the previous interpolated
      //    .or() filter string let a stray , ) or . rewrite the PostgREST filter
      const { data, error } = await this.supabase
        .from('public_user_cards')
        .select('id, full_name, display_name, avatar_url, role, is_verified, is_vip, city, district')
        .ilike('full_name', `%${query}%`)
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  async searchPosts(query) {
    if (!this.supabase) return [];

    try {
      // Search in posts table (if exists in Phase II schema)
      const { data, error } = await this.supabase
        .from('posts')
        .select('*')
        .or(`content.ilike.%${query}%,title.ilike.%${query}%`)
        .eq('status', 'active')
        .limit(20);

      if (error) {
        // Posts table might not exist yet, that's okay
        console.warn('Posts table not found or error:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error searching posts:', error);
      return [];
    }
  }

  displayResults(results, query) {
    const container = document.getElementById('resultsContainer');
    const statsDiv = document.getElementById('resultsStats');
    
    if (!container) return;

    const totalResults = results.listings.length + results.users.length + results.posts.length;

    // Update stats
    if (statsDiv) {
      statsDiv.style.display = 'block';
      statsDiv.innerHTML = `Found <strong>${totalResults}</strong> result${totalResults !== 1 ? 's' : ''} for "<strong>${query}</strong>"`;
    }

    if (totalResults === 0) {
      container.innerHTML = `
        <div class="no-results">
          <i class="bi bi-search"></i>
          <h4>No results found</h4>
          <p>Try different keywords or check your spelling</p>
        </div>
      `;
      return;
    }

    let html = '';

    // Display listings
    // Display listings
    if (results.listings.length > 0 && (this.currentFilter === 'all' || this.currentFilter === 'listings')) {
      html += '<div class="row g-3 mb-4">';
      results.listings.forEach(listing => {
        html += '<div class="col-md-4 col-sm-6">' + this.renderListingCard(listing) + '</div>';
      });
      html += '</div>';
    }

    // Display users
    if (results.users.length > 0 && (this.currentFilter === 'all' || this.currentFilter === 'users')) {
      results.users.forEach(user => {
        html += this.renderUserCard(user);
      });
    }

    // Display posts
    if (results.posts.length > 0 && (this.currentFilter === 'all' || this.currentFilter === 'posts')) {
      results.posts.forEach(post => {
        html += this.renderPostCard(post);
      });
    }

    container.innerHTML = html;
  }

  renderListingCard(listing) {
    const typeIcons = { car: 'bi-car-front', apartment: 'bi-building', land: 'bi-geo' };
    const typeColors = { car: '#ff0088', apartment: '#0ff', land: '#8fff00' };
    const typeLabels2 = { car: 'Car', apartment: 'Apartment', land: 'Land' };
    const t = listing.type || 'listing';
    const icon = typeIcons[t] || 'bi-tag';
    const color = typeColors[t] || '#0ff';
    const label = typeLabels2[t] || t;
    const price = listing.price ? `RWF ${parseInt(listing.price).toLocaleString()}` : 'Price on request';
    const img = listing.images?.[0] || (t === 'car' ? 'images/car1.jpg' : t === 'land' ? 'images/land1.jpg' : 'images/house1.jpg');
    const loc = (typeof listing.location === 'object' ? listing.location?.city : listing.location) || '';
    const query = document.getElementById('searchInput')?.value || '';
    const detailUrl = this.getListingDetailUrl(t) + '?id=' + listing.id;
    const verBadge = listing.verified ? '<span style="background:linear-gradient(90deg,#00b4d8,#0077b6);color:#fff;padding:1px 7px;border-radius:8px;font-size:0.72rem;font-weight:bold;margin-left:4px;"><i class="bi bi-patch-check-fill"></i></span>' : '';
    const featBadge = listing.featured ? '<span style="position:absolute;top:10px;right:10px;background:linear-gradient(90deg,#ff0088,#ff8800);color:#fff;padding:2px 8px;border-radius:8px;font-size:0.72rem;font-weight:bold;"><i class="bi bi-lightning-fill"></i> Featured</span>' : '';
    return `
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(0,255,255,0.25);border-radius:12px;overflow:hidden;cursor:pointer;height:100%;transition:all 0.3s;" onmouseover="this.style.borderColor='#0ff';this.style.transform='translateY(-4px)'" onmouseout="this.style.borderColor='rgba(0,255,255,0.25)';this.style.transform=''" onclick="window.location.href='${detailUrl}'">
        <div style="position:relative;">
          <img src="${img}" style="width:100%;height:160px;object-fit:cover;" alt="${listing.title}">
          <span style="position:absolute;top:10px;left:10px;background:${color};color:#222;padding:2px 10px;border-radius:20px;font-size:0.78rem;font-weight:bold;"><i class="bi ${icon}"></i> ${label}</span>
          ${featBadge}
        </div>
        <div style="padding:0.9rem;">
          <h6 style="color:#fff;margin-bottom:0.3rem;">${this.highlightQuery(listing.title||'Listing',query)}${verBadge}</h6>
          ${loc ? `<p style="color:rgba(255,255,255,0.5);font-size:0.82rem;margin-bottom:0.4rem;"><i class="bi bi-geo-alt"></i> ${loc}</p>` : '' }
          <p style="font-weight:bold;color:#0ff;font-size:1rem;margin-bottom:0.5rem;">${price}</p>
          <a href="${detailUrl}" class="btn btn-sm w-100" style="background:linear-gradient(90deg,#0ff,#8fff00);color:#222;border:none;font-weight:bold;">View Details</a>
        </div>
      </div>
    `;
  }

  renderUserCard(user) {
    // Fields come from the public_user_cards view — deliberately no email/phone.
    const role = user.role === 'merchant' ? 'Merchant'
      : user.role === 'agent' ? 'Agent' : 'User';
    const name = user.display_name || user.full_name || 'Unknown User';
    const location = [user.district, user.city].filter(Boolean).join(', ');

    return `
      <div class="result-card" onclick="window.location.href='profile.html?userId=${user.id}'">
        <span class="result-type-badge badge-user">👤 ${role}</span>
        <h5 class="result-title">
          ${this.highlightQuery(name, document.getElementById('searchInput').value)}
          ${user.is_verified ? '<i class="bi bi-patch-check-fill" title="Verified" style="color:#0ff;"></i>' : ''}
          ${user.is_vip ? '<i class="bi bi-star-fill" title="VIP" style="color:#ffc107;"></i>' : ''}
        </h5>
        <p class="result-description">${location || 'Rwanda'}</p>
        <div class="result-meta">
          ${location ? `<span><i class="bi bi-geo-alt"></i> ${location}</span>` : ''}
          ${user.role === 'merchant' ? '<span><i class="bi bi-shop"></i> Merchant Account</span>' : ''}
        </div>
      </div>
    `;
  }

  renderPostCard(post) {
    const content = (post.content || post.title || '').substring(0, 200);
    const createdAt = post.created_at ? new Date(post.created_at).toLocaleDateString() : '';

    return `
      <div class="result-card" onclick="window.location.href='post-detail.html?id=${post.id}'">
        <span class="result-type-badge badge-post">📝 Post</span>
        <h5 class="result-title">${this.highlightQuery(post.title || 'Untitled Post', document.getElementById('searchInput').value)}</h5>
        <p class="result-description">${this.highlightQuery(content, document.getElementById('searchInput').value)}...</p>
        <div class="result-meta">
          <span><i class="bi bi-calendar"></i> ${createdAt}</span>
          ${post.author_name ? `<span><i class="bi bi-person"></i> ${post.author_name}</span>` : ''}
        </div>
      </div>
    `;
  }

  highlightQuery(text, query) {
    if (!text || !query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark style="background: rgba(255,0,136,0.3); color: #0ff;">$1</mark>');
  }

  getListingDetailUrl(type) {
    const urlMap = {
      'car': 'car-detail.html',
      'apartment': 'apartment-detail.html',
      'land': 'land-detail.html',
      'driving_school': 'driving-school.html'
    };
    return urlMap[type] || 'index.html';
  }

  showLoading() {
    const container = document.getElementById('resultsContainer');
    if (container) {
      container.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-3">Searching...</p>
        </div>
      `;
    }
  }

  showEmptyState() {
    const container = document.getElementById('resultsContainer');
    const statsDiv = document.getElementById('resultsStats');
    
    if (statsDiv) statsDiv.style.display = 'none';
    
    if (container) {
      container.innerHTML = `
        <div class="no-results">
          <i class="bi bi-search"></i>
          <h4>Start searching...</h4>
          <p>Enter a keyword above to search for listings, users, or posts</p>
        </div>
      `;
    }
  }

  showError(message) {
    const container = document.getElementById('resultsContainer');
    if (container) {
      container.innerHTML = `
        <div class="no-results">
          <i class="bi bi-exclamation-triangle"></i>
          <h4>Error</h4>
          <p>${message}</p>
        </div>
      `;
    }
  }
}

// Initialize search when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.homeAfricaSearch = new HomeAfricaSearch();
});

