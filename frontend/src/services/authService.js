import { API_CONFIG, STORAGE_KEYS } from '../constants/appConfig';

class AuthService {
  /**
   * Đăng nhập người dùng
   */
  static async login(username, password) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng nhập thất bại');
      }

      if (data.success && data.data) {
        // Lưu thông tin vào localStorage
        localStorage.setItem(STORAGE_KEYS.TOKEN, data.data.token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.data.user));
        
        if (data.data.refreshToken) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.data.refreshToken);
        }

        return {
          success: true,
          data: data.data,
          message: data.message
        };
      }

      throw new Error(data.message || 'Đăng nhập thất bại');
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Không thể kết nối đến server');
    }
  }

  /**
   * Đăng xuất người dùng
   */
  static async logout() {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      
      if (token) {
        // Gọi API logout
        await fetch(`${API_CONFIG.BASE_URL}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Không throw error để đảm bảo logout local luôn thành công
    } finally {
      // Xóa thông tin local
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    }
  }

  /**
   * Lấy thông tin user hiện tại
   */
  static getCurrentUser() {
    try {
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Kiểm tra trạng thái đăng nhập
   */
  static isAuthenticated() {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  /**
   * Lấy token
   */
  static getToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  /**
   * Refresh token
   */
  static async refreshToken() {
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken) {
        throw new Error('Không có refresh token');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Refresh token thất bại');
      }

      if (data.success && data.data) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, data.data.token);
        return data.data.token;
      }

      throw new Error(data.message || 'Refresh token thất bại');
    } catch (error) {
      console.error('Refresh token error:', error);
      // Nếu refresh thất bại, logout user
      this.logout();
      throw error;
    }
  }

  /**
   * Verify token
   */
  static async verifyToken() {
    try {
      const token = this.getToken();
      
      if (!token) {
        return false;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/verify-token`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Verify token error:', error);
      return false;
    }
  }
}

export default AuthService;
