import { Injectable } from '@nestjs/common';
import {InjectModel} from "@nestjs/mongoose";
import * as bcrypt from 'bcrypt';
import {Model} from "mongoose";
import {User} from "./user.schema";
import {loginDto, registerDto, resetPassword} from "./user.dto";

@Injectable()
export class LoginService {
    constructor(@InjectModel(User.name) private userModel:Model<User>) {}
    async login(loginDate:loginDto) {
        try {
            const cursor = this.userModel.findOne({username: loginDate.username});
            const user = await cursor;
            if(user&&bcrypt.compareSync(loginDate.password,user.password)){
                return user;
            }
        } catch (e) {
            return false
        }
    }

    async register(registerDate:registerDto){
        try {
            bcrypt.hash(registerDate.password,10,(err,hash)=>{
                if(err) {
                    console.log(err);
                }else {
                    registerDate.password=hash
                    const account = new this.userModel(registerDate);
                    return account.save();
                }
            });
        }catch (e) {
            return e
        }
    }

    async changePassword(newAccount:resetPassword){
        try {
            bcrypt.hash(newAccount.password,10,(err,hash)=>{
                if(err) {
                    console.log(err);
                }else {
                    newAccount.password=hash
                    this.userModel.updateOne({username:newAccount.username},
                        {$set:{password:hash}},
                        {new: true}
                    ).exec();
                }
            });
        }catch (e) {
            return e
        }
    }

}
