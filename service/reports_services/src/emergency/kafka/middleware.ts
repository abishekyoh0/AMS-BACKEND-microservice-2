import { Injectable, NestMiddleware, UnauthorizedException, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) throw new UnauthorizedException('No authorization header provided');

    const token = authHeader.split(' ')[1]; 
    if (!token) throw new UnauthorizedException('Token missing');

    try {
      const result = await firstValueFrom(
        this.kafkaClient.send('auth.validate_token', { token })
      );

      if (!result || !result.user) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      (req as any).user = result.user;

      next();
    } catch (err:any) {
      throw new UnauthorizedException('Unauthorized: ' + err.message);
    }
  }
}