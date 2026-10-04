import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, Trash2, ShieldCheck } from "lucide-react";
import {
  Badge,
  Button,
  Field,
  Modal,
  Notice,
  ThemeControl,
  s,
} from "../../components/ui";
import { useWorkspace } from "../../stores/workspace";
import type { Role } from "../../domain/models";
export function Settings() {
  const state = useWorkspace(),
    navigate = useNavigate(),
    [reset, setReset] = useState(false),
    [empty, setEmpty] = useState(false);
  return (
    <>
      <div className={s.pageHeader}>
        <div>
          <div className={s.eyebrow} style={{ marginBottom: 10 }}>
            MAKE SPACE FOR YOUR WORK
          </div>
          <h1>Workspace settings</h1>
          <p>
            Presentation preferences and transparent controls for this
            demonstration.
          </p>
        </div>
        <Badge tone="violet">Materials Lab</Badge>
      </div>
      <div className={s.split}>
        <div className={s.stack}>
          <section className={s.panel}>
            <h2>Profile & perspective</h2>
            <div className={s.formGrid} style={{ marginTop: 24 }}>
              <Field label="Demo user">
                <input value={state.user?.name || ""} readOnly />
              </Field>
              <Field
                label="Presentation mode"
                hint="Changes language and guidance, not permissions."
              >
                <select
                  value={state.user?.mode || "Scientist"}
                  onChange={(e) =>
                    state.setMode(
                      e.target.value as "Scientist" | "Non-scientist",
                    )
                  }
                >
                  <option>Scientist</option>
                  <option>Non-scientist</option>
                </select>
              </Field>
              <Field
                label="Demo role"
                hint="Client-only role simulation. Production authorization must be enforced server-side."
              >
                <select
                  value={state.user?.role}
                  onChange={(e) => {
                    state.setRole(e.target.value as Role);
                    state.notify(
                      `Demo role changed to ${e.target.value}. Project data preserved.`,
                    );
                  }}
                >
                  {["Chemist", "Technician", "Reviewer", "Admin"].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </Field>
              <div>
                <label className={s.field}>
                  <span>Appearance</span>
                </label>
                <div style={{ marginTop: 9 }}>
                  <ThemeControl />
                </div>
                <small
                  className={s.muted}
                  style={{ display: "block", marginTop: 10 }}
                >
                  Light / Dark / System · persists in this browser
                </small>
              </div>
            </div>
          </section>
          <section className={s.panel}>
            <h2>Services & integrations</h2>
            <div className={s.list} style={{ marginTop: 22 }}>
              {[
                "Authentication provider",
                "AI research & Ask Helix",
                "Document extraction",
                "Laboratory information system",
                "Live collaboration",
              ].map((label) => (
                <div className={s.listItem} key={label}>
                  <span>{label}</span>
                  <Badge tone="amber">Not connected</Badge>
                </div>
              ))}
            </div>
            <p className={s.muted} style={{ fontSize: 12, marginTop: 20 }}>
              Demo adapters can be replaced through the typed service contracts.
              No passwords or private API keys are stored in this application.
            </p>
          </section>
          <section className={s.panel}>
            <h2>Demo data</h2>
            <p
              className={s.muted}
              style={{ fontSize: 12, margin: "12px 0 20px" }}
            >
              Browser storage is used only for labeled demo data and
              preferences. It is not a production store for proprietary
              formulation information.
            </p>
            <div className={s.row}>
              <Button onClick={() => setEmpty(true)}>
                <Trash2 size={14} />
                Explore an empty workspace
              </Button>
              <Button variant="danger" onClick={() => setReset(true)}>
                <RotateCcw size={14} />
                Reset demo
              </Button>
            </div>
          </section>
        </div>
        <div className={s.panel}>
          <ShieldCheck size={24} color="var(--accent)" />
          <h2 style={{ margin: "18px 0 12px" }}>
            One brief.
            <br />
            Shared understanding.
          </h2>
          <p className={s.muted} style={{ fontSize: 12 }}>
            Scientists and product teams use the same project records. A change
            in perspective never changes the evidence.
          </p>
          <div className={s.divider} />
          <p className={s.muted} style={{ fontSize: 11 }}>
            Roles at a glance
          </p>
          <div className={s.list} style={{ marginTop: 18, fontSize: 12 }}>
            <p>
              <b>Chemist</b>
              <br />
              Briefs, recipes, iterations, review submissions.
            </p>
            <p>
              <b>Technician</b>
              <br />
              Measured specimen records and attachments.
            </p>
            <p>
              <b>Reviewer</b>
              <br />
              Results review, change requests, approval.
            </p>
            <p>
              <b>Admin</b>
              <br />
              All demo workflow actions.
            </p>
          </div>
        </div>
      </div>
      {reset && (
        <Modal
          title="Reset the demo workspace?"
          onClose={() => setReset(false)}
        >
          <Notice warning>
            This removes locally edited projects, drafts, benchmarks, materials,
            and jobs, restores the fixtures, and signs you out. Theme preference
            is retained.
          </Notice>
          <div className={s.modalActions}>
            <Button onClick={() => setReset(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                state.reset();
                navigate("/login");
              }}
            >
              Reset & sign out
            </Button>
          </div>
        </Modal>
      )}
      {empty && (
        <Modal
          title="Start with an empty workspace?"
          onClose={() => setEmpty(false)}
        >
          <Notice warning>
            Local project history and jobs will be removed. Material and
            benchmark libraries remain available. Reset demo restores the seeded
            projects.
          </Notice>
          <div className={s.modalActions}>
            <Button onClick={() => setEmpty(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                useWorkspace.setState({ projects: [], jobs: [] });
                state.newDraft();
                navigate("/projects");
              }}
            >
              Clear projects & continue
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
