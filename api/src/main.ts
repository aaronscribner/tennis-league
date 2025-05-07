import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { INestApplication } from '@nestjs/common';

async function bootstrap(): Promise<INestApplication | undefined> {
  const app = await NestFactory.create(AppModule);

  // Enhanced CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:4200', // Angular dev server
      'http://localhost:3000', // Local development
      'https://tennis-league.vercel.app', // Production frontend
      /\.tennis-league\.com$/, // Any subdomain of tennis-league.com
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept'],
  });
  
  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Tennis League API')
    .setDescription('API documentation for the Tennis League application')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .addTag('events', 'Event management endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('lineups', 'Lineup management endpoints')
    .addTag('auth', 'Authentication endpoints')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Check if we're in Cloudflare Workers environment
  if (process.env.CLOUDFLARE_WORKER) {
    // For Cloudflare Workers deployment
    return app;
  } else {
    // For traditional deployment (local, dedicated server, etc.)
    await app.listen(process.env.PORT ?? 3000);
    console.log(`Application is running on: ${await app.getUrl()}`);
    return undefined;
  }
}

// For local development
if (!process.env.CLOUDFLARE_WORKER) {
  void bootstrap().catch(err => {
    console.error('Failed to start application:', err);
    process.exit(1);
  });
}

// For Cloudflare Workers
export default {
  async fetch(request: Request, env: Record<string, string>, ctx: unknown): Promise<Response> {
    process.env.CLOUDFLARE_WORKER = 'true';
    // Pass environment variables from Cloudflare to process.env
    for (const key in env) {
      if (Object.prototype.hasOwnProperty.call(env, key)) {
        process.env[key] = String(env[key]);
      }
    }
    
    const app = await bootstrap();
    if (!app) {
      return new Response('Failed to initialize application', { status: 500 });
    }
    
    try {
      const nestHandler = app.getHttpAdapter().getInstance();
      return nestHandler(request, env, ctx) as Response;
    } catch (error) {
      console.error('Error handling request:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
