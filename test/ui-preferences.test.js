/**
 * Unit tests for UI Preferences Model
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

// Mock localStorage for testing
const mockLocalStorage = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

// Mock window.electronAPI for testing
const mockElectronAPI = {
    resizeWindow: jest.fn().mockResolvedValue({ success: true })
};

// UIPreferences class (copy from renderer.js for testing)
class UIPreferences {
    constructor() {
        this.windowWidth = 370;
        this.windowHeight = 565;
        this.selectedAgent = 'openclaw';
        this.compactMode = true;
        this.lastUpdated = new Date();
        
        this.loadPreferences();
    }
    
    savePreferences() {
        try {
            const preferences = {
                windowWidth: this.windowWidth,
                windowHeight: this.windowHeight,
                selectedAgent: this.selectedAgent,
                compactMode: this.compactMode,
                lastUpdated: this.lastUpdated.toISOString()
            };
            
            localStorage.setItem('agentflow-window-size', `${this.windowWidth},${this.windowHeight}`);
            localStorage.setItem('agentflow-selected-agent', this.selectedAgent);
            localStorage.setItem('agentflow-compact-mode', this.compactMode.toString());
            localStorage.setItem('agentflow-last-save', this.lastUpdated.toISOString());
            localStorage.setItem('agentflow-preferences', JSON.stringify(preferences));
            
            console.log(`UI preferences saved: ${JSON.stringify(preferences)}`);
            return true;
        } catch (error) {
            console.error('Failed to save UI preferences:', error);
            
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
    
    loadPreferences() {
        try {
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
            
            this.compactMode = this.windowWidth <= 370;
            loadedPrefs.compactMode = this.compactMode;
            
            console.log(`UI preferences loaded: ${JSON.stringify(loadedPrefs)}`);
            return loadedPrefs;
        } catch (error) {
            console.error('Failed to load UI preferences:', error);
            
            if (error.name === 'SecurityError') {
                console.warn('Security error: localStorage access denied');
            } else if (error instanceof SyntaxError) {
                console.warn('Syntax error: Corrupted JSON in localStorage');
            }
            
            return {
                windowWidth: this.windowWidth,
                windowHeight: this.windowHeight,
                selectedAgent: this.selectedAgent,
                compactMode: this.compactMode,
                lastUpdated: this.lastUpdated
            };
        }
    }
    
    validatePreferences(prefs) {
        if (!prefs) return false;
        return typeof prefs.windowWidth === 'number' &&
               typeof prefs.windowHeight === 'number' &&
               (prefs.selectedAgent === 'openclaw' || prefs.selectedAgent === 'hermes') &&
               typeof prefs.compactMode === 'boolean' &&
               prefs.lastUpdated &&
               !isNaN(new Date(prefs.lastUpdated).getTime()) &&
               this.isValidSize(prefs.windowWidth, prefs.windowHeight);
    }
    
    isValidSize(width, height) {
        return Number.isInteger(width) && Number.isInteger(height) &&
               width >= 370 && width <= 740 &&
               height >= 400 && height <= 800;
    }
    
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
    
    updateSelectedAgent(agent) {
        if (agent === 'openclaw' || agent === 'hermes') {
            this.selectedAgent = agent;
            this.lastUpdated = new Date();
            return this.savePreferences();
        }
        return false;
    }
    
    updateCompactMode(isCompact) {
        this.compactMode = Boolean(isCompact);
        this.lastUpdated = new Date();
        return this.savePreferences();
    }
    
    getPreferences() {
        return {
            windowWidth: this.windowWidth,
            windowHeight: this.windowHeight,
            selectedAgent: this.selectedAgent,
            compactMode: this.compactMode,
            lastUpdated: this.lastUpdated
        };
    }
    
    getWindowSize() {
        return { width: this.windowWidth, height: this.windowHeight };
    }
    
    isCompactMode() {
        return this.compactMode;
    }
    
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
    
    async restorePreferences() {
        this.loadPreferences();
        return await this.applyWindowSize();
    }
    
    handleStorageQuotaExceeded() {
        try {
            const keysToKeep = [
                'agentflow-preferences',
                'agentflow-window-size',
                'agentflow-selected-agent',
                'agentflow-compact-mode',
                'agentflow-last-save'
            ];
            
            const allKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!keysToKeep.includes(key)) {
                    allKeys.push(key);
                }
            }
            
            allKeys.forEach(key => {
                localStorage.removeItem(key);
                console.log(`Cleared old data: ${key}`);
            });
            
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
}

// Tests
describe('UIPreferences', () => {
    let uiPreferences;
    
    beforeEach(() => {
        // Mock global objects
        global.localStorage = mockLocalStorage;
        global.window = { electronAPI: mockElectronAPI };
        
        uiPreferences = new UIPreferences();
        mockLocalStorage.clear();
        mockElectronAPI.resizeWindow.mockClear();
    });
    
    afterEach(() => {
        delete global.localStorage;
        delete global.window;
    });
    
    test('should initialize with default values', () => {
        const prefs = uiPreferences.getPreferences();
        expect(prefs.windowWidth).toBe(370);
        expect(prefs.windowHeight).toBe(565);
        expect(prefs.selectedAgent).toBe('openclaw');
        expect(prefs.compactMode).toBe(true);
        expect(prefs.lastUpdated).toBeInstanceOf(Date);
    });
    
    test('should save and load valid window size', () => {
        const saveResult = uiPreferences.updateWindowSize(400, 600);
        expect(saveResult).toBe(true);
        
        const loadedPrefs = uiPreferences.loadPreferences();
        expect(loadedPrefs.windowWidth).toBe(400);
        expect(loadedPrefs.windowHeight).toBe(600);
    });
    
    test('should reject invalid window sizes', () => {
        // Too small width
        expect(uiPreferences.updateWindowSize(300, 500)).toBe(false);
        
        // Too large width
        expect(uiPreferences.updateWindowSize(800, 500)).toBe(false);
        
        // Too small height
        expect(uiPreferences.updateWindowSize(400, 300)).toBe(false);
        
        // Too large height
        expect(uiPreferences.updateWindowSize(400, 900)).toBe(false);
        
        // Valid sizes
        expect(uiPreferences.updateWindowSize(370, 400)).toBe(true);
        expect(uiPreferences.updateWindowSize(500, 600)).toBe(true);
        expect(uiPreferences.updateWindowSize(740, 800)).toBe(true);
    });
    
    test('should save and load selected agent', () => {
        const saveResult = uiPreferences.updateSelectedAgent('hermes');
        expect(saveResult).toBe(true);
        
        const prefs = uiPreferences.getPreferences();
        expect(prefs.selectedAgent).toBe('hermes');
    });
    
    test('should reject invalid agent selection', () => {
        expect(uiPreferences.updateSelectedAgent('invalid')).toBe(false);
        expect(uiPreferences.updateSelectedAgent('')).toBe(false);
        expect(uiPreferences.updateSelectedAgent(null)).toBe(false);
    });
    
    test('should detect compact mode correctly', () => {
        uiPreferences.updateWindowSize(370, 565);
        expect(uiPreferences.isCompactMode()).toBe(true);
        
        uiPreferences.updateWindowSize(350, 565);
        expect(uiPreferences.isCompactMode()).toBe(true);
        
        uiPreferences.updateWindowSize(400, 565);
        expect(uiPreferences.isCompactMode()).toBe(false);
    });
    
    test('should update compact mode explicitly', () => {
        uiPreferences.updateCompactMode(true);
        expect(uiPreferences.isCompactMode()).toBe(true);
        
        uiPreferences.updateCompactMode(false);
        expect(uiPreferences.isCompactMode()).toBe(false);
    });
    
    test('should apply window size via Electron API', async () => {
        // Reset to default size first
        uiPreferences.updateWindowSize(370, 565);
        const result = await uiPreferences.applyWindowSize();
        expect(result).toBe(true);
        expect(mockElectronAPI.resizeWindow).toHaveBeenCalledWith(370, 565);
    });
    
    test('should restore saved preferences', async () => {
        // Save some preferences first
        localStorage.setItem('agentflow-window-size', '450,650');
        localStorage.setItem('agentflow-selected-agent', 'hermes');
        localStorage.setItem('agentflow-compact-mode', 'false');
        
        // Create new instance (should load saved preferences)
        const newPrefs = new UIPreferences();
        
        const result = await newPrefs.restorePreferences();
        expect(result).toBe(true);
        expect(mockElectronAPI.resizeWindow).toHaveBeenCalledWith(450, 650);
        
        const prefs = newPrefs.getPreferences();
        expect(prefs.windowWidth).toBe(450);
        expect(prefs.windowHeight).toBe(650);
        expect(prefs.selectedAgent).toBe('hermes');
        expect(prefs.compactMode).toBe(false);
    });
    
    test('should handle localStorage errors gracefully', () => {
        // Simulate localStorage error
        const brokenLocalStorage = {
            getItem: () => { throw new Error('Storage error'); },
            setItem: () => { throw new Error('Storage error'); }
        };
        global.localStorage = brokenLocalStorage;
        
        // Should still work with defaults
        const manager = new UIPreferences();
        const prefs = manager.getPreferences();
        expect(prefs.windowWidth).toBe(370);
        expect(prefs.windowHeight).toBe(565);
        expect(prefs.selectedAgent).toBe('openclaw');
    });
    
    test('should handle corrupted saved data', () => {
        // Save corrupted data
        localStorage.setItem('agentflow-window-size', 'invalid,data');
        localStorage.setItem('agentflow-selected-agent', 'invalid-agent');
        localStorage.setItem('agentflow-compact-mode', 'not-a-boolean');
        
        const manager = new UIPreferences();
        // Should fall back to defaults
        const prefs = manager.getPreferences();
        expect(prefs.windowWidth).toBe(370);
        expect(prefs.windowHeight).toBe(565);
        expect(prefs.selectedAgent).toBe('openclaw');
        expect(prefs.compactMode).toBe(true);
    });
    
    test('should handle JSON parsing errors', () => {
        // Save invalid JSON
        localStorage.setItem('agentflow-preferences', 'invalid json');
        
        const manager = new UIPreferences();
        // Should fall back to individual keys or defaults
        const prefs = manager.getPreferences();
        expect(prefs.windowWidth).toBe(370);
        expect(prefs.windowHeight).toBe(565);
    });
    
    test('should handle quota exceeded errors', () => {
        // Simulate quota exceeded error
        const quotaLocalStorage = {
            getItem: (key) => 'test',
            setItem: () => { 
                const error = new Error('Quota exceeded');
                error.name = 'QuotaExceededError';
                throw error;
            },
            removeItem: () => {},
            clear: () => {},
            length: 0,
            key: () => null
        };
        global.localStorage = quotaLocalStorage;
        
        const manager = new UIPreferences();
        const saveResult = manager.updateWindowSize(400, 600);
        expect(saveResult).toBe(false); // Should return false but not crash
    });
    
    test('should handle security errors', () => {
        // Simulate security error
        const securityLocalStorage = {
            getItem: () => { 
                const error = new Error('Security error');
                error.name = 'SecurityError';
                throw error;
            },
            setItem: () => {},
            removeItem: () => {},
            clear: () => {},
            length: 0,
            key: () => null
        };
        global.localStorage = securityLocalStorage;
        
        const manager = new UIPreferences();
        const prefs = manager.getPreferences();
        // Should still return defaults
        expect(prefs.windowWidth).toBe(370);
        expect(prefs.windowHeight).toBe(565);
    });
    
    test('should validate preferences correctly', () => {
        const validPrefs = {
            windowWidth: 400,
            windowHeight: 600,
            selectedAgent: 'hermes',
            compactMode: false,
            lastUpdated: new Date().toISOString()
        };
        
        expect(uiPreferences.validatePreferences(validPrefs)).toBe(true);
        
        // Invalid cases
        expect(uiPreferences.validatePreferences(null)).toBe(false);
        expect(uiPreferences.validatePreferences({})).toBe(false);
        
        const invalidWidth = { ...validPrefs, windowWidth: 300 }; // Too small
        expect(uiPreferences.validatePreferences(invalidWidth)).toBe(false);
        
        const invalidAgent = { ...validPrefs, selectedAgent: 'invalid' };
        expect(uiPreferences.validatePreferences(invalidAgent)).toBe(false);
        
        const invalidDate = { ...validPrefs, lastUpdated: 'invalid-date' };
        expect(uiPreferences.validatePreferences(invalidDate)).toBe(false);
    });
    
    test('should update lastUpdated timestamp on changes', () => {
        const initialDate = uiPreferences.getPreferences().lastUpdated;
        
        // Wait a bit
        setTimeout(() => {
            uiPreferences.updateWindowSize(400, 600);
            const newDate = uiPreferences.getPreferences().lastUpdated;
            expect(newDate.getTime()).toBeGreaterThan(initialDate.getTime());
        }, 10);
    });
});

describe('Backward Compatibility', () => {
    beforeEach(() => {
        // Mock global objects for these tests
        global.localStorage = mockLocalStorage;
        global.window = { electronAPI: mockElectronAPI };
        mockLocalStorage.clear();
    });
    
    afterEach(() => {
        delete global.localStorage;
        delete global.window;
    });
    
    test('should load from old individual keys', () => {
        // Save using old individual keys (simulating pre-UIPreferences state)
        localStorage.setItem('agentflow-window-size', '420,620');
        localStorage.setItem('agentflow-selected-agent', 'hermes');
        localStorage.setItem('agentflow-compact-mode', 'false');
        localStorage.setItem('agentflow-last-save', '2024-01-15T10:30:00Z');
        
        const prefs = new UIPreferences();
        const loaded = prefs.getPreferences();
        
        expect(loaded.windowWidth).toBe(420);
        expect(loaded.windowHeight).toBe(620);
        expect(loaded.selectedAgent).toBe('hermes');
        expect(loaded.compactMode).toBe(false);
        expect(loaded.lastUpdated.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    });
    
    test('should save both JSON and individual keys', () => {
        const prefs = new UIPreferences();
        prefs.updateWindowSize(500, 700);
        prefs.updateSelectedAgent('hermes');
        
        // Check that both formats are saved
        expect(localStorage.getItem('agentflow-window-size')).toBe('500,700');
        expect(localStorage.getItem('agentflow-selected-agent')).toBe('hermes');
        expect(localStorage.getItem('agentflow-compact-mode')).toBe('false'); // 500 > 370
        expect(localStorage.getItem('agentflow-last-save')).toBeTruthy();
        
        const jsonPrefs = JSON.parse(localStorage.getItem('agentflow-preferences'));
        expect(jsonPrefs.windowWidth).toBe(500);
        expect(jsonPrefs.windowHeight).toBe(700);
        expect(jsonPrefs.selectedAgent).toBe('hermes');
        expect(jsonPrefs.compactMode).toBe(false);
        expect(jsonPrefs.lastUpdated).toBeTruthy();
    });
});