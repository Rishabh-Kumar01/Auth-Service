const { UserService } = require("../services/index.service");
const { StatusCodes } = require("../utils/imports.util").responseCodes;
const { serverConfig } = require("../config/index.config");
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
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: error.message || "Something Went Wrong",
          success: false,
          data: {},
          error: error.explanation || {},
        });
    }
  },

  async verifyEmail(req, res) {
    try {
      const user = await userService.verifyEmail(req.query.token);
      return res.status(StatusCodes.OK).json({
        message: user.message || "Email Verified Successfully",
        success: true,
        data: user.id ? user : {},
        error: {},
      });
    } catch (error) {
      console.log("Something Went Wrong: User Controller: Verify Email", error);
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: error.message || "Something Went Wrong",
          success: false,
          data: {},
          error: error.explanation || {},
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
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: error.message || "Something Went Wrong",
          success: false,
          data: {},
          error: error.explanation || {},
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
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: error.message || "Something Went Wrong",
          success: false,
          data: {},
          error: error.explanation || {},
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
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: error.message || "Something Went Wrong",
          success: false,
          data: {},
          error: error.explanation || {},
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
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: error.message || "Something Went Wrong",
          success: false,
          data: {},
          error: error.explanation || {},
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
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: error.message || "Something Went Wrong",
          success: false,
          data: {},
          error: error.explanation || {},
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
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: error.message || "Something Went Wrong",
          success: false,
          data: {},
          error: error.explanation || {},
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
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: error.message || "Something Went Wrong",
          success: false,
          data: {},
          error: error.explanation || {},
        });
    }
  },

  // ==================== AWS Cognito Endpoints ====================

  /**
   * Cognito Sign Up
   * Register a new user with AWS Cognito
   */
  async cognitoSignUp(req, res) {
    try {
      const result = await userService.cognitoSignUp({
        email: req.body.email,
        password: req.body.password,
        name: req.body.name,
        roleId: req.body.roleId,
      });

      return res.status(StatusCodes.CREATED).json({
        message: result.message,
        success: true,
        data: {
          userId: result.user.id,
          email: result.user.email,
          userSub: result.cognitoResult.userSub,
        },
        error: {},
      });
    } catch (error) {
      console.log("Something Went Wrong: User Controller: Cognito SignUp", error);
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: error.message || "Something Went Wrong",
          success: false,
          data: {},
          error: error.explanation || error,
        });
    }
  },

  /**
   * Cognito Confirm Sign Up
   * Verify email with confirmation code
   */
  async cognitoConfirmSignUp(req, res) {
    try {
      const result = await userService.cognitoConfirmSignUp(
        req.body.email,
        req.body.confirmationCode
      );

      return res.status(StatusCodes.OK).json({
        message: result.message,
        success: true,
        data: result,
        error: {},
      });
    } catch (error) {
      console.log("Something Went Wrong: User Controller: Cognito Confirm SignUp", error);
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: error.message || "Something Went Wrong",
          success: false,
          data: {},
          error: error.explanation || error,
        });
    }
  },

  /**
   * Cognito Sign In
   * Authenticate user and set tokens in cookies
   */
  async cognitoSignIn(req, res) {
    try {
      const result = await userService.cognitoSignIn(
        req.body.email,
        req.body.password
      );

      if (!result.success) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Authentication failed",
          success: false,
          data: result,
          error: {},
        });
      }

      // Set cookies for tokens
      const cookieOptions = {
        httpOnly: true, // Prevents JavaScript access
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        sameSite: "strict", // CSRF protection
        maxAge: serverConfig.COOKIE_MAX_AGE,
      };

      res.cookie("accessToken", result.accessToken, cookieOptions);
      res.cookie("refreshToken", result.refreshToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for refresh token
      });
      res.cookie("idToken", result.idToken, cookieOptions);

      // Store email in cookie for refresh token flow
      res.cookie("userEmail", req.body.email, {
        ...cookieOptions,
        httpOnly: false, // Allow client to read email
      });

      return res.status(StatusCodes.OK).json({
        message: "User Logged In Successfully",
        success: true,
        data: {
          user: result.user,
          expiresIn: result.expiresIn,
        },
        error: {},
      });
    } catch (error) {
      console.log("Something Went Wrong: User Controller: Cognito SignIn", error);
      return res
        .status(error.statusCode || StatusCodes.UNAUTHORIZED)
        .json({
          message: error.message || "Authentication failed",
          success: false,
          data: {},
          error: error.explanation || error,
        });
    }
  },

  /**
   * Cognito Refresh Token
   * Refresh access token using refresh token from cookies
   */
  async cognitoRefreshToken(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;
      const userEmail = req.cookies.userEmail;

      if (!refreshToken || !userEmail) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: "No refresh token found",
          success: false,
          data: {},
          error: {},
        });
      }

      const result = await userService.cognitoRefreshToken(refreshToken, userEmail);

      // Update access token and ID token in cookies
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: serverConfig.COOKIE_MAX_AGE,
      };

      res.cookie("accessToken", result.accessToken, cookieOptions);
      res.cookie("idToken", result.idToken, cookieOptions);

      return res.status(StatusCodes.OK).json({
        message: "Token refreshed successfully",
        success: true,
        data: {
          expiresIn: result.expiresIn,
        },
        error: {},
      });
    } catch (error) {
      console.log("Something Went Wrong: User Controller: Cognito Refresh Token", error);

      // Clear cookies on error
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res.clearCookie("idToken");
      res.clearCookie("userEmail");

      return res
        .status(error.statusCode || StatusCodes.UNAUTHORIZED)
        .json({
          message: error.message || "Token refresh failed",
          success: false,
          data: {},
          error: error.explanation || error,
        });
    }
  },

  /**
   * Cognito Sign Out
   * Sign out user and clear cookies
   */
  async cognitoSignOut(req, res) {
    try {
      const accessToken = req.cookies.accessToken;

      if (accessToken) {
        await userService.cognitoSignOut(accessToken);
      }

      // Clear all auth cookies
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res.clearCookie("idToken");
      res.clearCookie("userEmail");

      return res.status(StatusCodes.OK).json({
        message: "User signed out successfully",
        success: true,
        data: {},
        error: {},
      });
    } catch (error) {
      console.log("Something Went Wrong: User Controller: Cognito SignOut", error);

      // Clear cookies even on error
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res.clearCookie("idToken");
      res.clearCookie("userEmail");

      return res.status(StatusCodes.OK).json({
        message: "User signed out (with errors)",
        success: true,
        data: {},
        error: error.explanation || error,
      });
    }
  },

  /**
   * Cognito Is Authenticated
   * Check if user is authenticated using cookies
   */
  async cognitoIsAuthenticated(req, res) {
    try {
      const accessToken = req.cookies.accessToken;

      if (!accessToken) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: "No access token found",
          success: false,
          data: {},
          error: {},
        });
      }

      const user = await userService.cognitoIsAuthenticated(accessToken);

      return res.status(StatusCodes.OK).json({
        message: "User Authenticated Successfully",
        success: true,
        data: user,
        error: {},
      });
    } catch (error) {
      console.log("Something Went Wrong: User Controller: Cognito Is Authenticated", error);
      return res
        .status(error.statusCode || StatusCodes.UNAUTHORIZED)
        .json({
          message: error.message || "Authentication failed",
          success: false,
          data: {},
          error: error.explanation || error,
        });
    }
  },

  /**
   * Cognito Forgot Password
   * Initiate forgot password flow
   */
  async cognitoForgotPassword(req, res) {
    try {
      const result = await userService.cognitoForgotPassword(req.body.email);

      return res.status(StatusCodes.OK).json({
        message: "Password reset code sent to your email",
        success: true,
        data: result,
        error: {},
      });
    } catch (error) {
      console.log("Something Went Wrong: User Controller: Cognito Forgot Password", error);
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: error.message || "Something Went Wrong",
          success: false,
          data: {},
          error: error.explanation || error,
        });
    }
  },

  /**
   * Cognito Confirm Forgot Password
   * Confirm password reset with code
   */
  async cognitoConfirmForgotPassword(req, res) {
    try {
      const result = await userService.cognitoConfirmForgotPassword(
        req.body.email,
        req.body.confirmationCode,
        req.body.newPassword
      );

      return res.status(StatusCodes.OK).json({
        message: result.message,
        success: true,
        data: result,
        error: {},
      });
    } catch (error) {
      console.log(
        "Something Went Wrong: User Controller: Cognito Confirm Forgot Password",
        error
      );
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: error.message || "Something Went Wrong",
          success: false,
          data: {},
          error: error.explanation || error,
        });
    }
  },
};
