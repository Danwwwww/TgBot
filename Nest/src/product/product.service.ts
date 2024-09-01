import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {createProductDto, updateProductDto} from "./product.dto";
import {Products} from "./products.schema";
import {Model} from "mongoose";

@Injectable()
export class ProductService {
    constructor(@InjectModel(Products.name) private productModel: Model<Products>) {}
    async insertDocument(createProduct: createProductDto) {
        try {
            const maxId = await this.productModel.findOne().sort('-productsId').limit(1)
            createProduct.productsId = maxId ? `${Number(maxId.productsId) + 1}` : "1000";
            let createdProduct = new this.productModel(createProduct);
            await createdProduct.save();
            return "Successfully insert to MongoDB"
        } catch (err) {
            console.log(err);
            throw new BadRequestException("Failed")
        }
    }
    async findDocuments() {
        try {
            const result = await this.productModel.find({}, {_id: 0}).sort('productsId').exec();
            if (result.length==0){
                throw new Error("Not Found");
            }else {
                return result;
            }
        } catch (err) {
            throw err;
        }
    }
    async updateDocuments(id: string, updateProductDto: updateProductDto) {
        try {
            await this.productModel.updateOne(
                {productsId: id},
                {$set: updateProductDto},
                {new: true}
            ).exec();
            return "Successfully updated to MongoDB";
        } catch (err) {
            throw err;
        }
    }
    async selectDocuments(id: string) {
        try {
            const result = await this.productModel.find({productsId: id}, {_id: 0}).exec();
            if (result.length==0){
              throw new Error("Not Found");
            }else {
                return result;
            }
        } catch (err) {
           throw err;
        }
    }
    async deleteDocuments(id: string) {
        try {
            const query = {productsId: id};
            await this.productModel.deleteOne(query).exec();
            return "Successfully deleted to MongoDB";
        } catch (err) {
            throw err;
        }
    }
    async searchDocuments(key: string, a: number, b: number) {
        try {
            const cursor = this.productModel.find({
                $and: [
                    {description: {$regex: new RegExp(key, 'i')}},
                    {price: {$gte: a}},
                    {price: {$lte: b}}
                ]
            }).exec();
            return await cursor;
        } catch (err) {
            throw err;
        }
    }
    async searchCategory(cate: string) {
        try {
            const query = {category: cate};
            return await this.productModel.find(query).exec();
        } catch (e) {
            throw e;
        }
    }
}
