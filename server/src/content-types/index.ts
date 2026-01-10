import account from "./account";
import jwk from "./jwk";
import oauthAccessToken from "./oauth-access-token";
import oauthApplication from "./oauth-application";
import oauthConsent from "./oauth-consent";
import passkey from "./passkey";
import rateLimit from "./rate-limit";
import session from "./session";
import twoFactor from "./two-factor";
import user from "./user";
import verification from "./verification";

export default {
  user: { schema: user },
  session: { schema: session },
  account: { schema: account },
  verification: { schema: verification },
  "two-factor": { schema: twoFactor },
  passkey: { schema: passkey },
  "oauth-application": { schema: oauthApplication },
  "oauth-access-token": { schema: oauthAccessToken },
  "oauth-consent": { schema: oauthConsent },
  jwk: { schema: jwk },
  "rate-limit": { schema: rateLimit },
};
