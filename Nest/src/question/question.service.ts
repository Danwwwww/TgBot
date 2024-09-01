import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Question } from './question.schema';
import { UpdateQuestion,CreateQuestion } from './question.dto';

@Injectable()
export class QuestionService {
    constructor(
        @InjectModel(Question.name) private questionModel: Model<Question>,
    ) { }

    async allQuestion(): Promise<Question[]> {
        return this.questionModel.find().exec();
    }

    async keywordSearch(key: string): Promise<Question[]> {
        try {
           return await this.questionModel.find({
            keyword: { $regex: new RegExp(key, 'i') },
          });
        } catch (error) {
          console.log(error);
        }
      }

    async addQuestion(newObj: CreateQuestion): Promise<void> {
        try {
            await this.questionModel.create(newObj);
            const updatedQuestions = await this.questionModel.find().exec();
        } catch (error) {
            console.error(error);
        }
    }

    async editQuestion(id:string,newObj: UpdateQuestion): Promise<void> {
        try {
            await this.questionModel.updateOne({qid: id}, {$set: newObj}, {new: true}).exec();
            const updatedQuestions = await this.questionModel.find().exec();
        } catch (error) {
            console.error(error);
        }
    }

    async delQuestion(id: string): Promise<void> {
        try {
            await this.questionModel.deleteOne({ qid: id }).exec();
            const updatedQuestions = await this.questionModel.find().exec();
        } catch (error) {
            console.log(error)
        }
    }

}
