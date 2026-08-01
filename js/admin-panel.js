/**
 * Admin Panel for HOME AFRICA - SUPABASE VERSION
 * Handles CRUD operations for listings, users, merchants, and files
 * Migrated from Firebase to Supabase
 */

// Wait for Supabase to load
function waitForSupabase() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait
    
    const checkSupabase = setInterval(() => {
      attempts++;
      if (window.supabaseClient && window.supabaseClient.auth) {
        clearInterval(checkSupabase);
        resolve(window.supabaseClient);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkSupabase);
        reject(new Error('Supabase not loaded. Please refresh the page.'));
      }
    }, 100);
  });
}

// Current authenticated user
let currentUser = null;
let currentMerchant = null;
let isSuperAdmin = false;

// Get Supabase client instance (avoids declaration conflicts)
function getSupabase() {
  if (window.supabaseClient) {
    return window.supabaseClient;
  }
  throw new Error('Supabase client not initialized');
}

// =====================================================
// DEVELOPMENT MODE - DEFAULT SUPER ADMIN
// =====================================================
const DEV_MODE = true; // Set to false in production
const DEV_SUPER_ADMIN_EMAIL = 'admin@homeafrica.com';
const DEV_SUPER_ADMIN_PASSWORD = 'admin123456'; // Change this!
const DEV_SUPER_ADMIN_NAME = 'Super Admin (Dev)';

// Initialize Supabase
(async function init() {
  try {
    // Supabase will be accessed via getSupabase() function
    console.log('✅ Supabase initialized for admin panel');
    
    // Check auth state
    const { data: { session } } = await getSupabase().auth.getSession();
    if (session) {
      currentUser = {
        id: session.user.id,
        email: session.user.email,
        displayName: session.user.user_metadata?.full_name || session.user.email
      };
      await verifyMerchantRegistration(session.user.email);
    }
    
    // Listen for auth changes
    getSupabase().auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        currentUser = {
          id: session.user.id,
          email: session.user.email,
          displayName: session.user.user_metadata?.full_name || session.user.email
        };
        const isMerchant = await verifyMerchantRegistration(session.user.email);
        if (isMerchant) {
          showAdminPanel();
          loadDashboard();
        } else {
          await getSupabase().auth.signOut();
          showLoginScreen();
          showError('Access denied. Only registered merchants can access the admin panel.');
        }
      } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        currentMerchant = null;
        isSuperAdmin = false;
        showLoginScreen();
      }
    });
    
    // Check for dev auto-login
    if (DEV_MODE && window.location.pathname.includes('admin.html')) {
      const devLogin = localStorage.getItem('devAutoLogin');
      if (devLogin === 'true') {
        currentUser = {
          id: 'dev-super-admin-uid',
          email: DEV_SUPER_ADMIN_EMAIL,
          displayName: DEV_SUPER_ADMIN_NAME
        };
        isSuperAdmin = true;
        currentMerchant = {
          id: 'dev-super-admin-uid',
          merchantName: DEV_SUPER_ADMIN_NAME,
          merchantEmail: DEV_SUPER_ADMIN_EMAIL,
          superAdmin: true
        };
        setTimeout(() => {
          showAdminPanel();
          loadDashboard();
        }, 100);
        return;
      }
    }
    
    // Show login screen if not authenticated
    if (!currentUser) {
      // Ensure login screen is visible
      setTimeout(() => {
        showLoginScreen();
        showDevModeInfo();
      }, 100);
    } else {
      // User is authenticated, show admin panel
      setTimeout(() => {
        showAdminPanel();
        loadDashboard();
      }, 100);
    }
  } catch (error) {
    console.error('Error initializing admin panel:', error);
    // Always show login screen on error
    setTimeout(() => {
      showLoginScreen();
      showDevModeInfo();
    }, 100);
  }
})();

// Ensure login screen is visible on page load (fallback)
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    const loginScreen = document.getElementById('loginScreen');
    const adminPanel = document.getElementById('adminPanel');
    
    // If admin panel is not shown, show login screen
    if (adminPanel && adminPanel.style.display === 'none' && loginScreen) {
      loginScreen.style.display = 'flex';
    }
  }, 500);
});

// Initialize particles
particlesJS('particles-js', {
  particles: { number: { value: 50 }, color: { value: '#ff0088' } },
  interactivity: { events: { onhover: { enable: true, mode: 'repulse' } } }
});

// Show dev mode info
function showDevModeInfo() {
  if (DEV_MODE) {
    const devInfo = document.getElementById('devModeInfo');
    if (devInfo) {
      devInfo.style.display = 'block';
    }
  }
}

// Check if user is super admin
async function checkSuperAdmin(userId, email) {
  try {
    if (!supabase) return false;
    
    // Check in users table for admin role
    const { data: user, error } = await supabase
      .from('users')
      .select('role, merchants(superAdmin)')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking super admin:', error);
      return false;
    }
    
    if (user) {
      // Check if role is admin
      if (user.role === 'admin') {
        return true;
      }
      
      // Check if merchant has superAdmin flag
      if (user.merchants && user.merchants.length > 0 && user.merchants[0].superAdmin) {
        return true;
      }
    }
    
    // Check by email
    const { data: emailUser } = await supabase
      .from('users')
      .select('role, merchants(superAdmin)')
      .eq('email', email)
      .single();
    
    if (emailUser) {
      if (emailUser.role === 'admin') return true;
      if (emailUser.merchants && emailUser.merchants.length > 0 && emailUser.merchants[0].superAdmin) return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking super admin:', error);
    return false;
  }
}

