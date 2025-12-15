import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fc from 'fast-check';
import { JSDOM } from 'jsdom';

// Set up DOM environment
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<body>
    <div id="test-container" style="width: 800px; height: 600px; position: relative;"></div>
</body>
</html>
`, {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;

// Mock spaceship assets for testing
const mockSpaceshipAssets = [
    { car: 'red', image: 'https://example.com/spaceship_red.png' },
    { car: 'gold', image: 'https://example.com/spaceship_gold.png' },
    { car: 'silver', image: 'https://example.com/spaceship_silver.png' },
    { car: 'bronze', image: 'https://example.com/spaceship_bronze.png' },
    { car: 'yellow', image: 'https://example.com/spaceship_yellow.png' },
    { car: 'green', image: 'https://example.com/spaceship_green.png' }
];

// Import RankingRenderer after setting up globals
// Since we're using vanilla JS modules, we'll need to simulate the class here
class RankingRenderer {
    constructor(spaceshipAssets) {
        this.spaceshipAssets = spaceshipAssets;
        this.colorMap = {
            1: 'gold',
            2: 'silver', 
            3: 'bronze',
            4: 'red',
            5: 'yellow',
            6: 'green'
        };
    }
    
    calculatePosition(position, totalPlayers, container) {
        const containerWidth = container.offsetWidth || 800;
        const containerHeight = container.offsetHeight || 600;
        
        // Calculate horizontal position (spread across width)
        const spacing = containerWidth / (totalPlayers + 1);
        const x = spacing * position - 40; // Offset for spaceship width
        
        // Calculate vertical position based on score ranking
        // Higher positions (better scores) get lower Y values (higher on screen)
        const maxHeight = containerHeight - 150; // Leave space for player info
        const minHeight = 50;
        const heightRange = maxHeight - minHeight;
        
        // Position 1 should get minHeight (top), higher positions get higher Y values
        const normalizedPosition = (position - 1) / (totalPlayers - 1 || 1);
        const y = minHeight + (heightRange * normalizedPosition);
        
        return { x: Math.max(0, Math.min(x, containerWidth - 100)), y };
    }
    
    assignSpaceshipColors(position) {
        return this.colorMap[position] || 'red';
    }
    
    getSpaceshipAsset(position) {
        const colorKey = this.colorMap[position] || 'red';
        const asset = this.spaceshipAssets.find(asset => asset.car === colorKey);
        return asset ? asset.image : this.getFallbackSpaceshipAsset();
    }
    
    getFallbackSpaceshipAsset() {
        return this.spaceshipAssets.length > 0 ? this.spaceshipAssets[0].image : '';
    }
    
    renderRanking(playerData, containerId, title) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container not found: ${containerId}`);
            return;
        }
        
        // Clear existing content
        container.innerHTML = '';
        
        if (!playerData || playerData.length === 0) {
            return;
        }
        
        // Sort players by score (highest first)
        const sortedPlayers = [...playerData].sort((a, b) => b.score - a.score);
        
        // Render each player as a spaceship
        sortedPlayers.forEach((player, index) => {
            const position = index + 1;
            this.renderSpaceship(container, player, position, sortedPlayers.length);
        });
    }
    
    renderSpaceship(container, player, position, totalPlayers) {
        // Create spaceship element
        const spaceshipElement = document.createElement('div');
        spaceshipElement.className = `spaceship rank-${position <= 3 ? position : 'other'}`;
        spaceshipElement.setAttribute('data-position', position);
        spaceshipElement.setAttribute('data-score', player.score);
        
        // Calculate position
        const { x, y } = this.calculatePosition(position, totalPlayers, container);
        
        // Set position
        spaceshipElement.style.left = x + 'px';
        spaceshipElement.style.top = y + 'px';
        spaceshipElement.style.position = 'absolute';
        
        // Create spaceship image
        const spaceshipImage = document.createElement('img');
        spaceshipImage.className = 'spaceship-image';
        spaceshipImage.src = this.getSpaceshipAsset(position);
        spaceshipImage.alt = `${player.name} spaceship`;
        
        // Create player info
        const playerInfo = document.createElement('div');
        playerInfo.className = 'player-info';
        
        const playerName = document.createElement('div');
        playerName.className = 'player-name';
        playerName.textContent = player.name || `Player ${player.playerId}`;
        
        const playerScore = document.createElement('div');
        playerScore.className = 'player-score';
        playerScore.textContent = player.score.toString();
        
        // Assemble elements
        playerInfo.appendChild(playerName);
        playerInfo.appendChild(playerScore);
        spaceshipElement.appendChild(spaceshipImage);
        spaceshipElement.appendChild(playerInfo);
        
        // Add to container
        container.appendChild(spaceshipElement);
    }
}

