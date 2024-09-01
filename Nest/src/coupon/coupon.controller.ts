import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CouponService } from './coupon.service';

@Controller('coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post()
  async insertCoupon(@Body('chatId') chatId: number) {
    return this.couponService.insertCoupon(chatId);
  }

  @Get("/:chatId")
  async selectCoupon(@Param ("chatId") chatId:number) {
    return this.couponService.selectCoupon(chatId);
  }

  @Get()
  async selectCouponDaily() {
    return this.couponService.selectCouponDaily();
  }
}