import { Button, Dialog, Field, Flex, TextInput } from "@strapi/design-system";
import { useNotification } from "@strapi/strapi/admin";
import { useState } from "react";
import { useIntl } from "react-intl";
import { useMutation, useQueryClient } from "react-query";
import { client } from "../../client";

const PLUGIN_ID = "better-auth-dashboard";

interface Props {
  onClose: () => void;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const CreateOrganizationDialog = ({ onClose }: Props) => {
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const mutation = useMutation(
    async ({ name, slug }: { name: string; slug: string }) => {
      const result = await (client as any).createDashOrganization({
        body: { name, slug },
      });
      if (result.error)
        throw new Error(
          result.error.message ?? "Failed to create organization",
        );
      return result.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([PLUGIN_ID, "organizations"]);
        toggleNotification({
          type: "success",
          message: formatMessage({
            id: `${PLUGIN_ID}.organizations.create.success`,
            defaultMessage: "Organization created successfully",
          }),
        });
        onClose();
      },
      onError: () => {
        toggleNotification({
          type: "danger",
          message: formatMessage({
            id: `${PLUGIN_ID}.organizations.create.error`,
            defaultMessage: "Failed to create organization",
          }),
        });
      },
    },
  );

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (!slugTouched) setSlug(slugify(e.target.value));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugTouched(true);
    setSlug(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ name, slug });
  };

  const isValid = name.trim() && slug.trim();

  return (
    <Dialog.Root defaultOpen onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content>
        <Dialog.Header>
          {formatMessage({
            id: `${PLUGIN_ID}.organizations.create.title`,
            defaultMessage: "Create organization",
          })}
        </Dialog.Header>
        <Dialog.Body>
          <form id="create-org-form" onSubmit={handleSubmit}>
            <Flex direction="column" gap={4}>
              <Field.Root required>
                <Field.Label>
                  {formatMessage({ id: "global.name", defaultMessage: "Name" })}
                </Field.Label>
                <TextInput
                  placeholder={formatMessage({
                    id: `${PLUGIN_ID}.organizations.create.name.placeholder`,
                    defaultMessage: "Acme Inc.",
                  })}
                  value={name}
                  onChange={handleNameChange}
                />
              </Field.Root>

              <Field.Root
                required
                hint={formatMessage({
                  id: `${PLUGIN_ID}.organizations.create.slug.hint`,
                  defaultMessage: "Unique URL-safe identifier",
                })}
              >
                <Field.Label>Slug</Field.Label>
                <TextInput
                  placeholder="acme-inc"
                  value={slug}
                  onChange={handleSlugChange}
                />
                <Field.Hint />
              </Field.Root>
            </Flex>
          </form>
        </Dialog.Body>
        <Dialog.Footer>
          <Button variant="tertiary" onClick={onClose}>
            {formatMessage({
              id: "app.components.Button.cancel",
              defaultMessage: "Cancel",
            })}
          </Button>
          <Button
            type="submit"
            form="create-org-form"
            loading={mutation.isLoading}
            disabled={!isValid || mutation.isLoading}
          >
            {formatMessage({
              id: `${PLUGIN_ID}.organizations.create.submit`,
              defaultMessage: "Create",
            })}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
};
