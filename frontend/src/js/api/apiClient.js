/**
 * API Client for communication with backend
 */
class ApiClient {
    constructor(baseUrl = 'http://localhost:5000/api') {
        this.baseUrl = baseUrl;
    }

    async request(url, options = {}) {
        const fullUrl = `${this.baseUrl}${url}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(fullUrl, config);
            
            // Handle non-JSON responses (like sendBeacon)
            if (!response.headers.get('content-type')?.includes('application/json')) {
                if (response.ok) {
                    return { success: true };
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Package endpoints
    async getPackages() {
        return this.request('/packages');
    }

    async getPackageById(id) {
        return this.request(`/packages/${id}`);
    }

    async getPackageWithQuestions(id) {
        return this.request(`/packages/${id}/with-questions`);
    }

    async createPackage(packageData) {
        return this.request('/packages', {
            method: 'POST',
            body: JSON.stringify(packageData)
        });
    }

    async updatePackage(id, packageData) {
        return this.request(`/packages/${id}`, {
            method: 'PUT',
            body: JSON.stringify(packageData)
        });
    }

    async deletePackage(id) {
        return this.request(`/packages/${id}`, {
            method: 'DELETE'
        });
    }

    async importPackage(siGameData) {
        return this.request('/packages/import', {
            method: 'POST',
            body: JSON.stringify(siGameData)
        });
    }

    // Question endpoints
    async getQuestions(packageId = null) {
        const params = packageId ? `?packageId=${packageId}` : '';
        return this.request(`/questions${params}`);
    }

    async getQuestionById(id) {
        return this.request(`/questions/${id}`);
    }

    async createQuestion(questionData) {
        return this.request('/questions', {
            method: 'POST',
            body: JSON.stringify(questionData)
        });
    }

    async updateQuestion(id, questionData) {
        return this.request(`/questions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(questionData)
        });
    }

    async deleteQuestion(id) {
        return this.request(`/questions/${id}`, {
            method: 'DELETE'
        });
    }

    async getRandomQuestion(packageId = null, excludeIds = []) {
        const params = new URLSearchParams();
        if (packageId) params.append('packageId', packageId);
        if (excludeIds.length > 0) params.append('excludeIds', excludeIds.join(','));
        
        return this.request(`/questions/random/select?${params.toString()}`);
    }

    // Game endpoints
    async createGame(gameData) {
        return this.request('/games', {
            method: 'POST',
            body: JSON.stringify(gameData)
        });
    }

    async getGame(id) {
        return this.request(`/games/${id}`);
    }

    async getGameState(id) {
        return this.request(`/games/${id}/state`);
    }

    async updateGame(id, gameData) {
        return this.request(`/games/${id}`, {
            method: 'PUT',
            body: JSON.stringify(gameData)
        });
    }

    async deleteGame(id) {
        return this.request(`/games/${id}`, {
            method: 'DELETE'
        });
    }

    async selectQuestion(gameId, questionNumber) {
        return this.request(`/games/${gameId}/select-question`, {
            method: 'POST',
            body: JSON.stringify({ questionNumber })
        });
    }

    async selectRandomQuestion(gameId) {
        return this.request(`/games/${gameId}/random-question`, {
            method: 'POST'
        });
    }

    async controlTimer(gameId, action, time = null) {
        return this.request(`/games/${gameId}/timer`, {
            method: 'POST',
            body: JSON.stringify({ action, time })
        });
    }

    async updateScore(gameId, team, score) {
        return this.request(`/games/${gameId}/score`, {
            method: 'POST',
            body: JSON.stringify({ team, score })
        });
    }

    async addGameLog(gameId, message, details = null) {
        return this.request(`/games/${gameId}/log`, {
            method: 'POST',
            body: JSON.stringify({ message, details })
        });
    }

    async saveGameState(gameId, stateData) {
        return this.request(`/games/${gameId}/save-state`, {
            method: 'POST',
            body: JSON.stringify(stateData)
        });
    }

    async resetGame(gameId) {
        return this.request(`/games/${gameId}/reset`, {
            method: 'POST'
        });
    }

    async shuffleQuestions(gameId) {
        return this.request(`/games/${gameId}/shuffle`, {
            method: 'POST'
        });
    }

    async getActiveGames() {
        return this.request('/games/active');
    }
}

export default ApiClient;