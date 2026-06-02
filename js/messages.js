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
    this.isAdmin = false;
    this.init();
  }

  /**
   * Initialize messaging system
   */
  async init() {
    this.userId = await this.getCurrentUserId();
    this.userType = this.getAuthorType();
    this.isAdmin = await this.checkIsAdmin();

    if (!this.userId) {
      this.showLoginPrompt();
      return;
    }

    // Show admin panel if admin
    if (this.isAdmin) {
      this.showAdminPanel();
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
   * Check if current user is admin
   */
  async checkIsAdmin() {
    try {
      if (!this.supabase || !this.userId) return false;
      
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', this.userId)
        .single();
      
      if (error) return false;
      return data?.role === 'admin';
    } catch (e) {
      return false;
    }
  }

  /**
   * Show admin panel for admin users
   */
  showAdminPanel() {
    // Add admin controls to the page
    const threadsList = document.getElementById('threadsList');
    if (threadsList) {
      const adminPanel = document.createElement('div');
      adminPanel.className = 'admin-panel mb-3';
      adminPanel.innerHTML = `
        <div class="alert alert-warning">
          <i class="bi bi-shield-lock"></i> <strong>Admin Mode</strong>
          <div class="mt-2">
            <button class="btn btn-sm btn-warning" onclick="messagesSystem.loadAllUsers()">
              <i class="bi bi-people"></i> View All Users
            </button>
            <button class="btn btn-sm btn-warning ms-2" onclick="messagesSystem.loadAllMerchants()">
              <i class="bi bi-shop"></i> View All Merchants
            </button>
          </div>
        </div>
      `;
      threadsList.parentNode.insertBefore(adminPanel, threadsList);
    }
  }

  /**
   * Load all users (admin only)
   */
  async loadAllUsers() {
    if (!this.isAdmin) return;
    
    try {
      const { data: users, error } = await this.supabase
        .from('user_profiles')
        .select('user_id, display_name, role, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      this.displayUserList(users || [], 'Users');
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Error loading users: ' + error.message);
    }
  }

  /**
   * Load all merchants (admin only)
   */
  async loadAllMerchants() {
    if (!this.isAdmin) return;
    
    try {
      const { data: merchants, error } = await this.supabase
        .from('business_profiles')
        .select('merchant_id, business_name, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      this.displayUserList(merchants || [], 'Merchants');
    } catch (error) {
      console.error('Error loading merchants:', error);
      alert('Error loading merchants: ' + error.message);
    }
  }

  /**
   * Display user/merchant list for admin
   */
  displayUserList(users, type) {
    const threadsList = document.getElementById('threadsList');
    if (!threadsList) return;
    
    threadsList.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h6 class="mb-0">All ${type}</h6>
        <button class="btn btn-sm btn-outline-light" onclick="messagesSystem.loadThreads()">
          <i class="bi bi-arrow-left"></i> Back
        </button>
      </div>
    `;
    
    if (users.length === 0) {
      threadsList.innerHTML += `<div class="text-muted">No ${type.toLowerCase()} found</div>`;
      return;
    }
    
    users.forEach(user => {
      const userId = user.user_id || user.merchant_id;
      const userName = user.display_name || user.business_name || 'Unknown';
      const userType = type === 'Merchants' ? 'merchant' : 'user';
      
      const userItem = document.createElement('div');
      userItem.className = 'thread-item';
      userItem.innerHTML = `
        <div class="d-flex align-items-center">
          <div class="thread-info" style="flex: 1;">
            <div class="thread-name">${escapeHtml(userName)}</div>
            <div class="thread-preview text-muted small">${userType} • Click to message</div>
          </div>
          <button class="btn btn-sm btn-primary" onclick="messagesSystem.startConversation('${userId}', '${userType}')">
            <i class="bi bi-chat"></i>
          </button>
        </div>
      `;
      threadsList.appendChild(userItem);
    });
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

      let query = this.supabase
        .from('message_threads')
        .select('*');

      // If not admin, only show threads where user is participant
      if (!this.isAdmin) {
        query = query.or(`participant_1_id.eq.${this.userId},participant_2_id.eq.${this.userId}`);
      }

      const { data: threads, error } = await query
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
      // Fetch thread to determine which participant is the receiver
      const { data: threadData } = await this.supabase
        .from('message_threads')
        .select('participant_1_id')
        .eq('id', threadId)
        .single();

      const unreadUpdate = threadData?.participant_1_id === this.userId
        ? { unread_count_p2: 1 }
        : { unread_count_p1: 1 };

      await this.supabase
        .from('message_threads')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: messageText.substring(0, 50),
          ...unreadUpdate
        })
        .eq('id', threadId);

      // Clear input
      messageInput.value = '';
      messageInput.style.height = 'auto';

      // Send email notification to recipient (best-effort, no await)
      try {
        if (window.emailNotifications && this.currentParticipant?.id) {
          const { data: recipientData } = await this.supabase.auth.admin?.getUserById
            ? { data: null }
            : await this.supabase.from('user_profiles').select('email, display_name').eq('user_id', this.currentParticipant.id).single().catch(() => ({ data: null }));
          const senderEmail = (await this.supabase.auth.getSession())?.data?.session?.user?.email || 'Someone';
          const recipientEmail = recipientData?.email;
          if (recipientEmail) {
            window.emailNotifications.sendMessageNotification(recipientEmail, senderEmail, messageText.substring(0, 80));
          }
        }
      } catch (e) { /* non-critical */ }

      // Create in-app notification for recipient (best-effort, no await)
      try {
        if (this.currentParticipant?.id) {
          const senderName = (await this.supabase.auth.getSession())?.data?.session?.user?.email?.split('@')[0] || 'Someone';
          await this.supabase.from('notifications').insert({
            user_id: this.currentParticipant.id,
            type: 'message',
            title: 'New message from ' + senderName,
            body: messageText.substring(0, 100),
            action_url: 'messages.html?thread=' + threadId,
            read_at: null
          });
        }
      } catch (e) { /* non-critical */ }

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
  async getCurrentUserId() {
    // Try Supabase auth first (async)
    if (this.supabase && this.supabase.auth) {
      try {
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session?.user) {
          return session.user.id;
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

