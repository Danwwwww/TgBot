import {CanActivate, ExecutionContext, Injectable, UnauthorizedException} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthorizeGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader =request.headers.authorization;
        const token=authHeader.split(" ")[1];
        if (!token) {
            throw new UnauthorizedException('No token provided');
        }
        try {
            request.user = jwt.verify(token, 'secret_key'); //request.user.username可以获得username
            return true;
        } catch (err) {
            throw new UnauthorizedException('Token verification failed', err);
        }
    }
}