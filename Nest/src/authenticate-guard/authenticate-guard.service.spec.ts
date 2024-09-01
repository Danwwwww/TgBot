import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticateGuard } from './authenticate-guard.service';

describe('AuthenticateGuardService', () => {
  let service: AuthenticateGuard ;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthenticateGuard ],
    }).compile();

    service = module.get<AuthenticateGuard >(AuthenticateGuard );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
