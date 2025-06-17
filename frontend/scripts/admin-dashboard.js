// Admin Dashboard JavaScript with Backend Integration
const API_BASE_URL = 'http://localhost:3000';

// Global variables
let users = [];
let projects = [];
let filteredUsers = [];
let filteredProjects = [];

// Authentication and token management
const getAuthToken = () => {
    return localStorage.getItem('authToken');
};

const getUserInfo = () => {
    return {
        id: localStorage.getItem('userId'),
        name: localStorage.getItem('userName'),
        email: localStorage.getItem('userEmail'),
        role: localStorage.getItem('userRole')
    };
};

// Utility function to escape HTML
const escapeHtml = (text) => {
    if (typeof text !== 'string') return text;
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
};

// Check authentication on page load
const checkAuthentication = () => {
    const token = getAuthToken();
    const userRole = localStorage.getItem('userRole');
    
    if (!token) {
        showToast('Please login to access the admin dashboard', 'error', 'Authentication Required');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return false;
    }
    
    if (userRole !== 'ADMIN') {
        showToast('Access denied. Administrator privileges required.', 'error', 'Access Denied');
        setTimeout(() => {
            if (userRole === 'USER') {
                window.location.href = 'user-dashboard.html';
            } else {
                window.location.href = 'login.html';
            }
        }, 2000);
        return false;
    }
    
    return true;
};

// API Helper Functions
const apiRequest = async (endpoint, options = {}) => {
    const token = getAuthToken();
    
    if (!token) {
        showToast('Authentication token not found', 'error', 'Authentication Error');
        setTimeout(() => {
            localStorage.clear();
            window.location.href = 'login.html';
        }, 2000);
        return null;
    }
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    const config = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
                showToast('Session expired. Please login again.', 'error', 'Authentication Error');
                setTimeout(() => {
                    localStorage.clear();
                    window.location.href = 'login.html';
                }, 2000);
                return null;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Request failed:', error);
        showToast('API request failed. Please try again.', 'error', 'Error');
        return null;
    }
};

// Create project function
const createProject = async (projectData) => {
    showLoading();
    try {
        const data = await apiRequest('/projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
        
        if (data) {
            // Add the new project to our local array
            projects.push(data);
            filteredProjects = [...projects];
            
            // Re-render the projects table
            renderProjects(filteredProjects);
            updateStats();
            
            // Hide modal and show success message
            hideModal('addProjectModal');
            showToast('Project created successfully!', 'success', 'Project Created');
            
            // Clear the form
            document.getElementById('addProjectForm').reset();
        }
    } catch (error) {
        console.error('Failed to create project:', error);
        showToast('Failed to create project. Please try again.', 'error', 'Creation Failed');
    } finally {
        hideLoading();
    }
};

// Filter users function
const filterUsers = () => {
    const searchTerm = document.getElementById('userSearchInput').value.toLowerCase();
    const statusFilter = document.getElementById('userFilterSelect').value;
    
    filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm) || 
                             user.email.toLowerCase().includes(searchTerm);
        
        let matchesStatus = true;
        if (statusFilter === 'with-projects') {
            matchesStatus = user.assignedProject !== null;
        } else if (statusFilter === 'without-projects') {
            matchesStatus = user.assignedProject === null;
        }
        
        return matchesSearch && matchesStatus;
    });
    
    renderUsers(filteredUsers);
};

// Filter projects function
const filterProjects = () => {
    const searchTerm = document.getElementById('projectSearchInput').value.toLowerCase();
    const statusFilter = document.getElementById('projectFilterSelect').value;
    
    filteredProjects = projects.filter(project => {
        const matchesSearch = project.name.toLowerCase().includes(searchTerm) || 
                             project.description.toLowerCase().includes(searchTerm);
        
        let matchesStatus = true;
        if (statusFilter === 'assigned') {
            matchesStatus = project.assignedUser !== null;
        } else if (statusFilter === 'unassigned') {
            matchesStatus = project.assignedUser === null;
        } else if (statusFilter === 'completed') {
            matchesStatus = project.isCompleted === true;
        }
        
        return matchesSearch && matchesStatus;
    });
    
    renderProjects(filteredProjects);
};

