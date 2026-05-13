import type { ComponentType } from "react";

export interface StrapiMediaFile {
  id: number;
  name: string;
  url: string;
  formats?: Record<string, { url: string }> | null;
  alternativeText?: string | null;
}

export interface MediaLibraryDialogProps {
  onClose: () => void;
  onSelectAssets: (assets: StrapiMediaFile[]) => void;
  allowedTypes?: Array<"files" | "images" | "videos" | "audios">;
  multiple?: boolean;
}

interface AppBridge {
  library: {
    components: {
      "media-library"?: ComponentType<MediaLibraryDialogProps>;
    };
  };
}

declare global {
  interface Window {
    __betterAuthDashApp?: AppBridge;
  }
}

export function captureApp(app: AppBridge) {
  window.__betterAuthDashApp = app;
}

export function getMediaLibraryComponent(): ComponentType<MediaLibraryDialogProps> | null {
  return (
    window.__betterAuthDashApp?.library?.components?.["media-library"] ?? null
  );
}
