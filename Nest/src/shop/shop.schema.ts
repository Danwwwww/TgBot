import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document,Schema as MongooseSchema} from 'mongoose';
import { GeoJSON, PointSchema } from "mongoose-geojson-schema";
import {OpenDto} from "./shop.dto";
@Schema({versionKey:false})
export class Shop{
    @Prop({unique:true})
    shopId:string;
    @Prop({required:true})
    shopName:string;
    @Prop({required:true})
    address:string;
    @Prop({required:true})
    district:string;
    @Prop()
    status:string;
    @Prop({required:true})
    tel:string;
    @Prop({ type: MongooseSchema.Types.Mixed,required:true})
    Location: GeoJSON<PointSchema>;
    @Prop({required:true})
    open:OpenDto;
}
export type ShopDocument = Shop&Document;
export const ShopSchema = SchemaFactory.createForClass(Shop);