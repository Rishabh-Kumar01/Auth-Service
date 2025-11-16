const { dotenv, bcrypt } = require("../utils/imports.util");

dotenv.config();

// Parse COOKIE_MAX_AGE properly to handle string env vars
const parseCookieMaxAge = () => {
  const envValue = process.env.COOKIE_MAX_AGE;
  if (envValue) {
    const parsed = Number(envValue);
    return Number.isNaN(parsed) ? 7 * 24 * 60 * 60 * 1000 : parsed;
  }
  return 7 * 24 * 60 * 60 * 1000; // Default: 7 days
};

module.exports = {
  PORT: process.env.PORT,
  SALT: bcrypt.genSaltSync(10),
  JWT_KEY: process.env.JWT_KEY,
  EMAIL_VERIFY_KEY: process.env.EMAIL_VERIFY_KEY,
  USER: process.env.USER,
  PASS: process.env.PASS,
  SERVICE: process.env.SERVICE,
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
  REDIRECT_URI: process.env.REDIRECT_URI,
  REFRESH_TOKEN: process.env.REFRESH_TOKEN,
  DB_SYNC: process.env.DB_SYNC,
  MESSAGE_BROKER_URL: process.env.MESSAGE_BROKER_URL,
  REMINDER_BINDING_KEY: process.env.REMINDER_BINDING_KEY,
  EXCHANGE_NAME: process.env.EXCHANGE_NAME,
  // AWS Cognito Configuration
  AWS_REGION: process.env.AWS_REGION,
  COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
  COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
  COGNITO_CLIENT_SECRET: process.env.COGNITO_CLIENT_SECRET,
  // Cookie Configuration
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'default-secret-change-in-production',
  COOKIE_MAX_AGE: parseCookieMaxAge(),
};
