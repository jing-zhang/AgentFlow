// Guard: ensure electronAPI is available
if (!window.electronAPI) {
    console.error('electronAPI not available — preload script may have failed to load');
    document.body.innerHTML = '<div style="padding:2rem;text-align:center;color:#fff"><h2>AgentFlow failed to initialize</h2><p>The preload script did not load correctly. Try restarting the application.</p></div>';
    throw new Error('electronAPI not available');
}

async function updateStatus(serviceName) {
    const status = await window.electronAPI.getStatus(serviceName);
    const ring = document.getElementById(`ring-${serviceName}`);
    const text = document.getElementById(`status-${serviceName}`);
    const info = document.getElementById(`info-${serviceName}`);
    const buttons = document.querySelectorAll(`#card-${serviceName} .action-btn`);
    const logButton = document.getElementById(`${serviceName}-log-btn`);

    ring.classList.remove('active', 'inactive');
    
    if (status === 'active') {
        ring.classList.add('active');
        text.innerText = 'ACTIVE';
        info.innerText = 'Running smoothly | Uptime: Healthy';
        // Enable buttons
        buttons.forEach(btn => btn.disabled = false);
        if (logButton) {
            logButton.disabled = false;
            logButton.textContent = 'Refresh Logs';
        }
    } else if (status === 'not-installed') {
        ring.classList.add('inactive');
        text.innerText = 'NOT\nINSTALLED';
        text.style.fontSize = '0.6rem';
        text.style.lineHeight = '1.1';
        info.innerText = `Install ${serviceName}-gateway service`;
        // Disable buttons
        buttons.forEach(btn => btn.disabled = true);
        if (logButton) {
            logButton.disabled = true;
            logButton.textContent = 'Refresh Logs';
        }
    } else if (status === 'error') {
        ring.classList.add('inactive');
        text.innerText = 'ERROR';
        info.innerText = 'Failed to check service status';
        // Disable buttons
        buttons.forEach(btn => btn.disabled = true);
        if (logButton) {
            logButton.disabled = true;
            logButton.textContent = 'Refresh Logs';
        }
    } else {
        ring.classList.add('inactive');
        text.innerText = 'STOPPED';
        info.innerText = 'Service is currently offline';
        // Enable buttons
        buttons.forEach(btn => btn.disabled = false);
        if (logButton) {
            logButton.disabled = false;
            logButton.textContent = 'Refresh Logs';
        }
    }
}

async function control(serviceName, action) {
    const info = document.getElementById(`info-${serviceName}`);
    const text = document.getElementById(`status-${serviceName}`);
    const buttons = document.querySelectorAll(`#card-${serviceName} .action-btn`);
    
    // Check if service is installed
    if (text.innerText === 'NOT INSTALLED') {
        alert(`Cannot ${action} service: ${serviceName}-gateway is not installed.`);
        return;
    }
    
    info.innerText = `Executing ${action}...`;
    text.innerText = 'PENDING';

    const result = await window.electronAPI.controlService(serviceName, action);
    
    if (result.error) {
        alert(`Error: ${result.error}`);
        info.innerText = `Failed to ${action}`;
    }
    
    // Small delay to let system update
    setTimeout(() => updateStatus(serviceName), 1000);
}

// Service identifiers (these are fixed identifiers, not the actual service names)
const SERVICE_IDENTIFIERS = ['openclaw', 'hermes'];

// Initial check
SERVICE_IDENTIFIERS.forEach(updateStatus);

// Poll for status updates every 10 seconds
let pollInterval = 10000; // Default 10 seconds
let pollIntervalId = setInterval(() => {
    SERVICE_IDENTIFIERS.forEach(updateStatus);
}, pollInterval);

// Function to update polling interval
function updatePollInterval(newInterval) {
    clearInterval(pollIntervalId);
    pollInterval = newInterval * 1000; // Convert seconds to milliseconds
    pollIntervalId = setInterval(() => {
        SERVICE_IDENTIFIERS.forEach(updateStatus);
    }, pollInterval);
}

