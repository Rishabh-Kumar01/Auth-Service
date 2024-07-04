// Purpose: Import all the required modules in one place.
module.exports = {
  mongoose: require("mongoose"),
  morgan: require("morgan"),
  helmet: require("helmet"),
  cors: require("cors"),
  express: require("express"),
  compression: require("compression"),
  expressValidator: require("express-validator"),
  dotenv: require("dotenv"),
  bodyParser: require("body-parser"),
  sequelize: require("sequelize"),
};
