const { UserRepository } = require("../repository/index.repository");

class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async create(data) {
    try {
      const user = await this.userRepository.create(data);
      return user;
    } catch (error) {
      console.log("Something Went Wrong: User Service: Create User");
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
