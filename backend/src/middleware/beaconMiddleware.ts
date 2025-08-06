import { Request, Response, NextFunction } from 'express';

export const beaconMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check if this is a sendBeacon request
  if (req.headers['content-type'] === 'text/plain;charset=UTF-8') {
    // Convert sendBeacon data to JSON
    try {
      const body = req.body as string;
      if (typeof body === 'string') {
        req.body = JSON.parse(body);
        req.headers['content-type'] = 'application/json';
      }
    } catch (error) {
      console.warn('Failed to parse sendBeacon data:', error);
    }
  }
  
  next();
}; 