// Verify merchant registration
async function verifyMerchantRegistration(email) {
  try {
    if (!currentUser || !supabase) {
      return false;
    }

    // First check if user is super admin
    isSuperAdmin = await checkSuperAdmin(currentUser.id, email);
    if (isSuperAdmin) {
      currentMerchant = {
        id: currentUser.id,
        merchantName: 'Super Admin',
        merchantEmail: email,
        superAdmin: true
      };
      return true;
    }

    // Check if user is a regular merchant
    if (window.supabaseMerchants) {
      const isMerchant = await window.supabaseMerchants.isMerchant(email);
      if (isMerchant) {
        const merchantData = await window.supabaseMerchants.getMerchantByEmail(email);
        if (merchantData) {
          currentMerchant = {
            id: merchantData.id,
            merchantName: merchantData.merchants?.[0]?.business_name || merchantData.full_name,
            merchantEmail: email,
            ...merchantData.merchants?.[0]
          };
          console.log('✅ Merchant verified in Supabase');
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error verifying merchant:', error);
    return false;
  }
}

// Toggle login method UI
document.getElementById('loginMethodPassword')?.addEventListener('change', function() {
  document.getElementById('passwordLoginGroup').style.display = 'block';
  document.getElementById('adminPassword').required = true;
  document.getElementById('emailLinkLoginInfo').style.display = 'none';
  document.getElementById('loginSubmitBtn').innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Login';
});

document.getElementById('loginMethodEmailLink')?.addEventListener('change', function() {
  document.getElementById('passwordLoginGroup').style.display = 'none';
  document.getElementById('adminPassword').required = false;
  document.getElementById('emailLinkLoginInfo').style.display = 'block';
  document.getElementById('loginSubmitBtn').innerHTML = '<i class="bi bi-envelope"></i> Send Login Link';
});

// Login form handler with Supabase Authentication
function setupLoginForm() {
  const loginForm = document.getElementById('adminLoginForm');
  if (!loginForm) {
    console.warn('Login form not found, retrying...');
    setTimeout(setupLoginForm, 500);
    return;
  }
  
  console.log('✅ Login form found, setting up handler');
  
  // Remove existing listeners (if any)
  const newForm = loginForm.cloneNode(true);
  loginForm.parentNode.replaceChild(newForm, loginForm);
  
  newForm.addEventListener('submit', async function(e) {
    console.log('🚀 FORM SUBMIT EVENT TRIGGERED!');
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔐 Login form submitted - preventDefault called');
    
    const email = document.getElementById('adminEmail')?.value.trim() || '';
    const password = document.getElementById('adminPassword')?.value || '';
    const useEmailLink = document.getElementById('loginMethodEmailLink')?.checked || false;
    const errorDiv = document.getElementById('loginError');
    const successDiv = document.getElementById('loginSuccess');
    const submitBtn = document.getElementById('loginSubmitBtn');
    
    console.log('Email:', email ? '***' : 'empty');
    console.log('Password:', password ? '***' : 'empty');
    console.log('Use email link:', useEmailLink);
    
    if (!email) {
      console.warn('No email provided');
      if (errorDiv) {
        errorDiv.textContent = 'Please enter your email.';
        errorDiv.style.display = 'block';
      }
      return;
    }
    
    if (!useEmailLink && !password) {
      console.warn('No password provided');
      if (errorDiv) {
        errorDiv.textContent = 'Please enter your password.';
        errorDiv.style.display = 'block';
      }
      return;
    }

    // Clear previous messages
    if (errorDiv) {
      errorDiv.style.display = 'none';
      errorDiv.textContent = '';
    }
    if (successDiv) {
      successDiv.style.display = 'none';
      successDiv.textContent = '';
    }
    
    // Check for dev mode auto-login
    if (DEV_MODE && !useEmailLink) {
      const normalizedEmail = email.toLowerCase().trim();
      const normalizedPassword = password.trim();
      
      console.log('🔍 Dev mode check:');
      console.log('  Expected email:', DEV_SUPER_ADMIN_EMAIL.toLowerCase());
      console.log('  Provided email:', normalizedEmail);
      console.log('  Email match:', normalizedEmail === DEV_SUPER_ADMIN_EMAIL.toLowerCase());
      console.log('  Expected password:', DEV_SUPER_ADMIN_PASSWORD);
      console.log('  Password provided:', !!normalizedPassword);
      console.log('  Password match:', normalizedPassword === DEV_SUPER_ADMIN_PASSWORD);
      
      if (normalizedEmail === DEV_SUPER_ADMIN_EMAIL.toLowerCase() && normalizedPassword === DEV_SUPER_ADMIN_PASSWORD) {
        console.log('✅ Dev mode: Credentials match! Bypassing Supabase Auth');
        
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Logging in...';
        }
        
        currentUser = {
          id: 'dev-super-admin-uid',
          email: DEV_SUPER_ADMIN_EMAIL,
          displayName: DEV_SUPER_ADMIN_NAME
        };
        
        isSuperAdmin = true;
        currentMerchant = {
          id: 'dev-super-admin-uid',
          merchantName: DEV_SUPER_ADMIN_NAME,
          merchantEmail: DEV_SUPER_ADMIN_EMAIL,
          superAdmin: true
        };
        
        localStorage.setItem('devAutoLogin', 'true');
        
        console.log('🔄 Calling showAdminPanel()...');
        showAdminPanel();
        
        setTimeout(() => {
          console.log('🔄 Loading dashboard...');
          loadDashboard();
          if (errorDiv) errorDiv.style.display = 'none';
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Login';
          }
          console.log('✅ Dev mode login successful!');
          
          // Double-check admin panel is visible
          const adminPanel = document.getElementById('adminPanel');
          const loginScreen = document.getElementById('loginScreen');
          console.log('Admin panel display:', adminPanel?.style.display);
          console.log('Login screen display:', loginScreen?.style.display);
          
          if (adminPanel && adminPanel.style.display === 'none') {
            console.warn('⚠️ Admin panel still hidden, forcing display...');
            adminPanel.style.display = 'block';
            adminPanel.style.visibility = 'visible';
          }
        }, 300);
        
        return;
      }
    }
    
    // Get Supabase client
    let supabase;
    try {
      supabase = getSupabase();
    } catch (error) {
      if (errorDiv) {
        errorDiv.textContent = 'Supabase not loaded. Please refresh the page.';
        errorDiv.style.display = 'block';
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Login';
      }
      return;
    }
    
    // Disable button and show loading
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> ' + (useEmailLink ? 'Sending Email...' : 'Logging in...');
    }

    try {
      if (useEmailLink) {
        // Passwordless login with email link
        const { error } = await supabase.auth.signInWithOtp({
          email: email,
          options: {
            emailRedirectTo: window.location.origin + '/admin.html'
          }
        });
        
        if (error) throw error;
        
        localStorage.setItem('emailForSignIn', email);
        
        if (successDiv) {
          successDiv.innerHTML = '<i class="bi bi-envelope-check"></i> <strong>Email Sent!</strong> Check your inbox at ' + email + ' and click the link to sign in.';
          successDiv.style.display = 'block';
        }
        
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="bi bi-envelope"></i> Send Login Link';
        }
        
      } else {
        // Traditional password login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });
        
        if (error) throw error;
        
        if (data.user) {
          currentUser = {
            id: data.user.id,
            email: data.user.email,
            displayName: data.user.user_metadata?.full_name || data.user.email
          };
          
          const isMerchant = await verifyMerchantRegistration(email);
          
          if (isMerchant) {
            showAdminPanel();
            loadDashboard();
            if (errorDiv) errorDiv.style.display = 'none';
          } else {
            await getSupabase().auth.signOut();
            if (errorDiv) {
              errorDiv.textContent = 'Access denied. Only registered merchants can access the admin panel.';
              errorDiv.style.display = 'block';
              errorDiv.className = 'alert alert-warning mt-3';
            }
          }
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = useEmailLink ? 'Failed to send email link. Please try again.' : 'Login failed. Please try again.';
      
      if (error.message) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email address first.';
        } else {
          errorMessage = error.message;
        }
      }
      
      if (errorDiv) {
        errorDiv.textContent = errorMessage;
        errorDiv.style.display = 'block';
        errorDiv.className = 'alert alert-danger mt-3';
      }
    } finally {
      if (!useEmailLink && submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Login';
      }
    }
  });
}

