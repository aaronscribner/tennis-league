export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
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
          uri: 'http://localhost:3000/*',
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