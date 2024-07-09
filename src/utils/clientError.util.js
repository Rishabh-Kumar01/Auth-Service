const ErrorHandler = require("./errorHandler.util");

class ClientError extends ErrorHandler {
  constructor(name, message, explanation, statusCode) {
    super(name, message, explanation, statusCode);
  }
}

module.exports = ClientError;