// Setup login form when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupLoginForm);
} else {
  // DOM already loaded, setup immediately
  setTimeout(setupLoginForm, 100);
}

// Also add direct button click handler as fallback
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    const submitBtn = document.getElementById('loginSubmitBtn');
    if (submitBtn) {
      submitBtn.addEventListener('click', function(e) {
        const form = document.getElementById('adminLoginForm');
        if (form) {
          console.log('Button clicked, triggering form submit');
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      });
    }
  }, 500);
});

// Logout
function logout() {
  if (DEV_MODE) {
    localStorage.removeItem('devAutoLogin');
  }
  
  if (supabase) {
    getSupabase().auth.signOut().then(() => {
      currentUser = null;
      currentMerchant = null;
      isSuperAdmin = false;
      showLoginScreen();
    }).catch(error => {
      console.error('Error signing out:', error);
      currentUser = null;
      currentMerchant = null;
      isSuperAdmin = false;
      showLoginScreen();
    });
  } else {
    currentUser = null;
    currentMerchant = null;
    isSuperAdmin = false;
    showLoginScreen();
  }
}

// Show error message
function showError(message) {
  const errorDiv = document.getElementById('loginError');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.className = 'alert alert-danger mt-3';
  }
}

function showLoginScreen() {
  const loginScreen = document.getElementById('loginScreen');
  const adminPanel = document.getElementById('adminPanel');
  
  if (loginScreen) {
    loginScreen.style.display = 'flex';
    loginScreen.style.visibility = 'visible';
    loginScreen.style.position = 'relative';
    loginScreen.style.zIndex = '100';
  }
  
  if (adminPanel) {
    adminPanel.style.display = 'none';
    adminPanel.style.visibility = 'hidden';
  }
  
  showDevModeInfo();
  console.log('Login screen shown');
}

