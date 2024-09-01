import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {Document} from 'mongoose';

@Schema({versionKey:false})
export class Products{
    @Prop({unique:true})
    productsId: string;
    @Prop({required:true})
    productName:string;
    @Prop({required:true})
    category:string;
    @Prop()
    productLink:string;
    @Prop({required:true})
    description:string;
    @Prop({required:true})
    price:number;
}
export type ProductsDocument = Products&Document
export const ProductsSchema = SchemaFactory.createForClass(Products);
