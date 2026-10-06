import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, FlaskConical, Leaf } from "lucide-react";
import { Button, Reason, s } from "../../components/ui";
import { useWorkspace } from "../../stores/workspace";
import c from "./Intake.module.css";

const options = [
  {
    mode: "Scientist" as const,
    icon: FlaskConical,
    summary: "I work with formulations, standards and lab data.",
    points: [
      "Technical property names",
      "Exact cost ceilings in ₹/kg",
      "Full recipe and test detail",
    ],
  },
  {
    mode: "Non-scientist" as const,
    icon: Leaf,
    summary: "I know the product or site outcome I need.",
    points: [
      "Everyday wording",
      "Budget bands instead of exact costs",
      "A clear brief to hand to R&D",
    ],
  },
];

export function Onboarding() {
  const state = useWorkspace(),
    navigate = useNavigate();
  const mode = state.user?.mode;
  return (
    <div className={c.onboarding}>
      <h1>How should Helix explain things?</h1>
      <p className={s.lead}>
        This changes wording only. Everyone sees the same project data. You
        can change it later in Settings.
      </p>
      <div className={c.cardGrid} role="radiogroup" aria-label="Your view">
        {options.map((o, i) => (
          <button
            key={o.mode}
            role="radio"
            aria-checked={mode === o.mode}
            tabIndex={mode ? (mode === o.mode ? 0 : -1) : i === 0 ? 0 : -1}
            onKeyDown={(e) => {
              if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
                e.preventDefault();
                const other = options[i ? 0 : 1];
                state.setMode(other.mode);
                (e.currentTarget.parentElement?.children[i ? 0 : 1] as HTMLElement)?.focus();
              }
            }}
            className={`${c.category} ${c.modeCard} ${mode === o.mode ? c.selected : ""}`}
            onClick={() => state.setMode(o.mode)}
          >
            <span className={c.radio}>
              {mode === o.mode && <Check size={10} />}
            </span>
            <span className={c.icon}>
              <o.icon size={22} />
            </span>
            <h3>{o.mode}</h3>
            <p>{o.summary}</p>
            <ul>
              {o.points.map((t) => (
                <li key={t}>
                  <Check size={12} />
                  {t}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
      <div className={s.stepFooter}>
        <span />
        <div className={s.row}>
          {!mode && <Reason>Choose one option to continue.</Reason>}
          <Button
            variant="primary"
            disabled={!mode}
            onClick={() => navigate("/projects")}
          >
            Continue
            <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