// Fetch users from backend
const fetchUsers = async () => {
    showLoading();
    try {
        const response = await apiRequest('/users');
        if (response) {
            // Handle direct array response from /users endpoint
            if (Array.isArray(response)) {
                users = response;
            } else {
                // Handle wrapped response format
                users = response.data || [];
            }
            
            filteredUsers = [...users];
            renderUsers(filteredUsers);
            updateStats();
        }
    } catch (error) {
        console.error('Failed to fetch users:', error);
        showToast('Failed to load users. Please try again.', 'error', 'Error');
    } finally {
        hideLoading();
    }
};

// Fetch projects from backend
const fetchProjects = async () => {
    showLoading();
    try {
        const response = await apiRequest('/projects');
        if (response) {
            // Handle wrapped response format from /projects endpoint
            if (response.success && response.data) {
                projects = response.data;
            } else if (Array.isArray(response)) {
                // Handle direct array response (fallback)
                projects = response;
            } else {
                projects = [];
            }
            
            filteredProjects = [...projects];
            renderProjects(filteredProjects);
            updateStats();
        }
    } catch (error) {
        console.error('Failed to fetch projects:', error);
        showToast('Failed to load projects. Please try again.', 'error', 'Error');
    } finally {
        hideLoading();
    }
};

// Utility Functions
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const showToast = (message, type = 'info', title = '') => {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
    
    toast.addEventListener('click', () => {
        toast.remove();
    });
};

const showLoading = () => {
    document.getElementById('loadingOverlay').classList.add('show');
};

const hideLoading = () => {
    document.getElementById('loadingOverlay').classList.remove('show');
};

const showModal = (modalId) => {
    document.getElementById(modalId).classList.add('show');
};

const hideModal = (modalId) => {
    document.getElementById(modalId).classList.remove('show');
};

// Tab Management
const initializeTabs = () => {
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            navTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            // Load tab-specific data
            loadTabData(targetTab);
        });
    });
};

const loadTabData = (tabName) => {
    switch(tabName) {
        case 'overview':
            updateStats();
            break;
        case 'users':
            fetchUsers();
            break;
        case 'projects':
            fetchProjects();
            break;
        case 'assignments':
            loadAssignmentsData();
            break;
    }
};

// Dashboard Tab Functions
const updateStats = () => {
    // Ensure arrays are initialized
    const safeUsers = Array.isArray(users) ? users : [];
    const safeProjects = Array.isArray(projects) ? projects : [];
    
    // Calculate statistics
    const totalUsers = safeUsers.length;
    const totalProjects = safeProjects.length;
    const usersWithoutProjects = safeUsers.filter(user => !user.assignedProject && user.role !== 'ADMIN').length;
    const unassignedProjects = safeProjects.filter(project => !project.assignedUser).length;
    const assignedProjects = safeProjects.filter(project => project.assignedUser !== null).length;
    const completedProjects = safeProjects.filter(project => project.isCompleted).length;
    
    // Update DOM elements
    const totalUsersElement = document.getElementById('totalUsers');
    const totalProjectsElement = document.getElementById('totalProjects');
    const usersWithoutProjectsElement = document.getElementById('usersWithoutProjects');
    const unassignedProjectsElement = document.getElementById('unassignedProjects');
    const assignedCountElement = document.getElementById('assignedCount');
    const completedCountElement = document.getElementById('completedCount');
    const unassignedCountElement = document.getElementById('unassignedCount');
    
    if (totalUsersElement) totalUsersElement.textContent = totalUsers;
    if (totalProjectsElement) totalProjectsElement.textContent = totalProjects;
    if (usersWithoutProjectsElement) usersWithoutProjectsElement.textContent = usersWithoutProjects;
    if (unassignedProjectsElement) unassignedProjectsElement.textContent = unassignedProjects;
    if (assignedCountElement) assignedCountElement.textContent = assignedProjects;
    if (completedCountElement) completedCountElement.textContent = completedProjects;
    if (unassignedCountElement) unassignedCountElement.textContent = unassignedProjects;
};

