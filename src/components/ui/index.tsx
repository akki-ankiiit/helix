import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
  type ReactElement,
} from "react";
import { Check, Info, Monitor, Moon, Search, Sun, X } from "lucide-react";
import s from "../../styles/ui.module.css";
export { s };
export function Button({
  children,
  variant = "default",
  small = false,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "ghost" | "danger";
  small?: boolean;
}) {
  return (
    <button
      className={`${s.button} ${variant === "default" ? "" : s[variant]} ${small ? s.small : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "green" | "amber" | "violet" | "red" | "neutral";
}) {
  return (
    <span
      className={`${s.badge} ${tone === "neutral" ? "" : s[`badge${tone[0].toUpperCase() + tone.slice(1)}`]}`}
    >
      {children}
    </span>
  );
}
export function Status({ value }: { value: string }) {
  return (
    <Badge
      tone={
        /Pass|Complete|Approved|Available/.test(value)
          ? "green"
          : /Fail|Rejected/.test(value)
            ? "red"
            : /review|Pending|Blocked|Draft|Waiting/.test(value)
              ? "amber"
              : "violet"
      }
    >
      {value}
    </Badge>
  );
}
export function Field({
  label,
  children,
  hint,
  className = "",
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <label className={`${s.field} ${className}`}>
      <span id={id}>{label}</span>
      {Children.map(children, (child) =>
        isValidElement(child) &&
        ["input", "select", "textarea"].includes(child.type as string)
          ? cloneElement(
              child as ReactElement<{
                "aria-labelledby"?: string;
                "aria-describedby"?: string;
              }>,
              {
                "aria-labelledby": id,
                "aria-describedby": hint ? `${id}-hint` : undefined,
              },
            )
          : child,
      )}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </label>
  );
}
export function Notice({
  children,
  warning = false,
}: {
  children: ReactNode;
  warning?: boolean;
}) {
  return (
    <div className={`${s.notice} ${warning ? s.warning : ""}`}>
      <Info size={16} />
      <div>{children}</div>
    </div>
  );
}
export function SearchBox({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className={s.search}>
      <Search size={16} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const el = ref.current;
    const nodes = () =>
      Array.from(
        el?.querySelectorAll<HTMLElement>(
          'button,input,select,textarea,a[href],[tabindex="0"]',
        ) || [],
      ).filter((x) => !(x as HTMLButtonElement).disabled);
    nodes()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const ns = nodes();
        if (e.shiftKey && document.activeElement === ns[0]) {
          e.preventDefault();
          ns.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === ns.at(-1)) {
          e.preventDefault();
          ns[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <div
      className={s.modalBackdrop}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={s.modal}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
      >
        <div className={s.panelHeader}>
          <h2>{title}</h2>
          <Button variant="ghost" aria-label="Close dialog" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function ThemeControl() {
  const [preference, setPreference] = useTheme();
  return (
    <div className={s.tabs} aria-label="Color theme">
      {(
        [
          ["light", Sun],
          ["dark", Moon],
          ["system", Monitor],
        ] as const
      ).map(([name, Icon]) => (
        <button
          key={name}
          title={`${name[0].toUpperCase() + name.slice(1)} theme`}
          aria-label={`${name} theme`}
          aria-pressed={preference === name}
          className={preference === name ? s.active : ""}
          onClick={() => setPreference(name)}
          style={{ padding: "6px 9px" }}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}
import { useState } from "react";
function useTheme() {
  const [value, setValue] = useState(
    localStorage.getItem("helix-theme") || "light",
  );
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      const v = localStorage.getItem("helix-theme") || "light";
      setValue(v);
      document.documentElement.dataset.theme =
        v === "system" ? (media.matches ? "dark" : "light") : v;
    };
    media.addEventListener("change", update);
    window.addEventListener("helix-theme", update);
    update();
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("helix-theme", update);
    };
  }, []);
  return [
    value,
    (v: string) => {
      localStorage.setItem("helix-theme", v);
      window.dispatchEvent(new Event("helix-theme"));
    },
  ] as const;
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className={s.empty}>
      <Search size={28} />
      <h3>{title}</h3>
      {children}
    </div>
  );
}
export function Saved() {
  return (
    <span className={s.check}>
      <Check size={13} /> Saved locally
    </span>
  );
}
