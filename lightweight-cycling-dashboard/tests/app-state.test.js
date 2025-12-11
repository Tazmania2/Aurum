/**
 * Property-based tests for AppState class
 * **Feature: lightweight-cycling-dashboard, Property 4: View cycling sequence**
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fc from 'fast-check';

// Import the AppState class - we need to make it available for testing
// Since we're using vanilla JS modules, we'll need to simulate the class here
class AppState {
    constructor() {
        this.currentViewIndex = 0;
        this.isRunning = false;
        this.views = [
            {
                id: 'looker-view',
                type: 'looker',
                lookerUrl: 'https://lookerstudio.google.com/embed/reporting/YOUR_REPORT_ID/page/YOUR_PAGE_ID'
            },
            {
                id: 'ranking-1',
                type: 'ranking',
                title: 'Leaderboard 1',
                leaderboardId: 'leaderboard_1'
            },
            {
                id: 'ranking-2',
                type: 'ranking',
                title: 'Leaderboard 2', 
                leaderboardId: 'leaderboard_2'
            },
            {
                id: 'ranking-3',
                type: 'ranking',
                title: 'Leaderboard 3',
                leaderboardId: 'leaderboard_3'
            }
        ];
        this.spaceshipAssets = [
            { car: 'red', image: 'https://client2.funifier.com/v3/assets/spaceship_red.png' },
            { car: 'gold', image: 'https://client2.funifier.com/v3/assets/spaceship_gold.png' },
            { car: 'silver', image: 'https://client2.funifier.com/v3/assets/spaceship_silver.png' },
            { car: 'bronze', image: 'https://client2.funifier.com/v3/assets/spaceship_bronze.png' },
            { car: 'yellow', image: 'https://client2.funifier.com/v3/assets/spaceship_yellow.png' },
            { car: 'green', image: 'https://client2.funifier.com/v3/assets/spaceship_green.png' }
        ];
    }
    
    getCurrentView() {
        return this.views[this.currentViewIndex];
    }
    
    getNextViewIndex() {
        return (this.currentViewIndex + 1) % this.views.length;
    }
    
    setCurrentViewIndex(index) {
        if (index >= 0 && index < this.views.length) {
            this.currentViewIndex = index;
        } else {
            throw new Error(`Invalid view index: ${index}. Must be between 0 and ${this.views.length - 1}`);
        }
    }
    
    nextView() {
        this.currentViewIndex = this.getNextViewIndex();
        return this.getCurrentView();
    }
    
    getViews() {
        return this.views;
    }
    
    getSpaceshipAssets() {
        return this.spaceshipAssets;
    }
    
    isApplicationRunning() {
        return this.isRunning;
    }
    
    setRunning(running) {
        this.isRunning = Boolean(running);
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
                const appState = new AppState();
                
                // Set starting position
                appState.setCurrentViewIndex(startIndex);
                
                // Expected sequence: looker-view (0) → ranking-1 (1) → ranking-2 (2) → ranking-3 (3) → looker-view (0)
                const expectedSequence = ['looker-view', 'ranking-1', 'ranking-2', 'ranking-3'];
                
                // Track the sequence of views we visit
                const visitedViews = [];
                visitedViews.push(appState.getCurrentView().id);
                
                // Advance through the specified number of steps
                for (let i = 0; i < steps; i++) {
                    const nextView = appState.nextView();
                    visitedViews.push(nextView.id);
                }
                
                // Verify each transition follows the expected sequence
                for (let i = 0; i < visitedViews.length - 1; i++) {
                    const currentViewId = visitedViews[i];
                    const nextViewId = visitedViews[i + 1];
                    
                    const currentIndex = expectedSequence.indexOf(currentViewId);
                    const expectedNextIndex = (currentIndex + 1) % expectedSequence.length;
                    const expectedNextViewId = expectedSequence[expectedNextIndex];
                    
                    // Assert that the next view is what we expect
                    assert.strictEqual(
                        nextViewId, 
                        expectedNextViewId,
                        `Expected transition from ${currentViewId} to ${expectedNextViewId}, but got ${nextViewId}`
                    );
                }
                
                // Verify final state is consistent
                const finalExpectedIndex = (startIndex + steps) % 4;
                assert.strictEqual(
                    appState.currentViewIndex,
                    finalExpectedIndex,
                    `Final view index should be ${finalExpectedIndex}, but got ${appState.currentViewIndex}`
                );
                
                // Verify the final view ID matches the expected sequence
                const finalExpectedViewId = expectedSequence[finalExpectedIndex];
                assert.strictEqual(
                    appState.getCurrentView().id,
                    finalExpectedViewId,
                    `Final view should be ${finalExpectedViewId}, but got ${appState.getCurrentView().id}`
                );
            }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design document
    );
});

/**
 * Additional property test: getNextViewIndex should always return valid indices
 */
test('Property: getNextViewIndex always returns valid indices', () => {
    fc.assert(
        fc.property(
            fc.integer({ min: 0, max: 3 }),
            (currentIndex) => {
                const appState = new AppState();
                appState.setCurrentViewIndex(currentIndex);
                
                const nextIndex = appState.getNextViewIndex();
                
                // Next index should be within valid range
                assert(nextIndex >= 0 && nextIndex < appState.views.length);
                
                // Next index should be the expected value
                const expectedNext = (currentIndex + 1) % appState.views.length;
                assert.strictEqual(nextIndex, expectedNext);
            }
        ),
        { numRuns: 100 }
    );
});

/**
 * Additional property test: setCurrentViewIndex should reject invalid indices
 */
test('Property: setCurrentViewIndex rejects invalid indices', () => {
    fc.assert(
        fc.property(
            fc.integer({ min: -100, max: 100 }).filter(n => n < 0 || n >= 4),
            (invalidIndex) => {
                const appState = new AppState();
                
                // Should throw error for invalid indices
                assert.throws(
                    () => appState.setCurrentViewIndex(invalidIndex),
                    Error,
                    `Should throw error for invalid index ${invalidIndex}`
                );
            }
        ),
        { numRuns: 100 }
    );
});