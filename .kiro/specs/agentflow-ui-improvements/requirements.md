# Requirements Document

## Introduction

AgentFlow is an Electron desktop application for monitoring and controlling AI agent services on Ubuntu Linux. The current application window is too large (740px width) and needs to be reduced in size to improve usability and fit better on smaller screens. This feature adds UI improvements including a compact agent toggle, smaller activity monitor, and reduced window width.

## Glossary

- **AgentFlow**: The Electron desktop application for monitoring AI agent services
- **OpenClaw**: The first AI agent service managed by AgentFlow
- **Hermes**: The second AI agent service managed by AgentFlow
- **Agent_Toggle**: The UI control that switches between displaying OpenClaw or Hermes agent information
- **Activity_Monitor**: The visual chart component showing service activity levels
- **Window_Width**: The horizontal dimension of the application window
- **Compact_Mode**: The reduced-size UI layout with smaller components

## Requirements

### Requirement 1: Agent Selection Toggle

**User Story:** As a user, I want to switch between OpenClaw and Hermes agent views, so that I can focus on one agent at a time in the compact UI.

#### Acceptance Criteria

1. WHERE the Agent_Toggle is present, THE Agent_Toggle SHALL display "OpenClaw" and "Hermes" as selectable options
2. WHEN the application starts, THE Agent_Toggle SHALL default to "OpenClaw" selection
3. WHEN the user selects "OpenClaw" on the Agent_Toggle, THE AgentFlow SHALL display only OpenClaw agent information
4. WHEN the user selects "Hermes" on the Agent_Toggle, THE AgentFlow SHALL display only Hermes agent information
5. THE Agent_Toggle SHALL be positioned at the top of the control modal or section header

### Requirement 2: Compact Activity Monitor

**User Story:** As a user, I want a smaller activity monitor, so that it fits within the reduced window width while still showing service activity.

#### Acceptance Criteria

1. WHERE Compact_Mode is active, THE Activity_Monitor SHALL reduce its height by at least 30%
2. WHERE Compact_Mode is active, THE Activity_Monitor SHALL reduce its width proportionally to the Window_Width reduction
3. THE Activity_Monitor SHALL maintain visual clarity of activity levels despite size reduction
4. THE Activity_Monitor SHALL update activity bars in real-time as in the current implementation
5. THE Activity_Monitor SHALL preserve color coding for active/inactive service states

### Requirement 3: Reduced Window Width

**User Story:** As a user, I want a narrower application window, so that the app takes less screen space and fits better alongside other applications.

#### Acceptance Criteria

1. THE Window_Width SHALL be reduced from 740px to a maximum of 370px (50% reduction)
2. WHEN the Window_Width is reduced, THE AgentFlow UI components SHALL resize proportionally
3. WHEN the Window_Width is reduced, THE cards container SHALL adjust to single-column layout
4. WHEN the Window_Width is reduced, THE navigation and status bars SHALL remain fully functional
5. THE reduced Window_Width SHALL maintain all current functionality of the application

### Requirement 4: Responsive Layout Adaptation

**User Story:** As a user, I want the UI to adapt gracefully to the reduced width, so that all controls remain accessible and readable.

#### Acceptance Criteria

1. WHEN Window_Width is 370px or less, THE cards container SHALL display cards in a single column
2. WHEN Window_Width is 370px or less, THE card content SHALL adjust font sizes proportionally
3. WHEN Window_Width is 370px or less, THE action buttons SHALL remain fully clickable and accessible
4. WHEN Window_Width is 370px or less, THE status indicators SHALL remain clearly visible
5. IF text becomes too small to read comfortably, THEN THE AgentFlow SHALL adjust font sizes to maintain readability

### Requirement 5: Toggle Placement Options

**User Story:** As a developer, I want flexible toggle placement options, so that I can choose the most appropriate location based on UI constraints.

#### Acceptance Criteria

1. WHERE space permits, THE Agent_Toggle SHALL be positioned in the top-right corner of the control modal
2. WHERE top-right placement is constrained, THE Agent_Toggle SHALL be positioned at the top of the section header
3. THE Agent_Toggle SHALL be clearly visible and accessible in either placement position
4. THE Agent_Toggle SHALL maintain consistent styling with the application theme
5. THE Agent_Toggle SHALL provide clear visual feedback when selected

### Requirement 6: Compact Mode Preservation

**User Story:** As a user, I want the compact mode settings to persist, so that the app remembers my preferred window size and toggle state.

#### Acceptance Criteria

1. WHEN the user resizes the window, THE AgentFlow SHALL save the Window_Width preference
2. WHEN the application restarts, THE AgentFlow SHALL restore the saved Window_Width
3. WHEN the user selects an agent on the Agent_Toggle, THE AgentFlow SHALL save the selection preference
4. WHEN the application restarts, THE AgentFlow SHALL restore the saved Agent_Toggle selection
5. THE saved preferences SHALL be stored in persistent local storage