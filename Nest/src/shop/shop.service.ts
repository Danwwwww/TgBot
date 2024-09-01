import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {Shop} from "./shop.schema";
import {CreateShopDto,UpdateShopDto} from "./shop.dto";

@Injectable()
export class ShopService {
    constructor(@InjectModel(Shop.name) private shopModel:Model<Shop>) {}
    async insertDocument(createShopDto:CreateShopDto) {
        try {
            const maxId = await this.shopModel.findOne().sort('-shopId').limit(1)
            createShopDto.shopId=maxId ? `${Number(maxId.shopId) + 1}` : "1000";
            const createdShop = new this.shopModel(createShopDto);
            await createdShop.save();
            return "Successfully insert to MongoDB"
        } catch (err) {
            console.log(err);
            throw err
        }
    }
    async findDocuments() {
        try {
            const cursor = this.shopModel.find({},{_id: 0}).exec();
            return await cursor;
        } catch (err) {
            throw err
        }
    }
    async updateDocuments(id:string, UpdateShopDto:UpdateShopDto) {
        try {
            await this.shopModel.updateOne(
                {shopId: id},
                {$set: UpdateShopDto},
                {new:true}
            ).exec();
        } catch (err) {
            throw err
        }
    }
    async selectDocuments(id:string) {
        try {
            const cursor = await this.shopModel.find({shopId: id}).exec();
            console.log(cursor)
            if (cursor.length==0){
                throw new Error("Not Found!");
            }else {
                return cursor;
            }
        } catch (err) {
            throw err

        }
    }
    async selectDistrict(district:string) {
        try {
            const query = {district: district};
            const cursor = this.shopModel.find(query,{shopId:0}).exec();
            return await cursor;
        } catch (err) {
            throw err

        }
    }
    async deleteDocuments(id:string) {
        try {
            const query = {shopId: id};
            await this.shopModel.deleteOne(query).exec();
        } catch (err) {
            throw err
        }
    }
    async searchLocation(arr:Array<Number>) {
        try {
            const cursor = this.shopModel.find({
                Location: {
                    $nearSphere: {
                        $geometry: {
                            type: "Point",
                            coordinates: arr // 你的查询点的经纬度
                        },
                        $maxDistance: 2000 // 两公里，单位为米
                    }
                }
            }).exec();
            return await cursor
        } catch (err) {
            throw err
        }
    }

}
