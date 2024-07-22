const router = require("../../utils/imports.util").express.Router();
const { UserController } = require("../../controllers/index.controller");
const { AuthRequestValidator } = require("../../middlewares/index.middleware");

/**
 * User Routes
 * @description: A list of routes that handle user related operations
 * @method POST: A route that creates a user
 * @method DELETE: A route that deletes a user
 * @method GET: A route that finds all users
 * @method GET: A route that finds a user by id
 * @method PUT: A route that updates a user
 */

/**
 * Request Method - POST
 * Route - api/v1/signup
 * Summary : Create a new user
 */
router.post(
  "/signup",
  AuthRequestValidator.validateUserAuth,
  UserController.signUp
);

/**
 * Request Method - GET
 * Route - api/v1/verify-email
 * Summary : Verify a user's email
 */
router.get("/verify-email", UserController.verifyEmail);

/**
 * Request Method - POST
 * Route - api/v1/login
 * Summary : Login a user
 */
router.post(
  "/login",
  AuthRequestValidator.validateUserLogin,
  UserController.logIn
);

/**
 * Request Method - GET
 * Route - api/v1/isAuthenticated
 * Summary : Check if a user is authenticated
 */
router.get("/isAuthenticated", UserController.isAuthenticated);

/**
 * Request Method - DELETE
 * Route - api/v1/:userId
 * Summary : Delete a user
 */
router.delete("/users/:userId", UserController.destroy);

/**
 * Request Method - GET
 * Route - api/v1
 * Summary : Get all users
 */
router.get("/users", UserController.findAll);

/**
 * Request Method - GET
 * Route - api/v1/:userId
 * Summary : Get a user by id
 */
router.get("/users/:userId", UserController.findById);

/**
 * Request Method - PUT
 * Route - api/v1/:userId
 * Summary : Update a user
 */
router.put("/users/:userId", UserController.update);

/**
 * Request Method - GET
 * Route - api/v1/isAdmin
 * Summary : Check if a user is an admin
 */
router.get(
  "/verify/isAdmin",
  AuthRequestValidator.validateIsAdmin,
  UserController.isAdmin
);

module.exports = router;