// Update chart bars based on real CPU usage
async function updateChart() {
    const bars = document.querySelectorAll('.bar');
    const cpus = await Promise.all(
        SERVICE_IDENTIFIERS.map(s => window.electronAPI.getCPU(s))
    );
    bars.forEach((bar, i) => {
        const idx = i % SERVICE_IDENTIFIERS.length;
        const cpu = cpus[idx]?.cpu ?? 0;
        const height = Math.max(Math.round(cpu), 2);
        bar.style.height = `${height}%`;
        bar.style.background = cpu > 0
            ? `linear-gradient(to top, #00e676, #00c853)`
            : `linear-gradient(to top, #ff5252, #d32f2f)`;
    });
}

setInterval(updateChart, 3000);
updateChart();


// Tab switching
function switchTab(tabName, event) {
    // Hide all tabs
    document.getElementById('tab-overview').style.display = 'none';
    document.getElementById('tab-logs').style.display = 'none';
    document.getElementById('tab-settings').style.display = 'none';

    // Show selected tab
    document.getElementById(`tab-${tabName}`).style.display = 'block';

    // Update nav buttons
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }

    // When switching to logs tab, show only the selected agent's section
    if (tabName === 'logs') {
        updateLogsForAgent();
        refreshLogs(agentToggle.currentAgent);
    }
}

// Show/hide log sections based on the selected agent
function updateLogsForAgent() {
    const selectedAgent = agentToggle.currentAgent;
    const openclawSection = document.getElementById('openclaw-logs')?.closest('.log-section');
    const hermesSection = document.getElementById('hermes-logs')?.closest('.log-section');

    if (openclawSection && hermesSection) {
        if (selectedAgent === 'openclaw') {
            openclawSection.style.display = '';
            hermesSection.style.display = 'none';
        } else {
            openclawSection.style.display = 'none';
            hermesSection.style.display = '';
        }
    }
}

// Logs functionality
async function refreshLogs(serviceName) {
    const logArea = document.getElementById(`${serviceName}-logs`);
    const logButton = document.getElementById(`${serviceName}-log-btn`);
    
    // Check if service is installed
    const status = document.getElementById(`status-${serviceName}`);
    if (status && status.innerText.includes('NOT')) {
        alert(`Cannot fetch logs: ${serviceName}-gateway is not installed.`);
        return;
    }
    
    logArea.value = 'Loading logs...\n';
    logButton.disabled = true;
    logButton.textContent = 'Loading...';
    
    try {
        const result = await window.electronAPI.getLogs(serviceName, 50);
        
        if (result.success === false) {
            logArea.value = `Error fetching logs:\n${result.error}\n\nMake sure the service is installed and journalctl is available.`;
        } else {
            logArea.value = result.logs;
        }
    } catch (error) {
        logArea.value = `Error fetching logs:\n${error.message}\n\nMake sure the service is installed and journalctl is available.`;
    } finally {
        logButton.disabled = false;
        logButton.textContent = 'Refresh Logs';
    }
}

// Settings functionality
async function saveSettings() {
    const openclawService = document.getElementById('openclaw-service').value;
    const hermesService = document.getElementById('hermes-service').value;
    const pollInterval = document.getElementById('poll-interval').value;
    
    // Save to localStorage
    localStorage.setItem('openclaw-service', openclawService);
    localStorage.setItem('hermes-service', hermesService);
    localStorage.setItem('poll-interval', pollInterval);
    
    // Update service mapping in service manager
    try {
        const newMapping = {
            'openclaw': openclawService,
            'hermes': hermesService
        };
        const result = await window.electronAPI.updateServiceMapping(newMapping);
        
        if (result.success) {
            // Update polling interval
            updatePollInterval(parseInt(pollInterval, 10));
            alert('Settings saved successfully! Service mapping updated.');
        } else {
            alert(`Failed to update service mapping: ${result.error}`);
        }
    } catch (error) {
        alert(`Error updating service mapping: ${error.message}`);
    }
}

// Load settings on startup
async function loadSettings() {
    const openclawService = localStorage.getItem('openclaw-service') || 'openclaw-gateway';
    const hermesService = localStorage.getItem('hermes-service') || 'hermes-gateway';
    const pollInterval = localStorage.getItem('poll-interval') || '10';
    
    document.getElementById('openclaw-service').value = openclawService;
    document.getElementById('hermes-service').value = hermesService;
    document.getElementById('poll-interval').value = pollInterval;
    
    // Update service mapping in service manager
    try {
        const newMapping = {
            'openclaw': openclawService,
            'hermes': hermesService
        };
        const result = await window.electronAPI.updateServiceMapping(newMapping);
        
        if (result.success) {
            console.log('Service mapping updated on startup');
        } else {
            console.error(`Failed to update service mapping: ${result.error}`);
        }
    } catch (error) {
        console.error(`Error updating service mapping: ${error.message}`);
    }
    
    // Update polling interval
    updatePollInterval(parseInt(pollInterval, 10));
}

