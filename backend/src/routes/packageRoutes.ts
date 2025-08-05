import { Router } from 'express';
import { PackageController } from '../controllers/PackageController';

const router = Router();
const packageController = new PackageController();

// GET /api/packages - Get all packages
router.get('/', packageController.getPackages);

// GET /api/packages/:id - Get package by ID
router.get('/:id', packageController.getPackageById);

// GET /api/packages/:id/with-questions - Get package with questions
router.get('/:id/with-questions', packageController.getPackageWithQuestions);

// POST /api/packages - Create new package
router.post('/', packageController.createPackage);

// PUT /api/packages/:id - Update package
router.put('/:id', packageController.updatePackage);

// DELETE /api/packages/:id - Delete package
router.delete('/:id', packageController.deletePackage);

// POST /api/packages/import - Import SIGame package
router.post('/import', packageController.importPackage);

export default router;