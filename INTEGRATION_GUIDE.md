# MedChain EMR - OTP Authentication Integration Guide

## 🎉 Integration Complete!

The OTP signup system has been successfully integrated with your existing MedChain EMR web application. The frontend now communicates with the production-ready backend API.

## 📋 What's Been Integrated

### ✅ **Backend Features**
- **Patient Signup** with CNIC, Email, Password validation
- **6-digit OTP Generation** with bcrypt hashing
- **5-minute OTP Expiry** with automatic cleanup
- **3-attempt Verification Limit** per OTP
- **2-minute Resend Cooldown** to prevent abuse
- **Account Activation** only after OTP verification
- **JWT Authentication** with secure tokens
- **Rate Limiting** and security middleware

### ✅ **Frontend Updates**
- **Real API Integration** - Replaced simulated OTP with backend calls
- **Loading States** - Visual feedback during API calls
- **Error Handling** - User-friendly error messages
- **JWT Token Management** - Automatic token storage/retrieval
- **Auto Authentication** - Restore session on page refresh
- **Enhanced UX** - Better visual feedback and countdown timers

## 🚀 Setup & Testing Guide

### 1. **Configure MongoDB**

Choose one of the following options:

#### Option A: Local MongoDB
```bash
# Install MongoDB Community Server
# Download from: https://www.mongodb.com/try/download/community
# Start MongoDB service
```

#### Option B: MongoDB Atlas (Cloud) - Recommended
```bash
# 1. Go to https://cloud.mongodb.com
# 2. Create free account and cluster
# 3. Get connection string: mongodb+srv://username:password@cluster.mongodb.net/medchain-emr
```

### 2. **Configure Email Service**

Update `backend/.env` with your email credentials:

#### Gmail Setup (Easiest)
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM=noreply@medchain-emr.com
```

**To get Gmail App Password:**
1. Enable 2FA on your Google account
2. Go to Google Account Settings → Security → App passwords
3. Generate password for "Mail"
4. Use that password in EMAIL_PASS

#### Other Email Providers
```env
# SendGrid
EMAIL_HOST=smtp.sendgrid.net
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key

# AWS SES
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_USER=your-ses-smtp-username
EMAIL_PASS=your-ses-smtp-password
```

### 3. **Update Database Connection**

In `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/medchain-emr
# OR for Atlas: mongodb+srv://username:password@cluster.mongodb.net/medchain-emr
```

### 4. **Start the Application**

#### Terminal 1: Backend
```bash
cd backend
npm run dev
```
Should see: `Server running in development mode on port 5000`

#### Terminal 2: Frontend
```bash
npm run dev
```
Should see: `Local: http://localhost:3000`

### 5. **Test the Integration**

#### **Signup Flow:**
1. Open `http://localhost:3000`
2. Click "Sign Up"
3. Select "I am a Patient"
4. Fill form:
   - Full Name: `John Doe`
   - CNIC: `12345-1234567-1`
   - Email: `your-email@example.com`
   - Password: `SecurePass123`
5. Click "Continue to Verification"
6. **Check your email** for the 6-digit OTP
7. Enter OTP and complete registration

#### **Login Flow:**
1. Click "Sign In"
2. Select role
3. Enter email and password
4. Click "Verify & Sign In"

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register patient (sends OTP) |
| POST | `/api/auth/verify-otp` | Verify OTP and activate account |
| POST | `/api/auth/resend-otp` | Resend verification OTP |
| POST | `/api/auth/login` | Authenticate user |
| GET | `/api/auth/profile` | Get user profile (protected) |
| GET | `/health` | Health check |

## 🛡️ Security Features

### **OTP Security**
- ✅ **Hashed Storage** - OTPs encrypted with bcrypt
- ✅ **Expiry** - 5-minute automatic expiration
- ✅ **Attempt Limits** - Max 3 verification attempts
- ✅ **Cooldown** - 2-minute resend prevention
- ✅ **Single Use** - OTPs invalidated after use

### **Rate Limiting**
- ✅ **General**: 100 requests/15min per IP
- ✅ **OTP Requests**: 5/hour per IP
- ✅ **Verification**: 10 attempts/30min per IP
- ✅ **Resend**: 3 requests/hour per IP
- ✅ **Auth Attempts**: 10/15min per IP

### **Authentication**
- ✅ **JWT Tokens** - Secure stateless authentication
- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **Session Management** - Automatic token refresh
- ✅ **Protected Routes** - Role-based access control

## 🐛 Troubleshooting

### **Backend Won't Start**
```bash
# Check if MongoDB is running
# Windows: services.msc → MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Check .env configuration
# Run: npm run test (in backend directory)
```

### **Email Not Sending**
```bash
# Verify email credentials in .env
# Test with Gmail App Password (not regular password)
# Check spam folder
# Verify SMTP settings for your provider
```

### **Frontend API Errors**
```bash
# Ensure backend is running on port 5000
# Check browser console for CORS errors
# Verify .env API_BASE_URL matches backend port
```

### **Database Connection Issues**
```bash
# For Atlas: Whitelist your IP (0.0.0.0/0 for testing)
# Check connection string format
# Verify network connectivity
```

## 🎯 Production Deployment

### **Environment Variables**
Set these in production:
```env
NODE_ENV=production
MONGODB_URI=your-production-mongodb-url
JWT_SECRET=your-production-jwt-secret
EMAIL_*=your-production-email-settings
```

### **Security Checklist**
- [ ] Change JWT secrets
- [ ] Use production email service
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Configure monitoring
- [ ] Set up proper CORS origins

## 📞 Support

### **Common Issues:**
1. **"MongoDB connection error"** → Check MongoDB is running
2. **"Email not sent"** → Verify email credentials
3. **"CORS error"** → Backend not running or wrong port
4. **"Invalid OTP"** → Check email spam folder

### **Testing Commands:**
```bash
# Backend health check
curl http://localhost:5000/health

# API test
cd backend && npm test

# Full system test
# 1. Start backend: npm run dev
# 2. Start frontend: npm run dev (in root)
# 3. Test signup flow in browser
```

## 🚀 Next Steps

1. **Test thoroughly** with different email providers
2. **Add user profile management** (name, avatar, etc.)
3. **Implement password reset** functionality
4. **Add email verification** for email changes
5. **Set up monitoring** and error tracking
6. **Deploy to production** with proper security

---

**🎉 Your MedChain EMR now has enterprise-grade authentication!**

The system is production-ready with proper security, rate limiting, error handling, and user experience. All authentication now goes through the secure backend API with real OTP verification.
