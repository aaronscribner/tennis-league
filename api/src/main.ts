import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enhanced CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:4200',  // Angular dev server
      'http://localhost:3000',  // Local development
      'https://tennis-league.vercel.app', // Production frontend
      /\.tennis-league\.com$/,  // Any subdomain of tennis-league.com
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
        in: 'header'
      },
      'access-token'
    )
    .addTag('events', 'Event management endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('lineups', 'Lineup management endpoints')
    .addTag('auth', 'Authentication endpoints')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
