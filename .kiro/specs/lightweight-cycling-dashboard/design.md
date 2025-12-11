# Design Document

## Overview

The Lightweight Cycling Dashboard is a single-page web application that automatically rotates between a Google Looker Studio dashboard and three animated space-themed leaderboards. Built with vanilla HTML5, CSS3, and JavaScript for maximum compatibility with Smart TV browsers, the system fetches real-time data from the Funifier API and presents it through engaging spaceship animations.

## Architecture

### High-Level Architecture

The application follows a simple client-side architecture optimized for resource-constrained environments:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   HTML Shell    │    │  View Controller │    │  Funifier API   │
│                 │    │                  │    │                 │
│ - Looker iframe │◄───┤ - Cycle Manager  │◄───┤ /v3/leaderboard │
│ - Ranking views │    │ - Data Fetcher   │    │                 │
│ - CSS animations│    │ - View Renderer  │    └─────────────────┘
└─────────────────┘    └──────────────────┘
```

### Core Components

1. **Cycle Manager**: Controls automatic view transitions using `setInterval()`
2. **View Controller**: Manages DOM manipulation and view state
3. **Data Fetcher**: Handles Funifier API calls with error handling
4. **Ranking Renderer**: Creates animated spaceship displays
5. **Looker Manager**: Handles iframe reloading and embedding

## Components and Interfaces

### Cycle Manager
```javascript
class CycleManager {
  constructor(views, intervalMs = 20000)
  start()
  stop()
  nextView()
  getCurrentView()
}
```

### Data Fetcher
```javascript
class DataFetcher {
  async fetchLeaderboard(leaderboardId)
  handleApiError(error)
}
```

### Ranking Renderer
```javascript
class RankingRenderer {
  renderRanking(playerData, containerId, title)
  animateSpaceships(players)
  assignSpaceshipColors(position)
}
```

### View Controller
```javascript
class ViewController {
  showView(viewId)
  hideAllViews()
  reloadLookerIframe()
}
```

## Data Models

### Player Data Model
```javascript
interface Player {
  playerId: string;    // Player identifier
  score: number;       // Player's current score
  position?: number;   // Calculated ranking position
  spaceshipColor?: string; // Assigned spaceship color
}
```

### Spaceship Asset Model
```javascript
interface SpaceshipAsset {
  car: string;         // Color identifier (red, gold, silver, bronze, yellow, green)
  image: string;       // Full URL to PNG asset
}
```

### View Configuration Model
```javascript
interface ViewConfig {
  id: string;          // Unique view identifier
  type: 'looker' | 'ranking'; // View type
  title?: string;      // Display title for rankings
  leaderboardId?: string; // Funifier leaderboard ID
  lookerUrl?: string;  // Looker Studio embed URL
}
```

### Application State Model
```javascript
interface AppState {
  currentViewIndex: number;
  isRunning: boolean;
  views: ViewConfig[];
  spaceshipAssets: SpaceshipAsset[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After reviewing all testable properties from the prework analysis, several redundancies were identified and consolidated:

- Properties 3.1 and 6.1 both test API calls on ranking view activation - consolidated into Property 1
- Properties 6.2 and 6.4 both test data processing - consolidated into Property 2  
- Properties 3.3 and 4.4 both test positioning logic - consolidated into Property 3
- Properties 7.2 and 7.3 both test animation behavior - consolidated into Property 4

### Core Properties

**Property 1: Fresh API calls for ranking views**
*For any* ranking view activation, the system should make a fresh API call to the Funifier /v3/leaderboard endpoint with the correct leaderboardId for that view
**Validates: Requirements 3.1, 6.1, 8.3**

**Property 2: Player data processing consistency**
*For any* valid API response containing player data, the system should correctly parse playerId and score fields, assign appropriate spaceship colors based on position, and calculate vertical positions proportional to scores
**Validates: Requirements 6.2, 6.4**

**Property 3: Score-based positioning**
*For any* set of players with different scores, spaceships should be positioned vertically such that higher scores result in higher Y positions, with appropriate spaceship assets assigned by ranking position
**Validates: Requirements 3.2, 3.3, 4.4**

**Property 4: View cycling sequence**
*For any* view cycle state, advancing to the next view should follow the sequence (Looker → Ranking 1 → Ranking 2 → Ranking 3 → Looker) and wrap around correctly when reaching the end
**Validates: Requirements 1.2, 1.3**

**Property 5: Looker iframe refresh**
*For any* Looker view activation, the iframe src should be updated with a fresh timestamp parameter to force reload
**Validates: Requirements 2.2**

**Property 6: Player information display**
*For any* rendered ranking, each player should have their name and score displayed in the DOM below their corresponding spaceship
**Validates: Requirements 3.4**

**Property 7: Error handling continuity**
*For any* API failure during ranking data fetch, the system should handle the error gracefully and continue the view cycling process without stopping
**Validates: Requirements 6.3**

**Property 8: No data caching between cycles**
*For any* ranking view that becomes active multiple times, each activation should trigger a fresh API call rather than using cached data from previous cycles
**Validates: Requirements 6.5**

**Property 9: Minimum player display**
*For any* ranking view with available data, the system should display at least the top 3 players with visually distinct styling for 1st, 2nd, and 3rd positions
**Validates: Requirements 4.5**

**Property 10: Configuration-driven leaderboards**
*For any* configured ranking view with a specific leaderboardId, API calls should use that exact leaderboardId and display the corresponding title
**Validates: Requirements 8.1, 8.2**

## Error Handling

### API Error Handling
- **Network Failures**: Graceful degradation with retry logic (max 3 attempts)
- **Invalid Responses**: JSON parsing errors handled with fallback to empty rankings
- **Missing Data**: Handle cases where leaderboard returns no players
- **Timeout Handling**: 10-second timeout for API calls with fallback behavior

### View Management Errors
- **Iframe Loading Failures**: Fallback message displayed if Looker fails to load
- **Asset Loading Failures**: Default spaceship image if PNG assets fail to load
- **Animation Errors**: Fallback to instant positioning if CSS animations fail

### Smart TV Browser Compatibility
- **Feature Detection**: Check for required APIs before using them
- **Polyfill Strategy**: Minimal polyfills for essential missing features
- **Graceful Degradation**: Reduce animations if performance is poor

## Testing Strategy

### Dual Testing Approach

The application will use both unit testing and property-based testing to ensure comprehensive coverage:

- **Unit tests** verify specific examples, edge cases, and error conditions
- **Property tests** verify universal properties that should hold across all inputs
- Together they provide comprehensive coverage: unit tests catch concrete bugs, property tests verify general correctness

### Unit Testing Requirements

Unit tests will cover:
- Specific examples that demonstrate correct behavior (iframe creation, DOM manipulation)
- Integration points between components (API calls, view transitions)
- Edge cases and error conditions (empty API responses, network failures)
- Browser compatibility scenarios (Smart TV limitations)

### Property-Based Testing Requirements

- **Testing Library**: Use **fast-check** for JavaScript property-based testing
- **Test Configuration**: Each property-based test configured to run minimum 100 iterations
- **Test Tagging**: Each property-based test tagged with comment format: `**Feature: lightweight-cycling-dashboard, Property {number}: {property_text}**`
- **Single Implementation**: Each correctness property implemented by exactly one property-based test
- **Input Generation**: Smart generators that create realistic player data, view configurations, and API responses

### Testing Implementation Strategy

1. **Implementation-First Development**: Implement features before writing corresponding tests
2. **Incremental Testing**: Add tests as each component is developed
3. **Mock Strategy**: Mock Funifier API calls and Looker iframe interactions
4. **Performance Testing**: Verify animations maintain acceptable performance on limited hardware
5. **Cross-Browser Testing**: Test on Smart TV browser simulators where possible

## Implementation Architecture

### File Structure
```
lightweight-cycling-dashboard/
├── index.html              # Main HTML shell
├── styles/
│   ├── main.css           # Core styles and layout
│   ├── animations.css     # CSS transitions and animations
│   └── responsive.css     # Smart TV optimizations
├── scripts/
│   ├── app.js            # Main application controller
│   ├── cycle-manager.js  # View cycling logic
│   ├── data-fetcher.js   # API communication
│   ├── ranking-renderer.js # Spaceship rendering
│   └── view-controller.js # DOM manipulation
└── assets/
    └── spaceships/       # PNG spaceship images (cached locally)
```

### Performance Optimizations

1. **Minimal DOM Manipulation**: Batch DOM updates to reduce reflows
2. **CSS-Based Animations**: Use hardware-accelerated CSS transforms
3. **Asset Preloading**: Preload spaceship images on application start
4. **Memory Management**: Clean up event listeners and timers properly
5. **Smart TV Optimizations**: Reduce animation complexity for limited hardware

### Browser Compatibility Strategy

- **ES5 Compatibility**: Transpile modern JavaScript features for older browsers
- **CSS Fallbacks**: Provide fallback styles for unsupported CSS features
- **Feature Detection**: Progressive enhancement based on available capabilities
- **Minimal Dependencies**: Zero external libraries to reduce compatibility issues

### Security Considerations

- **Content Security Policy**: Restrict iframe sources to trusted Looker domains
- **API Security**: Use HTTPS for all Funifier API calls
- **Input Sanitization**: Sanitize player names and scores before DOM insertion
- **Error Information**: Avoid exposing sensitive error details in production