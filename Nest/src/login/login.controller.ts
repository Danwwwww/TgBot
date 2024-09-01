import {Controller, Post, Get, UseGuards, Req, Res, Body, NotFoundException} from '@nestjs/common';
import {AuthenticateGuard} from '../authenticate-guard/authenticate-guard.service';
import * as jwt from 'jsonwebtoken';
import {registerDto, resetPassword} from "./user.dto";
import {AuthorizeGuard} from "../authorize-guard/authorize-guard.service";
import {LoginService} from "./login.service";
import {error} from 'console';
import {Response} from 'express';

@Controller()
export class LoginController {
    constructor(private loginService: LoginService) {
    }

    @Post('/login')
    @UseGuards(AuthenticateGuard)
    login(@Res() res, @Req() req) {
        const token = jwt.sign(req.user, "secret_key", {"expiresIn": "7d"});
        req.user.token = `Bearer ${token}`;
        res.status(200);
        res.json(req.user);
    }

    @Post('/register')
    @UseGuards(AuthorizeGuard)
    async register(@Body() registerDate: registerDto,@Res() res) {
        try {
            console.log(registerDate)
            await this.loginService.register(registerDate);
            res.status(200).json({message:"success"});
        } catch (e) {
            throw new NotFoundException(e);
        }

    }
    @Post('/resetpassword')
    @UseGuards(AuthorizeGuard)
    async changepass(@Body()  resetPassword:resetPassword,@Res() res){
        try {
            console.log(resetPassword);
            await this.loginService.changePassword(resetPassword);
            res.status(200).json({message:"success"});
        }catch (e){
            throw new NotFoundException(e);
        }
    }


}