import { Module } from '@nestjs/common';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { MongooseModule } from "@nestjs/mongoose";
import { Question, QuestionSchema } from "./question.schema";
import { AuthorizeGuard } from 'src/authorize-guard/authorize-guard.service';

@Module({
  imports: [
  MongooseModule.forFeature([{ name: Question.name, schema: QuestionSchema, collection: 'question' }])],
  providers: [QuestionService,AuthorizeGuard],
  controllers: [QuestionController]
})
export class QuestionModule {}
