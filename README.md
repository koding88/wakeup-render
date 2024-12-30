# Wakeup Render

[![npm version](https://badge.fury.io/js/@koding88%2Fwakeup-render.svg)](https://www.npmjs.com/package/@koding88/wakeup-render)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight Node.js package that keeps your Render.com servers awake by implementing mutual pinging between servers. Perfect for preventing your free-tier Render servers from going to sleep after 15 minutes of inactivity.

## Features

- 🔄 Automatic mutual pinging between servers
- 📊 Built-in health check and metrics endpoints
- 🔒 HTTPS support with production-grade security
- 📝 Detailed logging with Winston
- ⚡ Smart retry mechanism with configurable parameters
- 🛡️ Security headers out of the box
- 🚀 Easy integration with existing Express apps

## Installation

```bash
npm install @koding88/wakeup-render
# or
yarn add @koding88/wakeup-render
```

## Quick Start

1. Create a `.env` file:
```env
PORT=3000
PING_URL=https://your-other-server.onrender.com
NODE_ENV=production
```

2. Create a simple server:
```javascript
require('dotenv').config();
const { createWakeUpServer } = require('@koding88/wakeup-render');

const config = {
    port: process.env.PORT || 3000,
    pingUrl: process.env.PING_URL,
    interval: 30000  // 30 seconds
};

createWakeUpServer(config);
```

## Integration with Existing Express App

If you already have an Express application, you can run the wake-up server alongside it:

```javascript
require('dotenv').config();
const express = require('express');
const { createWakeUpServer } = require('@koding88/wakeup-render');

// Your main Express app
const app = express();
app.get('/api/your-route', (req, res) => {
    res.json({ message: 'Hello from main app' });
});

// Start your main app
app.listen(4000, () => {
    console.log('Main application running on port 4000');
});

// Start wake-up server on a different port
const wakeupConfig = {
    port: process.env.WAKEUP_PORT || 3000,
    pingUrl: process.env.PING_URL,
    interval: 30000
};

createWakeUpServer(wakeupConfig);
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| port | number | 3000 | Port number for the wake-up server |
| pingUrl | string | required | URL of the server to ping |
| interval | number | 30000 | Ping interval in milliseconds |
| retryDelay | number | 5000 | Delay between retry attempts |
| maxRetries | number | 3 | Maximum number of retry attempts |

## API Endpoints

### Health Check
```http
GET /
```
Response:
```json
{
    "status": "alive",
    "lastPing": "2024-01-20T10:00:00.000Z",
    "uptime": 3600
}
```

### Metrics
```http
GET /metrics
```
Response:
```json
{
    "status": "running",
    "lastPingTime": "2024-01-20T10:00:00.000Z",
    "failedAttempts": 0,
    "pingUrl": "https://your-other-server.onrender.com",
    "interval": 30000,
    "uptime": 3600,
    "memory": {
        "heapUsed": 13721600,
        "heapTotal": 29876224,
        "external": 1841478
    }
}
```

## Deployment on Render.com

1. Create two servers on Render.com

2. For Server 1, set environment variables:
```env
PORT=3000
PING_URL=https://server2.onrender.com
NODE_ENV=production
```

3. For Server 2, set environment variables:
```env
PORT=3000
PING_URL=https://server1.onrender.com
NODE_ENV=production
```

4. Deploy both servers
   - The servers will automatically start pinging each other
   - Each server will stay awake due to the mutual pinging
   - Monitor the status through the /metrics endpoint

## Security Features

- HTTPS support with proper certificate validation in production
- Security headers:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
- Response time tracking
- Error handling with environment-aware responses

## Logging

The package uses Winston for logging with the following outputs:
- Console: Colored logs for development
- error.log: Error-level logs
- combined.log: All logs

## Best Practices

1. Use different ports for your main app and wake-up server
2. Set appropriate ping intervals (recommended: 30-60 seconds)
3. Monitor the /metrics endpoint for server health
4. Use environment variables for configuration
5. Enable NODE_ENV=production in production environments

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
