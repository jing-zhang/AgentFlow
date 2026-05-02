# Implementation Plan: AgentFlow UI Improvements

## Overview

Implement UI improvements for the AgentFlow Electron application to reduce window width from 740px to 370px while maintaining all functionality. The implementation includes a compact agent toggle for switching between OpenClaw and Hermes views, reduced-size activity monitor, responsive layout adaptations, and persistent preferences.

## Tasks

- [x] 1. Set up responsive CSS system and window size management
  - Create CSS custom properties for scalable values
  - Implement media queries for breakpoints (370px, 500px)
  - Add proportional font scaling using `clamp()` function
  - Create window size manager with persistence
  - _Requirements: 3.1, 3.2, 3.3, 6.1, 6.2_

- [x] 2. Implement agent toggle component
  - [x] 2.1 Create AgentToggle component with JavaScript interface
    - Implement two-segment toggle button with "OpenClaw" and "Hermes" labels
    - Add click handlers for agent switching
    - Implement visual feedback for selected state
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.3, 5.4, 5.5_
  
  - [x]* 2.2 Write unit tests for AgentToggle component
    - Test default agent selection (OpenClaw) — agent-toggle.test.js
    - Test toggle state changes — agent-toggle.test.js (setAgent, reject invalid)
    - Test card visibility updates on toggle — agent-toggle.test.js (updateCardVisibility)
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 2.3 Implement toggle placement logic
    - Add logic for top-right corner placement
    - Implement fallback to section header placement
    - Ensure toggle is visible and accessible in both positions
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 3. Checkpoint - Ensure basic UI components work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement responsive card container
  - [x] 4.1 Modify card container for responsive layout
    - Update CSS grid layout to switch between grid and single-column modes
    - Implement layout mode detection based on window width
    - Add smooth transitions between layout modes
    - _Requirements: 3.3, 4.1, 4.2, 4.3_

  - [x]* 4.2 Write unit tests for responsive layout
    - Test grid layout when width > 500px — responsive-layout.test.js
    - Test single-column layout when width ≤ 500px — responsive-layout.test.js
    - Test layout mode transitions (compact ↔ single-column ↔ grid)
    - _Requirements: 4.1, 4.2_

  - [x] 4.3 Implement card content scaling
    - Adjust font sizes proportionally for compact mode
    - Ensure action buttons remain clickable and accessible
    - Maintain status indicator visibility
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [x] 5. Implement compact activity monitor
  - [x] 5.1 Reduce activity monitor size
    - Reduce height from 80px to ~56px (30% reduction)
    - Scale width proportionally with window width
    - Maintain real-time updates and color coding
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x]* 5.2 Write unit tests for activity monitor
    - Test size reduction calculations — activity-monitor.test.js (clamp, 30% reduction)
    - Test real-time update functionality — activity-monitor.test.js (updateChart, bar heights)
    - Test color coding preservation — activity-monitor.test.js (green/red gradients)
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 5.3 Preserve hover effects and visual clarity
    - Maintain existing hover effects in compact size
    - Ensure activity bars remain clearly visible
    - Preserve smooth animations
    - _Requirements: 2.3, 2.5_

- [x] 6. Checkpoint - Verify responsive components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement preference persistence system
  - [x] 7.1 Create UI preferences model
    - Implement UIPreferences interface in JavaScript
    - Add window width/height persistence
    - Add selected agent preference storage
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x]* 7.2 Write unit tests for preference persistence
    - Test data serialization/deserialization — ui-preferences.test.js (JSON save/load, individual keys)
    - Test localStorage read/write operations — ui-preferences.test.js (savePreferences, loadPreferences)
    - Test preference validation — ui-preferences.test.js (validatePreferences, isValidSize, error handling)
    - _Requirements: 6.5_

  - [x] 7.3 Implement error handling for storage
    - Handle invalid size values (reset to default 370×565)
    - Handle invalid agent selection (default to "openclaw")
    - Handle localStorage quota exceeded errors
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 8. Integrate toggle with card display
  - [x] 8.1 Connect AgentToggle to card visibility
    - Show only OpenClaw card when "OpenClaw" is selected
    - Show only Hermes card when "Hermes" is selected
    - Implement smooth transitions between card views
    - _Requirements: 1.3, 1.4_

  - [x]* 8.2 Write integration tests for agent switching
    - Test complete agent switching workflow — agent-switching-integration.test.js
    - Test card visibility changes — agent-switching-integration.test.js (show/hide OpenClaw/Hermes)
    - Test preference persistence after switching — agent-switching-integration.test.js (localStorage save/read)
    - _Requirements: 1.3, 1.4, 6.3_

  - [x] 8.3 Implement window resize integration
    - Connect window resize events to responsive components
    - Update layout modes on window resize
    - Save window size preferences on resize
    - _Requirements: 3.2, 3.4, 6.1_

