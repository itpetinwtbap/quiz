import { Router } from 'express';
import { QuestionController } from '../controllers/QuestionController';

const router = Router();
const questionController = new QuestionController();

// GET /api/questions - Get all questions (with optional package filter)
router.get('/', questionController.getQuestions);

// GET /api/questions/:id - Get question by ID
router.get('/:id', questionController.getQuestionById);

// POST /api/questions - Create new question
router.post('/', questionController.createQuestion);

// PUT /api/questions/:id - Update question
router.put('/:id', questionController.updateQuestion);

// DELETE /api/questions/:id - Delete question
router.delete('/:id', questionController.deleteQuestion);

// GET /api/questions/random - Get random question
router.get('/random/select', questionController.getRandomQuestion);

export default router;