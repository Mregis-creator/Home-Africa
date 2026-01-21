// Search Alerts System
// Allows users to save search criteria and get notified when new listings match

class SearchAlerts {
  constructor() {
    this.alerts = JSON.parse(localStorage.getItem('searchAlerts') || '[]');
    this.checkInterval = null;
  }

  // Save a search alert
  saveAlert(criteria) {
    const alert = {
      id: Date.now().toString(),
      ...criteria,
      createdAt: new Date().toISOString(),
      active: true,
      matches: []
    };
    
    this.alerts.push(alert);
    localStorage.setItem('searchAlerts', JSON.stringify(this.alerts));
    return alert;
  }

  // Get all alerts
  getAlerts() {
    return this.alerts.filter(alert => alert.active);
  }

  // Delete an alert
  deleteAlert(alertId) {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId);
    localStorage.setItem('searchAlerts', JSON.stringify(this.alerts));
  }

  // Check for new matches
  async checkForMatches() {
    const activeAlerts = this.getAlerts();
    
    for (const alert of activeAlerts) {
      const matches = await this.findMatches(alert);
      
      if (matches.length > 0) {
        // Check if these are new matches
        const newMatches = matches.filter(match => {
          return !alert.matches.includes(match.id);
        });
        
        if (newMatches.length > 0) {
          // Update alert with new matches
          alert.matches.push(...newMatches.map(m => m.id));
          this.updateAlert(alert);
          
          // Send notifications
          this.notifyMatches(alert, newMatches);
        }
      }
    }
  }

  // Find listings that match alert criteria (using Supabase)
  async findMatches(alert) {
    const supabase = window.supabaseClient;
    if (!supabase) {
      console.error('Supabase client not available');
      return [];
    }
    
    try {
      // Build Supabase query
      let query = supabase
        .from('listings')
        .select('*')
        .eq('type', alert.type);
      
      // Apply filters
      if (alert.maxPrice) {
        query = query.lte('price', parseInt(alert.maxPrice));
      }
      if (alert.minPrice) {
        query = query.gte('price', parseInt(alert.minPrice));
      }
      if (alert.location) {
        query = query.ilike('location', `%${alert.location}%`);
      }
      if (alert.type === 'car' && alert.transmission) {
        query = query.eq('metadata->>transmission', alert.transmission);
      }
      if (alert.type === 'apartment' && alert.rooms) {
        query = query.eq('metadata->>rooms', parseInt(alert.rooms));
      }
      
      const { data: listings, error } = await query;
      
      if (error) {
        console.error('Error finding matches:', error);
        return [];
      }
      
      // Additional client-side filtering
      let matches = listings || [];
      
      if (alert.keywords) {
        const keywords = alert.keywords.toLowerCase().split(' ');
        matches = matches.filter(listing => {
          const title = (listing.title || '').toLowerCase();
          return keywords.some(kw => title.includes(kw));
        });
      }
      
      return matches.map(listing => ({
        id: listing.id,
        ...listing
      }));
    } catch (error) {
      console.error('Error finding matches:', error);
      return [];
    }
  }

  // Update alert
  updateAlert(updatedAlert) {
    const index = this.alerts.findIndex(a => a.id === updatedAlert.id);
    if (index !== -1) {
      this.alerts[index] = updatedAlert;
      localStorage.setItem('searchAlerts', JSON.stringify(this.alerts));
    }
  }

  // Notify user about matches
  notifyMatches(alert, matches) {
    matches.forEach(match => {
      // Store notification
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      notifications.unshift({
        type: 'search_alert',
        title: 'New Listing Matches Your Search',
        message: `${match.title} matches your saved search criteria`,
        listingId: match.id,
        listingType: alert.type,
        timestamp: new Date().toISOString(),
        read: false
      });
      localStorage.setItem('notifications', JSON.stringify(notifications.slice(0, 50)));
      
      // Send email/SMS if notification service available
      if (typeof notificationService !== 'undefined') {
        const userEmail = localStorage.getItem('userEmail') || '';
        const userPhone = localStorage.getItem('userPhone') || '';
        
        notificationService.notifySearchAlert(userEmail, userPhone, {
          title: match.title,
          price: match.price,
          location: match.location,
          url: `${alert.type}-detail.html?id=${match.id}`
        });
      }
      
      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Listing Match', {
          body: `${match.title} matches your search`,
          icon: match.images && match.images[0] ? match.images[0] : 'images/hero-bg.jpeg'
        });
      }
    });
  }

  // Start checking for matches periodically
  startChecking(intervalMinutes = 60) {
    // Check immediately
    this.checkForMatches();
    
    // Then check periodically
    this.checkInterval = setInterval(() => {
      this.checkForMatches();
    }, intervalMinutes * 60 * 1000);
  }

  // Stop checking
  stopChecking() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// Create global instance
const searchAlerts = new SearchAlerts();

