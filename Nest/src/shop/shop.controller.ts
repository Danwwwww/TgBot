import {
    Body,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    Post,
    Put,
    Query,
    Res,
    UseGuards
} from '@nestjs/common';
import {AuthorizeGuard} from "../authorize-guard/authorize-guard.service";
import {ShopService} from "./shop.service";
import {UpdateShopDto, CreateShopDto} from "./shop.dto";

@Controller('shop')
export class ShopController {
    constructor(private mongo: ShopService) {};
    @Get("get")
    async getProduct() {
        try {
            return await this.mongo.findDocuments();
        } catch (e) {
            throw new NotFoundException("Not Found");
        }
    }
    @Post("add")
    @UseGuards(AuthorizeGuard)
    async addProduct(@Res() res, @Body() createDate: CreateShopDto) {
        try {
            await this.mongo.insertDocument(createDate);
            res.status(201).send("Success")
            return {success: 'Add shop success'}
        } catch (e) {
            throw new NotFoundException("Not Found");
        }
    }
    @Get("select/:shop_id")
    async selectProduct(@Param("shop_id") id: string,@Res() res) {
        try {
            res.json(await this.mongo.selectDocuments(id));
        } catch (e) {
            throw new NotFoundException("Not Found");
        }
    }

    @Delete("delete/:shop_id")
    @UseGuards(AuthorizeGuard)
    async delProduct(@Res() res, @Param("shop_id") id: string) {
        try {
            await this.mongo.deleteDocuments(id);
            res.status(201).send("Success")
            return {success: 'Delete shop Success'}
        } catch (e) {
            throw new NotFoundException("Not Found");
        }
    }

    @Put("update/:shop_id")
    @UseGuards(AuthorizeGuard)
    async upProduct(@Res() res, @Param("shop_id") id: string, @Body() updateShopDto: UpdateShopDto) {
        try {
            await this.mongo.updateDocuments(id, updateShopDto);
            res.status(201).send("Success")
            return {success: 'Update shop Success'}
        } catch (e) {
            throw new NotFoundException("Not Found");
        }
    }

    @Get("/searchLocation")
    async searchLocation(@Query('lng') lng: string, @Query('lat') lat: string) {
        try {
            const arr = [Number(lng), Number(lat)];
             return  await this.mongo.searchLocation(arr);
        } catch (e) {
            throw new NotFoundException("Not Found");
        }
    }
    @Get("selectDistrict/:district")
    async selectDistrict(@Param("district") district: string) {
        try {
            return await this.mongo.selectDistrict(district);
        } catch (e) {
            throw new NotFoundException("Not Found");
        }
    }
}
