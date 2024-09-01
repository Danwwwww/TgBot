import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsObject } from 'class-validator';

export class CreateCustomerDTO {
    chatId: number;
    name: string;
}
export class UpdateCustomerDTO {
    chatId: number;
    commands: { [key: string]: { count: number } };
}
export class UpdateNotifyDTO {
    chatId: number;
    notify: boolean;
}
export class storeCommentDTO {
    chatId?: number;
    name: string;
    satisfaction: number;
    comment: string;
  }