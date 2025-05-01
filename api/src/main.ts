import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend development
  app.enableCors();
  
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
