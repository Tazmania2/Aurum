// Ranking Renderer - Creates animated spaceship displays

class RankingRenderer {
    constructor(spaceshipAssets, performanceRecommendations = {}) {
        this.spaceshipAssets = spaceshipAssets;
        this.perfRecommendations = {
            maxSpaceships: 12,
            animationDuration: 800,
            useComplexAnimations: true,
            useFilters: true,
            ...performanceRecommendations
        };
        this.colorMap = {
            1: 'gold',
            2: 'silver', 
            3: 'bronze',
            4: 'red',
            5: 'yellow',
            6: 'green'
        };
        
        console.log('RankingRenderer initialized with performance settings:', this.perfRecommendations);
    }
    
    renderRanking(playerData, containerId, title, errorInfo = null, configId = null) {
        console.log(`Rendering ranking in container: ${containerId}`);
        console.log('Player data received:', playerData);
        
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container not found: ${containerId}`);
            return false;
        }
        
        // Clear existing content
        container.innerHTML = '';
        
        // Handle error states
        if (errorInfo) {
            console.log('Rendering error state:', errorInfo);
            this.renderErrorState(container, errorInfo, containerId);
            return false;
        }
        
        // Handle empty or invalid data
        if (!playerData || !Array.isArray(playerData) || playerData.length === 0) {
            console.log('No valid player data, rendering empty state');
            this.renderEmptyState(container, 'no_data');
            return false;
        }
        
        // Validate and sanitize player data
        const validatedPlayers = this.validateAndSanitizePlayers(playerData);
        console.log('Validated players:', validatedPlayers);
        
        if (validatedPlayers.length === 0) {
            console.log('No players passed validation, rendering empty state');
            this.renderEmptyState(container, 'no_data');
            return false;
        }
        
        // Sort players by score (highest first)
        const sortedPlayers = [...validatedPlayers].sort((a, b) => b.score - a.score);
        
        // Limit number of spaceships for Smart TV performance - implements Requirements 5.5
        const maxPlayers = Math.min(sortedPlayers.length, this.perfRecommendations.maxSpaceships);
        const playersToRender = sortedPlayers.slice(0, maxPlayers);
        
        console.log(`Rendering ${playersToRender.length} of ${sortedPlayers.length} players (max: ${this.perfRecommendations.maxSpaceships})`);
        
        try {
            // Render each player as a spaceship
            // Store configId for spaceship rendering
            this.currentConfigId = configId;
            
            playersToRender.forEach((player, index) => {
                const position = index + 1;
                this.renderSpaceship(container, player, position, playersToRender.length);
            });
            
            // Animate spaceships into position
            setTimeout(() => {
                this.animateSpaceships(container);
            }, 100);
            
            return true;
            
        } catch (error) {
            console.error('Error rendering spaceships:', error);
            this.renderErrorState(container, {
                type: 'render_error',
                message: 'Failed to render spaceship display',
                recoverable: true
            }, containerId);
            return false;
        }
    }
    
    // Validate and sanitize player data for safe rendering
    validateAndSanitizePlayers(playerData) {
        if (!Array.isArray(playerData)) {
            console.warn('Player data is not an array:', typeof playerData);
            return [];
        }
        
        return playerData
            .filter(player => {
                // Basic validation
                if (!player || typeof player !== 'object') {
                    console.warn('Invalid player object:', player);
                    return false;
                }
                
                // Check required fields (including leaderboard aggregate API format)
                const hasValidId = player._id || player.player || player.playerId || player.id || 
                                  player.userId || player.user_id || player.principalId || player.principal_id;
                const hasValidScore = typeof (player.total || player.score || player.points || player.value || 
                                            player.totalScore || player.total_score || 
                                            player.currentScore || player.current_score) === 'number';
                
                if (!hasValidId || !hasValidScore) {
                    console.warn('Player missing required fields:', player);
                    console.log('Available fields:', Object.keys(player));
                    return false;
                }
                
                return true;
            })
            .map(player => {
                // Sanitize player data using flexible field extraction (including leaderboard aggregate format)
                const playerId = player._id || player.player || player.playerId || player.id || 
                               player.userId || player.user_id || player.principalId || player.principal_id;
                const score = player.total || player.score || player.points || player.value || 
                            player.totalScore || player.total_score || 
                            player.currentScore || player.current_score || 0;
                const name = player.name || player.playerName || player.username || 
                           player.displayName || player.user_name || 
                           player.principalName || player.principal_name ||
                           player.title || player.label || player.player || playerId || 'Player';
                
                return {
                    playerId: this.sanitizePlayerId(playerId),
                    score: this.sanitizeScore(score),
                    name: this.sanitizeName(name),
                    position: player.position || 0
                };
            })
            .filter(player => {
                // Final validation after sanitization
                return player.playerId && 
                       typeof player.score === 'number' && 
                       player.score >= 0 &&
                       player.name;
            });
    }
    
    // Sanitization methods (similar to DataFetcher but for rendering context)
    sanitizePlayerId(playerId) {
        if (!playerId || typeof playerId !== 'string') {
            return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        const sanitized = playerId
            .replace(/[^\w\-_.]/g, '')
            .substring(0, 50);
            
        return sanitized || `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    sanitizeName(name) {
        if (!name || typeof name !== 'string') {
            return 'Unknown Player';
        }
        
        return name
            .replace(/[<>\"'&]/g, '')
            .replace(/[^\w\s\-_.]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 20)
            || 'Player';
    }
    
    sanitizeScore(score) {
        if (typeof score !== 'number' || !isFinite(score) || isNaN(score)) {
            return 0;
        }
        
        return Math.max(0, Math.min(score, Number.MAX_SAFE_INTEGER));
    }
    
    renderSpaceship(container, player, position, totalPlayers) {
        // Create spaceship element
        const spaceshipElement = document.createElement('div');
        spaceshipElement.className = `spaceship rank-${position <= 3 ? position : 'other'}`;
        spaceshipElement.setAttribute('data-position', position);
        spaceshipElement.setAttribute('data-score', player.score);
        spaceshipElement.setAttribute('data-player-id', player.playerId);
        
        // Calculate position
        const { x, y } = this.calculatePosition(position, totalPlayers, container);
        
        // Set initial position (off-screen for animation)
        spaceshipElement.style.left = x + 'px';
        spaceshipElement.style.top = (container.offsetHeight + 100) + 'px'; // Start below screen
        spaceshipElement.style.transform = 'scale(0.5) rotate(-10deg)';
        spaceshipElement.style.opacity = '0';
        
        // Create spaceship image
        // Get spaceship asset info (may be null for CSS fallback)
        const configId = this.getCurrentConfigId(); // We'll need to pass this from the render call
        console.log(`🎨 [RankingRenderer] Creating spaceship for position ${position}, player: ${player.name}`);
        console.log(`🎨 [RankingRenderer] Using configId: ${configId}`);
        
        const assetInfo = this.getSpaceshipAssetInfo(position, configId);
        console.log(`🎨 [RankingRenderer] Asset info received:`, assetInfo);
        
        let spaceshipImage;
        if (assetInfo.image) {
            // Use real image from API
            console.log(`🎨 [RankingRenderer] ✅ Creating IMG element with src: ${assetInfo.image}`);
            spaceshipImage = document.createElement('img');
            spaceshipImage.className = 'spaceship-image space-racer';
            spaceshipImage.src = assetInfo.image;
            spaceshipImage.alt = `${player.name} spaceship`;
            spaceshipImage.loading = 'lazy';
        } else {
            // Use lightweight CSS fallback
            console.log(`🎨 [RankingRenderer] 🔄 Creating CSS fallback spaceship`);
            spaceshipImage = this.createCSSSpaceship(assetInfo, position);
        }
        
        // Only add error handling for actual images, not CSS spaceships
        if (assetInfo.image && spaceshipImage.tagName === 'IMG') {
            const handleImageError = () => {
                console.warn(`Failed to load spaceship image: ${assetInfo.image}`);
                
                // Replace with CSS fallback
                const cssSpaceship = this.createCSSSpaceship(assetInfo, position);
                spaceshipImage.parentNode.replaceChild(cssSpaceship, spaceshipImage);
                spaceshipImage = cssSpaceship; // Update reference
            };
            
            spaceshipImage.onerror = handleImageError;
        }
        
        // Create player info
        const playerInfo = document.createElement('div');
        playerInfo.className = 'player-info';
        
        const playerName = document.createElement('div');
        playerName.className = 'player-name';
        playerName.textContent = player.name || `Player ${player.playerId}`;
        
        const playerScore = document.createElement('div');
        playerScore.className = 'player-score';
        playerScore.textContent = this.formatScore(player.score);
        
        // Assemble elements
        playerInfo.appendChild(playerName);
        playerInfo.appendChild(playerScore);
        spaceshipElement.appendChild(spaceshipImage);
        spaceshipElement.appendChild(playerInfo);
        
        // Add to container
        container.appendChild(spaceshipElement);
        
        // Store final position for animation
        spaceshipElement.setAttribute('data-final-y', y);
        
        // Mark for cleanup after animation completes (Smart TV memory optimization)
        setTimeout(() => {
            spaceshipElement.setAttribute('data-cleanup', 'true');
        }, this.perfRecommendations.animationDuration + 5000); // 5 seconds after animation
    }
    
    calculatePosition(position, totalPlayers, container) {
        // Get container dimensions, fallback to style dimensions if offsetWidth/Height are 0
        let containerWidth = container.offsetWidth;
        let containerHeight = container.offsetHeight;
        
        // Fallback for test environments where offsetWidth might be 0
        if (containerWidth === 0 && container.style.width) {
            containerWidth = parseInt(container.style.width) || 800;
        }
        if (containerHeight === 0 && container.style.height) {
            containerHeight = parseInt(container.style.height) || 600;
        }
        
        // Default fallback dimensions
        containerWidth = containerWidth || 800;
        containerHeight = containerHeight || 600;
        
        // SPACE RACE POSITIONING: X-axis determines position (1st place = rightmost)
        // Dynamic margins based on spaceship sizes (larger for bigger ships)
        const baseMargin = 120;
        const spaceshipSize = position === 1 ? 190 : position === 2 ? 176 : position === 3 ? 170 : 160;
        const dynamicMargin = Math.max(baseMargin, spaceshipSize / 2 + 50);
        
        const raceWidth = containerWidth - (dynamicMargin * 2);
        
        // Position 1 (1st place) should be rightmost, higher positions move left
        // Invert the position calculation: lower position number = further right
        const normalizedPosition = (position - 1) / Math.max(totalPlayers - 1, 1);
        const x = dynamicMargin + raceWidth * (1 - normalizedPosition); // Invert: 1st place = rightmost
        
        // Y position: Add some randomness for "messy" space race feel, but keep it reasonable
        const centerY = containerHeight / 2;
        const yVariation = Math.min(60, containerHeight * 0.15); // Adaptive variation based on container height
        
        // Use position as seed for consistent but varied Y positions
        const yOffset = (Math.sin(position * 2.5) * yVariation) + (Math.cos(position * 1.7) * yVariation * 0.5);
        
        // Calculate safe Y bounds considering spaceship size and player info
        const playerInfoHeight = 80; // Approximate height of player info card
        const safeTopMargin = Math.max(80, spaceshipSize / 2 + 20);
        const safeBottomMargin = Math.max(120, spaceshipSize / 2 + playerInfoHeight + 20);
        
        const y = Math.max(safeTopMargin, Math.min(containerHeight - safeBottomMargin, centerY + yOffset));
        
        // Ensure X position keeps spaceship fully visible
        const safeX = Math.max(spaceshipSize / 2 + 20, Math.min(x, containerWidth - spaceshipSize / 2 - 20));
        
        return { 
            x: safeX, 
            y: y 
        };
    }
    
    getSpaceshipAssetInfo(position, configId) {
        console.log(`🎨 [RankingRenderer] Getting spaceship asset for position ${position}, configId: ${configId}`);
        
        // Get the position key (first, second, third)
        const positionKey = position === 1 ? 'first' : position === 2 ? 'second' : 'third';
        console.log(`🎨 [RankingRenderer] Position key: ${positionKey}`);
        
        // Debug: Log the current spaceship assets structure
        console.log(`🎨 [RankingRenderer] Available spaceship assets:`, this.spaceshipAssets);
        console.log(`🎨 [RankingRenderer] Assets type:`, typeof this.spaceshipAssets);
        
        if (this.spaceshipAssets) {
            console.log(`🎨 [RankingRenderer] Asset keys:`, Object.keys(this.spaceshipAssets));
        }
        
        // Try to get from the specific ranking config
        if (this.spaceshipAssets && this.spaceshipAssets[configId] && this.spaceshipAssets[configId].ships) {
            console.log(`🎨 [RankingRenderer] Found config ${configId}, checking ships...`);
            console.log(`🎨 [RankingRenderer] Ships in ${configId}:`, Object.keys(this.spaceshipAssets[configId].ships));
            
            const ship = this.spaceshipAssets[configId].ships[positionKey];
            if (ship) {
                console.log(`🎨 [RankingRenderer] ✅ Found ship for ${positionKey} in ${configId}:`, ship);
                return ship;
            } else {
                console.log(`🎨 [RankingRenderer] ❌ No ship found for ${positionKey} in ${configId}`);
            }
        } else {
            console.log(`🎨 [RankingRenderer] ❌ Config ${configId} not found or has no ships`);
        }
        
        // Fallback to any available config
        if (this.spaceshipAssets && typeof this.spaceshipAssets === 'object') {
            console.log(`🎨 [RankingRenderer] Trying fallback to any available config...`);
            
            for (const [configKey, config] of Object.entries(this.spaceshipAssets)) {
                console.log(`🎨 [RankingRenderer] Checking fallback config: ${configKey}`);
                
                if (config.ships && config.ships[positionKey]) {
                    console.log(`🎨 [RankingRenderer] ✅ Found fallback ship in ${configKey}:`, config.ships[positionKey]);
                    return config.ships[positionKey];
                }
            }
            
            console.log(`🎨 [RankingRenderer] ❌ No fallback ships found for ${positionKey}`);
        }
        
        // Ultimate fallback
        const ultimateFallback = {
            image: null,
            position: positionKey,
            fallback: position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉',
            cssColor: position === 1 ? '#FFD700' : position === 2 ? '#C0C0C0' : '#CD7F32'
        };
        
        console.log(`🎨 [RankingRenderer] 🔄 Using ultimate fallback:`, ultimateFallback);
        return ultimateFallback;
    }
    
    getCurrentConfigId() {
        return this.currentConfigId || 'ranking_vendedores'; // Default fallback
    }
    
    createCSSSpaceship(assetInfo, position) {
        const cssSpaceship = document.createElement('div');
        cssSpaceship.className = 'css-spaceship spaceship-image space-racer';
        cssSpaceship.setAttribute('data-position', position);
        
        // Create lightweight CSS spaceship shape with space race styling
        const gradient = `linear-gradient(45deg, ${assetInfo.cssColor}, ${this.lightenColor(assetInfo.cssColor, 20)})`;
        
        cssSpaceship.style.cssText = `
            width: 60px; height: 60px; 
            background: ${gradient};
            border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
            position: relative; margin: 0 auto;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3), 0 0 15px rgba(74, 144, 226, 0.3);
            border: 2px solid rgba(255,255,255,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            transform: rotate(-15deg); /* Slight tilt for racing effect */
        `;
        
        // Add emoji as content
        cssSpaceship.textContent = assetInfo.fallback;
        
        return cssSpaceship;
    }
    
    lightenColor(color, percent) {
        // Simple color lightening function
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    animateSpaceships(container) {
        const spaceships = container.querySelectorAll('.spaceship');
        
        spaceships.forEach((spaceship, index) => {
            const finalY = parseInt(spaceship.getAttribute('data-final-y'));
            
            // Stagger animations with performance-based timing
            const animationDelay = this.perfRecommendations.animationDuration / 4; // Dynamic delay based on performance
            setTimeout(() => {
                spaceship.classList.add('entering');
                spaceship.style.top = finalY + 'px';
                spaceship.style.transform = 'scale(1) rotate(0deg)';
                spaceship.style.opacity = '1';
                spaceship.style.transition = `all ${this.perfRecommendations.animationDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
                
                // Add rank-specific animations after entry
                setTimeout(() => {
                    spaceship.classList.remove('entering');
                    spaceship.classList.add('moving');
                }, this.perfRecommendations.animationDuration);
                
            }, index * animationDelay);
        });
    }
    
    formatScore(score) {
        if (typeof score !== 'number') {
            return '0';
        }
        
        // Format large numbers with appropriate suffixes
        if (score >= 1000000) {
            return (score / 1000000).toFixed(1) + 'M';
        } else if (score >= 1000) {
            return (score / 1000).toFixed(1) + 'K';
        } else {
            return score.toString();
        }
    }
    
    renderEmptyState(container, reason = 'no_data') {
        const stateConfigs = {
            no_data: {
                icon: '🚀',
                title: 'No Data Available',
                message: 'Leaderboard data will appear here when available',
                color: 'rgba(255, 255, 255, 0.8)'
            },
            loading: {
                icon: '⏳',
                title: 'Loading...',
                message: 'Fetching leaderboard data',
                color: 'rgba(255, 255, 255, 0.9)'
            },
            error: {
                icon: '⚠️',
                title: 'Unable to Load Data',
                message: 'The leaderboard will be updated on the next cycle',
                color: '#ff6b6b'
            },
            network_error: {
                icon: '📡',
                title: 'Connection Issue',
                message: 'Please check your internet connection',
                color: '#ffa726'
            },
            timeout: {
                icon: '⏰',
                title: 'Request Timed Out',
                message: 'The server is taking too long to respond',
                color: '#ffa726'
            }
        };
        
        const config = stateConfigs[reason] || stateConfigs.no_data;
        
        container.innerHTML = `
            <div class="empty-state" style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column; animation: fadeIn 0.5s ease-in;">
                <div style="font-size: 3rem; margin-bottom: 20px; animation: pulse 2s infinite;">${config.icon}</div>
                <h2 style="color: ${config.color}; margin-bottom: 10px; text-align: center;">${config.title}</h2>
                <p style="color: rgba(255, 255, 255, 0.6); text-align: center; max-width: 400px;">${config.message}</p>
                ${reason === 'loading' ? '<div class="loading-spinner" style="margin-top: 20px; width: 30px; height: 30px; border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid #fff; border-radius: 50%; animation: spin 1s linear infinite;"></div>' : ''}
            </div>
        `;
        
        // Add CSS animations if not already present
        this.ensureAnimationStyles();
    }
    
    // Enhanced error state rendering with recovery options
    renderErrorState(container, errorInfo, leaderboardId) {
        const errorTypeMessages = {
            timeout: 'The request timed out. The system will retry automatically.',
            network: 'Network connection issue detected. Retrying...',
            server_error: 'Server is experiencing issues. Will retry shortly.',
            not_found: 'This leaderboard was not found on the server.',
            auth: 'Authentication required to access this leaderboard.',
            rate_limit: 'Too many requests. Please wait before retrying.',
            parse_error: 'Received invalid data format. Retrying...',
            unknown: 'An unexpected error occurred. Retrying...'
        };
        
        const message = errorTypeMessages[errorInfo.type] || errorTypeMessages.unknown;
        const isRecoverable = errorInfo.recoverable;
        
        container.innerHTML = `
            <div class="error-state" style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column; animation: fadeIn 0.5s ease-in;">
                <div style="font-size: 3rem; margin-bottom: 20px; color: #ff6b6b;">⚠️</div>
                <h2 style="color: #ff6b6b; margin-bottom: 15px; text-align: center;">Unable to Load Leaderboard</h2>
                <p style="color: rgba(255, 255, 255, 0.8); text-align: center; max-width: 500px; margin-bottom: 10px;">${message}</p>
                <p style="color: rgba(255, 255, 255, 0.5); font-size: 0.9rem; text-align: center;">Leaderboard: ${leaderboardId}</p>
                ${isRecoverable ? `
                    <div style="margin-top: 20px; color: rgba(255, 255, 255, 0.6); font-size: 0.8rem;">
                        ${errorInfo.retryAfter ? `Retrying in ${Math.ceil(errorInfo.retryAfter / 1000)} seconds...` : 'Retrying automatically...'}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // Ensure animation styles are available
    ensureAnimationStyles() {
        if (document.getElementById('ranking-animations')) {
            return; // Already added
        }
        
        const style = document.createElement('style');
        style.id = 'ranking-animations';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .loading-spinner {
                display: inline-block;
            }
            
            .error-state, .empty-state {
                user-select: none;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // Utility method to assign spaceship colors based on position
    assignSpaceshipColors(position) {
        return this.colorMap[position] || 'red';
    }
    
    // Method to update existing ranking (for real-time updates)
    updateRanking(containerId, newPlayerData) {
        console.log(`Updating ranking in container: ${containerId}`);
        
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container not found: ${containerId}`);
            return;
        }
        
        const existingSpaceships = container.querySelectorAll('.spaceship');
        
        // If no existing spaceships, do a full render
        if (existingSpaceships.length === 0) {
            this.renderRanking(newPlayerData, containerId);
            return;
        }
        
        // Update existing spaceships with new positions
        const sortedPlayers = [...newPlayerData].sort((a, b) => b.score - a.score);
        
        existingSpaceships.forEach((spaceship, index) => {
            if (index < sortedPlayers.length) {
                const player = sortedPlayers[index];
                const position = index + 1;
                
                // Update player info
                const nameElement = spaceship.querySelector('.player-name');
                const scoreElement = spaceship.querySelector('.player-score');
                
                if (nameElement) nameElement.textContent = player.name || `Player ${player.playerId}`;
                if (scoreElement) scoreElement.textContent = this.formatScore(player.score);
                
                // Update position and styling
                const oldPosition = parseInt(spaceship.getAttribute('data-position'));
                spaceship.className = `spaceship rank-${position <= 3 ? position : 'other'} moving`;
                
                // Add position-changing animation if position changed
                if (oldPosition !== position) {
                    spaceship.classList.add('position-changing');
                    setTimeout(() => spaceship.classList.remove('position-changing'), 300);
                }
                
                spaceship.setAttribute('data-position', position);
                spaceship.setAttribute('data-score', player.score);
                
                // Calculate and animate to new position
                const { x, y } = this.calculatePosition(position, sortedPlayers.length, container);
                spaceship.style.left = x + 'px';
                spaceship.style.top = y + 'px';
                
                // Update spaceship image if needed
                const imageElement = spaceship.querySelector('.spaceship-image');
                const newAsset = this.getSpaceshipAsset(position);
                if (imageElement && imageElement.src !== newAsset) {
                    imageElement.src = newAsset;
                }
            } else {
                // Remove extra spaceships
                spaceship.style.opacity = '0';
                setTimeout(() => spaceship.remove(), 500);
            }
        });
        
        // Add new spaceships if needed
        if (sortedPlayers.length > existingSpaceships.length) {
            for (let i = existingSpaceships.length; i < sortedPlayers.length; i++) {
                this.renderSpaceship(container, sortedPlayers[i], i + 1, sortedPlayers.length);
            }
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RankingRenderer;
}