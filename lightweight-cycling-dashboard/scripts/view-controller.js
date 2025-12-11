// View Controller - Manages DOM manipulation and view state

class ViewController {
    constructor() {
        this.currentViewId = null;
        this.views = new Map();
        this.transitionDuration = 500; // milliseconds
        
        // Initialize views
        this.initializeViews();
    }
    
    initializeViews() {
        const viewElements = document.querySelectorAll('.view');
        
        viewElements.forEach(viewElement => {
            this.views.set(viewElement.id, {
                element: viewElement,
                isActive: viewElement.classList.contains('active')
            });
            
            if (viewElement.classList.contains('active')) {
                this.currentViewId = viewElement.id;
            }
        });
        
        console.log(`Initialized ${this.views.size} views`);
    }
    
    showView(viewId) {
        try {
            console.log(`Showing view: ${viewId}`);
            
            if (!this.views.has(viewId)) {
                console.error(`View not found: ${viewId}`);
                return false;
            }
            
            const targetView = this.views.get(viewId);
            
            // Validate view element exists
            if (!targetView.element) {
                console.error(`View element not found for: ${viewId}`);
                return false;
            }
            
            // If this view is already active, do nothing
            if (this.currentViewId === viewId) {
                console.log(`View ${viewId} is already active`);
                return true;
            }
            
            // Hide current view and show target view with error handling
            this.hideAllViews();
            this.activateView(targetView, viewId);
            
            return true;
            
        } catch (error) {
            console.error(`Error showing view ${viewId}:`, error);
            
            // Try to show error state in the view
            try {
                this.showViewError(viewId, `Failed to display view: ${error.message}`, 'loading');
            } catch (errorDisplayError) {
                console.error('Failed to show error state:', errorDisplayError);
            }
            
            return false;
        }
    }
    
    hideAllViews() {
        this.views.forEach((view, viewId) => {
            if (view.isActive) {
                this.deactivateView(view, viewId);
            }
        });
    }
    
    activateView(view, viewId) {
        const element = view.element;
        
        // Add slide-in animation
        element.classList.add('slide-in');
        element.classList.add('active');
        
        // Update view state
        view.isActive = true;
        this.currentViewId = viewId;
        
        // Remove animation class after transition
        setTimeout(() => {
            element.classList.remove('slide-in');
        }, this.transitionDuration);
        
        console.log(`Activated view: ${viewId}`);
    }
    
    deactivateView(view, viewId) {
        const element = view.element;
        
        // Add slide-out animation
        element.classList.add('slide-out');
        
        // Remove active class after animation starts
        setTimeout(() => {
            element.classList.remove('active');
            element.classList.remove('slide-out');
            view.isActive = false;
        }, this.transitionDuration / 2);
        
        console.log(`Deactivated view: ${viewId}`);
    }
    
    getCurrentView() {
        return this.currentViewId;
    }
    
    isViewActive(viewId) {
        const view = this.views.get(viewId);
        return view ? view.isActive : false;
    }
    
    // Looker-specific methods
    reloadLookerIframe() {
        try {
            const lookerView = this.views.get('looker-view');
            if (!lookerView) {
                console.error('Looker view not found');
                return false;
            }
            
            const iframe = lookerView.element.querySelector('#looker-iframe');
            if (!iframe) {
                console.error('Looker iframe not found');
                return false;
            }
            
            // Validate current src
            const currentSrc = iframe.src;
            if (!currentSrc) {
                console.error('Looker iframe has no source URL');
                return false;
            }
            
            // Force reload with timestamp
            const separator = currentSrc.includes('?') ? '&' : '?';
            const newSrc = currentSrc + separator + 't=' + Date.now();
            
            console.log('Reloading Looker iframe with timestamp');
            iframe.src = newSrc;
            
            // Add error handling for iframe load
            const handleIframeError = () => {
                console.error('Looker iframe failed to load');
                this.showViewError('looker-view', 'Dashboard failed to load. Will retry on next cycle.', 'loading');
            };
            
            const handleIframeLoad = () => {
                console.log('Looker iframe loaded successfully');
                // Remove error handlers
                iframe.removeEventListener('error', handleIframeError);
                iframe.removeEventListener('load', handleIframeLoad);
            };
            
            // Set up one-time event listeners
            iframe.addEventListener('error', handleIframeError, { once: true });
            iframe.addEventListener('load', handleIframeLoad, { once: true });
            
            return true;
            
        } catch (error) {
            console.error('Error reloading Looker iframe:', error);
            this.showViewError('looker-view', `Failed to reload dashboard: ${error.message}`, 'loading');
            return false;
        }
    }
    
    setLookerUrl(url) {
        const lookerView = this.views.get('looker-view');
        if (!lookerView) {
            console.error('Looker view not found');
            return false;
        }
        
        const iframe = lookerView.element.querySelector('#looker-iframe');
        if (!iframe) {
            console.error('Looker iframe not found');
            return false;
        }
        
        console.log(`Setting Looker URL: ${url}`);
        iframe.src = url;
        
        return true;
    }
    
