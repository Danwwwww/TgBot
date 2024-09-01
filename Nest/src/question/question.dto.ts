import { ApiProperty } from '@nestjs/swagger';
import {IsString} from 'class-validator';

export class CreateQuestion{
    @ApiProperty({description:"问题ID"})
    @IsString()
    qid:string;
    @ApiProperty({description:"问题描述"})
    @IsString()
    question:string;
    @ApiProperty({description:"关键字/标签"})
    @IsString()
    keyword:string;
    @ApiProperty({description:"回答"})
    @IsString()
    answer:string;
}
export class UpdateQuestion{
    @ApiProperty({description:"问题描述"})
    @IsString()
    question?:string;
    @ApiProperty({description:"关键字/标签"})
    @IsString()
    keyword?:string;
    @ApiProperty({description:"回答"})
    @IsString()
    answer?:string;
}