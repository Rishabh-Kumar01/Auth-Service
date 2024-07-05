const { UserRepository } = require("../repository/index.repository");
const { jwt } = require("../utils/imports.util");
const { JWT_KEY } = require("../config/serverConfig");

class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async signup(data) {
    try {
      const user = await this.userRepository.signup(data);
      return user;
    } catch (error) {
      console.log("Something Went Wrong: User Service: Create User");
      throw { error };
    }
  }

  async createToken(user) {
    try {
      const token = jwt.sign(user, JWT_KEY, (expiresIn = "1h"));
      return token;
    } catch (error) {
      console.log("Something Went Wrong: User Service: Create Token");
      throw { error };
    }
  }

  async verifyToken(token) {
    try {
      const response = jwt.verify(token, JWT_KEY);
      return response;
    } catch (error) {
      console.log("Something Went Wrong: User Service: Verify Token", error);
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
