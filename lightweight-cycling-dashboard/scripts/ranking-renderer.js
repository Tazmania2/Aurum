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
    
    renderRanking(playerData, containerId, title, errorInfo = null) {
        console.log(`Rendering ranking in container: ${containerId}`);
        
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container not found: ${containerId}`);
            return false;
        }
        
        // Clear existing content
        container.innerHTML = '';
        
        // Handle error states
        if (errorInfo) {
            this.renderErrorState(container, errorInfo, containerId);
            return false;
        }
        
        // Handle empty or invalid data
        if (!playerData || !Array.isArray(playerData) || playerData.length === 0) {
            this.renderEmptyState(container, 'no_data');
            return false;
        }
        
        // Validate and sanitize player data
        const validatedPlayers = this.validateAndSanitizePlayers(playerData);
        if (validatedPlayers.length === 0) {
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
                
                // Check required fields
                const hasValidId = player.playerId && typeof player.playerId === 'string';
                const hasValidScore = typeof player.score === 'number' && isFinite(player.score);
                
                if (!hasValidId || !hasValidScore) {
                    console.warn('Player missing required fields:', player);
                    return false;
                }
                
                return true;
            })
            .map(player => {
                // Sanitize player data
                return {
                    playerId: this.sanitizePlayerId(player.playerId),
                    score: this.sanitizeScore(player.score),
                    name: this.sanitizeName(player.name || player.playerId),
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
        const assetInfo = this.getSpaceshipAssetInfo(position);
        
        let spaceshipImage;
        if (assetInfo.image) {
            // Use real image from API
            spaceshipImage = document.createElement('img');
            spaceshipImage.className = 'spaceship-image';
            spaceshipImage.src = assetInfo.image;
            spaceshipImage.alt = `${player.name} spaceship`;
            spaceshipImage.loading = 'lazy';
        } else {
            // Use lightweight CSS fallback
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
    
    getSpaceshipAssetInfo(position) {
        const colorKey = this.colorMap[position] || 'red';
        const asset = this.spaceshipAssets.find(asset => asset.car === colorKey);
        
        if (asset) {
            return asset;
        }
        
        // Ultimate fallback
        return {
            car: colorKey,
            image: null,
            fallback: '🚀',
            cssColor: '#4A90E2'
        };
    }
    
    createCSSSpaceship(assetInfo, position) {
        const cssSpaceship = document.createElement('div');
        cssSpaceship.className = 'css-spaceship spaceship-image';
        cssSpaceship.setAttribute('data-position', position);
        
        // Create lightweight CSS spaceship shape
        const gradient = `linear-gradient(45deg, ${assetInfo.cssColor}, ${this.lightenColor(assetInfo.cssColor, 20)})`;
        
        cssSpaceship.style.cssText = `
            width: 60px; height: 60px; 
            background: ${gradient};
            border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
            position: relative; margin: 0 auto;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            border: 2px solid rgba(255,255,255,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
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