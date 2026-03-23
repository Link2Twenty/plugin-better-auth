import type { Core } from "@strapi/strapi";
import { errors } from "@strapi/utils";

const USER_UID = "plugin::better-auth.user" as const;
const ACCOUNT_UID = "plugin::better-auth.account" as const;

const inviteController = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Send invite to a user (admin only).
   * Creates invite token and returns the invite URL.
   * Uses Strapi's email plugin by default, or a custom sendInviteEmail callback if configured.
   */
  async sendInvite(ctx: {
    params: { id: string };
    request: { body?: { callbackURL?: string } };
    body: unknown;
  }) {
    const userId = Number(ctx.params.id);
    if (Number.isNaN(userId)) {
      throw new errors.ValidationError("Invalid user ID");
    }

    const inviteService = strapi.plugin("better-auth").service("invite");
    const token = await inviteService.createInviteToken(userId);

    const fullPluginConfig = strapi.config.get("plugin::better-auth") as
      | {
          inviteBaseUrl?: string;
          sendInviteEmail?: (params: {
            user: { email: string; name: string };
            inviteUrl: string;
            strapi: Core.Strapi;
          }) => Promise<void>;
        }
      | undefined;

    const callbackURL = ctx.request.body?.callbackURL;
    const inviteBaseUrl = fullPluginConfig?.inviteBaseUrl;
    const serverUrl = strapi.config.get("server.url") as string | undefined;
    const baseUrl =
      callbackURL ??
      inviteBaseUrl ??
      serverUrl ??
      `http://${strapi.config.get("server.host", "localhost")}:${strapi.config.get("server.port", 1337)}`;

    const inviteUrl = inviteService.getInviteUrl(baseUrl, token);

    const user = await strapi.db.query(USER_UID).findOne({
      where: { id: userId },
    });

    let emailSent = false;

    if (fullPluginConfig?.sendInviteEmail) {
      if (user) {
        await fullPluginConfig.sendInviteEmail({
          user: user as { email: string; name: string },
          inviteUrl,
          strapi,
        });
        emailSent = true;
      }
    } else if (user?.email && strapi.plugins?.email) {
      // Use Strapi's built-in email plugin when no custom sendInviteEmail is configured
      try {
        await strapi.plugin("email").service("email").send({
          to: (user as { email: string }).email,
          subject: "Set your password",
          html: `Hi${(user as { name?: string }).name ? ` ${(user as { name: string }).name}` : ""},<br><br>Click here to set your password: <a href="${inviteUrl}">${inviteUrl}</a>`,
        });
        emailSent = true;
      } catch {
        // Email provider may not be configured; invite URL is still returned
      }
    }

    ctx.body = {
      success: true,
      inviteUrl,
      message:
        "Invite created. " +
        (emailSent
          ? "Invite email sent."
          : "Configure Strapi's email plugin or plugin.better-auth.sendInviteEmail to send emails automatically."),
    };
  },

  /**
   * Set password from invite token (public endpoint).
   */
  async setPasswordFromInvite(ctx: {
    request: { body?: { token?: string; password?: string } };
    body: unknown;
  }) {
    const { token, password } = ctx.request.body ?? {};

    if (!token || typeof token !== "string") {
      throw new errors.ValidationError("Token is required");
    }
    if (!password || typeof password !== "string") {
      throw new errors.ValidationError("Password is required");
    }

    const minLength = 8;
    if (password.length < minLength) {
      throw new errors.ValidationError(`Password must be at least ${minLength} characters`);
    }

    const inviteService = strapi.plugin("better-auth").service("invite");
    await inviteService.setPasswordFromInviteToken(token, password);

    ctx.body = {
      success: true,
      message: "Password set successfully. You can now sign in with your email and password.",
    };
  },

  /**
   * Check if a user has a credential account (for showing/hiding Send invite button).
   */
  async hasCredentialAccount(ctx: { params: { id: string }; body: unknown }) {
    const userId = Number(ctx.params.id);
    if (Number.isNaN(userId)) {
      throw new errors.ValidationError("Invalid user ID");
    }

    const account = await strapi.db.query(ACCOUNT_UID).findOne({
      where: {
        userId,
        providerId: "credential",
      },
    });

    ctx.body = { hasCredentialAccount: !!account };
  },

});

export default inviteController;
