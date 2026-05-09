import { Box } from "@strapi/design-system";
import styled from "styled-components";

const PALETTE = [
  { bg: "#EAF5FF", fg: "#0C75AF" },
  { bg: "#F0F0FF", fg: "#4945FF" },
  { bg: "#EAFBE7", fg: "#328048" },
  { bg: "#FFF3D3", fg: "#8E6A00" },
  { bg: "#FCECEA", fg: "#D02B20" },
  { bg: "#F6ECFC", fg: "#8312D1" },
  { bg: "#E8F8F5", fg: "#1A7F64" },
];

const Circle = styled.div<{ $bg: string; $fg: string; $size: number }>`
  width: ${(p) => p.$size}px;
  height: ${(p) => p.$size}px;
  border-radius: 50%;
  background: ${(p) => p.$bg};
  color: ${(p) => p.$fg};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: ${(p) => Math.round(p.$size * 0.38)}px;
  font-weight: 700;
  flex-shrink: 0;
  letter-spacing: -0.01em;
  user-select: none;
`;

function getColor(seed: string) {
  const code = (seed.charCodeAt(0) || 0) + (seed.charCodeAt(1) || 0);
  return PALETTE[code % PALETTE.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  src,
  size = 32,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  if (src) {
    return (
      <Box
        tag="img"
        src={src}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          display: "block",
        }}
      />
    );
  }
  const color = getColor(name || "?");
  return (
    <Circle $bg={color.bg} $fg={color.fg} $size={size}>
      {getInitials(name || "?")}
    </Circle>
  );
}
