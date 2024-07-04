const { dotenv, bcrypt } = require("../utils/imports.util");

dotenv.config();

module.exports = {
  PORT: process.env.PORT,
  SALT: bcrypt.genSaltSync(10),
};