// Users Tab Functions
const renderUsers = (usersToRender) => {
    const tbody = document.querySelector('#usersTable tbody');
    if (!tbody) return;
    
    // Ensure usersToRender is an array
    const safeUsers = Array.isArray(usersToRender) ? usersToRender : [];
    
    tbody.innerHTML = '';
    
    if (safeUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No users found</td></tr>';
        return;
    }
    
    safeUsers.forEach(user => {
        const row = document.createElement('tr');
        const assignedProject = user.assignedProject;
        
        row.innerHTML = `
            <td>${escapeHtml(user.name)}</td>
            <td>${escapeHtml(user.email)}</td>
            <td>
                <span class="status-badge ${user.role === 'ADMIN' ? 'admin' : 'user'}">
                    ${user.role}
                </span>
            </td>
            <td>
                ${assignedProject 
                    ? `<span class="status-badge assigned">${escapeHtml(assignedProject.name)}</span>`
                    : '<span class="status-badge without-project">No Project</span>'
                }
            </td>
            <td class="actions-cell">
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editUser('${user.id}')" title="Edit User">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${user.role !== 'ADMIN' ? `
                        <button class="action-btn delete" onclick="deleteUser('${user.id}')" title="Delete User">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
};

// Projects Tab Functions - Updated to include assignment actions
const renderProjects = (projectsToRender) => {
    const tbody = document.querySelector('#projectsTable tbody');
    if (!tbody) return;
    
    // Ensure projectsToRender is an array
    const safeProjects = Array.isArray(projectsToRender) ? projectsToRender : [];
    
    tbody.innerHTML = '';
    
    if (safeProjects.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No projects found</td></tr>';
        return;
    }
    
    safeProjects.forEach(project => {
        const row = document.createElement('tr');
        const endDate = new Date(project.endDate);
        const assignedUser = project.assignedUser;
        
        row.innerHTML = `
            <td>
                <div class="project-info">
                    <div class="project-name">${escapeHtml(project.name)}</div>
                </div>
            </td>
            <td>
                <div class="project-description" title="${escapeHtml(project.description)}">
                    ${escapeHtml(project.description.substring(0, 50))}${project.description.length > 50 ? '...' : ''}
                </div>
            </td>
            <td class="assigned-cell">
                ${assignedUser 
                    ? `<span class="status-badge assigned">${escapeHtml(assignedUser.name)}</span>`
                    : '<span class="status-badge unassigned">Unassigned</span>'
                }
            </td>
            <td class="date-cell">${endDate.toLocaleDateString()}</td>
            <td>
                <span class="status-badge ${project.isCompleted ? 'completed' : 'assigned'}">
                    ${project.isCompleted ? 'Completed' : 'In Progress'}
                </span>
            </td>
            <td class="actions-cell">
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editProject('${project.id}')" title="Edit Project">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn assign" onclick="showAssignModal('${project.id}')" title="Assign Project">
                        <i class="fas fa-user-plus"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteProject('${project.id}')" title="Delete Project">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
};

// Show assignment modal
const showAssignModal = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    const availableUsers = users.filter(u => !u.assignedProject && u.role !== 'ADMIN');
    
    if (availableUsers.length === 0) {
        showToast('No available users to assign to this project.', 'warning', 'No Users Available');
        return;
    }
    
    // Set project info in modal
    document.getElementById('assignProjectName').textContent = project.name;
    document.getElementById('assignProjectId').value = projectId;
    
    // Populate user select dropdown
    const userSelect = document.getElementById('assignUserSelect');
    userSelect.innerHTML = '<option value="">Select a user...</option>';
    
    availableUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.name} (${user.email})`;
        userSelect.appendChild(option);
    });
    
    showModal('assignProjectModal');
};

// Assign project to user
const assignProjectToUser = async (projectId, userId) => {
    showLoading();
    try {
        const data = await apiRequest(`/projects/${projectId}/assign`, {
            method: 'POST',
            body: JSON.stringify({ userId })
        });
        
        if (data) {
            // Refresh both users and projects data
            await Promise.all([
                fetchUsers(),
                fetchProjects()
            ]);
            
            // Update assignment data
            loadAssignmentsData();
            
            showToast('Project assigned successfully!', 'success', 'Assignment Complete');
        }
    } catch (error) {
        console.error('Failed to assign project:', error);
        showToast('Failed to assign project. Please try again.', 'error', 'Assignment Failed');
    } finally {
        hideLoading();
    }
};

// Unassign project from user
const unassignProject = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project && project.assignedUser) {
        if (confirm(`Are you sure you want to unassign "${project.name}" from ${project.assignedUser.name}?`)) {
            showToast('Project unassignment functionality will be implemented with backend integration.', 'info', 'Unassign Project');
        }
    }
};

