// KIS Core V2 - Main JavaScript
// KARA-PRIME System Architect

class KISCoreApp {
    constructor() {
        this.currentTab = 'ai-manager';
        this.sidebarCollapsed = false;
        this.aiManager = null;
        this.erpManager = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeModules();
        this.loadConfiguration();
        console.log('🎯 KIS Core V2 Initialized - SPEC KIT Compliant');
    }

    setupEventListeners() {
        // Sidebar Toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Tab Navigation
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for quick search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openQuickSearch();
            }

            // Ctrl/Cmd + N for new chat
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.startNewChat();
            }
        });
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        this.sidebarCollapsed = !this.sidebarCollapsed;

        if (this.sidebarCollapsed) {
            sidebar.classList.add('collapsed');
            localStorage.setItem('sidebarCollapsed', 'true');
        } else {
            sidebar.classList.remove('collapsed');
            localStorage.setItem('sidebarCollapsed', 'false');
        }
    }

    switchTab(tabName) {
        // Update tab items
        document.querySelectorAll('.tab-item').forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            if (content.id === tabName) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });

        this.currentTab = tabName;
        this.onTabChange(tabName);
    }

    onTabChange(tabName) {
        console.log(`📁 Tab switched to: ${tabName}`);

        // Tab-specific initialization
        switch (tabName) {
            case 'ai-manager':
                this.initAIManager();
                break;
            case 'estimate':
                this.loadEstimates();
                break;
            case 'erp':
                this.initERPModules();
                break;
            case 'email':
                this.loadEmails();
                break;
            case 'calendar':
                this.loadCalendar();
                break;
            case 'drawing':
                this.initDrawingTools();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    initializeModules() {
        // Initialize AI Manager
        if (typeof AIManager !== 'undefined') {
            this.aiManager = new AIManager();
        }

        // Initialize ERP Manager
        if (typeof ERPManager !== 'undefined') {
            this.erpManager = new ERPManager();
        }

        // Load saved state
        const savedCollapsed = localStorage.getItem('sidebarCollapsed');
        if (savedCollapsed === 'true') {
            document.getElementById('sidebar').classList.add('collapsed');
            this.sidebarCollapsed = true;
        }
    }

    loadConfiguration() {
        // Load configuration from localStorage or default
        const config = {
            mode: localStorage.getItem('operationMode') || 'LIVE',
            theme: localStorage.getItem('theme') || 'light',
            language: localStorage.getItem('language') || 'ko',
            apiKeys: {
                openai: localStorage.getItem('openai_key') || '',
                claude: localStorage.getItem('claude_key') || '',
            }
        };

        this.config = config;
        console.log('⚙️ Configuration loaded:', { mode: config.mode, theme: config.theme });
    }

    // AI Manager Methods
    initAIManager() {
        console.log('🤖 AI Manager initialized');
        if (this.aiManager) {
            this.aiManager.focus();
        }
    }

    startNewChat() {
        if (this.currentTab !== 'ai-manager') {
            this.switchTab('ai-manager');
        }
        if (this.aiManager) {
            this.aiManager.newChat();
        }
    }

    // Estimate Methods
    loadEstimates() {
        console.log('📄 Loading estimates...');
        // Load estimate list from API or localStorage
        const estimates = this.getStoredEstimates();
        this.renderEstimateList(estimates);
    }

    getStoredEstimates() {
        const stored = localStorage.getItem('estimates');
        return stored ? JSON.parse(stored) : [];
    }

    renderEstimateList(estimates) {
        const grid = document.querySelector('.estimate-grid');
        if (!grid) return;

        if (estimates.length === 0) {
            grid.innerHTML = '<div class="empty-state">견적이 없습니다. 새 견적을 작성하세요.</div>';
            return;
        }

        grid.innerHTML = estimates.map(est => `
            <div class="estimate-card" data-id="${est.id}">
                <h4>${est.title}</h4>
                <p>${est.client}</p>
                <span class="date">${est.date}</span>
                <span class="status ${est.status}">${est.status}</span>
            </div>
        `).join('');
    }

    // ERP Methods
    initERPModules() {
        console.log('📊 ERP modules initialized');

        // Add click handlers for ERP menu items
        document.querySelectorAll('.module-menu li').forEach(item => {
            item.addEventListener('click', (e) => {
                const menuItem = e.target.textContent;
                this.openERPFunction(menuItem);
            });
        });
    }

    openERPFunction(functionName) {
        console.log(`📈 Opening ERP function: ${functionName}`);
        // Implement specific ERP function
        if (this.erpManager) {
            this.erpManager.openFunction(functionName);
        }
    }

    // Email Methods
    loadEmails() {
        console.log('📧 Loading emails...');
        // Implement email loading
    }

    // Calendar Methods
    loadCalendar() {
        console.log('📅 Loading calendar...');
        // Implement calendar loading
    }

    // Drawing Methods
    initDrawingTools() {
        console.log('✏️ Drawing tools initialized');
        // Initialize CAD/drawing tools
    }

    // Settings Methods
    loadSettings() {
        console.log('⚙️ Loading settings...');

        // Load current settings
        document.querySelectorAll('.setting-item input, .setting-item select').forEach(input => {
            const key = input.placeholder || input.name;
            const value = localStorage.getItem(key);
            if (value) {
                input.value = value;
            }
        });
    }

    // Quick Search
    openQuickSearch() {
        console.log('🔍 Opening quick search...');
        // Implement quick search modal
    }

    // API Methods
    async callMCPServer(server, method, params) {
        const endpoint = `/mcp/${server}/${method}`;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                throw new Error(`MCP Server error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`❌ MCP Server call failed:`, error);
            return null;
        }
    }

    // Utility Methods
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} slide-in`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.kisApp = new KISCoreApp();
});