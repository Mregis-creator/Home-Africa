/**
 * Create Post Functionality
 * Handles post creation for both merchants and users
 */

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('createPostForm');
  if (form) {
    form.addEventListener('submit', handlePostSubmit);
  }
});

/**
 * Handle post form submission
 */
async function handlePostSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const statusMessage = document.getElementById('statusMessage');
  
  // Disable submit button and show loading
  if (submitBtn) {
    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.setAttribute('data-original-text', originalText);
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Publishing...';
  }
  
  statusMessage.innerHTML = '<div class="alert alert-info"><i class="bi bi-hourglass-split"></i> Publishing post...</div>';

  try {
    const supabase = window.supabaseClient;
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // Get current user
    const userId = getCurrentUserId();
    const authorType = getAuthorType(); // 'user' or 'merchant'

    if (!userId) {
      throw new Error('Please log in to create a post');
    }

    // Get post type (default to 'product' for non-merchants)
    let postType = document.getElementById('postType').value;
    if (!postType) {
      postType = 'product'; // Default for regular users
    }

    // Get form data
    const postData = {
      author_id: userId,
      author_type: authorType,
      post_type: postType,
      title: document.getElementById('postTitle').value,
      content: document.getElementById('postContent').value,
      content_html: document.getElementById('postContent').value, // Can be enhanced with rich text editor
      tags: parseTags(document.getElementById('postTags').value),
      category: document.getElementById('postCategory').value || null,
      visibility: document.getElementById('postVisibility').value,
      status: 'published',
      published_at: new Date().toISOString()
    };

    // Add buyer preferences for non-merchants (product posts)
    if (authorType === 'user' && postType === 'product') {
      const minBudget = document.getElementById('minBudget').value;
      const maxBudget = document.getElementById('maxBudget').value;
      const preferredLocation = document.getElementById('preferredLocation').value;
      
      if (minBudget || maxBudget || preferredLocation) {
        postData.metadata = {
          buyer_preferences: {
            min_budget: minBudget ? parseFloat(minBudget) : null,
            max_budget: maxBudget ? parseFloat(maxBudget) : null,
            preferred_location: preferredLocation || null
          }
        };
      }
    }

    // Upload images if any
    const imageFiles = document.getElementById('postImages').files;
    if (imageFiles.length > 0) {
      const imageUrls = await uploadImages(imageFiles);
      postData.images = imageUrls;
    }

    // Create post
    const { data: post, error } = await supabase
      .from('posts')
      .insert([postData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Link to listing if provided
    const listingLink = document.getElementById('listingLink').value;
    if (listingLink && postData.post_type === 'product') {
      const listingId = extractListingId(listingLink);
      if (listingId) {
        await supabase
          .from('post_listings')
          .insert([{
            post_id: post.id,
            listing_id: listingId
          }]);
      }
    }

    // Success message based on user type
    const isMerchant = authorType === 'merchant';
    const successMsg = isMerchant 
      ? '✅ Post published successfully!'
      : '✅ Your "Want to Buy" post has been published! Merchants will see it and can contact you.';
    
    statusMessage.innerHTML = `<div class="alert alert-success"><i class="bi bi-check-circle-fill"></i> ${successMsg}</div>`;
    
    // Update submit button to show success
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Post Published Successfully!';
      submitBtn.classList.add('btn-success');
      submitBtn.style.background = 'linear-gradient(90deg, #28a745 0%, #20c997 100%)';
    }
    
    // Redirect after 2 seconds
    setTimeout(() => {
      window.location.href = 'profile.html';
    }, 2000);

  } catch (error) {
    console.error('Error creating post:', error);
    statusMessage.innerHTML = `<div class="alert alert-danger"><i class="bi bi-exclamation-triangle"></i> Error: ${error.message}</div>`;
    
    // Reset submit button on error
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Publish Post';
      submitBtn.classList.remove('btn-success');
      submitBtn.style.background = '';
    }
  }
}

/**
 * Upload images to Supabase Storage
 */
async function uploadImages(files) {
  if (!files || files.length === 0) return [];
  
  // Check if Supabase Storage is available
  if (!window.supabaseStorage || !window.supabaseStorage.supabase) {
    const errorMsg = 'Supabase Storage is not initialized. Please:\n1. Check js/supabase-config.js is loaded\n2. Enable Storage in Supabase Dashboard\n3. Refresh this page';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  try {
    console.log(`🚀 Starting upload of ${files.length} files to Supabase Storage...`);
    
    // Generate a unique folder name for this post
    const postId = 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const folder = `posts/${postId}`;
    
    // Upload with progress tracking
    const onProgress = (progress, uploaded, total) => {
      const roundedProgress = Math.round(progress);
      const statusMessage = document.getElementById('statusMessage');
      if (statusMessage) {
        statusMessage.innerHTML = `<div class="alert alert-info">Uploading images... ${roundedProgress}% (${uploaded}/${total})</div>`;
      }
      console.log(`📤 Upload progress: ${roundedProgress}% (${uploaded}/${total})`);
    };
    
    // Upload to Supabase Storage
    const urls = await window.supabaseStorage.uploadImages(
      Array.from(files),
      'listings', // Using listings bucket (can create posts bucket later)
      folder,
      onProgress
    );
    
    console.log(`✅ All ${urls.length} images uploaded successfully!`);
    return urls;
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    let errorMsg = `Upload failed: ${error.message}`;
    
    if (error.message.includes('Bucket not found') || error.message.includes('bucket')) {
      errorMsg = `❌ Storage bucket "listings" not found!\n\nPlease:\n1. Go to Supabase Dashboard → Storage\n2. Click "New bucket"\n3. Name it: "listings"\n4. Set it as Public ✅\n5. Click "Create bucket"\n6. Go to Policies tab and create upload policy\n7. Refresh this page and try again`;
    } else if (error.message.includes('permission') || error.message.includes('policy')) {
      errorMsg += '\n\nPlease check Supabase Storage policies allow uploads. Go to Storage → Policies and create an upload policy.';
    }
    
    throw new Error(errorMsg);
  }
}

/**
 * Parse tags from comma-separated string
 */
function parseTags(tagsString) {
  if (!tagsString) return [];
  return tagsString.split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

/**
 * Extract listing ID from URL or input
 */
function extractListingId(input) {
  // Try to extract UUID from URL or return as-is if it's already a UUID
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const match = input.match(uuidRegex);
  return match ? match[0] : input;
}

/**
 * Get current user ID
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
  
  const userId = localStorage.getItem('userId');
  if (userId) return userId;

  return null;
}

/**
 * Determine if user is merchant or regular user
 */
function getAuthorType() {
  // Check if user is a merchant
  const isMerchant = localStorage.getItem('isMerchant') === 'true';
  return isMerchant ? 'merchant' : 'user';
}

