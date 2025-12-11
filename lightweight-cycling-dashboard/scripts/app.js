// Main application controller
// Initializes and coordinates all components

/**
 * AppState class manages current view index and application state
 * Follows the data model defined in the design document
 */
class AppState {
    constructor() {
        this.currentViewIndex = 0;
        this.isRunning = false;
        this.views = [
            {
                id: 'looker-view',
                type: 'looker',
                lookerUrl: 'https://lookerstudio.google.com/embed/reporting/601fc253-c576-410f-b3fb-437d9f892ae3/page/8QlXF'
            },
            {
                id: 'ranking-1',
                type: 'ranking',
                title: 'Vendedores',
                leaderboardId: 'FbdmEIT'
            },
            {
                id: 'ranking-2',
                type: 'ranking',
                title: 'Referidos', 
                leaderboardId: 'Fbdup9L'
            },
            {
                id: 'ranking-3',
                type: 'ranking',
                title: 'SDR',
                leaderboardId: 'Fbdurjz'
            }
        ];
        this.spaceshipAssets = [
            { car: 'red', image: 'assets/spaceships/spaceship_red.svg', fallback: '🚀' },
            { car: 'gold', image: 'assets/spaceships/spaceship_gold.svg', fallback: '🥇' },
            { car: 'silver', image: 'assets/spaceships/spaceship_silver.svg', fallback: '🥈' },
            { car: 'bronze', image: 'assets/spaceships/spaceship_bronze.svg', fallback: '🥉' },
            { car: 'yellow', image: 'assets/spaceships/spaceship_yellow.svg', fallback: '⭐' },
            { car: 'green', image: 'assets/spaceships/spaceship_green.svg', fallback: '🌟' }
        ];
    }
    
    /**
     * Get the current view configuration
     * @returns {Object} Current view configuration object
     */
    getCurrentView() {
        return this.views[this.currentViewIndex];
    }
    
    /**
     * Get the next view index in the cycle
     * @returns {number} Next view index (wraps around to 0 after last view)
     */
    getNextViewIndex() {
        return (this.currentViewIndex + 1) % this.views.length;
    }
    
    /**
     * Set the current view index
     * @param {number} index - The view index to set
     */
    setCurrentViewIndex(index) {
        if (index >= 0 && index < this.views.length) {
            this.currentViewIndex = index;
        } else {
            throw new Error(`Invalid view index: ${index}. Must be between 0 and ${this.views.length - 1}`);
        }
    }
    
    /**
     * Advance to the next view in the sequence
     * @returns {Object} The new current view configuration
     */
    nextView() {
        this.currentViewIndex = this.getNextViewIndex();
        return this.getCurrentView();
    }
    
    /**
     * Get all view configurations
     * @returns {Array} Array of view configuration objects
     */
    getViews() {
        return this.views;
    }
    
    /**
     * Get all spaceship assets
     * @returns {Array} Array of spaceship asset objects
     */
    getSpaceshipAssets() {
        return this.spaceshipAssets;
    }
    
    /**
     * Check if the application is currently running
     * @returns {boolean} True if running, false otherwise
     */
    isApplicationRunning() {
        return this.isRunning;
    }
    
    /**
     * Set the running state of the application
     * @param {boolean} running - Whether the application should be running
     */
    setRunning(running) {
        this.isRunning = Boolean(running);
    }
}

// Application class
class App {
    constructor() {
        this.appState = new AppState();
        this.cycleManager = null;
        this.viewController = null;
        this.dataFetcher = null;
        this.rankingRenderer = null;
        this.lookerManager = null;
        this.smartTVCompat = null;
        this.initialized = false;
        this.cycleInterval = 20000; // 20 seconds per view
        this.preloadedImages = [];
        this.animationFrameId = null;
        
        // Bind event handlers for proper cleanup
        this.visibilityChangeHandler = this.handleVisibilityChange.bind(this);
        this.globalErrorHandler = this.handleGlobalError.bind(this);
        this.unhandledRejectionHandler = this.handleUnhandledRejection.bind(this);
        this.beforeUnloadHandler = this.handleBeforeUnload.bind(this);
    }
    
