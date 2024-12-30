const express = require('express');
const axios = require('axios');
const https = require('https');
const logger = require('./utils/logger');

class WakeUpServer {
    constructor(config = {}) {
        // Default config
        this.port = config.port || 3000;
        this.pingUrl = config.pingUrl;
        this.interval = config.interval || 30000;
        this.retryDelay = config.retryDelay || 5000;
        this.maxRetries = config.maxRetries || 3;
        
        // Server state
        this.lastPingTime = null;
        this.failedAttempts = 0;
        this.isRunning = false;

        // Setup axios instance
        this.axiosInstance = axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: process.env.NODE_ENV === 'production'
            }),
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
            }
        });
    }

    async ping() {
        try {
            const response = await this.axiosInstance.get(this.pingUrl);
            this.lastPingTime = new Date();
            this.failedAttempts = 0;
            logger.info(`✅ [${this.lastPingTime.toISOString()}] Ping successful to ${this.pingUrl}`);
            return true;
        } catch (error) {
            this.failedAttempts++;
            logger.error(`❌ Failed to ping ${this.pingUrl} (Attempt ${this.failedAttempts}/${this.maxRetries})`);

            if (this.failedAttempts < this.maxRetries) {
                logger.info(`⏳ Retrying in ${this.retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                return this.ping();
            }

            this.failedAttempts = 0;
            return false;
        }
    }

    setupServer() {
        const app = express();

        // Add response time header
        app.use((req, res, next) => {
            const start = Date.now();
            res.once('finish', () => {
                const duration = Date.now() - start;
                try {
                    res.set('X-Response-Time', `${duration}ms`);
                } catch (error) {
                    // Ignore header setting errors
                }
            });
            next();
        });

        // Basic security headers
        app.use((req, res, next) => {
            res.set({
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block'
            });
            next();
        });

        // Health check
        app.get('/', (req, res) => {
            res.json({
                status: 'alive',
                lastPing: this.lastPingTime,
                uptime: process.uptime()
            });
        });

        // Metrics
        app.get('/metrics', (req, res) => {
            res.json({
                status: this.isRunning ? 'running' : 'stopped',
                lastPingTime: this.lastPingTime,
                failedAttempts: this.failedAttempts,
                pingUrl: this.pingUrl,
                interval: this.interval,
                uptime: process.uptime(),
                memory: process.memoryUsage()
            });
        });

        // Error handler
        app.use((err, req, res, next) => {
            console.error('Server error:', err);
            res.status(500).json({
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        });

        return app;
    }

    start() {
        // Validate config
        if (!this.pingUrl) {
            throw new Error('PING_URL is required');
        }

        // Setup and start server
        const app = this.setupServer();
        const server = app.listen(this.port, () => {
            logger.info(`🚀 Server running on port ${this.port}`);
            logger.info(`📡 Pinging ${this.pingUrl} every ${this.interval}ms`);
        });

        // Start pinging
        this.isRunning = true;
        this.intervalId = setInterval(async () => {
            await this.ping();
        }, this.interval);

        // Handle shutdown
        const cleanup = async () => {
            logger.info('\n🛑 Shutting down...');
            clearInterval(this.intervalId);
            server.close();
            process.exit(0);
        };

        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);

        return server;
    }
}

function createWakeUpServer(config) {
    const server = new WakeUpServer(config);
    return server.start();
}

module.exports = { createWakeUpServer, WakeUpServer };
