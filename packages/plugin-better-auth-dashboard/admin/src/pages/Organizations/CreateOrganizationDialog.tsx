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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!slug || slug === slugify(name)) {
      setSlug(slugify(val));
    }
  };

  const footer = (
    <>
      <Button variant="tertiary" onClick={onClose}>
        Cancel
      </Button>
      <Button
        loading={createMutation.isLoading}
        disabled={!name || !slug || !ownerId}
        onClick={() => createMutation.mutate()}
      >
        Create organization
      </Button>
    </>
  );

  return (
    <Drawer
      title="Create organization"
      footer={footer}
      onClose={onClose}
    >
      <Flex direction="column" gap={4}>
        {/* Name + Slug */}
        <Grid.Root gap={4}>
          <Grid.Item col={6}>
            <Field.Root style={{ width: "100%" }}>
              <Field.Label>Name</Field.Label>
              <TextInput
                name="name"
                value={name}
                onChange={handleNameChange}
                required
              />
            </Field.Root>
          </Grid.Item>
          <Grid.Item col={6}>
            <Field.Root hint="URL-safe identifier" style={{ width: "100%" }}>
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
          </Grid.Item>
        </Grid.Root>

        {/* Logo URL */}
        <Field.Root style={{ width: "100%" }} hint="Optional URL of the organization logo">
          <Field.Label>Logo URL</Field.Label>
          <TextInput
            name="logo"
            type="url"
            value={logo}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setLogo(e.target.value)
            }
          />
          <Field.Hint />
        </Field.Root>

        {/* Owner */}
        <UserCombobox
          label="Owner"
          hint="The user who will own this organization"
          value={ownerId}
          onChange={setOwnerId}
          required
        />

        {/* Teams */}
        {teamsEnabled && (
          <Box
            paddingTop={4}
            borderColor="neutral150"
            borderStyle="solid"
            borderWidth="1px 0 0 0"
          >
            <Typography
              variant="sigma"
              textColor="neutral600"
              paddingBottom={3}
            >
              Teams
            </Typography>
            <Flex direction="column" gap={3}>
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
                <Field.Root
                  style={{ width: "100%" }}
                  hint="Leave blank to use the default team name"
                >
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
            </Flex>
          </Box>
        )}

        {createMutation.isError && (
          <Typography textColor="danger600" variant="pi">
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : "Create failed"}
          </Typography>
        )}
      </Flex>
    </Drawer>
  );
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
