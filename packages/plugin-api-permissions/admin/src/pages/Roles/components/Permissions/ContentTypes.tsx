import { Box } from "@strapi/design-system";
import { ContentTypeCollapses } from "./ContentTypeCollapses";
import { GlobalActions } from "./GlobalActions";

type ContentPermission = {
  actions: Array<{ actionId: string; label: string; subjects: string[] }>;
  subjects: Array<{ uid: string; label: string }>;
};

interface ContentTypesProps {
  layout: ContentPermission;
  kind: "collectionTypes" | "singleTypes";
  isFormDisabled?: boolean;
}

export function ContentTypes({
  layout: { actions, subjects },
  kind,
  isFormDisabled,
}: ContentTypesProps) {
  const sortedSubjects = [...subjects].sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  return (
    <Box background="neutral0">
      <GlobalActions
        actions={actions}
        kind={kind}
        isFormDisabled={isFormDisabled}
      />
      <ContentTypeCollapses
        actions={actions}
        subjects={sortedSubjects}
        pathToData={kind}
        isFormDisabled={isFormDisabled}
      />
    </Box>
  );
}
