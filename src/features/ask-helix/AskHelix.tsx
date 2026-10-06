import { useState } from "react";
import { Send, Sparkles, X, ArrowRight } from "lucide-react";
import { matchPath, useLocation } from "react-router-dom";
import { Button, Badge, Notice, s } from "../../components/ui";
import { useAllProjects } from "../../planner/store";
import type { Project } from "../../planner/model";
import { fmt, planSummary, projectCalc, recommendations, validationStatus } from "../../planner/calc";
import c from "./AskHelix.module.css";

interface Answer {
  prompt: string;
  answer: string;
  citation: string;
}

const prompts = [
  "Summarise this formulation plan.",
  "Is the composition balanced?",
  "Which supplier data is missing?",
  "Why was this approach chosen?",
  "What tests are still to be done?",
];

/** Deterministic answers built only from the open project's saved data. */
function answer(prompt: string, p?: Project): Omit<Answer, "prompt"> {
  if (!p)
    return {
      answer: "Open a project to ask about its formulation plan. Answers come only from the project's saved data; no AI service is connected.",
      citation: "No project open",
    };
  const calc = projectCalc(p);
  const sum = planSummary(p, calc);
  const q = prompt.toLowerCase();
  if (/balanc|composition|total|ratio/.test(q))
    return {
      answer:
        calc.parts.map((x) => `${x.name}: ${fmt(x.total, 2)}%${x.balanced ? " (balanced)" : x.missing.length ? ` — ${x.missing.length} amount(s) missing` : " — not 100%"}; ${fmt(x.massKg, 2)} kg in a ${fmt(p.batchKg, 2)} kg batch.`).join(" ") +
        (calc.mixRatioText ? ` Mixing ratio ${calc.mixRatioText}.` : "") +
        calc.ratios.map((r) => ` ${r.label}: ${fmt(r.value, 2)}.`).join(""),
      citation: `${p.id} · Pathways › Composition and ratios (calculated)`,
    };
  if (/supplier|missing|data/.test(q)) {
    const needs = p.ingredients.filter((i) => i.review === "Needs supplier data");
    return {
      answer: needs.length ? `Supplier data is still needed for: ${needs.map((i) => i.name).join(", ")}.` : "Every ingredient has a supporting source or a stated basis.",
      citation: `${p.id} · formulation table (review status)`,
    };
  }
  if (/why|approach/.test(q))
    return { answer: p.rationale || "No rationale yet. Add one in Pathways › Analyzing formulation pathways.", citation: `${p.id} · ${sum.approach?.name ?? "no approach selected"}` };
  if (/test|valid/.test(q))
    return {
      answer: `${p.tests.length} tests across ${p.trials.length} trial batches. Experimental validation: ${validationStatus(p).toLowerCase()}. ${recommendations(p, calc).find((r) => r.action.sub === "experiment")?.text ?? ""}`,
      citation: `${p.id} · performance-testing matrix`,
    };
  return {
    answer: `${sum.headline}. ${sum.explanation}`,
    citation: `${p.id} · ${p.sources.filter((x) => x.selected).length} selected sources`,
  };
}

export function AskHelix({ onClose }: { onClose: () => void }) {
  const location = useLocation();
  const all = useAllProjects();
  const match =
    matchPath("/projects/:projectId/*", location.pathname) || matchPath("/projects/:projectId", location.pathname);
  const p = all.find((x) => x.id === match?.params.projectId);
  const [input, setInput] = useState(""),
    [messages, setMessages] = useState<Answer[]>([]);
  function ask(prompt: string) {
    if (!prompt.trim()) return;
    setInput("");
    setMessages((m) => [...m, { prompt, ...answer(prompt, p) }]);
  }
  return (
    <aside className={c.panel} aria-label="Ask Helix">
      <header className={c.header}>
        <div className={s.row}>
          <Sparkles size={19} color="var(--accent)" />
          <h2>Ask Helix</h2>
          <Badge tone="violet">From project data</Badge>
        </div>
        <Button variant="ghost" aria-label="Close Ask Helix" onClick={onClose}>
          <X size={18} />
        </Button>
      </header>
      <div className={c.context}>
        {p ? `${p.id} · ${p.title || "Untitled project"}` : "No project open"}
        <small>{p?.category || "Open a project to ask about it"}</small>
      </div>
      <div className={c.messages} aria-live="polite">
        <Notice>Answers are built only from this project's saved data. No AI service is connected.</Notice>
        {messages.length === 0 &&
          prompts.map((q) => (
            <button key={q} className={c.prompt} onClick={() => ask(q)}>
              {q}
              <ArrowRight size={13} />
            </button>
          ))}
        {messages.map((m, i) => (
          <div key={i} className={c.message}>
            <div className={c.question}>{m.prompt}</div>
            <p>{m.answer}</p>
            <small>{m.citation}</small>
          </div>
        ))}
      </div>
      <form
        className={c.composer}
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input aria-label="Ask about this project" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about this project…" />
        <Button aria-label="Send message" variant="primary" disabled={!input.trim()}>
          <Send size={16} />
        </Button>
      </form>
      <div className={c.footnote}>Plans only — Helix does not test formulations.</div>
    </aside>
  );
}
