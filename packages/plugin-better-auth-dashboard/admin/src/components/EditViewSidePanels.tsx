import { getEditViewSidePanels } from "../utils/editViewPanelRegistry";
import { FormSection, SectionLabel } from "./FormPrimitives";

interface Props {
  model: string;
  documentId?: string;
  // biome-ignore lint/suspicious/noExplicitAny: document shape varies by entity type
  document?: Record<string, any>;
}

export function EditViewSidePanels({ model, documentId, document }: Props) {
  const panels = getEditViewSidePanels(model);

  if (panels.length === 0) return null;

  return (
    <>
      {panels.map(({ id, title, Component }) => (
        <FormSection key={id}>
          <SectionLabel>{title}</SectionLabel>
          <Component
            model={model}
            documentId={documentId}
            document={document}
          />
        </FormSection>
      ))}
    </>
  );
}
