const { UserRepository } = require("../repository/index.repository");
const { jwt, bcrypt } = require("../utils/imports.util");
const { JWT_KEY } = require("../config/serverConfig");

class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async #createToken(user) {
    try {
      const token = jwt.sign(user, JWT_KEY, { expiresIn: "1h" });
      return token;
    } catch (error) {
      console.log("Something Went Wrong: User Service: Create Token");
      throw { error };
    }
  }

  async #verifyToken(token) {
    try {
      const response = jwt.verify(token, JWT_KEY);
      return response;
    } catch (error) {
      console.log("Something Went Wrong: User Service: Verify Token");
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

  async signUp(data) {
    try {
      const user = await this.userRepository.signUp(data);
      return user;
    } catch (error) {
      console.log("Something Went Wrong: User Service: Create User");
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
}

module.exports = UserService;
