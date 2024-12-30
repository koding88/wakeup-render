require("dotenv").config();
const { createWakeUpServer } = require("../src/index");

const config = {
    port: process.env.PORT2 || 3002,
    pingUrl: process.env.PING_URL2 || "http://localhost:3001",
    interval: parseInt(process.env.PING_INTERVAL2) || 300000, // 300 seconds
    retryDelay: 6000, // 6 seconds
    maxRetries: 10,
};

createWakeUpServer(config);
