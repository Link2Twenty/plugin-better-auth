import type { Core } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import crypto from "node:crypto";
import { hashPassword } from "better-auth/crypto";

const USER_UID = "plugin::better-auth.user" as const;
const ACCOUNT_UID = "plugin::better-auth.account" as const;
const VERIFICATION_UID = "plugin::better-auth.verification" as const;

const INVITE_TOKEN_EXPIRY_HOURS = 72; // 3 days

async function getPasswordHasher(strapi: Core.Strapi): Promise<(password: string) => Promise<string>> {
  const authConfig = (strapi as { internal_config?: Record<string, unknown> }).internal_config?.[
    "better-auth"
  ] as
    | { $context?: Promise<{ password?: { hash: (password: string) => Promise<string> } }> }
    | (() => { $context?: Promise<{ password?: { hash: (password: string) => Promise<string> } }> })
    | undefined;

  const auth = typeof authConfig === "function" ? authConfig() : authConfig;
  if (auth?.$context) {
    const ctx = await auth.$context;
    if (ctx?.password?.hash) {
      return ctx.password.hash;
    }
  }

  // Fallback: use better-auth's exported hashPassword (same algorithm as default)
  return (password: string) => hashPassword(password);
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Create an invite token for a user and store it in the verification table.
   * Returns the token (to include in the invite URL).
   */
  async createInviteToken(userId: number): Promise<string> {
    const user = await strapi.db.query(USER_UID).findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new errors.NotFoundError(`User with id ${userId} not found`);
    }

    // Check if user already has a credential account
    const existingAccount = await strapi.db.query(ACCOUNT_UID).findOne({
      where: {
        userId,
        providerId: "credential",
      },
    });

    if (existingAccount) {
      throw new errors.ApplicationError(
        "User already has a password set. Use password reset instead.",
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + INVITE_TOKEN_EXPIRY_HOURS);

    // Delete any existing invite tokens for this user (identifier format: invite:userId:token)
    const existingVerifications = await strapi.documents(VERIFICATION_UID).findMany({
      filters: {
        identifier: { $startsWith: `invite:${userId}:` },
      },
    });

    for (const v of existingVerifications) {
      await strapi.documents(VERIFICATION_UID).delete({
        documentId: (v as { documentId: string }).documentId,
      });
    }

    await strapi.documents(VERIFICATION_UID).create({
      data: {
        identifier: `invite:${userId}:${token}`,
        value: token,
        expiresAt,
      },
    });

    return token;
  },

  /**
   * Validate invite token and set password for the user.
   * Creates the credential account.
   */
  async setPasswordFromInviteToken(token: string, password: string): Promise<void> {
    const verifications = await strapi.documents(VERIFICATION_UID).findMany({
      filters: { identifier: { $startsWith: "invite:" } },
    });

    const verification = verifications.find((v) => {
      const ident = (v as unknown as { identifier: string }).identifier;
      return ident.endsWith(`:${token}`);
    });

    if (!verification) {
      throw new errors.ValidationError("Invalid or expired invite token");
    }

    const identifier = (verification as unknown as { identifier: string }).identifier;
    const expiresAt = (verification as unknown as { expiresAt: Date }).expiresAt;
    const documentId = (verification as { documentId: string }).documentId;

    if (new Date() > new Date(expiresAt)) {
      await strapi.documents(VERIFICATION_UID).delete({ documentId });
      throw new errors.ValidationError("Invite token has expired");
    }

    const match = identifier.match(/^invite:(\d+):/);
    if (!match) {
      throw new errors.ValidationError("Invalid invite token format");
    }

    const userId = Number(match[1]);

    const user = await strapi.db.query(USER_UID).findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new errors.NotFoundError("User not found");
    }

    const existingAccount = await strapi.db.query(ACCOUNT_UID).findOne({
      where: {
        userId,
        providerId: "credential",
      },
    });

    if (existingAccount) {
      throw new errors.ApplicationError("User already has a password set");
    }

    const hash = await getPasswordHasher(strapi);
    const hashedPassword = await hash(password);

    const userEmail = (user as { email: string }).email;

    await strapi.documents(ACCOUNT_UID).create({
      data: {
        accountId: userEmail,
        providerId: "credential",
        userId,
        password: hashedPassword,
      },
    });

    // Delete the verification record (one-time use)
    await strapi.documents(VERIFICATION_UID).delete({ documentId });
  },

  /**
   * Get the invite URL for a token (caller provides base URL).
   */
  getInviteUrl(baseUrl: string, token: string): string {
    const base = baseUrl.replace(/\/$/, "");
    return `${base}/invite/set-password?token=${token}`;
  },
});
