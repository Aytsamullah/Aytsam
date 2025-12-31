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
    ].filter(Boolean); // Remote undefined/null values

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      // In development, we might just want to allow all, or if strictly desired, use the array.
      // For this user, allowing all in dev/test/ngrok scenarios might be easier, 
      // but let's stick to the list + env var for security best practice, 
      // AND allow if the origin matches the FRONTEND_URL.
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
