# Design Document

## Overview

This design document outlines the implementation of UI improvements for the AgentFlow Electron application. The primary goal is to reduce the application window width from 740px to 370px (50% reduction) while maintaining all functionality and improving usability. The design includes a compact agent toggle for switching between OpenClaw and Hermes views, a reduced-size activity monitor, and responsive layout adaptations.

The current AgentFlow application is built with Electron and uses a modern glassmorphic design with real-time service monitoring capabilities. The UI improvements will transform the application into a more compact, space-efficient tool that can run alongside other applications without dominating screen real estate.

## Architecture

### Current Architecture
The AgentFlow application follows a standard Electron architecture:
- **Main Process** (`main.js`): Handles window creation, IPC communication, and service management
- **Renderer Process** (`renderer.js`): Manages UI updates, event handling, and user interactions
- **Preload Script** (`preload.js`): Provides secure IPC bridge between main and renderer processes
- **Service Manager** (`service-manager.js`): Handles system service interactions (systemd, journalctl)

### Modified Architecture for UI Improvements
The core architecture remains unchanged, but the UI layer will be enhanced with:
1. **Responsive Layout System**: CSS media queries and flexible grid layouts
2. **State Management**: Enhanced local storage for persistent UI preferences
3. **Component Toggle System**: Dynamic agent switching mechanism
4. **Window Size Management**: Programmatic window resizing with persistence

### Key Design Decisions
1. **Single-Column Layout**: At 370px width, cards will stack vertically instead of side-by-side
2. **Proportional Scaling**: Font sizes, padding, and margins will scale proportionally to maintain readability
3. **Toggle-Based View Switching**: Instead of showing both agents simultaneously, users toggle between them
4. **Persistent Preferences**: Window size and toggle state saved to local storage

## Components and Interfaces

### 1. Agent Toggle Component
**Purpose**: Allows users to switch between OpenClaw and Hermes agent views

**Interface**:
```javascript
interface AgentToggle {
  currentAgent: 'openclaw' | 'hermes';
  setAgent(agent: 'openclaw' | 'hermes'): void;
  savePreference(): void;
  loadPreference(): 'openclaw' | 'hermes';
}
```

**Implementation Details**:
- Visual: Two-segment toggle button with "OpenClaw" and "Hermes" labels
- Placement: Top-right of control modal or top of section header (configurable)
- State: Saved to localStorage as `agentflow-selected-agent`
- Default: "openclaw" on first launch

### 2. Responsive Card Container
**Purpose**: Adapts card layout based on window width

**Interface**:
```javascript
interface CardContainer {
  cards: Array<CardComponent>;
  layoutMode: 'grid' | 'single-column';
  updateLayout(width: number): void;
}
```

**Implementation Details**:
- Grid layout (2 columns) when width > 500px
- Single-column layout when width ≤ 500px
- Cards stack vertically in compact mode
- Smooth transitions between layout modes

### 3. Compact Activity Monitor
**Purpose**: Reduced-size version of the activity chart

**Interface**:
```javascript
interface ActivityMonitor {
  height: number; // Reduced from current 80px
  width: number;  // Proportional to window width
  updateChart(data: ActivityData): void;
  resize(newHeight: number, newWidth: number): void;
}
```

**Implementation Details**:
- Height reduction: From 80px to ~56px (30% reduction)
- Width: Scales proportionally with window width
- Maintains real-time updates and color coding
- Preserves hover effects and visual clarity

### 4. Window Size Manager
**Purpose**: Handles window resizing and persistence

**Interface**:
```javascript
interface WindowSizeManager {
  width: number;
  height: number;
  saveSize(width: number, height: number): void;
  restoreSize(): { width: number, height: number };
  applySize(width: number, height: number): void;
}
```

**Implementation Details**:
- Default size: 370px × 565px (maintains current height)
- Saves to localStorage as `agentflow-window-size`
- Restores on application restart
- Emits resize events for responsive components

### 5. Responsive CSS System
**Purpose**: Provides adaptive styling based on window dimensions

**Implementation Details**:
- CSS custom properties for scalable values
- Media queries for breakpoints (370px, 500px)
- Proportional font scaling using `clamp()` function
- Flexible padding/margin using `calc()` with viewport units

## Data Models

### 1. UI Preferences Model
```javascript
interface UIPreferences {
  windowWidth: number;      // Saved window width (default: 370)
  windowHeight: number;     // Saved window height (default: 565)
  selectedAgent: string;    // 'openclaw' | 'hermes'
  compactMode: boolean;     // Whether compact mode is active
  lastUpdated: Date;        // Timestamp of last preference update
}
```

### 2. Component State Model
```javascript
interface ComponentState {
  cardLayout: 'grid' | 'single-column';
  activityMonitorSize: { height: number; width: number };
  fontScale: number;        // 0.8 to 1.2 based on window size
  isCompact: boolean;       // Derived from windowWidth ≤ 370
}
```

