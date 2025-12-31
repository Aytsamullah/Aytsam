const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  return transporter;
};

// Generate OTP email HTML template
const generateOtpEmailTemplate = (otp, expiryMinutes = 5) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #ffffff;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .otp-container {
          background-color: #f8fafc;
          border: 2px dashed #2563eb;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
        }
        .otp-code {
          font-size: 32px;
          font-weight: bold;
          color: #2563eb;
          letter-spacing: 4px;
          font-family: 'Courier New', monospace;
        }
        .warning {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
        }
        .warning-title {
          font-weight: bold;
          color: #92400e;
          margin-bottom: 8px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
        .security-note {
          background-color: #ecfdf5;
          border: 1px solid #10b981;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">MedChain EMR</div>
          <h1>Email Verification</h1>
          <p>Please verify your email address to complete your account registration</p>
        </div>

        <div class="otp-container">
          <p style="margin-bottom: 10px; font-weight: bold;">Your Verification Code:</p>
          <div class="otp-code">${otp}</div>
        </div>

        <div class="warning">
          <div class="warning-title">⚠️ Important Security Information</div>
          <ul style="margin: 0; padding-left: 20px;">
            <li>This code will expire in <strong>${expiryMinutes} minutes</strong></li>
            <li>You can only attempt verification <strong>3 times</strong> before needing a new code</li>
            <li>Do not share this code with anyone</li>
          </ul>
        </div>

        <div class="security-note">
          <strong>🔒 Security Note:</strong> If you didn't request this verification code, please ignore this email. Your account security is important to us.
        </div>

        <p>If you're having trouble with the code above, please contact our support team.</p>

        <div class="footer">
          <p>This email was sent by MedChain EMR System</p>
          <p>If you have any questions, please contact support@medchain-emr.com</p>
          <p>&copy; 2025 MedChain EMR. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send OTP email
const sendOtpEmail = async (email, otp, type = 'signup') => {
  try {
    const transporter = createTransporter();

    // Verify transporter configuration
    await transporter.verify();

    const subject = type === 'signup' ? 'Verify Your MedChain Account' : 'Password Reset Code';
    const html = generateOtpEmailTemplate(otp);

    const mailOptions = {
      from: {
        name: 'MedChain EMR',
        address: process.env.EMAIL_FROM || process.env.EMAIL_USER
      },
      to: email,
      subject: subject,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('OTP email sent successfully:', {
      messageId: info.messageId,
      email: email,
      type: type
    });

    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('Error sending OTP email:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};

// Test email configuration
const testEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email service is ready');
    return true;
  } catch (error) {
    console.error('Email service configuration error:', error);
    return false;
  }
};

module.exports = {
  sendOtpEmail,
  testEmailConnection,
  generateOtpEmailTemplate
};
