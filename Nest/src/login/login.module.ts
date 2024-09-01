import { Module } from '@nestjs/common';
import {AuthenticateGuard} from "../authenticate-guard/authenticate-guard.service";
import {LoginController} from "./login.controller"
import {MongooseModule} from "@nestjs/mongoose";
import { LoginService } from './login.service';
import {User,UserSchema} from "./user.schema";
import {AuthorizeGuard} from "../authorize-guard/authorize-guard.service";

@Module({
    imports:[MongooseModule.forFeature([
        {name:User.name,schema:UserSchema,collection:'users'}]),
        LoginModule],
    controllers: [LoginController],
    providers: [AuthenticateGuard,LoginService,AuthorizeGuard]
})
export class LoginModule {}
