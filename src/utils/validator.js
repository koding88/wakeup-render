const validateConfig = (config) => {
    const errors = [];

    if (!config.port) {
        errors.push("Port is required");
    } else if (
        typeof config.port !== "number" ||
        config.port < 0 ||
        config.port > 65535
    ) {
        errors.push("Port must be a number between 0 and 65535");
    }

    if (!config.pingUrl) {
        errors.push("Ping URL is required");
    } else {
        try {
            new URL(config.pingUrl);
        } catch (e) {
            errors.push("Invalid ping URL format");
        }
    }

    if (
        config.interval &&
        (typeof config.interval !== "number" || config.interval < 1000)
    ) {
        errors.push("Interval must be a number greater than 1000ms");
    }

    if (
        config.retryDelay &&
        (typeof config.retryDelay !== "number" || config.retryDelay < 1000)
    ) {
        errors.push("Retry delay must be a number greater than 1000ms");
    }

    if (
        config.maxRetries &&
        (typeof config.maxRetries !== "number" || config.maxRetries < 1)
    ) {
        errors.push("Max retries must be a number greater than 0");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

module.exports = {
    validateConfig,
};
