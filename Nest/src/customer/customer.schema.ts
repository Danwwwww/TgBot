import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CustomerDocument = Customer & Document;

@Schema({versionKey:false})
export class Customer {
    @Prop({ required: true })
    chatId: number;

    @Prop()
    name: string;

    @Prop({ default: true })
    notify: boolean;

    @Prop({ type: Object, default: {} })
    commands: { [key: string]: { count: number } };

    @Prop()
    date: string;
  
    @Prop()
    satisfaction: number;
  
    @Prop()
    comment: string;

    @Prop()
    search: string;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);