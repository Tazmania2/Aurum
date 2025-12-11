// Smart TV Browser Compatibility Module
// Handles feature detection, performance optimizations, and fallbacks for Smart TV browsers

/**
 * SmartTVCompat class provides compatibility layer for Smart TV browsers
 * Implements Requirements 5.1, 5.4, 5.5 for Smart TV browser support
 */
class SmartTVCompat {
    constructor() {
        this.isSmartTV = this.detectSmartTV();
        this.capabilities = this.detectCapabilities();
        this.performanceMode = this.determinePerformanceMode();
        this.memoryCleanupInterval = null;
        
        console.log('Smart TV Compatibility initialized:', {
            isSmartTV: this.isSmartTV,
            capabilities: this.capabilities,
            performanceMode: this.performanceMode
        });
    }
    
    /**
     * Detect if running on Smart TV browser
     * @returns {boolean} True if Smart TV detected
     */
    detectSmartTV() {
        const userAgent = navigator.userAgent.toLowerCase();
        const smartTVIndicators = [
            'smart-tv', 'smarttv', 'tizen', 'webos', 'netcast', 'roku',
            'viera', 'aquos', 'bravia', 'samsung', 'lg', 'panasonic',
            'philips', 'hisense', 'tcl', 'android tv', 'google tv'
        ];
        
        // Check user agent for Smart TV indicators
        const hasSmartTVUA = smartTVIndicators.some(indicator => 
            userAgent.includes(indicator)
        );
        
        // Check for limited memory (typical Smart TV constraint)
        const hasLimitedMemory = navigator.deviceMemory && navigator.deviceMemory <= 2;
        
        // Check for TV-like screen dimensions
        const hasTVDimensions = screen.width >= 1920 && screen.height >= 1080;
        
        // Check for missing modern browser features
        const lacksModernFeatures = !window.fetch || !window.Promise || !window.Map;
        
        return hasSmartTVUA || (hasTVDimensions && (hasLimitedMemory || lacksModernFeatures));
    }
    
    /**
     * Detect browser capabilities for feature detection
     * @returns {Object} Capabilities object
     */
    detectCapabilities() {
        return {
            // CSS Features
            cssTransitions: this.supportsCSSTransitions(),
            cssTransforms: this.supportsCSSTransforms(),
            cssAnimations: this.supportsCSSAnimations(),
            cssFilters: this.supportsCSSFilters(),
            cssFlexbox: this.supportsCSSFlexbox(),
            cssGrid: this.supportsCSSGrid(),
            
            // JavaScript Features
            es6: this.supportsES6(),
            fetch: !!window.fetch,
            promises: !!window.Promise,
            requestAnimationFrame: !!window.requestAnimationFrame,
            
            // Performance Features
            webGL: this.supportsWebGL(),
            hardwareAcceleration: this.supportsHardwareAcceleration(),
            
            // Memory and Performance
            deviceMemory: navigator.deviceMemory || 'unknown',
            hardwareConcurrency: navigator.hardwareConcurrency || 1
        };
    }
    
    /**
     * Check CSS Transitions support
     */
    supportsCSSTransitions() {
        const element = document.createElement('div');
        return 'transition' in element.style || 
               'webkitTransition' in element.style ||
               'mozTransition' in element.style;
    }
    
    /**
     * Check CSS Transforms support
     */
    supportsCSSTransforms() {
        const element = document.createElement('div');
        return 'transform' in element.style ||
               'webkitTransform' in element.style ||
               'mozTransform' in element.style;
    }
    
    /**
     * Check CSS Animations support
     */
    supportsCSSAnimations() {
        const element = document.createElement('div');
        return 'animation' in element.style ||
               'webkitAnimation' in element.style ||
               'mozAnimation' in element.style;
    }
    
    /**
     * Check CSS Filters support
     */
    supportsCSSFilters() {
        const element = document.createElement('div');
        return 'filter' in element.style ||
               'webkitFilter' in element.style;
    }
    
    /**
     * Check CSS Flexbox support
     */
    supportsCSSFlexbox() {
        const element = document.createElement('div');
        return 'flex' in element.style ||
               'webkitFlex' in element.style ||
               'msFlex' in element.style;
    }
    
    /**
     * Check CSS Grid support
     */
    supportsCSSGrid() {
        return CSS && CSS.supports && CSS.supports('display', 'grid');
    }
    
