import { Button, Modal, Typography } from "@strapi/design-system";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal.Root
      defaultOpen
      onOpenChange={(open: boolean) => !open && onCancel()}
    >
      <Modal.Content>
        <Modal.Header>
          <Typography variant="beta" tag="h2">
            {title}
          </Typography>
        </Modal.Header>
        <Modal.Body>
          <Typography variant="omega">{message}</Typography>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="tertiary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant={variant} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}