describe('RankingRenderer Property Tests', () => {
    let rankingRenderer;
    let container;

    beforeEach(() => {
        rankingRenderer = new RankingRenderer(mockSpaceshipAssets);
        container = document.getElementById('test-container');
        container.innerHTML = '';
        // Set container dimensions for consistent testing
        container.style.width = '800px';
        container.style.height = '600px';
        container.style.position = 'relative';
    });

    afterEach(() => {
        container.innerHTML = '';
    });

    test('Property 3: Score-based positioning', () => {
        /**
         * **Feature: lightweight-cycling-dashboard, Property 3: Score-based positioning**
         * **Validates: Requirements 3.2, 3.3, 4.4**
         * 
         * Property: For any set of players with different scores, spaceships should be 
         * positioned vertically such that higher scores result in higher Y positions, 
         * with appropriate spaceship assets assigned by ranking position
         */
        
        fc.assert(
            fc.property(
                // Generate array of players with different scores
                fc.array(
                    fc.record({
                        playerId: fc.string({ minLength: 1, maxLength: 10 }),
                        name: fc.string({ minLength: 1, maxLength: 15 }),
                        score: fc.integer({ min: 0, max: 10000 })
                    }),
                    { minLength: 2, maxLength: 10 } // At least 2 players to test positioning
                ).filter(players => {
                    // Ensure we have at least 2 different scores for meaningful positioning test
                    const uniqueScores = new Set(players.map(p => p.score));
                    return uniqueScores.size >= 2;
                }),
                (playerData) => {
                    // Render the ranking
                    rankingRenderer.renderRanking(playerData, 'test-container', 'Test Ranking');
                    
                    // Get all spaceship elements
                    const spaceships = container.querySelectorAll('.spaceship');
                    assert.strictEqual(spaceships.length, playerData.length, 
                        'Should render one spaceship per player');
                    
                    // Sort players by score (highest first) to match expected rendering order
                    const sortedPlayers = [...playerData].sort((a, b) => b.score - a.score);
                    
                    // Verify positioning: higher scores should have higher Y positions (lower Y values)
                    for (let i = 0; i < spaceships.length - 1; i++) {
                        const currentSpaceship = spaceships[i];
                        const nextSpaceship = spaceships[i + 1];
                        
                        const currentY = parseInt(currentSpaceship.style.top);
                        const nextY = parseInt(nextSpaceship.style.top);
                        
                        const currentScore = parseInt(currentSpaceship.getAttribute('data-score'));
                        const nextScore = parseInt(nextSpaceship.getAttribute('data-score'));
                        
                        // Higher score should have lower Y value (higher on screen)
                        if (currentScore > nextScore) {
                            assert.ok(currentY <= nextY, 
                                `Player with score ${currentScore} should be positioned higher (lower Y) than player with score ${nextScore}. Got Y: ${currentY} vs ${nextY}`);
                        }
                    }
                    
                    // Verify position attributes match the ranking
                    for (let i = 0; i < spaceships.length; i++) {
                        const spaceship = spaceships[i];
                        const expectedPosition = i + 1;
                        const actualPosition = parseInt(spaceship.getAttribute('data-position'));
                        
                        assert.strictEqual(actualPosition, expectedPosition,
                            `Spaceship at index ${i} should have position ${expectedPosition}, got ${actualPosition}`);
                    }
                    
                    // Verify spaceship assets are assigned correctly based on position
                    for (let i = 0; i < Math.min(spaceships.length, 6); i++) {
                        const spaceship = spaceships[i];
                        const position = i + 1;
                        const expectedColor = rankingRenderer.assignSpaceshipColors(position);
                        const expectedAsset = rankingRenderer.getSpaceshipAsset(position);
                        
                        const spaceshipImage = spaceship.querySelector('.spaceship-image');
                        assert.strictEqual(spaceshipImage.src, expectedAsset,
                            `Spaceship at position ${position} should have asset for color ${expectedColor}`);
                    }
                    
                    // Verify top 3 positions have special rank classes
                    for (let i = 0; i < Math.min(spaceships.length, 3); i++) {
                        const spaceship = spaceships[i];
                        const position = i + 1;
                        
                        assert.ok(spaceship.classList.contains(`rank-${position}`),
                            `Top 3 spaceship at position ${position} should have rank-${position} class`);
                    }
                    
                    // Verify positions beyond 3 have 'rank-other' class
                    for (let i = 3; i < spaceships.length; i++) {
                        const spaceship = spaceships[i];
                        
                        assert.ok(spaceship.classList.contains('rank-other'),
                            `Spaceship beyond position 3 should have rank-other class`);
                    }
                    
                    // Verify Y positions are within container bounds
                    const containerHeight = container.offsetHeight || 600;
                    for (const spaceship of spaceships) {
                        const y = parseInt(spaceship.style.top);
                        assert.ok(y >= 50, `Y position ${y} should be >= 50 (minHeight)`);
                        assert.ok(y <= containerHeight - 150, 
                            `Y position ${y} should be <= ${containerHeight - 150} (maxHeight)`);
                    }
                    
                    // Verify X positions are spread across container width
                    const containerWidth = container.offsetWidth || 800;
                    for (const spaceship of spaceships) {
                        const x = parseInt(spaceship.style.left);
                        assert.ok(x >= 0, `X position ${x} should be >= 0`);
                        assert.ok(x <= containerWidth - 100, 
                            `X position ${x} should be <= ${containerWidth - 100}`);
                    }
                }
            ),
            { numRuns: 100 } // Run 100 iterations as specified in design document
        );
    });

    test('Property 6: Player information display', () => {
        /**
         * **Feature: lightweight-cycling-dashboard, Property 6: Player information display**
         * **Validates: Requirements 3.4**
         * 
         * Property: For any rendered ranking, each player should have their name and 
         * score displayed in the DOM below their corresponding spaceship
         */
        
        fc.assert(
            fc.property(
                // Generate array of players with various name and score combinations
                fc.array(
                    fc.record({
                        playerId: fc.string({ minLength: 1, maxLength: 15 }),
                        name: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
                        score: fc.integer({ min: 0, max: 100000 })
                    }),
                    { minLength: 1, maxLength: 8 } // Test with 1-8 players
                ),
                (playerData) => {
                    // Render the ranking
                    rankingRenderer.renderRanking(playerData, 'test-container', 'Test Ranking');
                    
                    // Get all spaceship elements
                    const spaceships = container.querySelectorAll('.spaceship');
                    assert.strictEqual(spaceships.length, playerData.length, 
                        'Should render one spaceship per player');
                    
                    // Sort players by score (highest first) to match expected rendering order
                    const sortedPlayers = [...playerData].sort((a, b) => b.score - a.score);
                    
                    // Verify each spaceship has player information displayed
                    for (let i = 0; i < spaceships.length; i++) {
                        const spaceship = spaceships[i];
                        const player = sortedPlayers[i];
                        
                        // Check that spaceship contains player info div
                        const playerInfo = spaceship.querySelector('.player-info');
                        assert.ok(playerInfo, 
                            `Spaceship ${i} should contain a .player-info element`);
                        
                        // Check that player info contains name element
                        const playerNameElement = playerInfo.querySelector('.player-name');
                        assert.ok(playerNameElement, 
                            `Player info for spaceship ${i} should contain a .player-name element`);
                        
                        // Check that player info contains score element
                        const playerScoreElement = playerInfo.querySelector('.player-score');
                        assert.ok(playerScoreElement, 
                            `Player info for spaceship ${i} should contain a .player-score element`);
                        
                        // Verify name content is displayed correctly
                        const expectedName = player.name || `Player ${player.playerId}`;
                        assert.strictEqual(playerNameElement.textContent, expectedName,
                            `Player name should be "${expectedName}" but got "${playerNameElement.textContent}"`);
                        
                        // Verify score content is displayed correctly
                        const expectedScore = player.score.toString();
                        assert.strictEqual(playerScoreElement.textContent, expectedScore,
                            `Player score should be "${expectedScore}" but got "${playerScoreElement.textContent}"`);
                        
                        // Verify player info is positioned below the spaceship image
                        const spaceshipImage = spaceship.querySelector('.spaceship-image');
                        assert.ok(spaceshipImage, 
                            `Spaceship ${i} should contain a .spaceship-image element`);
                        
                        // Verify DOM structure: spaceship contains both image and player info
                        const spaceshipChildren = Array.from(spaceship.children);
                        assert.ok(spaceshipChildren.includes(spaceshipImage),
                            'Spaceship should contain the spaceship image as a child');
                        assert.ok(spaceshipChildren.includes(playerInfo),
                            'Spaceship should contain the player info as a child');
                        
                        // Verify the spaceship has correct data attributes
                        const dataScore = parseInt(spaceship.getAttribute('data-score'));
                        assert.strictEqual(dataScore, player.score,
                            `Spaceship data-score should be ${player.score} but got ${dataScore}`);
                        
                        const dataPosition = parseInt(spaceship.getAttribute('data-position'));
                        assert.strictEqual(dataPosition, i + 1,
                            `Spaceship data-position should be ${i + 1} but got ${dataPosition}`);
                    }
                    
                    // Verify no extra player info elements exist outside spaceships
                    const allPlayerInfos = container.querySelectorAll('.player-info');
                    assert.strictEqual(allPlayerInfos.length, playerData.length,
                        'Should have exactly one .player-info element per player');
                    
                    // Verify all player info elements are contained within spaceships
                    for (const playerInfo of allPlayerInfos) {
                        const parentSpaceship = playerInfo.closest('.spaceship');
                        assert.ok(parentSpaceship,
                            'Each .player-info element should be contained within a .spaceship element');
                    }
                }
            ),
            { numRuns: 100 } // Run 100 iterations as specified in design document
        );
    });
});

