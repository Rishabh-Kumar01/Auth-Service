const { User } = require("../models/index");

class UserRepository {
  constructor() {
    if (UserRepository.instance) {
      return UserRepository.instance;
    }
    UserRepository.instance = this;
  }

  async create(data) {
    try {
      const user = await User.create(data);
      return user;
    } catch (error) {
      console.log("Something Went Wrong: User Repository: Create User");
      throw { error };
    }
  }

  async destroy(userId) {
    try {
      await User.destroy({
        where: { id: userId },
      });
      return true;
    } catch (error) {
      console.log("Something Went Wrong: User Repository: Delete User");
      throw { error };
    }
  }

  async findAll() {
    try {
      const users = await User.findAll();
      return users;
    } catch (error) {
      console.log("Something Went Wrong: User Repository: Find All Users");
      throw { error };
    }
  }

  async findById(userId) {
    try {
      const user = await User.findByPk(userId);
      return user;
    } catch (error) {
      console.log("Something Went Wrong: User Repository: Find User By Id");
      throw { error };
    }
  }

  async update(userId, data) {
    try {
      const user = await User.findByPk(userId);
      user.set({
        ...data,
      });
      await user.save();
      return user;
    } catch (error) {
      console.log("Something Went Wrong: User Repository: Update User");
      throw { error };
    }
  }
}

module.exports = UserRepository;
