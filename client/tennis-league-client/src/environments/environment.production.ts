export const environment = {
  production: true,
  apiUrl: 'https://your-api-url.fly.dev',
  auth0: {
    domain: 'dev-ik81nhdv5j46bwjt.us.auth0.com',
    clientId: 'gZo9AwUnNoOBE2eQ8AdZytbR1zSIk41B',
    authorizationParams: {
      audience: 'xonOvNC3hTdvxDTzrFNo-Kpv-PXob2cOk_4qEEGuvUfB8nKGyGj2VAtI1vThaLpn',
      redirect_uri: window.location.origin + '/callback',
      scope: 'openid profile email'
    },
    errorPath: '/callback',
    httpInterceptor: {
      allowedList: [
        {
          uri: 'https://your-api-url.fly.dev/*',
          tokenOptions: {
            authorizationParams: {
              audience: 'xonOvNC3hTdvxDTzrFNo-Kpv-PXob2cOk_4qEEGuvUfB8nKGyGj2VAtI1vThaLpn'
            }
          }
        }
      ]
    }
  }
};