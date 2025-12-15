// LookerManager - Handles Looker Studio iframe lifecycle management

class LookerManager {
    constructor(containerId = 'looker-view', iframeId = 'looker-iframe') {
        this.containerId = containerId;
        this.iframeId = iframeId;
        this.iframe = null;
        this.container = null;
        this.currentUrl = null;
        this.isInitialized = false;
        
        // Configuration options
        this.config = {
            width: '100%',
            height: '100%',
            frameborder: '0',
            allowfullscreen: true,
            loading: 'lazy'
        };
        
        this.init();
    }
    
    /**
     * Initialize the LookerManager
     * Sets up references to DOM elements
     */
    init() {
        try {
            this.container = document.getElementById(this.containerId);
            if (!this.container) {
                throw new Error(`Container element with ID '${this.containerId}' not found`);
            }
            
            this.iframe = document.getElementById(this.iframeId);
            if (!this.iframe) {
                // Create iframe if it doesn't exist
                this.createIframe();
            }
            
            this.isInitialized = true;
            console.log('LookerManager initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize LookerManager:', error);
            throw error;
        }
    }
    
    /**
     * Create iframe element with proper configuration
     * @returns {HTMLIFrameElement} The created iframe element
     */
    createIframe() {
        if (this.iframe) {
            console.warn('Iframe already exists, removing existing iframe');
            this.cleanup();
        }
        
        this.iframe = document.createElement('iframe');
        this.iframe.id = this.iframeId;
        
        // Apply configuration
        Object.entries(this.config).forEach(([key, value]) => {
            if (key === 'allowfullscreen' && value) {
                this.iframe.setAttribute('allowfullscreen', '');
            } else if (typeof value === 'string' || typeof value === 'number') {
                this.iframe.setAttribute(key, value.toString());
            }
        });
        
        // Add to container
        if (this.container) {
            this.container.appendChild(this.iframe);
        }
        
        console.log('Looker iframe created');
        return this.iframe;
    }
    
    /**
     * Set the Looker Studio URL
     * @param {string} url - The Looker Studio embed URL
     * @returns {boolean} True if URL was set successfully
     */
    setUrl(url) {
        if (!this.isInitialized) {
            console.error('LookerManager not initialized');
            return false;
        }
        
        if (!url || typeof url !== 'string') {
            console.error('Invalid URL provided');
            return false;
        }
        
        try {
            // Validate URL format
            new URL(url);
            
            this.currentUrl = url;
            console.log(`Looker URL set: ${url}`);
            return true;
            
        } catch (error) {
            console.error('Invalid URL format:', error);
            return false;
        }
    }
    
    /**
     * Load the Looker dashboard with current URL
     * @param {boolean} forceReload - Whether to force reload with timestamp
     * @returns {boolean} True if load was initiated successfully
     */
    load(forceReload = false) {
        if (!this.isInitialized) {
            console.error('LookerManager not initialized');
            return false;
        }
        
        if (!this.currentUrl) {
            console.error('No URL set for Looker dashboard');
            return false;
        }
        
        if (!this.iframe) {
            console.error('Iframe element not available');
            return false;
        }
        
        try {
            let urlToLoad = this.currentUrl;
            
            if (forceReload) {
                urlToLoad = this.addTimestampParameter(this.currentUrl);
            }
            
            this.iframe.src = urlToLoad;
            console.log(`Looker dashboard loading: ${urlToLoad}`);
            return true;
            
        } catch (error) {
            console.error('Failed to load Looker dashboard:', error);
            return false;
        }
    }
    
    /**
     * Reload the Looker dashboard with fresh timestamp
     * Implements Requirements 2.2 - force reload with timestamp parameter
     * @returns {boolean} True if reload was initiated successfully
     */
    reload() {
        if (!this.isInitialized) {
            console.error('LookerManager not initialized');
            return false;
        }
        
        if (!this.currentUrl) {
            console.error('No URL set for Looker dashboard');
            return false;
        }
        
        if (!this.iframe) {
            console.error('Iframe element not available');
            return false;
        }
        
        try {
            const urlWithTimestamp = this.addTimestampParameter(this.currentUrl);
            this.iframe.src = urlWithTimestamp;
            console.log(`Looker dashboard reloaded with timestamp: ${urlWithTimestamp}`);
            return true;
            
        } catch (error) {
            console.error('Failed to reload Looker dashboard:', error);
            return false;
        }
    }
    