// Load settings when app starts
loadSettings();
// Agent Toggle Component (updated to use UIPreferences)
class AgentToggle {
    constructor() {
        this.currentAgent = uiPreferences.selectedAgent; // Load from preferences
    }
    
    // Set the current agent
    setAgent(agent) {
        if (agent !== 'openclaw' && agent !== 'hermes') {
            console.error('Invalid agent:', agent);
            return false;
        }
        
        this.currentAgent = agent;
        this.updateUI();
        uiPreferences.updateSelectedAgent(agent);
        this.updateCardVisibility();

        // If logs tab is visible, update it for the selected agent
        const logsTab = document.getElementById('tab-logs');
        if (logsTab && logsTab.style.display !== 'none') {
            updateLogsForAgent();
            refreshLogs(agent);
        }

        return true;
    }
    
    // Save agent preference via UIPreferences
    savePreference() {
        return uiPreferences.updateSelectedAgent(this.currentAgent);
    }
    
    // Load agent preference from UIPreferences
    loadPreference() {
        const prefs = uiPreferences.getPreferences();
        this.currentAgent = prefs.selectedAgent;
        console.log(`Agent preference loaded: ${this.currentAgent}`);
        return this.currentAgent;
    }
    
    // Update the toggle UI to reflect current state
    updateUI() {
        const toggle = document.getElementById('agent-toggle');
        if (!toggle) return;
        
        const openclawBtn = toggle.querySelector('.toggle-openclaw');
        const hermesBtn = toggle.querySelector('.toggle-hermes');
        
        if (openclawBtn && hermesBtn) {
            // Remove active class from both
            openclawBtn.classList.remove('active');
            hermesBtn.classList.remove('active');
            
            // Add active class to selected agent
            if (this.currentAgent === 'openclaw') {
                openclawBtn.classList.add('active');
            } else {
                hermesBtn.classList.add('active');
            }
        }
    }
    
    // Update card visibility based on selected agent
    updateCardVisibility() {
        const openclawCard = document.getElementById('card-openclaw');
        const hermesCard = document.getElementById('card-hermes');
        
        if (openclawCard && hermesCard) {
            if (this.currentAgent === 'openclaw') {
                openclawCard.style.display = 'flex';
                hermesCard.style.display = 'none';
            } else {
                openclawCard.style.display = 'none';
                hermesCard.style.display = 'flex';
            }
        }
    }
    
    // Initialize the toggle component
    initialize() {
        this.createToggleElement();
        this.updateUI();
        this.updateCardVisibility();
    }
    
    // Create the toggle element if it doesn't exist
    createToggleElement() {
        if (document.getElementById('agent-toggle')) {
            return; // Already exists
        }
        
        // Create toggle container
        const toggleContainer = document.createElement('div');
        toggleContainer.id = 'agent-toggle';
        toggleContainer.className = 'agent-toggle';
        
        // Create OpenClaw button
        const openclawBtn = document.createElement('button');
        openclawBtn.className = 'toggle-segment toggle-openclaw';
        openclawBtn.textContent = 'OpenClaw';
        openclawBtn.addEventListener('click', () => this.setAgent('openclaw'));
        
        // Create Hermes button
        const hermesBtn = document.createElement('button');
        hermesBtn.className = 'toggle-segment toggle-hermes';
        hermesBtn.textContent = 'Hermes';
        hermesBtn.addEventListener('click', () => this.setAgent('hermes'));
        
        // Append buttons to container
        toggleContainer.appendChild(openclawBtn);
        toggleContainer.appendChild(hermesBtn);
        
        // Enhanced placement logic with space constraint checking
        this.placeToggleElement(toggleContainer);
    }
    
