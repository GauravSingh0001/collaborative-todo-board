// src/services/authService.js
import apiService from './apiService';

class AuthService {
  constructor() {
    this.tokenKey = 'token';
    this.userKey = 'user';
  }

  async login(credentials) {
    try {
      const response = await apiService.post('/auth/login', credentials);
      
      if (response.token && response.user) {
        localStorage.setItem(this.tokenKey, response.token);
        localStorage.setItem(this.userKey, JSON.stringify(response.user));
        return response;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  }

  async register(userData) {
    try {
      const response = await apiService.post('/auth/register', userData);
      
      if (response.token && response.user) {
        localStorage.setItem(this.tokenKey, response.token);
        localStorage.setItem(this.userKey, JSON.stringify(response.user));
        return response;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      throw new Error(error.message || 'Registration failed');
    }
  }

  async logout() {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
  }

  async getCurrentUser() {
    try {
      const response = await apiService.get('/auth/me');
      localStorage.setItem(this.userKey, JSON.stringify(response));
      return response;
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  getUser() {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  isTokenExpired() {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }
}

export default new AuthService();