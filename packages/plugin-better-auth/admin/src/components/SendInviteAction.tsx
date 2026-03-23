import type { DocumentActionComponent } from "@strapi/content-manager/strapi-admin";
import { Mail } from "@strapi/icons";
import { getFetchClient, useNotification } from "@strapi/strapi/admin";
import * as React from "react";

const BETTER_AUTH_USER_MODEL = "plugin::better-auth.user";

/**
 * Send invite action - uses getFetchClient for auth and useNotification for feedback.
 */
const SendInviteAction: DocumentActionComponent = ({
  documentId,
  model,
  document,
}) => {
  const userId = document?.id ?? documentId;
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasCredentialAccount, setHasCredentialAccount] = React.useState<
    boolean | null
  >(null);
  const { toggleNotification } = useNotification();

  React.useEffect(() => {
    if (model !== BETTER_AUTH_USER_MODEL || userId == null) return;
    const { get } = getFetchClient();
    get(`/better-auth/users/${userId}/has-credential-account`)
      .then(({ data }) =>
        setHasCredentialAccount(data?.hasCredentialAccount ?? false),
      )
      .catch(() => setHasCredentialAccount(false));
  }, [model, userId]);

  const handleClick = React.useCallback(async () => {
    if (userId == null) return;
    setIsLoading(true);
    try {
      const { post } = getFetchClient();
      const { data } = await post(
        `/better-auth/users/${userId}/send-invite`,
        {},
      );

      if (data?.inviteUrl) {
        await navigator.clipboard.writeText(data.inviteUrl);
      }

      toggleNotification({
        type: "success",
        message: data?.message ?? "Invite sent. URL copied to clipboard.",
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ??
        (err instanceof Error ? err.message : "Failed to send invite");
      toggleNotification({
        type: "danger",
        message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toggleNotification]);

  if (model !== BETTER_AUTH_USER_MODEL) {
    return null;
  }
  if (userId == null || userId === undefined) {
    return null;
  }

  return {
    label: "Send invite",
    icon: React.createElement(Mail),
    onClick: handleClick,
    loading: isLoading,
    disabled: hasCredentialAccount === true,
    position: "panel",
    variant: "tertiary" as const,
  };
};

export default SendInviteAction;
