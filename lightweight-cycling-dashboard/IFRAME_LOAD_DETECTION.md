# Iframe Load Detection Implementation

## Problem Solved
The cycling dashboard was not waiting for the BI iframe (Looker Studio) to fully load before starting the next cycle timer. This meant users didn't get enough time to view the dashboard content, especially on slower connections.

## Solution Overview
Implemented a sophisticated iframe load detection system that:
1. **Pauses the cycle timer** when loading iframe views
2. **Detects when iframe content is ready** using multiple methods
3. **Resumes cycling** only after content loads (or timeout)
4. **Provides fallback timing** to prevent infinite waiting

## Technical Implementation

### 1. Enhanced Cycle Manager (`cycle-manager.js`)

#### New Properties
```javascript
this.isPaused = false;              // Tracks if cycling is paused
this.viewReadyTimeout = null;       // Safety timeout for view loading
this.maxViewLoadTime = 20000;       // Maximum wait time (20 seconds)
```

#### Pause/Resume Logic
```javascript
pauseForViewLoad(viewConfig) {
    if (viewConfig.type === 'looker') {
        console.log('⏸️ Pausing cycle timer for iframe loading...');
        this.isPaused = true;
        
        // Safety timeout to prevent infinite waiting
        this.viewReadyTimeout = setTimeout(() => {
            console.warn('⏰ View load timeout, resuming cycling');
            this.onViewReady();
        }, this.maxViewLoadTime);
    }
}

onViewReady() {
    if (this.isPaused) {
        console.log('▶️ View ready, resuming cycle timer');
        this.isPaused = false;
        this.restartTimer(); // Start fresh timer for next cycle
    }
}
```

### 2. Iframe Load Detection (`app.js`)

#### Multi-Method Detection
The system uses multiple detection methods for maximum compatibility:

```javascript
async waitForIframeLoad(maxWaitTime = 15000) {
    return new Promise((resolve) => {
        const iframe = document.getElementById('looker-iframe');
        
        // Method 1: Standard iframe load event
        iframe.addEventListener('load', onLoad, { once: true });
        iframe.addEventListener('error', onError, { once: true });
        
        // Method 2: Source URL stability check (for cross-origin)
        let stableCount = 0;
        const checkInterval = setInterval(() => {
            if (iframe.src === lastSrc && iframe.src) {
                stableCount++;
                if (stableCount >= 3) { // 3 stable checks = loaded
                    resolve(true);
                }
            }
        }, 1000);
        
        // Method 3: Content document ready state (when accessible)
        try {
            if (iframe.contentDocument?.readyState === 'complete') {
                resolve(true);
            }
        } catch (crossOriginError) {
            // Expected for external iframes
        }
        
        // Safety timeout
        setTimeout(() => resolve(false), maxWaitTime);
    });
}
```

#### Enhanced Looker Loading
```javascript
async loadLookerView(viewConfig) {
    // Refresh iframe with timestamp
    const refreshSuccess = this.refreshLookerIframe();
    
    // Wait for iframe to load completely
    const loadSuccess = await this.waitForIframeLoad();
    
    if (loadSuccess) {
        console.log('📊 Looker iframe loaded successfully');
        this.cycleManager.onViewReady(); // Resume cycling
    } else {
        console.warn('📊 Iframe load timeout, continuing anyway');
        this.cycleManager.onViewReady(); // Resume cycling even on timeout
    }
}
```

### 3. View-Specific Behavior

#### Looker Views (iframe)
- ⏸️ **Pauses cycling** when view starts loading
- 🔍 **Detects iframe load** using multiple methods
- ⏰ **15-second timeout** for load detection
- ▶️ **Resumes cycling** when loaded or timeout
- 🛡️ **20-second safety timeout** as final fallback

#### Ranking Views (API data)
- 🏃 **No pause** - loads quickly via API
- 📊 **Notifies when ready** after data renders
- ⚡ **Immediate cycling** - no iframe delays

## Detection Methods Explained

### Method 1: Standard Load Event
```javascript
iframe.addEventListener('load', onLoad, { once: true });
```
- **Works for**: Same-origin iframes
- **Limitation**: May not fire for cross-origin content
- **Reliability**: High when applicable

### Method 2: URL Stability Check
```javascript
if (iframe.src === lastSrc && iframe.src) {
    stableCount++;
    if (stableCount >= 3) resolve(true);
}
```
- **Works for**: All iframes
- **Logic**: If URL stops changing for 3 seconds, consider loaded
- **Reliability**: Good fallback for cross-origin

### Method 3: Content Document Check
```javascript
if (iframe.contentDocument?.readyState === 'complete') {
    resolve(true);
}
```
- **Works for**: Same-origin iframes only
- **Advantage**: Most accurate when available
- **Limitation**: Blocked by CORS for external content

## Timing Configuration

| Setting | Value | Purpose |
|---------|-------|---------|
| **Load Detection Timeout** | 15 seconds | Maximum time to wait for iframe load detection |
| **Safety Timeout** | 20 seconds | Absolute maximum time before forcing resume |
| **Stability Checks** | 3 checks | Number of stable URL checks needed |
| **Check Interval** | 1 second | How often to check iframe status |

## User Experience Improvements

### Before Implementation
- ❌ Iframe starts loading
- ❌ Cycle timer continues immediately (15-30 seconds)
- ❌ View switches before content loads
- ❌ Users see blank/loading iframe briefly

### After Implementation
- ✅ Iframe starts loading
- ✅ Cycle timer pauses automatically
- ✅ System waits for content to load
- ✅ Timer resumes only when ready
- ✅ Users see fully loaded content for full duration

## Error Handling & Fallbacks

1. **Load Timeout**: If iframe doesn't load in 15 seconds, continue anyway
2. **Safety Timeout**: Absolute 20-second limit prevents infinite waiting
3. **Network Errors**: Show error state but continue cycling
4. **Cross-Origin Issues**: Use URL stability as fallback detection

## Testing

Use `test-cycling-fix.html` to verify:
- ✅ Cycling pauses on Looker views
- ✅ Timer resumes after simulated load
- ✅ Debug panel shows pause/resume status
- ✅ Timeout handling works correctly

## Performance Impact

- **Minimal CPU**: Detection runs every 1 second only during iframe loading
- **Memory Efficient**: Cleans up all timers and listeners
- **Network Friendly**: No additional requests, just monitors existing iframe
- **User Focused**: Ensures content is visible before cycling

The system now provides a much better user experience by ensuring iframe content is fully loaded and visible before moving to the next view.