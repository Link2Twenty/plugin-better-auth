import {
  Button,
  Dialog,
  Field,
  Flex,
  TextInput,
  Toggle,
} from "@strapi/design-system";
import { useNotification } from "@strapi/strapi/admin";
import { useState } from "react";
import { useIntl } from "react-intl";
import { useMutation, useQueryClient } from "react-query";
import { client } from "../../client";

const PLUGIN_ID = "better-auth-dashboard";

interface Props {
  onClose: () => void;
}

export const CreateUserDialog = ({ onClose }: Props) => {
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [generatePassword, setGeneratePassword] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const mutation = useMutation(
    async () => {
      const result = await client.dash.createUser({
        name,
        email,
        password: generatePassword ? undefined : password,
        generatePassword,
        emailVerified,
      });
      if (result.error) throw new Error(result.error.message ?? "Failed to create user");
      return result.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([PLUGIN_ID, "users"]);
        queryClient.invalidateQueries([PLUGIN_ID, "user-stats"]);
        toggleNotification({
          type: "success",
          message: formatMessage({
            id: `${PLUGIN_ID}.users.create.success`,
            defaultMessage: "User created successfully",
          }),
        });
        onClose();
      },
      onError: () => {
        toggleNotification({
          type: "danger",
          message: formatMessage({
            id: `${PLUGIN_ID}.users.create.error`,
            defaultMessage: "Failed to create user",
          }),
        });
      },
    },
  );

  const isValid = name.trim() && email.trim() && (generatePassword || password.trim());

  return (
    <Dialog.Root defaultOpen onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content>
        <Dialog.Header>
          {formatMessage({
            id: `${PLUGIN_ID}.users.create.title`,
            defaultMessage: "Create user",
          })}
        </Dialog.Header>
        <Dialog.Body>
          <form
            id="create-user-form"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <Flex direction="column" gap={4}>
              <Field.Root required>
                <Field.Label>
                  {formatMessage({ id: "global.name", defaultMessage: "Name" })}
                </Field.Label>
                <TextInput
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                />
              </Field.Root>

              <Field.Root required>
                <Field.Label>
                  {formatMessage({ id: "global.email", defaultMessage: "Email" })}
                </Field.Label>
                <TextInput
                  type="email"
                  placeholder="jane@example.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>
                  {formatMessage({
                    id: `${PLUGIN_ID}.users.create.generatePassword`,
                    defaultMessage: "Generate password",
                  })}
                </Field.Label>
                <Toggle
                  checked={generatePassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setGeneratePassword(e.target.checked)
                  }
                  onLabel={formatMessage({ id: "app.components.Toggle.true", defaultMessage: "Yes" })}
                  offLabel={formatMessage({ id: "app.components.Toggle.false", defaultMessage: "No" })}
                />
              </Field.Root>

              {!generatePassword && (
                <Field.Root required>
                  <Field.Label>
                    {formatMessage({ id: "global.password", defaultMessage: "Password" })}
                  </Field.Label>
                  <TextInput
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPassword(e.target.value)
                    }
                  />
                </Field.Root>
              )}

              <Field.Root>
                <Field.Label>
                  {formatMessage({
                    id: `${PLUGIN_ID}.users.create.emailVerified`,
                    defaultMessage: "Email verified",
                  })}
                </Field.Label>
                <Toggle
                  checked={emailVerified}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmailVerified(e.target.checked)
                  }
                  onLabel={formatMessage({ id: "app.components.Toggle.true", defaultMessage: "Yes" })}
                  offLabel={formatMessage({ id: "app.components.Toggle.false", defaultMessage: "No" })}
                />
              </Field.Root>
            </Flex>
          </form>
        </Dialog.Body>
        <Dialog.Footer>
          <Button variant="tertiary" onClick={onClose}>
            {formatMessage({ id: "app.components.Button.cancel", defaultMessage: "Cancel" })}
          </Button>
          <Button
            type="submit"
            form="create-user-form"
            loading={mutation.isLoading}
            disabled={!isValid || mutation.isLoading}
          >
            {formatMessage({
              id: `${PLUGIN_ID}.users.create.submit`,
              defaultMessage: "Create",
            })}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
};