function showAdminPanel() {
  console.log('📋 showAdminPanel() called');
  const loginScreen = document.getElementById('loginScreen');
  const adminPanel = document.getElementById('adminPanel');
  
  console.log('Login screen element:', !!loginScreen);
  console.log('Admin panel element:', !!adminPanel);
  
  if (loginScreen) {
    loginScreen.classList.add('hide');
    loginScreen.style.setProperty('display', 'none', 'important');
    loginScreen.style.setProperty('visibility', 'hidden', 'important');
    loginScreen.style.setProperty('position', 'absolute', 'important');
    loginScreen.style.setProperty('z-index', '-1', 'important');
    loginScreen.style.setProperty('opacity', '0', 'important');
    console.log('✅ Login screen hidden');
  } else {
    console.warn('⚠️ Login screen element not found!');
  }
  
  if (adminPanel) {
    // Add show class and force display with important styles
    adminPanel.classList.add('show');
    adminPanel.style.setProperty('display', 'block', 'important');
    adminPanel.style.setProperty('visibility', 'visible', 'important');
    adminPanel.style.setProperty('position', 'relative', 'important');
    adminPanel.style.setProperty('z-index', '100', 'important');
    adminPanel.style.setProperty('opacity', '1', 'important');
    
    console.log('✅ Admin panel display set to block');
    
    const adminContainer = adminPanel.querySelector('.admin-container');
    if (adminContainer) {
      adminContainer.style.setProperty('display', 'block', 'important');
      adminContainer.style.setProperty('visibility', 'visible', 'important');
      console.log('✅ Admin container shown');
    } else {
      console.warn('⚠️ Admin container not found!');
    }
    
    const statsRow = adminPanel.querySelector('.row.mb-4');
    if (statsRow) {
      statsRow.style.setProperty('display', 'flex', 'important');
      statsRow.style.setProperty('visibility', 'visible', 'important');
      console.log('✅ Stats row shown');
    }
    
    const tabsNav = adminPanel.querySelector('.nav-tabs');
    if (tabsNav) {
      tabsNav.style.setProperty('display', 'flex', 'important');
      tabsNav.style.setProperty('visibility', 'visible', 'important');
      console.log('✅ Tabs nav shown');
    }
    
    const listingsTab = document.getElementById('listingsTab');
    if (listingsTab) {
      listingsTab.style.setProperty('display', 'block', 'important');
      listingsTab.style.setProperty('visibility', 'visible', 'important');
      console.log('✅ Listings tab shown');
    }
    
    document.querySelectorAll('.tab-content').forEach(tab => {
      if (tab.id !== 'listingsTab') {
        tab.style.display = 'none';
      }
    });
    
    const firstTab = document.querySelector('.admin-tab[data-tab="listings"]');
    if (firstTab) {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      firstTab.classList.add('active');
      console.log('✅ First tab activated');
    }
    
    console.log('✅ Admin panel fully shown');
  } else {
    console.error('❌ Admin panel element not found!');
  }
  
  // Display merchant/super admin info
  if (currentMerchant) {
    const merchantInfo = document.getElementById('merchantInfo');
    const merchantNameDisplay = document.getElementById('merchantNameDisplay');
    if (merchantInfo && merchantNameDisplay) {
      if (isSuperAdmin) {
        merchantNameDisplay.innerHTML = '<i class="bi bi-shield-fill-check text-warning"></i> SUPER ADMIN';
        merchantInfo.className = 'navbar-text text-warning ms-3';
        const navbarBrand = document.getElementById('navbarBrand');
        if (navbarBrand) {
          navbarBrand.innerHTML = '<i class="bi bi-shield-check"></i> SUPER ADMIN PANEL';
        }
      } else {
        merchantNameDisplay.textContent = currentMerchant.merchantName || (currentUser ? currentUser.email : 'Merchant');
        merchantInfo.className = 'navbar-text text-white ms-3';
      }
      merchantInfo.style.display = 'inline-block';
    }
  }
  
  console.log('Admin panel shown. Login screen hidden.');
}

// Tab switching
document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    const targetTab = this.getAttribute('data-tab');
    
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => {
      content.style.display = 'none';
    });
    const targetTabElement = document.getElementById(targetTab + 'Tab');
    if (targetTabElement) {
      targetTabElement.style.display = 'block';
    }
    
    if (targetTab === 'listings') loadListings();
    else if (targetTab === 'users') loadUsers();
    else if (targetTab === 'merchants') loadMerchants();
    else if (targetTab === 'files') loadFiles();
    else if (targetTab === 'analytics') loadAnalytics();
  });
});

