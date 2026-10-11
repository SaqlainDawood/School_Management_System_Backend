import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.BREVO_SMTP_PORT) || 587,
    secure: process.env.BREVO_SMTP_PORT === '465',
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

export const sendEmail = async (options) => {
  try {
    const transporter = getTransporter();
    await transporter.verify();

    const mailOptions = {
      from: `"${process.env.BREVO_FROM_NAME || 'School Management System'}" <${process.env.BREVO_FROM_EMAIL || 'noreply@schoolmanagement.com'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    };

    if (options.cc) mailOptions.cc = options.cc;
    if (options.bcc) mailOptions.bcc = options.bcc;
    if (options.attachments) mailOptions.attachments = options.attachments;

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    return null;
  }
};

export const sendWelcomeEmail = async (user, password = null) => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; }
          .header { background: #2563EB; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; background: #f8fafc; }
          .footer { padding: 20px; text-align: center; background: #f1f5f9; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background: #2563EB; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to School Management System</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.name},</h2>
            <p>Your account has been successfully created in the School Management System.</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role}</p>
            ${password ? `<p><strong>Temporary Password:</strong> ${password}</p>` : ''}
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">Login to Your Account</a></p>
            <p>Please change your password after your first login.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} School Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await sendEmail({
      to: user.email,
      subject: 'Welcome to School Management System',
      html,
    });
  } catch (error) {
    console.error('Welcome email failed:', error.message);
    return null;
  }
};

export const sendFeeReminder = async (student, fee) => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; }
          .header { background: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; background: #f8fafc; }
          .fee-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border: 1px solid #e0e0e0; }
          .footer { padding: 20px; text-align: center; background: #f1f5f9; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background: #2563EB; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Fee Payment Reminder</h2>
          </div>
          <div class="content">
            <h2>Dear ${student.name},</h2>
            <p>This is a reminder that your fee payment is due.</p>
            <div class="fee-details">
              <p><strong>Student:</strong> ${student.name}</p>
              <p><strong>Roll Number:</strong> ${student.rollNumber || 'N/A'}</p>
              <p><strong>Fee Type:</strong> ${fee.feeType}</p>
              <p><strong>Amount:</strong> Rs. ${fee.amount}</p>
              <p><strong>Due Date:</strong> ${new Date(fee.dueDate).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${fee.status}</p>
            </div>
            <p>Please make the payment before the due date to avoid late fees.</p>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/fees" class="button">View Fee Details</a></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} School Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await sendEmail({
      to: student.email,
      subject: 'Fee Payment Reminder',
      html,
    });
  } catch (error) {
    console.error('Fee reminder failed:', error.message);
    return null;
  }
};

export const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; }
          .header { background: #2563EB; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; background: #f8fafc; }
          .footer { padding: 20px; text-align: center; background: #f1f5f9; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background: #2563EB; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Password Reset Request</h2>
          </div>
          <div class="content">
            <h2>Hello ${user.name},</h2>
            <p>You requested to reset your password. Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link in your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>This link expires in 30 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} School Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html,
    });
  } catch (error) {
    console.error('Password reset email failed:', error.message);
    return null;
  }
};

export default {
  sendEmail,
  sendWelcomeEmail,
  sendFeeReminder,
  sendPasswordResetEmail,
};