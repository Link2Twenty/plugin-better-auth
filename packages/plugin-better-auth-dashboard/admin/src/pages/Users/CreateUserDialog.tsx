import {
  Box,
  Button,
  Checkbox,
  Field,
  Flex,
  Grid,
  TextInput,
  Typography,
} from "@strapi/design-system";
import type React from "react";
import { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { client } from "../../client";
import { Drawer } from "../../components/Drawer";

interface Props {
  onClose: () => void;
}

export function CreateUserDialog({ onClose }: Props) {
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [generatePassword, setGeneratePassword] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendVerificationEmail, setSendVerificationEmail] = useState(false);

  const createMutation = useMutation({
    mutationFn: async () => {
      const result = await client.dash.createUser({
        name,
        email,
        ...(generatePassword
          ? { generatePassword: true }
          : password
            ? { password }
            : {}),
        emailVerified,
        sendVerificationEmail,
      });
      if (result.error)
        throw new Error(result.error.message ?? "Create failed");
      return result.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dash-users"] });
      qc.invalidateQueries({ queryKey: ["dash-user-stats"] });
      onClose();
    },
  });

  const footer = (
    <>
      <Button variant="tertiary" onClick={onClose}>
        Cancel
      </Button>
      <Button
        loading={createMutation.isLoading}
        onClick={() => createMutation.mutate()}
        disabled={!name || !email}
        data-testid="create-user-submit"
      >
        Create user
      </Button>
    </>
  );

  return (
    <Drawer
      title="Create user"
      footer={footer}
      onClose={onClose}
      data-testid="create-user-drawer"
    >
      <Flex direction="column" gap={4}>
        {/* Basic info */}
        <Grid.Root gap={4}>
          <Grid.Item col={6}>
            <Field.Root style={{ width: "100%" }}>
              <Field.Label>Name</Field.Label>
              <TextInput
                name="name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
                required
                data-testid="new-user-name"
              />
            </Field.Root>
          </Grid.Item>
          <Grid.Item col={6}>
            <Field.Root style={{ width: "100%" }}>
              <Field.Label>Email</Field.Label>
              <TextInput
                name="email"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEmail(e.target.value)
                }
                required
                data-testid="new-user-email"
              />
            </Field.Root>
          </Grid.Item>
        </Grid.Root>

        {/* Password */}
        <Box
          paddingTop={4}
          borderColor="neutral150"
          borderStyle="solid"
          borderWidth="1px 0 0 0"
        >
          <Typography variant="sigma" textColor="neutral600" paddingBottom={3}>
            Password
          </Typography>
          <Flex direction="column" gap={3}>
            {!generatePassword && (
              <Field.Root
                style={{ width: "100%" }}
                hint="Leave blank to create a passwordless account"
              >
                <Field.Label>Password</Field.Label>
                <TextInput
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                />
                <Field.Hint />
              </Field.Root>
            )}
            <Checkbox
              name="generatePassword"
              checked={generatePassword}
              onCheckedChange={(checked: boolean) =>
                setGeneratePassword(checked)
              }
            >
              Generate a random password
            </Checkbox>
          </Flex>
        </Box>

        {/* Email verification */}
        <Box
          paddingTop={4}
          borderColor="neutral150"
          borderStyle="solid"
          borderWidth="1px 0 0 0"
        >
          <Typography variant="sigma" textColor="neutral600" paddingBottom={3}>
            Email verification
          </Typography>
          <Flex direction="column" gap={3}>
            <Checkbox
              name="emailVerified"
              checked={emailVerified}
              onCheckedChange={(checked: boolean) => setEmailVerified(checked)}
            >
              Mark email as verified
            </Checkbox>
            <Checkbox
              name="sendVerificationEmail"
              checked={sendVerificationEmail}
              onCheckedChange={(checked: boolean) =>
                setSendVerificationEmail(checked)
              }
            >
              Send verification email
            </Checkbox>
          </Flex>
        </Box>

        {createMutation.isError && (
          <Typography textColor="danger600" variant="pi">
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : "An error occurred"}
          </Typography>
        )}
      </Flex>
    </Drawer>
  );
}
