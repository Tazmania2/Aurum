/**
 * Property-based tests for CycleManager class
 * **Feature: lightweight-cycling-dashboard, Property 4: View cycling sequence**
 * **Validates: Requirements 1.2, 1.3**
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fc from 'fast-check';

// Mock AppState class for testing
class MockAppState {
    constructor() {
        this.currentViewIndex = 0;
        this.isRunning = false;
        this.views = [
            { id: 'looker-view', type: 'looker' },
            { id: 'ranking-1', type: 'ranking' },
            { id: 'ranking-2', type: 'ranking' },
            { id: 'ranking-3', type: 'ranking' }
        ];
    }
    
    setCurrentViewIndex(index) {
        if (index >= 0 && index < this.views.length) {
            this.currentViewIndex = index;
        }
    }
    
    getCurrentView() {
        return this.views[this.currentViewIndex];
    }
    
    getViews() {
        return this.views;
    }
}

// CycleManager class for testing
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
            return;
        }
        
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
        
        // Update app state
        if (this.appState) {
            this.appState.setCurrentViewIndex(this.currentIndex);
        }
        
        // Call the callback if provided
        if (this.onViewChangeCallback && typeof this.onViewChangeCallback === 'function') {
            try {
                this.onViewChangeCallback(nextView);
            } catch (error) {
                console.error('Error in view change callback:', error);
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
        }
    }
    
    getViewCount() {
        return this.views.length;
    }
    
    destroy() {
        this.stop();
        this.views = null;
        this.onViewChangeCallback = null;
    }
}

/**
 * **Feature: lightweight-cycling-dashboard, Property 4: View cycling sequence**
 * **Validates: Requirements 1.2, 1.3**
 * 
 * Property: For any view cycle state, advancing to the next view should follow 
 * the sequence (Looker → Ranking 1 → Ranking 2 → Ranking 3 → Looker) and 
 * wrap around correctly when reaching the end
 */
