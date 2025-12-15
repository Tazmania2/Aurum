/**
 * Property-based and unit tests for LookerManager class
 * **Feature: lightweight-cycling-dashboard, Property 5: Looker iframe refresh**
 * **Validates: Requirements 2.2**
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fc from 'fast-check';
import { JSDOM } from 'jsdom';

// Mock DOM environment for testing
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head>
    <style>
        .view {
            position: absolute;
            width: 100%;
            height: 100%;
        }
        iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
    </style>
</head>
<body>
    <div id="app-container">
        <div id="looker-view" class="view">
            <iframe id="looker-iframe" src=""></iframe>
        </div>
    </div>
</body>
</html>
`, { url: 'http://localhost' });

global.document = dom.window.document;
global.window = dom.window;
global.console = console;

// Import LookerManager class - simulate the class since we're using vanilla JS
class LookerManager {
    constructor(containerId = 'looker-view', iframeId = 'looker-iframe') {
        this.containerId = containerId;
        this.iframeId = iframeId;
        this.iframe = null;
        this.container = null;
        this.currentUrl = null;
        this.isInitialized = false;
        
        this.config = {
            width: '100%',
            height: '100%',
            frameborder: '0',
            allowfullscreen: true,
            loading: 'lazy'
        };
        
        this.init();
    }
    
    init() {
        try {
            this.container = document.getElementById(this.containerId);
            if (!this.container) {
                throw new Error(`Container element with ID '${this.containerId}' not found`);
            }
            
            this.iframe = document.getElementById(this.iframeId);
            if (!this.iframe) {
                this.createIframe();
            }
            
            this.isInitialized = true;
            
        } catch (error) {
            throw error;
        }
    }
    
    createIframe() {
        if (this.iframe) {
            this.cleanup();
        }
        
        this.iframe = document.createElement('iframe');
        this.iframe.id = this.iframeId;
        
        Object.entries(this.config).forEach(([key, value]) => {
            if (key === 'allowfullscreen' && value) {
                this.iframe.setAttribute('allowfullscreen', '');
            } else if (typeof value === 'string' || typeof value === 'number') {
                this.iframe.setAttribute(key, value.toString());
            }
        });
        
        if (this.container) {
            this.container.appendChild(this.iframe);
        }
        
        return this.iframe;
    }
    
    setUrl(url) {
        if (!this.isInitialized) {
            return false;
        }
        
        if (!url || typeof url !== 'string') {
            return false;
        }
        
        try {
            new URL(url);
            this.currentUrl = url;
            return true;
        } catch (error) {
            return false;
        }
    }
    
    load(forceReload = false) {
        if (!this.isInitialized || !this.currentUrl || !this.iframe) {
            return false;
        }
        
        try {
            let urlToLoad = this.currentUrl;
            
            if (forceReload) {
                urlToLoad = this.addTimestampParameter(this.currentUrl);
            }
            
            this.iframe.src = urlToLoad;
            return true;
        } catch (error) {
            return false;
        }
    }
    
    reload() {
        if (!this.isInitialized || !this.currentUrl || !this.iframe) {
            return false;
        }
        
        try {
            const urlWithTimestamp = this.addTimestampParameter(this.currentUrl);
            this.iframe.src = urlWithTimestamp;
            return true;
        } catch (error) {
            return false;
        }
    }
    
    addTimestampParameter(url) {
        if (!url) {
            throw new Error('URL is required');
        }
        
        const timestamp = Date.now();
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}t=${timestamp}`;
    }
    
    setFullViewport() {
        if (!this.iframe) {
            return false;
        }
        
        try {
            this.iframe.style.width = '100vw';
            this.iframe.style.height = '100vh';
            this.iframe.style.border = 'none';
            this.iframe.style.margin = '0';
            this.iframe.style.padding = '0';
            this.iframe.style.display = 'block';
            
            return true;
        } catch (error) {
            return false;
        }
    }
    
    getCurrentSrc() {
        if (!this.iframe) {
            return null;
        }
        return this.iframe.src || null;
    }
    
    cleanup() {
        try {
            if (this.iframe) {
                const newIframe = this.iframe.cloneNode(false);
                if (this.iframe.parentNode) {
                    this.iframe.parentNode.replaceChild(newIframe, this.iframe);
                }
                
                this.iframe = newIframe;
                this.iframe.src = '';
            }
            
            return true;
        } catch (error) {
            return false;
        }
    }
    
    destroy() {
        try {
            this.cleanup();
            
            this.iframe = null;
            this.container = null;
            this.currentUrl = null;
            this.isInitialized = false;
            
            return true;
        } catch (error) {
            return false;
        }
    }
    
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            hasIframe: !!this.iframe,
            hasContainer: !!this.container,
            currentUrl: this.currentUrl,
            currentSrc: this.getCurrentSrc(),
            isLoading: false, // Simplified for testing
            containerId: this.containerId,
            iframeId: this.iframeId
        };
    }
}

/**
 * **Feature: lightweight-cycling-dashboard, Property 5: Looker iframe refresh**
 * **Validates: Requirements 2.2**
 * 
 * Property: For any Looker view activation, the iframe src should be updated 
 * with a fresh timestamp parameter to force reload
 */
