/**
 * Direct Messaging System
 * Handles private conversations between users and merchants
 */

class MessagesSystem {
  constructor() {
    this.supabase = window.supabaseClient;
    this.currentThreadId = null;
    this.currentParticipant = null;
    this.userId = null;
    this.userType = null;
    this.init();
  }

  /**
   * Initialize messaging system
   */
  async init() {
    this.userId = this.getCurrentUserId();
    this.userType = this.getAuthorType();

    if (!this.userId) {
      this.showLoginPrompt();
      return;
    }

    // Check if starting new conversation from URL
    const urlParams = new URLSearchParams(window.location.search);
    const startUserId = urlParams.get('start');
    const startUserType = urlParams.get('type');

    if (startUserId && startUserType) {
      await this.startConversation(startUserId, startUserType);
    }

    await this.loadThreads();
    this.setupEventListeners();
    
    // Poll for new messages every 5 seconds
    setInterval(() => {
      if (this.currentThreadId) {
        this.loadMessages(this.currentThreadId);
      }
      this.loadThreads();
    }, 5000);
  }

  /**
   * Show login prompt
   */
  showLoginPrompt() {
    const threadsList = document.getElementById('threadsList');
    if (threadsList) {
      threadsList.innerHTML = `
        <div class="empty-state">
          <i class="bi bi-lock"></i>
          <p>Please <a href="signin.html" class="text-cyan">log in</a> to view your messages</p>
        </div>
      `;
    }
  }

