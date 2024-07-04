const mongoose = require("mongoose");
const serverConfig = require("./serverConfig");

module.exports = () =>
  mongoose
    .connect(serverConfig.DATABASE_URL)
    .then(() => console.log("CONNECTED TO DATABASE"))
    .catch((error) => console.log("DATABASE CONNECTION ERROR", error));