    async init() {
        try {
            console.log('Initializing Lightweight Cycling Dashboard...');
            
            // Initialize Smart TV compatibility first - implements Requirements 5.1, 5.4, 5.5
            this.smartTVCompat = new SmartTVCompat();
            this.smartTVCompat.applyOptimizations();
            
            // Apply performance classes to document body
            this.applyPerformanceClasses();
            
            // Get performance recommendations for Smart TV optimization
            const perfRecommendations = this.smartTVCompat.getPerformanceRecommendations();
            this.cycleInterval = perfRecommendations.cycleInterval;
            
            // Initialize components
            this.viewController = new ViewController();
            this.dataFetcher = new DataFetcher();
            this.rankingRenderer = new RankingRenderer(
                this.appState.getSpaceshipAssets(),
                perfRecommendations
            );
            this.lookerManager = new LookerManager();
            this.cycleManager = new CycleManager(
                this.appState.getViews(),
                this.cycleInterval,
                this.onViewChange.bind(this),
                this.appState
            );
            
            // Preload spaceship images
            await this.preloadAssets();
            
            // Set up Looker iframe
            this.setupLookerIframe();
            
            this.initialized = true;
            console.log('Application initialized successfully with Smart TV optimizations');
            
            // Start the application
            await this.start();
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize application');
        }
    }
    
    async preloadAssets() {
        console.log('Preloading spaceship assets for optimal performance...');
        
        // Enhanced asset preloading with performance monitoring
        const startTime = Date.now();
        const loadedAssets = [];
        const failedAssets = [];
        
        const promises = this.appState.getSpaceshipAssets().map(asset => {
            return new Promise((resolve) => {
                const img = new Image();
                
                // Set up performance monitoring
                const assetStartTime = Date.now();
                
                img.onload = () => {
                    const loadTime = Date.now() - assetStartTime;
                    console.log(`✓ Loaded ${asset.car} spaceship (${loadTime}ms)`);
                    loadedAssets.push({ ...asset, loadTime });
                    resolve(asset);
                };
                
                img.onerror = () => {
                    const loadTime = Date.now() - assetStartTime;
                    console.warn(`✗ Failed to load ${asset.car} spaceship after ${loadTime}ms: ${asset.image}`);
                    failedAssets.push({ ...asset, loadTime });
                    resolve(asset); // Continue even if some assets fail
                };
                
                // Set crossorigin for CORS compliance
                img.crossOrigin = 'anonymous';
                img.src = asset.image;
                
                // Store reference for cleanup
                this.preloadedImages = this.preloadedImages || [];
                this.preloadedImages.push(img);
            });
        });
        
        await Promise.all(promises);
        
        const totalTime = Date.now() - startTime;
        console.log(`Asset preloading completed in ${totalTime}ms:`);
        console.log(`- Successfully loaded: ${loadedAssets.length} assets`);
        console.log(`- Failed to load: ${failedAssets.length} assets`);
        
        // Store preload results for performance analysis
        this.assetPreloadResults = {
            totalTime,
            loadedAssets,
            failedAssets,
            timestamp: new Date().toISOString()
        };
        
        // Preload additional performance-critical resources
        await this.preloadAdditionalResources();
    }
    
    async preloadAdditionalResources() {
        console.log('Preloading additional performance-critical resources...');
        
        // Preload network connectivity test endpoint
        try {
            const testImg = new Image();
            testImg.src = 'https://httpbin.org/status/200';
            // Don't wait for this - it's just for DNS prefetch
        } catch (error) {
            console.log('Network test preload skipped:', error.message);
        }
        
        // Warm up the Funifier API connection
        if (this.dataFetcher) {
            try {
                // Make a lightweight connection test (don't wait for full response)
                setTimeout(() => {
                    this.dataFetcher.checkNetworkStatus().catch(() => {
                        // Ignore errors - this is just for connection warming
                    });
                }, 1000);
            } catch (error) {
                console.log('API warmup skipped:', error.message);
            }
        }
        
        console.log('Additional resource preloading initiated');
    }
    