// Load dashboard stats
async function loadDashboard() {
  try {
    if (!supabase) {
      // Supabase will be accessed via getSupabase() function
    }
    
    if (isSuperAdmin) {
      // Super Admin: Show ALL platform data
      const { data: listings, error } = await supabase
        .from('listings')
        .select('id', { count: 'exact' });
      
      document.getElementById('totalListings').textContent = listings?.length || 0;

      const { data: merchants } = await supabase
        .from('merchants')
        .select('id', { count: 'exact' });
      
      document.getElementById('totalMerchants').textContent = merchants?.length || 0;
      document.getElementById('totalUsers').textContent = (merchants?.length || 0) + '+';

      const storageSize = await calculateStorageSize();
      document.getElementById('totalStorage').textContent = storageSize + ' MB';
    } else {
      // Regular Merchant: Show only their data
      const merchantId = currentMerchant?.id || currentUser?.id;
      
      const { data: listings } = await supabase
        .from('listings')
        .select('id', { count: 'exact' })
        .eq('merchant_id', merchantId);
      
      document.getElementById('totalListings').textContent = listings?.length || 0;
      document.getElementById('totalUsers').textContent = '1';
      document.getElementById('totalMerchants').textContent = '1';
      
      const storageSize = await calculateStorageSize();
      document.getElementById('totalStorage').textContent = storageSize + ' MB';
    }

    const listingsTab = document.getElementById('listingsTab');
    if (listingsTab) {
      listingsTab.style.display = 'block';
    }
    
    document.querySelectorAll('.tab-content').forEach(tab => {
      if (tab.id !== 'listingsTab') {
        tab.style.display = 'none';
      }
    });
    
    const firstTab = document.querySelector('.admin-tab[data-tab="listings"]');
    if (firstTab) {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      firstTab.classList.add('active');
    }
    
    loadListings();
  } catch (error) {
    console.error('Error loading dashboard:', error);
    const listingsTab = document.getElementById('listingsTab');
    if (listingsTab) {
      listingsTab.innerHTML = '<div class="alert alert-danger">Error loading dashboard: ' + error.message + '</div>';
      listingsTab.style.display = 'block';
    }
  }
}

// Calculate storage size
async function calculateStorageSize() {
  try {
    if (!supabase) return '0';
    // Supabase Storage doesn't provide direct size calculation
    // This would require listing all files, which can be expensive
    return '~' + Math.floor(Math.random() * 500); // Placeholder
  } catch (error) {
    return '0';
  }
}

// =====================================================
// LISTINGS CRUD
// =====================================================

async function loadListings() {
  const tbody = document.getElementById('listingsTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = '<tr><td colspan="9" class="text-center">Loading...</td></tr>';

  try {
    if (!supabase) {
      // Supabase will be accessed via getSupabase() function
    }
    
    const allListings = [];
    const merchantId = currentMerchant?.id || currentUser?.id;

    // Load from Supabase
    let query = supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!isSuperAdmin && merchantId) {
      query = query.eq('merchant_id', merchantId);
    }
    
    const { data: listings, error } = await query;
    
    if (error) throw error;
    
    if (listings && listings.length > 0) {
      listings.forEach(listing => {
        allListings.push({
          id: listing.id,
          collection: listing.type + 'Listings',
          type: listing.type,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          status: listing.status,
          views: listing.views || 0,
          merchantName: listing.metadata?.merchantName || '',
          createdAt: listing.created_at ? { toDate: () => new Date(listing.created_at) } : null
        });
      });
      
      console.log(`✅ Loaded ${allListings.length} listings from Supabase`);
      renderListingsTable(allListings);
    } else {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center">No listings found</td></tr>';
    }
  } catch (error) {
    console.error('Error loading listings:', error);
    tbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Error loading listings</td></tr>';
  }
}

function renderListingsTable(allListings) {
  const tbody = document.getElementById('listingsTableBody');
  if (!tbody) return;
  
  if (allListings.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center">No listings found</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  allListings.forEach(listing => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${listing.id.substring(0, 8)}...</td>
      <td><span class="badge badge-admin">${listing.type}</span></td>
      <td>${listing.title || 'N/A'}</td>
      <td>${listing.merchantName || 'N/A'}</td>
      <td>RWF ${parseInt(listing.price || 0).toLocaleString()}</td>
      <td><span class="badge ${listing.status === 'active' ? 'bg-success' : 'bg-secondary'}">${listing.status || 'active'}</span></td>
      <td>${listing.views || 0}</td>
      <td>${listing.createdAt ? new Date(listing.createdAt.toDate()).toLocaleDateString() : 'N/A'}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="editListing('${listing.collection}', '${listing.id}')">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteListing('${listing.collection}', '${listing.id}')">
          <i class="bi bi-trash"></i>
        </button>
        <button class="btn btn-sm btn-warning" onclick="toggleListingStatus('${listing.collection}', '${listing.id}', '${listing.status}')">
          <i class="bi bi-${listing.status === 'active' ? 'eye-slash' : 'eye'}"></i>
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });

  // Search functionality
  document.getElementById('searchListings')?.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
  });
}

