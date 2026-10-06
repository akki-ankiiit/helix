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
import { Check, ChevronRight, Info, Monitor, Moon, Search, Sun, X } from "lucide-react";
import { Link } from "react-router-dom";
import s from "../../styles/ui.module.css";
export * from "./LiquidOrb";
export * from "./Charts";
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
            : /review|Pending|Blocked|Draft|Waiting|out of date/.test(value)
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
  required = false,
  optional = false,
  unit,
  error,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
  required?: boolean;
  optional?: boolean;
  /** Shown beside the input, e.g. "₹/kg" or "°C". */
  unit?: string;
  error?: string;
}) {
  const id = useId();
  const described =
    [hint ? `${id}-hint` : "", error ? `${id}-error` : ""]
      .filter(Boolean)
      .join(" ") || undefined;
  const controls = Children.map(children, (child) =>
    isValidElement(child) &&
    ["input", "select", "textarea"].includes(child.type as string)
      ? cloneElement(
          child as ReactElement<{
            "aria-labelledby"?: string;
            "aria-describedby"?: string;
            "aria-invalid"?: boolean;
            "aria-required"?: boolean;
          }>,
          {
            "aria-labelledby": id,
            "aria-describedby": described,
            "aria-invalid": error ? true : undefined,
            "aria-required": required || undefined,
          },
        )
      : child,
  );
  return (
    <label className={`${s.field} ${className}`}>
      <span id={id} className={s.fieldLabel}>
        {label}
        {required && <span className={s.required}>Required</span>}
        {optional && <span className={s.optional}>Optional</span>}
      </span>
      {unit ? (
        <span className={s.unitWrap}>
          {controls}
          <span className={s.unit} aria-hidden="true">
            {unit}
          </span>
        </span>
      ) : (
        controls
      )}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
      {error && (
        <small id={`${id}-error`} className={s.error} role="alert">
          {error}
        </small>
      )}
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

export function Breadcrumbs({
  items,
}: {
  items: { label: string; to?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className={s.breadcrumbs}>
      <ol>
        {items.map((item, i) => (
          <li key={item.label}>
            {i > 0 && <ChevronRight size={12} aria-hidden="true" />}
            {item.to && i < items.length - 1 ? (
              <Link to={item.to}>{item.label}</Link>
            ) : (
              <span aria-current={i === items.length - 1 ? "page" : undefined}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export type StepState = "complete" | "current" | "upcoming" | "attention" | "locked";
/** Numbered procedure stepper. Every step is a link or a button. */
export function Stepper({
  label,
  steps,
  onSelect,
}: {
  label: string;
  steps: {
    id: string;
    number: number;
    name: string;
    detail?: string;
    state: StepState;
    current?: boolean;
    disabledReason?: string;
  }[];
  onSelect: (id: string) => void;
}) {
  return (
    <nav aria-label={label} className={s.stepper}>
      <ol>
        {steps.map((step) => {
          const locked = step.state === "locked";
          return (
            <li
              key={step.id}
              className={`${s.stepItem} ${s[`step_${step.state}`] || ""} ${step.current ? s.stepCurrent : ""}`}
            >
              <button
                type="button"
                aria-current={step.current ? "step" : undefined}
                disabled={locked}
                title={locked ? step.disabledReason : undefined}
                onClick={() => onSelect(step.id)}
              >
                <span className={s.stepDot} aria-hidden="true">
                  {step.state === "complete" ? (
                    <Check size={13} strokeWidth={2.5} />
                  ) : step.state === "attention" ? (
                    "!"
                  ) : (
                    step.number
                  )}
                </span>
                <span className={s.stepText}>
                  <b>{step.name}</b>
                  {step.detail && <small>{step.detail}</small>}
                </span>
                <span className={s.srOnly}>
                  {step.current ? "(current step)" : ""}{" "}
                  {step.state === "complete"
                    ? "Complete"
                    : step.state === "attention"
                      ? "Needs attention"
                      : step.state === "locked"
                        ? `Not available yet. ${step.disabledReason || ""}`
                        : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Local navigation between related views within one step. */
export function Tabs({
  label,
  items,
  active,
  onSelect,
}: {
  label: string;
  items: { id: string; label: string; done?: boolean }[];
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div role="tablist" aria-label={label} className={s.localTabs}>
      {items.map((item) => (
        <button
          key={item.id}
          role="tab"
          type="button"
          aria-selected={active === item.id}
          tabIndex={active === item.id ? 0 : -1}
          className={active === item.id ? s.active : ""}
          onClick={() => onSelect(item.id)}
          onKeyDown={(e) => {
            if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
            e.preventDefault();
            const i = items.findIndex((x) => x.id === item.id);
            const next =
              items[(i + (e.key === "ArrowRight" ? 1 : -1) + items.length) % items.length];
            onSelect(next.id);
            const buttons = e.currentTarget.parentElement?.querySelectorAll("button");
            requestAnimationFrame(() =>
              (buttons?.[items.indexOf(next)] as HTMLElement | undefined)?.focus(),
            );
          }}
        >
          {item.done && <Check size={13} aria-label="complete" />}
          {item.label}
        </button>
      ))}
    </div>
  );
}

const dataKinds = {
  entered: "Entered",
  calculated: "Calculated",
  estimate: "Estimate",
  assumption: "Assumption",
  missing: "Missing",
} as const;
/** Labels the origin of a value: entered, calculated, estimated, assumed or missing. */
export function DataTag({ kind }: { kind: keyof typeof dataKinds }) {
  return (
    <span className={`${s.dataTag} ${s[`data_${kind}`]}`}>
      {dataKinds[kind]}
    </span>
  );
}

/** Explains why the adjacent action is unavailable. */
export function Reason({ children }: { children: ReactNode }) {
  return (
    <p className={s.reason} role="note">
      <Info size={13} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
