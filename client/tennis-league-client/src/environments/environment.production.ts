export const environment = {
  production: true,
  apiUrl: 'https://your-api-url.fly.dev',
  auth0: {
    domain: 'dev-ik81nhdv5j46bwjt.us.auth0.com',
    clientId: 'gZo9AwUnNoOBE2eQ8AdZytbR1zSIk41B',
    authorizationParams: {
      redirect_uri: window.location.origin + '/callback',
      audience: 'https://dev-ik81nhdv5j46bwjt.us.auth0.com/api/v2/',
      scope: 'openid profile email offline_access'
    },
    cacheLocation: 'localstorage' as const,
    useRefreshTokens: true,
    useRefreshTokensFallback: true,
    httpInterceptor: {
      allowedList: [
        {
          uri: 'https://your-api-url.fly.dev/*',
          tokenOptions: {
            authorizationParams: {
              audience: 'https://dev-ik81nhdv5j46bwjt.us.auth0.com/api/v2/'
            }
          }
        }
      ]
    }
  }
};