require("dotenv").config();
const { createWakeUpServer } = require("../src/index");

const config = {
    port: process.env.PORT1 || 3001,
    pingUrl: process.env.PING_URL1 || "http://localhost:3002",
    interval: parseInt(process.env.PING_INTERVAL1) || 300000, // 300 seconds
    retryDelay: 6000, // 6 seconds
    maxRetries: 10,
};

createWakeUpServer(config);
