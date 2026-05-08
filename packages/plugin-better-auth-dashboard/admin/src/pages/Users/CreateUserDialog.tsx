import {
  Box,
  Button,
  Checkbox,
  Field,
  Flex,
  Modal,
  TextInput,
  Typography,
} from "@strapi/design-system";
import type React from "react";
import { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { client } from "../../client";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <Modal.Root
      defaultOpen
      onOpenChange={(open: boolean) => !open && onClose()}
    >
      <Modal.Content data-testid="create-user-dialog">
        <Modal.Header>
          <Typography variant="beta" tag="h2">
            Create User
          </Typography>
        </Modal.Header>
        <Modal.Body>
          <Box tag="form" onSubmit={handleSubmit}>
            <Flex direction="column" gap={4}>
              <Field.Root>
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
              <Field.Root>
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
              {!generatePassword && (
                <Field.Root hint="Leave blank to create a passwordless account">
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
              <Checkbox
                name="emailVerified"
                checked={emailVerified}
                onCheckedChange={(checked: boolean) =>
                  setEmailVerified(checked)
                }
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

              {createMutation.isError && (
                <Typography textColor="danger600" variant="pi">
                  {createMutation.error instanceof Error
                    ? createMutation.error.message
                    : "An error occurred"}
                </Typography>
              )}
            </Flex>
          </Box>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="tertiary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={createMutation.isLoading}
            onClick={handleSubmit}
            disabled={!name || !email}
          >
            Create
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}
