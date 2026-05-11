/**
 * SecureVault - Main Application
 * Initializes and orchestrates the entire application
 */

const App = (() => {
    /**
     * Initialize application
     */
    async function init() {
        setupEventListeners();
        showLoginModal();
    }

    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
            const masterPassword = document.getElementById('masterPassword');
            if (masterPassword) {
                masterPassword.addEventListener('input', updatePasswordStrength);
            }
        }

        // Sidebar menu - Views
        document.querySelectorAll('[data-view]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                UIHandler.switchView(item.dataset.view);
            });
        });

        // Sidebar menu - Categories
        document.querySelectorAll('[data-category]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                UIHandler.filterByCategory(item.dataset.category);
            });
        });

        // Sidebar menu - Actions
        document.querySelectorAll('[data-action]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                handleMenuAction(item.dataset.action);
            });
        });

        // Top bar buttons
        const addItemBtn = document.getElementById('addItemBtn');
        if (addItemBtn) {
            addItemBtn.addEventListener('click', showAddItemModal);
        }

        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                UIHandler.refreshItemsList();
                UIHandler.showToast('Vault refreshed', 'info');
            });
        }

        // Search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }

        // Item form
        const itemForm = document.getElementById('itemForm');
        if (itemForm) {
            itemForm.addEventListener('submit', handleSaveItem);
        }

        // Tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                handleTabSwitch(tab);
            });
        });

        // Close buttons
        document.querySelectorAll('[data-modal]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                UIHandler.hideModal(btn.dataset.modal);
            });
        });

        // Modal backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    UIHandler.hideModal(modal.id);
                }
            });
        });

        // Password field buttons
        const togglePasswordBtn = document.getElementById('togglePassword');
        if (togglePasswordBtn) {
            togglePasswordBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const field = document.getElementById('itemPassword');
                const isPassword = field.type === 'password';
                field.type = isPassword ? 'text' : 'password';
                togglePasswordBtn.innerHTML = `<i class="fas fa-eye${isPassword ? '-slash' : ''}"></i>`;
            });
        }

        const generatePasswordBtn = document.getElementById('generatePassword');
        if (generatePasswordBtn) {
            generatePasswordBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const password = Utils.generatePassword(16);
                document.getElementById('itemPassword').value = password;
                UIHandler.showToast('Password generated', 'success');
            });
        }

        // Settings modal buttons
        const exportVaultBtn = document.getElementById('exportVaultBtn');
        if (exportVaultBtn) {
            exportVaultBtn.addEventListener('click', handleExportVault);
        }

        const importVaultBtn = document.getElementById('importVaultBtn');
        if (importVaultBtn) {
            importVaultBtn.addEventListener('click', handleImportVault);
        }

        const changeMasterPasswordBtn = document.getElementById('changeMasterPassword');
        if (changeMasterPasswordBtn) {
            changeMasterPasswordBtn.addEventListener('click', () => {
                UIHandler.showToast('This feature will be available in a future release', 'info');
            });
        }
    }

    /**
     * Show login modal
     */
    function showLoginModal() {
        UIHandler.showModal('loginModal');
    }

    /**
     * Handle login
     * @param {Event} e - Form submit event
     */
    async function handleLogin(e) {
        e.preventDefault();

        const password = document.getElementById('masterPassword').value;

        if (!password) {
            UIHandler.showToast('Please enter your master password', 'warning');
            return;
        }

        try {
            await VaultManager.authenticate(password, !localStorage.getItem('securevault_master'));
            UIHandler.hideModal('loginModal');
            UIHandler.showToast('Login successful', 'success');
            UIHandler.refreshItemsList();
        } catch (error) {
            UIHandler.showToast('Login failed: ' + error.message, 'error');
        }
    }

    /**
     * Show add item modal
     */
    function showAddItemModal() {
        document.getElementById('itemModalTitle').textContent = '➕ Add New Item';
        document.getElementById('itemForm').reset();
        document.getElementById('itemForm').removeAttribute('data-edit-id');
        UIHandler.showModal('itemModal');
    }

    /**
     * Handle save item
     * @param {Event} e - Form submit event
     */
    async function handleSaveItem(e) {
        e.preventDefault();

        const title = document.getElementById('itemTitle').value;
        const category = document.getElementById('itemCategory').value;
        const username = document.getElementById('itemUsername').value;
        const password = document.getElementById('itemPassword').value;
        const url = document.getElementById('itemUrl').value;
        const notes = document.getElementById('itemNotes').value;
        const editId = document.getElementById('itemForm').dataset.editId;

        // Validate
        if (!title || !category) {
            UIHandler.showToast('Please fill in all required fields', 'warning');
            return;
        }

        try {
            const itemData = {
                title: Utils.sanitizeInput(title),
                category,
                username: username ? Utils.sanitizeInput(username) : null,
                password: password ? Utils.sanitizeInput(password) : null,
                url: url ? Utils.sanitizeInput(url) : null,
                notes: notes ? Utils.sanitizeInput(notes) : null
            };

            if (editId) {
                await VaultManager.updateItem(editId, itemData);
                UIHandler.showToast('Item updated successfully', 'success');
            } else {
                await VaultManager.addItem(itemData);
                UIHandler.showToast('Item added successfully', 'success');
            }

            UIHandler.hideModal('itemModal');
            UIHandler.refreshItemsList();
        } catch (error) {
            UIHandler.showToast('Error saving item: ' + error.message, 'error');
        }
    }

    /**
     * Handle search
     * @param {Event} e - Input event
     */
    function handleSearch(e) {
        const query = e.target.value.trim();

        if (!query) {
            UIHandler.refreshItemsList();
            return;
        }

        const results = VaultManager.searchItems(query);
        UIHandler.renderItemsList(results);
    }

    /**
     * Handle menu action
     * @param {string} action - Action name
     */
    function handleMenuAction(action) {
        if (action === 'settings') {
            UIHandler.showModal('settingsModal');
        } else if (action === 'security') {
            UIHandler.showModal('settingsModal');
            // Switch to security tab
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.tab === 'security');
            });
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.toggle('active', content.dataset.tab === 'security');
            });
        } else if (action === 'export') {
            UIHandler.showModal('settingsModal');
        }
    }

    /**
     * Update password strength indicator
     * @param {Event} e - Input event
     */
    function updatePasswordStrength(e) {
        const strength = Utils.validatePasswordStrength(e.target.value);
        const bar = document.getElementById('passwordStrength');

        bar.className = `password-strength-bar ${strength.level}`;
    }

    /**
     * Handle tab switch
     * @param {Element} tab - Tab element
     */
    function handleTabSwitch(tab) {
        const tabName = tab.dataset.tab;

        // Update tab buttons
        tab.parentElement.querySelectorAll('.tab').forEach(t => {
            t.classList.toggle('active', t === tab);
        });

        // Update tab content
        const modal = tab.closest('.modal-content') || tab.closest('div');
        modal.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.tab === tabName);
        });
    }

    /**
     * Handle export vault
     */
    async function handleExportVault() {
        try {
            const encrypted = await VaultManager.exportData();
            const blob = new Blob([encrypted], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `securevault-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            UIHandler.showToast('Vault exported successfully', 'success');
        } catch (error) {
            UIHandler.showToast('Export failed: ' + error.message, 'error');
        }
    }

    /**
     * Handle import vault
     */
    function handleImportVault() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', async (e) => {
            try {
                const file = e.target.files[0];
                const text = await file.text();
                const password = prompt('Enter your master password to import:');

                if (!password) return;

                await VaultManager.importData(text, password);
                UIHandler.showToast('Vault imported successfully', 'success');
                UIHandler.refreshItemsList();
            } catch (error) {
                UIHandler.showToast('Import failed: ' + error.message, 'error');
            }
        });
        input.click();
    }

    /**
     * Handle logout
     */
    function handleLogout() {
        if (confirm('Are you sure you want to logout? Any unsaved changes will be lost.')) {
            VaultManager.logout();
            document.getElementById('itemsContainer').innerHTML = '';
            document.getElementById('emptyDetail').style.display = 'flex';
            document.getElementById('detailContent').style.display = 'none';
            UIHandler.showToast('Logged out successfully', 'info');
            showLoginModal();
        }
    }

    return {
        init
    };
})();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);

// Auto-logout after inactivity (optional)
let inactivityTimer;
function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        if (VaultManager.isLoggedIn()) {
            VaultManager.logout();
            UIHandler.showToast('Session expired due to inactivity', 'warning');
            UIHandler.showModal('loginModal');
        }
    }, 15 * 60 * 1000); // 15 minutes
}

document.addEventListener('mousemove', resetInactivityTimer);
document.addEventListener('keypress', resetInactivityTimer);
