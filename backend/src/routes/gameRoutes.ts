import { Router } from 'express';
import { GameController } from '../controllers/GameController';
import { beaconMiddleware } from '../middleware/beaconMiddleware';

const router = Router();
const gameController = new GameController();

// GET /api/games/active - Get all active games
router.get('/active', gameController.getActiveGames);

// POST /api/games - Create new game
router.post('/', gameController.createGame);

// GET /api/games/:id - Get game by ID
router.get('/:id', gameController.getGame);

// GET /api/games/:id/state - Get game state
router.get('/:id/state', gameController.getGameState);

// PUT /api/games/:id - Update game
router.put('/:id', gameController.updateGame);

// DELETE /api/games/:id - Delete game
router.delete('/:id', gameController.deleteGame);

// POST /api/games/:id/select-question - Select specific question
router.post('/:id/select-question', gameController.selectQuestion);

// POST /api/games/:id/random-question - Select random question
router.post('/:id/random-question', gameController.selectRandomQuestion);

// POST /api/games/:id/timer - Control timer
router.post('/:id/timer', gameController.controlTimer);

// POST /api/games/:id/score - Update score
router.post('/:id/score', gameController.updateScore);

// POST /api/games/:id/log - Add game log entry
router.post('/:id/log', gameController.addGameLog);

// POST /api/games/:id/save-state - Save game state
router.post('/:id/save-state', beaconMiddleware, gameController.saveGameState);

// POST /api/games/:id/reset - Reset game
router.post('/:id/reset', gameController.resetGame);

// POST /api/games/:id/shuffle - Shuffle questions
router.post('/:id/shuffle', gameController.shuffleQuestions);

export default router;