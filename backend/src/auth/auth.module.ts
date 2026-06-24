import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy as CoreJwtStrategy } from './strategies/jwt.strategy';
import { loadSecurityConfig } from '../common/config/security-config';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: loadSecurityConfig().jwtSecret,
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, CoreJwtStrategy],
  exports: [AuthService, PassportModule, JwtModule],
})
export class AuthModule {}