  /**
   * Load message threads
   */
  async loadThreads() {
    try {
      if (!this.supabase || !this.userId) return;

      // Get threads where user is participant 1 or 2
      const { data: threads, error } = await this.supabase
        .from('message_threads')
        .select('*')
        .or(`participant_1_id.eq.${this.userId},participant_2_id.eq.${this.userId}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error loading threads:', error);
        return;
      }

      this.displayThreads(threads || []);

    } catch (error) {
      console.error('Error in loadThreads:', error);
    }
  }

  /**
   * Display threads list
   */
  async displayThreads(threads) {
    const threadsList = document.getElementById('threadsList');
    if (!threadsList) return;

    if (threads.length === 0) {
      threadsList.innerHTML = `
        <div class="empty-state">
          <i class="bi bi-inbox"></i>
          <p>No conversations yet</p>
        </div>
      `;
      return;
    }

    // Load participant info for each thread
    const threadsWithInfo = await Promise.all(
      threads.map(async (thread) => {
        const otherParticipantId = thread.participant_1_id === this.userId 
          ? thread.participant_2_id 
          : thread.participant_1_id;
        const otherParticipantType = thread.participant_1_id === this.userId 
          ? thread.participant_2_type 
          : thread.participant_1_type;

        // Get participant info
        let participantInfo = null;
        if (otherParticipantType === 'user') {
          const { data: profile } = await this.supabase
            .from('user_profiles')
            .select('display_name, profile_image_url')
            .eq('user_id', otherParticipantId)
            .single();
          participantInfo = {
            name: profile?.display_name || 'User',
            avatar: profile?.profile_image_url || 'images/hero-bg.jpeg'
          };
        } else {
          const { data: profile } = await this.supabase
            .from('business_profiles')
            .select('business_name, logo_url')
            .eq('merchant_id', otherParticipantId)
            .single();
          participantInfo = {
            name: profile?.business_name || 'Business',
            avatar: profile?.logo_url || 'images/hero-bg.jpeg'
          };
        }

        return {
          ...thread,
          otherParticipantId,
          otherParticipantType,
          participantInfo
        };
      })
    );

    threadsList.innerHTML = threadsWithInfo.map(thread => {
      const unreadCount = thread.participant_1_id === this.userId 
        ? thread.unread_count_p1 
        : thread.unread_count_p2;
      const isUnread = unreadCount > 0;

      return `
        <div class="thread-item ${isUnread ? 'unread' : ''}" 
             onclick="messagesSystem.openThread('${thread.id}', '${thread.otherParticipantId}', '${thread.otherParticipantType}')">
          <div class="d-flex align-items-center">
            <img src="${thread.participantInfo.avatar}" 
                 alt="${thread.participantInfo.name}" 
                 class="thread-avatar">
            <div class="thread-info">
              <div class="thread-name">${escapeHtml(thread.participantInfo.name)}</div>
              <div class="thread-preview">${escapeHtml(thread.last_message_preview || 'No messages yet')}</div>
            </div>
            <div class="d-flex flex-column align-items-end">
              <div class="thread-time">${formatTime(thread.last_message_at)}</div>
              ${isUnread ? `<div class="unread-badge">${unreadCount}</div>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Open a thread
   */
  async openThread(threadId, participantId, participantType) {
    this.currentThreadId = threadId;
    this.currentParticipant = { id: participantId, type: participantType };

    // Update active thread
    document.querySelectorAll('.thread-item').forEach(item => {
      item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // Load participant info
    await this.loadParticipantInfo(participantId, participantType);

    // Load messages
    await this.loadMessages(threadId);

    // Show chat input
    document.getElementById('chatInputArea').style.display = 'flex';
    document.getElementById('chatHeader').style.display = 'flex';

    // Mark as read
    await this.markThreadAsRead(threadId);
  }

  /**
   * Load participant info
   */
  async loadParticipantInfo(participantId, participantType) {
    try {
      let name = 'User';
      let avatar = 'images/hero-bg.jpeg';

      if (participantType === 'user') {
        const { data: profile } = await this.supabase
          .from('user_profiles')
          .select('display_name, profile_image_url')
          .eq('user_id', participantId)
          .single();
        name = profile?.display_name || 'User';
        avatar = profile?.profile_image_url || 'images/hero-bg.jpeg';
      } else {
        const { data: profile } = await this.supabase
          .from('business_profiles')
          .select('business_name, logo_url')
          .eq('merchant_id', participantId)
          .single();
        name = profile?.business_name || 'Business';
        avatar = profile?.logo_url || 'images/hero-bg.jpeg';
      }

      document.getElementById('chatName').textContent = name;
      document.getElementById('chatAvatar').src = avatar;

    } catch (error) {
      console.error('Error loading participant info:', error);
    }
  }

  /**
   * Load messages for a thread
   */
  async loadMessages(threadId) {
    try {
      if (!this.supabase) return;

      const { data: messages, error } = await this.supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      this.displayMessages(messages || []);

    } catch (error) {
      console.error('Error in loadMessages:', error);
    }
  }

  /**
   * Display messages
   */
  displayMessages(messages) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    if (messages.length === 0) {
      chatMessages.innerHTML = `
        <div class="empty-state">
          <i class="bi bi-chat-left-text"></i>
          <p>No messages yet. Start the conversation!</p>
        </div>
      `;
      return;
    }

    chatMessages.innerHTML = messages.map(message => {
      const isSent = message.sender_id === this.userId;
      return `
        <div class="message-bubble ${isSent ? 'sent' : 'received'}">
          <div>${escapeHtml(message.content)}</div>
          <div class="message-time">${formatTime(message.created_at)}</div>
        </div>
      `;
    }).join('');

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /**
   * Send a message
   */
  async sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();

    if (!messageText) return;
    if (!this.currentThreadId) {
      alert('Please select a conversation');
      return;
    }

    try {
      if (!this.supabase) {
        alert('Database connection not available');
        return;
      }

      // Create or get thread
      let threadId = this.currentThreadId;
      
      if (!threadId && this.currentParticipant) {
        // Create new thread
        const { data: newThread, error: threadError } = await this.supabase
          .from('message_threads')
          .insert([{
            participant_1_id: this.userId,
            participant_1_type: this.userType,
            participant_2_id: this.currentParticipant.id,
            participant_2_type: this.currentParticipant.type,
            last_message_at: new Date().toISOString(),
            last_message_preview: messageText.substring(0, 50),
            unread_count_p2: 1
          }])
          .select()
          .single();

        if (threadError) {
          throw threadError;
        }

        threadId = newThread.id;
        this.currentThreadId = threadId;
      }

      // Send message
      const { data: message, error } = await this.supabase
        .from('messages')
        .insert([{
          thread_id: threadId,
          sender_id: this.userId,
          sender_type: this.userType,
          content: messageText
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update thread
      await this.supabase
        .from('message_threads')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: messageText.substring(0, 50),
          unread_count_p1: this.userId === this.currentParticipant?.id ? 0 : 0,
          unread_count_p2: this.userId === this.currentParticipant?.id ? 1 : 0
        })
        .eq('id', threadId);

      // Clear input
      messageInput.value = '';
      messageInput.style.height = 'auto';

      // Reload messages
      await this.loadMessages(threadId);
      await this.loadThreads();

    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message: ' + error.message);
    }
  }

  /**
   * Mark thread as read
   */
  async markThreadAsRead(threadId) {
    try {
      if (!this.supabase) return;

      const updateData = {};
      if (this.userId) {
        // Determine which participant the user is
        const { data: thread } = await this.supabase
          .from('message_threads')
          .select('participant_1_id, participant_2_id')
          .eq('id', threadId)
          .single();

        if (thread) {
          if (thread.participant_1_id === this.userId) {
            updateData.unread_count_p1 = 0;
          } else {
            updateData.unread_count_p2 = 0;
          }

          await this.supabase
            .from('message_threads')
            .update(updateData)
            .eq('id', threadId);
        }
      }
    } catch (error) {
      console.error('Error marking thread as read:', error);
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Already handled in HTML
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

  /**
   * Get author type
   */
  getAuthorType() {
    return localStorage.getItem('isMerchant') === 'true' ? 'merchant' : 'user';
  }

  /**
   * Start new conversation
   */
  async startConversation(participantId, participantType) {
    this.currentParticipant = { id: participantId, type: participantType };
    
    // Check if thread exists
    const { data: existingThread } = await this.supabase
      .from('message_threads')
      .select('id')
      .or(`and(participant_1_id.eq.${this.userId},participant_2_id.eq.${participantId}),and(participant_1_id.eq.${participantId},participant_2_id.eq.${this.userId})`)
      .single();

    if (existingThread) {
      await this.openThread(existingThread.id, participantId, participantType);
    } else {
      // Show chat area ready for new message
      await this.loadParticipantInfo(participantId, participantType);
      document.getElementById('chatInputArea').style.display = 'flex';
      document.getElementById('chatHeader').style.display = 'flex';
      document.getElementById('chatMessages').innerHTML = `
        <div class="empty-state">
          <i class="bi bi-chat-left-text"></i>
          <p>Start a new conversation</p>
        </div>
      `;
    }
  }
}

// Global functions
let messagesSystem = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  messagesSystem = new MessagesSystem();
  window.messagesSystem = messagesSystem;
});

function sendMessage() {
  if (messagesSystem) {
    messagesSystem.sendMessage();
  }
}

// Helper functions
function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return date.toLocaleDateString();
  } else if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return 'Just now';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

