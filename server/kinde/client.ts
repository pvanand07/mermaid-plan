import {
  createKindeServerClient,
  GrantType,
  type ACClientOptions,
} from '@kinde-oss/kinde-typescript-sdk'
import { config } from '../config.js'

export const kindeClient = createKindeServerClient(
  GrantType.AUTHORIZATION_CODE,
  {
    authDomain: config.kinde.issuerUrl,
    clientId: config.kinde.clientId,
    clientSecret: config.kinde.clientSecret,
    redirectURL: config.kinde.redirectUrl,
    logoutRedirectURL: config.kinde.logoutRedirectUrl,
    scope: 'openid profile email offline',
  } as ACClientOptions,
)
