import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fc from 'fast-check';
import { JSDOM } from 'jsdom';

// Set up DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.fetch = global.window.fetch;

// Import DataFetcher after setting up globals
const { DataFetcher } = await import('../scripts/data-fetcher.js');

describe('DataFetcher Property Tests', () => {
    let dataFetcher;
    let originalFetch;

    beforeEach(() => {
        dataFetcher = new DataFetcher();
        originalFetch = global.fetch;
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    test('Property 1: Fresh API calls for ranking views', async () => {
        /**
         * Feature: lightweight-cycling-dashboard, Property 1: Fresh API calls for ranking views
         * Validates: Requirements 3.1, 6.1, 8.3
         */
        
        const callTracker = new Map();
        
        // Mock fetch to track calls
        global.fetch = async (url, options) => {
            const key = url;
            const count = callTracker.get(key) || 0;
            callTracker.set(key, count + 1);
            
            return {
                ok: true,
                status: 200,
                json: async () => ([
                    { playerId: 'player1', score: 100 },
                    { playerId: 'player2', score: 90 }
                ])
            };
        };

        await fc.assert(fc.asyncProperty(
            fc.array(fc.constantFrom('FbdmEIT', 'Fbdup9L', 'Fbdurjz'), { minLength: 1, maxLength: 3 }),
            async (leaderboardIds) => {
                callTracker.clear();
                
                // Make API calls for each leaderboard ID
                for (const leaderboardId of leaderboardIds) {
                    await dataFetcher.fetchLeaderboard(leaderboardId);
                }
                
                // Verify each unique leaderboard ID was called exactly once
                const uniqueIds = [...new Set(leaderboardIds)];
                for (const leaderboardId of uniqueIds) {
                    const expectedUrl = `${dataFetcher.baseUrl}/${leaderboardId}`;
                    const callCount = callTracker.get(expectedUrl) || 0;
                    const expectedCalls = leaderboardIds.filter(id => id === leaderboardId).length;
                    
                    assert.strictEqual(callCount, expectedCalls, 
                        `Expected ${expectedCalls} calls for ${leaderboardId}, got ${callCount}`);
                }
            }
        ), { numRuns: 100 });
    });

    test('Property 2: Player data processing consistency', async () => {
        /**
         * Feature: lightweight-cycling-dashboard, Property 2: Player data processing consistency
         * Validates: Requirements 6.2, 6.4
         */
        
        await fc.assert(fc.asyncProperty(
            fc.array(fc.record({
                playerId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
                score: fc.integer({ min: 0, max: 10000 }),
                name: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined })
            }), { minLength: 1, maxLength: 20 }),
            async (playerData) => {
                // Mock fetch to return the test data
                global.fetch = async () => ({
                    ok: true,
                    status: 200,
                    json: async () => playerData
                });
                
                const result = await dataFetcher.fetchLeaderboard('test');
                
                // Count valid players (those that would pass isValidPlayer check)
                const validPlayers = playerData.filter(p => 
                    p && typeof p === 'object' && 
                    (p.playerId || p.id || p.userId || p.user_id) &&
                    typeof (p.score || p.points || p.value) === 'number'
                );
                
                // Verify all valid players are processed (up to limit of 10)
                const expectedCount = Math.min(validPlayers.length, 10);
                assert.strictEqual(result.length, expectedCount, 
                    `Should process ${expectedCount} valid players, got ${result.length}`);
                
                // Verify each player has required fields
                for (const player of result) {
                    assert.ok(typeof player.playerId === 'string', 'playerId should be string');
                    assert.ok(typeof player.score === 'number', 'score should be number');
                    assert.ok(typeof player.position === 'number', 'position should be number');
                    assert.ok(player.position >= 1, 'position should be >= 1');
                }
                
                // Verify players are sorted by score (descending)
                for (let i = 1; i < result.length; i++) {
                    assert.ok(result[i-1].score >= result[i].score, 
                        'Players should be sorted by score descending');
                }
                
                // Verify positions are assigned correctly (positions should be 1, 2, 3, etc.)
                for (let i = 0; i < result.length; i++) {
                    assert.strictEqual(result[i].position, i + 1, 
                        `Player at index ${i} should have position ${i + 1}`);
                }
                
                // Verify positions match the sorted order (highest score gets position 1)
                if (result.length > 1) {
                    for (let i = 0; i < result.length - 1; i++) {
                        assert.ok(result[i].position < result[i + 1].position,
                            'Higher scores should have lower position numbers');
                    }
                }
            }
        ), { numRuns: 100 });
    });

    test('Property 7: Error handling continuity', async () => {
        /**
         * Feature: lightweight-cycling-dashboard, Property 7: Error handling continuity
         * Validates: Requirements 6.3
         */
        
        await fc.assert(fc.asyncProperty(
            fc.oneof(
                fc.constant('network_error'),
                fc.constant('timeout'),
                fc.constant('server_error'),
                fc.constant('invalid_json')
            ),
            fc.constantFrom('FbdmEIT', 'Fbdup9L', 'Fbdurjz'),
            async (errorType, leaderboardId) => {
                let callCount = 0;
                
                // Mock fetch to simulate different error types
                global.fetch = async () => {
                    callCount++;
                    
                    switch (errorType) {
                        case 'network_error':
                            throw new Error('Failed to fetch');
                        case 'timeout':
                            throw new Error('Request timeout after 10000ms');
                        case 'server_error':
                            return { ok: false, status: 500, statusText: 'Internal Server Error' };
                        case 'invalid_json':
                            return { 
                                ok: true, 
                                status: 200, 
                                json: async () => { throw new Error('Invalid JSON'); }
                            };
                        default:
                            throw new Error('Unknown error');
                    }
                };
                
                // The fetchLeaderboard should handle errors gracefully
                try {
                    await dataFetcher.fetchLeaderboard(leaderboardId);
                    assert.fail('Expected error to be thrown');
                } catch (error) {
                    // Verify error is handled gracefully (thrown after retries)
                    assert.ok(error instanceof Error, 'Should throw an Error object');
                    assert.ok(error.message.length > 0, 'Error should have a message');
                    
                    // Verify retry logic was attempted
                    assert.strictEqual(callCount, dataFetcher.maxRetries, 
                        `Should have attempted ${dataFetcher.maxRetries} retries`);
                }
            }
        ), { numRuns: 100 });
    });
});