    setupLookerIframe() {
        const lookerView = this.appState.getViews().find(view => view.type === 'looker');
        
        if (lookerView && this.lookerManager) {
            // Set the Looker URL and configure for full viewport - implements Requirements 2.1, 2.4
            const success = this.lookerManager.setUrl(lookerView.lookerUrl);
            if (success) {
                this.lookerManager.setFullViewport();
                console.log('Looker iframe configured successfully');
            } else {
                console.error('Failed to set Looker URL');
            }
        } else {
            console.warn('Looker view or LookerManager not available');
        }
    }
    
    async start() {
        if (!this.initialized) {
            console.error('Cannot start: Application not initialized');
            return;
        }
        
        console.log('Starting view cycling...');
        this.appState.setRunning(true);
        
        // Load and show initial view - implements complete view cycle Requirements 1.1, 8.2
        const initialView = this.appState.getCurrentView();
        await this.onViewChange(initialView);
        
        // Start automatic cycling - implements Requirements 1.2, 1.3, 1.5
        this.cycleManager.start();
        
        console.log('Application started successfully');
    }
    
    stop() {
        console.log('Stopping application...');
        
        // Check if appState exists before calling setRunning
        if (this.appState) {
            this.appState.setRunning(false);
        }
        
        if (this.cycleManager) {
            this.cycleManager.stop();
        }
        
        // Clean up Smart TV compatibility resources - implements Requirements 5.5
        if (this.smartTVCompat) {
            this.smartTVCompat.cleanup();
        }
        
        // Perform comprehensive cleanup
        this.cleanup();
    }
    
    cleanup() {
        console.log('Performing comprehensive application cleanup...');
        
        try {
            // Clean up component resources
            if (this.cycleManager) {
                this.cycleManager.destroy();
                this.cycleManager = null;
            }
            
            if (this.viewController) {
                this.viewController.destroy();
                this.viewController = null;
            }
            
            if (this.smartTVCompat) {
                this.smartTVCompat.cleanup();
                this.smartTVCompat = null;
            }
            
            // Clean up preloaded images
            if (this.preloadedImages) {
                this.preloadedImages.forEach(img => {
                    img.onload = null;
                    img.onerror = null;
                    img.src = '';
                });
                this.preloadedImages = null;
            }
            
            // Clean up any remaining timers
            this.clearAllTimers();
            
            // Clean up event listeners
            this.removeEventListeners();
            
            // Clean up DOM elements that might have been dynamically created
            this.cleanupDynamicElements();
            
            // Clear references to prevent memory leaks
            this.dataFetcher = null;
            this.rankingRenderer = null;
            this.lookerManager = null;
            this.appState = null;
            
            console.log('Application cleanup completed successfully');
            
        } catch (error) {
            console.error('Error during application cleanup:', error);
        }
    }
    
    clearAllTimers() {
        // Clear any timers that might still be running
        // This is a safety net for any timers not properly cleaned up by components
        
        // Get all timer IDs (this is a bit of a hack but necessary for thorough cleanup)
        const highestTimeoutId = setTimeout(() => {}, 0);
        for (let i = 0; i <= highestTimeoutId; i++) {
            clearTimeout(i);
            clearInterval(i);
        }
        
        // Cancel any pending animation frames
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        console.log('All timers and animation frames cleared');
    }
    
    removeEventListeners() {
        // Remove global event listeners that were added by the application
        
        // Remove visibility change listener
        document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
        
        // Remove error handlers
        window.removeEventListener('error', this.globalErrorHandler);
        window.removeEventListener('unhandledrejection', this.unhandledRejectionHandler);
        
        // Remove beforeunload handler
        window.removeEventListener('beforeunload', this.beforeUnloadHandler);
        
        console.log('Global event listeners removed');
    }
    
