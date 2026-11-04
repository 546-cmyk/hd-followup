import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  userContext: {
    userId: string;
    role: 'parent' | 'doctor';
  };
}

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('未登录');
    }

    const token = authHeader.slice(7);
    try {
      const payload = this.jwtService.verify<{
        sub: string;
        role: 'parent' | 'doctor';
      }>(token);
      (req as AuthenticatedRequest).userContext = {
        userId: payload.sub,
        role: payload.role,
      };
      next();
    } catch {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }
  }
}
