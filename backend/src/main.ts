import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Levitate3DBootstrap');
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Required for Stripe signature verification
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 4000;

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Enable CORS for web frontend & desktop apps
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // OpenAPI / Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Levitate3D Platform API')
    .setDescription(
      'Custom Magnetic Levitating & Illuminated 3D Statue Platform API.\n' +
        'Headless REST API for Web, Supplier Windows Desktop Client, and future iOS/Android apps.\n' +
        'Features Tripo3D API integration, WORM cryptographic SHA-256 legal chain-of-custody, and strict supplier isolation.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('3D Generation (Tripo3D)', 'Text, Image, and Sketch 3D model generation')
    .addTag('Orders', 'Order placement, magnetic base & embedded LED configuration')
    .addTag('Payments & Stripe', 'PaymentIntents, Webhooks, and WORM payment receipts')
    .addTag('Order Tracking', 'Customer visual milestone tracker and carrier links')
    .addTag('Social Share Kit', 'Post-delivery 360 turntable and social sharing assets')
    .addTag('Supplier Isolated Desktop API', 'Strictly scoped endpoints for Windows desktop client')
    .addTag('Admin Operations & Financials', 'Revenue, COGS, Margins, and WORM chain verification')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/v1/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Levitate3D API Specification',
  });

  await app.listen(port);
  logger.log(`================================================================`);
  logger.log(` Levitate3D Backend Server running on http://localhost:${port}`);
  logger.log(` OpenAPI / Swagger Documentation: http://localhost:${port}/api/v1/docs`);
  logger.log(` Supplier Scoped Endpoint: http://localhost:${port}/api/v1/supplier/jobs`);
  logger.log(` WORM Legal Chain Verifier: http://localhost:${port}/api/v1/admin/worm/verify/:id`);
  logger.log(`================================================================`);
}

bootstrap();