// Enhanced Assignments Tab Functions
const loadAssignmentsData = () => {
    renderUnassignedProjects();
    renderUsersWithoutProjects();
    initializeAssignmentInteractions();
};

const renderUnassignedProjects = () => {
    const container = document.getElementById('unassignedProjectsList');
    const unassignedProjects = projects.filter(p => !p.assignedUser);
    
    container.innerHTML = '';
    
    if (unassignedProjects.length === 0) {
        container.innerHTML = `
            <div class="no-data-content">
                <i class="fas fa-project-diagram"></i>
                <p>No unassigned projects</p>
            </div>
        `;
        return;
    }
    
    unassignedProjects.forEach(project => {
        const item = document.createElement('div');
        item.className = 'assignment-item';
        item.dataset.projectId = project.id;
        item.innerHTML = `
            <h4>${escapeHtml(project.name)}</h4>
            <p>${escapeHtml(project.description)}</p>
            <small>Due: ${formatDate(project.endDate)}</small>
        `;
        container.appendChild(item);
    });
};

const renderUsersWithoutProjects = () => {
    const container = document.getElementById('usersWithoutProjectsList');
    const usersWithoutProjects = users.filter(u => !u.assignedProject && u.role !== 'ADMIN');
    
    container.innerHTML = '';
    
    if (usersWithoutProjects.length === 0) {
        container.innerHTML = `
            <div class="no-data-content">
                <i class="fas fa-users"></i>
                <p>All users have projects</p>
            </div>
        `;
        return;
    }
    
    usersWithoutProjects.forEach(user => {
        const item = document.createElement('div');
        item.className = 'assignment-item';
        item.dataset.userId = user.id;
        item.innerHTML = `
            <h4>${escapeHtml(user.name)}</h4>
            <p>${escapeHtml(user.email)}</p>
            <small>Role: ${user.role}</small>
        `;
        container.appendChild(item);
    });
};

// Initialize assignment interactions (drag & drop style selection)
const initializeAssignmentInteractions = () => {
    let selectedProject = null;
    let selectedUser = null;
    
    // Project selection
    document.querySelectorAll('#unassignedProjectsList .assignment-item').forEach(item => {
        item.addEventListener('click', () => {
            // Remove previous selection
            document.querySelectorAll('#unassignedProjectsList .assignment-item').forEach(i => 
                i.classList.remove('selected'));
            
            // Add selection to clicked item
            item.classList.add('selected');
            selectedProject = item.dataset.projectId;
            
            updateAssignButton();
        });
    });
    
    // User selection
    document.querySelectorAll('#usersWithoutProjectsList .assignment-item').forEach(item => {
        item.addEventListener('click', () => {
            // Remove previous selection
            document.querySelectorAll('#usersWithoutProjectsList .assignment-item').forEach(i => 
                i.classList.remove('selected'));
            
            // Add selection to clicked item
            item.classList.add('selected');
            selectedUser = item.dataset.userId;
            
            updateAssignButton();
        });
    });
    
    // Update assign button state
    const updateAssignButton = () => {
        const assignBtn = document.getElementById('assignSelectedBtn');
        if (assignBtn) {
            if (selectedProject && selectedUser) {
                assignBtn.disabled = false;
                assignBtn.onclick = () => assignProjectToUser(selectedProject, selectedUser);
            } else {
                assignBtn.disabled = true;
                assignBtn.onclick = null;
            }
        }
    };
};

