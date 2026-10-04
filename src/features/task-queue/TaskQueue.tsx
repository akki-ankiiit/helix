import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, RotateCw, X, Play } from "lucide-react";
import { Badge, Button, Empty, Notice, Status, s } from "../../components/ui";
import { useWorkspace } from "../../stores/workspace";
export function TaskQueue() {
  const state = useWorkspace(),
    [filter, setFilter] = useState("All jobs");
  return (
    <>
      <div className={s.pageHeader}>
        <div>
          <div className={s.eyebrow} style={{ marginBottom: 10 }}>
            KEEP THE WORK MOVING
          </div>
          <h1>Task queue</h1>
          <p>
            Research and formulation simulations, with a traceable execution
            history.
          </p>
        </div>
        <Button
          disabled={!state.projects.length}
          onClick={() =>
            state.startJob(state.projects[0].id, "Literature", true)
          }
        >
          <Play size={14} />
          Demonstrate failed job
        </Button>
      </div>
      <div className={s.stack}>
        <Notice>
          Jobs are deterministic local simulations. They continue across
          navigation; elapsed time is reconciled after a refresh. Progress
          reflects fixture playback, not scientific work or live backend
          processing.
        </Notice>
        <div className={s.tabs}>
          {[
            "All jobs",
            "Queued",
            "Running",
            "Completed",
            "Failed",
            "Cancelled",
          ].map((v) => (
            <button
              key={v}
              className={filter === v ? s.active : ""}
              onClick={() => setFilter(v)}
            >
              {v}
            </button>
          ))}
        </div>
        {state.jobs.filter((j) => filter === "All jobs" || j.status === filter)
          .length ? (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Job / project</th>
                  <th>Stage</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Started / finished</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.jobs
                  .filter((j) => filter === "All jobs" || j.status === filter)
                  .map((j) => (
                    <tr key={j.id}>
                      <td>
                        <b>{j.name}</b>
                        <small>
                          {
                            state.projects.find((p) => p.id === j.projectId)
                              ?.brief.name
                          }
                        </small>
                        {j.error && (
                          <small style={{ color: "var(--red)" }}>
                            {j.error}
                          </small>
                        )}
                      </td>
                      <td>{j.stage}</td>
                      <td>
                        <Status value={j.status} />
                      </td>
                      <td style={{ minWidth: 150 }}>
                        <div className={s.progress}>
                          <span style={{ width: `${j.progress}%` }} />
                        </div>
                        <small>{j.progress}% fixture playback</small>
                      </td>
                      <td>
                        {new Date(j.started).toLocaleTimeString()}
                        <small>
                          {j.finished
                            ? new Date(j.finished).toLocaleTimeString()
                            : "—"}
                        </small>
                      </td>
                      <td>
                        <div className={s.row}>
                          {j.status === "Running" && (
                            <Button
                              small
                              onClick={() => state.jobAction(j.id, "cancel")}
                            >
                              <X size={12} />
                              Cancel
                            </Button>
                          )}
                          {["Failed", "Cancelled"].includes(j.status) && (
                            <Button
                              small
                              onClick={() => state.jobAction(j.id, "retry")}
                            >
                              <RotateCw size={12} />
                              Retry
                            </Button>
                          )}
                          {j.status === "Completed" && (
                            <Link
                              className={s.button}
                              to={`/projects/${j.projectId}?stage=${j.stage}`}
                            >
                              Review results
                              <ArrowUpRight size={12} />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={s.panel}>
            <Empty title="A little quiet in the queue">
              <p>
                Start a research simulation from a project’s Literature stage.
              </p>
              <Badge>
                No {filter === "All jobs" ? "active" : filter.toLowerCase()}{" "}
                jobs
              </Badge>
            </Empty>
          </div>
        )}
      </div>
    </>
  );
}
