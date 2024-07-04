const router = require("../../utils/imports.util").express.Router();
const { UserController } = require("../../controllers/index.controller");

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
 * Route - api/v1/user/signup
 * Summary : Create a new user
 */
router.post("/signup", UserController.create);

/**
 * Request Method - DELETE
 * Route - api/v1/user/:userId
 * Summary : Delete a user
 */
router.delete("/:userId", UserController.destroy);

/**
 * Request Method - GET
 * Route - api/v1/user
 * Summary : Get all users
 */
router.get("/", UserController.findAll);

/**
 * Request Method - GET
 * Route - api/v1/user/:userId
 * Summary : Get a user by id
 */
router.get("/:userId", UserController.findById);

/**
 * Request Method - PUT
 * Route - api/v1/user/:userId
 * Summary : Update a user
 */
router.put("/:userId", UserController.update);

module.exports = router;
