import nodemailer from "nodemailer";
import { config } from "@config/index.js";
import logger from "./logger.js";

// create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: config.emailHost,
    port: config.emailPort,
    secure: config.emailPort === 465, // true for 465, false for other ports
    auth: {
      user: config.emailUser,
      pass: config.emailPassword,
    },
  });
};

// send email function
export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<void> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: config.emailFrom,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to}: ${info.messageId}`);
  } catch (error: any) {
    logger.error(`Failed to send email to ${to}:`, error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// send OTP email
export const sendOTPEmail = async (
  email: string,
  otpCode: string,
  name?: string
): Promise<void> => {
  const subject = "Email Verification OTP";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f9f9f9;
          border-radius: 10px;
          padding: 30px;
          margin-top: 20px;
        }
        .header {
          text-align: center;
          color: #4a90e2;
          margin-bottom: 30px;
        }
        .otp-code {
          background-color: #ffffff;
          border: 2px dashed #4a90e2;
          border-radius: 5px;
          padding: 20px;
          text-align: center;
          font-size: 32px;
          font-weight: bold;
          color: #4a90e2;
          letter-spacing: 5px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #777;
          text-align: center;
        }
        .warning {
          color: #e74c3c;
          font-size: 14px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="header">Email Verification</h1>
        ${name ? `<p>Hello ${name},</p>` : "<p>Hello,</p>"}
        <p>Thank you for registering with us. Please use the following OTP code to verify your email address:</p>
        <div class="otp-code">${otpCode}</div>
        <p>This OTP will expire in ${config.otpExpiryMinutes} minutes.</p>
        <p class="warning">If you didn't request this OTP, please ignore this email.</p>
        <div class="footer">
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `Your OTP code is: ${otpCode}. This code will expire in ${config.otpExpiryMinutes} minutes.`;

  await sendEmail(email, subject, html, text);
};

// send password reset OTP email
export const sendPasswordResetOTPEmail = async (
  email: string,
  otpCode: string,
  name?: string
): Promise<void> => {
  const subject = "Password Reset OTP";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f9f9f9;
          border-radius: 10px;
          padding: 30px;
          margin-top: 20px;
        }
        .header {
          text-align: center;
          color: #e74c3c;
          margin-bottom: 30px;
        }
        .otp-code {
          background-color: #ffffff;
          border: 2px dashed #e74c3c;
          border-radius: 5px;
          padding: 20px;
          text-align: center;
          font-size: 32px;
          font-weight: bold;
          color: #e74c3c;
          letter-spacing: 5px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #777;
          text-align: center;
        }
        .warning {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin-top: 20px;
          font-size: 14px;
          color: #856404;
        }
        .security-note {
          background-color: #f8d7da;
          border-left: 4px solid #e74c3c;
          padding: 15px;
          margin-top: 15px;
          font-size: 13px;
          color: #721c24;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="header">🔐 Password Reset Request</h1>
        ${name ? `<p>Hello ${name},</p>` : "<p>Hello,</p>"}
        <p>We received a request to reset your password. Please use the following OTP code to complete the password reset process:</p>
        <div class="otp-code">${otpCode}</div>
        <p><strong>This OTP will expire in ${
          config.otpExpiryMinutes
        } minutes.</strong></p>
        <div class="warning">
          <strong>⚠️ Important:</strong> Do not share this OTP with anyone. Our team will never ask for your OTP.
        </div>
        <div class="security-note">
          <strong>🛡️ Security Notice:</strong> If you didn't request a password reset, please ignore this email and ensure your account is secure. Consider changing your password if you suspect unauthorized access.
        </div>
        <div class="footer">
          <p>This is an automated email, please do not reply.</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `Your password reset OTP code is: ${otpCode}. This code will expire in ${config.otpExpiryMinutes} minutes. If you didn't request this, please ignore this email.`;

  await sendEmail(email, subject, html, text);
};
