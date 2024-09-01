import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CouponDocument = Coupon & Document;

@Schema({versionKey:false})
export class Coupon {
    @Prop({ required: true })
    chatId: number;
   
    @Prop({ required: true })
    date: string;
  
  
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);