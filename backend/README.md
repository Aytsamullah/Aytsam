# MedChain EMR - Backend API

A production-ready Node.js/Express backend with email OTP authentication system for patient registration.

## Features

- **Patient Registration**: CNIC, Email, and Password signup
- **Email OTP Verification**: 6-digit OTP with 5-minute expiry
- **Security Features**:
  - OTP hashing with bcrypt
  - Rate limiting (3 verification attempts max)
  - Resend cooldown (2 minutes)
  - JWT authentication
  - Password hashing
  - CORS protection
  - Helmet security headers
- **Database**: MongoDB with Mongoose ODM
- **Email Service**: Nodemailer with HTML templates

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcryptjs, helmet, express-rate-limit
- **Email**: nodemailer
- **Validation**: express-validator

## Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   └── authController.js    # Authentication logic
├── middleware/
│   ├── auth.js             # JWT authentication middleware
│   ├── cors.js             # CORS configuration
│   ├── errorHandler.js     # Global error handling
│   ├── rateLimit.js        # Rate limiting configurations
│   └── validation.js       # Input validation
├── models/
│   ├── User.js             # User model
│   └── OTP.js              # OTP model
├── routes/
│   └── auth.js             # Authentication routes
├── services/
│   └── emailService.js     # Email service with nodemailer
├── utils/
│   ├── jwt.js              # JWT utilities
│   └── otp.js              # OTP utilities
├── .env.example            # Environment variables template
├── package.json            # Dependencies
├── server.js               # Main server file
└── README.md               # This file
```

## Environment Setup

Create a `.env` file in the backend directory with the following variables:

```env
# Environment
NODE_ENV=development

# Server
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/medchain-emr

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-secure
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-token-secret-key-here
JWT_REFRESH_EXPIRES_IN=30d

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@medchain-emr.com
```

## Installation & Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Fill in your configuration values

3. **Set up MongoDB:**
   - Install MongoDB locally or use MongoDB Atlas
   - Update `MONGODB_URI` in your `.env` file

4. **Configure email service:**
   - For Gmail: Enable 2FA and create an App Password
   - For other providers: Update EMAIL_* variables accordingly

5. **Start the server:**
   ```bash
   npm start
   ```

   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication Routes

#### POST `/api/auth/signup`
Register a new patient account.

**Request Body:**
```json
{
  "cnic": "12345-1234567-1",
  "email": "patient@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully. Please check your email for verification code.",
  "data": {
    "user": {
      "id": "...",
      "email": "patient@example.com",
      "cnic": "12345-1234567-1",
      "isVerified": false
    }
  }
}
```

#### POST `/api/auth/verify-otp`
Verify account with OTP.

**Request Body:**
```json
{
  "email": "patient@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account verified successfully",
  "data": {
    "user": {
      "id": "...",
      "email": "patient@example.com",
      "cnic": "12345-1234567-1",
      "isVerified": true,
      "role": "patient"
    },
    "token": "jwt-token-here"
  }
}
```

#### POST `/api/auth/resend-otp`
Resend verification OTP.

**Request Body:**
```json
{
  "email": "patient@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "New verification code sent to your email"
}
```

#### POST `/api/auth/login`
Login with verified account.

**Request Body:**
```json
{
  "email": "patient@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "email": "patient@example.com",
      "cnic": "12345-1234567-1",
      "isVerified": true,
      "role": "patient"
    },
    "token": "jwt-token-here"
  }
}
```

#### GET `/api/auth/profile` (Protected)
Get current user profile.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

## Security Features

### OTP Security
- **Hashing**: OTPs are hashed using bcrypt before storage
- **Expiry**: 5-minute expiry with automatic cleanup
- **Attempt Limits**: Maximum 3 verification attempts per OTP
- **Cooldown**: 2-minute cooldown between resend requests
- **Single Use**: OTPs can only be used once

### Rate Limiting
- **General API**: 100 requests per 15 minutes per IP
- **OTP Requests**: 5 requests per hour per IP
- **OTP Verification**: 10 attempts per 30 minutes per IP
- **Resend OTP**: 3 requests per hour per IP
- **Auth Attempts**: 10 attempts per 15 minutes per IP

### Authentication
- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Account Verification**: Email verification required before login
- **Role-based Access**: Support for different user roles

## Error Handling

The API uses consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"] // for validation errors
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request / Validation Error
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## Development

### Scripts
- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon
- `npm test`: Run tests

### Testing Email Service
You can test the email configuration by calling the health endpoint:
```bash
curl http://localhost:5000/health
```

### Database Indexes
The system automatically creates necessary indexes for:
- OTP expiry (TTL index for automatic cleanup)
- User email uniqueness
- CNIC uniqueness

## Production Deployment

1. **Environment Variables**: Set production values in your deployment platform
2. **Database**: Use MongoDB Atlas or a production MongoDB instance
3. **Email Service**: Use a transactional email service (SendGrid, AWS SES, etc.)
4. **SSL/HTTPS**: Ensure HTTPS is enabled
5. **Monitoring**: Set up logging and monitoring
6. **Backup**: Configure database backups

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include input validation
4. Update documentation
5. Test thoroughly

## License

This project is part of the MedChain EMR system.