test('Property 4: View cycling sequence follows correct order and wraps around', () => {
    fc.assert(
        fc.property(
            // Generate a starting view index (0-3)
            fc.integer({ min: 0, max: 3 }),
            // Generate number of steps to advance (1-20 to test multiple cycles)
            fc.integer({ min: 1, max: 20 }),
            (startIndex, steps) => {
                const mockAppState = new MockAppState();
                const views = mockAppState.getViews();
                
                // Track view changes
                const viewChanges = [];
                const onViewChange = (view) => {
                    viewChanges.push(view.id);
                };
                
                const cycleManager = new CycleManager(views, 20000, onViewChange, mockAppState);
                
                // Set starting position
                cycleManager.setCurrentIndex(startIndex);
                
                // Expected sequence: looker-view (0) → ranking-1 (1) → ranking-2 (2) → ranking-3 (3) → looker-view (0)
                const expectedSequence = ['looker-view', 'ranking-1', 'ranking-2', 'ranking-3'];
                
                // Record initial state
                const initialView = cycleManager.getCurrentView();
                assert.strictEqual(initialView.id, expectedSequence[startIndex]);
                
                // Start the cycle manager to enable nextView() functionality
                cycleManager.start();
                
                // Manually advance through the specified number of steps
                for (let i = 0; i < steps; i++) {
                    cycleManager.nextView();
                }
                
                // Verify final state
                const finalExpectedIndex = (startIndex + steps) % 4;
                const finalExpectedViewId = expectedSequence[finalExpectedIndex];
                
                assert.strictEqual(
                    cycleManager.getCurrentIndex(),
                    finalExpectedIndex,
                    `Final view index should be ${finalExpectedIndex}, but got ${cycleManager.getCurrentIndex()}`
                );
                
                assert.strictEqual(
                    cycleManager.getCurrentView().id,
                    finalExpectedViewId,
                    `Final view should be ${finalExpectedViewId}, but got ${cycleManager.getCurrentView().id}`
                );
                
                // Verify that each view change followed the correct sequence
                assert.strictEqual(
                    viewChanges.length,
                    steps,
                    `Should have recorded ${steps} view changes, but got ${viewChanges.length}`
                );
                
                // Verify each transition follows the expected sequence
                let currentIndex = startIndex;
                for (let i = 0; i < viewChanges.length; i++) {
                    const expectedNextIndex = (currentIndex + 1) % expectedSequence.length;
                    const expectedViewId = expectedSequence[expectedNextIndex];
                    
                    assert.strictEqual(
                        viewChanges[i],
                        expectedViewId,
                        `View change ${i + 1} should be ${expectedViewId}, but got ${viewChanges[i]}`
                    );
                    
                    currentIndex = expectedNextIndex;
                }
                
                // Verify AppState synchronization
                assert.strictEqual(
                    mockAppState.currentViewIndex,
                    finalExpectedIndex,
                    `AppState should be synchronized with CycleManager index`
                );
                
                // Cleanup
                cycleManager.destroy();
            }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design document
    );
});

/**
 * Property test: CycleManager start/stop behavior
 * Verifies that the cycle manager properly manages its running state
 */
test('Property: CycleManager start/stop behavior is consistent', () => {
    fc.assert(
        fc.property(
            fc.integer({ min: 100, max: 1000 }), // Test with different intervals
            (intervalMs) => {
                const mockAppState = new MockAppState();
                const views = mockAppState.getViews();
                
                let callbackCount = 0;
                const onViewChange = () => {
                    callbackCount++;
                };
                
                const cycleManager = new CycleManager(views, intervalMs, onViewChange, mockAppState);
                
                // Initially should not be running
                assert.strictEqual(cycleManager.isRunning, false);
                
                // Start should set running to true
                cycleManager.start();
                assert.strictEqual(cycleManager.isRunning, true);
                assert.notStrictEqual(cycleManager.intervalId, null);
                
                // Starting again should not create multiple intervals
                const firstIntervalId = cycleManager.intervalId;
                cycleManager.start();
                assert.strictEqual(cycleManager.intervalId, firstIntervalId);
                
                // Stop should set running to false and clear interval
                cycleManager.stop();
                assert.strictEqual(cycleManager.isRunning, false);
                assert.strictEqual(cycleManager.intervalId, null);
                
                // Stopping again should be safe
                cycleManager.stop();
                assert.strictEqual(cycleManager.isRunning, false);
                
                // Cleanup
                cycleManager.destroy();
            }
        ),
        { numRuns: 100 }
    );
});

/**
 * Property test: nextView() only advances when running
 * Verifies that nextView() respects the running state
 */
test('Property: nextView() only advances when CycleManager is running', () => {
    fc.assert(
        fc.property(
            fc.integer({ min: 0, max: 3 }),
            fc.integer({ min: 1, max: 10 }),
            (startIndex, attempts) => {
                const mockAppState = new MockAppState();
                const views = mockAppState.getViews();
                
                let callbackCount = 0;
                const onViewChange = () => {
                    callbackCount++;
                };
                
                const cycleManager = new CycleManager(views, 20000, onViewChange, mockAppState);
                cycleManager.setCurrentIndex(startIndex);
                
                const initialIndex = cycleManager.getCurrentIndex();
                
                // When not running, nextView() should not advance
                for (let i = 0; i < attempts; i++) {
                    cycleManager.nextView();
                }
                
                assert.strictEqual(
                    cycleManager.getCurrentIndex(),
                    initialIndex,
                    'Index should not change when CycleManager is not running'
                );
                
                assert.strictEqual(
                    callbackCount,
                    0,
                    'Callback should not be called when CycleManager is not running'
                );
                
                // When running, nextView() should advance
                cycleManager.start();
                cycleManager.nextView();
                
                const expectedIndex = (initialIndex + 1) % views.length;
                assert.strictEqual(
                    cycleManager.getCurrentIndex(),
                    expectedIndex,
                    'Index should advance when CycleManager is running'
                );
                
                assert.strictEqual(
                    callbackCount,
                    1,
                    'Callback should be called when CycleManager is running'
                );
                
                // Cleanup
                cycleManager.destroy();
            }
        ),
        { numRuns: 100 }
    );
});

/**
 * Property test: View index bounds checking
 * Verifies that view indices are always within valid bounds
 */
test('Property: View indices are always within valid bounds', () => {
    fc.assert(
        fc.property(
            fc.integer({ min: 0, max: 3 }),
            fc.integer({ min: 1, max: 50 }),
            (startIndex, steps) => {
                const mockAppState = new MockAppState();
                const views = mockAppState.getViews();
                const cycleManager = new CycleManager(views, 20000, null, mockAppState);
                
                cycleManager.setCurrentIndex(startIndex);
                cycleManager.start();
                
                // Perform many steps and verify indices are always valid
                for (let i = 0; i < steps; i++) {
                    cycleManager.nextView();
                    
                    const currentIndex = cycleManager.getCurrentIndex();
                    assert(
                        currentIndex >= 0 && currentIndex < views.length,
                        `Index ${currentIndex} should be within bounds [0, ${views.length - 1}]`
                    );
                    
                    // Verify the view at this index exists
                    const currentView = cycleManager.getCurrentView();
                    assert.notStrictEqual(currentView, undefined);
                    assert.notStrictEqual(currentView.id, undefined);
                }
                
                // Cleanup
                cycleManager.destroy();
            }
        ),
        { numRuns: 100 }
    );
});

/**
 * Property test: Callback error handling
 * Verifies that errors in the callback don't break the cycle manager
 */
test('Property: Callback errors do not break CycleManager operation', () => {
    fc.assert(
        fc.property(
            fc.boolean(), // Whether to throw error in callback
            fc.integer({ min: 1, max: 5 }), // Number of steps to test
            (shouldThrowError, steps) => {
                const mockAppState = new MockAppState();
                const views = mockAppState.getViews();
                
                let callbackCallCount = 0;
                const onViewChange = () => {
                    callbackCallCount++;
                    if (shouldThrowError) {
                        throw new Error('Test callback error');
                    }
                };
                
                const cycleManager = new CycleManager(views, 20000, onViewChange, mockAppState);
                cycleManager.start();
                
                const initialIndex = cycleManager.getCurrentIndex();
                
                // Perform steps - should continue working even if callback throws
                for (let i = 0; i < steps; i++) {
                    // Should not throw error even if callback throws
                    assert.doesNotThrow(() => {
                        cycleManager.nextView();
                    });
                }
                
                // Verify that cycling continued despite callback errors
                const expectedFinalIndex = (initialIndex + steps) % views.length;
                assert.strictEqual(
                    cycleManager.getCurrentIndex(),
                    expectedFinalIndex,
                    'CycleManager should continue operating despite callback errors'
                );
                
                assert.strictEqual(
                    callbackCallCount,
                    steps,
                    'Callback should be called for each step'
                );
                
                // Cleanup
                cycleManager.destroy();
            }
        ),
        { numRuns: 100 }
    );
});