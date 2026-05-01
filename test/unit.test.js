/**
 * Unit Tests - AgentFlow Service Control
 * 
 * Tests for individual functions and components using proper module imports
 */

// Mock child_process.exec before importing service-manager
jest.mock('child_process', () => ({
    exec: jest.fn()
}));

const { exec } = require('child_process');
const ServiceManager = require('../service-manager');

describe('Unit Tests: Service Control Functions', () => {
    let serviceManager;
    let originalConsoleError;
    
    beforeEach(() => {
        // Get the singleton instance
        serviceManager = require('../service-manager');
        jest.clearAllMocks();
        
        // Mock console.error to suppress error output during tests
        originalConsoleError = console.error;
        console.error = jest.fn();
    });
    
    afterEach(() => {
        // Restore original console.error
        console.error = originalConsoleError;
    });
    
    /**
     * Test 1: Service name mapping with valid names
     */
    test('Service name mapping accepts valid service names', () => {
        expect(serviceManager.mapServiceName('openclaw')).toBe('openclaw-gateway');
        expect(serviceManager.mapServiceName('hermes')).toBe('hermes-gateway');
    });

    /**
     * Test 2: Service name mapping rejects invalid names
     */
    test('Service name mapping rejects invalid service names', () => {
        expect(() => serviceManager.mapServiceName('invalid')).toThrow('Unknown service: invalid');
        expect(() => serviceManager.mapServiceName('unknown')).toThrow('Unknown service: unknown');
    });

    /**
     * Test 3: getStatus uses correct systemctl command for active service
     */
    test('getStatus returns active when systemctl returns active', async () => {
        exec.mockImplementation((command, callback) => {
            callback(null, 'active\n', '');
        });
        
        const status = await serviceManager.getStatus('openclaw');
        expect(status).toBe('active');
        expect(exec).toHaveBeenCalledWith(
            'systemctl --user is-active openclaw-gateway',
            expect.any(Function)
        );
    });

    /**
     * Test 4: getStatus returns inactive when systemctl returns inactive
     */
    test('getStatus returns inactive when systemctl returns inactive', async () => {
        exec.mockImplementation((command, callback) => {
            const error = new Error('Command failed');
            error.code = 3;
            callback(error, 'inactive\n', '');
        });
        
        const status = await serviceManager.getStatus('hermes');
        expect(status).toBe('inactive');
    });

    /**
     * Test 5: getStatus returns not-installed when service not found
     */
    test('getStatus returns not-installed when service not found', async () => {
        exec.mockImplementation((command, callback) => {
            const error = new Error('Command failed');
            error.code = 4;
            callback(error, '', 'Unit openclaw-gateway.service not found.');
        });
        
        const status = await serviceManager.getStatus('openclaw');
        expect(status).toBe('not-installed');
    });

    /**
     * Test 6: getStatus returns error on other failures
     */
    test('getStatus returns error on other failures', async () => {
        exec.mockImplementation((command, callback) => {
            const error = new Error('Permission denied');
            error.code = 1;
            callback(error, '', 'Permission denied');
        });
        
        const status = await serviceManager.getStatus('hermes');
        expect(status).toBe('error');
    });

    /**
     * Test 7: controlService uses correct systemctl command
     */
    test('controlService uses systemctl --user with correct service name', async () => {
        exec.mockImplementation((command, callback) => {
            callback(null, '', '');
        });
        
        await serviceManager.controlService('openclaw', 'start');
        expect(exec).toHaveBeenCalledWith(
            'systemctl --user start openclaw-gateway',
            expect.any(Function)
        );
    });

    /**
     * Test 8: controlService rejects on error
     */
    test('controlService rejects promise on command failure', async () => {
        exec.mockImplementation((command, callback) => {
            const error = new Error('Failed to start service');
            callback(error, '', 'Unit not found');
        });
        
        await expect(serviceManager.controlService('hermes', 'start'))
            .rejects.toThrow('Failed to start hermes: Unit not found');
    });

    /**
     * Test 9: getLogs uses journalctl with correct parameters
     */
    test('getLogs uses journalctl --user with correct service name', async () => {
        exec.mockImplementation((command, callback) => {
            callback(null, 'Apr 30 10:15:23 systemd[1234]: Started openclaw-gateway.service\n', '');
        });
        
        const logs = await serviceManager.getLogs('openclaw', 50);
        expect(exec).toHaveBeenCalledWith(
            'journalctl --user -u openclaw-gateway -n 50 --no-pager -o short-precise',
            expect.any(Function)
        );
        expect(logs).toContain('openclaw-gateway.service');
    });

    /**
     * Test 10: getLogs returns message when no logs found
     */
    test('getLogs returns message when journalctl returns no output', async () => {
        exec.mockImplementation((command, callback) => {
            callback(null, '', '');
        });
        
        const logs = await serviceManager.getLogs('hermes', 20);
        expect(logs).toContain('No recent logs for hermes-gateway');
    });

    /**
     * Test 11: getLogs handles journalctl errors gracefully
     */
    test('getLogs handles journalctl errors gracefully', async () => {
        exec.mockImplementation((command, callback) => {
            const error = new Error('No journal files found');
            error.code = 1;
            callback(error, '', 'No journal files found');
        });
        
        const logs = await serviceManager.getLogs('openclaw', 30);
        expect(logs).toContain('No logs found for openclaw-gateway');
    });

    /**
     * Test 12: Service manager is singleton
     */
    test('Service manager is exported as singleton', () => {
        const anotherInstance = require('../service-manager');
        expect(serviceManager).toBe(anotherInstance);
    });

    /**
     * Test 13: Platform detection works
     */
    test('Service manager detects platform', () => {
        expect(serviceManager.platform).toBeDefined();
    });

    /**
     * Test 14: Non-linux platform returns inactive for getStatus
     */
    test('getStatus returns inactive on non-linux platforms', async () => {
        // Mock platform to be non-linux
        const originalPlatform = serviceManager.platform;
        Object.defineProperty(serviceManager, 'platform', { value: 'darwin' });
        
        const status = await serviceManager.getStatus('openclaw');
        expect(status).toBe('inactive');
        
        // Restore original platform
        Object.defineProperty(serviceManager, 'platform', { value: originalPlatform });
    });

    /**
     * Test 15: Error in mapServiceName returns error status
     */
    test('Error in mapServiceName returns error status', async () => {
        // Mock mapServiceName to throw
        const originalMapServiceName = serviceManager.mapServiceName;
        serviceManager.mapServiceName = () => { throw new Error('Mapping error'); };
        
        const status = await serviceManager.getStatus('openclaw');
        expect(status).toBe('error');
        
        // Restore original method
        serviceManager.mapServiceName = originalMapServiceName;
    });
});
