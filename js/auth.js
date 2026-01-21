/**
 * HOME AFRICA - Authentication System
 * Unified authentication management using Supabase Auth
 */

class HomeAfricaAuth {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.currentSession = null;
    this.init();
  }

  async init() {
    // Wait for Supabase to be available
    if (window.supabaseClient) {
      this.supabase = window.supabaseClient;
      this.setupAuthListener();
    } else {
      // Wait for Supabase to load
      const checkInterval = setInterval(() => {
        if (window.supabaseClient) {
          this.supabase = window.supabaseClient;
          this.setupAuthListener();
          clearInterval(checkInterval);
        }
      }, 100);
    }
  }

  setupAuthListener() {
    if (!this.supabase) return;

    // Listen for auth state changes
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      this.currentSession = session;
      this.currentUser = session?.user || null;
      
      if (session?.user) {
        await this.syncUserToDatabase(session.user);
        this.updateUIForLoggedInUser(session.user);
      } else {
        this.updateUIForLoggedOutUser();
      }
    });

    // Check current session
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        this.currentSession = session;
        this.currentUser = session.user;
        this.syncUserToDatabase(session.user);
        this.updateUIForLoggedInUser(session.user);
      }
    });
  }

  async syncUserToDatabase(supabaseUser) {
    if (!this.supabase || !supabaseUser) return;

    try {
      // Check if user exists in database
      const { data: existingUser, error: checkError } = await this.supabase
        .from('users')
        .select('id, role')
        .eq('id', supabaseUser.id)
        .single();

      if (checkError && checkError.code === 'PGRST116') {
        // User doesn't exist, create them
        const { data: newUser, error: createError } = await this.supabase
          .from('users')
          .insert([{
            id: supabaseUser.id,
            email: supabaseUser.email,
            full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
            role: supabaseUser.user_metadata?.role || 'user',
            created_at: supabaseUser.created_at || new Date().toISOString()
          }])
          .select()
          .single();

        if (createError) {
          console.error('Error creating user in database:', createError);
        } else {
          console.log('✅ User synced to database:', newUser);
        }
      } else if (existingUser) {
        // User exists, update last login
        const isMerchant = localStorage.getItem('merchantRegistered') === 'true' || 
                          localStorage.getItem('isMerchant') === 'true';
        
        const updateData = { last_login: new Date().toISOString() };
        
        // If user has merchant account, ensure role is merchant
        if (isMerchant && existingUser.role !== 'merchant') {
          updateData.role = 'merchant';
        }
        
        await this.supabase
          .from('users')
          .update(updateData)
          .eq('id', supabaseUser.id);
      }
    } catch (error) {
      console.error('Error syncing user to database:', error);
    }
  }

  async signInWithEmail(email, password) {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) throw error;
      
      this.currentSession = data.session;
      this.currentUser = data.user;
      await this.syncUserToDatabase(data.user);
      return data.user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signOut() {
    if (!this.supabase) {
      // Fallback: clear localStorage
      localStorage.removeItem('merchantRegistered');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('isMerchant');
      window.location.href = 'index.html';
      return;
    }

    try {
      await this.supabase.auth.signOut();
      this.currentUser = null;
      this.currentSession = null;
      localStorage.removeItem('merchantRegistered');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('isMerchant');
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Sign out error:', error);
      // Force logout even if error
      this.currentUser = null;
      this.currentSession = null;
      localStorage.removeItem('merchantRegistered');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('isMerchant');
      window.location.href = 'index.html';
    }
  }

  isAuthenticated() {
    return this.currentUser !== null && this.currentSession !== null;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getCurrentSession() {
    return this.currentSession;
  }

  getCurrentUserId() {
    return this.currentUser?.id || null;
  }

  getCurrentUserEmail() {
    return this.currentUser?.email || null;
  }

  updateUIForLoggedInUser(user) {
    // Update navbar with user info
    const userNavItems = document.querySelectorAll('.user-nav-item');
    userNavItems.forEach(item => {
      item.style.display = 'block';
    });

    const guestNavItems = document.querySelectorAll('.guest-nav-item');
    guestNavItems.forEach(item => {
      item.style.display = 'none';
    });

    // Update user display name
    const userDisplayElements = document.querySelectorAll('.user-display-name');
    userDisplayElements.forEach(el => {
      el.textContent = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    });

    // Update user email
    const userEmailElements = document.querySelectorAll('.user-email');
    userEmailElements.forEach(el => {
      el.textContent = user.email || '';
    });
  }

  updateUIForLoggedOutUser() {
    const userNavItems = document.querySelectorAll('.user-nav-item');
    userNavItems.forEach(item => {
      item.style.display = 'none';
    });

    const guestNavItems = document.querySelectorAll('.guest-nav-item');
    guestNavItems.forEach(item => {
      item.style.display = 'block';
    });
  }

  requireAuth(redirectTo = 'signin.html') {
    if (!this.isAuthenticated()) {
      const currentPath = window.location.pathname;
      window.location.href = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
      return false;
    }
    return true;
  }
}

// Initialize global auth instance
window.homeAfricaAuth = new HomeAfricaAuth();