    cleanupDynamicElements() {
        // Clean up any dynamically created elements that might not be properly removed
        
        // Remove any error elements
        const errorElements = document.querySelectorAll('.view-error, .spaceship[data-cleanup="true"]');
        errorElements.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        
        // Clean up any orphaned spaceship elements
        const orphanedSpaceships = document.querySelectorAll('.spaceship:not([data-active="true"])');
        orphanedSpaceships.forEach(spaceship => {
            spaceship.setAttribute('data-cleanup', 'true');
            // Mark for cleanup rather than immediate removal to avoid visual glitches
        });
        
        // Remove any temporary style elements added by Smart TV compatibility
        const tempStyles = document.querySelectorAll('style[data-smart-tv-compat="true"]');
        tempStyles.forEach(style => {
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        });
        
        console.log('Dynamic elements cleaned up');
    }
    
    async onViewChange(viewConfig) {
        try {
            console.log(`Switching to view: ${viewConfig.id}`);
            
            // Hide all views first
            this.viewController.hideAllViews();
            
            if (viewConfig.type === 'looker') {
                // Enhanced Looker iframe handling with error recovery
                await this.loadLookerView(viewConfig);
            } else if (viewConfig.type === 'ranking') {
                // Enhanced ranking view loading with comprehensive error handling
                await this.loadRankingView(viewConfig);
            }
            
            // Show the view (this happens regardless of load success/failure)
            this.viewController.showView(viewConfig.id);
            
        } catch (error) {
            console.error(`Critical error in view change for ${viewConfig.id}:`, error);
            
            // Even if there's a critical error, show the view to maintain cycling
            this.showViewError(viewConfig.id, `Critical error loading ${viewConfig.type} view`);
            this.viewController.showView(viewConfig.id);
            
            // Handle error recovery
            await this.handleViewLoadError(viewConfig, error);
        }
    }
    
    // Enhanced Looker view loading with error handling
    async loadLookerView(viewConfig) {
        try {
            // Refresh Looker iframe with timestamp - implements Requirements 2.2
            const refreshSuccess = this.refreshLookerIframe();
            
            if (!refreshSuccess) {
                throw new Error('Failed to refresh Looker iframe');
            }
            
            // Wait a moment for iframe to start loading
            await this.delay(500);
            
            // Check if iframe loaded successfully (basic check)
            const iframe = document.getElementById('looker-iframe');
            if (!iframe || !iframe.src) {
                throw new Error('Looker iframe not properly configured');
            }
            
            console.log('Looker view loaded successfully');
            
        } catch (error) {
            console.error('Failed to load Looker view:', error);
            
            // Show fallback content for Looker errors
            this.showLookerError(viewConfig, error);
            throw error; // Re-throw to be handled by onViewChange
        }
    }
    
