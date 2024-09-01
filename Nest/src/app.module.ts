import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoginModule } from './login/login.module';
import { ProductModule } from './product/product.module';
import { ShopModule } from './shop/shop.module';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionModule } from './question/question.module';
import { CustomerModule } from './customer/customer.module';
import { CouponModule } from './coupon/coupon.module';

@Module({
  imports: [ProductModule,LoginModule, ShopModule,CouponModule, MongooseModule.forRoot('mongodb://localhost:27017/admin'), QuestionModule,CustomerModule],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {
}
