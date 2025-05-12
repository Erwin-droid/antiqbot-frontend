// API service voor AntiqBot
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  // Helper method to get headers with authentication
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Helper method for file uploads
  getFileHeaders() {
    const headers = {};

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic API call method
  async apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(credentials) {
    const response = await this.apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.token) {
      this.token = response.token;
      this.user = response.user;
      localStorage.setItem('token', this.token);
      localStorage.setItem('user', JSON.stringify(this.user));
    }

    return response;
  }

  async register(userData) {
    const response = await this.apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.token) {
      this.token = response.token;
      this.user = response.user;
      localStorage.setItem('token', this.token);
      localStorage.setItem('user', JSON.stringify(this.user));
    }

    return response;
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // User methods
  getToken() {
    return this.token;
  }

  getUser() {
    return this.user;
  }

  async getUserProfile() {
    return await this.apiCall('/user/profile');
  }

  async updateUserProfile(profileData) {
    return await this.apiCall('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Credits methods
  async getCredits() {
    return await this.apiCall('/user/credits');
  }

  async purchaseCredits(packageId) {
    return await this.apiCall('/user/credits/purchase', {
      method: 'POST',
      body: JSON.stringify({ packageId }),
    });
  }

  // Image analysis methods
  async analyzeImage(imageFile, comment = '') {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('comment', comment);

    const response = await fetch(`${API_BASE_URL}/analyze/image`, {
      method: 'POST',
      headers: this.getFileHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  // Analysis history methods
  async getAnalysisHistory() {
    return await this.apiCall('/analysis/history');
  }

  async getAnalysisById(analysisId) {
    return await this.apiCall(`/analysis/${analysisId}`);
  }

  async deleteAnalysis(analysisId) {
    return await this.apiCall(`/analysis/${analysisId}`, {
      method: 'DELETE',
    });
  }

  // Subscription/Package methods
  async getAvailablePackages() {
    return await this.apiCall('/packages');
  }

  async getUserSubscription() {
    return await this.apiCall('/user/subscription');
  }

  // Password reset methods
  async requestPasswordReset(email) {
    return await this.apiCall('/auth/password-reset-request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(resetToken, newPassword) {
    return await this.apiCall('/auth/password-reset', {
      method: 'POST',
      body: JSON.stringify({ resetToken, newPassword }),
    });
  }

  // Email verification methods
  async requestEmailVerification() {
    return await this.apiCall('/auth/verify-email-request', {
      method: 'POST',
    });
  }

  async verifyEmail(verificationToken) {
    return await this.apiCall('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ verificationToken }),
    });
  }

  // Feedback and support methods
  async submitFeedback(feedbackData) {
    return await this.apiCall('/feedback', {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    });
  }

  async contactSupport(supportData) {
    return await this.apiCall('/support/contact', {
      method: 'POST',
      body: JSON.stringify(supportData),
    });
  }

  // Admin methods (if applicable)
  async getUserStatistics() {
    return await this.apiCall('/admin/users/statistics');
  }

  async getAnalysisStatistics() {
    return await this.apiCall('/admin/analysis/statistics');
  }
}

// Export a singleton instance
const apiService = new ApiService();
export default apiService;