    // Show Looker-specific error state
    showLookerError(viewConfig, error) {
        const lookerContainer = document.getElementById('looker-view');
        if (lookerContainer) {
            lookerContainer.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column; background: #1a1a1a;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">📊</div>
                    <h2 style="color: #ff6b6b; margin-bottom: 20px;">Dashboard Unavailable</h2>
                    <p style="color: rgba(255, 255, 255, 0.7); text-align: center; max-width: 500px; margin-bottom: 10px;">
                        Unable to load the Looker Studio dashboard. This may be due to network issues or dashboard configuration.
                    </p>
                    <p style="color: rgba(255, 255, 255, 0.5); font-size: 0.9rem;">
                        The dashboard will be retried on the next cycle.
                    </p>
                    <div style="margin-top: 30px; padding: 20px; background: rgba(255, 107, 107, 0.1); border-radius: 8px; max-width: 400px;">
                        <p style="color: rgba(255, 255, 255, 0.6); font-size: 0.8rem; margin: 0;">
                            Error: ${error.message}
                        </p>
                    </div>
                </div>
            `;
        }
    }
    
    refreshLookerIframe() {
        try {
            if (this.lookerManager) {
                // Force reload with timestamp parameter - implements Requirements 2.2
                const success = this.lookerManager.reload();
                if (success) {
                    console.log('Looker iframe refreshed with timestamp parameter');
                    return true;
                } else {
                    console.warn('LookerManager reload failed, trying fallback method');
                    return this.viewController.reloadLookerIframe();
                }
            } else {
                console.warn('LookerManager not available, using fallback method');
                return this.viewController.reloadLookerIframe();
            }
        } catch (error) {
            console.error('Error refreshing Looker iframe:', error);
            
            // Ultimate fallback - direct iframe manipulation
            try {
                const iframe = document.getElementById('looker-iframe');
                if (iframe) {
                    const currentSrc = iframe.src;
                    const separator = currentSrc.includes('?') ? '&' : '?';
                    iframe.src = currentSrc + separator + 't=' + Date.now();
                    console.log('Looker iframe refreshed using direct manipulation');
                    return true;
                }
            } catch (fallbackError) {
                console.error('All Looker refresh methods failed:', fallbackError);
            }
            
            return false;
        }
    }
    
    async loadRankingView(viewConfig) {
        const containerId = `ranking-container-${viewConfig.id.split('-')[1]}`;
        let loadAttempts = 0;
        const maxLoadAttempts = 3;
        
        while (loadAttempts < maxLoadAttempts) {
            try {
                loadAttempts++;
                console.log(`Loading ranking data for ${viewConfig.leaderboardId} (attempt ${loadAttempts})`);
                
                // Show loading state
                if (loadAttempts === 1) {
                    this.showLoadingState(containerId);
                }
                
                // Check network status before attempting API call
                const isOnline = await this.dataFetcher.checkNetworkStatus();
                if (!isOnline) {
                    throw new Error('Network offline - no internet connection detected');
                }
                
                // Make fresh API call with enhanced error handling
                const playerData = await this.dataFetcher.fetchLeaderboard(viewConfig.leaderboardId);
                
                // Render ranking with comprehensive error handling
                const renderSuccess = this.rankingRenderer.renderRanking(
                    playerData, 
                    containerId, 
                    viewConfig.title
                );
                
                if (renderSuccess) {
                    console.log(`Successfully loaded ranking view ${viewConfig.id} with ${playerData.length} players`);
                    return; // Success - exit retry loop
                } else {
                    throw new Error('Failed to render ranking display');
                }
                
            } catch (error) {
                console.error(`Failed to load ranking ${viewConfig.leaderboardId} (attempt ${loadAttempts}):`, error);
                
                const errorInfo = this.dataFetcher.handleApiError(error);
                
                // On final attempt, show error state but continue cycling
                if (loadAttempts >= maxLoadAttempts) {
                    console.error(`All ${maxLoadAttempts} attempts failed for ${viewConfig.leaderboardId}`);
                    
                    // Show error state with recovery information
                    this.rankingRenderer.renderRanking(null, containerId, viewConfig.title, errorInfo);
                    
                    // Don't throw - allow cycling to continue
                    return;
                }
                
                // Wait before retry if error is recoverable
                if (errorInfo.recoverable && errorInfo.retryAfter) {
                    console.log(`Waiting ${errorInfo.retryAfter}ms before retry...`);
                    await this.delay(Math.min(errorInfo.retryAfter, 5000)); // Cap retry delay at 5 seconds
                } else {
                    // Short delay for non-recoverable errors
                    await this.delay(1000);
                }
            }
        }
    }
    
    // Show loading state in specific container
    showLoadingState(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            this.rankingRenderer.renderEmptyState(container, 'loading');
        }
    }
    
    // Enhanced error recovery with automatic retry scheduling
    async handleViewLoadError(viewConfig, error) {
        const errorInfo = this.dataFetcher.handleApiError(error);
        console.error(`View load error for ${viewConfig.id}:`, errorInfo);
        
        // Schedule automatic retry for recoverable errors
        if (errorInfo.recoverable && errorInfo.retryAfter) {
            console.log(`Scheduling retry for ${viewConfig.id} in ${errorInfo.retryAfter}ms`);
            
            setTimeout(async () => {
                try {
                    console.log(`Retrying failed view: ${viewConfig.id}`);
                    await this.loadRankingView(viewConfig);
                } catch (retryError) {
                    console.error(`Retry failed for ${viewConfig.id}:`, retryError);
                    // Don't schedule further retries to avoid infinite loops
                }
            }, errorInfo.retryAfter);
        }
    }
    
    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    showRankingError(viewConfig) {
        const containerId = `ranking-container-${viewConfig.id.split('-')[1]}`;
        const container = document.getElementById(containerId);
        
        if (container) {
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
                    <h2 style="color: #ff6b6b; margin-bottom: 20px;">Unable to load ranking data</h2>
                    <p style="color: rgba(255, 255, 255, 0.7);">The leaderboard will be updated on the next cycle</p>
                    <p style="color: rgba(255, 255, 255, 0.5); font-size: 0.9rem; margin-top: 10px;">Leaderboard: ${viewConfig.leaderboardId}</p>
                </div>
            `;
        }
    }
    
