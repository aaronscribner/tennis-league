# Deploying the Tennis League API to Cloudflare Workers

This guide explains how to deploy the Tennis League API to Cloudflare Workers using GitHub Actions.

## Prerequisites

1. A Cloudflare account with Workers enabled
2. GitHub repository access with the ability to set repository secrets

## Setup Instructions

### 1. Configure Cloudflare

1. Log in to your Cloudflare account
2. Get your Account ID from the dashboard
3. Create an API Token with "Workers Scripts" write permission
4. Note your Zone ID if you're using a custom domain

### 2. Set up GitHub Secrets

Add the following secrets to your GitHub repository:

1. `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
2. `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

### 3. Configure Environment Variables

For sensitive information like database credentials, JWT secrets, etc., use Cloudflare Workers secrets:

```bash
# Install Wrangler CLI if you haven't already
npm install -g wrangler

# Log in to Cloudflare
wrangler login

# Set secrets (you'll be prompted to enter values)
wrangler secret put JWT_SECRET --env production
wrangler secret put DATABASE_URL --env production
# Add other secrets as needed
```

### 4. Manual Deployment (if needed)

To deploy manually:

```bash
cd api
npm run build
npx wrangler deploy --env production
```

## How It Works

1. When code is pushed to the `main` branch with changes in the `api/` directory, the GitHub Action workflow is triggered
2. The workflow builds the API and deploys it to Cloudflare Workers
3. The API will be available at your configured domain or the Workers default domain

## Troubleshooting

- Check GitHub Action logs for build or deployment errors
- Verify that all necessary secrets and environment variables are set
- Ensure your wrangler.toml file is properly configured
- Check Cloudflare Workers dashboard for any runtime errors