    // Enhanced toggle placement logic with space constraint checking
    placeToggleElement(toggleContainer) {
        // First try: top-right corner placement (in control modal area)
        const controlModal = document.querySelector('.window-controls');
        if (controlModal && controlModal.parentElement) {
            // Check if there's enough space in the title-bar
            const titleBar = controlModal.closest('.title-bar');
            if (titleBar) {
                // Calculate available space
                const titleBarWidth = titleBar.offsetWidth;
                const windowControlsWidth = controlModal.offsetWidth;
                const appTitleWidth = titleBar.querySelector('.app-title')?.offsetWidth || 0;
                const toggleWidth = 180; // Minimum width from CSS: min-width: 180px
                
                // Estimate available space (total width - app title width - window controls width)
                const availableSpace = titleBarWidth - appTitleWidth - windowControlsWidth - 30; // 30px for padding/margins
                
                if (availableSpace >= toggleWidth) {
                    // There's enough space - place in top-right corner before window controls
                    controlModal.parentElement.insertBefore(toggleContainer, controlModal);
                    console.log('Toggle placed in top-right corner (control modal area)');
                    return;
                } else {
                    console.log(`Top-right placement constrained: available space ${availableSpace}px < toggle width ${toggleWidth}px`);
                }
            }
        }
        
        // Second try: section header placement (fallback)
        const mainNav = document.querySelector('.main-nav');
        if (mainNav && mainNav.parentElement) {
            // Check if there's enough space in the navigation area
            const navContainer = mainNav.parentElement;
            const navWidth = navContainer.offsetWidth;
            const toggleWidth = 180; // Minimum width from CSS
            
            if (navWidth >= toggleWidth) {
                // Place at top of section header (before main navigation)
                navContainer.insertBefore(toggleContainer, mainNav);
                console.log('Toggle placed at top of section header (fallback position)');
                return;
            } else {
                console.log(`Section header placement constrained: nav width ${navWidth}px < toggle width ${toggleWidth}px`);
            }
        }
        
        // Last resort: add to body (should rarely happen)
        document.body.insertBefore(toggleContainer, document.body.firstChild);
        console.log('Toggle placed in body (last resort)');
    }
}

// UI Preferences Model with Persistence
class UIPreferences {
    constructor() {
        this.windowWidth = 370; // Default compact width
        this.windowHeight = 565; // Default height (maintains current height)
        this.selectedAgent = 'openclaw'; // Default agent
        this.compactMode = true; // Default compact mode (width ≤ 370px)
        this.lastUpdated = new Date(); // Current timestamp
        
        this.loadPreferences();
    }
    
    // Save all preferences to localStorage
    savePreferences() {
        try {
            const preferences = {
                windowWidth: this.windowWidth,
                windowHeight: this.windowHeight,
                selectedAgent: this.selectedAgent,
                compactMode: this.compactMode,
                lastUpdated: this.lastUpdated.toISOString()
            };
            
            // Save individual keys for backward compatibility
            localStorage.setItem('agentflow-window-size', `${this.windowWidth},${this.windowHeight}`);
            localStorage.setItem('agentflow-selected-agent', this.selectedAgent);
            localStorage.setItem('agentflow-compact-mode', this.compactMode.toString());
            localStorage.setItem('agentflow-last-save', this.lastUpdated.toISOString());
            
            // Also save as JSON for structured access
            localStorage.setItem('agentflow-preferences', JSON.stringify(preferences));
            
            console.log(`UI preferences saved: ${JSON.stringify(preferences)}`);
            return true;
        } catch (error) {
            console.error('Failed to save UI preferences:', error);
            
            // Handle specific error types
            if (error.name === 'QuotaExceededError' || error.code === 22) {
                console.warn('LocalStorage quota exceeded. Clearing old data and retrying...');
                this.handleStorageQuotaExceeded();
                return false;
            } else if (error.name === 'SecurityError') {
                console.warn('Security error: localStorage access denied');
                return false;
            } else {
                console.warn('Unknown storage error:', error);
                return false;
            }
        }
    }
    
