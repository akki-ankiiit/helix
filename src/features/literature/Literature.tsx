import { useState } from "react";
import {
  BookOpen,
  Check,
  ChevronRight,
  ExternalLink,
  Pin,
  Upload,
  X,
} from "lucide-react";
import type { Project, Source } from "../../domain/models";
import { Badge, Button, Modal, Notice, s } from "../../components/ui";
import { useWorkspace, uid } from "../../stores/workspace";
import c from "../projects/Project.module.css";
export function Literature({ project: p }: { project: Project }) {
  const state = useWorkspace(),
    [open, setOpen] = useState<Source | null>(null);
  const job = state.jobs.find(
    (j) => j.projectId === p.id && j.stage === "Literature",
  );
  const running = job?.status === "Running" || job?.status === "Queued";
  const included = p.sources.filter((x) => !x.excluded).length;
  function patch(id: string, changes: Partial<Source>) {
    state.updateProject(p.id, (x) => ({
      ...x,
      sources: x.sources.map((s) => (s.id === id ? { ...s, ...changes } : s)),
      needsReview: x.trials.length > 0 || x.needsReview,
    }));
  }
  return (
    <div className={s.stack}>
      <p className={s.muted} style={{ fontSize: 13 }}>
        Each source shows the excerpt it is based on, so you can check it.
        Exclude anything that does not apply. In this demo the search returns
        example documents, not real papers or patents.
      </p>
      {running && job && (
        <div className={s.stack} role="status" aria-live="polite">
          <p>Searching for sources… this takes about 6 seconds. You can leave this page; it keeps running.</p>
          <div className={s.progress} role="progressbar" aria-valuenow={job.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Source search progress">
            <span style={{ width: `${job.progress}%` }} />
          </div>
        </div>
      )}
      {job?.status === "Failed" && (
        <Notice warning>
          The source search failed: {job.error} Your existing sources are
          unchanged.{" "}
          <Button small onClick={() => state.jobAction(job.id, "retry")}>
            Try again
          </Button>
        </Notice>
      )}
      <div className={s.between}>
        <h3>
          {p.sources.length
            ? `${included} of ${p.sources.length} sources included`
            : "No sources yet"}
        </h3>
        <div className={s.row}>
          <label className={s.button}>
            <Upload size={14} />
            Add your own file
            <input
              type="file"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file)
                  state.updateProject(p.id, (x) => ({
                    ...x,
                    sources: [
                      ...x.sources,
                      {
                        id: uid(),
                        title: file.name,
                        type: "User-uploaded document",
                        owner: state.user?.name || "Demo user",
                        date: new Date().toISOString().slice(0, 10),
                        summary:
                          "File-name reference only. Document bytes and extraction are not retained by this demo.",
                        excerpt: "No extracted content available.",
                        quality: "Unverified · content not extracted",
                        reference: file.name,
                        pinned: false,
                        excluded: false,
                      },
                    ],
                  }));
              }}
            />
          </label>
          <Button
            variant={p.sources.length ? "default" : "primary"}
            disabled={running}
            onClick={() => state.startJob(p.id, "Literature")}
          >
            <BookOpen size={14} />
            {running ? "Searching…" : p.sources.length ? "Search again" : "Find sources"}
          </Button>
        </div>
      </div>
      {!p.sources.length && !running && (
        <div className={s.empty}>
          <BookOpen size={28} />
          <h3>Start by finding sources for your brief</h3>
          <p>
            Helix searches using your brief (v{p.revisions.length}): product,
            targets and benchmarks. Select “Find sources” to begin.
          </p>
        </div>
      )}
      <div className={s.list}>
        {p.sources.map((source) => (
          <article
            className={c.source}
            key={source.id}
            style={source.excluded ? { opacity: 0.55 } : {}}
          >
            <div className={s.between}>
              <div className={s.row}>
                <Badge>{source.type}</Badge>
                <small className={s.muted}>
                  {source.owner} · {source.date}
                </small>
              </div>
              <div className={s.row}>
                <button
                  className={s.textLink}
                  aria-label={`${source.pinned ? "Unpin" : "Pin"} ${source.title}`}
                  onClick={() => patch(source.id, { pinned: !source.pinned })}
                >
                  <Pin
                    size={14}
                    fill={source.pinned ? "currentColor" : "none"}
                  />
                </button>
                <button
                  className={s.textLink}
                  onClick={() =>
                    patch(source.id, { excluded: !source.excluded })
                  }
                >
                  {source.excluded ? "Restore" : "Exclude"}
                </button>
              </div>
            </div>
            <h3 style={{ marginTop: 13 }}>{source.title}</h3>
            <p>{source.summary}</p>
            <div className={s.between}>
              <Badge tone="amber">
                {source.quality.includes("Low")
                  ? "Low confidence"
                  : "Illustrative / unverified"}
              </Badge>
              <Button small variant="ghost" onClick={() => setOpen(source)}>
                Open source
                <ExternalLink size={12} />
              </Button>
            </div>
            {!source.excluded && (
              <details>
                <summary
                  style={{
                    fontSize: 11,
                    cursor: "pointer",
                    color: "var(--accent)",
                    marginTop: 15,
                  }}
                >
                  Show the excerpt
                </summary>
                <blockquote>“{source.excerpt}”</blockquote>
                <p>
                  <b>Source reports:</b> {source.summary}
                </p>
                <p>
                  <b>How to use it:</b> as a starting idea for a trial. It does
                  not prove that a recipe will work.
                </p>
                <small className={s.muted}>
                  [{source.reference}] · {source.quality}
                </small>
              </details>
            )}
          </article>
        ))}
      </div>
      {p.sources.length > 0 && (
        <Notice warning>
          Gap: no verified papers, patents or long-term (aged) durability
          results are attached. The example sources are for demonstration
          only.
        </Notice>
      )}
      {open && (
        <Modal title={open.title} onClose={() => setOpen(null)}>
          <div className={s.stack}>
            <Badge tone="amber">{open.type} · illustrative reference</Badge>
            <p>{open.excerpt}</p>
            <p className={s.muted}>{open.quality}</p>
            <small>Document reference: {open.reference}</small>
            <Button onClick={() => setOpen(null)}>
              <X size={14} />
              Close reference
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
