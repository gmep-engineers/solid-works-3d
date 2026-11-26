import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { WormModule } from './modules/worm/worm.module';
import { StorageModule } from './modules/storage/storage.module';
import { AuthModule } from './modules/auth/auth.module';
import { Tripo3dModule } from './modules/tripo3d/tripo3d.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { ShareModule } from './modules/share/share.module';
import { SupplierModule } from './modules/supplier/supplier.module';
import { AdminModule } from './modules/admin/admin.module';
import { FaqModule } from './modules/faq/faq.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'backend/.env', '../.env'],
      load: [configuration],
    }),
    DatabaseModule,
    WormModule,
    StorageModule,
    AuthModule,
    Tripo3dModule,
    OrdersModule,
    PaymentsModule,
    TrackingModule,
    ShareModule,
    SupplierModule,
    AdminModule,
    FaqModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
