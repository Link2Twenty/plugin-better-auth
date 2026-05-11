import type React from "react";

export interface EditViewPanelProps {
  model: string;
  documentId?: string;
  // biome-ignore lint/suspicious/noExplicitAny: document shape varies by entity type
  document?: Record<string, any>;
}

export interface EditViewPanelConfig {
  id: string;
  title: string;
  /** Restrict to specific model(s). Omit to show in all edit views. */
  model?: string | string[];
  Component: React.ComponentType<EditViewPanelProps>;
}

const panels: EditViewPanelConfig[] = [];

export function addEditViewSidePanel(config: EditViewPanelConfig): void {
  if (panels.some((p) => p.id === config.id)) {
    console.warn(
      `[better-auth-dashboard] Panel with id "${config.id}" is already registered.`,
    );
    return;
  }
  panels.push(config);
}

export function getEditViewSidePanels(model: string): EditViewPanelConfig[] {
  return panels.filter((p) => {
    if (!p.model) return true;
    if (Array.isArray(p.model)) return p.model.includes(model);
    return p.model === model;
  });
}
