import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'Registered email address' })
  @IsEmail()
  email!: string;
}

export class VerifyResetOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp!: string;

  @ApiProperty({ example: 'NewSecure@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  new_password!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'Current@123' })
  @IsString()
  current_password!: string;

  @ApiProperty({ example: 'NewSecure@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  new_password!: string;
}