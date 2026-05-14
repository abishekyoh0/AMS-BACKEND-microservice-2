import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('SMTP_HOST', 'smtp.gmail.com'),
          port: config.get('SMTP_PORT', 587),
          secure: false, // true for 465, false for other ports
          auth: {
            user: config.get('SMTP_USER'),
            pass: config.get('SMTP_PASSWORD'),
          },
        },
        defaults: {
          from: `"AMS Society" <${config.get('SMTP_FROM', 'noreply@ams.com')}>`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}