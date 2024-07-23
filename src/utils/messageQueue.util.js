const { amqplib } = require("../utils/imports.util");
const { MESSAGE_BROKER_URL, EXCHANGE_NAME } =
  require("../config/index.config").serverConfig;

let connection = null;
let channel = null;

const getConnection = async () => {
  if (!connection) {
    connection = await amqplib.connect(MESSAGE_BROKER_URL);
    console.log("Created new connection");
  }
  return connection;
};

const getChannel = async () => {
  if (!channel) {
    const conn = await getConnection();
    channel = await conn.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, "direct", false);
    console.log("Created new channel");
  }
  return channel;
};

const publishMessage = async (bindingKey, message) => {
  try {
    const ch = await getChannel();
    await ch.assertQueue("REMINDER_QUEUE");
    await ch.publish(EXCHANGE_NAME, bindingKey, Buffer.from(message));
  } catch (error) {
    console.error("Error in publishMessage:", error);
    throw error;
  }
};

const subscribeMessage = async (service, bindingKey) => {
  try {
    const ch = await getChannel();
    const applicationQueue = await ch.assertQueue("REMINDER_QUEUE");

    ch.bindQueue(applicationQueue.queue, EXCHANGE_NAME, bindingKey);

    ch.consume(applicationQueue.queue, (msg) => {
      const data = JSON.parse(msg.content.toString());
      console.log(`Received message from ${service}: ${data}`);
      ch.ack(msg);
    });
  } catch (error) {
    console.error("Error in subscribeMessage:", error);
    throw error;
  }
};

const closeConnection = async () => {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    console.log("Closed RabbitMQ connection and channel");
  } catch (error) {
    console.error("Error closing RabbitMQ connection and channel:", error);
    throw error;
  }
};

module.exports = {
  getChannel,
  publishMessage,
  subscribeMessage,
  closeConnection,
};
