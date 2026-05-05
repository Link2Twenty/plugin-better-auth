import {
  Box,
  Flex,
  IconButton,
  Portal,
  Typography,
} from "@strapi/design-system";
import { Cross } from "@strapi/icons";
import type { ReactNode } from "react";
import { useEffect } from "react";

interface DrawerProps {
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  "data-testid"?: string;
}

export function Drawer({
  title,
  children,
  footer,
  onClose,
  "data-testid": testId,
}: DrawerProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <Portal>
      <div style={{ position: "fixed", inset: 0, zIndex: 9999 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(33,33,52,0.4)",
          }}
          onClick={onClose}
          aria-hidden="true"
        />
        <Box
          background="neutral0"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: "min(760px, 95vw)",
            display: "flex",
            flexDirection: "column",
            boxShadow: "-8px 0 32px rgba(33,33,52,0.16)",
          }}
          data-testid={testId}
        >
          <Flex
            justifyContent="space-between"
            alignItems="center"
            paddingTop={5}
            paddingBottom={5}
            paddingLeft={6}
            paddingRight={6}
            borderColor="neutral150"
            borderStyle="solid"
            borderWidth="0 0 1px 0"
            style={{ flexShrink: 0 }}
          >
            <Typography variant="beta" tag="h2">
              {title}
            </Typography>
            <IconButton label="Close panel" onClick={onClose}>
              <Cross />
            </IconButton>
          </Flex>

          <Box
            paddingTop={6}
            paddingBottom={6}
            paddingLeft={6}
            paddingRight={6}
            style={{ flex: 1, overflowY: "auto" }}
          >
            {children}
          </Box>

          {footer && (
            <Flex
              justifyContent="flex-end"
              gap={2}
              paddingTop={4}
              paddingBottom={4}
              paddingLeft={6}
              paddingRight={6}
              borderColor="neutral150"
              borderStyle="solid"
              borderWidth="1px 0 0 0"
              style={{ flexShrink: 0 }}
            >
              {footer}
            </Flex>
          )}
        </Box>
      </div>
    </Portal>
  );
}
