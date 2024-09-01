import { Module } from '@nestjs/common';
import {ProductController} from "./product.controller";
import { AuthorizeGuard} from '../authorize-guard/authorize-guard.service';
import {MongooseModule} from "@nestjs/mongoose";
import {Products,ProductsSchema} from "./products.schema";
import { ProductService } from './product.service';

@Module({
    imports:[MongooseModule.forFeature([{name:Products.name,schema:ProductsSchema,collection:'products'}])],
    controllers: [ProductController],
    providers:[AuthorizeGuard,ProductService]
})
export class ProductModule {}
