/**
 * Tennis League Client - Cloudflare Worker
 * This worker serves the Angular application and handles SPA routing
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Serve static assets directly
  if (url.pathname.startsWith('/assets/') || 
      url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.css') || 
      url.pathname.endsWith('.ico') || 
      url.pathname.endsWith('.png') || 
      url.pathname.endsWith('.jpg') || 
      url.pathname.endsWith('.svg') || 
      url.pathname.endsWith('.webp')) {
    return await getAssetFromKV(request);
  }

  // For API requests, pass them through (adjust the API_URL as needed)
  if (url.pathname.startsWith('/api/')) {
    // This assumes your API is hosted at a different domain/worker
    // You might need to adjust this based on your actual API setup
    return fetch(request);
  }

  // For all other requests, serve index.html (SPA routing)
  try {
    // Clone the request but change the URL to target index.html
    const indexRequest = new Request(`${url.origin}/index.html`, request);
    return await getAssetFromKV(indexRequest);
  } catch (e) {
    return new Response('Not Found', { status: 404 });
  }
}

// This is necessary because we're using Cloudflare's KV storage via Workers Sites
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';