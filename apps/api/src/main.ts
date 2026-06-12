import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './modules/app.module';

type RateEntry = { count: number; resetAt: number };
const rateBuckets = new Map<string, RateEntry>();

function rateLimit(request: any, response: any, next: () => void) {
  const path = String(request.path || request.url || '');
  if (path === '/health' || path === '/ready' || path === '/api/health' || path === '/api/ready') return next();

  const sensitive = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/password-reset',
    '/api/auth/email-verification',
    '/api/contact',
    '/api/subscription-requests',
  ].some((prefix) => path.startsWith(prefix));

  const windowMs = sensitive ? 15 * 60 * 1000 : 60 * 1000;
  const limit = sensitive ? 20 : 240;
  const now = Date.now();
  if (rateBuckets.size > 5000) {
    for (const [bucketKey, bucket] of rateBuckets.entries()) {
      if (bucket.resetAt <= now) rateBuckets.delete(bucketKey);
    }
  }
  const ip = request.ip || request.headers?.['x-forwarded-for'] || request.socket?.remoteAddress || 'unknown';
  const key = `${ip}:${sensitive ? path.split('/').slice(0, 4).join('/') : 'api'}`;
  const current = rateBuckets.get(key);

  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }

  current.count += 1;
  if (current.count > limit) {
    response.status(429).json({ message: 'Too many requests. Please wait a moment and try again.' });
    return;
  }

  next();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.use(helmet());
  app.use(rateLimit);
  app.enableCors({
    origin: [config.get<string>('WEB_ORIGIN') || 'http://localhost:3000'],
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = config.get<number>('PORT') || 4000;
  await app.listen(port, '0.0.0.0');
}

bootstrap();
