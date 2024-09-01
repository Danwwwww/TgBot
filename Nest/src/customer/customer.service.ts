import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument } from './customer.schema'
import { UpdateNotifyDTO, storeCommentDTO } from './customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) { }

  async storeCustomerInfo(chatId: number, name: string): Promise<string> {
    try {
      const existingDoc = await this.customerModel.findOne({ chatId });

      if (!existingDoc) {
        await this.customerModel.create({ chatId, name, notify: true });
        return 'Customer data saved successfully.';
      }

      return 'Customer already exists.';
    } catch (error) {
      console.log(error);
      return 'Error saving customer data.';
    }
  }

  async storeCustomerUsage(chatId: number, command: string): Promise<string> {
    try {
      const existingDoc = await this.customerModel.findOne({ chatId });

      if (existingDoc) {
        await this.customerModel.updateOne(
          { chatId },
          { $inc: { [`commands.${command}.count`]: 1 } },
          { upsert: true },
        );
        return 'Customer usage data updated successfully.';
      } else {
        await this.customerModel.create({
          chatId,
          commands: {
            [command]: {
              count: 1,
            },
          },
        });
        return 'New customer usage data saved successfully.';
      }
    } catch (error) {
      console.log(error);
      return 'Error updating/saving customer usage data.';
    }
  }

  async updateCustomerNotify(updateNotifyDTO: UpdateNotifyDTO): Promise<string> {
    try {
      const { chatId, notify } = updateNotifyDTO;  
      const existingDoc = await this.customerModel.findOne({chatId});
  
      if (existingDoc) {
        await this.customerModel.updateOne(
          { chatId },
          { $set: {  notify } },
          { upsert: true }
        );
        return 'Customer notification settings updated successfully.';
      } else {
        return 'Customer not found.';
      }
    } catch (error) {
      return 'Error updating customer notification settings.';
    }
  }

  async selectNotify(): Promise<number[]> {
    try {
      const result = await this.customerModel.find(
        { notify: true },
        { _id: 0, chatId: 1 },
      );
      return result.map((customer) => customer.chatId);
    } catch (error) {
      console.log(error);
      return [];
    }
  }
  async storeComment(storeCommentDTO: storeCommentDTO): Promise<string> {
    try {

      const { chatId, name, satisfaction, comment } = storeCommentDTO;
      const date = new Date().toLocaleDateString();
      const existingDoc = await this.customerModel.findOne({ chatId });

      if (existingDoc) {
        await this.customerModel.updateOne(
          { chatId },
          { $set: { name, date, satisfaction, comment } },
          { upsert: true },
        );
        return 'Comment updated successfully in MongoDB';
      } else {
        await this.customerModel.create({ chatId, name, date, satisfaction, comment });
        return 'Comment inserted successfully in MongoDB';
      }
    } catch (error) {
      console.log(error);
      return 'Error updating/inserting comment in MongoDB';
    }
  }

   async storeCustomerSearch(chatId: number, search: string): Promise<string> {
    try {
      await this.customerModel.findOneAndUpdate(
        { chatId },
        {
          $addToSet: {
            search: search,
          },
        },
        {
          new: true,
        }
      );

      return `Customer search "${search}" added to the array.`;
    } catch (error) {
      console.error(error);
      return 'Error updating customer search data.';
    }
  }
}