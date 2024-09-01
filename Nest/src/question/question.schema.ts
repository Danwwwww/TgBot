import {Prop,Schema,SchemaFactory} from "@nestjs/mongoose";
import {Document} from "mongoose";

@Schema({versionKey:false})
export class Question{
    @Prop()
    qid:string;
    @Prop()
    question:string;
    @Prop()
    keyword:string;
    @Prop()
    answer:string;
}
export type QuestionDocument=Question&Document;
export const QuestionSchema=SchemaFactory.createForClass(Question);