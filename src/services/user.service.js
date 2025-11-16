const { UserRepository } = require("../repository/index.repository");
const { jwt, bcrypt, googleapis } = require("../utils/imports.util");
const { serverConfig, nodemailerConfig } = require("../config/index.config");
const { messageQueue } = require("../utils/index.util");
const cognitoService = require("./cognito.service");

class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async #createToken(user) {
    try {
      const token = jwt.sign(user, serverConfig.JWT_KEY, { expiresIn: "24h" });
      return token;
    } catch (error) {
      console.log("Something Went Wrong: User Service: Create Token");
      throw { error };
    }
  }

  async #createEmailToken(user) {
    try {
      const token = jwt.sign(user, serverConfig.EMAIL_VERIFY_KEY, {
        expiresIn: "1h",
      });
      return token;
    } catch (error) {
      console.log("Something Went Wrong: User Service: Create Email Token");
      throw { error };
    }
  }

  async #checkPassword(password, hashedPassword) {
    try {
      const response = await bcrypt.compare(password, hashedPassword);
      return response;
    } catch (error) {
      console.log("Something Went Wrong: User Service: Check Password");
      throw { error };
    }
  }

  async #verifyToken(token) {
    try {
      const response = jwt.verify(token, serverConfig.JWT_KEY);
      return response;
    } catch (error) {
      console.log("Something Went Wrong: User Service: Verify Token");
      throw { error };
    }
  }

  async #verifyEmailToken(token) {
    try {
      const response = jwt.verify(token, serverConfig.EMAIL_VERIFY_KEY);
      return response;
    } catch (error) {
      console.log("Something Went Wrong: User Service: Verify Email Token");
      throw { error };
    }
  }

  async signUp(data) {
    try {
      const user = await this.userRepository.signUp(data);

      const emailToken = await this.#createEmailToken({
        email: user.email,
      });

      const verificationLink = `http://localhost:8001/api/v1/verify-email?token=${emailToken}`;

      // nodemailerConfig.sendEmail(user.email, "Email Verification", message);
      const payload = {
        data: {
          email: user.email,
          verificationLink,
          userId: user.id,
        },
        service: "CREATE_USER",
      };
      messageQueue.publishMessage(
        serverConfig.REMINDER_BINDING_KEY,
        JSON.stringify(payload)
      );

      return user;
    } catch (error) {
      console.log("Something Went Wrong: User Service: Create User", error);
      if (
        error.name === "SequelizeValidationError" ||
        error.name === "SequelizeUniqueConstraintError"
      ) {
        throw error;
      }

      throw error;
    }
  }

  async verifyEmail(token) {
    try {
      const response = await this.#verifyEmailToken(token);

      if (!response) {
        console.log("Invalid Token");
        throw { message: "Invalid Token" };
      }

      const user = await this.userRepository.findByEmail(response.email);

      if (!user) {
        console.log("User Not Found");
        throw { message: "User Not Found" };
      }

      if (user.verified === true) {
        return {
          message: "Email Already Verified",
        };
      }

      const updatedUser = await this.userRepository.updateStatus(user.id);

      return updatedUser;
    } catch (error) {
      console.log("Something Went Wrong: User Service: Verify Email");
      throw { error };
    }
  }

  async logIn(email, password) {
    try {
      const user = await this.userRepository.findByEmail(email);

      if (!user) {
        console.log("User Not Found");
        throw { message: "User Not Found" };
      }

      const isPasswordValid = await this.#checkPassword(
        password,
        user.password
      );

      if (!isPasswordValid) {
        console.log("Invalid Password");
        throw { message: "Invalid Password" };
      }

      const token = await this.#createToken({
        id: user.id,
        email: user.email,
      });

      return token;
    } catch (error) {
      console.log("Something Went Wrong: User Service: Log In User");
      throw { error };
    }
  }

  async isAuthenticated(token) {
    try {
      const response = await this.#verifyToken(token);
      if (!response) {
        console.log("Invalid Token");
        throw { message: "Invalid Token" };
      }

      const user = await this.userRepository.findById(response.id);

      if (!user) {
        console.log("User Not Found");
        throw { message: "User Not Found" };
      }
      
      return user;
    } catch (error) {
      console.log("Something Went Wrong: User Service: Is Authenticated");
      throw { error };
    }
  }

  async destroy(userId) {
    try {
      const user = await this.userRepository.destroy(userId);
      return user;
    } catch (error) {
      console.log("Something Went Wrong: User Service: Delete User");
      throw { error };
    }
  }

  async findAll() {
    try {
      const users = await this.userRepository.findAll();
      return users;
    } catch (error) {
      console.log("Something Went Wrong: User Service: Find All Users");
      throw { error };
    }
  }

  async findById(userId) {
    try {
      const user = await this.userRepository.findById(userId);
      return user;
    } catch (error) {
      if (error.name === "UserNotFound") {
        throw error;
      }
      console.log("Something Went Wrong: User Service: Find User By Id");
      throw error;
    }
  }

  async update(userId, data) {
    try {
      const user = await this.userRepository.update(userId, data);
      return user;
    } catch (error) {
      if (error.name === "UserNotFound") {
        throw error;
      }
      console.log("Something Went Wrong: User Service: Update User");
      throw error;
    }
  }

  async isAdmin(userId) {
    try {
      const isAdmin = await this.userRepository.isAdmin(userId);
      return isAdmin;
    } catch (error) {
      console.log("Something Went Wrong: User Service: Is Admin");
      throw { error };
    }
  }

  // ==================== AWS Cognito Methods ====================

  /**
   * Sign up user with AWS Cognito
   * @param {object} data - User signup data
   * @returns {Promise<object>} User signup result
   */
  async cognitoSignUp(data) {
    try {
      // Sign up in Cognito
      const cognitoResult = await cognitoService.signUp(
        data.email,
        data.password,
        {
          name: data.name || "",
        }
      );

      // Store user in local database with Cognito reference
      const user = await this.userRepository.signUp({
        ...data,
        cognitoUserId: cognitoResult.userSub,
        verified: cognitoResult.userConfirmed,
      });

      return {
        success: true,
        user,
        cognitoResult,
        message: "User registered. Please check your email for verification code.",
      };
    } catch (error) {
      console.log("Something Went Wrong: User Service: Cognito SignUp", error);
      throw error;
    }
  }

  /**
   * Confirm user signup with verification code
   * @param {string} email - User email
   * @param {string} confirmationCode - Verification code
   * @returns {Promise<object>} Confirmation result
   */
  async cognitoConfirmSignUp(email, confirmationCode) {
    try {
      const result = await cognitoService.confirmSignUp(email, confirmationCode);

      // Update user verification status in database
      const user = await this.userRepository.findByEmail(email);
      if (user) {
        await this.userRepository.updateStatus(user.id);
      }

      return result;
    } catch (error) {
      console.log("Something Went Wrong: User Service: Cognito Confirm SignUp", error);
      throw error;
    }
  }

  /**
   * Sign in user with AWS Cognito
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<object>} Authentication tokens
   */
  async cognitoSignIn(email, password) {
    try {
      const result = await cognitoService.signIn(email, password);

      // Fetch user from database
      const user = await this.userRepository.findByEmail(email);

      return {
        ...result,
        user: user
          ? {
              id: user.id,
              email: user.email,
              verified: user.verified,
            }
          : null,
      };
    } catch (error) {
      console.log("Something Went Wrong: User Service: Cognito SignIn", error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @param {string} email - User email
   * @returns {Promise<object>} New tokens
   */
  async cognitoRefreshToken(refreshToken, email) {
    try {
      const result = await cognitoService.refreshToken(refreshToken, email);
      return result;
    } catch (error) {
      console.log("Something Went Wrong: User Service: Cognito Refresh Token", error);
      throw error;
    }
  }

  /**
   * Sign out user from AWS Cognito
   * @param {string} accessToken - User's access token
   * @returns {Promise<object>} Sign out result
   */
  async cognitoSignOut(accessToken) {
    try {
      const result = await cognitoService.signOut(accessToken);
      return result;
    } catch (error) {
      console.log("Something Went Wrong: User Service: Cognito SignOut", error);
      throw error;
    }
  }

  /**
   * Get user details from Cognito access token
   * @param {string} accessToken - User's access token
   * @returns {Promise<object>} User details
   */
  async cognitoGetUser(accessToken) {
    try {
      const result = await cognitoService.getUser(accessToken);

      // Also fetch user from local database
      if (result.success && result.userAttributes.email) {
        const user = await this.userRepository.findByEmail(result.userAttributes.email);
        return {
          ...result,
          localUser: user,
        };
      }

      return result;
    } catch (error) {
      console.log("Something Went Wrong: User Service: Cognito Get User", error);
      throw error;
    }
  }

  /**
   * Initiate forgot password flow
   * @param {string} email - User email
   * @returns {Promise<object>} Forgot password result
   */
  async cognitoForgotPassword(email) {
    try {
      const result = await cognitoService.forgotPassword(email);
      return result;
    } catch (error) {
      console.log("Something Went Wrong: User Service: Cognito Forgot Password", error);
      throw error;
    }
  }

  /**
   * Confirm forgot password with verification code
   * @param {string} email - User email
   * @param {string} confirmationCode - Verification code
   * @param {string} newPassword - New password
   * @returns {Promise<object>} Confirmation result
   */
  async cognitoConfirmForgotPassword(email, confirmationCode, newPassword) {
    try {
      const result = await cognitoService.confirmForgotPassword(
        email,
        confirmationCode,
        newPassword
      );
      return result;
    } catch (error) {
      console.log(
        "Something Went Wrong: User Service: Cognito Confirm Forgot Password",
        error
      );
      throw error;
    }
  }

  /**
   * Authenticate user using Cognito access token from cookies
   * @param {string} accessToken - Access token from cookies
   * @returns {Promise<object>} User details
   */
  async cognitoIsAuthenticated(accessToken) {
    try {
      const result = await this.cognitoGetUser(accessToken);

      if (!result.success) {
        throw { message: "Invalid or expired token" };
      }

      return result.localUser || result.userAttributes;
    } catch (error) {
      console.log("Something Went Wrong: User Service: Cognito Is Authenticated", error);
      throw error;
    }
  }
}

module.exports = UserService;
