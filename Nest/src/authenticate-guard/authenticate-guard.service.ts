import {Injectable, ExecutionContext, CanActivate, BadRequestException} from '@nestjs/common';
import {Observable} from 'rxjs';
import {LoginService} from "../login/login.service";

@Injectable()
export class AuthenticateGuard implements CanActivate {
    constructor(private User: LoginService) {};
    canActivate(context: ExecutionContext):boolean | Promise<boolean> | Observable<boolean> {
        const req = context.switchToHttp().getRequest();
        return this.User.login(req.body).then((user) => {
            if (!user) {
                throw new BadRequestException("No User Found")
                return false;
            }
            req.user = {
                id: user._id,
                username: user.username,
            };
            return true;
        });
    }
}