### 3. Local Storage Schema
```javascript
{
  "agentflow-window-size": "370,565",
  "agentflow-selected-agent": "openclaw",
  "agentflow-compact-mode": "true",
  "agentflow-last-save": "2024-01-15T10:30:00Z"
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before writing correctness properties, I need to assess whether property-based testing (PBT) is appropriate for this feature. This feature involves:
- UI rendering and layout changes
- Responsive design adaptations
- Window size management
- Component state persistence

Based on the PBT guidelines, this feature falls into categories where PBT is NOT appropriate:
1. **UI rendering and layout** - Use snapshot tests and visual regression tests instead
2. **Configuration validation** - Use schema validation and example-based tests instead
3. **Side-effect-only operations** - Use mock-based unit tests to verify calls were made correctly

Therefore, I will **skip the Correctness Properties section** and use appropriate alternative testing strategies as outlined in the Testing Strategy section.

## Error Handling

### 1. Window Size Errors
- **Invalid Size Values**: If saved window size is invalid or out of bounds, reset to default (370×565)
- **Screen Constraints**: Ensure window fits within screen boundaries, adjust if necessary
- **Storage Errors**: If localStorage fails, use defaults and continue operation

### 2. Toggle State Errors
- **Invalid Agent Selection**: If saved agent is invalid, default to "openclaw"
- **State Corruption**: Reset to default state if toggle state becomes corrupted
- **Render Failures**: Fallback to showing both agents if toggle rendering fails

### 3. Responsive Layout Errors
- **CSS Load Failures**: Fallback to basic styling if responsive CSS fails to load
- **Media Query Issues**: Use mobile-first approach with graceful degradation
- **Component Size Limits**: Enforce minimum sizes to prevent UI elements from becoming unusable

### 4. Persistence Errors
- **LocalStorage Quota**: Handle quota exceeded errors gracefully
- **Serialization Errors**: Validate JSON before parsing, use defaults on failure
- **Race Conditions**: Implement atomic operations for preference updates

### Recovery Strategies
1. **Validation First**: Validate all inputs before applying changes
2. **Default Fallbacks**: Always have safe default values for critical settings
3. **Graceful Degradation**: If advanced features fail, maintain basic functionality
4. **User Notification**: Inform users of non-critical failures without disrupting workflow

## Testing Strategy

### Unit Tests
**Focus**: Verify specific examples, edge cases, and error conditions

**Test Areas**:
1. **Window Size Management**
   - Test default size application
   - Test size persistence and restoration
   - Test invalid size handling

2. **Agent Toggle Functionality**
   - Test default agent selection
   - Test toggle state changes
   - Test preference persistence

3. **Responsive Layout Logic**
   - Test layout mode switching (grid vs single-column)
   - Test font scaling calculations
   - Test component size adjustments

4. **Local Storage Operations**
   - Test data serialization/deserialization
   - Test error handling for storage failures
   - Test preference validation

**Testing Tools**:
- Jest for JavaScript unit testing
- jsdom for DOM simulation
- Mock functions for Electron APIs

### Integration Tests
**Focus**: Verify component interactions and Electron API integration

**Test Areas**:
1. **Electron IPC Communication**
   - Test window control messages
   - Test preference synchronization
   - Test error propagation

2. **UI Component Integration**
   - Test toggle interaction with card display
   - Test window resize event handling
   - Test responsive CSS application

3. **End-to-End User Flows**
   - Test complete agent switching workflow
   - Test window resize and restore flow
   - Test application startup with saved preferences

**Testing Tools**:
- Spectron or Electron Fiddle for E2E testing
- Integration test suites with mocked system calls

### Visual Regression Tests
**Focus**: Ensure UI changes don't break visual appearance

**Test Areas**:
1. **Layout Verification**
   - Screenshot comparison at 370px width
   - Screenshot comparison at 740px width (legacy)
   - Responsive breakpoint verification

2. **Component Appearance**
   - Agent toggle visual states
   - Card layout in single-column mode
   - Activity monitor scaling

**Testing Tools**:
- Percy or Applitools for visual testing
- Manual review for design consistency

### Snapshot Tests
**Focus**: Verify component rendering output

**Test Areas**:
1. **Component Snapshots**
   - AgentToggle component in both states
   - CardContainer in grid and single-column modes
   - ActivityMonitor at different sizes

2. **CSS Class Application**
   - Verify responsive CSS classes are applied correctly
   - Test media query activation

**Testing Tools**:
- Jest snapshot testing
- CSS-in-JS snapshot verification if applicable

### Performance Tests
**Focus**: Ensure compact mode doesn't degrade performance

**Test Areas**:
1. **Render Performance**
   - Measure render time for layout changes
   - Test smoothness of resize animations
   - Verify no memory leaks in state management

2. **Storage Performance**
   - Test localStorage read/write speed
   - Verify preference updates don't block UI

### Test Configuration
- **Test Environment**: Node.js with jsdom for unit tests, Electron for integration tests
- **Test Data**: Mock service status responses, simulated window sizes
- **Coverage Goals**: 80%+ for new UI components, 90%+ for core logic
- **CI Integration**: Run tests on PRs, visual tests on schedule

### Why Not Property-Based Testing
As determined earlier, PBT is not appropriate for this feature because:
1. **UI Rendering**: Testing visual layout and component rendering is better suited to snapshot and visual regression tests
2. **Configuration**: Window size and toggle state are configuration values, not functions with meaningful input variation
3. **Side Effects**: Most operations involve DOM manipulation and Electron API calls, not pure functions
4. **Cost-Effectiveness**: Running 100+ iterations of UI rendering tests provides little additional value over example-based tests

The testing strategy focuses on practical verification of the UI improvements while maintaining the reliability and performance of the existing application.