const { StatusCodes } = require("./imports.util").responseCodes;
class ErrorHandler extends Error {
  constructor(
    name = "AppError",
    message = "Something Went Wrong",
    explanation = "Something Went Wrong",
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR
  ) {
    super();
    this.name = name;
    this.message = message;
    this.explanation = explanation;
    this.statusCode = statusCode;
  }
}

module.exports = ErrorHandler;
