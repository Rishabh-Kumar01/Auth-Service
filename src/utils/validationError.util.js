const ErrorHandler = require("./errorHandler.util");
const { StatusCodes } = require("./imports.util").responseCodes;

class ValidationError extends ErrorHandler {
  constructor(error) {
    const errorName = error.name;
    const explanation = error.errors.map((err) => err.message);

    super(
      errorName,
      "Not able to validate the data sent by the user. Please check the data and try again.",
      explanation,
      StatusCodes.BAD_REQUEST
    );
  }
}

module.exports = ValidationError;
