const { UserRepository } = require("../repository/index.repository");
const { jwt, bcrypt, googleapis } = require("../utils/imports.util");
const { serverConfig, nodemailerConfig } = require("../config/index.config");

class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async #createToken(user) {
    try {
      const token = jwt.sign(user, serverConfig.JWT_KEY, { expiresIn: "1h" });
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

      const message = `Click on the link to verify your email: http://localhost:8000/api/v1/verify-email?token=${emailToken}`;

      nodemailerConfig.sendEmail(user.email, "Email Verification", message);

      return user;
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        throw error;
      }
      console.log("Something Went Wrong: User Service: Create User");
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
      return user.id;
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
      console.log("Something Went Wrong: User Service: Find User By Id");
      throw { error };
    }
  }

  async update(userId, data) {
    try {
      const user = await this.userRepository.update(userId, data);
      return user;
    } catch (error) {
      console.log("Something Went Wrong: User Service: Update User");
      throw { error };
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
}

module.exports = UserService;
