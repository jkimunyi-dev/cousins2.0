// If API object doesn't exist, create it
if (typeof API === 'undefined') {
    window.API = {
        baseURL: 'http://localhost:3000',
        
        // Make HTTP requests with proper error handling
        makeRequest: async function(endpoint, method = 'GET', data = null) {
            const url = `${this.baseURL}${endpoint}`;
            const token = localStorage.getItem('token');
            
            const config = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            // Add authorization header if token exists
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }

            // Add request body for POST, PUT, PATCH requests
            if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
                config.body = JSON.stringify(data);
            }

            try {
                const response = await fetch(url, config);
                const result = await response.json();

                if (!response.ok) {
                    return {
                        success: false,
                        status: response.status,
                        message: result.message || 'Request failed',
                        data: null
                    };
                }

                return {
                    success: true,
                    status: response.status,
                    message: result.message || 'Success',
                    data: result.data || result
                };
            } catch (error) {
                console.error('API Request failed:', error);
                return {
                    success: false,
                    status: 0,
                    message: 'Network error or server unavailable',
                    data: null
                };
            }
        }
    };
}

// Extend API object with user dashboard specific methods
API.getUserProfile = async function() {
    return this.makeRequest('/users/me', 'GET');
};

API.getUserProject = async function() {
    return this.makeRequest('/projects/my-project', 'GET');
};

API.completeProject = async function(projectId) {
    return this.makeRequest(`/projects/${projectId}/complete`, 'POST');
};

API.updateUserProfile = async function(data) {
    // Get current user ID from token or localStorage
    const userId = this.getCurrentUserId();
    if (!userId) {
        return {
            success: false,
            message: 'User ID not found'
        };
    }
    return this.makeRequest(`/users/${userId}`, 'PATCH', data);
};

API.getCurrentUserId = function() {
    // Try to get user ID from localStorage (should be stored during login)
    const userId = localStorage.getItem('userId');
    if (userId) {
        return userId;
    }

    // If not in localStorage, try to decode from JWT token
    const token = localStorage.getItem('token');
    if (token) {
        try {
            // Simple JWT decode (without verification - only for getting user ID)
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.sub; // 'sub' is typically the user ID in JWT
        } catch (error) {
            console.error('Error decoding token:', error);
        }
    }

    return null;
};

// Authentication methods
API.login = async function(email, password) {
    const response = await this.makeRequest('/auth/login', 'POST', { email, password });
    
    if (response.success && response.data.token) {
        // Store authentication data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', response.data.user.role);
        localStorage.setItem('userEmail', response.data.user.email);
        localStorage.setItem('userName', response.data.user.name);
        localStorage.setItem('userId', response.data.user.id);
    }
    
    return response;
};

API.register = async function(name, email, password) {
    return this.makeRequest('/auth/register', 'POST', { name, email, password });
};

API.logout = function() {
    // Clear all stored authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
};

// Helper method to check if user is authenticated
API.isAuthenticated = function() {
    const token = localStorage.getItem('token');
    if (!token) return false;

    // Basic token expiration check
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        return payload.exp > currentTime;
    } catch (error) {
        return false;
    }
};

// Helper method to get current user role
API.getUserRole = function() {
    return localStorage.getItem('userRole');
};

// Helper method to get current user info
API.getCurrentUser = function() {
    return {
        id: localStorage.getItem('userId'),
        name: localStorage.getItem('userName'),
        email: localStorage.getItem('userEmail'),
        role: localStorage.getItem('userRole')
    };
};

class API {
    constructor() {
        this.baseURL = 'http://localhost:3000';
        this.token = localStorage.getItem('token');
    }

    setAuthToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    async makeRequest(endpoint, method = 'GET', body = null) {
        const url = `${this.baseURL}${endpoint}`;
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        // Add authorization header if token exists
        if (this.token) {
            options.headers['Authorization'] = `Bearer ${this.token}`;
        }

        // Add body for POST/PUT/PATCH requests
        if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
            options.body = JSON.stringify(body);
        }

        try {
            console.log(`Making ${method} request to ${url}`, { body, headers: options.headers });
            
            const response = await fetch(url, options);
            const data = await response.json();

            console.log(`Response from ${endpoint}:`, { status: response.status, data });

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            return { success: true, data, status: response.status };
        } catch (error) {
            console.error(`API Error for ${endpoint}:`, error);
            return { 
                success: false, 
                message: error.message, 
                status: error.status || 500 
            };
        }
    }

    // HTTP Methods
    async get(endpoint) {
        return this.makeRequest(endpoint, 'GET');
    }

    async post(endpoint, data) {
        return this.makeRequest(endpoint, 'POST', data);
    }

    async patch(endpoint, data) {
        return this.makeRequest(endpoint, 'PATCH', data);
    }

    async delete(endpoint) {
        return this.makeRequest(endpoint, 'DELETE');
    }

    // User endpoints
    async getUserProfile() {
        return this.makeRequest('/users/me', 'GET');
    }

    async getUserProject() {
        return this.makeRequest('/projects/my-project', 'GET');
    }

    async completeProject(projectId) {
        return this.makeRequest(`/projects/${projectId}/complete`, 'POST');
    }

    async updateUserProfile(data) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return {
                success: false,
                message: 'User ID not found'
            };
        }
        return this.makeRequest(`/users/${userId}`, 'PATCH', data);
    }

    getCurrentUserId() {
        const userId = localStorage.getItem('userId');
        if (userId) {
            return userId;
        }

        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.sub;
            } catch (error) {
                console.error('Error decoding token:', error);
            }
        }

        return null;
    }

    // Authentication methods
    async login(email, password) {
        const response = await this.makeRequest('/auth/login', 'POST', { email, password });
        
        if (response.success && response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('userRole', response.data.user.role);
            localStorage.setItem('userEmail', response.data.user.email);
            localStorage.setItem('userName', response.data.user.name);
            localStorage.setItem('userId', response.data.user.id);
        }
        
        return response;
    }

    async register(name, email, password) {
        return this.makeRequest('/auth/register', 'POST', { name, email, password });
    }

    logout() {
        // Clear token from instance
        this.token = null;
        
        // Clear all stored authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('userId');
        
        // Optional: Notify server about logout (if you have a logout endpoint)
        // this.makeRequest('/auth/logout', 'POST').catch(() => {
        //     // Ignore errors on logout endpoint
        // });
    }

    // Helper method to logout and redirect
    logoutAndRedirect(redirectUrl = 'login.html') {
        this.logout();
        window.location.href = redirectUrl;
    }

    isAuthenticated() {
        const token = localStorage.getItem('token');
        if (!token) return false;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            return payload.exp > currentTime;
        } catch (error) {
            return false;
        }
    }

    getUserRole() {
        return localStorage.getItem('userRole');
    }

    getCurrentUser() {
        return {
            id: localStorage.getItem('userId'),
            name: localStorage.getItem('userName'),
            email: localStorage.getItem('userEmail'),
            role: localStorage.getItem('userRole')
        };
    }
}

// Create global API instance
const api = new API();