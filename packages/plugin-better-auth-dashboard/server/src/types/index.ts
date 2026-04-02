import type { KeyObject } from "jose";

export interface KeyPair {
  privateKey: KeyObject;
  publicJwk: Record<string, unknown>;
  kid: string;
}