    // Load preferences from localStorage
    loadPreferences() {
        try {
            // Try to load from structured JSON first
            const jsonPrefs = localStorage.getItem('agentflow-preferences');
            if (jsonPrefs) {
                const parsed = JSON.parse(jsonPrefs);
                if (this.validatePreferences(parsed)) {
                    this.windowWidth = parsed.windowWidth;
                    this.windowHeight = parsed.windowHeight;
                    this.selectedAgent = parsed.selectedAgent;
                    this.compactMode = parsed.compactMode;
                    this.lastUpdated = new Date(parsed.lastUpdated);
                    console.log(`UI preferences loaded from JSON: ${JSON.stringify(parsed)}`);
                    return parsed;
                }
            }
            
            // Fallback to individual keys for backward compatibility
            const windowSize = localStorage.getItem('agentflow-window-size');
            const selectedAgent = localStorage.getItem('agentflow-selected-agent');
            const compactMode = localStorage.getItem('agentflow-compact-mode');
            const lastSave = localStorage.getItem('agentflow-last-save');
            
            let loadedPrefs = {
                windowWidth: this.windowWidth,
                windowHeight: this.windowHeight,
                selectedAgent: this.selectedAgent,
                compactMode: this.compactMode,
                lastUpdated: this.lastUpdated
            };
            
            if (windowSize) {
                const [width, height] = windowSize.split(',').map(Number);
                if (this.isValidSize(width, height)) {
                    loadedPrefs.windowWidth = width;
                    loadedPrefs.windowHeight = height;
                    this.windowWidth = width;
                    this.windowHeight = height;
                } else {
                    console.warn('Invalid window size in localStorage, using defaults');
                    // Reset to defaults
                    this.windowWidth = 370;
                    this.windowHeight = 565;
                    loadedPrefs.windowWidth = 370;
                    loadedPrefs.windowHeight = 565;
                }
            }
            
            if (selectedAgent === 'openclaw' || selectedAgent === 'hermes') {
                loadedPrefs.selectedAgent = selectedAgent;
                this.selectedAgent = selectedAgent;
            } else if (selectedAgent) {
                console.warn(`Invalid agent selection "${selectedAgent}" in localStorage, defaulting to "openclaw"`);
                // Reset to default
                this.selectedAgent = 'openclaw';
                loadedPrefs.selectedAgent = 'openclaw';
            }
            
            if (compactMode === 'true' || compactMode === 'false') {
                loadedPrefs.compactMode = compactMode === 'true';
                this.compactMode = compactMode === 'true';
            }
            
            if (lastSave) {
                try {
                    loadedPrefs.lastUpdated = new Date(lastSave);
                    this.lastUpdated = new Date(lastSave);
                } catch (dateError) {
                    console.warn('Invalid date in localStorage, using current time');
                    this.lastUpdated = new Date();
                    loadedPrefs.lastUpdated = this.lastUpdated;
                }
            }
            
            // Update compact mode based on window width
            this.compactMode = this.windowWidth <= 370;
            loadedPrefs.compactMode = this.compactMode;
            
            console.log(`UI preferences loaded: ${JSON.stringify(loadedPrefs)}`);
            return loadedPrefs;
        } catch (error) {
            console.error('Failed to load UI preferences:', error);
            
            // Handle specific error types
            if (error.name === 'SecurityError') {
                console.warn('Security error: localStorage access denied');
            } else if (error instanceof SyntaxError) {
                console.warn('Syntax error: Corrupted JSON in localStorage');
            }
            
            // Return defaults if loading fails
            return {
                windowWidth: this.windowWidth,
                windowHeight: this.windowHeight,
                selectedAgent: this.selectedAgent,
                compactMode: this.compactMode,
                lastUpdated: this.lastUpdated
            };
        }
    }
    
    // Handle localStorage quota exceeded error
    handleStorageQuotaExceeded() {
        try {
            // Try to clear old data
            const keysToKeep = [
                'agentflow-preferences',
                'agentflow-window-size',
                'agentflow-selected-agent',
                'agentflow-compact-mode',
                'agentflow-last-save'
            ];
            
            // Get all keys
            const allKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!keysToKeep.includes(key)) {
                    allKeys.push(key);
                }
            }
            
            // Remove non-essential keys
            allKeys.forEach(key => {
                localStorage.removeItem(key);
                console.log(`Cleared old data: ${key}`);
            });
            
            // Try saving again with minimal data
            const minimalPrefs = {
                windowWidth: this.windowWidth,
                windowHeight: this.windowHeight,
                selectedAgent: this.selectedAgent,
                compactMode: this.compactMode,
                lastUpdated: this.lastUpdated.toISOString()
            };
            
