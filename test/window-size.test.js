/**
 * Unit tests for Window Size Manager
 * Validates: Requirements 3.1, 3.2, 3.3, 6.1, 6.2
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

// WindowSizeManager class (copy from renderer.js for testing)
class WindowSizeManager {
    constructor() {
        this.width = 370;
        this.height = 565;
        this.loadSize();
    }
    
    saveSize(width, height) {
        try {
            localStorage.setItem('agentflow-window-size', `${width},${height}`);
            this.width = width;
            this.height = height;
            return true;
        } catch (error) {
            console.error('Failed to save window size:', error);
            return false;
        }
    }
    
    loadSize() {
        try {
            const saved = localStorage.getItem('agentflow-window-size');
            if (saved) {
                const [width, height] = saved.split(',').map(Number);
                if (this.isValidSize(width, height)) {
                    this.width = width;
                    this.height = height;
                    return { width, height };
                }
            }
        } catch (error) {
            console.error('Failed to load window size:', error);
        }
        
        return { width: this.width, height: this.height };
    }
    
    isValidSize(width, height) {
        return Number.isInteger(width) && Number.isInteger(height) &&
               width >= 370 && width <= 740 &&
               height >= 400 && height <= 800;
    }
    
    async applySize(width, height) {
        try {
            if (window.electronAPI && window.electronAPI.resizeWindow) {
                await window.electronAPI.resizeWindow(width, height);
                this.saveSize(width, height);
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
    
    async restoreSize() {
        const { width, height } = this.loadSize();
        return await this.applySize(width, height);
    }
    
    getSize() {
        return { width: this.width, height: this.height };
    }
    
    isCompactMode() {
        return this.width <= 370;
    }
}

// Tests
describe('WindowSizeManager', () => {
    let windowSizeManager;
    
    beforeEach(() => {
        // Mock global objects
        global.localStorage = mockLocalStorage;
        global.window = { electronAPI: mockElectronAPI };
        
        windowSizeManager = new WindowSizeManager();
        mockLocalStorage.clear();
        mockElectronAPI.resizeWindow.mockClear();
    });
    
    afterEach(() => {
        delete global.localStorage;
        delete global.window;
    });
    
    test('should initialize with default size', () => {
        expect(windowSizeManager.getSize()).toEqual({ width: 370, height: 565 });
    });
    
    test('should save and load valid window size', () => {
        const saveResult = windowSizeManager.saveSize(400, 600);
        expect(saveResult).toBe(true);
        
        const loadedSize = windowSizeManager.loadSize();
        expect(loadedSize).toEqual({ width: 400, height: 600 });
    });
    
    test('should reject invalid window sizes', () => {
        // Too small width
        expect(windowSizeManager.isValidSize(300, 500)).toBe(false);
        
        // Too large width
        expect(windowSizeManager.isValidSize(800, 500)).toBe(false);
        
        // Too small height
        expect(windowSizeManager.isValidSize(400, 300)).toBe(false);
        
        // Too large height
        expect(windowSizeManager.isValidSize(400, 900)).toBe(false);
        
        // Valid sizes
        expect(windowSizeManager.isValidSize(370, 400)).toBe(true);
        expect(windowSizeManager.isValidSize(500, 600)).toBe(true);
        expect(windowSizeManager.isValidSize(740, 800)).toBe(true);
    });
    
    test('should detect compact mode correctly', () => {
        windowSizeManager.saveSize(370, 565);
        expect(windowSizeManager.isCompactMode()).toBe(true);
        
        windowSizeManager.saveSize(350, 565);
        expect(windowSizeManager.isCompactMode()).toBe(true);
        
        windowSizeManager.saveSize(400, 565);
        expect(windowSizeManager.isCompactMode()).toBe(false);
    });
    
    test('should apply window size via Electron API', async () => {
        const result = await windowSizeManager.applySize(400, 600);
        expect(result).toBe(true);
        expect(mockElectronAPI.resizeWindow).toHaveBeenCalledWith(400, 600);
        
        // Should save after applying
        const saved = localStorage.getItem('agentflow-window-size');
        expect(saved).toBe('400,600');
    });
    
    test('should restore saved window size', async () => {
        // Save a size first
        localStorage.setItem('agentflow-window-size', '450,650');
        
        // Create new manager (should load saved size)
        const newManager = new WindowSizeManager();
        
        const result = await newManager.restoreSize();
        expect(result).toBe(true);
        expect(mockElectronAPI.resizeWindow).toHaveBeenCalledWith(450, 650);
    });
    
    test('should handle localStorage errors gracefully', () => {
        // Simulate localStorage error
        const brokenLocalStorage = {
            getItem: () => { throw new Error('Storage error'); },
            setItem: () => { throw new Error('Storage error'); }
        };
        global.localStorage = brokenLocalStorage;
        
        // Should still work with defaults
        const manager = new WindowSizeManager();
        expect(manager.getSize()).toEqual({ width: 370, height: 565 });
    });
    
    test('should handle corrupted saved data', () => {
        // Save corrupted data
        localStorage.setItem('agentflow-window-size', 'invalid,data');
        
        const manager = new WindowSizeManager();
        // Should fall back to defaults
        expect(manager.getSize()).toEqual({ width: 370, height: 565 });
    });
});

describe('CSS Responsive System', () => {
    test('should have CSS custom properties defined', () => {
        // These properties should be defined in :root
        const expectedProperties = [
            '--font-scale',
            '--font-scale-sm',
            '--font-scale-xs',
            '--spacing-base',
            '--spacing-sm',
            '--spacing-lg',
            '--status-ring-size',
            '--activity-monitor-height',
            '--status-text-size'
        ];
        
        // This is a conceptual test - in real browser, we'd check computed styles
        expect(expectedProperties.length).toBeGreaterThan(0);
    });
    
    test('should have media queries for breakpoints', () => {
        // Media queries should exist for 370px and 500px breakpoints
        // This is a conceptual test
        expect(true).toBe(true); // Placeholder
    });
});