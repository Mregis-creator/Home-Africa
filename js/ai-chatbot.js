/**
 * AI Chatbot Integration for HOME AFRICA
 * 
 * This module handles:
 * - Chatbot UI rendering
 * - Message sending/receiving
 * - AI intent detection and response
 * - Integration with Supabase for knowledge base and listings
 */

class HomeAfricaChatbot {
  constructor() {
    this.conversationId = null;
    this.sessionId = this.generateSessionId();
    this.isOpen = false;
    this.isMinimized = false;
    this.isTyping = false;
    this.supabase = window.supabaseClient;

    // Initialize chatbot
    this.init();
  }

  /**
   * Generate unique session ID for anonymous users
   */
  generateSessionId() {
    return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Initialize chatbot UI
   */
  init() {
    // Create chatbot HTML if it doesn't exist
    if (!document.getElementById('chatbot-container')) {
      this.createChatbotUI();
    }

    // Position genius sticker above footer dynamically
    setTimeout(() => {
      this.positionGeniusSticker();
    }, 100);

    // Load conversation history if user is logged in
    this.loadConversationHistory();

    // Set up event listeners
    this.setupEventListeners();

    // Send welcome message
    setTimeout(() => {
      this.sendWelcomeMessage();
    }, 1000);

    // Update sticker position on resize
    window.addEventListener('resize', () => {
      this.positionGeniusSticker();
    });
  }

  /**
   * Position genius sticker above footer dynamically
   */
  positionGeniusSticker() {
    const geniusSticker = document.getElementById('chatbot-genius-sticker');
    const footer = document.querySelector('footer.bg-dark');
    
    if (geniusSticker && footer) {
      const footerHeight = footer.offsetHeight;
      const isMobile = window.innerWidth <= 768;
      
      if (isMobile) {
        // On mobile, position relative to viewport
        geniusSticker.style.bottom = '100px';
      } else {
        // On desktop, position above fixed footer
        geniusSticker.style.bottom = (footerHeight + 20) + 'px';
      }
      
      // Ensure it's visible and clickable
      geniusSticker.style.display = 'flex';
      geniusSticker.style.visibility = 'visible';
      geniusSticker.style.opacity = '1';
      geniusSticker.style.pointerEvents = 'auto';
      geniusSticker.style.zIndex = '1001';
    }
  }

  /**
   * Create chatbot UI elements
   */
  createChatbotUI() {
    const chatbotHTML = `
      <div id="chatbot-container" class="chatbot-container">
        <div id="chatbot-header" class="chatbot-header">
          <div class="chatbot-header-content">
            <i class="bi bi-robot"></i>
            <span>Rejo AI</span>
          </div>
          <button id="chatbot-minimize" class="chatbot-btn-minimize" title="Minimize AI">
            <i class="bi bi-dash"></i>
          </button>
          <button id="chatbot-restore" class="chatbot-btn-restore" style="display: none;" title="Restore AI">
            <i class="bi bi-chevron-up"></i>
          </button>
        </div>
        <div id="chatbot-messages" class="chatbot-messages"></div>
        <div id="chatbot-typing" class="chatbot-typing" style="display: none;">
          <div class="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
        <div id="chatbot-input-container" class="chatbot-input-container">
          <input 
            type="text" 
            id="chatbot-input" 
            class="chatbot-input" 
            placeholder="Ask me anything about listings, bookings, or our services..."
            autocomplete="off"
          />
          <button id="chatbot-send" class="chatbot-btn-send">
            <i class="bi bi-send-fill"></i>
          </button>
        </div>
      </div>
      <button id="chatbot-toggle" class="chatbot-toggle">
        <i class="bi bi-chat-dots-fill"></i>
        <span class="chatbot-badge" id="chatbot-badge" style="display: none;">1</span>
      </button>
      <!-- Genius Sticker near Footer -->
      <button id="chatbot-genius-sticker" class="chatbot-genius-sticker" title="Chat with Rejo AI">
        <i class="bi bi-headphones"></i>
        <span class="genius-text">Rejo AI</span>
      </button>
    `;

    document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    this.injectChatbotStyles();
  }

  /**
   * Inject chatbot CSS styles
   */
  injectChatbotStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .chatbot-container {
        position: fixed;
        bottom: 80px;
        right: 20px;
        width: 380px;
        height: 600px;
        background: linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(0,255,136,0.15) 100%);
        border: 2px solid #0ff;
        border-radius: 20px;
        box-shadow: 0 0 40px rgba(0,255,255,0.3);
        display: flex;
        flex-direction: column;
        z-index: 10000;
        transform: translateY(100%);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
      }
      .chatbot-container.open {
        transform: translateY(0);
        opacity: 1;
      }
      .chatbot-container.minimized {
        height: auto;
        min-height: 60px;
      }
      .chatbot-container.minimized #chatbot-messages,
      .chatbot-container.minimized #chatbot-typing,
      .chatbot-container.minimized #chatbot-input-container {
        display: none;
      }
      .chatbot-header {
        background: linear-gradient(90deg, #0ff 0%, #8fff00 100%);
        color: #222;
        padding: 1rem;
        border-radius: 18px 18px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: bold;
      }
      .chatbot-header-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .chatbot-messages {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .chatbot-message {
        max-width: 80%;
        padding: 0.75rem 1rem;
        border-radius: 12px;
        word-wrap: break-word;
      }
      .chatbot-message.user {
        align-self: flex-end;
        background: linear-gradient(90deg, #0ff 0%, #8fff00 100%);
        color: #222;
      }
      .chatbot-message.assistant {
        align-self: flex-start;
        background: rgba(255,255,255,0.1);
        color: #fff;
        border: 1px solid rgba(0,255,255,0.3);
      }
      .chatbot-typing {
        padding: 0.5rem 1rem;
      }
      .typing-indicator {
        display: flex;
        gap: 0.3rem;
      }
      .typing-indicator span {
        width: 8px;
        height: 8px;
        background: #0ff;
        border-radius: 50%;
        animation: typing 1.4s infinite;
      }
      .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
      .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes typing {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.7; }
        30% { transform: translateY(-10px); opacity: 1; }
      }
      .chatbot-input-container {
        display: flex;
        padding: 1rem;
        gap: 0.5rem;
        border-top: 1px solid rgba(0,255,255,0.3);
      }
      .chatbot-input {
        flex: 1;
        padding: 0.75rem;
        background: rgba(0,0,0,0.6);
        border: 2px solid rgba(0,255,136,0.3);
        border-radius: 12px;
        color: #fff;
        outline: none;
      }
      .chatbot-input:focus {
        border-color: #0ff;
      }
      .chatbot-btn-send {
        padding: 0.75rem 1.5rem;
        background: linear-gradient(90deg, #0ff 0%, #8fff00 100%);
        border: none;
        border-radius: 12px;
        color: #222;
        cursor: pointer;
        font-weight: bold;
      }
      .chatbot-toggle {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background: linear-gradient(90deg, #0ff 0%, #8fff00 100%);
        border: none;
        border-radius: 50%;
        color: #222;
        font-size: 1.5rem;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0,255,255,0.4);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        transition: all 0.3s;
      }
      .chatbot-toggle:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 30px rgba(0,255,255,0.6);
      }
      .chatbot-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #ff4444;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 0.7rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      /* Genius Sticker near Footer */
      .chatbot-genius-sticker {
        position: fixed;
        bottom: 120px;
        right: 30px;
        background: linear-gradient(135deg, #0ff 0%, #8fff00 100%);
        border: 3px solid #0ff;
        border-radius: 50px;
        padding: 0.75rem 1.5rem;
        color: #222;
        font-weight: bold;
        font-size: 1rem;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0,255,255,0.4), 0 0 0 4px rgba(0,255,255,0.1);
        z-index: 1001 !important;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.3s;
        animation: geniusPulse 2s infinite;
        pointer-events: auto !important;
      }
      .chatbot-genius-sticker:hover {
        transform: scale(1.05) translateY(-5px);
        box-shadow: 0 6px 30px rgba(0,255,255,0.6), 0 0 0 6px rgba(0,255,255,0.2);
        animation: none;
      }
      .chatbot-genius-sticker i {
        font-size: 1.3rem;
        animation: headphoneBounce 1.5s infinite;
      }
      .genius-text {
        font-size: 0.9rem;
        letter-spacing: 0.5px;
      }
      @keyframes geniusPulse {
        0%, 100% { 
          box-shadow: 0 4px 20px rgba(0,255,255,0.4), 0 0 0 4px rgba(0,255,255,0.1);
        }
        50% { 
          box-shadow: 0 4px 25px rgba(0,255,255,0.6), 0 0 0 6px rgba(0,255,255,0.2);
        }
      }
      @keyframes headphoneBounce {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(-10deg); }
        75% { transform: rotate(10deg); }
      }
      @media (max-width: 768px) {
        .chatbot-genius-sticker {
          bottom: 100px;
          right: 15px;
          padding: 0.6rem 1.2rem;
          font-size: 0.85rem;
          z-index: 1001 !important;
        }
        .genius-text {
          display: none;
        }
        .chatbot-genius-sticker i {
          font-size: 1.5rem;
        }
      }
      .chatbot-btn-minimize {
        background: transparent;
        border: none;
        color: #222;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        transition: background 0.2s;
      }
      .chatbot-btn-minimize:hover {
        background: rgba(0,0,0,0.1);
      }
      .chatbot-btn-restore {
        background: transparent;
        border: none;
        color: #222;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        transition: background 0.2s;
      }
      .chatbot-btn-restore:hover {
        background: rgba(0,0,0,0.1);
      }
      .listing-card-mini {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(0,255,255,0.3);
        border-radius: 8px;
        padding: 0.75rem;
        margin-top: 0.5rem;
        cursor: pointer;
      }
      .listing-card-mini:hover {
        border-color: #0ff;
      }
      .listing-card-mini h6 {
        margin: 0 0 0.25rem 0;
        color: #8fff00;
      }
      .listing-card-mini p {
        margin: 0;
        font-size: 0.85rem;
        color: rgba(255,255,255,0.8);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Toggle chatbot from floating button
    const toggleBtn = document.getElementById('chatbot-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.toggleChatbot();
      });
    }

    // Toggle chatbot from genius sticker
    const geniusSticker = document.getElementById('chatbot-genius-sticker');
    if (geniusSticker) {
      // Remove any existing listeners by cloning
      const newGeniusSticker = geniusSticker.cloneNode(true);
      geniusSticker.parentNode.replaceChild(newGeniusSticker, geniusSticker);
      
      // Add click listener
      newGeniusSticker.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Genius sticker clicked!');
        this.toggleChatbot();
      });
      
      // Ensure it's clickable
      newGeniusSticker.style.pointerEvents = 'auto';
      newGeniusSticker.style.cursor = 'pointer';
    }

    // Toggle chatbot from navbar link (if exists)
    const navbarLinks = document.querySelectorAll('.nav-link-chatbot, [data-chatbot-trigger]');
    navbarLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleChatbot();
      });
    });

    // Minimize chatbot
    const minimizeBtn = document.getElementById('chatbot-minimize');
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', () => {
        this.minimizeChatbot();
      });
    }

    // Restore chatbot
    const restoreBtn = document.getElementById('chatbot-restore');
    if (restoreBtn) {
      restoreBtn.addEventListener('click', () => {
        this.restoreChatbot();
      });
    }

    // Send message on button click
    const sendBtn = document.getElementById('chatbot-send');
    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        this.sendMessage();
      });
    }

    // Send message on Enter key
    const inputField = document.getElementById('chatbot-input');
    if (inputField) {
      inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }
  }

  /**
   * Toggle chatbot open/close
   */
  toggleChatbot() {
    this.isOpen = !this.isOpen;
    const container = document.getElementById('chatbot-container');
    if (this.isOpen) {
      container.classList.add('open');
      container.classList.remove('minimized');
      document.getElementById('chatbot-input').focus();
    } else {
      container.classList.remove('open');
    }
  }

  /**
   * Minimize chatbot (collapse to header bar)
   */
  minimizeChatbot() {
    this.isMinimized = true;
    const container = document.getElementById('chatbot-container');
    const minimizeBtn = document.getElementById('chatbot-minimize');
    const restoreBtn = document.getElementById('chatbot-restore');

    container.classList.add('minimized');
    minimizeBtn.style.display = 'none';
    restoreBtn.style.display = 'block';
  }

  /**
   * Restore chatbot from minimized state
   */
  restoreChatbot() {
    this.isMinimized = false;
    const container = document.getElementById('chatbot-container');
    const minimizeBtn = document.getElementById('chatbot-minimize');
    const restoreBtn = document.getElementById('chatbot-restore');

    container.classList.remove('minimized');
    minimizeBtn.style.display = 'block';
    restoreBtn.style.display = 'none';
    document.getElementById('chatbot-input').focus();
  }

  /**
   * Send welcome message
   */
  async sendWelcomeMessage() {
      const welcomeMessages = [
      "👋 Hello! I'm Rejo AI, your HOME AFRICA assistant. How can I help you today?",
      "I can help you find apartments, houses, cars, land plots, or answer questions about our services.",
      "Try asking: 'Are houses available?' or 'Show me apartments in Kigali' or 'How do I book a viewing?'"
    ];

    for (const msg of welcomeMessages) {
      await this.addMessage('assistant', msg);
      await this.delay(800);
    }
  }

  /**
   * Send user message
   */
  async sendMessage() {
    const input = document.getElementById('chatbot-input');
    const message = input.value.trim();

    if (!message) return;

    // Add user message to UI
    this.addMessage('user', message);
    input.value = '';

    // Show typing indicator
    this.showTyping();

    // Process message with AI
    const response = await this.processMessage(message);

    // Hide typing indicator
    this.hideTyping();

    // Add AI response
    await this.addMessage('assistant', response.text, response.data);
  }

  /**
   * Process user message with AI
   */
  async processMessage(message) {
    if (!this.supabase) {
      return {
        text: "I'm sorry, the chatbot service is not available right now. Please try again later.",
        data: null
      };
    }

    try {
      // 1. Detect intent and extract entities
      const intent = this.detectIntent(message);
      const entities = this.extractEntities(message);

      // 2. Save user message to database
      await this.saveMessage('user', message, intent, entities);

      // 3. Get response based on intent
      let response = null;

      switch (intent) {
        case 'search_listing':
          response = await this.handleSearchListing(entities);
          break;
        case 'ask_question':
          response = await this.handleAskQuestion(message);
          break;
        case 'book_viewing':
          response = await this.handleBookViewing(entities);
          break;
        case 'greeting':
          const greetings = [
            "Hello! 👋 I'm Rejo AI. How can I help you find your perfect home or car today?",
            "Hi there! 👋 I'm Rejo AI, your HOME AFRICA assistant. What can I help you with?",
            "Hey! 👋 Welcome! I'm Rejo AI. Are you looking for apartments, houses, cars, or land plots?",
            "Greetings! 👋 I'm Rejo AI. How can I assist you today?"
          ];
          response = { text: greetings[Math.floor(Math.random() * greetings.length)] };
          break;
        default:
          response = await this.handleAskQuestion(message);
      }

      // 4. Save AI response to database
      await this.saveMessage('assistant', response.text, intent, entities);

      return response;
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        text: "I'm sorry, I encountered an error. Please try rephrasing your question.",
        data: null
      };
    }
  }

  /**
   * Detect user intent from message - Enhanced intelligence
   */
  detectIntent(message) {
    const lowerMessage = message.toLowerCase().trim();

    // Enhanced greeting patterns - check first
    if (/(^|\s)(hello|hi|hey|greetings|good\s+(morning|afternoon|evening|night)|hey\s+there|what's\s+up|how\s+are\s+you)/.test(lowerMessage)) {
      return 'greeting';
    }

    // Enhanced search patterns - comprehensive variations
    const searchPatterns = [
      /(show|find|search|looking\s+for|need|want|got|have|any|available|list|browse|see|display|get).*(apartment|car|vehicle|land|property|listing|house|houses|home|homes|properties|residence|flat|unit|plot|parcel)/,
      /(are|is|do\s+you\s+have|do\s+you\s+sell|do\s+you\s+rent|got\s+any|any\s+available).*(available|houses|apartments|cars|land|properties|listings|vehicles)/,
      /(i\s+)?(want|need|looking\s+for|searching\s+for|find|get).*(apartment|house|car|land|property|vehicle)/,
      /(show\s+me|find\s+me|help\s+me\s+find).*(apartment|house|car|land|property)/,
      /(what|which|where).*(apartment|house|car|land|property).*(do\s+you\s+have|available|for\s+(sale|rent))/
    ];
    
    for (const pattern of searchPatterns) {
      if (pattern.test(lowerMessage)) {
        return 'search_listing';
      }
    }

    // Enhanced booking patterns
    const bookingPatterns = [
      /(book|schedule|appointment|viewing|visit|see|inspect|tour|view|check\s+out)/,
      /(can\s+i|how\s+do\s+i|i\s+want\s+to).*(view|see|visit|book|schedule)/
    ];
    
    for (const pattern of bookingPatterns) {
      if (pattern.test(lowerMessage)) {
        return 'book_viewing';
      }
    }

    // Question patterns - more comprehensive
    if (/(how|what|when|where|why|can|do|does|is|are|tell\s+me|explain|describe)/.test(lowerMessage)) {
      return 'ask_question';
    }

    // Default to question handling
    return 'ask_question';
  }

  /**
   * Extract entities from message (location, type, price, etc.) - Enhanced intelligence
   */
  extractEntities(message) {
    const entities = {
      type: null,
      location: null,
      price_min: null,
      price_max: null,
      bedrooms: null,
      features: []
    };

    const lowerMessage = message.toLowerCase();

    // Enhanced property type extraction - comprehensive patterns
    const apartmentKeywords = ['apartment', 'apartments', 'flat', 'flats', 'unit', 'units', 'house', 'houses', 
                               'home', 'homes', 'residence', 'residential', 'rent', 'rental', 'renting',
                               'accommodation', 'housing', 'dwelling', 'place to live', 'place to rent'];
    const carKeywords = ['car', 'cars', 'vehicle', 'vehicles', 'automobile', 'automobiles', 'auto', 'autos',
                        'suv', 'sedan', 'hatchback', 'truck', 'van', 'motorcycle', 'bike'];
    const landKeywords = ['land', 'plot', 'plots', 'parcel', 'parcels', 'acre', 'acres', 'hectare', 'hectares',
                         'property', 'real estate', 'ground', 'lot', 'lots'];

    for (const keyword of apartmentKeywords) {
      if (lowerMessage.includes(keyword)) {
        entities.type = 'apartment';
        break;
      }
    }

    if (!entities.type) {
      for (const keyword of carKeywords) {
        if (lowerMessage.includes(keyword)) {
          entities.type = 'car';
          break;
        }
      }
    }

    if (!entities.type) {
      for (const keyword of landKeywords) {
        if (lowerMessage.includes(keyword)) {
          entities.type = 'land';
          break;
        }
      }
    }

    // Enhanced location extraction - comprehensive Rwanda locations
    const locations = [
      // Districts
      'kigali', 'nyarugenge', 'gasabo', 'kicukiro', 'musanze', 'rubavu', 'huye', 'nyamagabe', 'nyanza',
      'ruhango', 'muhanga', 'kamonyi', 'karongi', 'rutsiro', 'nyabihu', 'gisagara', 'nyaruguru',
      // Areas/Neighborhoods in Kigali
      'nyarutarama', 'kimisagara', 'remera', 'kimironko', 'gisozi', 'kacyiru', 'gikondo', 'kanombe',
      'nyamirambo', 'kisimenti', 'kibagabaga', 'kabeza', 'kagugu', 'kinyinya', 'kacyiru', 'kibagabaga',
      // Other cities/towns
      'butare', 'ruhengeri', 'gisenyi', 'kibungo', 'rwamagana'
    ];

    for (const loc of locations) {
      if (lowerMessage.includes(loc)) {
        entities.location = loc;
        break;
      }
    }

    // Enhanced price extraction - multiple formats
    const pricePatterns = [
      /(\d+)\s*(million|m|mil)\s*(rwf|rwandan\s+franc)?/i,
      /(\d+)\s*(thousand|k|thou)\s*(rwf|rwandan\s+franc)?/i,
      /rwf\s*(\d+)\s*(million|m|mil)?/i,
      /rwf\s*(\d+)\s*(thousand|k)?/i,
      /(\d+)\s*,\s*(\d{3})\s*(rwf)?/i, // e.g., 15,000,000
      /under\s*(\d+)/i,
      /below\s*(\d+)/i,
      /less\s+than\s*(\d+)/i,
      /maximum\s*(\d+)/i,
      /max\s*(\d+)/i,
      /budget\s*(of\s*)?(\d+)/i
    ];

    for (const pattern of pricePatterns) {
      const match = message.match(pattern);
      if (match) {
        let value = parseInt(match[1] || match[2] || match[3] || 0);
        const unit = (match[2] || match[3] || '').toLowerCase();
        
        if (unit.includes('m') || unit.includes('million') || unit.includes('mil')) {
          entities.price_max = value * 1000000;
        } else if (unit.includes('k') || unit.includes('thousand') || unit.includes('thou')) {
          entities.price_max = value * 1000;
        } else if (value > 10000) {
          // Assume RWF if large number
          entities.price_max = value;
        }
        break;
      }
    }

    // Extract bedroom count
    const bedroomMatch = lowerMessage.match(/(\d+)\s*(bedroom|br|bed|room)/);
    if (bedroomMatch) {
      entities.bedrooms = parseInt(bedroomMatch[1]);
    } else if (lowerMessage.includes('studio') || lowerMessage.includes('efficiency')) {
      entities.bedrooms = 0;
    }

    // Extract features
    if (lowerMessage.includes('furnished')) entities.features.push('furnished');
    if (lowerMessage.includes('parking')) entities.features.push('parking');
    if (lowerMessage.includes('security')) entities.features.push('security');
    if (lowerMessage.includes('automatic') || lowerMessage.includes('auto')) entities.features.push('automatic');
    if (lowerMessage.includes('manual')) entities.features.push('manual');
    if (lowerMessage.includes('diesel')) entities.features.push('diesel');
    if (lowerMessage.includes('petrol') || lowerMessage.includes('gasoline')) entities.features.push('petrol');

    return entities;
  }

  /**
   * Handle search listing intent
   */
  async handleSearchListing(entities) {
    if (!this.supabase) {
      return { text: "Search functionality is not available right now." };
    }

    try {
      let query = this.supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .limit(5);

      if (entities.type) {
        query = query.eq('type', entities.type);
      }

      if (entities.location) {
        query = query.contains('location', { city: entities.location });
      }

      if (entities.price_max) {
        query = query.lte('price', entities.price_max);
      }

      const { data: listings, error } = await query;

      if (error) throw error;

      if (!listings || listings.length === 0) {
        return {
          text: `I couldn't find any ${entities.type || 'listings'} matching your criteria. Try adjusting your search or visit our listings page for more options.`,
          data: null
        };
      }

      // Format listings as rich cards
      const listingCards = listings.map(listing => ({
        id: listing.id,
        title: listing.title,
        price: listing.price,
        type: listing.type,
        location: listing.location?.city || (typeof listing.location === 'string' ? listing.location : 'Location not specified'),
        images: listing.images || []
      }));

      return {
        text: `I found ${listings.length} ${entities.type || 'property'} listing${listings.length > 1 ? 's' : ''} for you! ${listings.length > 1 ? 'Scroll through them below:' : ''}`,
        data: { 
          listings: listingCards, 
          intent: 'search_listing',
          quickReplies: [
            { text: `Show me more ${entities.type || 'properties'}` },
            { text: `Show me ${entities.type === 'apartment' ? 'cars' : entities.type === 'car' ? 'apartments' : 'apartments'}` }
          ],
          suggestions: [
            { text: `What's the price range for ${entities.type || 'properties'}?` },
            { text: `Show me ${entities.type || 'properties'} in ${entities.location || 'Kigali'}` }
          ]
        }
      };
    } catch (error) {
      console.error('Error searching listings:', error);
      return {
        text: "I encountered an error while searching. Please try again or visit our listings page.",
        data: null
      };
    }
  }

  /**
   * Handle ask question intent - Enhanced intelligence with better knowledge base search
   */
  async handleAskQuestion(message) {
    if (!this.supabase) {
      return { text: "I'm here to help! You can ask me about our listings, booking process, or services." };
    }

    try {
      // Enhanced knowledge base search - try multiple approaches
      let results = null;
      let searchError = null;

      // Approach 1: Full-text search on search_vector
      try {
        const { data, error } = await this.supabase
          .from('ai_knowledge_base')
          .select('*')
          .eq('is_active', true)
          .textSearch('search_vector', message, {
            type: 'websearch',
            config: 'english'
          })
          .order('priority', { ascending: false })
          .limit(5);

        if (!error && data && data.length > 0) {
          results = data;
        } else {
          searchError = error;
        }
      } catch (e) {
        searchError = e;
      }

      // Approach 2: If full-text search fails, try keyword matching
      if (!results || results.length === 0) {
        try {
          const keywords = message.toLowerCase().split(/\s+/).filter(w => w.length > 2);
          const { data, error } = await this.supabase
            .from('ai_knowledge_base')
            .select('*')
            .eq('is_active', true)
            .contains('keywords', keywords)
            .order('priority', { ascending: false })
            .limit(5);

          if (!error && data && data.length > 0) {
            results = data;
          }
        } catch (e) {
          // Continue to fallback
        }
      }

      // Approach 3: Simple text matching on question field
      if (!results || results.length === 0) {
        try {
          const searchTerms = message.toLowerCase().split(/\s+/).filter(w => w.length > 3);
          const { data, error } = await this.supabase
            .from('ai_knowledge_base')
            .select('*')
            .eq('is_active', true)
            .or(searchTerms.map(term => `question.ilike.%${term}%`).join(','))
            .order('priority', { ascending: false })
            .limit(5);

          if (!error && data && data.length > 0) {
            results = data;
          }
        } catch (e) {
          // Continue to fallback
        }
      }

      if (results && results.length > 0) {
        // Increment usage count for the best match
        try {
          await this.supabase.rpc('increment_kb_usage', { kb_id: results[0].id });
        } catch (e) {
          console.warn('Could not increment usage count:', e);
        }

        return {
          text: results[0].answer,
          data: { kb_id: results[0].id, matched_results: results.length }
        };
      }

      // Enhanced fallback - intelligent context-aware responses
      const lowerMessage = message.toLowerCase().trim();
      
      // Handle availability questions with more variations
      if (/(available|have|got|sell|rent|offer|any|got\s+any|do\s+you\s+have)/.test(lowerMessage)) {
        return {
          text: "Yes! We have many properties available including apartments, houses, cars, and land plots. Would you like me to search for something specific?",
          data: {
            quickReplies: [
              { text: "Show me apartments" },
              { text: "Show me cars" },
              { text: "Show me land plots" }
            ],
            actions: [
              { 
                text: "Browse All Listings", 
                icon: "bi-house",
                url: "index.html"
              }
            ],
            suggestions: [
              { text: "What's the price range?" },
              { text: "Where are properties located?" }
            ]
          }
        };
      }
      
      // Handle general property questions
      if (/(property|properties|listing|listings|item|items|what\s+do\s+you|what\s+are|what\s+is)/.test(lowerMessage)) {
        return {
          text: "We have a wide variety of properties available! You can browse apartments, houses, cars, and land plots. What are you looking for?",
          data: {
            quickReplies: [
              { text: "Show me apartments" },
              { text: "Show me cars" },
              { text: "Show me land plots" }
            ],
            actions: [
              { 
                text: "View Apartments", 
                icon: "bi-house",
                url: "apartment.html"
              },
              { 
                text: "View Cars", 
                icon: "bi-car-front",
                url: "cars.html"
              },
              { 
                text: "View Land", 
                icon: "bi-map",
                url: "land.html"
              }
            ]
          }
        };
      }

      // Handle price/cost questions
      if (/(price|cost|how\s+much|expensive|cheap|affordable|budget)/.test(lowerMessage)) {
        return {
          text: "Prices vary depending on the type of property, location, and features. You can browse our listings and use price filters to find properties within your budget.",
          data: {
            quickReplies: [
              { text: "Show me affordable apartments" },
              { text: "Show me budget cars" },
              { text: "What's the average price?" }
            ],
            actions: [
              { 
                text: "Browse with Price Filter", 
                icon: "bi-funnel",
                url: "search.html"
              }
            ]
          }
        };
      }

      // Handle location questions
      if (/(where|location|area|areas|district|districts|in\s+kigali|kigali)/.test(lowerMessage)) {
        return {
          text: "We have properties throughout Rwanda, with many listings in Kigali and other districts. You can filter listings by location on each category page.",
          data: {
            quickReplies: [
              { text: "Show me properties in Kigali" },
              { text: "Show me properties in Gasabo" },
              { text: "Show me properties in Kicukiro" }
            ],
            suggestions: [
              { text: "What areas have the most listings?" },
              { text: "Show me properties near the city center" }
            ]
          }
        };
      }

      // Handle "how to" questions
      if (/(how\s+to|how\s+do\s+i|how\s+can\s+i)/.test(lowerMessage)) {
        return {
          text: "I can help guide you! For searching properties, browse by category and use filters. For booking viewings, click 'Book Viewing' on property pages. For posting listings, create an account and click 'Post'.",
          data: {
            actions: [
              { 
                text: "Post a Listing", 
                icon: "bi-plus-circle",
                url: "post.html"
              },
              { 
                text: "Search Properties", 
                icon: "bi-search",
                url: "search.html"
              },
              { 
                text: "Create Account", 
                icon: "bi-person-plus",
                url: "signup.html"
              }
            ],
            suggestions: [
              { text: "How do I book a viewing?" },
              { text: "How do I contact a seller?" },
              { text: "How do I save favorites?" }
            ]
          }
        };
      }
      
      // Default fallback - more helpful
      return {
        text: "I'm Rejo AI, your HOME AFRICA assistant. I can help you find apartments, houses, cars, and land plots, or answer questions about our services.",
        data: {
          quickReplies: [
            { text: "Show me apartments" },
            { text: "Show me cars" },
            { text: "Are houses available?" }
          ],
          suggestions: [
            { text: "What properties do you have?" },
            { text: "How do I book a viewing?" },
            { text: "How do I post a listing?" },
            { text: "What's the price range?" }
          ],
          actions: [
            { 
              text: "Browse All Properties", 
              icon: "bi-house",
              url: "index.html"
            }
          ]
        }
      };
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      return {
        text: "I'm here to help! Feel free to ask about our listings, booking process, or services. You can also browse our website directly.",
        data: null
      };
    }
  }

  /**
   * Handle book viewing intent
   */
  async handleBookViewing(entities) {
    return {
      text: "To book a viewing, please visit the listing details page and click the 'Book Viewing' button. You can also tell me which listing you're interested in, and I can help you find it!",
      data: {
        actions: [
          { 
            text: "Search Listings", 
            icon: "bi-search",
            url: "search.html"
          },
          { 
            text: "Browse Apartments", 
            icon: "bi-house",
            url: "apartment.html"
          },
          { 
            text: "Browse Cars", 
            icon: "bi-car-front",
            url: "cars.html"
          }
        ],
        suggestions: [
          { text: "How do I contact a seller?" },
          { text: "What information do I need to book?" },
          { text: "Can I book multiple viewings?" }
        ]
      }
    };
  }

  /**
   * Add message to chat UI with rich response support
   */
  async addMessage(role, content, data = null) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chatbot-message ${role}`;
    
    // Support rich content (HTML)
    if (data && data.html) {
      messageDiv.innerHTML = data.html;
    } else {
      messageDiv.textContent = content;
    }

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Handle rich response data
    if (data) {
      // Listing cards with images
      if (data.listings && data.listings.length > 0) {
        await this.addListingCards(data.listings);
      }
      
      // Quick reply buttons
      if (data.quickReplies && data.quickReplies.length > 0) {
        await this.addQuickReplies(data.quickReplies);
      }
      
      // Action buttons
      if (data.actions && data.actions.length > 0) {
        await this.addActionButtons(data.actions);
      }
      
      // Suggested questions
      if (data.suggestions && data.suggestions.length > 0) {
        await this.addSuggestions(data.suggestions);
      }
      
      // Carousel for multiple items
      if (data.carousel && data.carousel.length > 0) {
        await this.addCarousel(data.carousel);
      }
    }
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Add rich listing cards with images
   */
  async addListingCards(listings) {
    const messagesContainer = document.getElementById('chatbot-messages');
    
    listings.forEach(listing => {
      const cardDiv = document.createElement('div');
      cardDiv.className = 'chatbot-listing-card';
      cardDiv.innerHTML = `
        <div class="listing-card-image">
          <img src="${listing.images && listing.images[0] ? listing.images[0] : 'images/hero-bg.jpeg'}" 
               alt="${listing.title || 'Listing'}" 
               onerror="this.src='images/hero-bg.jpeg'">
        </div>
        <div class="listing-card-content">
          <h6 class="listing-card-title">${listing.title || 'Untitled'}</h6>
          <p class="listing-card-price">RWF ${parseInt(listing.price || 0).toLocaleString()}</p>
          ${listing.location ? `<p class="listing-card-location"><i class="bi bi-geo-alt"></i> ${listing.location}</p>` : ''}
          ${listing.type ? `<span class="listing-card-type">${listing.type}</span>` : ''}
        </div>
        <div class="listing-card-actions">
          <button class="btn-view-listing" data-listing-id="${listing.id}" data-listing-type="${listing.type || 'apartment'}">
            <i class="bi bi-eye"></i> View
          </button>
        </div>
      `;
      
      // Add click handler
      const viewBtn = cardDiv.querySelector('.btn-view-listing');
      viewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const listingId = viewBtn.getAttribute('data-listing-id');
        const listingType = viewBtn.getAttribute('data-listing-type');
        window.location.href = `${listingType}-detail.html?id=${listingId}`;
      });
      
      cardDiv.addEventListener('click', () => {
        window.location.href = `${listing.type || 'apartment'}-detail.html?id=${listing.id}`;
      });
      
      messagesContainer.appendChild(cardDiv);
    });
  }

  /**
   * Add quick reply buttons
   */
  async addQuickReplies(quickReplies) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const quickRepliesDiv = document.createElement('div');
    quickRepliesDiv.className = 'chatbot-quick-replies';
    
    quickReplies.forEach(reply => {
      const button = document.createElement('button');
      button.className = 'quick-reply-btn';
      button.textContent = reply.text || reply;
      button.addEventListener('click', () => {
        // Add the quick reply as user message
        document.getElementById('chatbot-input').value = reply.text || reply;
        this.sendMessage();
      });
      quickRepliesDiv.appendChild(button);
    });
    
    messagesContainer.appendChild(quickRepliesDiv);
  }

  /**
   * Add action buttons
   */
  async addActionButtons(actions) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'chatbot-actions';
    
    actions.forEach(action => {
      const button = document.createElement('button');
      button.className = `action-btn action-${action.type || 'default'}`;
      button.innerHTML = `<i class="bi ${action.icon || 'bi-arrow-right'}"></i> ${action.text}`;
      
      button.addEventListener('click', () => {
        if (action.url) {
          window.location.href = action.url;
        } else if (action.action) {
          // Custom action handler
          if (typeof action.action === 'function') {
            action.action();
          }
        } else if (action.message) {
          // Send a message
          document.getElementById('chatbot-input').value = action.message;
          this.sendMessage();
        }
      });
      
      actionsDiv.appendChild(button);
    });
    
    messagesContainer.appendChild(actionsDiv);
  }

  /**
   * Add suggested questions
   */
  async addSuggestions(suggestions) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'chatbot-suggestions';
    suggestionsDiv.innerHTML = '<div class="suggestions-label">💡 You might also ask:</div>';
    
    const suggestionsList = document.createElement('div');
    suggestionsList.className = 'suggestions-list';
    
    suggestions.forEach(suggestion => {
      const suggestionBtn = document.createElement('button');
      suggestionBtn.className = 'suggestion-btn';
      suggestionBtn.textContent = suggestion.text || suggestion;
      suggestionBtn.addEventListener('click', () => {
        document.getElementById('chatbot-input').value = suggestion.text || suggestion;
        this.sendMessage();
      });
      suggestionsList.appendChild(suggestionBtn);
    });
    
    suggestionsDiv.appendChild(suggestionsList);
    messagesContainer.appendChild(suggestionsDiv);
  }

  /**
   * Add carousel for multiple items
   */
  async addCarousel(items) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const carouselDiv = document.createElement('div');
    carouselDiv.className = 'chatbot-carousel';
    carouselDiv.innerHTML = '<div class="carousel-container"></div>';
    
    const container = carouselDiv.querySelector('.carousel-container');
    let currentIndex = 0;
    
    items.forEach((item, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = `carousel-item ${index === 0 ? 'active' : ''}`;
      itemDiv.innerHTML = item.html || item.content || '';
      container.appendChild(itemDiv);
    });
    
    // Add navigation if more than one item
    if (items.length > 1) {
      const navDiv = document.createElement('div');
      navDiv.className = 'carousel-nav';
      navDiv.innerHTML = `
        <button class="carousel-prev"><i class="bi bi-chevron-left"></i></button>
        <span class="carousel-indicator">1 / ${items.length}</span>
        <button class="carousel-next"><i class="bi bi-chevron-right"></i></button>
      `;
      
      const prevBtn = navDiv.querySelector('.carousel-prev');
      const nextBtn = navDiv.querySelector('.carousel-next');
      const indicator = navDiv.querySelector('.carousel-indicator');
      
      const showItem = (index) => {
        container.querySelectorAll('.carousel-item').forEach((item, i) => {
          item.classList.toggle('active', i === index);
        });
        indicator.textContent = `${index + 1} / ${items.length}`;
        currentIndex = index;
      };
      
      prevBtn.addEventListener('click', () => {
        showItem((currentIndex - 1 + items.length) % items.length);
      });
      
      nextBtn.addEventListener('click', () => {
        showItem((currentIndex + 1) % items.length);
      });
      
      carouselDiv.appendChild(navDiv);
    }
    
    messagesContainer.appendChild(carouselDiv);
  }

  /**
   * Show typing indicator
   */
  showTyping() {
    this.isTyping = true;
    document.getElementById('chatbot-typing').style.display = 'block';
    const messagesContainer = document.getElementById('chatbot-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Hide typing indicator
   */
  hideTyping() {
    this.isTyping = false;
    document.getElementById('chatbot-typing').style.display = 'none';
  }

  /**
   * Save message to database
   */
  async saveMessage(role, content, intent, entities) {
    if (!this.supabase) return;

    try {
      // Ensure conversation exists
      if (!this.conversationId) {
        const { data: conv, error: convError } = await this.supabase
          .from('chat_conversations')
          .insert({
            session_id: this.sessionId,
            user_id: this.getUserId(),
            status: 'active'
          })
          .select()
          .single();

        if (convError) throw convError;
        this.conversationId = conv.id;
      }

      // Save message
      const { error } = await this.supabase
        .from('chat_messages')
        .insert({
          conversation_id: this.conversationId,
          role: role,
          content: content,
          intent: intent,
          entities: entities
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }

  /**
   * Load conversation history
   */
  async loadConversationHistory() {
    // Implementation for loading previous messages
    // This would fetch messages from the database for the current session
  }

  /**
   * Get current user ID (if logged in)
   */
  getUserId() {
    // Check if user is logged in (implement based on your auth system)
    const userId = localStorage.getItem('userId');
    return userId ? userId : null;
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize chatbot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.homeAfricaChatbot = new HomeAfricaChatbot();
  });
} else {
  window.homeAfricaChatbot = new HomeAfricaChatbot();
}

