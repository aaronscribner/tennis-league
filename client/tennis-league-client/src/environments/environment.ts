export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  auth0: {
    domain: 'dev-ik81nhdv5j46bwjt.us.auth0.com',
    clientId: 'gZo9AwUnNoOBE2eQ8AdZytbR1zSIk41B',
    authorizationParams: {
      audience: 'TennisLeauge',
      redirect_uri: window.location.origin + '/callback',
      scope: 'openid profile email'
    },
    errorPath: '/callback',
    httpInterceptor: {
      allowedList: [
        {
          uri: 'http://localhost:3000/*',
          tokenOptions: {
            authorizationParams: {
              audience: 'TennisLeauge'
            }
          }
        }
      ]
    }
  }
};