// Event Listeners - Fixed function name
const setupEventListeners = () => {
    // Initialize tabs
    initializeTabs();
    
    // Header buttons
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            showLoading();
            Promise.all([
                fetchUsers(),
                fetchProjects()
            ]).then(() => {
                loadTabData(document.querySelector('.nav-tab.active').getAttribute('data-tab'));
                hideLoading();
            });
        });
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.clear();
                showToast('Logging out...', 'info', 'Logout');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            }
        });
    }
    
    // Add Project Modal
    const addProjectBtn = document.getElementById('addProjectBtn');
    if (addProjectBtn) {
        addProjectBtn.addEventListener('click', () => {
            showModal('addProjectModal');
        });
    }
    
    const saveProjectBtn = document.getElementById('saveProjectBtn');
    if (saveProjectBtn) {
        saveProjectBtn.addEventListener('click', async () => {
            const form = document.getElementById('addProjectForm');
            
            if (form.checkValidity()) {
                const formData = new FormData(form);
                const projectData = {
                    name: formData.get('name'),
                    description: formData.get('description'),
                    endDate: formData.get('endDate')
                };
                
                await createProject(projectData);
            } else {
                showToast('Please fill in all required fields correctly.', 'warning', 'Validation Error');
            }
        });
    }
    
    // Assign Project Modal
    const assignProjectToUserBtn = document.getElementById('assignProjectToUserBtn');
    if (assignProjectToUserBtn) {
        assignProjectToUserBtn.addEventListener('click', async () => {
            const projectId = document.getElementById('assignProjectId').value;
            const userId = document.getElementById('assignUserSelect').value;
            
            if (projectId && userId) {
                await assignProjectToUser(projectId, userId);
                hideModal('assignProjectModal');
            } else {
                showToast('Please select a user to assign the project to.', 'warning', 'Selection Required');
            }
        });
    }
    
    // Search and filter inputs
    const userSearchInput = document.getElementById('userSearchInput');
    if (userSearchInput) {
        userSearchInput.addEventListener('input', filterUsers);
    }
    
    const userFilterSelect = document.getElementById('userFilterSelect');
    if (userFilterSelect) {
        userFilterSelect.addEventListener('change', filterUsers);
    }
    
    const projectSearchInput = document.getElementById('projectSearchInput');
    if (projectSearchInput) {
        projectSearchInput.addEventListener('input', filterProjects);
    }
    
    const projectFilterSelect = document.getElementById('projectFilterSelect');
    if (projectFilterSelect) {
        projectFilterSelect.addEventListener('change', filterProjects);
    }
    
    // Modal close handlers
    document.querySelectorAll('[data-modal]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.target.closest('[data-modal]').getAttribute('data-modal');
            hideModal(modalId);
        });
    });
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
    
    // Placeholder buttons
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            showToast('User creation functionality will be implemented with backend integration.', 'info', 'Add User');
        });
    }
    
    const exportUsersBtn = document.getElementById('exportUsersBtn');
    if (exportUsersBtn) {
        exportUsersBtn.addEventListener('click', () => {
            showToast('Export users functionality will be implemented.', 'info', 'Export');
        });
    }
    
    const exportProjectsBtn = document.getElementById('exportProjectsBtn');
    if (exportProjectsBtn) {
        exportProjectsBtn.addEventListener('click', () => {
            showToast('Export projects functionality will be implemented.', 'info', 'Export');
        });
    }
    
    const bulkAssignBtn = document.getElementById('bulkAssignBtn');
    if (bulkAssignBtn) {
        bulkAssignBtn.addEventListener('click', () => {
            showToast('Bulk assignment functionality will be implemented.', 'info', 'Bulk Assign');
        });
    }
};

// Initialize dashboard
const initializeDashboard = async () => {
    try {
        // Check authentication first
        if (!checkAuthentication()) {
            return;
        }
        
        // Initialize empty arrays
        users = [];
        projects = [];
        filteredUsers = [];
        filteredProjects = [];
        
        // Fetch data
        await Promise.all([
            fetchUsers(),
            fetchProjects()
        ]);
        
        // Setup event listeners
        setupEventListeners();
        
        console.log('Dashboard initialized successfully');
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        showToast('Failed to initialize dashboard. Please refresh the page.', 'error', 'Error');
    }
};

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeDashboard);

// Export functions for global access
window.editUser = (id) => showToast('Edit user functionality will be implemented', 'info');
window.deleteUser = (id) => showToast('Delete user functionality will be implemented', 'info');
window.assignProject = (id) => showAssignModal(id);
window.editProject = (id) => showToast('Edit project functionality will be implemented', 'info');
window.deleteProject = (id) => showToast('Delete project functionality will be implemented', 'info');
window.showAssignModal = showAssignModal;