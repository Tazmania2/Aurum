// Data Fetcher - Handles Funifier API calls with error handling

class DataFetcher {
    constructor() {
        this.baseUrl = 'https://service2.funifier.com/v3/leaderboard';
        this.timeout = 10000; // 10 second timeout
        this.maxRetries = 3;
        this.callHistory = []; // Track API calls for testing
    }
    
    async fetchLeaderboard(leaderboardId) {
        console.log(`Fetching leaderboard data for: ${leaderboardId}`);
        
        // Record the API call for testing purposes
        this.callHistory.push({
            leaderboardId: leaderboardId,
            timestamp: Date.now(),
            url: `${this.baseUrl}/${leaderboardId}/leader/aggregate?period=&live=true`
        });
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const data = await this.makeApiCall(leaderboardId);
                console.log(`Successfully fetched data for ${leaderboardId} on attempt ${attempt}`);
                return this.processPlayerData(data);
                
            } catch (error) {
                console.warn(`Attempt ${attempt} failed for ${leaderboardId}:`, error.message);
                
                if (attempt === this.maxRetries) {
                    console.error(`All ${this.maxRetries} attempts failed for ${leaderboardId}`);
                    throw new Error(`Failed to fetch leaderboard after ${this.maxRetries} attempts: ${error.message}`);
                }
                
                // Wait before retry (exponential backoff)
                await this.delay(1000 * attempt);
            }
        }
    }
    
    async makeApiCall(leaderboardId) {
        const url = `${this.baseUrl}/${leaderboardId}/leader/aggregate?period=&live=true`;
        
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic NjkwMjdhZjZlMTc5ZDQ2ZmNlMjgzZTdlOjY5MDI4MjI0ZTE3OWQ0NmZjZTI4NDI2ZA=='
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error(`Request timeout after ${this.timeout}ms`);
            }
            
            throw error;
        }
    }
    
    processPlayerData(apiResponse) {
        try {
            // Handle leaderboard aggregate API response format
            let players = [];
            
            if (Array.isArray(apiResponse)) {
                // Direct array response from leaderboard aggregate API
                players = apiResponse;
                console.log('Using direct array from leaderboard aggregate API');
                console.log('Sample player data:', players[0]);
            } else if (apiResponse.data && Array.isArray(apiResponse.data)) {
                players = apiResponse.data;
            } else if (apiResponse.players && Array.isArray(apiResponse.players)) {
                players = apiResponse.players;
            } else if (apiResponse.leaderboard && Array.isArray(apiResponse.leaderboard)) {
                players = apiResponse.leaderboard;
            } else if (apiResponse.principals && Array.isArray(apiResponse.principals)) {
                // Handle old Funifier API format with principals array
                players = apiResponse.principals;
                console.log('Using principals array from old Funifier API response');
            } else {
                console.warn('Unexpected API response format:', apiResponse);
                console.log('Available keys:', Object.keys(apiResponse));
                return [];
            }
            
            // Process and validate player data
            const processedPlayers = players
                .filter(player => this.isValidPlayer(player))
                .map(player => ({
                    playerId: this.extractPlayerId(player),
                    score: this.extractScore(player),
                    name: this.extractPlayerName(player)
                }))
                .sort((a, b) => b.score - a.score) // Sort by score descending
                .slice(0, 10) // Limit to top 10 players
                .map((player, index) => ({
                    ...player,
                    position: index + 1 // Assign positions after sorting
                }));
            
            console.log(`Processed ${processedPlayers.length} players from API response`);
            return processedPlayers;
            
        } catch (error) {
            console.error('Error processing player data:', error);
            return [];
        }
    }
    
    isValidPlayer(player) {
        if (!player || typeof player !== 'object') {
            return false;
        }
        
        // Check for required fields (including leaderboard aggregate API format)
        const hasId = player._id || player.player || player.playerId || player.id || 
                     player.userId || player.user_id || player.principalId || player.principal_id;
        const hasScore = typeof (player.total || player.score || player.points || player.value || 
                               player.totalScore || player.total_score || 
                               player.currentScore || player.current_score) === 'number';
        
        return hasId && hasScore;
    }
    
    extractPlayerId(player) {
        // Handle leaderboard aggregate API format and other formats
        const rawId = player._id || player.player || player.playerId || player.id || 
                     player.userId || player.user_id || player.principalId || player.principal_id;
        return this.sanitizePlayerId(rawId);
    }
    
    extractScore(player) {
        // Handle leaderboard aggregate API format and other formats
        const rawScore = player.total || player.score || player.points || player.value || 
                        player.totalScore || player.total_score || 
                        player.currentScore || player.current_score || 0;
        return this.sanitizeScore(rawScore);
    }
    
    extractPlayerName(player) {
        // Handle leaderboard aggregate API format and other formats
        const name = player.name || player.playerName || player.username || 
                    player.displayName || player.user_name || 
                    player.principalName || player.principal_name ||
                    player.title || player.label ||
                    player.player || player.playerId || player.id || 'Player';
        
        return this.sanitizeName(name);
    }
    
    sanitizeName(name) {
        if (!name || typeof name !== 'string') {
            return 'Unknown Player';
        }
        
        // Enhanced sanitization for comprehensive security
        return name
            .replace(/[<>\"'&]/g, '') // Remove HTML/script characters
            .replace(/[^\w\s\-_.]/g, '') // Remove special characters except basic ones
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim()
            .substring(0, 20) // Limit to 20 characters
            || 'Player'; // Fallback if name becomes empty after sanitization
    }
    
    // Enhanced input sanitization for scores
    sanitizeScore(score) {
        if (score === null || score === undefined) {
            return 0;
        }
        
        // Handle different input types
        if (typeof score === 'number') {
            // Check for invalid numbers
            if (!isFinite(score) || isNaN(score)) {
                return 0;
            }
            // Clamp to reasonable range to prevent display issues
            return Math.max(0, Math.min(score, Number.MAX_SAFE_INTEGER));
        }
        
        if (typeof score === 'string') {
            // Remove non-numeric characters except decimal point and minus
            const cleanScore = score.replace(/[^\d.-]/g, '');
            const parsed = parseFloat(cleanScore);
            
            if (isNaN(parsed) || !isFinite(parsed)) {
                return 0;
            }
            
            return Math.max(0, Math.min(parsed, Number.MAX_SAFE_INTEGER));
        }
        
        // Fallback for other types
        return 0;
    }
    
    // Enhanced player ID sanitization
    sanitizePlayerId(playerId) {
        if (!playerId) {
            return `player_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        }
        
        // Convert to string and sanitize
        const sanitized = String(playerId)
            .replace(/[^\w\-_.]/g, '') // Keep only alphanumeric, dash, underscore, dot
            .substring(0, 50); // Reasonable length limit
            
        return sanitized || `player_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Enhanced error handling helper with comprehensive edge cases
    handleApiError(error) {
        console.error('API Error:', error);
        
        // Network and connectivity errors
        if (error.message.includes('timeout') || error.message.includes('Request timeout')) {
            return {
                type: 'timeout',
                message: 'Request timed out. Please check your connection.',
                recoverable: true,
                retryAfter: 5000
            };
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            return {
                type: 'network',
                message: 'Network error. Please check your connection.',
                recoverable: true,
                retryAfter: 3000
            };
        } else if (error.message.includes('ERR_INTERNET_DISCONNECTED') || error.message.includes('offline')) {
            return {
                type: 'offline',
                message: 'No internet connection detected.',
                recoverable: true,
                retryAfter: 10000
            };
        }
        
        // HTTP status errors
        else if (error.message.includes('404')) {
            return {
                type: 'not_found',
                message: 'Leaderboard not found.',
                recoverable: false,
                retryAfter: null
            };
        } else if (error.message.includes('401') || error.message.includes('403')) {
            return {
                type: 'auth',
                message: 'Authentication required or access denied.',
                recoverable: false,
                retryAfter: null
            };
        } else if (error.message.includes('429')) {
            return {
                type: 'rate_limit',
                message: 'Too many requests. Please wait.',
                recoverable: true,
                retryAfter: 30000
            };
        } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
            return {
                type: 'server_error',
                message: 'Server error. Please try again later.',
                recoverable: true,
                retryAfter: 15000
            };
        }
        
        // Data parsing errors
        else if (error.message.includes('JSON') || error.message.includes('parse')) {
            return {
                type: 'parse_error',
                message: 'Invalid data format received.',
                recoverable: true,
                retryAfter: 5000
            };
        }
        
        // Generic fallback
        else {
            return {
                type: 'unknown',
                message: 'An unexpected error occurred.',
                recoverable: true,
                retryAfter: 5000
            };
        }
    }
    
    // Enhanced error recovery with fallback data
    async fetchLeaderboardWithFallback(leaderboardId, fallbackData = null) {
        try {
            return await this.fetchLeaderboard(leaderboardId);
        } catch (error) {
            const errorInfo = this.handleApiError(error);
            console.warn(`API call failed for ${leaderboardId}, using fallback strategy:`, errorInfo);
            
            // Return fallback data if provided
            if (fallbackData && Array.isArray(fallbackData)) {
                console.log('Using provided fallback data');
                return this.processPlayerData(fallbackData);
            }
            
            // Generate minimal placeholder data to maintain UI consistency
            return this.generatePlaceholderData(leaderboardId);
        }
    }
    
    // Generate placeholder data when API fails
    generatePlaceholderData(leaderboardId) {
        console.log(`Generating placeholder data for ${leaderboardId}`);
        
        const placeholderPlayers = [
            { playerId: 'placeholder_1', score: 100, name: 'Loading...', position: 1 },
            { playerId: 'placeholder_2', score: 90, name: 'Loading...', position: 2 },
            { playerId: 'placeholder_3', score: 80, name: 'Loading...', position: 3 }
        ];
        
        return placeholderPlayers;
    }
    
    // Enhanced connection testing with detailed diagnostics
    async testConnection() {
        const testResults = {
            success: false,
            latency: null,
            error: null,
            timestamp: new Date().toISOString()
        };
        
        try {
            console.log('Testing API connection...');
            const startTime = Date.now();
            
            // Use a lightweight test endpoint or minimal leaderboard
            const testData = await this.fetchLeaderboard('test');
            
            testResults.latency = Date.now() - startTime;
            testResults.success = true;
            
            console.log('API connection test successful:', {
                latency: testResults.latency + 'ms',
                dataReceived: testData.length + ' players'
            });
            
            return testResults;
            
        } catch (error) {
            testResults.error = this.handleApiError(error);
            console.error('API connection test failed:', testResults.error);
            return testResults;
        }
    }
    
    // Network status monitoring
    async checkNetworkStatus() {
        if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
            const isOnline = navigator.onLine;
            console.log(`Network status: ${isOnline ? 'online' : 'offline'}`);
            return isOnline;
        }
        
        // Fallback: try a simple network request
        try {
            await fetch('https://httpbin.org/status/200', { 
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            return true;
        } catch {
            return false;
        }
    }
    
    // Batch fetch with error isolation
    async fetchMultipleLeaderboards(leaderboardIds) {
        const results = new Map();
        
        for (const leaderboardId of leaderboardIds) {
            try {
                const data = await this.fetchLeaderboard(leaderboardId);
                results.set(leaderboardId, { success: true, data });
            } catch (error) {
                const errorInfo = this.handleApiError(error);
                results.set(leaderboardId, { 
                    success: false, 
                    error: errorInfo,
                    fallbackData: this.generatePlaceholderData(leaderboardId)
                });
            }
        }
        
        return results;
    }
    
    // Fetch spaceship assets from Funifier database
    async fetchSpaceshipAssets() {
        console.log('Fetching spaceship assets from Funifier database...');
        
        const url = 'https://service2.funifier.com/v3/database/espacial__c';
        
        // Record the API call for testing purposes
        this.callHistory.push({
            type: 'spaceship-assets',
            timestamp: Date.now(),
            url: url
        });
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const data = await this.makeSpaceshipApiCall(url);
                console.log(`Successfully fetched spaceship assets on attempt ${attempt}`);
                return this.processSpaceshipData(data);
                
            } catch (error) {
                console.warn(`Spaceship assets fetch attempt ${attempt} failed:`, error.message);
                
                if (attempt === this.maxRetries) {
                    console.error(`All ${this.maxRetries} attempts failed for spaceship assets`);
                    // Return fallback assets instead of throwing
                    return this.getFallbackSpaceshipAssets();
                }
                
                // Wait before retry (exponential backoff)
                await this.delay(1000 * attempt);
            }
        }
    }
    
    async makeSpaceshipApiCall(url) {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic NjkwMjdhZjZlMTc5ZDQ2ZmNlMjgzZTdlOjY5MDI4MjI0ZTE3OWQ0NmZjZTI4NDI2ZA=='
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error(`Request timeout after ${this.timeout}ms`);
            }
            
            throw error;
        }
    }
    
    processSpaceshipData(data) {
        try {
            if (!Array.isArray(data)) {
                console.warn('Spaceship data is not an array, using fallback');
                return this.getFallbackSpaceshipAssets();
            }
            
            // Filter and process spaceship assets
            const spaceshipAssets = data
                .filter(item => item.type === 'car' && item.car && item.image)
                .map(item => ({
                    car: item.car,
                    image: item.image,
                    fallback: this.getEmojiForCar(item.car)
                }));
            
            // Ensure we have all required colors, add fallbacks if missing
            const requiredColors = ['gold', 'silver', 'bronze', 'red', 'yellow', 'green'];
            const existingColors = spaceshipAssets.map(asset => asset.car);
            
            requiredColors.forEach(color => {
                if (!existingColors.includes(color)) {
                    console.warn(`Missing ${color} spaceship, adding lightweight CSS fallback`);
                    spaceshipAssets.push({
                        car: color,
                        image: null, // No image - will use CSS fallback
                        fallback: this.getEmojiForCar(color),
                        cssColor: this.getCssColorForCar(color)
                    });
                }
            });
            
            console.log(`Processed ${spaceshipAssets.length} spaceship assets`);
            return spaceshipAssets;
            
        } catch (error) {
            console.error('Error processing spaceship data:', error);
            return this.getFallbackSpaceshipAssets();
        }
    }
    
    getFallbackSpaceshipAssets() {
        console.log('Using lightweight CSS fallback spaceship assets');
        return [
            { car: 'red', image: null, fallback: '🚀', cssColor: '#FF0000' },
            { car: 'gold', image: null, fallback: '🥇', cssColor: '#FFD700' },
            { car: 'silver', image: null, fallback: '🥈', cssColor: '#C0C0C0' },
            { car: 'bronze', image: null, fallback: '🥉', cssColor: '#CD7F32' },
            { car: 'yellow', image: null, fallback: '⭐', cssColor: '#FFFF00' },
            { car: 'green', image: null, fallback: '🌟', cssColor: '#00FF00' }
        ];
    }
    
    getEmojiForCar(carColor) {
        const emojiMap = {
            'gold': '🥇',
            'silver': '🥈', 
            'bronze': '🥉',
            'red': '🚀',
            'yellow': '⭐',
            'green': '🌟'
        };
        return emojiMap[carColor] || '🚀';
    }
    
    getCssColorForCar(carColor) {
        const colorMap = {
            'gold': '#FFD700',
            'silver': '#C0C0C0',
            'bronze': '#CD7F32',
            'red': '#FF0000',
            'yellow': '#FFFF00',
            'green': '#00FF00'
        };
        return colorMap[carColor] || '#4A90E2';
    }

    // Call history methods for testing
    clearCallHistory() {
        this.callHistory = [];
    }
    
    getCallHistory() {
        return [...this.callHistory]; // Return a copy to prevent external modification
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataFetcher;
}