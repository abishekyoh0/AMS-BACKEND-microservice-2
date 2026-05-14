import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendOtpEmail(to: string, name: string, otp: string, purpose: 'login' | 'reset' | 'verify') {
    const templates = {
      login: {
        subject: '🔐 AMS Login OTP',
        body: `Your OTP for logging into AMS is: <strong>${otp}</strong><br/>This OTP is valid for 10 minutes.`,
      },
      verify: {
        subject: '✅ AMS Email Verification OTP',
        body: `Your OTP to verify your email address is: <strong>${otp}</strong><br/>This OTP is valid for 10 minutes.`,
      },
      reset: {
        subject: '🔑 AMS Password Reset OTP',
        body: `Your OTP to reset your password is: <strong>${otp}</strong><br/>This OTP is valid for 10 minutes.<br/><br/>If you didn't request this, please ignore this email.`,
      },
    };

    const template = templates[purpose];

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1a56db; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">🏢 AMS Society</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <p>Hello <strong>${name}</strong>,</p>
          <p>${template.body}</p>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
            <strong>${otp}</strong>
          </div>
          <p style="color: #6b7280; font-size: 12px;">This OTP will expire in 10 minutes.</p>
          <p style="color: #6b7280; font-size: 12px;">If you didn't request this OTP, please ignore this email or contact support.</p>
        </div>
        <div style="background-color: #f9fafb; padding: 10px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>© ${new Date().getFullYear()} AMS Society Management System. All rights reserved.</p>
        </div>
      </div>
    `;

    try {
      await this.mailerService.sendMail({
        to,
        subject: template.subject,
        html,
      });
      this.logger.log(`OTP email sent to ${to} for ${purpose}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${to}: ${error.message}`);
      // Log OTP for development (remove in production)
      console.log(`[DEV] OTP for ${to} (${purpose}): ${otp}`);
      return false;
    }
  }

  async sendPasswordResetConfirmation(to: string, name: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1a56db; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">🏢 AMS Society</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your password has been successfully reset.</p>
          <p>If you did not perform this action, please contact support immediately.</p>
          <hr style="margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 12px;">This is a system notification, please do not reply to this email.</p>
        </div>
      </div>
    `;

    try {
      await this.mailerService.sendMail({
        to,
        subject: '🔒 Password Reset Confirmation - AMS',
        html,
      });
      this.logger.log(`Password reset confirmation sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset confirmation: ${error.message}`);
    }
  }
}