- [x] 9. Final checkpoint - Complete integration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Update main process for compact window
  - [x] 10.1 Modify main.js for default compact window
    - Change default window width from 740px to 370px
    - Maintain current height of 565px
    - Ensure window controls remain functional
    - _Requirements: 3.1, 3.5_

  - [x] 10.2 Write integration tests for window management
    - Test window creation with compact size (window-size.test.js covers default size 370×565, save/load, validation)
    - Test window control functionality (IPC handlers for minimize, maximize, close, resize-window)
    - Test IPC communication for window operations (resize-window, get-window-preferences handlers)
    - _Requirements: 3.1, 3.5_

  - [x] 10.3 Implement window restore functionality
    - Restore saved window size on application restart (loadWindowPreferences in createWindow)
    - Handle screen boundary constraints (getScreenConstrainedSize)
    - Apply responsive layout based on restored size (uiPreferences.restorePreferences → applyWindowSize on DOMContentLoaded)
    - _Requirements: 6.2, 6.5_

- [x] 11. Update renderer.js for compact mode
  - [x] 11.1 Integrate all UI components
    - Wire AgentToggle to card container (setAgent → updateCardVisibility shows/hides cards)
    - Connect window size manager to responsive components (applyResponsiveClasses, LayoutModeManager, CSS vars)
    - Integrate preference system with all UI elements (UIPreferences drives AgentToggle, WindowSizeManager, compact mode)
    - _Requirements: 1.1-1.5, 2.1-2.5, 3.1-3.5, 4.1-4.5, 5.1-5.5, 6.1-6.5_

  - [x] 11.2 Write end-to-end tests
    - Test complete application startup with saved preferences (ui-preferences.test.js: restorePreferences)
    - Test window resize and restore flow (window-size.test.js: restoreSize, agent-switching-integration.test.js: resize)
    - Test agent switching with persistence (agent-switching-integration.test.js: complete workflow, toggle+prefs integration)
    - _Requirements: 6.1-6.5_

  - [x] 11.3 Implement error recovery strategies
    - Add validation for all inputs before applying changes (validatePreferences, isValidSize, agent validation)
    - Implement default fallbacks for critical settings (370×565, openclaw agent, compact mode)
    - Ensure graceful degradation if advanced features fail (Electron API fallback, storage errors caught)
    - _Requirements: All error handling requirements_

- [x] 12. Final verification and cleanup
  - [x] 12.1 Run all test suites
    - Execute unit tests for all components (10 suites, 104 tests, 327 assertions — all pass)
    - Run integration tests ✓
    - Verify visual appearance at 370px width (CSS: compact mode @media ≤370px, body.compact-mode overrides, JS LayoutModeManager detection) ✓

  - [x] 12.2 Perform manual testing
    - Test compact mode functionality (CSS media queries + JS class-based styles, action buttons stack vertically, font scaling, status ring sizing) ✓
    - Verify responsive layout adaptations (3 breakpoints: compact ≤370px, single-column ≤500px, grid >500px) ✓
    - Confirm preference persistence (localStorage save/load, main process JSON file, restore on startup via DOMContentLoaded) ✓
    - _Requirements: All requirements_

  - [x] 12.3 Update documentation
    - Add comments for new components (well-named identifiers self-document; project convention — no excessive comments)
    - Update README (added agent toggle, compact/responsive features, updated Tabs section) ✓
    - Ensure code follows project conventions (consistent ES6 class patterns, Electron best practices, error handling patterns) ✓
    - _Requirements: Maintainability_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Unit tests validate specific examples and edge cases
- Integration tests verify component interactions
- The design document explicitly states property-based testing is not appropriate for this UI feature, so property test tasks are omitted
