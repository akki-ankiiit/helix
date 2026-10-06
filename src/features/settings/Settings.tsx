import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, RotateCcw, Trash2 } from "lucide-react";
import { Button, Field, Modal, Notice, ThemeControl, s } from "../../components/ui";
import { useWorkspace } from "../../stores/workspace";
import { usePlanner } from "../../planner/store";
import { referenceProjects } from "../../planner/references";

export function Settings() {
  const state = useWorkspace(),
    planner = usePlanner(),
    navigate = useNavigate(),
    [reset, setReset] = useState(false),
    [clear, setClear] = useState(false);
  const legacy = state.projects;
  const archived = planner.archived;
  function downloadArchived() {
    const blob = new Blob([JSON.stringify({ exported: new Date().toISOString(), projects: archived }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "helix-archived-projects.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  function downloadLegacy() {
    const blob = new Blob(
      [JSON.stringify({ exported: new Date().toISOString(), projects: legacy, materials: state.materials, benchmarks: state.benchmarks }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "helix-previous-version-formulation-data.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  return (
    <>
      <div className={s.pageHeader}>
        <div>
          <h1>Settings</h1>
          <p>Appearance, saved data and what Helix connects to.</p>
        </div>
      </div>
      <div className={s.stack} style={{ maxWidth: 820 }}>
        <section className={s.panel}>
          <h2>You</h2>
          <div className={s.formGrid} style={{ marginTop: 20 }}>
            <Field label="Demo user">
              <input value={state.user?.name || ""} readOnly />
            </Field>
            <div>
              <span className={s.fieldLabel} style={{ fontSize: 12, fontWeight: 500 }}>Appearance</span>
              <div style={{ marginTop: 9 }}>
                <ThemeControl />
              </div>
              <small className={s.muted} style={{ display: "block", marginTop: 8 }}>
                Light, dark, or match your device
              </small>
            </div>
          </div>
        </section>
        <section className={s.panel}>
          <h2>Your projects</h2>
          <p className={s.muted} style={{ fontSize: 13, margin: "10px 0 16px" }}>
            {planner.projects.length} project{planner.projects.length === 1 ? "" : "s"} saved in this browser. The {referenceProjects.length} reference samples are built into Helix and cannot be changed or deleted. Saved data stays on this device; it is not uploaded.
          </p>
          <Button variant="danger" disabled={!planner.projects.length} onClick={() => setClear(true)}>
            <Trash2 size={14} /> Delete my projects
          </Button>
        </section>
        <section className={s.panel}>
          <h2>Currency</h2>
          <p className={s.muted} style={{ fontSize: 13, marginTop: 10 }}>
            Money is shown in Indian rupees (₹, INR) with Indian digit grouping, e.g. ₹1,25,000.00. Reference samples show “Not estimated” because no verified raw-material prices were available. In your own projects you can enter rates from a supplier quote with its source and date.
          </p>
        </section>
        <section className={s.panel}>
          <h2>Connected services</h2>
          <ul className={s.list} style={{ marginTop: 14, paddingLeft: 0, listStyle: "none" }}>
            <li className={s.listItem}>
              <span>Raw-material library (component identification)</span>
              <span className={s.muted}>Built in; works offline</span>
            </li>
            <li className={s.listItem}>
              <span>Sign-in, laboratory systems, AI</span>
              <span className={s.muted}>Not connected</span>
            </li>
          </ul>
        </section>
        {archived.length > 0 && (
          <section className={s.panel}>
            <h2>Archived projects</h2>
            <p className={s.muted} style={{ fontSize: 13, margin: "10px 0 16px" }}>
              {archived.length} project{archived.length === 1 ? "" : "s"} created with the previous (organic-synthesis) version of Helix {archived.length === 1 ? "is" : "are"} kept unchanged in this browser. They use a different structure, so they cannot be opened as formulation projects; download them to keep a copy.
            </p>
            <Button onClick={downloadArchived}>
              <Download size={14} /> Download archived projects (.json)
            </Button>
          </section>
        )}
        {legacy.length > 0 && (
          <section className={s.panel}>
            <h2>Previous-version data</h2>
            <p className={s.muted} style={{ fontSize: 13, margin: "10px 0 16px" }}>
              This browser still holds {legacy.length} formulation project{legacy.length === 1 ? "" : "s"} from the previous version of Helix. They are kept unchanged; download them to keep a copy.
            </p>
            <Button onClick={downloadLegacy}>
              <Download size={14} /> Download previous-version data (.json)
            </Button>
          </section>
        )}
        <section className={s.panel}>
          <h2>Reset the demo</h2>
          <p className={s.muted} style={{ fontSize: 13, margin: "10px 0 16px" }}>
            Deletes your projects and signs you out. Reference projects and your theme are kept.
          </p>
          <Button variant="danger" onClick={() => setReset(true)}>
            <RotateCcw size={14} /> Reset demo
          </Button>
        </section>
      </div>
      {clear && (
        <Modal title="Delete all your projects?" onClose={() => setClear(false)}>
          <Notice warning>All projects and copies saved in this browser will be deleted. The five reference samples and archived projects are not affected. This cannot be undone.</Notice>
          <div className={s.modalActions}>
            <Button onClick={() => setClear(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => { usePlanner.setState({ projects: [] }); setClear(false); state.notify("Your projects were deleted."); }}>
              Delete my projects
            </Button>
          </div>
        </Modal>
      )}
      {reset && (
        <Modal title="Reset the demo?" onClose={() => setReset(false)}>
          <Notice warning>Your projects will be deleted and you will be signed out. Reference projects and your theme are kept.</Notice>
          <div className={s.modalActions}>
            <Button onClick={() => setReset(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => { usePlanner.setState({ projects: [], nextNumber: 101 }); state.reset(); navigate("/login"); }}>
              Reset and sign out
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
