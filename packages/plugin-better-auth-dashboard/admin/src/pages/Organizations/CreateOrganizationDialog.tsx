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
import { UserCombobox } from "../../components/UserCombobox";
import { withContext } from "../../utils/dashContext";

interface Props {
  teamsEnabled: boolean;
  onClose: () => void;
}

export function CreateOrganizationDialog({ teamsEnabled, onClose }: Props) {
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logo, setLogo] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [skipDefaultTeam, setSkipDefaultTeam] = useState(false);
  const [defaultTeamName, setDefaultTeamName] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const result = await client.dash.organization.create(
        {
          name,
          slug,
          ...(logo ? { logo } : {}),
          ...(teamsEnabled && !skipDefaultTeam && defaultTeamName
            ? { defaultTeamName }
            : {}),
        },
        withContext({ userId: ownerId, skipDefaultTeam }),
      );
      if (result.error)
        throw new Error(result.error.message ?? "Create failed");
      return result.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dash-organizations"] });
      onClose();
    },
  });

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!slug || slug === slugify(name)) {
      setSlug(slugify(val));
    }
  };

  return (
    <Modal.Root defaultOpen onOpenChange={(open) => !open && onClose()}>
      <Modal.Content>
        <Modal.Header>
          <Typography variant="beta" tag="h2">
            Create Organization
          </Typography>
        </Modal.Header>
        <Modal.Body>
          <Flex direction="column" gap={4}>
            <Field.Root>
              <Field.Label>Name</Field.Label>
              <TextInput
                name="name"
                value={name}
                onChange={handleNameChange}
                required
              />
            </Field.Root>
            <Field.Root hint="URL-safe identifier for the organization">
              <Field.Label>Slug</Field.Label>
              <TextInput
                name="slug"
                value={slug}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSlug(e.target.value)
                }
                required
              />
              <Field.Hint />
            </Field.Root>
            <Field.Root>
              <Field.Label>Logo URL</Field.Label>
              <TextInput
                name="logo"
                type="url"
                value={logo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLogo(e.target.value)
                }
              />
            </Field.Root>
            <Field.Root>
              <Field.Label>Owner</Field.Label>
              <UserCombobox
                hint="The user who will own this organization"
                value={ownerId}
                onChange={setOwnerId}
                required
              />
            </Field.Root>

            {teamsEnabled && (
              <>
                <Checkbox
                  name="skipDefaultTeam"
                  checked={skipDefaultTeam}
                  onCheckedChange={(checked: boolean) =>
                    setSkipDefaultTeam(checked)
                  }
                >
                  Skip creating a default team
                </Checkbox>
                {!skipDefaultTeam && (
                  <Field.Root hint="Leave blank to use the default team name">
                    <Field.Label>Default team name</Field.Label>
                    <TextInput
                      name="defaultTeamName"
                      value={defaultTeamName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setDefaultTeamName(e.target.value)
                      }
                    />
                    <Field.Hint />
                  </Field.Root>
                )}
              </>
            )}

            {createMutation.isError && (
              <Typography textColor="danger600" variant="pi">
                {createMutation.error instanceof Error
                  ? createMutation.error.message
                  : "Create failed"}
              </Typography>
            )}
          </Flex>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="tertiary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={createMutation.isLoading}
            disabled={!name || !slug || !ownerId}
            onClick={() => createMutation.mutate()}
          >
            Create
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