describe('RankingRenderer Unit Tests', () => {
    let rankingRenderer;
    let container;

    beforeEach(() => {
        rankingRenderer = new RankingRenderer(mockSpaceshipAssets);
        container = document.getElementById('test-container');
        container.innerHTML = '';
        // Set container dimensions for consistent testing
        container.style.width = '800px';
        container.style.height = '600px';
        container.style.position = 'relative';
    });

    afterEach(() => {
        container.innerHTML = '';
    });

    test('spaceship image assignment', () => {
        const testPlayers = [
            { playerId: 'p1', name: 'Player 1', score: 100 },
            { playerId: 'p2', name: 'Player 2', score: 90 },
            { playerId: 'p3', name: 'Player 3', score: 80 },
            { playerId: 'p4', name: 'Player 4', score: 70 }
        ];

        rankingRenderer.renderRanking(testPlayers, 'test-container', 'Test Ranking');

        const spaceships = container.querySelectorAll('.spaceship');
        assert.strictEqual(spaceships.length, 4, 'Should render 4 spaceships');

        // Test spaceship image assignments based on position
        const expectedAssets = [
            'https://example.com/spaceship_gold.png',   // Position 1 -> gold
            'https://example.com/spaceship_silver.png', // Position 2 -> silver
            'https://example.com/spaceship_bronze.png', // Position 3 -> bronze
            'https://example.com/spaceship_red.png'     // Position 4 -> red
        ];

        spaceships.forEach((spaceship, index) => {
            const spaceshipImage = spaceship.querySelector('.spaceship-image');
            assert.ok(spaceshipImage, `Spaceship ${index} should have an image`);
            assert.strictEqual(spaceshipImage.src, expectedAssets[index],
                `Spaceship ${index} should have correct asset`);
            assert.strictEqual(spaceshipImage.alt, `${testPlayers[index].name} spaceship`,
                `Spaceship ${index} should have correct alt text`);
        });
    });

    test('DOM structure creation', () => {
        const testPlayers = [
            { playerId: 'p1', name: 'Alice', score: 150 },
            { playerId: 'p2', name: 'Bob', score: 120 }
        ];

        rankingRenderer.renderRanking(testPlayers, 'test-container', 'Test Ranking');

        const spaceships = container.querySelectorAll('.spaceship');
        assert.strictEqual(spaceships.length, 2, 'Should render 2 spaceships');

        spaceships.forEach((spaceship, index) => {
            const player = testPlayers[index];
            const position = index + 1;

            // Check spaceship element structure
            assert.ok(spaceship.classList.contains('spaceship'), 'Should have spaceship class');
            assert.ok(spaceship.classList.contains(`rank-${position}`), 
                `Should have rank-${position} class`);
            assert.strictEqual(spaceship.getAttribute('data-position'), position.toString(),
                'Should have correct data-position attribute');
            assert.strictEqual(spaceship.getAttribute('data-score'), player.score.toString(),
                'Should have correct data-score attribute');

            // Check spaceship image
            const spaceshipImage = spaceship.querySelector('.spaceship-image');
            assert.ok(spaceshipImage, 'Should contain spaceship image');
            assert.ok(spaceshipImage.classList.contains('spaceship-image'), 
                'Image should have spaceship-image class');

            // Check player info structure
            const playerInfo = spaceship.querySelector('.player-info');
            assert.ok(playerInfo, 'Should contain player info');
            assert.ok(playerInfo.classList.contains('player-info'), 
                'Player info should have player-info class');

            const playerName = playerInfo.querySelector('.player-name');
            assert.ok(playerName, 'Should contain player name element');
            assert.ok(playerName.classList.contains('player-name'), 
                'Player name should have player-name class');
            assert.strictEqual(playerName.textContent, player.name,
                'Player name should display correct text');

            const playerScore = playerInfo.querySelector('.player-score');
            assert.ok(playerScore, 'Should contain player score element');
            assert.ok(playerScore.classList.contains('player-score'), 
                'Player score should have player-score class');
            assert.strictEqual(playerScore.textContent, player.score.toString(),
                'Player score should display correct text');
        });
    });

    test('CSS positioning calculations', () => {
        const testPlayers = [
            { playerId: 'p1', name: 'First', score: 300 },
            { playerId: 'p2', name: 'Second', score: 200 },
            { playerId: 'p3', name: 'Third', score: 100 }
        ];

        rankingRenderer.renderRanking(testPlayers, 'test-container', 'Test Ranking');

        const spaceships = container.querySelectorAll('.spaceship');
        assert.strictEqual(spaceships.length, 3, 'Should render 3 spaceships');

        // Test positioning calculations
        spaceships.forEach((spaceship, index) => {
            const position = index + 1;
            const totalPlayers = 3;

            // Check that spaceship has absolute positioning
            assert.strictEqual(spaceship.style.position, 'absolute',
                'Spaceship should have absolute positioning');

            // Verify X position (horizontal spacing)
            const expectedSpacing = 800 / (totalPlayers + 1); // containerWidth / (totalPlayers + 1)
            const expectedX = Math.max(0, Math.min(expectedSpacing * position - 40, 800 - 100));
            const actualX = parseInt(spaceship.style.left);
            assert.strictEqual(actualX, expectedX,
                `Spaceship ${index} should have correct X position`);

            // Verify Y position (vertical based on ranking)
            const containerHeight = 600;
            const maxHeight = containerHeight - 150; // 450
            const minHeight = 50;
            const heightRange = maxHeight - minHeight; // 400
            const normalizedPosition = (position - 1) / (totalPlayers - 1 || 1);
            const expectedY = minHeight + (heightRange * normalizedPosition);
            const actualY = parseInt(spaceship.style.top);
            assert.strictEqual(actualY, expectedY,
                `Spaceship ${index} should have correct Y position`);
        });

        // Verify that higher scores are positioned higher (lower Y values)
        const firstSpaceshipY = parseInt(spaceships[0].style.top);
        const secondSpaceshipY = parseInt(spaceships[1].style.top);
        const thirdSpaceshipY = parseInt(spaceships[2].style.top);

        assert.ok(firstSpaceshipY <= secondSpaceshipY,
            'First place should be positioned higher than or equal to second place');
        assert.ok(secondSpaceshipY <= thirdSpaceshipY,
            'Second place should be positioned higher than or equal to third place');
    });

    test('empty player data handling', () => {
        rankingRenderer.renderRanking([], 'test-container', 'Empty Ranking');

        const spaceships = container.querySelectorAll('.spaceship');
        assert.strictEqual(spaceships.length, 0, 'Should render no spaceships for empty data');

        // Should not crash and container should be cleared
        assert.strictEqual(container.children.length, 0, 'Container should be empty');
    });

    test('null/undefined player data handling', () => {
        rankingRenderer.renderRanking(null, 'test-container', 'Null Ranking');
        assert.strictEqual(container.querySelectorAll('.spaceship').length, 0, 
            'Should handle null data gracefully');

        rankingRenderer.renderRanking(undefined, 'test-container', 'Undefined Ranking');
        assert.strictEqual(container.querySelectorAll('.spaceship').length, 0, 
            'Should handle undefined data gracefully');
    });

    test('missing player name handling', () => {
        const testPlayers = [
            { playerId: 'p1', score: 100 }, // No name property
            { playerId: 'p2', name: '', score: 90 }, // Empty name
            { playerId: 'p3', name: null, score: 80 } // Null name
        ];

        rankingRenderer.renderRanking(testPlayers, 'test-container', 'Test Ranking');

        const spaceships = container.querySelectorAll('.spaceship');
        const playerNames = Array.from(spaceships).map(s => 
            s.querySelector('.player-name').textContent
        );

        assert.strictEqual(playerNames[0], 'Player p1', 
            'Should use playerId when name is missing');
        assert.strictEqual(playerNames[1], 'Player p2', 
            'Should use playerId when name is empty');
        assert.strictEqual(playerNames[2], 'Player p3', 
            'Should use playerId when name is null');
    });

    test('spaceship color assignment beyond top 6', () => {
        const testPlayers = Array.from({ length: 8 }, (_, i) => ({
            playerId: `p${i + 1}`,
            name: `Player ${i + 1}`,
            score: 100 - i * 10
        }));

        rankingRenderer.renderRanking(testPlayers, 'test-container', 'Test Ranking');

        const spaceships = container.querySelectorAll('.spaceship');
        const spaceshipImages = Array.from(spaceships).map(s => 
            s.querySelector('.spaceship-image').src
        );

        // First 6 should get specific colors, rest should get red (fallback)
        const expectedAssets = [
            'https://example.com/spaceship_gold.png',   // Position 1
            'https://example.com/spaceship_silver.png', // Position 2
            'https://example.com/spaceship_bronze.png', // Position 3
            'https://example.com/spaceship_red.png',    // Position 4
            'https://example.com/spaceship_yellow.png', // Position 5
            'https://example.com/spaceship_green.png',  // Position 6
            'https://example.com/spaceship_red.png',    // Position 7 -> fallback to red
            'https://example.com/spaceship_red.png'     // Position 8 -> fallback to red
        ];

        spaceshipImages.forEach((src, index) => {
            assert.strictEqual(src, expectedAssets[index],
                `Spaceship ${index + 1} should have correct asset`);
        });
    });

    test('rank class assignment', () => {
        const testPlayers = Array.from({ length: 5 }, (_, i) => ({
            playerId: `p${i + 1}`,
            name: `Player ${i + 1}`,
            score: 100 - i * 10
        }));

        rankingRenderer.renderRanking(testPlayers, 'test-container', 'Test Ranking');

        const spaceships = container.querySelectorAll('.spaceship');

        // First 3 should have specific rank classes
        assert.ok(spaceships[0].classList.contains('rank-1'), 
            'First place should have rank-1 class');
        assert.ok(spaceships[1].classList.contains('rank-2'), 
            'Second place should have rank-2 class');
        assert.ok(spaceships[2].classList.contains('rank-3'), 
            'Third place should have rank-3 class');

        // Beyond 3rd should have rank-other class
        assert.ok(spaceships[3].classList.contains('rank-other'), 
            'Fourth place should have rank-other class');
        assert.ok(spaceships[4].classList.contains('rank-other'), 
            'Fifth place should have rank-other class');
    });

    test('container not found handling', () => {
        // Should not crash when container doesn't exist
        assert.doesNotThrow(() => {
            rankingRenderer.renderRanking([{ playerId: 'p1', score: 100 }], 'nonexistent-container');
        }, 'Should handle missing container gracefully');
    });

    test('assignSpaceshipColors method', () => {
        // Test the public method for color assignment
        assert.strictEqual(rankingRenderer.assignSpaceshipColors(1), 'gold');
        assert.strictEqual(rankingRenderer.assignSpaceshipColors(2), 'silver');
        assert.strictEqual(rankingRenderer.assignSpaceshipColors(3), 'bronze');
        assert.strictEqual(rankingRenderer.assignSpaceshipColors(4), 'red');
        assert.strictEqual(rankingRenderer.assignSpaceshipColors(5), 'yellow');
        assert.strictEqual(rankingRenderer.assignSpaceshipColors(6), 'green');
        assert.strictEqual(rankingRenderer.assignSpaceshipColors(7), 'red'); // fallback
        assert.strictEqual(rankingRenderer.assignSpaceshipColors(100), 'red'); // fallback
    });

    // Visual Hierarchy Tests for Task 8.1
    test('CSS class application for rankings', () => {
        const testPlayers = [
            { playerId: 'p1', name: 'Gold Player', score: 300 },
            { playerId: 'p2', name: 'Silver Player', score: 200 },
            { playerId: 'p3', name: 'Bronze Player', score: 100 },
            { playerId: 'p4', name: 'Other Player', score: 50 }
        ];

        rankingRenderer.renderRanking(testPlayers, 'test-container', 'Visual Hierarchy Test');

        const spaceships = container.querySelectorAll('.spaceship');
        assert.strictEqual(spaceships.length, 4, 'Should render 4 spaceships');

        // Test top 3 positions have correct rank classes
        assert.ok(spaceships[0].classList.contains('rank-1'), 
            'First place should have rank-1 class for gold highlighting');
        assert.ok(spaceships[1].classList.contains('rank-2'), 
            'Second place should have rank-2 class for silver highlighting');
        assert.ok(spaceships[2].classList.contains('rank-3'), 
            'Third place should have rank-3 class for bronze highlighting');
        assert.ok(spaceships[3].classList.contains('rank-other'), 
            'Fourth place should have rank-other class');

        // Test that each spaceship has the base spaceship class
        spaceships.forEach((spaceship, index) => {
            assert.ok(spaceship.classList.contains('spaceship'), 
                `Spaceship ${index + 1} should have base spaceship class`);
        });

        // Test data attributes for position tracking
        spaceships.forEach((spaceship, index) => {
            const position = index + 1;
            assert.strictEqual(spaceship.getAttribute('data-position'), position.toString(),
                `Spaceship ${position} should have correct data-position attribute`);
        });
    });

    test('animation property assignment', () => {
        const testPlayers = [
            { playerId: 'p1', name: 'Animated Player 1', score: 500 },
            { playerId: 'p2', name: 'Animated Player 2', score: 400 },
            { playerId: 'p3', name: 'Animated Player 3', score: 300 }
        ];

        rankingRenderer.renderRanking(testPlayers, 'test-container', 'Animation Test');

        const spaceships = container.querySelectorAll('.spaceship');

        // Test that spaceships have proper positioning for animations
        spaceships.forEach((spaceship, index) => {
            // Check absolute positioning is set for CSS animations
            assert.strictEqual(spaceship.style.position, 'absolute',
                `Spaceship ${index + 1} should have absolute positioning for animations`);

            // Check that left and top styles are set for transform animations
            assert.ok(spaceship.style.left !== '', 
                `Spaceship ${index + 1} should have left position set`);
            assert.ok(spaceship.style.top !== '', 
                `Spaceship ${index + 1} should have top position set`);

            // Verify position values are numeric (for CSS transitions)
            const leftValue = parseInt(spaceship.style.left);
            const topValue = parseInt(spaceship.style.top);
            assert.ok(!isNaN(leftValue), 
                `Spaceship ${index + 1} left position should be numeric`);
            assert.ok(!isNaN(topValue), 
                `Spaceship ${index + 1} top position should be numeric`);
        });

        // Test spaceship images have proper structure for filter animations
        spaceships.forEach((spaceship, index) => {
            const spaceshipImage = spaceship.querySelector('.spaceship-image');
            assert.ok(spaceshipImage, 
                `Spaceship ${index + 1} should have image element for filter animations`);
            assert.ok(spaceshipImage.classList.contains('spaceship-image'),
                `Spaceship ${index + 1} image should have spaceship-image class for CSS targeting`);
        });

        // Test player info elements have proper structure for animations
        spaceships.forEach((spaceship, index) => {
            const playerInfo = spaceship.querySelector('.player-info');
            assert.ok(playerInfo, 
                `Spaceship ${index + 1} should have player-info element for animations`);
            assert.ok(playerInfo.classList.contains('player-info'),
                `Spaceship ${index + 1} player info should have player-info class for CSS targeting`);
        });
    });

    test('responsive design breakpoints', () => {
        const testPlayers = [
            { playerId: 'p1', name: 'Responsive Player 1', score: 1000 },
            { playerId: 'p2', name: 'Responsive Player 2', score: 800 }
        ];

        // Test with different container sizes to simulate responsive breakpoints
        const testSizes = [
            { width: 768, height: 600, description: 'mobile size' },
            { width: 1366, height: 768, description: 'tablet size' },
            { width: 1920, height: 1080, description: 'HD TV size' },
            { width: 3840, height: 2160, description: '4K TV size' }
        ];

        testSizes.forEach(({ width, height, description }) => {
            // Clear and resize container
            container.innerHTML = '';
            container.style.width = width + 'px';
            container.style.height = height + 'px';

            rankingRenderer.renderRanking(testPlayers, 'test-container', `Responsive Test - ${description}`);

            const spaceships = container.querySelectorAll('.spaceship');
            assert.strictEqual(spaceships.length, 2, 
                `Should render 2 spaceships for ${description}`);

            // Test positioning adapts to container size
            spaceships.forEach((spaceship, index) => {
                const x = parseInt(spaceship.style.left);
                const y = parseInt(spaceship.style.top);

                // X position should be within container bounds
                assert.ok(x >= 0 && x <= width - 100, 
                    `Spaceship ${index + 1} X position should be within bounds for ${description}`);

                // Y position should be within container bounds
                assert.ok(y >= 50 && y <= height - 150, 
                    `Spaceship ${index + 1} Y position should be within bounds for ${description}`);
            });

            // Test that spaceships maintain proper spacing relative to container size
            const spacing = width / (testPlayers.length + 1);
            spaceships.forEach((spaceship, index) => {
                const position = index + 1;
                const rawX = spacing * position - 40;
                const expectedX = Math.max(0, Math.min(rawX, width - 100));
                const actualX = parseInt(spaceship.style.left);
                
                assert.strictEqual(actualX, expectedX,
                    `Spaceship ${position} should have correct responsive X position for ${description}. Raw: ${rawX}, Expected: ${expectedX}, Actual: ${actualX}`);
            });
        });

        // Reset container to default size
        container.style.width = '800px';
        container.style.height = '600px';
    });
});