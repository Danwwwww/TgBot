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
import {ProductService} from "./product.service";
import {createProductDto, updateProductDto} from "./product.dto";


@Controller('product')
export class ProductController {
    constructor(private mongo:ProductService) {};
    @Get("get")
    async getProduct(){
        try {
            return await this.mongo.findDocuments();
        } catch (e) {
            // 错误处理
            throw new NotFoundException("Not Found");
        }
    }
    @Post("add")
    @UseGuards(AuthorizeGuard)
    async addProduct(@Res() res,@Body() createData: createProductDto){
        try {
            await this.mongo.insertDocument(createData);
            res.status(201).send("Success")
            res.json({success:'Add product success'});
        }catch (e){
            throw new NotFoundException("Not Found");
        }
    }
    @Get("select/:product_id")
    async selectProduct(@Param("product_id") id:string,@Res ()res){
        try {
            res.json(await this.mongo.selectDocuments(id));
        } catch (e) {
            throw new NotFoundException("Not Found");
        }
    }
    @Delete("delete/:product_id")
    @UseGuards(AuthorizeGuard)
    async delProduct(@Res() res,@Param("product_id") id:string){
        try {
            await this.mongo.deleteDocuments(id);
            res.status(201).send("Success")
            return {success:'Delete products Success'}
        } catch (e) {
            throw new NotFoundException("Not Found");
        }
    }
    @Put("update/:product_id")
    @UseGuards(AuthorizeGuard)
    async upProduct(@Res() res,@Param("product_id") id:string,@Body() updateData: updateProductDto){
        try {
            await this.mongo.updateDocuments(id,updateData);
            res.status(201).send("Success")
            return {success:'Update products Success'}
        }catch (e){
            throw new NotFoundException("Not Found");
        }
    }
    @Get("search")
    async searchKeyword(@Query('keyword')keyword:string){
        try {
            let a = "0"
            let b = "9999999999";
            return await this.mongo.searchDocuments(keyword, Number(a), Number(b));
        } catch (err) {
            throw new NotFoundException("Not Found");
        }
    }
    @Get("advancesearch")
    async advanceSearch(@Query('keyword')keyword:string,
                        @Query('r1')r1:number,
                        @Query('r2')r2:number){
        try {
            let a=r1;
            let b=r2;
            if (Number(r1)> Number(r2)) {
                b = r1;
                a = r2;
            }
          
            return await this.mongo.searchDocuments(keyword, a, b);
        } catch (err) {
            throw new NotFoundException("Not Found");
        }
    }
    @Get("category/:cate")
    async searchCategory(@Param("cate")cate:string){
        try {
            return await this.mongo.searchCategory(cate);
        }catch (e){
            throw new NotFoundException("Not Found");
        }
    }
}
