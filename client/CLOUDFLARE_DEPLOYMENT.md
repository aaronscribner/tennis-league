# Deploying to Cloudflare Pages

This document provides instructions for deploying the Tennis League client application to Cloudflare Pages.

## Prerequisites

- Node.js (version 16 or higher)
- Cloudflare account
- Wrangler CLI installed (`npm install -g wrangler`)
- Cloudflare authentication set up (`wrangler login`)

## Local Development with Cloudflare

1. Build the application with the Cloudflare configuration:
   ```bash
   npm run cloudflare:build
   ```

2. Start a local development server using Wrangler:
   ```bash
   npm run cloudflare:dev
   ```

## Deployment Process

### Manual Deployment

To manually deploy the application to Cloudflare Pages:

1. Build and deploy in one step:
   ```bash
   npm run cloudflare:deploy
   ```

### Setting Up Continuous Deployment

1. Log in to the Cloudflare Dashboard
2. Navigate to Pages > Create a project > Connect to Git
3. Select your repository and configure the following build settings:
   - Framework preset: None
   - Build command: `npm run cloudflare:build`
   - Build output directory: `dist
   - Environment variables (if needed): Set according to your requirements
   
4. Deploy the site and you're ready to go!

## Important Files

- `.cloudflare/pages.toml` - Cloudflare Pages configuration
- `wrangler.toml` - Wrangler configuration for Cloudflare Workers/Pages
- `public/_redirects` - Handles client-side routing for single-page applications
- `public/_routes.json` - Defines route handling for Cloudflare Pages
- `src/environments/environment.cloudflare.ts` - Environment-specific configuration for Cloudflare deployment

## Testing Your Deployment

After deploying, verify the following functionality:
- Client-side routing works properly
- Authentication functions as expected
- API calls to your backend are working
- Static assets are loading correctly

## Troubleshooting

If you encounter issues with client-side routing, ensure that:
- The `_redirects` file is being properly included in the build output
- The `_routes.json` file is correctly configured
- Your Angular routes are properly defined

If API calls fail, check that the environment configuration is pointing to the correct API endpoint.