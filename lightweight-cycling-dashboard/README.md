# Lightweight Cycling Dashboard

A lightweight, optimized web application that automatically cycles between a Google Looker Studio dashboard and three animated space-themed leaderboard rankings.

## Features

- **Automatic View Cycling**: Rotates between 4 views every 20 seconds
- **Looker Studio Integration**: Embedded dashboard with automatic refresh
- **Animated Spaceship Rankings**: Players displayed as colorful spaceships
- **Smart TV Optimized**: Built with vanilla JavaScript for maximum compatibility
- **Responsive Design**: Optimized for various screen sizes and Smart TV displays

## Project Structure

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
    └── spaceships/       # Spaceship PNG images
```

## Configuration

Edit the `APP_CONFIG` object in `scripts/app.js` to configure:

- View cycling interval (default: 20 seconds)
- Looker Studio URL
- Leaderboard IDs for each ranking view
- Spaceship asset URLs

## Browser Compatibility

Optimized for Smart TV browsers with support for:
- HTML5, CSS3, and vanilla JavaScript
- No external dependencies
- Graceful degradation for limited browsers
- Performance optimizations for resource-constrained devices

## Getting Started

1. Open `index.html` in a web browser
2. The application will automatically start cycling through views
3. Configure the Looker Studio URL and API endpoints as needed

## API Integration

The application fetches leaderboard data from the Funifier API:
- Endpoint: `/v3/leaderboard/{leaderboardId}`
- Timeout: 10 seconds
- Retry logic: Up to 3 attempts
- Error handling: Graceful fallbacks

## Development

For development and testing:
- Open browser developer tools for debugging
- Use `window.app` to access the application instance
- Check console logs for detailed operation information