            localStorage.setItem('agentflow-preferences', JSON.stringify(minimalPrefs));
            console.log('Successfully saved minimal preferences after clearing quota');
            return true;
        } catch (clearError) {
            console.error('Failed to clear storage quota:', clearError);
            return false;
        }
    }
    
    // Validate preferences object
    validatePreferences(prefs) {
        return prefs &&
               typeof prefs.windowWidth === 'number' &&
               typeof prefs.windowHeight === 'number' &&
               (prefs.selectedAgent === 'openclaw' || prefs.selectedAgent === 'hermes') &&
               typeof prefs.compactMode === 'boolean' &&
               prefs.lastUpdated &&
               !isNaN(new Date(prefs.lastUpdated).getTime()) &&
               this.isValidSize(prefs.windowWidth, prefs.windowHeight);
    }
    
    // Validate window size
    isValidSize(width, height) {
        return Number.isInteger(width) && Number.isInteger(height) &&
               width >= 370 && width <= 740 &&
               height >= 400 && height <= 800;
    }
    
    // Update window size
    updateWindowSize(width, height) {
        if (this.isValidSize(width, height)) {
            this.windowWidth = width;
            this.windowHeight = height;
            this.compactMode = width <= 370;
            this.lastUpdated = new Date();
            return this.savePreferences();
        }
        return false;
    }
    
    // Update selected agent
    updateSelectedAgent(agent) {
        if (agent === 'openclaw' || agent === 'hermes') {
            this.selectedAgent = agent;
            this.lastUpdated = new Date();
            return this.savePreferences();
        }
        return false;
    }
    
    // Update compact mode (usually derived from window width)
    updateCompactMode(isCompact) {
        this.compactMode = Boolean(isCompact);
        this.lastUpdated = new Date();
        return this.savePreferences();
    }
    
    // Get all preferences
    getPreferences() {
        return {
            windowWidth: this.windowWidth,
            windowHeight: this.windowHeight,
            selectedAgent: this.selectedAgent,
            compactMode: this.compactMode,
            lastUpdated: this.lastUpdated
        };
    }
    
    // Get window size
    getWindowSize() {
        return { width: this.windowWidth, height: this.windowHeight };
    }
    
    // Check if compact mode is active
    isCompactMode() {
        return this.compactMode;
    }
    
    // Apply window size via Electron API
    async applyWindowSize() {
        try {
            if (window.electronAPI && window.electronAPI.resizeWindow) {
                await window.electronAPI.resizeWindow(this.windowWidth, this.windowHeight);
                this.savePreferences();
                return true;
            } else {
                console.warn('Electron API resizeWindow not available');
                return false;
            }
        } catch (error) {
            console.error('Failed to apply window size:', error);
            return false;
        }
    }
    
    // Restore saved preferences on startup
    async restorePreferences() {
        try {
            // First load from localStorage
            this.loadPreferences();
            
            // Then sync with main process preferences if available
            if (window.electronAPI && window.electronAPI.getWindowPreferences) {
                const mainPrefs = await window.electronAPI.getWindowPreferences();
                if (mainPrefs && this.isValidSize(mainPrefs.width, mainPrefs.height)) {
                    // Update with main process preferences (they handle screen constraints)
                    this.windowWidth = mainPrefs.width;
                    this.windowHeight = mainPrefs.height;
                    this.compactMode = mainPrefs.width <= 370;
                    this.lastUpdated = new Date();
                    
                    // Save back to localStorage for consistency
                    this.savePreferences();
                }
            }
            
            return await this.applyWindowSize();
        } catch (error) {
            console.error('Failed to restore preferences:', error);
            // Fall back to local preferences
            return await this.applyWindowSize();
        }
    }
}

// Initialize UI preferences
const uiPreferences = new UIPreferences();

// Window Size Manager with Persistence (updated to use UIPreferences)
class WindowSizeManager {
    constructor() {
        this.width = uiPreferences.windowWidth;
        this.height = uiPreferences.windowHeight;
    }
    
    // Save window size to localStorage via UIPreferences
    saveSize(width, height) {
        return uiPreferences.updateWindowSize(width, height);
    }
    
    // Load window size from UIPreferences
    loadSize() {
        const prefs = uiPreferences.getPreferences();
        this.width = prefs.windowWidth;
        this.height = prefs.windowHeight;
        return { width: this.width, height: this.height };
    }
    
    // Validate window size
    isValidSize(width, height) {
        return uiPreferences.isValidSize(width, height);
    }
    
    // Apply window size via Electron API
    async applySize(width, height) {
        if (this.isValidSize(width, height)) {
            uiPreferences.updateWindowSize(width, height);
            return await uiPreferences.applyWindowSize();
        }
        return false;
    }
    
