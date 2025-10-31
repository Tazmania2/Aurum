# Design Document

## Overview

The cycling dashboard is a single-page web application that automatically rotates between four views at 10-second intervals. The implementation uses vanilla HTML, CSS, and JavaScript to minimize dependencies and ensure quick development. The application consists of one HTML file with embedded styles and scripts.

## Architecture

### Single-Page Application Structure

The application uses a simple client-side architecture with no backend requirements:

- **Single HTML file** (`index.html`) containing all markup, styles, and logic
- **CSS-based view management** using display properties to show/hide views
- **JavaScript timer** to control view cycling
- **External dependencies**: Funifier SDK (loaded via CDN) and jQuery (required by Funifier)

### View Cycling Mechanism

```
View 1 (BI) → 10s → View 2 (Widget 1 focus) → 10s → View 3 (Widget 2 focus) → 10s → View 4 (Widget 3 focus) → 10s → [loop back to View 1]
```

The cycling is implemented using `setInterval()` with a 10-second (10000ms) delay, incrementing a view index and applying CSS classes to show/hide views.

## Components and Interfaces

### HTML Structure

```html
<body>
  <div id="view-1" class="view active">
    <!-- BI iframe -->
  </div>
  
  <div id="view-2" class="view">
    <div class="widget-container">
      <div class="widget-large" id="widget-1-large"></div>
      <div class="widget-row">
        <div class="widget-small" id="widget-2-small-v2"></div>
        <div class="widget-small" id="widget-3-small-v2"></div>
      </div>
    </div>
  </div>
  
  <div id="view-3" class="view">
    <div class="widget-container">
      <div class="widget-large" id="widget-2-large"></div>
      <div class="widget-row">
        <div class="widget-small" id="widget-1-small-v3"></div>
        <div class="widget-small" id="widget-3-small-v3"></div>
      </div>
    </div>
  </div>
  
  <div id="view-4" class="view">
    <div class="widget-container">
      <div class="widget-large" id="widget-3-large"></div>
      <div class="widget-row">
        <div class="widget-small" id="widget-1-small-v4"></div>
        <div class="widget-small" id="widget-2-small-v4"></div>
      </div>
    </div>
  </div>
</body>
```

### CSS Layout Strategy

**View Management:**
- All views have `position: absolute` and `display: none` by default
- Active view has `display: block`
- Views occupy full viewport (`width: 100vw`, `height: 100vh`)

**Widget Layouts (Views 2-4):**
- Flexbox column layout for main container
- Large widget: `height: 50%`, `width: 100%`
- Small widgets row: `height: 50%`, flexbox row with two equal-width children (50% each)

**BI Iframe (View 1):**
- Full viewport dimensions
- No borders or padding

### JavaScript Components

#### 1. View Cycling Controller

```javascript
let currentView = 0;
const totalViews = 4;

function cycleViews() {
  // Hide current view
  document.querySelectorAll('.view')[currentView].classList.remove('active');
  
  // Move to next view
  currentView = (currentView + 1) % totalViews;
  
  // Show next view
  document.querySelectorAll('.view')[currentView].classList.add('active');
}

// Start cycling
setInterval(cycleViews, 10000);
```

#### 2. Funifier Widget Initializer

```javascript
function initializeFunifier() {
  Funifier.init({
    apiKey: "69027af6e179d46fce283e7e",
    service: "https://service2.funifier.com"
  }, function() {
    Funifier.auth.setAuthorization("Basic NjkwMjdhZjZlMTc5ZDQ2ZmNlMjgzZTdlOjY5MDI4MjI0ZTE3OWQ0NmZjZTI4NDI2ZA==");
    
    // Render all widget instances
    renderWidget("espacial", "#widget-1-large");
    renderWidget("espacial", "#widget-1-small-v3");
    renderWidget("espacial", "#widget-1-small-v4");
    
    renderWidget("corrida_espacial__referidos", "#widget-2-small-v2");
    renderWidget("corrida_espacial__referidos", "#widget-2-large");
    renderWidget("corrida_espacial__referidos", "#widget-2-small-v4");
    
    renderWidget("corrida_espacial__sdr", "#widget-3-small-v2");
    renderWidget("corrida_espacial__sdr", "#widget-3-small-v3");
    renderWidget("corrida_espacial__sdr", "#widget-3-large");
  });
}

function renderWidget(widgetName, selector) {
  Funifier.widget.render({
    widget: widgetName,
    selector: selector,
    bind: "replace"
  }, function(err, data) {
    if (err) console.error("Widget error:", err);
  });
}
```

## Data Models

No complex data models are required. The application manages:

- **View State**: Simple integer index (0-3) tracking current view
- **Widget Configuration**: Static configuration objects for Funifier SDK

## Error Handling

### Widget Loading Failures

- Funifier SDK errors are logged to console
- Failed widgets don't block view cycling
- No user-facing error messages (dashboard continues operating)

### Network Issues

- BI iframe handles its own loading states
- Funifier SDK has built-in retry logic
- Application continues cycling regardless of content load status

### Browser Compatibility

- Target modern browsers (Chrome, Firefox, Edge, Safari)
- Use standard APIs (no polyfills needed for setInterval, flexbox)
- Fallback: If Funifier fails to load, empty containers are displayed

## Testing Strategy

### Manual Testing Checklist

1. **View Cycling**
   - Verify each view displays for 10 seconds
   - Confirm smooth transitions between views
   - Check that cycling loops back to View 1 after View 4

2. **BI Iframe**
   - Verify Looker Studio report loads and displays correctly
   - Check iframe dimensions fill the viewport

3. **Widget Layouts**
   - Verify View 2 shows Widget 1 large (top 50%), Widgets 2 & 3 small (bottom 25% each)
   - Verify View 3 shows Widget 2 large (top 50%), Widgets 1 & 3 small (bottom 25% each)
   - Verify View 4 shows Widget 3 large (top 50%), Widgets 1 & 2 small (bottom 25% each)

4. **Widget Functionality**
   - Confirm all three Funifier widgets render with correct data
   - Verify widgets are interactive (if applicable)

5. **Cross-Browser Testing**
   - Test in Chrome, Firefox, Edge
   - Verify layout consistency across browsers

### Performance Considerations

- Widgets remain in DOM but hidden (faster transitions, no re-initialization)
- Single timer for cycling (minimal CPU usage)
- No animations or transitions (instant view switching for simplicity)

## Implementation Notes

### Dependencies

- **jQuery**: Required by Funifier SDK (loaded from CDN)
- **Funifier SDK**: Loaded from `https://client2.funifier.com/v3/funifier.js`

### Deployment

- Single HTML file can be opened directly in browser (file://) or served via any web server
- No build process required
- No server-side components needed

### Future Enhancements (Out of Scope)

- Pause/resume controls
- Configurable timing intervals
- Transition animations
- Responsive design for mobile devices
- View navigation controls
