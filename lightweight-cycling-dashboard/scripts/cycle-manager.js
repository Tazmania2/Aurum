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
        this.isPaused = false;
        this.viewReadyTimeout = null;
        this.maxViewLoadTime = 20000; // Maximum time to wait for view to load
    }
    
    start() {
        if (this.isRunning) {
            console.warn('Cycle manager is already running');
            return;
        }
        
        console.log(`🚀 Starting view cycling with ${this.intervalMs}ms interval`);
        this.isRunning = true;
        this.isPaused = false;
        
        // Start the interval timer
        this.restartTimer();
        
        console.log(`🚀 Cycle manager started with dynamic timing support`);
    }
    
    stop() {
        if (!this.isRunning) {
            return;
        }
        
        console.log('Stopping view cycling');
        this.isRunning = false;
        this.isPaused = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        if (this.viewReadyTimeout) {
            clearTimeout(this.viewReadyTimeout);
            this.viewReadyTimeout = null;
        }
    }
    
    nextView() {
        if (!this.isRunning) {
            console.log('Cycle manager not running, skipping view change');
            return;
        }
        
        if (this.isPaused) {
            console.log('Cycle manager is paused, skipping view change');
            return;
        }
        
        // Calculate next view index
        this.currentIndex = (this.currentIndex + 1) % this.views.length;
        const nextView = this.views[this.currentIndex];
        
        console.log(`🔄 Cycling to view ${this.currentIndex}: ${nextView.id} (${nextView.type})`);
        console.log(`🔄 Cycle manager status: running=${this.isRunning}, paused=${this.isPaused}, interval=${this.intervalMs}ms`);
        
        // Update app state
        if (this.appState) {
            this.appState.setCurrentViewIndex(this.currentIndex);
        }
        
        // Pause the cycle timer until view is ready (especially for iframe views)
        this.pauseForViewLoad(nextView);
        
        // Call the callback if provided with enhanced error handling
        if (this.onViewChangeCallback && typeof this.onViewChangeCallback === 'function') {
            try {
                // Use Promise.resolve to handle both sync and async callbacks
                Promise.resolve(this.onViewChangeCallback(nextView))
                    .then(() => {
                        console.log(`View change callback completed for ${nextView.id}`);
                    })
                    .catch(error => {
                        console.error('Error in view change callback:', error);
                        console.error('Error details:', error.message, error.stack);
                        // Continue cycling despite callback errors
                        console.log('Continuing view cycling despite callback error');
                        // Make sure to resume cycling even if callback fails
                        this.onViewReady();
                    });
            } catch (error) {
                console.error('Synchronous error in view change callback:', error);
                console.error('Error details:', error.message, error.stack);
                // Continue cycling despite callback errors
                console.log('Continuing view cycling despite synchronous callback error');
                // Make sure to resume cycling even if callback fails
                this.onViewReady();
            }
        }
    }
    
    // Pause cycling until view is ready to be displayed
    pauseForViewLoad(viewConfig) {
        if (viewConfig.type === 'looker') {
            console.log('⏸️ Pausing cycle timer for iframe loading...');
            this.isPaused = true;
            
            // Stop the current interval timer
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
                console.log('⏸️ Interval timer stopped for iframe loading');
            }
            
            // Set a maximum wait time as safety net
            this.viewReadyTimeout = setTimeout(() => {
                console.warn('⏰ View load timeout, resuming cycling');
                this.onViewReady();
            }, this.maxViewLoadTime);
        } else {
            // For non-iframe views, don't pause - they load quickly
            console.log('🏆 Non-iframe view, no pause needed');
            // Still notify that view is ready immediately for non-iframe views
            setTimeout(() => {
                if (this.onViewChangeCallback) {
                    // The view change callback will handle notifying when ready
                }
            }, 100);
        }
    }
    
    // Called when view is ready to be displayed
    onViewReady() {
        if (this.viewReadyTimeout) {
            clearTimeout(this.viewReadyTimeout);
            this.viewReadyTimeout = null;
        }
        
        if (this.isPaused) {
            console.log('▶️ View ready, resuming cycle timer');
            this.isPaused = false;
            
            // Restart the interval timer for the next cycle
            this.restartTimer();
        }
    }
    
    // Restart the interval timer
    restartTimer() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        if (this.isRunning) {
            console.log(`🔄 Restarting cycle timer (${this.intervalMs}ms)`);
            this.intervalId = setInterval(() => {
                try {
                    console.log(`⏰ Interval triggered - about to call nextView()`);
                    this.nextView();
                    console.log(`✅ nextView() completed successfully`);
                } catch (error) {
                    console.error('❌ Critical error in cycle interval:', error);
                    console.error('❌ Error stack:', error.stack);
                    // Don't stop cycling - log error and continue
                    console.log('🔄 Continuing cycle despite interval error');
                }
            }, this.intervalMs);
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