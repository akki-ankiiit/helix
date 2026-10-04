import { useState } from "react";
import { Send, Sparkles, X, ArrowRight } from "lucide-react";
import { useLocation, useParams } from "react-router-dom";
import { Button, Badge, Notice, s } from "../../components/ui";
import { askHelix } from "../../services/demo";
import type { AskResponse } from "../../services/contracts";
import { useWorkspace, uid } from "../../stores/workspace";
import c from "./AskHelix.module.css";
export function AskHelix({ onClose }: { onClose: () => void }) {
  const { projectId } = useParams();
  const location = useLocation();
  const state = useWorkspace();
  const p = state.projects.find((p) => p.id === projectId);
  const [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [messages, setMessages] = useState<
      (AskResponse & { prompt: string; resolved?: string })[]
    >([]);
  async function ask(prompt: string) {
    if (!prompt.trim() || busy) return;
    setInput("");
    setBusy(true);
    const response = await askHelix.ask(prompt, p);
    setMessages((m) => [...m, { ...response, prompt }]);
    setBusy(false);
  }
  return (
    <aside className={c.panel} aria-label="Ask Helix">
      <header className={c.header}>
        <div className={s.row}>
          <Sparkles size={19} color="var(--accent)" />
          <h2>Ask Helix</h2>
          <Badge tone="violet">Demo</Badge>
        </div>
        <Button variant="ghost" aria-label="Close Ask Helix" onClick={onClose}>
          <X size={18} />
        </Button>
      </header>
      <div className={c.context}>
        {p?.brief.name || "Your materials workspace"}
        <small>
          {state.user?.mode || "Choose your mode"} ·{" "}
          {new URLSearchParams(location.search).get("stage") ||
            p?.stage ||
            "Getting started"}
        </small>
      </div>
      <div className={c.messages}>
        <Notice>
          Deterministic demo responses grounded in local records. No live AI
          service is connected.
        </Notice>
        {messages.length === 0 && (
          <>
            <div className={c.welcome}>
              <Sparkles size={27} />
              <h2>
                A little clarity for
                <br />
                your next decision.
              </h2>
              <p>
                Explore the evidence, understand a result,
                <br />
                or find your next step.
              </p>
            </div>
            {[
              "Summarize this formulation brief.",
              "Which targets are not yet met?",
              "Compare these pathways.",
              "Explain why this trial failed.",
              "Suggest a lower-cost variant.",
            ].map((q) => (
              <button key={q} className={c.prompt} onClick={() => ask(q)}>
                {q}
                <ArrowRight size={13} />
              </button>
            ))}
          </>
        )}
        {messages.map((m, i) => (
          <div key={i} className={c.message}>
            <div className={c.question}>{m.prompt}</div>
            <p>{m.answer}</p>
            <small>{m.citation}</small>
            {m.change && (
              <div className={c.change}>
                <b>Proposed brief revision</b>
                <p>Before: {m.change.before}</p>
                <p>After: {m.change.after}</p>
                {m.resolved ? (
                  <Badge>{m.resolved}</Badge>
                ) : (
                  <div className={s.row}>
                    <Button
                      small
                      variant="primary"
                      disabled={
                        !["Chemist", "Admin"].includes(state.user?.role || "")
                      }
                      onClick={() => {
                        if (p)
                          state.updateProject(p.id, (x) => {
                            const brief = {
                              ...x.brief,
                              constraints: {
                                ...x.brief.constraints,
                                preference: m.change!.after,
                              },
                            };
                            return {
                              ...x,
                              brief,
                              needsReview: true,
                              revisions: [
                                ...x.revisions,
                                {
                                  version: x.revisions.length + 1,
                                  brief: structuredClone(brief),
                                  date: new Date().toISOString(),
                                  reason:
                                    "Accepted Ask Helix preference change",
                                },
                              ],
                              activity: [
                                {
                                  id: uid(),
                                  text: "Accepted cost preference; downstream analysis requires review",
                                  date: new Date().toISOString(),
                                },
                                ...x.activity,
                              ],
                            };
                          });
                        setMessages((ms) =>
                          ms.map((x, j) =>
                            j === i
                              ? {
                                  ...x,
                                  resolved: "Accepted · new brief revision",
                                }
                              : x,
                          ),
                        );
                      }}
                    >
                      Accept
                    </Button>
                    <Button
                      small
                      onClick={() =>
                        setMessages((ms) =>
                          ms.map((x, j) =>
                            j === i ? { ...x, resolved: "Dismissed" } : x,
                          ),
                        )
                      }
                    >
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div
            className={s.skeleton}
            role="status"
            aria-label="Preparing demo response"
          />
        )}
      </div>
      <form
        className={c.composer}
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input
          aria-label="Ask about your project"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your project…"
        />
        <Button
          aria-label="Send message"
          variant="primary"
          disabled={busy || !input.trim()}
        >
          <Send size={16} />
        </Button>
      </form>
      <div className={c.footnote}>
        Suggestions are not scientific validation.
      </div>
    </aside>
  );
}
