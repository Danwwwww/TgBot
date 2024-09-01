import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Coupon, CouponDocument } from './coupon.schema'
@Injectable()
export class CouponService {
  constructor(
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
  ) { }
  async insertCoupon(chatId: number) {

    try {
      let date = new Date().toLocaleDateString();
      await this.couponModel.create({ chatId: chatId, date: date });
    } catch (err) {
      console.log('Failed to insert to MongoDB');
    }
  }

  async selectCoupon(chatId: number): Promise<boolean> {
    try {
      const date = new Date().toLocaleDateString()
      const query = { chatId: chatId, date: date };
      const coupon = await this.couponModel.findOne(query).exec();
      return coupon !== null;
    } catch (err) {
      console.log('Error connecting to MongoDB:', err);
      return false;
    }
  }
  async selectCouponDaily(): Promise<boolean> {
    try {
      const date = new Date().toLocaleDateString();
      const query = {date: date };
      const coupons = await this.couponModel.find(query).exec();
      let totalValue = 0;
      coupons.forEach((coupon) => {
        totalValue += 1;
      });
      return totalValue >= 3;
    } catch (err) {
      console.log('Error connecting to MongoDB:', err);
      // return false;
    }
  }
}