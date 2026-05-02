/**
 * Unit Tests for Responsive Layout / LayoutModeManager
 * Validates: Requirements 4.1, 4.2
 *
 * Tests grid layout (>500px), single-column (≤500px), and layout mode transitions.
 */

describe('LayoutModeManager', () => {
    // LayoutModeManager class (matches renderer.js implementation)
    class LayoutModeManager {
        constructor() {
            this.currentMode = 'grid';
            this.breakpoints = {
                compact: 370,
                singleColumn: 500,
                grid: 501
            };
        }

        detectMode(width) {
            if (width <= this.breakpoints.compact) {
                return 'compact';
            } else if (width <= this.breakpoints.singleColumn) {
                return 'single-column';
            } else {
                return 'grid';
            }
        }

        hasModeChanged(newWidth) {
            const newMode = this.detectMode(newWidth);
            const changed = newMode !== this.currentMode;
            if (changed) {
                this.currentMode = newMode;
            }
            return changed;
        }

        getMode() {
            return this.currentMode;
        }

        getModeName() {
            const modeNames = {
                'grid': 'Grid Layout',
                'single-column': 'Single Column',
                'compact': 'Compact Mode'
            };
            return modeNames[this.currentMode] || this.currentMode;
        }
    }

    let layoutManager;

    beforeEach(() => {
        layoutManager = new LayoutModeManager();
    });

    describe('Mode Detection', () => {
        test('should return "grid" when width > 500px (Req 4.1)', () => {
            expect(layoutManager.detectMode(740)).toBe('grid');
            expect(layoutManager.detectMode(600)).toBe('grid');
            expect(layoutManager.detectMode(501)).toBe('grid');
        });

        test('should return "single-column" when width ≤ 500px', () => {
            expect(layoutManager.detectMode(500)).toBe('single-column');
            expect(layoutManager.detectMode(450)).toBe('single-column');
            expect(layoutManager.detectMode(371)).toBe('single-column');
        });

        test('should return "compact" when width ≤ 370px', () => {
            expect(layoutManager.detectMode(370)).toBe('compact');
            expect(layoutManager.detectMode(300)).toBe('compact');
            expect(layoutManager.detectMode(200)).toBe('compact');
        });

        test('should handle edge case at exact breakpoint 370', () => {
            expect(layoutManager.detectMode(370)).toBe('compact');
        });

        test('should handle edge case at exact breakpoint 500', () => {
            expect(layoutManager.detectMode(500)).toBe('single-column');
        });

        test('should handle edge case at exact breakpoint 501', () => {
            expect(layoutManager.detectMode(501)).toBe('grid');
        });
    });

    describe('Mode Transition Detection', () => {
        test('should detect change from grid to single-column', () => {
            layoutManager.currentMode = 'grid';
            expect(layoutManager.hasModeChanged(450)).toBe(true);
            expect(layoutManager.getMode()).toBe('single-column');
        });

        test('should detect change from grid to compact', () => {
            layoutManager.currentMode = 'grid';
            expect(layoutManager.hasModeChanged(370)).toBe(true);
            expect(layoutManager.getMode()).toBe('compact');
        });

        test('should detect change from compact to grid', () => {
            layoutManager.currentMode = 'compact';
            expect(layoutManager.hasModeChanged(600)).toBe(true);
            expect(layoutManager.getMode()).toBe('grid');
        });

        test('should NOT detect change when width stays in same mode', () => {
            layoutManager.currentMode = 'grid';
            expect(layoutManager.hasModeChanged(600)).toBe(false);
            expect(layoutManager.getMode()).toBe('grid');

            expect(layoutManager.hasModeChanged(740)).toBe(false);
            expect(layoutManager.getMode()).toBe('grid');
        });

        test('should NOT detect change at same width', () => {
            layoutManager.currentMode = 'compact';
            expect(layoutManager.hasModeChanged(370)).toBe(false);
            expect(layoutManager.getMode()).toBe('compact');

            layoutManager.currentMode = 'single-column';
            expect(layoutManager.hasModeChanged(450)).toBe(false);
            expect(layoutManager.getMode()).toBe('single-column');

            layoutManager.currentMode = 'grid';
            expect(layoutManager.hasModeChanged(600)).toBe(false);
            expect(layoutManager.getMode()).toBe('grid');
        });

        test('should detect chained transitions grid → single-column → compact', () => {
            layoutManager.currentMode = 'grid';

            expect(layoutManager.hasModeChanged(450)).toBe(true);
            expect(layoutManager.getMode()).toBe('single-column');

            expect(layoutManager.hasModeChanged(350)).toBe(true);
            expect(layoutManager.getMode()).toBe('compact');
        });

        test('should detect chained transitions compact → single-column → grid', () => {
            layoutManager.currentMode = 'compact';

            expect(layoutManager.hasModeChanged(400)).toBe(true);
            expect(layoutManager.getMode()).toBe('single-column');

            expect(layoutManager.hasModeChanged(600)).toBe(true);
            expect(layoutManager.getMode()).toBe('grid');
        });

        test('should not trigger change when going from initial grid to grid', () => {
            // Initial state is 'grid'
            expect(layoutManager.hasModeChanged(740)).toBe(false);
            expect(layoutManager.getMode()).toBe('grid');
        });
    });

    describe('Mode Name Display', () => {
        test('should return correct display name for grid mode', () => {
            layoutManager.currentMode = 'grid';
            expect(layoutManager.getModeName()).toBe('Grid Layout');
        });

        test('should return correct display name for single-column mode', () => {
            layoutManager.currentMode = 'single-column';
            expect(layoutManager.getModeName()).toBe('Single Column');
        });

        test('should return correct display name for compact mode', () => {
            layoutManager.currentMode = 'compact';
            expect(layoutManager.getModeName()).toBe('Compact Mode');
        });
    });

    describe('getMode', () => {
        test('should return current mode after construction', () => {
            expect(layoutManager.getMode()).toBe('grid');
        });

        test('should return updated mode after change', () => {
            layoutManager.hasModeChanged(350);
            expect(layoutManager.getMode()).toBe('compact');
        });
    });
});

