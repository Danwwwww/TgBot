import { ApiProperty } from '@nestjs/swagger';
import {IsString, IsObject, IsLatitude, IsLongitude, IsArray} from 'class-validator';
import { Type } from 'class-transformer';

export class LocationDto {
    @ApiProperty({ description: '地理位置类型，这里固定为 Point' })
    @IsString()
    type: string = 'Point';
    @ApiProperty({ description: '坐标' })
    @IsArray()
    coordinates:[number,number]
}

// 营业时间 DTO
export class OpenDto {
    @ApiProperty({ description: '营业开始时间' })
    @IsString()
    start: string;
    @ApiProperty({ description: '营业结束时间' })
    @IsString()
    end: string;
}
export class CreateShopDto {
    @ApiProperty({ description: '商店ID' })
    @IsString()
    shopId: string;
    @ApiProperty({ description: '商店名称' })
    @IsString()
    shopName: string;
    @ApiProperty({ description: '商店状态' })
    @IsString()
    status:string
    @ApiProperty({ description: '地区' })
    @IsString()
    district:string;
    @ApiProperty({ description: '电话' })
    @IsString()
    tel:string;
    @ApiProperty({ description: '地址' })
    @IsString()
    address: string;
    @ApiProperty({ description: '地理位置', type: 'object' })
    @IsObject()
    @Type(() => LocationDto) // 使用 class-transformer 来处理嵌套对象的转换
    Location: LocationDto;
    @ApiProperty({ description: '营业时间',type:'object'})
    @IsObject()
    @Type(()=>OpenDto)
    open: OpenDto;
}

export class UpdateShopDto {
    // 仅包含可更新的属性，使用部分创建或更新的逻辑
    // 例如，如果 shopId 是不可变的，那么不应该在这里包含它
    @ApiProperty({ description: '商店名称' })
    @IsString()
    shopName!: string;
    @ApiProperty({ description: '地址' })
    @IsString()
    address!: string;
    @ApiProperty({ description: '商店状态' })
    @IsString()
    status?:string;
    @ApiProperty({ description: '电话' })
    @IsString()
    tel!:string;
    @ApiProperty({ description: '地区' })
    @IsString()
    district!:string;
    @ApiProperty({ description: '地理位置', type: 'object' })
    @IsObject()
    @Type(() => LocationDto) // 使用 class-transformer 来处理嵌套对象的转换
    Location!: LocationDto;
    @ApiProperty({ description: '营业时间' })
    @IsObject()
    @Type(()=>OpenDto)
    open!: OpenDto;
}

// 地理位置 DTO
