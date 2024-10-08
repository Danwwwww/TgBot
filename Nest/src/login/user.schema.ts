import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({versionKey:false})
export class User{
    @Prop({unique:true,required:true})
    username:string;
    @Prop({required:true})
    password:string;
}
export type UserDocument = User&Document;
export const UserSchema = SchemaFactory.createForClass(User);