describe('DataFetcher Unit Tests', () => {
    let dataFetcher;
    let originalFetch;

    beforeEach(() => {
        dataFetcher = new DataFetcher();
        originalFetch = global.fetch;
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    test('successful API response processing', async () => {
        const mockResponse = [
            { playerId: 'player1', score: 100, name: 'Alice' },
            { playerId: 'player2', score: 90, name: 'Bob' },
            { playerId: 'player3', score: 80, name: 'Charlie' }
        ];

        global.fetch = async () => ({
            ok: true,
            status: 200,
            json: async () => mockResponse
        });

        const result = await dataFetcher.fetchLeaderboard('test-board');
        
        assert.strictEqual(result.length, 3);
        assert.strictEqual(result[0].playerId, 'player1');
        assert.strictEqual(result[0].score, 100);
        assert.strictEqual(result[0].position, 1);
        assert.strictEqual(result[1].score, 90);
        assert.strictEqual(result[2].score, 80);
    });

    test('network failure scenarios', async () => {
        global.fetch = async () => {
            throw new Error('Failed to fetch');
        };

        try {
            await dataFetcher.fetchLeaderboard('test-board');
            assert.fail('Expected error to be thrown');
        } catch (error) {
            assert.ok(error.message.includes('Failed to fetch leaderboard after 3 attempts'));
        }
    });

    test('HTTP error responses', async () => {
        global.fetch = async () => ({
            ok: false,
            status: 404,
            statusText: 'Not Found'
        });

        try {
            await dataFetcher.fetchLeaderboard('nonexistent-board');
            assert.fail('Expected error to be thrown');
        } catch (error) {
            assert.ok(error.message.includes('Failed to fetch leaderboard after 3 attempts'));
        }
    });

    test('JSON parsing edge cases', async () => {
        // Test malformed JSON
        global.fetch = async () => ({
            ok: true,
            status: 200,
            json: async () => {
                throw new Error('Unexpected token in JSON');
            }
        });

        try {
            await dataFetcher.fetchLeaderboard('test-board');
            assert.fail('Expected error to be thrown');
        } catch (error) {
            assert.ok(error.message.includes('Failed to fetch leaderboard after 3 attempts'));
        }
    });

    test('empty API response handling', async () => {
        global.fetch = async () => ({
            ok: true,
            status: 200,
            json: async () => []
        });

        const result = await dataFetcher.fetchLeaderboard('empty-board');
        assert.strictEqual(result.length, 0);
    });

    test('different API response formats', async () => {
        // Test wrapped response format
        global.fetch = async () => ({
            ok: true,
            status: 200,
            json: async () => ({
                data: [
                    { id: 'user1', points: 150 },
                    { userId: 'user2', value: 120 }
                ]
            })
        });

        const result = await dataFetcher.fetchLeaderboard('wrapped-board');
        assert.strictEqual(result.length, 2);
        assert.strictEqual(result[0].playerId, 'user1');
        assert.strictEqual(result[0].score, 150);
        assert.strictEqual(result[1].playerId, 'user2');
        assert.strictEqual(result[1].score, 120);
    });

    test('player name sanitization', () => {
        const testCases = [
            { input: '<script>alert("xss")</script>', expected: 'scriptalertxssscript' },
            { input: 'Normal Name', expected: 'Normal Name' },
            { input: '   Padded Name   ', expected: 'Padded Name' },
            { input: 'Very Long Player Name That Exceeds Twenty Characters', expected: 'Very Long Player Nam' },
            { input: 'Name&with"quotes\'', expected: 'Namewithquotes' }
        ];

        testCases.forEach(({ input, expected }) => {
            const sanitized = dataFetcher.sanitizeName(input);
            assert.strictEqual(sanitized, expected);
        });
    });

    test('timeout handling', async () => {
        // Create a new DataFetcher with shorter timeout for testing
        const testFetcher = new DataFetcher();
        testFetcher.timeout = 100; // 100ms timeout for fast test
        
        // Mock a slow response that exceeds timeout
        global.fetch = async (url, options) => {
            return new Promise((resolve, reject) => {
                // Simulate timeout by checking if signal is aborted
                const checkAbort = () => {
                    if (options.signal && options.signal.aborted) {
                        reject(new Error('AbortError'));
                    } else {
                        setTimeout(checkAbort, 10);
                    }
                };
                checkAbort();
                
                // Never resolve to simulate slow response
                setTimeout(() => {
                    resolve({
                        ok: true,
                        status: 200,
                        json: async () => []
                    });
                }, 5000); // Much longer than 100ms timeout
            });
        };

        try {
            await testFetcher.fetchLeaderboard('slow-board');
            assert.fail('Expected timeout error');
        } catch (error) {
            assert.ok(error.message.includes('Failed to fetch leaderboard after 3 attempts'));
        }
    });

    test('enhanced error handling returns structured error info', () => {
        const testCases = [
            { 
                error: new Error('Request timeout after 10000ms'), 
                expectedType: 'timeout',
                expectedRecoverable: true 
            },
            { 
                error: new Error('Failed to fetch'), 
                expectedType: 'network',
                expectedRecoverable: true 
            },
            { 
                error: new Error('HTTP 404: Not Found'), 
                expectedType: 'not_found',
                expectedRecoverable: false 
            },
            { 
                error: new Error('HTTP 500: Internal Server Error'), 
                expectedType: 'server_error',
                expectedRecoverable: true 
            },
            { 
                error: new Error('Invalid JSON'), 
                expectedType: 'parse_error',
                expectedRecoverable: true 
            }
        ];

        testCases.forEach(({ error, expectedType, expectedRecoverable }) => {
            const errorInfo = dataFetcher.handleApiError(error);
            
            assert.strictEqual(errorInfo.type, expectedType);
            assert.strictEqual(errorInfo.recoverable, expectedRecoverable);
            assert.ok(typeof errorInfo.message === 'string');
            assert.ok(errorInfo.retryAfter === null || typeof errorInfo.retryAfter === 'number');
        });
    });

    test('fetchLeaderboardWithFallback returns placeholder data on error', async () => {
        global.fetch = async () => {
            throw new Error('Network error');
        };

        const result = await dataFetcher.fetchLeaderboardWithFallback('test-board');
        
        assert.ok(Array.isArray(result));
        assert.strictEqual(result.length, 3); // Should return 3 placeholder players
        assert.strictEqual(result[0].name, 'Loading...');
        assert.strictEqual(result[0].position, 1);
    });

    test('generatePlaceholderData creates consistent structure', () => {
        const placeholders = dataFetcher.generatePlaceholderData('test-board');
        
        assert.ok(Array.isArray(placeholders));
        assert.strictEqual(placeholders.length, 3);
        
        placeholders.forEach((player, index) => {
            assert.ok(typeof player.playerId === 'string');
            assert.ok(typeof player.score === 'number');
            assert.ok(typeof player.name === 'string');
            assert.strictEqual(player.position, index + 1);
        });
    });

    test('enhanced input sanitization handles edge cases', () => {
        // Test score sanitization
        assert.strictEqual(dataFetcher.sanitizeScore(null), 0);
        assert.strictEqual(dataFetcher.sanitizeScore(undefined), 0);
        assert.strictEqual(dataFetcher.sanitizeScore(NaN), 0);
        assert.strictEqual(dataFetcher.sanitizeScore(Infinity), 0);
        assert.strictEqual(dataFetcher.sanitizeScore(-Infinity), 0);
        assert.strictEqual(dataFetcher.sanitizeScore('123.45'), 123.45);
        assert.strictEqual(dataFetcher.sanitizeScore('abc'), 0);
        assert.strictEqual(dataFetcher.sanitizeScore(-50), 0); // Negative scores become 0
        
        // Test player ID sanitization
        assert.ok(dataFetcher.sanitizePlayerId(null).startsWith('player_'));
        assert.ok(dataFetcher.sanitizePlayerId('').startsWith('player_'));
        assert.strictEqual(dataFetcher.sanitizePlayerId('valid_id-123'), 'valid_id-123');
        assert.strictEqual(dataFetcher.sanitizePlayerId('invalid@#$%id'), 'invalidid');
        
        // Test name sanitization
        assert.strictEqual(dataFetcher.sanitizeName(null), 'Unknown Player');
        assert.strictEqual(dataFetcher.sanitizeName(''), 'Unknown Player');
        assert.strictEqual(dataFetcher.sanitizeName('   '), 'Player');
    });

    test('network status checking', async () => {
        // Mock navigator.onLine using Object.defineProperty
        const originalNavigator = global.navigator;
        
        // Define a mock navigator with onLine property
        Object.defineProperty(global, 'navigator', {
            value: { onLine: true },
            writable: true,
            configurable: true
        });
        
        const isOnline = await dataFetcher.checkNetworkStatus();
        assert.strictEqual(isOnline, true);
        
        // Restore original navigator
        Object.defineProperty(global, 'navigator', {
            value: originalNavigator,
            writable: true,
            configurable: true
        });
    });
});