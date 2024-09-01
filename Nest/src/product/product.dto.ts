import { ApiProperty } from '@nestjs/swagger';
import {IsString,IsNumber} from 'class-validator';;
export class createProductDto{
    @ApiProperty({ description: '产品ID' })
    @IsString()
    productsId:string;
    @ApiProperty({ description: '产品名称'})
    @IsString()
    productName:string;
    @ApiProperty({ description: '产品种类'})
    @IsString()
    category:string;
    @ApiProperty({description:"产品链接"})
    @IsString()
    productLink:string;
    @ApiProperty({ description: '产品描述'})
    @IsString()
    description:string;
    @ApiProperty({ description: '产品价格'})
    @IsNumber()
    price:number;
}
export class updateProductDto{
    @ApiProperty({ description: '产品ID' })
    @IsString()
    productsId?:string;
    @ApiProperty({ description: '产品名称' })
    @IsString()
    productName!: string;
    @ApiProperty({ description: '产品种类' })
    @IsString()
    category!: string;
    @ApiProperty({description:"产品链接"})
    @IsString()
    productLink?:string;
    @ApiProperty({ description: '产品描述' })
    @IsString()
    description!: string;
    @ApiProperty({ description: '产品价格' })
    @IsNumber()
    price!: number;
}