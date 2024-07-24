// Purpose: Import all the required modules in one place.
module.exports = {
  morgan: require("morgan"),
  helmet: require("helmet"),
  cors: require("cors"),
  express: require("express"),
  compression: require("compression"),
  dotenv: require("dotenv"),
  bodyParser: require("body-parser"),
  sequelize: require("sequelize"),
  bcrypt: require("bcrypt"),
  jwt: require("jsonwebtoken"),
  nodemailer: require("nodemailer"),
  googleapis: require("googleapis"),
  responseCodes: require("http-status-codes"),
  axios: require("axios"),
  amqplib: require("amqplib"),
};
