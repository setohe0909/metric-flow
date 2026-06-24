import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { loadSecurityConfig } from './common/config/security-config';

async function bootstrap() {
  loadSecurityConfig();
  const app = await NestFactory.create(AppModule);

  // Prefijo global para las rutas de la API
  app.setGlobalPrefix('api');

  // Habilitar CORS para permitir peticiones desde el frontend
  app.enableCors({
    origin: '*', // En producción esto debe restringirse a dominios específicos
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Validaciones globales de DTOs usando class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades del body que no estén en el DTO
      forbidNonWhitelisted: true, // Lanza error si hay propiedades no declaradas
      transform: true, // Convierte tipos automágicamente (ej. string a number)
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`MetricFlow backend running on: http://localhost:${port}/api`);
}
bootstrap();
