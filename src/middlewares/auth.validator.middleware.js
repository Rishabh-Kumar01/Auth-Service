const validateUserAuth = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      message: "Something Went Wrong",
      success: false,
      data: {},
      error: "Email and Password are required",
    });
  }
  next();
};

const validateIsAdmin = (req, res, next) => {
  console.log(req.body.userId, "validateIsAdmin");
  if (!req.body.userId) {
    return res.status(400).json({
      message: "Something Went Wrong",
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