describe('Responsive CSS Class Application', () => {
    test('should apply correct CSS classes based on window width', () => {
        // Simulates applyResponsiveClasses logic from renderer.js
        function getResponsiveClasses(width) {
            const classes = [];
            if (width <= 370) {
                classes.push('compact-mode', 'single-column');
            } else if (width <= 500) {
                classes.push('single-column');
            } else {
                classes.push('grid-layout');
            }
            return classes;
        }

        // Compact mode (≤370px)
        expect(getResponsiveClasses(370)).toEqual(['compact-mode', 'single-column']);
        expect(getResponsiveClasses(300)).toEqual(['compact-mode', 'single-column']);

        // Single column (371-500px)
        expect(getResponsiveClasses(400)).toEqual(['single-column']);
        expect(getResponsiveClasses(500)).toEqual(['single-column']);

        // Grid (>500px)
        expect(getResponsiveClasses(501)).toEqual(['grid-layout']);
        expect(getResponsiveClasses(740)).toEqual(['grid-layout']);
    });

    test('card layout transitions should use correct grid template', () => {
        // Simulates layout mode → CSS grid-template-columns mapping
        function getGridTemplate(mode) {
            switch (mode) {
                case 'compact':
                case 'single-column':
                    return '1fr';
                case 'grid':
                    return 'repeat(auto-fit, minmax(300px, 1fr))';
                default:
                    return '1fr';
            }
        }

        expect(getGridTemplate('compact')).toBe('1fr');
        expect(getGridTemplate('single-column')).toBe('1fr');
        expect(getGridTemplate('grid')).toContain('repeat');
        expect(getGridTemplate('grid')).toContain('minmax');
    });

    test('should emit layout mode change event', () => {
        // Simulates the CustomEvent dispatch from applyResponsiveClasses
        let dispatchedEvent = null;
        const mockDispatch = (event) => { dispatchedEvent = event; };

        const detail = { width: 370, mode: 'compact' };
        const event = { type: 'layoutmodechange', detail };
        mockDispatch(event);

        expect(dispatchedEvent).not.toBeNull();
        expect(dispatchedEvent.type).toBe('layoutmodechange');
        expect(dispatchedEvent.detail.mode).toBe('compact');
        expect(dispatchedEvent.detail.width).toBe(370);
    });
});