    /**
     * Add timestamp parameter to URL for cache busting
     * @param {string} url - The base URL
     * @returns {string} URL with timestamp parameter
     */
    addTimestampParameter(url) {
        if (!url) {
            throw new Error('URL is required');
        }
        
        const timestamp = Date.now();
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}t=${timestamp}`;
    }
    
    /**
     * Set iframe to full viewport size
     * Implements Requirements 2.1, 2.4 - full viewport size
     * @returns {boolean} True if sizing was applied successfully
     */
    setFullViewport() {
        if (!this.iframe) {
            console.error('Iframe element not available');
            return false;
        }
        
        try {
            // Set iframe to full viewport dimensions
            this.iframe.style.width = '100vw';
            this.iframe.style.height = '100vh';
            this.iframe.style.border = 'none';
            this.iframe.style.margin = '0';
            this.iframe.style.padding = '0';
            this.iframe.style.display = 'block';
            
            console.log('Iframe set to full viewport size');
            return true;
            
        } catch (error) {
            console.error('Failed to set iframe to full viewport:', error);
            return false;
        }
    }
    
    /**
     * Get current iframe source URL
     * @returns {string|null} Current iframe src or null if not available
     */
    getCurrentSrc() {
        if (!this.iframe) {
            return null;
        }
        return this.iframe.src || null;
    }
    
    /**
     * Check if iframe is currently loading
     * @returns {boolean} True if iframe is loading
     */
    isLoading() {
        if (!this.iframe) {
            return false;
        }
        
        // Check if iframe has loaded content
        try {
            return !this.iframe.contentDocument || this.iframe.contentDocument.readyState !== 'complete';
        } catch (error) {
            // Cross-origin restrictions prevent access to contentDocument
            // This is expected for external Looker URLs
            return false;
        }
    }
    
    /**
     * Add event listeners for iframe events
     * @param {string} eventType - Event type (load, error, etc.)
     * @param {Function} callback - Event callback function
     * @returns {boolean} True if listener was added successfully
     */
    addEventListener(eventType, callback) {
        if (!this.iframe) {
            console.error('Iframe element not available');
            return false;
        }
        
        if (typeof callback !== 'function') {
            console.error('Callback must be a function');
            return false;
        }
        
        try {
            this.iframe.addEventListener(eventType, callback);
            console.log(`Event listener added for ${eventType}`);
            return true;
            
        } catch (error) {
            console.error(`Failed to add event listener for ${eventType}:`, error);
            return false;
        }
    }
    
    /**
     * Remove event listeners from iframe
     * @param {string} eventType - Event type
     * @param {Function} callback - Event callback function
     * @returns {boolean} True if listener was removed successfully
     */
    removeEventListener(eventType, callback) {
        if (!this.iframe) {
            console.error('Iframe element not available');
            return false;
        }
        
        try {
            this.iframe.removeEventListener(eventType, callback);
            console.log(`Event listener removed for ${eventType}`);
            return true;
            
        } catch (error) {
            console.error(`Failed to remove event listener for ${eventType}:`, error);
            return false;
        }
    }
    
    /**
     * Clean up iframe and remove from DOM
     * Implements proper cleanup and memory management (Requirements 2.4)
     * @returns {boolean} True if cleanup was successful
     */
    cleanup() {
        try {
            if (this.iframe) {
                // Remove all event listeners by cloning the element
                const newIframe = this.iframe.cloneNode(false);
                if (this.iframe.parentNode) {
                    this.iframe.parentNode.replaceChild(newIframe, this.iframe);
                }
                
                // Clear references
                this.iframe = newIframe;
                this.iframe.src = '';
                
                console.log('Looker iframe cleaned up');
            }
            
            return true;
            
        } catch (error) {
            console.error('Failed to cleanup iframe:', error);
            return false;
        }
    }
    
    /**
     * Destroy the LookerManager and clean up all resources
     * @returns {boolean} True if destruction was successful
     */
    destroy() {
        try {
            this.cleanup();
            
            // Clear all references
            this.iframe = null;
            this.container = null;
            this.currentUrl = null;
            this.isInitialized = false;
            
            console.log('LookerManager destroyed');
            return true;
            
        } catch (error) {
            console.error('Failed to destroy LookerManager:', error);
            return false;
        }
    }
    
    /**
     * Get manager status and configuration
     * @returns {Object} Status object with current state
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            hasIframe: !!this.iframe,
            hasContainer: !!this.container,
            currentUrl: this.currentUrl,
            currentSrc: this.getCurrentSrc(),
            isLoading: this.isLoading(),
            containerId: this.containerId,
            iframeId: this.iframeId
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LookerManager;
}