    // Restore saved window size on startup
    async restoreSize() {
        return await uiPreferences.restorePreferences();
    }
    
    // Get current size
    getSize() {
        return uiPreferences.getWindowSize();
    }
    
    // Check if compact mode is active (width ≤ 370px)
    isCompactMode() {
        return uiPreferences.isCompactMode();
    }
}

// Initialize window size manager
const windowSizeManager = new WindowSizeManager();

// Initialize agent toggle
const agentToggle = new AgentToggle();

// Apply responsive CSS classes based on window size
function applyResponsiveClasses() {
    const { width } = windowSizeManager.getSize();
    const body = document.body;
    
    // Remove existing responsive classes
    body.classList.remove('compact-mode', 'single-column', 'grid-layout');
    
    // Apply appropriate classes with smooth transitions
    if (width <= 370) {
        body.classList.add('compact-mode');
        body.classList.add('single-column');
        console.log('Layout mode: Compact (≤370px)');
    } else if (width <= 500) {
        body.classList.add('single-column');
        console.log('Layout mode: Single column (≤500px)');
    } else {
        body.classList.add('grid-layout');
        console.log('Layout mode: Grid (>500px)');
    }
    
    // Update compact mode in preferences
    uiPreferences.updateCompactMode(width <= 370);
    
    // Update CSS custom properties based on window size
    updateCSSVariables(width);
    
    // Dispatch custom event for layout change
    const event = new CustomEvent('layoutmodechange', {
        detail: {
            width: width,
            mode: width <= 370 ? 'compact' : width <= 500 ? 'single-column' : 'grid'
        }
    });
    document.dispatchEvent(event);
}

// Update CSS custom properties dynamically
function updateCSSVariables(windowWidth) {
    const root = document.documentElement;
    
    // Calculate scaling factor (0.8 to 1.2 based on window width)
    const scaleFactor = Math.max(0.8, Math.min(1.2, windowWidth / 370));
    
    // Enhanced scaling for compact mode - ensure minimum readability
    const isCompactMode = windowWidth <= 370;
    const compactScaleFactor = isCompactMode ? 0.85 : scaleFactor; // Slightly larger scale for compact mode
    
    // Update font scale variables with minimum sizes enforced
    root.style.setProperty('--font-scale', `clamp(${0.8 * compactScaleFactor}rem, ${2 * compactScaleFactor}vw, ${1 * compactScaleFactor}rem)`);
    root.style.setProperty('--font-scale-sm', `clamp(${0.7 * compactScaleFactor}rem, ${1.8 * compactScaleFactor}vw, ${0.9 * compactScaleFactor}rem)`);
    root.style.setProperty('--font-scale-xs', `clamp(${0.6 * compactScaleFactor}rem, ${1.6 * compactScaleFactor}vw, ${0.8 * compactScaleFactor}rem)`);
    root.style.setProperty('--font-scale-min', '0.6rem'); // Absolute minimum font size
    
    // Update spacing variables
    root.style.setProperty('--spacing-base', `clamp(${0.5 * scaleFactor}rem, ${1.5 * scaleFactor}vw, ${1 * scaleFactor}rem)`);
    root.style.setProperty('--spacing-sm', `clamp(${0.25 * scaleFactor}rem, ${1 * scaleFactor}vw, ${0.5 * scaleFactor}rem)`);
    root.style.setProperty('--spacing-lg', `clamp(${1 * scaleFactor}rem, ${2 * scaleFactor}vw, ${1.5 * scaleFactor}rem)`);
    
    // Update component sizes — ring fills available card width
    const statusRingSize = `clamp(140px, 55vw, 240px)`;

    const statusTextSize = `clamp(0.7rem, 1.8vw, 0.95rem)`;
    
    root.style.setProperty('--status-ring-size', statusRingSize);
    root.style.setProperty('--status-text-size', statusTextSize);
    root.style.setProperty('--status-text-min-size', '0.5rem'); // Absolute minimum status text size
    root.style.setProperty('--activity-monitor-height', `clamp(${56 * scaleFactor}px, ${15 * scaleFactor}vw, ${80 * scaleFactor}px)`);
    
    // Ensure minimum touch target sizes for accessibility
    root.style.setProperty('--action-btn-min-height', '44px');
    root.style.setProperty('--action-btn-min-width', '44px');
}

