const utils = require("./utils/index.util");
const config = require("./config/index.config");
const routes = require("./routes/index.route");
const db = require("./models/index");

const app = utils.imports.express();

// Server & Database Connection
const setupAndStartServer = async () => {
  // Middlewares
  app.use(utils.imports.morgan("dev"));
  app.use(utils.imports.cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true, // Allow cookies to be sent
  }));
  app.use(utils.imports.helmet());
  app.use(utils.imports.compression());
  app.use(utils.imports.bodyParser.json());
  app.use(utils.imports.bodyParser.urlencoded({ extended: true }));
  app.use(utils.imports.cookieParser(config.serverConfig.COOKIE_SECRET));

  // Message Queue Connection
  await utils.messageQueue.getChannel();

  // Use the routes
  app.use("/api", routes);

  app.listen(config.serverConfig.PORT, async () => {
    console.log(`SERVER IS RUNNING ON PORT ${config.serverConfig.PORT}`);

    if (config.serverConfig.DB_SYNC === "true") {
      await db.sequelize.sync({ alter: true });
    }
    // await config.connection();
  });
};

// Call the function to start the server and connect to the database
setupAndStartServer();

// Home Route
app.get("/", (request, response) => {
  response.send("Hello Server!!!😊😊😊😊");
});

module.exports = app;