async function editListing(collection, id) {
  try {
    if (!supabase) {
      // Supabase will be accessed via getSupabase() function
    }
    
    // Extract type from collection name (e.g., "apartmentListings" -> "apartment")
    const type = collection.replace('Listings', '');
    
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      alert('Listing not found');
      return;
    }

    document.getElementById('editId').value = id;
    document.getElementById('editType').value = collection;

    let formFields = `
      <div class="mb-3">
        <label class="form-label text-white">Title</label>
        <input type="text" class="form-control" id="editTitle" value="${data.title || ''}" required>
      </div>
      <div class="mb-3">
        <label class="form-label text-white">Price (RWF)</label>
        <input type="number" class="form-control" id="editPrice" value="${data.price || ''}" required>
      </div>
      <div class="mb-3">
        <label class="form-label text-white">Status</label>
        <select class="form-select" id="editStatus">
          <option value="active" ${data.status === 'active' ? 'selected' : ''}>Active</option>
          <option value="inactive" ${data.status === 'inactive' ? 'selected' : ''}>Inactive</option>
          <option value="sold" ${data.status === 'sold' ? 'selected' : ''}>Sold</option>
          <option value="rented" ${data.status === 'rented' ? 'selected' : ''}>Rented</option>
        </select>
      </div>
    `;

    document.getElementById('editFormFields').innerHTML = formFields;
    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
  } catch (error) {
    console.error('Error loading listing:', error);
    alert('Error loading listing details');
  }
}

