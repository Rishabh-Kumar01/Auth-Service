const { UserService } = require("../services/index.service");
const { StatusCodes } = require("../utils/imports.util").responseCodes;
const userService = new UserService();

/**
 * User Controller
 * @description: Handles all user related operations
 * @method signUp: A method that creates a user
 * @method verifyEmail: A method that verifies a user's email by sending verification email
 * @method logIn: A method that logs in a user
 * @method isAuthenticated: A method that checks if a user is authenticated
 * @method destroy: A method that deletes a user
 * @method update: A method that updates a user
 * @method findAll: A method that finds all users
 * @method findById: A method that finds a user by id
 */

module.exports = {
  async signUp(req, res) {
    try {
      const user = await userService.signUp({
        email: req.body.email,
        password: req.body.password,
        roleId: req.body.roleId,
      });
      return res.status(StatusCodes.CREATED).json({
        message: "Verify Email To Complete Registration",
        success: true,
        data: user,
        error: {},
      });
    } catch (error) {
      console.log("Something Went Wrong: User Controller: SignUp User", error);
      return res.status(error.statusCode).json({
        message: error.message,
        success: false,
        data: {},
        error: {
          name: error.name,
          explanation: error.explanation,
        },
      });
    }
  },

  async verifyEmail(req, res) {
    try {
      const user = await userService.verifyEmail(req.query.token);
      return res.status(StatusCodes.OK).json({
        message: "Email Verified Successfully",
        success: true,
        data: user,
        error: {},
      });
    } catch (error) {
      console.log("Something Went Wrong: User Controller: Verify Email", error);
      return res.status(500).json({
        message: "Something Went Wrong",
        success: false,
        data: {},
        error: error,
      });
    }
  },

  async logIn(req, res) {
    try {
      const token = await userService.logIn(req.body.email, req.body.password);
      return res.status(StatusCodes.OK).json({
        message: "User Logged In Successfully",
        success: true,
        data: token,
        error: {},
      });
    } catch (error) {
      console.log("Something Went Wrong: User Controller: Log In User", error);
      return res.status(500).json({
        message: "Something Went Wrong",
        success: false,
        data: {},
        error: error,
      });
    }
  },

  async isAuthenticated(req, res) {
    try {
      const token = req.headers["x-access-token"];
      const response = await userService.isAuthenticated(token);
      return res.status(StatusCodes.OK).json({
        message: "User Authenticated Successfully",
        success: true,
        data: response,
        error: {},
      });
    } catch (error) {
      console.log(
        "Something Went Wrong: User Controller: Is Authenticated",
        error
      );
      return res.status(500).json({
        message: "Something Went Wrong",
        success: false,
        data: {},
        error: error,
      });
    }
  },

  async destroy(req, res) {
    try {
      await userService.destroy(req.params.userId);
      return res.status(StatusCodes.NO_CONTENT).json({
        message: "User Deleted Successfully",
        success: true,
        data: {},
        error: {},
      });
    } catch (error) {
      console.log("Something Went Wrong: User Controller: Delete User", error);
      return res.status(500).json({
        message: "Something Went Wrong",
        success: false,
        data: {},
        error: error,
      });
    }
  },

  async findAll(req, res) {
    try {
      const users = await userService.findAll();
      return res.status(StatusCodes.OK).json({
        message: "Fetched All Users Successfully",
        success: true,
        data: users,
        error: {},
      });
    } catch (error) {
      console.log(
        "Something Went Wrong: User Controller: Find All Users",
        error
      );
      return res.status(500).json({
        message: "Something Went Wrong",
        success: false,
        data: {},
        error: error,
      });
    }
  },

  async findById(req, res) {
    try {
      const user = await userService.findById(req.params.userId);
      return res.status(StatusCodes.OK).json({
        message: "Fetched User Successfully",
        success: true,
        data: user,
        error: {},
      });
    } catch (error) {
      console.log(
        "Something Went Wrong: User Controller: Find User By Id",
        error
      );
      return res.status(500).json({
        message: "Something Went Wrong",
        success: false,
        data: {},
        error: error,
      });
    }
  },

  async update(req, res) {
    try {
      const user = await userService.update(req.params.userId, {
        email: req.body.email,
        password: req.body.password,
      });
      return res.status(StatusCodes.NO_CONTENT).json({
        message: "User Updated Successfully",
        success: true,
        data: user,
        error: {},
      });
    } catch (error) {
      console.log("Something Went Wrong: User Controller: Update User", error);
      return res.status(500).json({
        message: "Something Went Wrong",
        success: false,
        data: {},
        error: error,
      });
    }
  },

  async isAdmin(req, res) {
    try {
      const isAdmin = await userService.isAdmin(req.body.userId);
      return res.status(StatusCodes.OK).json({
        message: "User Is Admin or Not",
        success: true,
        data: isAdmin,
        error: {},
      });
    } catch (error) {
      console.log("Something Went Wrong: User Controller: Is Admin", error);
      return res.status(500).json({
        message: "Something Went Wrong",
        success: false,
        data: {},
        error: error,
      });
    }
  },
};
