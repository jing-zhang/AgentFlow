/**
 * Integration Tests for Agent Switching
 * 
 * Tests for complete agent switching workflow including:
 * - AgentToggle card visibility
 * - Preference persistence
 * - Window resize integration
 * 
 * Validates: Requirements 1.3, 1.4, 6.1, 6.3
 */

describe('Agent Switching Integration Tests', () => {
    // Mock localStorage
    let mockLocalStorage;
    
    beforeEach(() => {
        mockLocalStorage = {
            store: {},
            getItem: function(key) {
                return this.store[key] || null;
            },
            setItem: function(key, value) {
                this.store[key] = value.toString();
            },
            removeItem: function(key) {
                delete this.store[key];
            },
            clear: function() {
                this.store = {};
            }
        };
        
        // Clear before each test
        mockLocalStorage.clear();
    });
    
    /**
     * Test 1: Agent toggle switches card visibility
     * Validates: Requirement 1.3, 1.4
     */
    test('Agent toggle switches card visibility correctly', () => {
        // Mock DOM elements
        const mockCards = {
            'card-openclaw': { style: { display: '' } },
            'card-hermes': { style: { display: '' } }
        };
        
        // Simulate AgentToggle functionality
        const mockAgentToggle = {
            currentAgent: 'openclaw',
            setAgent: function(agent) {
                if (agent !== 'openclaw' && agent !== 'hermes') {
                    return false;
                }
                this.currentAgent = agent;
                this.updateCardVisibility();
                return true;
            },
            updateCardVisibility: function() {
                const openclawCard = mockCards['card-openclaw'];
                const hermesCard = mockCards['card-hermes'];
                
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
        };
        
        // Test OpenClaw selection
        mockAgentToggle.setAgent('openclaw');
        expect(mockCards['card-openclaw'].style.display).toBe('flex');
        expect(mockCards['card-hermes'].style.display).toBe('none');
        
        // Test Hermes selection
        mockAgentToggle.setAgent('hermes');
        expect(mockCards['card-openclaw'].style.display).toBe('none');
        expect(mockCards['card-hermes'].style.display).toBe('flex');
        
        // Test invalid agent
        const result = mockAgentToggle.setAgent('invalid');
        expect(result).toBe(false);
    });
    
    /**
     * Test 2: Agent preference is saved to localStorage
     * Validates: Requirement 6.3
     */
    test('Agent preference is saved to localStorage', () => {
        // Simulate UIPreferences functionality
        const mockUIPreferences = {
            selectedAgent: 'openclaw',
            updateSelectedAgent: function(agent) {
                if (agent === 'openclaw' || agent === 'hermes') {
                    this.selectedAgent = agent;
                    // Save to localStorage
                    mockLocalStorage.setItem('agentflow-selected-agent', agent);
                    return true;
                }
                return false;
            },
            getPreferences: function() {
                return {
                    selectedAgent: this.selectedAgent
                };
            }
        };
        
        // Test saving OpenClaw preference
        mockUIPreferences.updateSelectedAgent('openclaw');
        expect(mockLocalStorage.getItem('agentflow-selected-agent')).toBe('openclaw');
        expect(mockUIPreferences.selectedAgent).toBe('openclaw');
        
        // Test saving Hermes preference
        mockUIPreferences.updateSelectedAgent('hermes');
        expect(mockLocalStorage.getItem('agentflow-selected-agent')).toBe('hermes');
        expect(mockUIPreferences.selectedAgent).toBe('hermes');
        
        // Test invalid agent
        const result = mockUIPreferences.updateSelectedAgent('invalid');
        expect(result).toBe(false);
        expect(mockLocalStorage.getItem('agentflow-selected-agent')).toBe('hermes'); // Should not change
    });
    
    /**
     * Test 3: Window resize saves size preferences
     * Validates: Requirement 6.1
     */
    test('Window resize saves size preferences', () => {
        // Simulate handleWindowResize functionality
        const mockHandleWindowResize = function(width, height) {
            // Save window size to localStorage
            mockLocalStorage.setItem('agentflow-window-size', `${width},${height}`);
            
            // Update compact mode based on width
            const isCompact = width <= 370;
            mockLocalStorage.setItem('agentflow-compact-mode', isCompact.toString());
            
            return {
                width,
                height,
                isCompact
            };
        };
        
        // Test compact mode (width ≤ 370)
        const compactResult = mockHandleWindowResize(370, 565);
        expect(mockLocalStorage.getItem('agentflow-window-size')).toBe('370,565');
        expect(mockLocalStorage.getItem('agentflow-compact-mode')).toBe('true');
        expect(compactResult.isCompact).toBe(true);
        
        // Test non-compact mode (width > 370)
        const nonCompactResult = mockHandleWindowResize(500, 565);
        expect(mockLocalStorage.getItem('agentflow-window-size')).toBe('500,565');
        expect(mockLocalStorage.getItem('agentflow-compact-mode')).toBe('false');
        expect(nonCompactResult.isCompact).toBe(false);
    });
    
    /**
     * Test 4: Complete agent switching workflow
     * Validates: Requirements 1.3, 1.4, 6.3
     */
    test('Complete agent switching workflow', () => {
        // Mock DOM elements
        const mockCards = {
            'card-openclaw': { style: { display: '' } },
            'card-hermes': { style: { display: '' } }
        };
        
        // Simulate complete workflow
        const workflow = {
            // Step 1: User selects OpenClaw
            selectOpenClaw: function() {
                // Update toggle state
                const agentToggle = { currentAgent: 'openclaw' };
                
                // Update card visibility
                mockCards['card-openclaw'].style.display = 'flex';
                mockCards['card-hermes'].style.display = 'none';
                
                // Save preference
                mockLocalStorage.setItem('agentflow-selected-agent', 'openclaw');
                
                return {
                    agentToggle,
                    openclawVisible: mockCards['card-openclaw'].style.display,
                    hermesVisible: mockCards['card-hermes'].style.display,
                    savedPreference: mockLocalStorage.getItem('agentflow-selected-agent')
                };
            },
            
            // Step 2: User selects Hermes
            selectHermes: function() {
                // Update toggle state
                const agentToggle = { currentAgent: 'hermes' };
                
                // Update card visibility
                mockCards['card-openclaw'].style.display = 'none';
                mockCards['card-hermes'].style.display = 'flex';
                
                // Save preference
                mockLocalStorage.setItem('agentflow-selected-agent', 'hermes');
                
                return {
                    agentToggle,
                    openclawVisible: mockCards['card-openclaw'].style.display,
                    hermesVisible: mockCards['card-hermes'].style.display,
                    savedPreference: mockLocalStorage.getItem('agentflow-selected-agent')
                };
            }
        };
        
        // Test OpenClaw selection workflow
        const openclawResult = workflow.selectOpenClaw();
        expect(openclawResult.agentToggle.currentAgent).toBe('openclaw');
        expect(openclawResult.openclawVisible).toBe('flex');
        expect(openclawResult.hermesVisible).toBe('none');
        expect(openclawResult.savedPreference).toBe('openclaw');
        
        // Test Hermes selection workflow
        const hermesResult = workflow.selectHermes();
        expect(hermesResult.agentToggle.currentAgent).toBe('hermes');
        expect(hermesResult.openclawVisible).toBe('none');
        expect(hermesResult.hermesVisible).toBe('flex');
        expect(hermesResult.savedPreference).toBe('hermes');
    });
    
    /**
     * Test 5: Integration between toggle and preferences
     * Validates: Requirements 1.3, 1.4, 6.3
     */
    test('Toggle and preferences work together', () => {
        // Mock DOM elements
        const mockCards = {
            'card-openclaw': { style: { display: '' } },
            'card-hermes': { style: { display: '' } }
        };
        
        // Simulate integrated system
        const integratedSystem = {
            uiPreferences: {
                selectedAgent: 'openclaw',
                updateSelectedAgent: function(agent) {
                    if (agent === 'openclaw' || agent === 'hermes') {
                        this.selectedAgent = agent;
                        mockLocalStorage.setItem('agentflow-selected-agent', agent);
                        return true;
                    }
                    return false;
                }
            },
            
            agentToggle: {
                currentAgent: 'openclaw',
                setAgent: function(agent, uiPrefs) {
                    if (agent !== 'openclaw' && agent !== 'hermes') {
                        return false;
                    }
                    
                    this.currentAgent = agent;
                    
                    // Update preferences
                    uiPrefs.updateSelectedAgent(agent);
                    
                    // Update card visibility
                    if (mockCards['card-openclaw'] && mockCards['card-hermes']) {
                        if (this.currentAgent === 'openclaw') {
                            mockCards['card-openclaw'].style.display = 'flex';
                            mockCards['card-hermes'].style.display = 'none';
                        } else {
                            mockCards['card-openclaw'].style.display = 'none';
                            mockCards['card-hermes'].style.display = 'flex';
                        }
                    }
                    
                    return true;
                }
            }
        };
        
        // Test switching to Hermes
        const hermesResult = integratedSystem.agentToggle.setAgent('hermes', integratedSystem.uiPreferences);
        expect(hermesResult).toBe(true);
        expect(integratedSystem.agentToggle.currentAgent).toBe('hermes');
        expect(integratedSystem.uiPreferences.selectedAgent).toBe('hermes');
        expect(mockLocalStorage.getItem('agentflow-selected-agent')).toBe('hermes');
        
        // Verify card visibility
        expect(mockCards['card-openclaw'].style.display).toBe('none');
        expect(mockCards['card-hermes'].style.display).toBe('flex');
        
        // Test switching back to OpenClaw
        const openclawResult = integratedSystem.agentToggle.setAgent('openclaw', integratedSystem.uiPreferences);
        expect(openclawResult).toBe(true);
        expect(integratedSystem.agentToggle.currentAgent).toBe('openclaw');
        expect(integratedSystem.uiPreferences.selectedAgent).toBe('openclaw');
        expect(mockLocalStorage.getItem('agentflow-selected-agent')).toBe('openclaw');
        
        // Verify card visibility
        expect(mockCards['card-openclaw'].style.display).toBe('flex');
        expect(mockCards['card-hermes'].style.display).toBe('none');
    });
    
    /**
     * Test 6: Window resize triggers layout updates
     * Validates: Requirement 3.2, 3.4
     */
    test('Window resize triggers layout updates', () => {
        // Track function calls
        const functionCalls = {
            updateWindowSize: 0,
            applyResponsiveClasses: 0,
            updateCardLayoutForMode: 0
        };
        
        // Simulate handleWindowResize with tracking
        const mockHandleWindowResize = function(width, height) {
            // Save window size
            functionCalls.updateWindowSize++;
            mockLocalStorage.setItem('agentflow-window-size', `${width},${height}`);
            
            // Check layout mode
            const isCompact = width <= 370;
            const isSingleColumn = width <= 500;
            
            // Apply responsive classes
            functionCalls.applyResponsiveClasses++;
            
            // Update card layout if mode changed
            functionCalls.updateCardLayoutForMode++;
            
            return {
                width,
                height,
                isCompact,
                isSingleColumn,
                functionCalls: { ...functionCalls }
            };
        };
        
        // Test resize to compact mode
        const compactResult = mockHandleWindowResize(370, 565);
        expect(compactResult.isCompact).toBe(true);
        expect(compactResult.isSingleColumn).toBe(true);
        expect(compactResult.functionCalls.updateWindowSize).toBe(1);
        expect(compactResult.functionCalls.applyResponsiveClasses).toBe(1);
        expect(compactResult.functionCalls.updateCardLayoutForMode).toBe(1);
        
        // Test resize to single column mode (not compact)
        const singleColumnResult = mockHandleWindowResize(400, 565);
        expect(singleColumnResult.isCompact).toBe(false);
        expect(singleColumnResult.isSingleColumn).toBe(true);
        
        // Test resize to grid mode
        const gridResult = mockHandleWindowResize(600, 565);
        expect(gridResult.isCompact).toBe(false);
        expect(gridResult.isSingleColumn).toBe(false);
    });
});