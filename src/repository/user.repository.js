const { User } = require("../models/index");

class UserRepository {
  constructor() {
    if (UserRepository.instance) {
      return UserRepository.instance;
    }
    UserRepository.instance = this;
  }

  async signUp(data) {
    try {
      const user = await User.create({
        email: data.email,
        password: data.password,
      });
      return {
        id: user.id,
        email: user.email,
      };
    } catch (error) {
      console.log("Something Went Wrong: User Repository: Create User");
      throw { error };
    }
  }

  async updateStatus(userId) {
    try {
      const user = await User.findByPk(userId);
      user.set({
        verified: true,
      });
      await user.save();

      return {
        id: user.id,
        email: user.email,
        verified: user.verified,
      };
    } catch (error) {
      console.log("Something Went Wrong: User Repository: Update User Status");
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
      const users = await User.findAll({
        attributes: ["id", "email"],
      });
      return users;
    } catch (error) {
      console.log("Something Went Wrong: User Repository: Find All Users");
      throw { error };
    }
  }

  async findById(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: ["id", "email"],
      });
      return user;
    } catch (error) {
      console.log("Something Went Wrong: User Repository: Find User By Id");
      throw { error };
    }
  }

  async findByEmail(email) {
    try {
      const user = await User.findOne({
        where: { email },
      });
      return user;
    } catch (error) {
      console.log("Something Went Wrong: User Repository: Find User By Email");
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