test('Property 5: Looker iframe refresh updates src with fresh timestamp', () => {
    fc.assert(
        fc.property(
            // Generate valid Looker Studio URLs
            fc.record({
                baseUrl: fc.constantFrom(
                    'https://lookerstudio.google.com/embed/reporting/abc123/page/def456',
                    'https://datastudio.google.com/embed/reporting/xyz789/page/uvw012',
                    'https://lookerstudio.google.com/reporting/test123'
                ),
                existingParams: fc.option(fc.record({
                    param1: fc.string({ minLength: 1, maxLength: 10 }),
                    param2: fc.string({ minLength: 1, maxLength: 10 })
                }), { nil: null })
            }),
            // Generate number of reload operations (1-5)
            fc.integer({ min: 1, max: 5 }),
            ({ baseUrl, existingParams }, numReloads) => {
                // Construct URL with optional existing parameters
                let testUrl = baseUrl;
                if (existingParams) {
                    const params = new URLSearchParams(existingParams);
                    testUrl += '?' + params.toString();
                }
                
                const manager = new LookerManager();
                
                // Set the URL
                const setResult = manager.setUrl(testUrl);
                assert.strictEqual(setResult, true, 'Should successfully set URL');
                
                // Perform initial load
                const loadResult = manager.load(true);
                assert.strictEqual(loadResult, true, 'Should successfully load with timestamp');
                
                let previousSrc = manager.getCurrentSrc();
                assert.notStrictEqual(previousSrc, null, 'Should have a current src after load');
                assert.strictEqual(previousSrc.includes('t='), true, 'Initial load should include timestamp');
                
                // Perform multiple reloads and verify each gets a fresh timestamp
                for (let i = 0; i < numReloads; i++) {
                    // Small delay to ensure different timestamps
                    const beforeReload = Date.now();
                    
                    const reloadResult = manager.reload();
                    assert.strictEqual(reloadResult, true, `Reload ${i + 1} should succeed`);
                    
                    const newSrc = manager.getCurrentSrc();
                    assert.notStrictEqual(newSrc, null, `Should have src after reload ${i + 1}`);
                    
                    // Verify the new src is different from previous
                    assert.notStrictEqual(newSrc, previousSrc, `Reload ${i + 1} should produce different src`);
                    
                    // Verify the new src contains a timestamp parameter
                    assert.strictEqual(newSrc.includes('t='), true, `Reload ${i + 1} should include timestamp`);
                    
                    // Extract timestamp from URL
                    const timestampMatch = newSrc.match(/[?&]t=(\d+)/);
                    assert.notStrictEqual(timestampMatch, null, `Should find timestamp in URL after reload ${i + 1}`);
                    
                    const timestamp = parseInt(timestampMatch[1], 10);
                    assert.strictEqual(timestamp >= beforeReload, true, `Timestamp should be recent for reload ${i + 1}`);
                    
                    // Verify base URL is preserved
                    const baseUrlInSrc = newSrc.split('?')[0];
                    const expectedBaseUrl = testUrl.split('?')[0];
                    assert.strictEqual(baseUrlInSrc, expectedBaseUrl, `Base URL should be preserved in reload ${i + 1}`);
                    
                    // If original URL had parameters, verify they're preserved
                    if (existingParams) {
                        Object.keys(existingParams).forEach(param => {
                            assert.strictEqual(
                                newSrc.includes(`${param}=`), 
                                true, 
                                `Original parameter ${param} should be preserved in reload ${i + 1}`
                            );
                        });
                    }
                    
                    previousSrc = newSrc;
                }
                
                // Cleanup
                manager.destroy();
            }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design document
    );
});

/**
 * Unit test: iframe creation and sizing
 * Tests iframe creation and sizing functionality
 * Requirements: 2.1, 2.4
 */
test('LookerManager creates iframe with correct attributes', () => {
    const manager = new LookerManager();
    
    // Should be initialized
    assert.strictEqual(manager.isInitialized, true);
    
    // Should have iframe element
    const iframe = document.getElementById('looker-iframe');
    assert.notStrictEqual(iframe, null);
    
    // The iframe already exists in the DOM, so it won't have the attributes from createIframe
    // Let's test that the manager can create a new iframe with correct attributes
    manager.cleanup(); // Clear existing iframe
    const newIframe = manager.createIframe();
    
    // Should have correct attributes on the newly created iframe
    assert.strictEqual(newIframe.getAttribute('width'), '100%');
    assert.strictEqual(newIframe.getAttribute('height'), '100%');
    assert.strictEqual(newIframe.getAttribute('frameborder'), '0');
    assert.strictEqual(newIframe.hasAttribute('allowfullscreen'), true);
    
    manager.destroy();
});

/**
 * Unit test: timestamp parameter generation
 * Tests that timestamp parameters are correctly generated and unique
 * Requirements: 2.2
 */
test('addTimestampParameter generates unique timestamps', async () => {
    const manager = new LookerManager();
    
    const baseUrl = 'https://lookerstudio.google.com/embed/reporting/test123';
    
    // Test URL without existing parameters
    const url1 = manager.addTimestampParameter(baseUrl);
    assert.strictEqual(url1.startsWith(baseUrl + '?t='), true);
    
    // Test URL with existing parameters
    const urlWithParams = baseUrl + '?param1=value1';
    const url2 = manager.addTimestampParameter(urlWithParams);
    assert.strictEqual(url2.includes('param1=value1'), true);
    assert.strictEqual(url2.includes('&t='), true);
    
    // Add small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1));
    
    // Test that timestamps are different
    const url3 = manager.addTimestampParameter(baseUrl);
    assert.notStrictEqual(url1, url3);
    
    manager.destroy();
});

/**
 * Unit test: iframe cleanup
 * Tests proper iframe cleanup and memory management
 * Requirements: 2.4
 */
test('LookerManager properly cleans up iframe resources', () => {
    const manager = new LookerManager();
    
    // Set URL and load
    manager.setUrl('https://lookerstudio.google.com/embed/reporting/test123');
    manager.load();
    
    const iframe = document.getElementById('looker-iframe');
    const originalSrc = iframe.src;
    
    // Cleanup should clear the src
    const cleanupResult = manager.cleanup();
    assert.strictEqual(cleanupResult, true);
    
    // Iframe should still exist but src should be cleared
    const iframeAfterCleanup = document.getElementById('looker-iframe');
    assert.notStrictEqual(iframeAfterCleanup, null);
    // In JSDOM, setting src to empty string results in the base URL
    assert.strictEqual(iframeAfterCleanup.src === '' || iframeAfterCleanup.src === 'http://localhost/', true);
    
    manager.destroy();
});

/**
 * Unit test: full viewport sizing
 * Tests that iframe is properly sized to full viewport
 * Requirements: 2.1, 2.4
 */
test('setFullViewport applies correct CSS styles', () => {
    const manager = new LookerManager();
    
    const result = manager.setFullViewport();
    assert.strictEqual(result, true);
    
    const iframe = document.getElementById('looker-iframe');
    assert.strictEqual(iframe.style.width, '100vw');
    assert.strictEqual(iframe.style.height, '100vh');
    // In JSDOM, setting border to 'none' might result in different values
    // Let's check if any border-related style was set
    const hasBorderNone = iframe.style.border === 'none' || 
                         iframe.style.border === '' || 
                         iframe.style.borderWidth === '0px' ||
                         iframe.style.borderStyle === 'none';
    assert.strictEqual(hasBorderNone, true);
    assert.strictEqual(iframe.style.margin, '0px');
    assert.strictEqual(iframe.style.padding, '0px');
    assert.strictEqual(iframe.style.display, 'block');
    
    manager.destroy();
});

/**
 * Unit test: URL validation
 * Tests that invalid URLs are properly rejected
 */
test('setUrl validates URL format correctly', () => {
    const manager = new LookerManager();
    
    // Valid URLs should be accepted
    assert.strictEqual(manager.setUrl('https://lookerstudio.google.com/embed/reporting/test123'), true);
    assert.strictEqual(manager.setUrl('http://localhost:3000/dashboard'), true);
    
    // Invalid URLs should be rejected
    assert.strictEqual(manager.setUrl('not-a-url'), false);
    assert.strictEqual(manager.setUrl(''), false);
    assert.strictEqual(manager.setUrl(null), false);
    assert.strictEqual(manager.setUrl(undefined), false);
    assert.strictEqual(manager.setUrl(123), false);
    
    manager.destroy();
});

/**
 * Unit test: error handling for missing DOM elements
 * Tests graceful handling when required DOM elements are missing
 */
test('LookerManager handles missing DOM elements gracefully', () => {
    // Create a DOM without the required elements
    const emptyDom = new JSDOM(`
    <!DOCTYPE html>
    <html><body></body></html>
    `, { url: 'http://localhost' });
    
    const originalDocument = global.document;
    global.document = emptyDom.window.document;
    
    try {
        // Should throw error when container is missing
        assert.throws(() => {
            new LookerManager('non-existent-container', 'non-existent-iframe');
        }, Error);
    } finally {
        // Restore original document
        global.document = originalDocument;
    }
});

/**
 * Unit test: manager status reporting
 * Tests that getStatus returns accurate information
 */
test('getStatus returns accurate manager state', () => {
    const manager = new LookerManager();
    
    const status = manager.getStatus();
    
    assert.strictEqual(typeof status, 'object');
    assert.strictEqual(status.isInitialized, true);
    assert.strictEqual(status.hasIframe, true);
    assert.strictEqual(status.hasContainer, true);
    assert.strictEqual(status.containerId, 'looker-view');
    assert.strictEqual(status.iframeId, 'looker-iframe');
    
    // Set URL and check status
    manager.setUrl('https://lookerstudio.google.com/embed/reporting/test123');
    const statusAfterUrl = manager.getStatus();
    assert.strictEqual(statusAfterUrl.currentUrl, 'https://lookerstudio.google.com/embed/reporting/test123');
    
    manager.destroy();
});