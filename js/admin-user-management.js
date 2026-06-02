/**
 * Admin User Management
 * Allows admins to manage users and reset passwords for support
 */

class AdminUserManagement {
  constructor(supabase) {
    this.supabase = supabase;
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers() {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    try {
      const { data: users, error } = await this.supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return users || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    if (!this.supabase) return null;

    try {
      const { data: user, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  /**
   * Reset user password (admin function)
   * Uses Supabase Admin API to reset password
   */
  async resetUserPassword(userId, newPassword = null) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    // Generate random password if not provided
    if (!newPassword) {
      newPassword = this.generateRandomPassword();
    }

    try {
      // Get user email first
      const user = await this.getUserById(userId);
      if (!user || !user.email) {
        throw new Error('User not found');
      }

      // Use Supabase Auth Admin API to update password
      // Note: This requires service_role key (server-side only)
      // For client-side, we'll use password reset email instead
      
      // Send password reset email
      const { data, error } = await this.supabase.auth.resetPasswordForEmail(
        user.email,
        {
          redirectTo: `${window.location.origin}/signin.html?reset=true`
        }
      );

      if (error) throw error;

      // Store temporary password in users table (encrypted) for admin reference
      // This is optional - only if you want admins to see temporary passwords
      await this.supabase
        .from('users')
        .update({
          temp_password: this.encryptPassword(newPassword), // Store encrypted
          temp_password_expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      return {
        success: true,
        message: 'Password reset email sent',
        tempPassword: newPassword, // Return for admin display
        expiresIn: '24 hours'
      };
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  /**
   * Generate random password
   */
  generateRandomPassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  /**
   * Simple encryption (for temporary password storage)
   * Note: This is basic encryption - use proper encryption in production
   */
  encryptPassword(password) {
    // Simple base64 encoding (not secure - use proper encryption in production)
    // In production, use crypto-js or similar library
    return btoa(password);
  }

  /**
   * Decrypt password (for admin viewing)
   */
  decryptPassword(encryptedPassword) {
    try {
      return atob(encryptedPassword);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get temporary password for user (if exists and not expired)
   */
  async getTempPassword(userId) {
    const user = await this.getUserById(userId);
    if (!user || !user.temp_password) {
      return null;
    }

    // Check if expired
    if (user.temp_password_expires) {
      const expiresAt = new Date(user.temp_password_expires);
      if (expiresAt < new Date()) {
        return null; // Expired
      }
    }

    return {
      password: this.decryptPassword(user.temp_password),
      expiresAt: user.temp_password_expires
    };
  }

  /**
   * Update user role
   */
  async updateUserRole(userId, newRole) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    try {
      const { data, error } = await this.supabase
        .from('users')
        .update({
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(userId) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    try {
      // Soft delete - mark as deleted
      const { data, error } = await this.supabase
        .from('users')
        .update({
          deleted: true,
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

// Make available globally
window.AdminUserManagement = AdminUserManagement;

