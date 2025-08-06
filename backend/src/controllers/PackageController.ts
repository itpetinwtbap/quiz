import { Request, Response } from 'express';
import { PackageService } from '../services/PackageService';

export class PackageController {
  private packageService: PackageService;

  constructor() {
    this.packageService = new PackageService();
  }

  public getPackages = async (req: Request, res: Response): Promise<void> => {
    try {
      const packages = await this.packageService.getPackages();
      res.json({ success: true, data: packages });
    } catch (error) {
      console.error('Error getting packages:', error);
      res.status(500).json({ success: false, error: 'Failed to get packages' });
    }
  };

  public getPackageById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const pkg = await this.packageService.getPackageById(id);
      
      if (!pkg) {
        res.status(404).json({ success: false, error: 'Package not found' });
        return;
      }

      res.json({ success: true, data: pkg });
    } catch (error) {
      console.error('Error getting package by ID:', error);
      res.status(500).json({ success: false, error: 'Failed to get package' });
    }
  };

  public createPackage = async (req: Request, res: Response): Promise<void> => {
    try {
      const packageData = req.body;
      const pkg = await this.packageService.createPackage(packageData);
      res.status(201).json({ success: true, data: pkg });
    } catch (error) {
      console.error('Error creating package:', error);
      res.status(500).json({ success: false, error: 'Failed to create package' });
    }
  };

  public updatePackage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const pkg = await this.packageService.updatePackage(id, updateData);
      
      if (!pkg) {
        res.status(404).json({ success: false, error: 'Package not found' });
        return;
      }

      res.json({ success: true, data: pkg });
    } catch (error) {
      console.error('Error updating package:', error);
      res.status(500).json({ success: false, error: 'Failed to update package' });
    }
  };

  public deletePackage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const success = await this.packageService.deletePackage(id);
      
      if (!success) {
        res.status(404).json({ success: false, error: 'Package not found' });
        return;
      }

      res.json({ success: true, message: 'Package deleted successfully' });
    } catch (error) {
      console.error('Error deleting package:', error);
      res.status(500).json({ success: false, error: 'Failed to delete package' });
    }
  };

  public importPackage = async (req: Request, res: Response): Promise<void> => {
    try {
      const packageData = req.body;
      const pkg = await this.packageService.importSIGamePackage(packageData);
      res.status(201).json({ 
        success: true, 
        data: pkg,
        message: 'Package imported successfully'
      });
    } catch (error) {
      console.error('Error importing package:', error);
      res.status(500).json({ success: false, error: 'Failed to import package' });
    }
  };

  public getPackageWithQuestions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const pkg = await this.packageService.getPackageWithQuestions(id);
      
      if (!pkg) {
        res.status(404).json({ success: false, error: 'Package not found' });
        return;
      }

      res.json({ success: true, data: pkg });
    } catch (error) {
      console.error('Error getting package with questions:', error);
      res.status(500).json({ success: false, error: 'Failed to get package with questions' });
    }
  };
}