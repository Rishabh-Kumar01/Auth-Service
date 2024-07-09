const { StatusCodes } = require("../utils/imports.util").responseCodes;

const validateUserAuth = (req, res, next) => {
  const { email, password, roleId } = req.body;
  if ((!email || !password, !roleId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Please provide required fields",
      success: false,
      data: {},
      error: "Email, Password and roleId are required",
    });
  }
  next();
};

const validateIsAdmin = (req, res, next) => {
  console.log(req.body.userId, "validateIsAdmin");
  if (!req.body.userId) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Please provide required fields",
      success: false,
      data: {},
      error: "User ID is required",
    });
  }
  next();
};

module.exports = {
  validateUserAuth,
  validateIsAdmin,
};