// Initialize responsive system on startup
document.addEventListener('DOMContentLoaded', () => {
    // Initialize layout mode manager with current window size
    const { width } = windowSizeManager.getSize();
    layoutModeManager.hasModeChanged(width); // Set initial mode
    
    // Apply responsive classes based on saved window size
    applyResponsiveClasses();
    
    // Update card layout for initial mode
    updateCardLayoutForMode(layoutModeManager.getMode());
    
    // Initialize agent toggle
    agentToggle.initialize();
    
    // Restore preferences on startup
    uiPreferences.restorePreferences().then(success => {
        if (success) {
            console.log('UI preferences restored successfully');
            // Re-apply responsive classes after restore
            const { width: restoredWidth } = windowSizeManager.getSize();
            layoutModeManager.hasModeChanged(restoredWidth);
            applyResponsiveClasses();
            updateCardLayoutForMode(layoutModeManager.getMode());
        } else {
            console.log('Using default UI preferences');
        }
    });
});

// Layout mode detection and management
class LayoutModeManager {
    constructor() {
        this.currentMode = 'grid'; // grid, single-column, compact
        this.breakpoints = {
            compact: 370,
            singleColumn: 500,
            grid: 501
        };
    }
    
    // Detect layout mode based on window width
    detectMode(width) {
        if (width <= this.breakpoints.compact) {
            return 'compact';
        } else if (width <= this.breakpoints.singleColumn) {
            return 'single-column';
        } else {
            return 'grid';
        }
    }
    
    // Check if layout mode has changed
    hasModeChanged(newWidth) {
        const newMode = this.detectMode(newWidth);
        const changed = newMode !== this.currentMode;
        if (changed) {
            console.log(`Layout mode changed: ${this.currentMode} → ${newMode}`);
            this.currentMode = newMode;
        }
        return changed;
    }
    
    // Get current mode
    getMode() {
        return this.currentMode;
    }
    
    // Get mode name for display
    getModeName() {
        const modeNames = {
            'grid': 'Grid Layout',
            'single-column': 'Single Column',
            'compact': 'Compact Mode'
        };
        return modeNames[this.currentMode] || this.currentMode;
    }
}

// Initialize layout mode manager
const layoutModeManager = new LayoutModeManager();

// Enhanced window resize handler with debouncing
let resizeTimeout;
function handleWindowResize(width, height) {
    // Save window size via UIPreferences
    uiPreferences.updateWindowSize(width, height);
    
    // Check if layout mode has changed
    const modeChanged = layoutModeManager.hasModeChanged(width);
    
    // Apply responsive classes
    applyResponsiveClasses();
    
    // If mode changed, trigger additional updates
    if (modeChanged) {
        updateCardLayoutForMode(layoutModeManager.getMode());
    }
}

// Update card layout for specific mode
function updateCardLayoutForMode(mode) {
    const cardsContainer = document.querySelector('.cards-container');
    if (!cardsContainer) return;
    
    // Add mode-specific class for additional styling
    cardsContainer.classList.remove('layout-grid', 'layout-single-column', 'layout-compact');
    cardsContainer.classList.add(`layout-${mode.replace('-', '')}`);
    
    // Update card visibility based on agent toggle
    // Always update card visibility to ensure only selected agent is shown
    if (typeof agentToggle !== 'undefined' && agentToggle.updateCardVisibility) {
        agentToggle.updateCardVisibility();
    }
    
    // Update layout indicator (for debugging/development)
    updateLayoutIndicator(mode);
}

// Update layout indicator display
function updateLayoutIndicator(mode) {
    let indicator = document.getElementById('layout-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'layout-indicator';
        indicator.className = 'layout-indicator';
        document.body.appendChild(indicator);
    }
    
    const modeName = layoutModeManager.getModeName();
    const { width } = windowSizeManager.getSize();
    indicator.textContent = `${modeName} (${width}px)`;
}

// Listen for window resize events (if Electron API provides them)
if (window.electronAPI && window.electronAPI.onWindowResize) {
    window.electronAPI.onWindowResize((width, height) => {
        // Debounce resize events to prevent excessive updates
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            handleWindowResize(width, height);
        }, 100); // 100ms debounce
    });
}

// Also listen for browser window resize (for development/testing)
window.addEventListener('resize', () => {
    // Only handle if we're not in Electron context or for testing
    if (!window.electronAPI || !window.electronAPI.onWindowResize) {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            handleWindowResize(width, height);
        }, 100);
    }
});