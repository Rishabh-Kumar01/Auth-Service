const { dotenv, bcrypt } = require("../utils/imports.util");

dotenv.config();

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
};