    /**
     * Check ES6 support
     */
    supportsES6() {
        try {
            return typeof Symbol !== 'undefined' && 
                   typeof Promise !== 'undefined' &&
                   typeof Map !== 'undefined';
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Check WebGL support
     */
    supportsWebGL() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Check hardware acceleration support
     */
    supportsHardwareAcceleration() {
        // Check for CSS 3D transforms which indicate hardware acceleration
        const element = document.createElement('div');
        element.style.transform = 'translate3d(0,0,0)';
        return element.style.transform !== '';
    }
    
    /**
     * Determine performance mode based on device capabilities
     * @returns {string} Performance mode: 'high', 'medium', 'low'
     */
    determinePerformanceMode() {
        let score = 0;
        
        // Add points for supported features
        if (this.capabilities.cssTransitions) score += 1;
        if (this.capabilities.cssTransforms) score += 1;
        if (this.capabilities.cssAnimations) score += 1;
        if (this.capabilities.cssFilters) score += 1;
        if (this.capabilities.webGL) score += 2;
        if (this.capabilities.hardwareAcceleration) score += 2;
        if (this.capabilities.requestAnimationFrame) score += 1;
        
        // Consider memory
        if (this.capabilities.deviceMemory) {
            if (this.capabilities.deviceMemory >= 4) score += 2;
            else if (this.capabilities.deviceMemory >= 2) score += 1;
        }
        
        // Consider CPU cores
        if (this.capabilities.hardwareConcurrency >= 4) score += 1;
        
        if (score >= 8) return 'high';
        if (score >= 5) return 'medium';
        return 'low';
    }
    
    /**
     * Apply Smart TV optimizations to the application
     */
    applyOptimizations() {
        console.log(`Applying ${this.performanceMode} performance optimizations for Smart TV`);
        
        // Apply CSS optimizations
        this.applyCSSOptimizations();
        
        // Apply JavaScript optimizations
        this.applyJSOptimizations();
        
        // Set up memory management
        this.setupMemoryManagement();
        
        // Apply fallbacks for unsupported features
        this.applyFallbacks();
    }
    
    /**
     * Apply CSS-based optimizations
     */
    applyCSSOptimizations() {
        const style = document.createElement('style');
        let css = '';
        
        if (this.performanceMode === 'low') {
            // Disable complex animations and effects for low-end devices
            css += `
                .spaceship {
                    transition: transform 0.3s ease, opacity 0.3s ease !important;
                }
                .spaceship-image {
                    filter: none !important;
                }
                .ranking-title {
                    animation: none !important;
                    background: #fff !important;
                    -webkit-text-fill-color: #fff !important;
                }
                .ranking-title::before {
                    display: none !important;
                }
                .loading-spinner {
                    animation-duration: 2s !important;
                }
                .loading-spinner::before {
                    display: none !important;
                }
            `;
        } else if (this.performanceMode === 'medium') {
            // Reduce animation complexity for medium performance
            css += `
                .spaceship {
                    transition: transform 0.5s ease, opacity 0.5s ease !important;
                }
                .spaceship.rank-1 .spaceship-image {
                    filter: drop-shadow(0 0 15px #ffd700) !important;
                }
                .spaceship.rank-2 .spaceship-image {
                    filter: drop-shadow(0 0 12px #c0c0c0) !important;
                }
                .spaceship.rank-3 .spaceship-image {
                    filter: drop-shadow(0 0 10px #cd7f32) !important;
                }
            `;
        }
        
        // Add fallbacks for unsupported CSS features
        if (!this.capabilities.cssFlexbox) {
            css += `
                .ranking-view {
                    display: block !important;
                }
                .ranking-container {
                    position: relative !important;
                    height: calc(100vh - 120px) !important;
                }
            `;
        }
        
        if (!this.capabilities.cssTransforms) {
            css += `
                .spaceship {
                    position: relative !important;
                    display: inline-block !important;
                    margin: 10px !important;
                }
            `;
        }
        
        style.textContent = css;
        style.setAttribute('data-smart-tv-compat', 'true');
        document.head.appendChild(style);
        
        // Store reference for cleanup
        this.injectedStyles = this.injectedStyles || [];
        this.injectedStyles.push(style);
    }
    
    /**
     * Apply JavaScript optimizations
     */
    applyJSOptimizations() {
        // Reduce animation frame rate for low-end devices
        if (this.performanceMode === 'low') {
            // Store original for cleanup
            this.originalRAF = window.requestAnimationFrame;
            let lastTime = 0;
            
            window.requestAnimationFrame = function(callback) {
                const now = Date.now();
                const timeToCall = Math.max(0, 33 - (now - lastTime)); // 33ms = ~30fps
                
                const id = setTimeout(function() {
                    callback(now + timeToCall);
                }, timeToCall);
                
                lastTime = now + timeToCall;
                return id;
            };
        }
        
        // Disable console logging in production for performance
        if (this.isSmartTV && location.hostname !== 'localhost') {
            console.log = console.warn = console.error = function() {};
        }
    }
    
    /**
     * Set up memory management and cleanup
     */
    setupMemoryManagement() {
        // Clean up memory every 5 minutes
        this.memoryCleanupInterval = setInterval(() => {
            this.performMemoryCleanup();
        }, 300000); // 5 minutes
        
        // Clean up on page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
        
        // Clean up on visibility change (Smart TV power management)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.performMemoryCleanup();
            }
        });
    }
    
    /**
     * Perform memory cleanup operations
     */
    performMemoryCleanup() {
        console.log('Performing Smart TV memory cleanup...');
        
        // Remove unused DOM elements
        const unusedElements = document.querySelectorAll('.spaceship[data-cleanup="true"]');
        unusedElements.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        
        // Clear image caches if possible
        if (window.gc && typeof window.gc === 'function') {
            try {
                window.gc();
            } catch (e) {
                // Ignore if garbage collection is not available
            }
        }
        
        console.log('Memory cleanup completed');
    }
    
    /**
     * Apply fallbacks for unsupported features
     */
    applyFallbacks() {
        // Fetch API fallback
        if (!this.capabilities.fetch) {
            this.addFetchPolyfill();
        }
        
        // Promise fallback
        if (!this.capabilities.promises) {
            this.addPromisePolyfill();
        }
        
        // RequestAnimationFrame fallback
        if (!this.capabilities.requestAnimationFrame) {
            this.addRAFPolyfill();
        }
    }
    
    /**
     * Add minimal fetch polyfill for Smart TV browsers
     */
    addFetchPolyfill() {
        if (!window.fetch) {
            window.fetch = function(url, options) {
                return new Promise(function(resolve, reject) {
                    const xhr = new XMLHttpRequest();
                    xhr.open(options && options.method || 'GET', url);
                    
                    if (options && options.headers) {
                        for (const key in options.headers) {
                            xhr.setRequestHeader(key, options.headers[key]);
                        }
                    }
                    
                    xhr.onload = function() {
                        resolve({
                            ok: xhr.status >= 200 && xhr.status < 300,
                            status: xhr.status,
                            json: function() {
                                return Promise.resolve(JSON.parse(xhr.responseText));
                            },
                            text: function() {
                                return Promise.resolve(xhr.responseText);
                            }
                        });
                    };
                    
                    xhr.onerror = function() {
                        reject(new Error('Network error'));
                    };
                    
                    xhr.send(options && options.body || null);
                });
            };
        }
    }
    
    /**
     * Add minimal Promise polyfill
     */
    addPromisePolyfill() {
        if (!window.Promise) {
            // Very basic Promise implementation for Smart TV compatibility
            window.Promise = function(executor) {
                const self = this;
                self.state = 'pending';
                self.value = undefined;
                self.handlers = [];
                
                function resolve(result) {
                    if (self.state === 'pending') {
                        self.state = 'fulfilled';
                        self.value = result;
                        self.handlers.forEach(handle);
                        self.handlers = null;
                    }
                }
                
                function reject(error) {
                    if (self.state === 'pending') {
                        self.state = 'rejected';
                        self.value = error;
                        self.handlers.forEach(handle);
                        self.handlers = null;
                    }
                }
                
                function handle(handler) {
                    if (self.state === 'pending') {
                        self.handlers.push(handler);
                    } else {
                        if (self.state === 'fulfilled' && typeof handler.onFulfilled === 'function') {
                            handler.onFulfilled(self.value);
                        }
                        if (self.state === 'rejected' && typeof handler.onRejected === 'function') {
                            handler.onRejected(self.value);
                        }
                    }
                }
                
                this.then = function(onFulfilled, onRejected) {
                    return new Promise(function(resolve, reject) {
                        handle({
                            onFulfilled: function(result) {
                                try {
                                    resolve(onFulfilled ? onFulfilled(result) : result);
                                } catch (ex) {
                                    reject(ex);
                                }
                            },
                            onRejected: function(error) {
                                try {
                                    resolve(onRejected ? onRejected(error) : error);
                                } catch (ex) {
                                    reject(ex);
                                }
                            }
                        });
                    });
                };
                
                executor(resolve, reject);
            };
        }
    }
    
    /**
     * Add requestAnimationFrame polyfill
     */
    addRAFPolyfill() {
        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = function(callback) {
                return setTimeout(callback, 1000 / 60); // 60fps fallback
            };
            
            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };
        }
    }
    
    /**
     * Get performance recommendations for the current device
     * @returns {Object} Performance recommendations
     */
    getPerformanceRecommendations() {
        return {
            maxSpaceships: this.performanceMode === 'low' ? 5 : 
                          this.performanceMode === 'medium' ? 8 : 12,
            animationDuration: this.performanceMode === 'low' ? 300 : 
                              this.performanceMode === 'medium' ? 500 : 800,
            useComplexAnimations: this.performanceMode === 'high',
            useFilters: this.capabilities.cssFilters && this.performanceMode !== 'low',
            cycleInterval: this.performanceMode === 'low' ? 25000 : 20000 // Slower cycling for low-end
        };
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        console.log('Cleaning up Smart TV compatibility resources...');
        
        if (this.memoryCleanupInterval) {
            clearInterval(this.memoryCleanupInterval);
            this.memoryCleanupInterval = null;
        }
        
        // Clean up injected styles
        if (this.injectedStyles) {
            this.injectedStyles.forEach(style => {
                if (style.parentNode) {
                    style.parentNode.removeChild(style);
                }
            });
            this.injectedStyles = null;
        }
        
        // Restore original requestAnimationFrame if we modified it
        if (this.originalRAF) {
            window.requestAnimationFrame = this.originalRAF;
            this.originalRAF = null;
        }
        
        // Perform final memory cleanup
        this.performMemoryCleanup();
        
        console.log('Smart TV compatibility cleanup completed');
    }
}

// Export for use in other modules
window.SmartTVCompat = SmartTVCompat;