import type { Request, Response, NextFunction } from 'express';
import { join } from 'path';

const CLIENT_DIST = join(process.cwd(), 'dist/client');
const INDEX_HTML = join(CLIENT_DIST, 'index.html');

export function spaFallbackMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.path.startsWith('/api/') || req.path.startsWith('/assets/')) {
    next();
    return;
  }
  if (req.method !== 'GET') {
    next();
    return;
  }
  if (req.path.includes('.')) {
    next();
    return;
  }
  res.sendFile(INDEX_HTML, (err) => {
    if (err) next();
  });
}
