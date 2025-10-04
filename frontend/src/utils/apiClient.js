const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    // Handle FormData (for file uploads)
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    } else if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized
      if (response.status === 401) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Access denied. Please log in again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 
                           errorData.error || 
                           `HTTP Error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      console.error('API Request failed:', error);
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      throw error;
    }
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
      ...options,
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data,
      ...options,
    });
  }

  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data,
      ...options,
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }

  // Utility method to check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return !!token;
  }

  // Method to set token (useful for login)
  setToken(token, remember = false) {
    if (remember) {
      localStorage.setItem('token', token);
    } else {
      sessionStorage.setItem('token', token);
    }
  }

  // Method to clear token (useful for logout)
  clearToken() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  }
}

const apiClient = new ApiClient();
export default apiClient;
