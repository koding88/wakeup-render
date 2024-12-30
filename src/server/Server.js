const express = require("express");
const logger = require("../utils/logger");

class Server {
    constructor(config, pingService) {
        this.port = config.port;
        this.pingService = pingService;
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        // Add response time header
        this.app.use((req, res, next) => {
            const start = Date.now();
            res.on("finish", () => {
                const duration = Date.now() - start;
                res.set("X-Response-Time", `${duration}ms`);
            });
            next();
        });

        // Basic security headers
        this.app.use((req, res, next) => {
            res.set({
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY",
                "X-XSS-Protection": "1; mode=block",
            });
            next();
        });

        // Request logging
        this.app.use((req, res, next) => {
            logger.info("Incoming request", {
                method: req.method,
                path: req.path,
                ip: req.ip,
            });
            next();
        });
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get("/", (req, res) => {
            res.json({
                status: "alive",
                lastPing: this.pingService.lastPingTime,
                uptime: process.uptime(),
            });
        });

        // Metrics endpoint
        this.app.get("/metrics", (req, res) => {
            res.json({
                ...this.pingService.getStatus(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                nodeVersion: process.version,
                environment: process.env.NODE_ENV,
            });
        });

        // Error handling
        this.app.use((err, req, res, next) => {
            logger.error("Server error", {
                error: err.message,
                stack: err.stack,
            });

            res.status(500).json({
                error: "Internal server error",
                message:
                    process.env.NODE_ENV === "development"
                        ? err.message
                        : undefined,
            });
        });
    }

    start() {
        return new Promise((resolve) => {
            this.server = this.app.listen(this.port, () => {
                logger.info(`Server started on port ${this.port}`);
                this.pingService.start();
                resolve();
            });

            this.server.on("error", (error) => {
                logger.error("Server error", { error: error.message });
                process.exit(1);
            });
        });
    }

    stop() {
        return new Promise((resolve) => {
            this.pingService.stop();
            if (this.server) {
                this.server.close(() => {
                    logger.info("Server stopped");
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = Server;
