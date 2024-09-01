import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { QuestionService } from './question.service';
import { AuthorizeGuard } from 'src/authorize-guard/authorize-guard.service';
import { UpdateQuestion,CreateQuestion } from './question.dto';

@Controller('question')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) { }

  @Get("get")
  async allQuestion(): Promise<CreateQuestion[]> {
    return this.questionService.allQuestion();
  }

  @Get('get/:key')
  async keywordSearch(@Param('key') key: string):Promise<CreateQuestion[]>{
    try {
       return this.questionService.keywordSearch(key);
    } catch (error) {
      console.log(error);
    }
  }
  @Post("add")
  @UseGuards(AuthorizeGuard)
  async addQuestion(@Body() newObj: CreateQuestion): Promise<void> {
    await this.questionService.addQuestion(newObj)
  }

  @Put("edit/:id")
  @UseGuards(AuthorizeGuard)
  async editQuestion(@Param("id") id:string, @Body() newObj: UpdateQuestion): Promise<void> {
    await this.questionService.editQuestion(id,newObj)
  }


  @Delete('del/:id')
  @UseGuards(AuthorizeGuard)
  async delQuestion(@Param('id') id: string): Promise<{ message: string }> {
    try {
      await this.questionService.delQuestion(id);
      return { message: 'Delete successfully' };
    } catch (error) {
      console.log(error);
      return { message: 'Error deleting question' };
    }
  }

}
