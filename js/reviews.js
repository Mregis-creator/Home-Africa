/**
 * Reviews Manager for HOME AFRICA
 * 
 * Allows users to submit and view reviews for listings
 * Reviews are stored in localStorage for anonymous users
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'home_africa_reviews';

  /**
   * Get all reviews from localStorage
   */
  function getReviews() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error reading reviews:', e);
      return [];
    }
  }

  /**
   * Save reviews to localStorage
   */
  function saveReviews(reviews) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    } catch (e) {
      console.error('Error saving reviews:', e);
    }
  }

  /**
   * Add a new review
   */
  function addReview(reviewData) {
    var reviews = getReviews();
    var reviewId = 'review_' + Date.now();
    
    reviews.push({
      id: reviewId,
      listingId: reviewData.listingId,
      listingType: reviewData.listingType || 'car',
      name: reviewData.name,
      rating: parseInt(reviewData.rating, 10),
      review: reviewData.review,
      createdAt: new Date().toISOString()
    });
    
    saveReviews(reviews);
    // Track analytics
    if (window.HomeAfricaAnalytics) {
      window.HomeAfricaAnalytics.trackReviewSubmitted(reviewData.listingId, reviewData.listingType, reviewData.rating);
    }
    return { success: true, count: reviews.length };
  }

  /**
   * Get reviews for a specific listing
   */
  function getReviewsForListing(listingId) {
    var reviews = getReviews();
    return reviews.filter(function (r) {
      return r.listingId === listingId;
    });
  }

  /**
   * Get average rating for a listing
   */
  function getAverageRating(listingId) {
    var reviews = getReviewsForListing(listingId);
    if (reviews.length === 0) return 0;
    
    var sum = reviews.reduce(function (acc, r) {
      return acc + r.rating;
    }, 0);
    
    return (sum / reviews.length).toFixed(1);
  }

  /**
   * Display reviews on a detail page
   */
  function displayReviews(listingId, containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var reviews = getReviewsForListing(listingId);
    
    if (reviews.length === 0) {
      container.innerHTML = '<p class="text-white-50">No reviews yet. Be the first to review!</p>';
      return;
    }

    var html = reviews.map(function (r) {
      var stars = '';
      for (var i = 0; i < 5; i++) {
        stars += i < r.rating ? '<i class="bi bi-star-fill text-warning"></i>' : '<i class="bi bi-star text-muted"></i>';
      }
      
      var date = new Date(r.createdAt).toLocaleDateString();
      
      return `
        <div class="review-item mb-3 p-3" style="background:rgba(255,255,255,0.05);border-radius:8px;border:1px solid rgba(0,255,255,0.2);">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <strong class="text-white">${escapeHtml(r.name)}</strong>
              <div class="text-warning mb-1">${stars}</div>
            </div>
            <small class="text-white-50">${date}</small>
          </div>
          <p class="text-white-50 mb-0 mt-2">${escapeHtml(r.review)}</p>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Export to global scope
  window.HomeAfricaReviews = {
    addReview: addReview,
    getReviewsForListing: getReviewsForListing,
    getAverageRating: getAverageRating,
    displayReviews: displayReviews
  };

})();
