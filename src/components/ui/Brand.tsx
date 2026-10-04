import { brand } from "../../data/brand";
export function HelixMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 4C9 14 27 15 27 25V36M27 4C27 14 9 15 9 25V36"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M11 9H25M12 30H24M14 15H22M14 24H22"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
export function Brand({ descriptor = true }: { descriptor?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <img src="/helix-logo.svg" alt="Helix Logo" style={{ height: "35px" }} />
    </div>
  );
}