    // Ranking view methods
    clearRankingView(viewId) {
        const view = this.views.get(viewId);
        if (!view) {
            console.error(`View not found: ${viewId}`);
            return false;
        }
        
        const container = view.element.querySelector('.ranking-container');
        if (container) {
            container.innerHTML = '';
            console.log(`Cleared ranking view: ${viewId}`);
            return true;
        }
        
        return false;
    }
    
    // Utility methods
    addViewTransitionListener(viewId, eventType, callback) {
        const view = this.views.get(viewId);
        if (!view) {
            console.error(`View not found: ${viewId}`);
            return false;
        }
        
        view.element.addEventListener(eventType, callback);
        return true;
    }
    
    removeViewTransitionListener(viewId, eventType, callback) {
        const view = this.views.get(viewId);
        if (!view) {
            console.error(`View not found: ${viewId}`);
            return false;
        }
        
        view.element.removeEventListener(eventType, callback);
        return true;
    }
    
    // Performance optimization methods
    preloadView(viewId) {
        const view = this.views.get(viewId);
        if (!view) {
            console.error(`View not found: ${viewId}`);
            return false;
        }
        
        // Add preload hints for images in the view
        const images = view.element.querySelectorAll('img');
        images.forEach(img => {
            if (img.src && !img.complete) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = img.src;
                document.head.appendChild(link);
            }
        });
        
        console.log(`Preloaded assets for view: ${viewId}`);
        return true;
    }
    
    // Enhanced error handling with recovery options
    showViewError(viewId, errorMessage, errorType = 'generic') {
        const view = this.views.get(viewId);
        if (!view) {
            console.error(`View not found: ${viewId}`);
            return false;
        }
        
        try {
            const errorConfigs = {
                generic: {
                    icon: '⚠️',
                    title: 'Error',
                    color: '#ff6b6b'
                },
                network: {
                    icon: '📡',
                    title: 'Connection Error',
                    color: '#ffa726'
                },
                timeout: {
                    icon: '⏰',
                    title: 'Request Timeout',
                    color: '#ffa726'
                },
                server: {
                    icon: '🔧',
                    title: 'Server Error',
                    color: '#ff6b6b'
                },
                loading: {
                    icon: '📊',
                    title: 'Loading Error',
                    color: '#ff6b6b'
                }
            };
            
            const config = errorConfigs[errorType] || errorConfigs.generic;
            
            const errorElement = document.createElement('div');
            errorElement.className = 'view-error';
            errorElement.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column; animation: fadeIn 0.5s ease-in;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">${config.icon}</div>
                    <h2 style="color: ${config.color}; margin-bottom: 20px; text-align: center;">${config.title}</h2>
                    <p style="color: rgba(255, 255, 255, 0.7); text-align: center; max-width: 600px; line-height: 1.5;">${errorMessage}</p>
                    <div style="margin-top: 30px; color: rgba(255, 255, 255, 0.5); font-size: 0.9rem; text-align: center;">
                        The system will continue cycling and retry automatically
                    </div>
                </div>
            `;
            
            // Clear view and show error with error handling
            try {
                view.element.innerHTML = '';
                view.element.appendChild(errorElement);
            } catch (domError) {
                console.error('Failed to update DOM for error display:', domError);
                // Fallback: try to set innerHTML directly
                try {
                    view.element.innerHTML = `
                        <div style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column;">
                            <h2 style="color: #ff6b6b;">Error</h2>
                            <p style="color: white;">${errorMessage}</p>
                        </div>
                    `;
                } catch (fallbackError) {
                    console.error('All error display methods failed:', fallbackError);
                }
            }
            
            console.log(`Showed ${errorType} error in view ${viewId}: ${errorMessage}`);
            return true;
            
        } catch (error) {
            console.error('Failed to show view error:', error);
            return false;
        }
    }
    
    clearViewError(viewId) {
        const view = this.views.get(viewId);
        if (!view) {
            return false;
        }
        
        const errorElement = view.element.querySelector('.view-error');
        if (errorElement) {
            errorElement.remove();
            console.log(`Cleared error from view: ${viewId}`);
            return true;
        }
        
        return false;
    }
    
    // Debug methods
    listViews() {
        console.log('Available views:');
        this.views.forEach((view, viewId) => {
            console.log(`- ${viewId}: ${view.isActive ? 'active' : 'inactive'}`);
        });
    }
    
    getViewInfo(viewId) {
        const view = this.views.get(viewId);
        if (!view) {
            return null;
        }
        
        return {
            id: viewId,
            isActive: view.isActive,
            element: view.element,
            classList: Array.from(view.element.classList)
        };
    }
    
    // Cleanup method
    destroy() {
        this.views.clear();
        this.currentViewId = null;
        console.log('ViewController destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ViewController;
}