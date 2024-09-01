import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import * as cookieParser from 'cookie-parser';
import {json} from "express";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.use(cookieParser());
    app.use(json())
    app.enableCors({
        origin: '*', // 只允许来自example.com的请求
    });
    await app.listen(8888);
}

bootstrap();
