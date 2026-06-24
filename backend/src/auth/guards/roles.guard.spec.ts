import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

class GuardTestController {
  @Roles('owner', 'admin')
  restricted() {}

  unrestricted() {}
}

describe('RolesGuard', () => {
  let guard: RolesGuard;

  beforeEach(() => {
    guard = new RolesGuard(new Reflector());
  });

  function createContext(
    handler: keyof GuardTestController,
    userRole?: string,
  ): ExecutionContext {
    return {
      getHandler: () => GuardTestController.prototype[handler],
      getClass: () => GuardTestController,
      switchToHttp: () => ({
        getRequest: () => ({ userRole }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows routes without role metadata', () => {
    expect(guard.canActivate(createContext('unrestricted', 'viewer'))).toBe(
      true,
    );
  });

  it.each(['owner', 'admin'])('allows the required %s role', (role) => {
    expect(guard.canActivate(createContext('restricted', role))).toBe(true);
  });

  it('rejects a viewer from an owner/admin route', () => {
    expect(() =>
      guard.canActivate(createContext('restricted', 'viewer')),
    ).toThrow(ForbiddenException);
  });

  it('rejects a request without a resolved tenant role', () => {
    expect(() => guard.canActivate(createContext('restricted'))).toThrow(
      ForbiddenException,
    );
  });
});
