import { Module } from '@nestjs/common';
import { CouponController } from './coupon.controller';
import { CouponService } from './coupon.service';
import { Coupon,CouponSchema } from './coupon.schema';
import {MongooseModule} from "@nestjs/mongoose";


@Module({
  imports:[MongooseModule.forFeature([{name:Coupon.name,schema:CouponSchema,collection:'coupon'}])],
  controllers: [CouponController],
  providers: [CouponService],
})
export class CouponModule {}