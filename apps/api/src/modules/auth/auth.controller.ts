import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { CurrentTenant } from './auth.decorators';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import type { TenantContext } from './auth.types';

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

class RegisterDto {
  @IsIn(['buyer', 'supplier'])
  registrationType!: 'buyer' | 'supplier';

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  organizationName!: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  countriesServed?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  website?: string;
}

class SwitchOrganizationDto {
  @IsString()
  @IsNotEmpty()
  organizationId!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: any, @Req() request: any) {
    return this.auth.login(dto, response, request);
  }

  @Post('register')
  register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: any, @Req() request: any) {
    return this.auth.register(dto, response, request);
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  logout(@CurrentTenant() tenant: TenantContext, @Res({ passthrough: true }) response: any, @Req() request: any) {
    return this.auth.logout(tenant, response, request);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@CurrentTenant() tenant: TenantContext) {
    return this.auth.me(tenant);
  }

  @Post('refresh')
  refresh(@Req() request: any, @Res({ passthrough: true }) response: any) {
    return this.auth.refresh(request, response);
  }

  @UseGuards(AuthGuard)
  @Post('switch-organization')
  switchOrganization(@CurrentTenant() tenant: TenantContext, @Body() dto: SwitchOrganizationDto) {
    return this.auth.switchOrganization(tenant, dto.organizationId);
  }
}