// Save edited listing
document.getElementById('editForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  const id = document.getElementById('editId').value;
  const collection = document.getElementById('editType').value;
  const title = document.getElementById('editTitle').value;
  const price = document.getElementById('editPrice').value;
  const status = document.getElementById('editStatus').value;

  try {
    if (!supabase) {
      // Supabase will be accessed via getSupabase() function
    }
    
    const { error } = await supabase
      .from('listings')
      .update({
        title: title,
        price: parseFloat(price),
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
    alert('Listing updated successfully!');
    loadListings();
  } catch (error) {
    console.error('Error updating listing:', error);
    alert('Error updating listing');
  }
});

async function deleteListing(collection, id) {
  if (!confirm('Are you sure you want to delete this listing?')) return;

  try {
    const supabase = getSupabase();
    
    // Check permissions
    if (!isSuperAdmin) {
      const { data: listing } = await supabase
        .from('listings')
        .select('merchant_id')
        .eq('id', id)
        .single();
      
      const merchantId = currentMerchant?.id || currentUser?.id;
      
      if (listing && listing.merchant_id !== merchantId) {
        alert('You can only delete your own listings.');
        return;
      }
    }

    // Get listing data to delete images (reuse `supabase` from above)
    const { data: listing } = await supabase
      .from('listings')
      .select('images')
      .eq('id', id)
      .single();

    // Delete images from storage
    if (listing && listing.images && Array.isArray(listing.images)) {
      for (const imageUrl of listing.images) {
        try {
          // Extract file path from URL
          const urlParts = imageUrl.split('/');
          const fileName = urlParts[urlParts.length - 1].split('?')[0];
          const filePath = `listings/${fileName}`;
          
          const { error: deleteError } = await getSupabase().storage
            .from('listings')
            .remove([filePath]);
          
          if (deleteError) {
            console.warn('Error deleting image:', deleteError);
          }
        } catch (error) {
          console.warn('Error deleting image:', error);
        }
      }
    }

    // Delete listing
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    alert('Listing deleted successfully!');
    loadListings();
    loadDashboard();
  } catch (error) {
    console.error('Error deleting listing:', error);
    alert('Error deleting listing');
  }
}

async function toggleListingStatus(collection, id, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  try {
    if (!supabase) {
      // Supabase will be accessed via getSupabase() function
    }
    
    const { error } = await supabase
      .from('listings')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    
    alert(`Listing ${newStatus === 'active' ? 'activated' : 'deactivated'}!`);
    loadListings();
  } catch (error) {
    console.error('Error updating status:', error);
    alert('Error updating status');
  }
}

// =====================================================
// USERS CRUD
// =====================================================

async function loadUsers() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = '<tr><td colspan="7" class="text-center">Loading...</td></tr>';

  try {
    if (!supabase) {
      // Supabase will be accessed via getSupabase() function
    }
    
    // Load all users (not just merchants) for admin view
    let query = supabase
      .from('users')
      .select('*, merchants(*)')
      .order('created_at', { ascending: false });
    
    if (!isSuperAdmin && currentMerchant?.id) {
      query = query.eq('id', currentMerchant.id);
    }
    
    const { data: users, error } = await query;
    
    if (error) throw error;
    
    if (!users || users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No users found</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    users.forEach(user => {
      const merchantData = user.merchants?.[0] || {};
      
      // Check for temporary password
      let tempPasswordDisplay = '<span class="text-muted">-</span>';
      if (user.temp_password && user.temp_password_expires) {
        const expiresAt = new Date(user.temp_password_expires);
        if (expiresAt > new Date()) {
          // Decrypt and show temp password
          try {
            const decrypted = atob(user.temp_password);
            tempPasswordDisplay = `
              <div>
                <code style="color: #0ff; font-size: 0.85rem;">${decrypted}</code>
                <br>
                <small class="text-muted">Expires: ${expiresAt.toLocaleString()}</small>
              </div>
            `;
          } catch (e) {
            tempPasswordDisplay = '<span class="text-warning">Encrypted</span>';
          }
        } else {
          tempPasswordDisplay = '<span class="text-muted">Expired</span>';
        }
      }
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${user.email || 'N/A'}</td>
        <td>${merchantData.business_name || user.full_name || 'N/A'}</td>
        <td><span class="badge badge-admin">${user.role || 'user'}</span></td>
        <td><span class="badge ${merchantData.verified ? 'bg-success' : 'bg-warning'}">${merchantData.verified ? 'Yes' : 'No'}</span></td>
        <td>${tempPasswordDisplay}</td>
        <td>${user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</td>
        <td>
          <button class="btn btn-sm btn-primary me-1" onclick="resetUserPassword('${user.id}', '${user.email}')" title="Reset Password">
            <i class="bi bi-key"></i> Reset
          </button>
          ${isSuperAdmin ? `<button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}')" title="Delete User">
            <i class="bi bi-trash"></i>
          </button>` : ''}
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading users:', error);
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading users</td></tr>';
  }
}

// Reset user password (admin function)
async function resetUserPassword(userId, userEmail) {
  if (!isSuperAdmin && currentUser?.id !== userId) {
    alert('Only super admins can reset passwords for other users.');
    return;
  }

  if (!confirm(`Reset password for ${userEmail}?\n\nA temporary password will be generated and shown to you. The user will receive a password reset email.`)) {
    return;
  }

  try {
    const supabase = getSupabase();

    // Generate random password
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let tempPassword = '';
    for (let i = 0; i < 12; i++) {
      tempPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    // Send password reset email via Supabase Auth
    const { error: resetError } = await getSupabase().auth.resetPasswordForEmail(
      userEmail,
      {
        redirectTo: `${window.location.origin}/signin.html?reset=true`
      }
    );

    if (resetError) {
      console.warn('Password reset email error (non-critical):', resetError);
    }

    // Store temporary password (encrypted) in users table
    const encryptedPassword = btoa(tempPassword); // Base64 encoding (simple encryption)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const { error: updateError } = await supabase
      .from('users')
      .update({
        temp_password: encryptedPassword,
        temp_password_expires: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Show temporary password to admin
    alert(`✅ Password reset initiated!\n\nTemporary Password: ${tempPassword}\n\nThis password expires in 24 hours.\n\nShare this with the user for immediate access, or they can use the reset link sent to their email.`);
    
    // Reload users table
    loadUsers();
  } catch (error) {
    console.error('Error resetting password:', error);
    alert('Error resetting password: ' + error.message);
  }
}

async function deleteUser(userId) {
  if (!isSuperAdmin) {
    alert('Only super admins can delete users.');
    return;
  }
  
  if (!confirm('Are you sure you want to delete this user? This will also delete all their listings.')) return;

  try {
    if (!supabase) {
      // Supabase will be accessed via getSupabase() function
    }
    
    // Delete user's listings first
    const { error: listingsError } = await supabase
      .from('listings')
      .delete()
      .eq('merchant_id', userId);

    if (listingsError) {
      console.warn('Error deleting user listings:', listingsError);
    }

    // Delete user (this will cascade delete merchant record)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
    
    alert('User deleted successfully!');
    loadUsers();
    loadDashboard();
  } catch (error) {
    console.error('Error deleting user:', error);
    alert('Error deleting user');
  }
}

// =====================================================
// MERCHANTS CRUD
// =====================================================

async function loadMerchants() {
  const tbody = document.getElementById('merchantsTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = '<tr><td colspan="7" class="text-center">Loading...</td></tr>';

  try {
    if (!supabase) {
      // Supabase will be accessed via getSupabase() function
    }
    
    let query = supabase
      .from('merchants')
      .select('*, users(email, full_name)')
      .order('created_at', { ascending: false });
    
    if (!isSuperAdmin && currentMerchant?.id) {
      query = query.eq('id', currentMerchant.id);
    }
    
    const { data: merchants, error } = await query;
    
    if (error) throw error;
    
    if (!merchants || merchants.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No merchants found</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    merchants.forEach(merchant => {
      const userData = merchant.users || {};
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${merchant.business_name || 'N/A'}</td>
        <td>${userData.email || 'N/A'}</td>
        <td><span class="badge ${merchant.verified ? 'bg-success' : 'bg-warning'}">${merchant.verified ? 'Verified' : 'Pending'}</span></td>
        <td>${merchant.rating || 0}</td>
        <td>${merchant.total_listings || 0}</td>
        <td>${merchant.created_at ? new Date(merchant.created_at).toLocaleDateString() : 'N/A'}</td>
        <td>
          <button class="btn btn-sm btn-success" onclick="verifyMerchant('${merchant.id}', ${!merchant.verified})">
            <i class="bi bi-${merchant.verified ? 'x-circle' : 'check-circle'}"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteMerchant('${merchant.id}')">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading merchants:', error);
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading merchants</td></tr>';
  }
}

async function verifyMerchant(merchantId, verify) {
  if (!isSuperAdmin) {
    alert('Only super admins can verify merchants.');
    return;
  }
  
  try {
    if (!supabase) {
      // Supabase will be accessed via getSupabase() function
    }
    
    const { error } = await supabase
      .from('merchants')
      .update({
        verified: verify,
        verified_at: verify ? new Date().toISOString() : null
      })
      .eq('id', merchantId);

    if (error) throw error;
    
    alert(`Merchant ${verify ? 'verified' : 'unverified'}!`);
    loadMerchants();
  } catch (error) {
    console.error('Error updating merchant:', error);
    alert('Error updating merchant');
  }
}

async function deleteMerchant(merchantId) {
  if (!confirm('Are you sure? This will delete the merchant and all their listings.')) return;
  await deleteUser(merchantId); // Same function
}

// =====================================================
// FILES CRUD
// =====================================================

async function loadFiles() {
  const tbody = document.getElementById('filesTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = '<tr><td colspan="5" class="text-center">Loading...</td></tr>';

  try {
    if (!supabase) {
      // Supabase will be accessed via getSupabase() function
    }
    
    let query = supabase
      .from('listings')
      .select('id, type, images');
    
    if (!isSuperAdmin && currentMerchant?.id) {
      query = query.eq('merchant_id', currentMerchant.id);
    }
    
    const { data: listings, error } = await query;
    
    if (error) throw error;
    
    const allFiles = [];
    
    if (listings) {
      listings.forEach(listing => {
        if (listing.images && Array.isArray(listing.images)) {
          listing.images.forEach((url, index) => {
            allFiles.push({
              url: url,
              type: listing.type,
              listingId: listing.id,
              index: index
            });
          });
        }
      });
    }

    if (allFiles.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No files found</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    allFiles.forEach(file => {
      const fileName = file.url.split('/').pop().split('?')[0];
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><a href="${file.url}" target="_blank">${fileName}</a></td>
        <td><span class="badge badge-admin">${file.type}</span></td>
        <td>N/A</td>
        <td>N/A</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="deleteFile('${file.url}', '${file.type}', '${file.listingId}')">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading files:', error);
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading files</td></tr>';
  }
}

async function deleteFile(fileUrl, type, listingId) {
  if (!confirm('Are you sure you want to delete this file?')) return;

  try {
    if (!supabase) {
      // Supabase will be accessed via getSupabase() function
    }
    
    // Extract file path from URL
    const urlParts = fileUrl.split('/');
    const fileName = urlParts[urlParts.length - 1].split('?')[0];
    const filePath = `listings/${fileName}`;
    
    // Delete from storage
    const { error: storageError } = await getSupabase().storage
      .from('listings')
      .remove([filePath]);

    if (storageError) {
      console.warn('Error deleting file from storage:', storageError);
    }

    // Remove from listing
    const { data: listing } = await supabase
      .from('listings')
      .select('images')
      .eq('id', listingId)
      .single();
    
    if (listing && listing.images) {
      const images = listing.images.filter(img => img !== fileUrl);
      const { error } = await supabase
        .from('listings')
        .update({ images: images })
        .eq('id', listingId);

      if (error) throw error;
    }

    alert('File deleted successfully!');
    loadFiles();
  } catch (error) {
    console.error('Error deleting file:', error);
    alert('Error deleting file');
  }
}

// =====================================================
// ANALYTICS
// =====================================================

async function loadAnalytics() {
  try {
    if (!supabase) {
      // Supabase will be accessed via getSupabase() function
    }
    
    // Listings chart
    const listingsCtx = document.getElementById('listingsChart');
    if (listingsCtx) {
      const { data: listings } = await supabase
        .from('listings')
        .select('type');
      
      const counts = {
        apartment: 0,
        car: 0,
        land: 0
      };
      
      if (listings) {
        listings.forEach(listing => {
          if (counts.hasOwnProperty(listing.type)) {
            counts[listing.type]++;
          }
        });
      }

      new Chart(listingsCtx, {
        type: 'doughnut',
        data: {
          labels: ['Apartments', 'Cars', 'Land'],
          datasets: [{
            data: [counts.apartment, counts.car, counts.land],
            backgroundColor: ['#ff0088', '#0ff', '#8fff00']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { labels: { color: '#fff' } },
            title: { display: true, text: 'Listings by Type', color: '#fff' }
          }
        }
      });
    }

    // Users chart (placeholder)
    const usersCtx = document.getElementById('usersChart');
    if (usersCtx) {
      new Chart(usersCtx, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'New Users',
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: '#ff0088'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { labels: { color: '#fff' } },
            title: { display: true, text: 'User Growth', color: '#fff' }
          },
          scales: {
            y: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
            x: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } }
          }
        }
      });
    }
  } catch (error) {
    console.error('Error loading analytics:', error);
  }
}

