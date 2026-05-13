import styled from "styled-components";

/** Subtle background card for grouping related form fields */
export const FormSection = styled.div`
  width: 100%;
  background: #f6f6f9;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

/**
 * Two-column edit layout: main form on the left, sidebar details on the right.
 * Used inside drawer tabs where fields and metadata sit side by side.
 */
export const EditLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 256px;
  gap: 28px;
  align-items: start;
  padding-top: 24px;
`;

/** Right-hand sidebar inside an EditLayout */
export const EditSidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: 0;
`;

/** Small uppercase label for a form section */
export const SectionLabel = styled.p`
  font-size: 11px;
  font-weight: 700;
  color: #8e8ea9;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 4px;
`;

/** Subtle grid card for read-only metadata */
export const MetaCard = styled.div`
  background: #f6f6f9;
  border-radius: 8px;
  padding: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

export const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const MetaKey = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #8e8ea9;
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

export const MetaVal = styled.span`
  font-size: 13px;
  color: #32324d;
`;

/** Monospaced ID chip */
export const MonoChip = styled.code`
  display: inline;
  font-size: 11px;
  color: #4945ff;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  word-break: break-all;
  background: #f0f0ff;
  padding: 2px 6px;
  border-radius: 3px;
`;

/** Inline badge for showing a provider name */
export const ProviderBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: #f0f0ff;
  border: 1px solid #d9d8ff;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #4945ff;
  text-transform: capitalize;
`;

/** Warning/danger info card */
export const WarnCard = styled.div`
  background: #fcecea;
  border: 1px solid #f5c0b8;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

/** Success info card */
export const SuccessCard = styled.div`
  background: #eafbe7;
  border: 1px solid #c6efbd;
  border-radius: 8px;
  padding: 14px 16px;
`;

/** Preview pill — e.g. for expiry dates */
export const PreviewPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #fff3d3;
  border: 1px solid #f5d97f;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #8e6a00;
  width: fit-content;
`;

/** Linked account row */
export const AccountRow = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: white;
  border: 1px solid #dcdce4;
  border-radius: 8px;
  gap: 12px;
`;

/** Danger-tinted row for destructive actions */
export const DangerRow = styled(AccountRow)`
  background: #fef8f8;
  border-color: #f5c0b8;
`;

/** Role badge for organization memberships */
export const RoleBadge = styled.span<{ $role?: string }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
  background: ${(p) =>
    p.$role === "owner"
      ? "#f0f0ff"
      : p.$role === "admin"
        ? "#eafbe7"
        : "#f5f5f9"};
  border: 1px solid
    ${(p) =>
      p.$role === "owner"
        ? "#d9d8ff"
        : p.$role === "admin"
          ? "#c6efbd"
          : "#dcdce4"};
  color: ${(p) =>
    p.$role === "owner"
      ? "#4945ff"
      : p.$role === "admin"
        ? "#2e8044"
        : "#666687"};
`;