    showViewError(viewId, errorMessage) {
        console.error(`View error for ${viewId}: ${errorMessage}`);
        
        // Use view controller's error display if available
        if (this.viewController && this.viewController.showViewError) {
            this.viewController.showViewError(viewId, errorMessage);
        } else {
            // Fallback error display
            const viewElement = document.getElementById(viewId);
            if (viewElement) {
                viewElement.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column;">
                        <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
                        <h2 style="color: #ff6b6b; margin-bottom: 20px;">Error</h2>
                        <p style="color: rgba(255, 255, 255, 0.7); text-align: center; max-width: 600px;">${errorMessage}</p>
                    </div>
                `;
            }
        }
    }
    
    showLoading() {
        const indicator = document.getElementById('loading-indicator');
        if (indicator) {
            indicator.classList.add('show');
        }
    }
    
    hideLoading() {
        const indicator = document.getElementById('loading-indicator');
        if (indicator) {
            indicator.classList.remove('show');
        }
    }
    
    applyPerformanceClasses() {
        const body = document.body;
        const capabilities = this.smartTVCompat.capabilities;
        const performanceMode = this.smartTVCompat.performanceMode;
        
        // Add Smart TV class if detected
        if (this.smartTVCompat.isSmartTV) {
            body.classList.add('smart-tv-optimized');
        }
        
        // Add performance mode class
        body.classList.add(`performance-${performanceMode}`);
        
        // Add capability-based classes for fallbacks
        if (!capabilities.cssFlexbox) {
            body.classList.add('no-flexbox');
        }
        
        if (!capabilities.cssTransforms) {
            body.classList.add('no-transforms');
        }
        
        if (!capabilities.cssTransitions) {
            body.classList.add('no-transitions');
        }
        
        if (!capabilities.cssAnimations) {
            body.classList.add('no-animations');
        }
        
        // Add memory optimization class for low-end devices
        if (performanceMode === 'low' || (capabilities.deviceMemory && capabilities.deviceMemory <= 1)) {
            body.classList.add('memory-optimized');
        }
        
        console.log('Applied performance classes:', Array.from(body.classList));
    }
    
    showError(message) {
        console.error(message);
        // Could implement a more sophisticated error display here
        alert(message);
    }
    
    // Event handler methods for proper cleanup
    handleVisibilityChange() {
        if (document.hidden) {
            console.log('Page hidden, pausing application');
            this.stop();
        } else {
            console.log('Page visible, resuming application');
            this.start();
        }
    }
    
    handleGlobalError(event) {
        console.error('Global error:', event.error);
        // Could implement error reporting here
    }
    
    handleUnhandledRejection(event) {
        console.error('Unhandled promise rejection:', event.reason);
        // Could implement error reporting here
    }
    
    handleBeforeUnload() {
        console.log('Page unloading, cleaning up resources...');
        this.cleanup();
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing application...');
    
    const app = new App();
    app.init().catch(error => {
        console.error('Application initialization failed:', error);
    });
    
    // Make app globally available for debugging
    window.app = app;
});

// Handle page visibility changes (for Smart TV power management)
document.addEventListener('visibilitychange', function() {
    if (window.app) {
        window.app.handleVisibilityChange();
    }
});

// Handle errors globally
window.addEventListener('error', function(event) {
    if (window.app) {
        window.app.handleGlobalError(event);
    }
});

window.addEventListener('unhandledrejection', function(event) {
    if (window.app) {
        window.app.handleUnhandledRejection(event);
    }
});

// Handle page unload for cleanup
window.addEventListener('beforeunload', function() {
    if (window.app) {
        window.app.handleBeforeUnload();
    }
});