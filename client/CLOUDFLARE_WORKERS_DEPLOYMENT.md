# Deploying to Cloudflare Workers

This document provides instructions for deploying the Tennis League client application to Cloudflare Workers.

## Prerequisites

- Node.js (version 16 or higher)
- Cloudflare account
- Wrangler CLI installed and configured
- Valid Cloudflare account ID added to wrangler.toml

## Initial Setup

1. Make sure your Cloudflare account ID is added to the `wrangler.toml` file in the `account_id` field.

2. Install required dependencies:
   ```bash
   npm install
   ```

## Local Development with Cloudflare Workers

To develop locally using Cloudflare Workers:

1. Build your Angular application and start the Wrangler development server:
   ```bash
   npm run dev:worker
   ```

   This will build your Angular app and start a local development server that mimics the Cloudflare Workers environment.

2. View your application at the local URL provided by Wrangler (typically http://localhost:8787).

## Deployment Process

### Development Environment

To deploy to the Cloudflare Workers development environment:

```bash
npm run deploy:worker:dev
```

This will:
1. Build your Angular application with production settings
2. Deploy to Cloudflare Workers with the development environment settings
3. Make your application available at a workers.dev subdomain

### Production Environment

To deploy to the Cloudflare Workers production environment:

```bash
npm run deploy:worker:prod
```

Before running this command, make sure you've configured the appropriate route in the `wrangler.toml` file by uncommenting and updating the `route` setting in the `[env.production]` section.

## Configuration

### wrangler.toml

The `wrangler.toml` file contains all the configuration needed for Cloudflare Workers:

- `name`: The name of your Worker
- `account_id`: Your Cloudflare account ID
- `site.bucket`: Directory containing your built application files
- `main`: The main Worker script file
- Environment-specific configurations for development and production

### worker.js

The `worker.js` file contains the Worker script that handles requests to your application. It:

1. Serves static assets directly
2. Handles API requests appropriately
3. Implements client-side routing by serving index.html for all non-asset routes

## Troubleshooting

If you encounter issues during deployment:

1. Ensure your Cloudflare account has Workers enabled
2. Check that your account ID is correctly entered in wrangler.toml
3. Verify that your Worker script has the correct routing logic for your application
4. Check the Cloudflare dashboard for any errors or logs related to your Worker

For more information, refer to the [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/).