/**
 * Comments System
 * Rich comment system for product posts and listings
 */

class CommentsSystem {
  constructor(postId, containerId) {
    this.postId = postId;
    this.containerId = containerId;
    this.supabase = window.supabaseClient;
    this.init();
  }

  /**
   * Initialize comments system
   */
  async init() {
    await this.loadComments();
    this.setupEventListeners();
  }

  /**
   * Load comments for a post
   */
  async loadComments() {
    try {
      if (!this.supabase) return;

      const { data: comments, error } = await this.supabase
        .from('comments')
        .select(`
          *,
          user_profiles!comments_author_id_fkey(display_name, profile_image_url),
          business_profiles!comments_author_id_fkey(business_name, logo_url)
        `)
        .eq('post_id', this.postId)
        .eq('status', 'active')
        .is('parent_comment_id', null) // Top-level comments only
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading comments:', error);
        return;
      }

      this.displayComments(comments || []);

    } catch (error) {
      console.error('Error in loadComments:', error);
    }
  }

  /**
   * Display comments
   */
  displayComments(comments) {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Update comment count
    const commentsCount = document.getElementById('commentsCount');
    if (commentsCount) {
      commentsCount.textContent = `(${comments.length} comment${comments.length !== 1 ? 's' : ''})`;
    }

    if (comments.length === 0) {
      container.innerHTML = `
        <div class="text-center text-white-50 py-4">
          <i class="bi bi-chat" style="font-size: 2rem;"></i>
          <p class="mt-2">No comments yet. Be the first to comment!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = comments.map(comment => this.renderComment(comment)).join('');
    
    // Load replies for each comment
    comments.forEach(comment => {
      this.loadReplies(comment.id);
    });
  }

  /**
   * Render a single comment
   */
  renderComment(comment) {
    const author = comment.user_profiles || comment.business_profiles || {};
    const authorName = author.display_name || author.business_name || 'Anonymous';
    const authorImage = author.profile_image_url || author.logo_url || 'images/hero-bg.jpeg';
    const isBestAnswer = comment.is_best_answer ? '<span class="badge bg-success ms-2">Best Answer</span>' : '';

    return `
      <div class="comment-item mb-4" data-comment-id="${comment.id}">
        <div class="d-flex gap-3">
          <img src="${authorImage}" alt="${authorName}" 
               style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #0ff;">
          <div class="flex-grow-1">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div>
                <h6 class="text-white mb-0">${escapeHtml(authorName)}${isBestAnswer}</h6>
                <small class="text-white-50">${formatDate(comment.created_at)}</small>
              </div>
              <div class="comment-actions">
                <button class="btn btn-sm btn-link text-cyan" onclick="likeComment('${comment.id}')">
                  <i class="bi bi-heart"></i> ${comment.likes_count || 0}
                </button>
                <button class="btn btn-sm btn-link text-cyan" onclick="replyToComment('${comment.id}')">
                  <i class="bi bi-reply"></i> Reply
                </button>
              </div>
            </div>
            <div class="comment-content text-white-50">
              ${escapeHtml(comment.content)}
            </div>
            ${comment.images && comment.images.length > 0 ? `
              <div class="comment-images mt-2">
                ${comment.images.map(img => `
                  <img src="${img}" alt="Comment image" style="max-width: 200px; border-radius: 8px; margin-right: 10px;">
                `).join('')}
              </div>
            ` : ''}
            <div class="replies-container mt-3" id="replies-${comment.id}">
              <!-- Replies will be loaded here -->
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Load replies for a comment
   */
  async loadReplies(parentCommentId) {
    try {
      if (!this.supabase) return;

      const { data: replies, error } = await this.supabase
        .from('comments')
        .select(`
          *,
          user_profiles!comments_author_id_fkey(display_name, profile_image_url),
          business_profiles!comments_author_id_fkey(business_name, logo_url)
        `)
        .eq('parent_comment_id', parentCommentId)
        .eq('status', 'active')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading replies:', error);
        return;
      }

      const container = document.getElementById(`replies-${parentCommentId}`);
      if (container && replies && replies.length > 0) {
        container.innerHTML = replies.map(reply => this.renderReply(reply)).join('');
      }

    } catch (error) {
      console.error('Error in loadReplies:', error);
    }
  }

  /**
   * Render a reply
   */
  renderReply(reply) {
    const author = reply.user_profiles || reply.business_profiles || {};
    const authorName = author.display_name || author.business_name || 'Anonymous';
    const authorImage = author.profile_image_url || author.logo_url || 'images/hero-bg.jpeg';

    return `
      <div class="reply-item ms-5 mt-3" data-comment-id="${reply.id}">
        <div class="d-flex gap-2">
          <img src="${authorImage}" alt="${authorName}" 
               style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #0ff;">
          <div class="flex-grow-1">
            <div class="d-flex justify-content-between align-items-start mb-1">
              <div>
                <h6 class="text-white mb-0" style="font-size: 0.9rem;">${escapeHtml(authorName)}</h6>
                <small class="text-white-50">${formatDate(reply.created_at)}</small>
              </div>
              <button class="btn btn-sm btn-link text-cyan" onclick="likeComment('${reply.id}')">
                <i class="bi bi-heart"></i> ${reply.likes_count || 0}
              </button>
            </div>
            <div class="comment-content text-white-50" style="font-size: 0.9rem;">
              ${escapeHtml(reply.content)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Comment form submission will be handled by the page that includes this
  }

  /**
   * Add a new comment
   */
  async addComment(content, parentCommentId = null, images = []) {
    try {
      if (!this.supabase) return;

      const userId = getCurrentUserId();
      const authorType = getAuthorType();

      if (!userId) {
        alert('Please log in to comment');
        return;
      }

      const { data: comment, error } = await this.supabase
        .from('comments')
        .insert([{
          post_id: this.postId,
          parent_comment_id: parentCommentId,
          author_id: userId,
          author_type: authorType,
          content: content,
          images: images.length > 0 ? images : null
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Reload comments
      await this.loadComments();

      // Clear comment form
      const commentInput = document.getElementById('commentInput');
      if (commentInput) commentInput.value = '';

      return comment;

    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error adding comment: ' + error.message);
    }
  }
}

/**
 * Like a comment
 */
async function likeComment(commentId) {
  try {
    const supabase = window.supabaseClient;
    if (!supabase) return;

    const userId = getCurrentUserId();
    if (!userId) {
      alert('Please log in to like comments');
      return;
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      // Unlike
      await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);
    } else {
      // Like
      await supabase
        .from('comment_likes')
        .insert([{
          comment_id: commentId,
          user_id: userId
        }]);
    }

    // Reload comments to update like count
    // This would be better with real-time updates
    location.reload();

  } catch (error) {
    console.error('Error liking comment:', error);
  }
}

/**
 * Reply to a comment
 */
function replyToComment(parentCommentId) {
  const replyForm = document.getElementById('replyForm');
  if (replyForm) {
    replyForm.style.display = 'block';
    replyForm.dataset.parentId = parentCommentId;
    replyForm.scrollIntoView({ behavior: 'smooth' });
  } else {
    // Create reply form
    const parentComment = document.querySelector(`[data-comment-id="${parentCommentId}"]`);
    if (parentComment) {
      const form = document.createElement('div');
      form.className = 'reply-form mt-3';
      form.innerHTML = `
        <div class="d-flex gap-2">
          <input type="text" class="form-control" id="replyInput-${parentCommentId}" placeholder="Write a reply...">
          <button class="btn btn-primary" onclick="submitReply('${parentCommentId}')">Reply</button>
        </div>
      `;
      parentComment.appendChild(form);
    }
  }
}

/**
 * Submit a reply
 */
async function submitReply(parentCommentId) {
  const input = document.getElementById(`replyInput-${parentCommentId}`);
  if (!input || !input.value.trim()) return;

  const commentsSystem = window.currentCommentsSystem;
  if (commentsSystem) {
    await commentsSystem.addComment(input.value.trim(), parentCommentId);
  }
}

/**
 * Helper functions
 */
function getCurrentUserId() {
  // Try Supabase session first
  if (window.supabaseClient) {
    try {
      const session = window.supabaseClient.auth.getSession();
      if (session?.data?.session?.user) {
        return session.data.session.user.id;
      }
    } catch (e) {
      // Session check failed
    }
  }
  
  // Try localStorage
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

function getAuthorType() {
  return localStorage.getItem('isMerchant') === 'true' ? 'merchant' : 'user';
}

function formatDate(dateString) {
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
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

