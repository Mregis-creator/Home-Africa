/**
 * Analytics Module for HOME AFRICA
 * 
 * Tracks user interactions and events for analytics
 * Stores events in localStorage for anonymous users
 * Can be upgraded to Supabase for logged-in users
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'home_africa_analytics';
  var MAX_EVENTS = 1000; // Keep only last 1000 events

  /**
   * Get all analytics events
   */
  function getEvents() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error reading analytics:', e);
      return [];
    }
  }

  /**
   * Save analytics events
   */
  function saveEvents(events) {
    try {
      // Keep only last MAX_EVENTS
      if (events.length > MAX_EVENTS) {
        events = events.slice(-MAX_EVENTS);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      console.error('Error saving analytics:', e);
    }
  }

  /**
   * Track an event
   */
  function trackEvent(eventName, eventData) {
    var events = getEvents();
    events.push({
      event: eventName,
      data: eventData || {},
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    });
    saveEvents(events);
    console.log('📊 Analytics:', eventName, eventData);
  }

  /**
   * Track page view
   */
  function trackPageView() {
    trackEvent('page_view', {
      page: window.location.pathname,
      title: document.title
    });
  }

  /**
   * Track listing view
   */
  function trackListingView(listingId, listingType) {
    trackEvent('listing_view', {
      listing_id: listingId,
      listing_type: listingType
    });
  }

  /**
   * Track search
   */
  function trackSearch(searchParams) {
    trackEvent('search', searchParams);
  }

  /**
   * Track favorite added
   */
  function trackFavoriteAdded(listingId, listingType) {
    trackEvent('favorite_added', {
      listing_id: listingId,
      listing_type: listingType
    });
  }

  /**
   * Track favorite removed
   */
  function trackFavoriteRemoved(listingId, listingType) {
    trackEvent('favorite_removed', {
      listing_id: listingId,
      listing_type: listingType
    });
  }

  /**
   * Track inquiry submitted
   */
  function trackInquirySubmitted(listingId, listingType) {
    trackEvent('inquiry_submitted', {
      listing_id: listingId,
      listing_type: listingType
    });
  }

  /**
   * Track booking submitted
   */
  function trackBookingSubmitted(listingId, listingType) {
    trackEvent('booking_submitted', {
      listing_id: listingId,
      listing_type: listingType
    });
  }

  /**
   * Track review submitted
   */
  function trackReviewSubmitted(listingId, listingType, rating) {
    trackEvent('review_submitted', {
      listing_id: listingId,
      listing_type: listingType,
      rating: rating
    });
  }

  /**
   * Get analytics summary
   */
  function getAnalyticsSummary() {
    var events = getEvents();
    var summary = {
      total_events: events.length,
      page_views: 0,
      listing_views: 0,
      searches: 0,
      favorites_added: 0,
      inquiries_submitted: 0,
      bookings_submitted: 0,
      reviews_submitted: 0
    };

    events.forEach(function (event) {
      switch (event.event) {
        case 'page_view':
          summary.page_views++;
          break;
        case 'listing_view':
          summary.listing_views++;
          break;
        case 'search':
          summary.searches++;
          break;
        case 'favorite_added':
          summary.favorites_added++;
          break;
        case 'inquiry_submitted':
          summary.inquiries_submitted++;
          break;
        case 'booking_submitted':
          summary.bookings_submitted++;
          break;
        case 'review_submitted':
          summary.reviews_submitted++;
          break;
      }
    });

    return summary;
  }

  /**
   * Clear analytics data
   */
  function clearAnalytics() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // Export to global scope
  window.HomeAfricaAnalytics = {
    trackEvent: trackEvent,
    trackPageView: trackPageView,
    trackListingView: trackListingView,
    trackSearch: trackSearch,
    trackFavoriteAdded: trackFavoriteAdded,
    trackFavoriteRemoved: trackFavoriteRemoved,
    trackInquirySubmitted: trackInquirySubmitted,
    trackBookingSubmitted: trackBookingSubmitted,
    trackReviewSubmitted: trackReviewSubmitted,
    getAnalyticsSummary: getAnalyticsSummary,
    clearAnalytics: clearAnalytics
  };

  // Auto-track page view on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackPageView);
  } else {
    trackPageView();
  }

})();
