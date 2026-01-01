const cors = require('cors');

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      process.env.FRONTEND_URL // Allow Vercel deployment URL
    ].filter(Boolean); // Remove undefined/null values

    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed || origin.startsWith(allowed);
      }
      return false;
    });

    // Allow Vercel domains (any *.vercel.app domain)
    const isVercelDomain = origin.includes('.vercel.app');

    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // Allow if in allowed list or is Vercel domain
    if (isAllowed || isVercelDomain) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'ngrok-skip-browser-warning' // Required to bypass ngrok warning page
  ]
};

module.exports = cors(corsOptions);
