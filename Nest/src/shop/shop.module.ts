import { Module } from '@nestjs/common';
import { ShopController } from './shop.controller';
import { AuthorizeGuard} from '../authorize-guard/authorize-guard.service';
import {MongooseModule} from "@nestjs/mongoose";
import {Shop,ShopSchema} from "./shop.schema";
import { ShopService } from './shop.service';

@Module({
  imports:[MongooseModule.forFeature([
      {name:Shop.name,schema:ShopSchema,collection:'shop'}
  ])],
  controllers: [ShopController],
  providers:[AuthorizeGuard, ShopService]
})
export class ShopModule {}
