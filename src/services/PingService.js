const axios = require("axios");
const https = require("https");
const logger = require("../utils/logger");

class PingService {
    constructor(config) {
        this.pingUrl = config.pingUrl;
        this.interval = config.interval;
        this.retryDelay = config.retryDelay;
        this.maxRetries = config.maxRetries;
        this.lastPingTime = null;
        this.failedAttempts = 0;
        this.isRunning = false;

        this.axiosInstance = axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: process.env.NODE_ENV === "production",
            }),
            timeout: 10000,
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
            },
        });
    }

    async ping() {
        try {
            const response = await this.axiosInstance.get(this.pingUrl);
            this.lastPingTime = new Date();
            this.failedAttempts = 0;

            logger.info("Ping successful", {
                url: this.pingUrl,
                timestamp: this.lastPingTime,
                status: response.status,
                responseTime: response.headers["x-response-time"],
            });

            return true;
        } catch (error) {
            this.failedAttempts++;

            logger.error("Ping failed", {
                url: this.pingUrl,
                attempt: this.failedAttempts,
                error: error.message,
                code: error.code,
            });

            if (this.failedAttempts < this.maxRetries) {
                logger.info(`Retrying in ${this.retryDelay}ms...`);
                await new Promise((resolve) =>
                    setTimeout(resolve, this.retryDelay)
                );
                return this.ping();
            }

            this.failedAttempts = 0;
            return false;
        }
    }

    start() {
        if (this.isRunning) {
            logger.warn("Ping service is already running");
            return;
        }

        this.isRunning = true;
        this.intervalId = setInterval(async () => {
            await this.ping();
        }, this.interval);

        logger.info("Ping service started", {
            url: this.pingUrl,
            interval: this.interval,
        });
    }

    stop() {
        if (!this.isRunning) {
            return;
        }

        clearInterval(this.intervalId);
        this.isRunning = false;
        logger.info("Ping service stopped");
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            lastPingTime: this.lastPingTime,
            failedAttempts: this.failedAttempts,
            pingUrl: this.pingUrl,
            interval: this.interval,
        };
    }
}

module.exports = PingService;
