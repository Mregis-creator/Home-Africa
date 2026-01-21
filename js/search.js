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
      // Search in users table
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
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
    if (results.listings.length > 0 && (this.currentFilter === 'all' || this.currentFilter === 'listings')) {
      results.listings.forEach(listing => {
        html += this.renderListingCard(listing);
      });
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
    const typeLabels = {
      'car': '🚗 Car',
      'apartment': '🏠 Apartment',
      'land': '🏞️ Land',
      'driving_school': '🚦 Driving School'
    };

    const typeLabel = typeLabels[listing.type] || listing.type;
    const price = listing.price ? `RWF ${parseInt(listing.price).toLocaleString()}` : 'Price on request';
    const images = listing.images && listing.images.length > 0 ? listing.images[0] : 'images/hero-bg.jpeg';
    const location = listing.location?.city || listing.location || 'Location not specified';

    return `
      <div class="result-card" onclick="window.location.href='${this.getListingDetailUrl(listing.type)}?id=${listing.id}'">
        <span class="result-type-badge badge-listing">${typeLabel}</span>
        <div class="d-flex gap-3">
          <img src="${images}" alt="${listing.title}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px; border: 2px solid #ff0088;">
          <div class="flex-grow-1">
            <h5 class="result-title">${this.highlightQuery(listing.title, document.getElementById('searchInput').value)}</h5>
            <p class="result-description">${this.highlightQuery((listing.description || '').substring(0, 150), document.getElementById('searchInput').value)}...</p>
            <div class="result-meta">
              <span><i class="bi bi-geo-alt"></i> ${location}</span>
              <span><i class="bi bi-currency-exchange"></i> ${price}</span>
              <span><i class="bi bi-eye"></i> ${listing.views || 0} views</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderUserCard(user) {
    const role = user.role === 'merchant' ? 'Merchant' : 'User';
    const name = user.full_name || user.email || 'Unknown User';

    return `
      <div class="result-card" onclick="window.location.href='profile-personal.html?userId=${user.id}'">
        <span class="result-type-badge badge-user">👤 ${role}</span>
        <h5 class="result-title">${this.highlightQuery(name, document.getElementById('searchInput').value)}</h5>
        <p class="result-description">${user.email || ''}</p>
        <div class="result-meta">
          <span><i class="bi bi-envelope"></i> ${user.email || 'No email'}</span>
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

