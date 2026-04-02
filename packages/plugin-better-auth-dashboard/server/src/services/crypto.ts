import { exportJWK, generateKeyPair, SignJWT } from "jose";
import type { KeyPair } from "../types";

export default () => {
  let keyPair: KeyPair | null = null;

  return {
    async hashApiKey(value: string): Promise<string> {
      const data = new TextEncoder().encode(value);
      const buf = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    },

    async mintInternalJwt(
      keyPair: KeyPair,
      apiKey: string,
      extra: Record<string, unknown> = {},
    ): Promise<string> {
      const apiKeyHash = await this.hashApiKey(apiKey);
      return new SignJWT({ apiKeyHash, ...extra })
        .setProtectedHeader({ alg: "RS256", kid: keyPair.kid })
        .setJti(crypto.randomUUID())
        .setIssuedAt()
        .setExpirationTime("5m")
        .sign(keyPair.privateKey);
    },

    async getKeyPair(): Promise<KeyPair> {
      if (keyPair) return keyPair;

      const { privateKey, publicKey } = await generateKeyPair("RS256");
      const kid = crypto.randomUUID();
      const publicJwk = {
        ...(await exportJWK(publicKey)),
        kid,
        alg: "RS256",
        use: "sig",
      };

      keyPair = { privateKey, publicJwk, kid };

      return keyPair;
    },
  };
};
