import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizeGuard } from './authorize-guard.service';

describe('AuthorizeGuardService', () => {
  let service: AuthorizeGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthorizeGuard]
    }).compile();

    service = module.get<AuthorizeGuard>(AuthorizeGuard);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
