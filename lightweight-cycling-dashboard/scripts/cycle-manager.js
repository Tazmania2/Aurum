// Cycle Manager - Controls automatic view transitions

class CycleManager {
    constructor(views, intervalMs = 20000, onViewChangeCallback = null, appState = null) {
        this.views = views;
        this.intervalMs = intervalMs;
        this.onViewChangeCallback = onViewChangeCallback;
        this.appState = appState;
        this.currentIndex = 0;
        this.intervalId = null;
        this.isRunning = false;
    }
    
    start() {
        if (this.isRunning) {
            console.warn('Cycle manager is already running');
            return;
        }
        
        console.log(`Starting view cycling with ${this.intervalMs}ms interval`);
        this.isRunning = true;
        
        // Start the interval
        this.intervalId = setInterval(() => {
            this.nextView();
        }, this.intervalMs);
    }
    
    stop() {
        if (!this.isRunning) {
            return;
        }
        
        console.log('Stopping view cycling');
        this.isRunning = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    
    nextView() {
        if (!this.isRunning) {
            return;
        }
        
        // Calculate next view index
        this.currentIndex = (this.currentIndex + 1) % this.views.length;
        const nextView = this.views[this.currentIndex];
        
        console.log(`Cycling to view ${this.currentIndex}: ${nextView.id}`);
        
        // Update app state
        if (this.appState) {
            this.appState.setCurrentViewIndex(this.currentIndex);
        }
        
        // Call the callback if provided with enhanced error handling
        if (this.onViewChangeCallback && typeof this.onViewChangeCallback === 'function') {
            try {
                // Use Promise.resolve to handle both sync and async callbacks
                Promise.resolve(this.onViewChangeCallback(nextView))
                    .catch(error => {
                        console.error('Error in view change callback:', error);
                        // Continue cycling despite callback errors
                        console.log('Continuing view cycling despite callback error');
                    });
            } catch (error) {
                console.error('Synchronous error in view change callback:', error);
                // Continue cycling despite callback errors
                console.log('Continuing view cycling despite synchronous callback error');
            }
        }
    }
    
    getCurrentView() {
        return this.views[this.currentIndex];
    }
    
    getCurrentIndex() {
        return this.currentIndex;
    }
    
    setCurrentIndex(index) {
        if (index >= 0 && index < this.views.length) {
            this.currentIndex = index;
            
            // Update app state
            if (this.appState) {
                this.appState.setCurrentViewIndex(this.currentIndex);
            }
        } else {
            console.error(`Invalid view index: ${index}`);
        }
    }
    
    // Manual navigation methods (for debugging/testing)
    goToView(index) {
        if (index >= 0 && index < this.views.length) {
            this.setCurrentIndex(index);
            const view = this.views[this.currentIndex];
            
            if (this.onViewChangeCallback) {
                this.onViewChangeCallback(view);
            }
        }
    }
    
    goToNext() {
        this.nextView();
    }
    
    goToPrevious() {
        this.currentIndex = (this.currentIndex - 1 + this.views.length) % this.views.length;
        const view = this.views[this.currentIndex];
        
        // Update app state
        if (this.appState) {
            this.appState.setCurrentViewIndex(this.currentIndex);
        }
        
        if (this.onViewChangeCallback) {
            this.onViewChangeCallback(view);
        }
    }
    
    // Utility methods
    getViewCount() {
        return this.views.length;
    }
    
    getInterval() {
        return this.intervalMs;
    }
    
    setInterval(intervalMs) {
        this.intervalMs = intervalMs;
        
        // Restart with new interval if currently running
        if (this.isRunning) {
            this.stop();
            this.start();
        }
    }
    
    // Cleanup method
    destroy() {
        this.stop();
        this.views = null;
        this.onViewChangeCallback = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CycleManager;
}