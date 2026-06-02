/**
 * Internationalization (i18n) Module for HOME AFRICA
 * 
 * Supports multiple languages: English, French, Kinyarwanda
 * Persists language preference in localStorage
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'home_africa_language';
  var DEFAULT_LANG = 'en';

  // Translation dictionary
  var translations = {
    en: {
      'nav.home': 'Home',
      'nav.explore': 'Explore',
      'nav.apartments': 'Apartments',
      'nav.cars': 'Cars',
      'nav.land': 'Land',
      'nav.post': 'Post Property',
      'nav.favorites': 'Favorites',
      'nav.compare': 'Compare',
      'nav.about': 'About Us',
      'nav.login': 'Log In',
      'hero.title': 'Find Your Dream Home in Rwanda & Africa',
      'hero.subtitle': 'Trusted Listings • Verified Agents • Instant Contact',
      'search.location': 'Location (e.g. Kigali)',
      'search.type': 'Property Type',
      'search.price': 'Max Price (RWF)',
      'search.button': 'Search Now',
      'listing.forSale': 'For Sale',
      'listing.forRent': 'For Rent',
      'listing.contact': 'Contact Seller',
      'listing.favorite': 'Add to favorites',
      'listing.compare': 'Add to compare',
      'compare.title': 'Compare Listings',
      'compare.empty': 'No Listings to Compare',
      'compare.browse': 'Browse Listings',
      'favorites.title': 'My Favorites',
      'favorites.empty': 'No favorites yet',
      'review.add': 'Add Review',
      'inquiry.title': 'Send Inquiry',
      'inquiry.name': 'Your Name',
      'inquiry.email': 'Your Email',
      'inquiry.phone': 'Your Phone',
      'inquiry.message': 'Your Message',
      'inquiry.send': 'Send Inquiry',
      'booking.title': 'Schedule Viewing',
      'verified.seller': 'Verified Seller',
      'featured.listing': 'Featured'
    },
    fr: {
      'nav.home': 'Accueil',
      'nav.explore': 'Explorer',
      'nav.apartments': 'Appartements',
      'nav.cars': 'Voitures',
      'nav.land': 'Terrain',
      'nav.post': 'Publier',
      'nav.favorites': 'Favoris',
      'nav.compare': 'Comparer',
      'nav.about': 'À propos',
      'nav.login': 'Connexion',
      'hero.title': 'Trouvez votre maison de rêve au Rwanda et en Afrique',
      'hero.subtitle': 'Annonces de confiance • Agents vérifiés • Contact instantané',
      'search.location': 'Lieu (ex: Kigali)',
      'search.type': 'Type de propriété',
      'search.price': 'Prix max (RWF)',
      'search.button': 'Rechercher',
      'listing.forSale': 'À Vendre',
      'listing.forRent': 'À Louer',
      'listing.contact': 'Contacter le vendeur',
      'listing.favorite': 'Ajouter aux favoris',
      'listing.compare': 'Ajouter à comparer',
      'compare.title': 'Comparer les annonces',
      'compare.empty': 'Aucune annonce à comparer',
      'compare.browse': 'Parcourir les annonces',
      'favorites.title': 'Mes Favoris',
      'favorites.empty': 'Aucun favori pour le moment',
      'review.add': 'Ajouter un avis',
      'inquiry.title': 'Envoyer une demande',
      'inquiry.name': 'Votre nom',
      'inquiry.email': 'Votre email',
      'inquiry.phone': 'Votre téléphone',
      'inquiry.message': 'Votre message',
      'inquiry.send': 'Envoyer',
      'booking.title': 'Planifier une visite',
      'verified.seller': 'Vendeur vérifié',
      'featured.listing': 'En vedette'
    },
    rw: {
      'nav.home': 'Ahabanza',
      'nav.explore': 'Shakisha',
      'nav.apartments': 'Inzu',
      'nav.cars': 'Motokari',
      'nav.land': 'Ubutaka',
      'nav.post': 'Shyiraho',
      'nav.favorites': 'Byanjye',
      'nav.compare': 'Bijyanne',
      'nav.about': 'Ibyerekeye',
      'nav.login': 'Kwinjira',
      'hero.title': 'Shakisha inzu yawe mu Rwanda na Afurika',
      'hero.subtitle': 'Ibyo bwongeye gukurikiranwa • Abaguzi barakwirakwijwe • Umuhango wa vuba',
      'search.location': 'Aho (urugero: Kigali)',
      'search.type': 'Ubwoko bw\'inzu',
      'search.price': 'Igiciro cyo hejuru (RWF)',
      'search.button': 'Shakisha',
      'listing.forSale': 'Iguhe',
      'listing.forRent': 'Ishyura',
      'listing.contact': 'Twara umuguzi',
      'listing.favorite': 'Shyiramo ibyanjye',
      'listing.compare': 'Shyiramo ibijyanne',
      'compare.title': 'Bijyanne ibyobozi',
      'compare.empty': 'Nta bwo bubariho bijyanne',
      'compare.browse': 'Shakisha ibyobozi',
      'favorites.title': 'Ibyanjye',
      'favorites.empty': 'Nta byanjye buriho',
      'review.add': 'Shyiramo ibitekerezo',
      'inquiry.title': 'Ohereza ubutumwa',
      'inquiry.name': 'Izina ryawe',
      'inquiry.email': 'Imeli yawe',
      'inquiry.phone': 'Telefone yawe',
      'inquiry.message': 'Ubutumwa bwawe',
      'inquiry.send': 'Ohereza',
      'booking.title': 'Gutekerezako ukuzura',
      'verified.seller': 'Umuguzi wakwirakwijwe',
      'featured.listing': 'Bihariye'
    }
  };

  /**
   * Get current language
   */
  function getCurrentLanguage() {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
    } catch (e) {
      return DEFAULT_LANG;
    }
  }

  /**
   * Set language
   */
  function setLanguage(lang) {
    try {
      if (translations[lang]) {
        localStorage.setItem(STORAGE_KEY, lang);
        applyLanguage(lang);
      }
    } catch (e) {
      console.error('Error saving language preference:', e);
    }
  }

  /**
   * Get translation for key
   */
  function translate(key, lang) {
    lang = lang || getCurrentLanguage();
    return translations[lang][key] || translations[DEFAULT_LANG][key] || key;
  }

  /**
   * Apply language to page
   */
  function applyLanguage(lang) {
    // Update all elements with data-i18n attribute
    var elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      el.textContent = translate(key, lang);
    });

    // Update language selector
    var selector = document.getElementById('languageSelector');
    if (selector) {
      selector.value = lang;
    }
  }

  /**
   * Initialize language selector
   */
  function initLanguageSelector() {
    // Create language selector if it doesn't exist
    if (!document.getElementById('languageSelector')) {
      var selector = document.createElement('select');
      selector.id = 'languageSelector';
      selector.className = 'form-select form-select-sm ms-2';
      selector.style.cssText = 'width: auto; min-width: 120px;';
      selector.setAttribute('aria-label', 'Select language');
      
      var languages = [
        { code: 'en', name: 'English' },
        { code: 'fr', name: 'Français' },
        { code: 'rw', name: 'Kinyarwanda' }
      ];
      
      languages.forEach(function (lang) {
        var option = document.createElement('option');
        option.value = lang.code;
        option.textContent = lang.name;
        selector.appendChild(option);
      });
      
      // Add to navbar
      var navbarNav = document.querySelector('.navbar-nav');
      if (navbarNav) {
        var li = document.createElement('li');
        li.className = 'nav-item';
        li.appendChild(selector);
        navbarNav.appendChild(li);
      }
      
      // Add change handler
      selector.addEventListener('change', function () {
        setLanguage(selector.value);
      });
    }
    
    // Apply saved language
    applyLanguage(getCurrentLanguage());
  }

  // Export to global scope
  window.HomeAfricaI18n = {
    getCurrentLanguage: getCurrentLanguage,
    setLanguage: setLanguage,
    translate: translate,
    applyLanguage: applyLanguage,
    initLanguageSelector: initLanguageSelector
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguageSelector);
  } else {
    initLanguageSelector();
  }

})();
