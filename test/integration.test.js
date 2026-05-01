/**
 * Integration Tests - AgentFlow Service Control
 * 
 * Tests for complete workflows and end-to-end scenarios
 */

// Mock child_process.exec
jest.mock('child_process', () => ({
    exec: jest.fn()
}));

const { exec } = require('child_process');
const ServiceManager = require('../service-manager');

describe('Integration Tests: Service Control Workflows', () => {
    let serviceManager;
    let originalConsoleError;
    
    beforeEach(() => {
        jest.clearAllMocks();
        serviceManager = require('../service-manager');
        // Reset service mapping to defaults before each test
        serviceManager.updateServiceMapping({
            'openclaw': 'openclaw-gateway',
            'hermes': 'hermes-gateway'
        });
        
        // Mock console.error to suppress error output during tests
        originalConsoleError = console.error;
        console.error = jest.fn();
    });
    
    afterEach(() => {
        // Restore original console.error
        console.error = originalConsoleError;
    });
    
    /**
     * Test 1: Service name mapping can be updated dynamically
     */
    test('Service name mapping can be updated and used', async () => {
        // Update service mapping
        serviceManager.updateServiceMapping({
            'openclaw': 'custom-openclaw-service',
            'hermes': 'custom-hermes-service'
        });
        
        // Mock exec to verify custom service name is used
        exec.mockImplementation((command, callback) => {
            expect(command).toBe('systemctl --user is-active custom-openclaw-service');
            callback(null, 'active\n', '');
        });
        
        const status = await serviceManager.getStatus('openclaw');
        expect(status).toBe('active');
        expect(exec).toHaveBeenCalledTimes(1);
    });
    
    /**
     * Test 2: Service mapping preserves defaults when partially updated
     */
    test('Service mapping preserves defaults when partially updated', () => {
        // Update only openclaw
        serviceManager.updateServiceMapping({
            'openclaw': 'custom-openclaw-service'
        });
        
        const mapping = serviceManager.getServiceMapping();
        expect(mapping.openclaw).toBe('custom-openclaw-service');
        expect(mapping.hermes).toBe('hermes-gateway'); // Default preserved
    });
    
    /**
     * Test 3: Unknown service identifier throws error
     */
    test('Unknown service identifier throws error in mapServiceName', () => {
        expect(() => serviceManager.mapServiceName('unknown-service'))
            .toThrow('Unknown service: unknown-service');
    });
    
    /**
     * Test 4: Service manager handles platform detection
     */
    test('Service manager handles non-linux platform', async () => {
        // Mock platform to be non-linux
        const originalPlatform = serviceManager.platform;
        Object.defineProperty(serviceManager, 'platform', { value: 'darwin' });
        
        const status = await serviceManager.getStatus('openclaw');
        const controlResult = await serviceManager.controlService('openclaw', 'start');
        const logs = await serviceManager.getLogs('openclaw', 50);
        
        expect(status).toBe('inactive');
        expect(controlResult).toEqual({ success: false });
        expect(logs).toBe('Log fetching not supported on darwin');
        
        // Restore original platform
        Object.defineProperty(serviceManager, 'platform', { value: originalPlatform });
    });
    
    /**
     * Test 5: Basic status check workflow
     */
    test('Basic status check workflow', async () => {
        exec.mockImplementation((command, callback) => {
            expect(command).toBe('systemctl --user is-active openclaw-gateway');
            callback(null, 'active\n', '');
        });
        
        const status = await serviceManager.getStatus('openclaw');
        expect(status).toBe('active');
        expect(exec).toHaveBeenCalledTimes(1);
    });
    
    /**
     * Test 6: Basic control service workflow
     */
    test('Basic control service workflow', async () => {
        exec.mockImplementation((command, callback) => {
            expect(command).toBe('systemctl --user start openclaw-gateway');
            callback(null, '', '');
        });
        
        await serviceManager.controlService('openclaw', 'start');
        expect(exec).toHaveBeenCalledTimes(1);
    });
    
    /**
     * Test 7: Basic log fetching workflow
     */
    test('Basic log fetching workflow', async () => {
        exec.mockImplementation((command, callback) => {
            expect(command).toBe('journalctl --user -u openclaw-gateway -n 50 --no-pager -o short-precise');
            callback(null, 'Log entry\n', '');
        });
        
        const logs = await serviceManager.getLogs('openclaw', 50);
        expect(logs).toBe('Log entry');
        expect(exec).toHaveBeenCalledTimes(1);
    });
});