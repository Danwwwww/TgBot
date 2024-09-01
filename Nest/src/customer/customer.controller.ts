import { Body, Controller, Get, Param, Post, Put, Search } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDTO, UpdateCustomerDTO, UpdateNotifyDTO, storeCommentDTO } from './customer.dto';

@Controller('customers')
export class CustomerController {
  constructor(private customerService: CustomerService) { }

  @Post()
  async storeCustomerInfo(@Body() createCustomerDTO: CreateCustomerDTO) {
    return await this.customerService.storeCustomerInfo(
      createCustomerDTO.chatId,
      createCustomerDTO.name,
    );
  }

  @Post('usage')
  async storeCustomerUsage(
    @Body('chatId') chatId: number,
    @Body('command') command: string,
  ) {
    return await this.customerService.storeCustomerUsage(chatId, command);
  }

  @Put('notify')
  async updateCustomerNotify(@Body() updateNotifyDTO: UpdateNotifyDTO) {
    return await this.customerService.updateCustomerNotify(updateNotifyDTO);
  }

  @Get('notify')
  async selectNotify() {
    return await this.customerService.selectNotify();
  }

  @Post('comment')
  async storeComment(
    @Body() storeCommentDTO: storeCommentDTO
  ) {
    try{
    await this.customerService.storeComment(
      storeCommentDTO);
      return {success:'Add comment success'};
    }catch (e){
      return {Error:'Error fetching products'}
    }
  }

  @Post('search')
  async storeSearch(
    @Body('chatId') chatId: number,
    @Body('search') search: string,
  ) {
    return await this.customerService.storeCustomerSearch(chatId, search);
  }
}