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

module.exports = {
  validateUserAuth,
};
