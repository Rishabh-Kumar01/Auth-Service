const { User, Role } = require("../models/index");
const { ValidationError, ClientError } = require("../utils/index.util");
const { StatusCodes } = require("../utils/imports.util").responseCodes;

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

      if (!user) {
        console.log("User Not Created");
        throw { message: "User Not Created" };
      }

      const role = await Role.findByPk(data.roleId);

      if (!role) {
        console.log("Role Not Found");
        throw new ValidationError({
          name: "RoleNotFound",
          message: "Role Not Found",
        });
      }

      await user.addRole(role);

      return {
        id: user.id,
        email: user.email,
      };
    } catch (error) {
      if (
        error.name === "SequelizeValidationError" ||
        error.name === "SequelizeUniqueConstraintError"
      ) {
        throw new ValidationError(error);
      }
      console.log("Something Went Wrong: User Repository: Create User");
      throw error;
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
      if (!user) {
        console.log("User Not Found");
        throw new ClientError(
          "UserNotFound",
          "User Not Found",
          "User with the given ID is not found",
          StatusCodes.NOT_FOUND
        );
      }
      return user;
    } catch (error) {
      console.log("Something Went Wrong: User Repository: Find User By Id");
      throw error;
    }
  }

  async findByEmail(email) {
    try {
      const user = await User.findOne({
        where: { email },
      });
      if (!user) {
        console.log("User Not Found");
        throw new ClientError(
          "UserNotFound",
          "User Not Found",
          "User with the given Email is not found",
          StatusCodes.NOT_FOUND
        );
      }
      return user;
    } catch (error) {
      console.log("Something Went Wrong: User Repository: Find User By Email");
      throw error;
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

  async isAdmin(userId) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        console.log("User Not Found");
        throw { message: "User Not Found" };
      }
      console.log(user, "user");
      const adminRole = await Role.findOne({
        where: {
          name: "ADMIN",
        },
      });
      console.log(adminRole, "adminRole");
      return user.hasRole(adminRole);
    } catch (error) {
      console.log("Something Went Wrong: User Repository: Is Admin");
      throw { error };
    }
  }
}

module.exports = UserRepository;
