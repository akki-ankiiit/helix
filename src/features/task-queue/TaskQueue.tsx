import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, RotateCw, X, Play } from "lucide-react";
import { Badge, Button, Empty, Notice, Status, s } from "../../components/ui";
import { useWorkspace } from "../../stores/workspace";
import { stageTitle } from "../../data/procedure";
export function TaskQueue() {
  const state = useWorkspace(),
    [filter, setFilter] = useState("All jobs");
  return (
    <>
      <div className={s.pageHeader}>
        <div>
          <h1>Task queue</h1>
          <p>
            Background searches started from a project. They keep running while
            you work on other pages.
          </p>
        </div>
        <Button
          disabled={!state.projects.length}
          onClick={() =>
            state.startJob(state.projects[0].id, "Literature", true)
          }
        >
          <Play size={14} />
          Show a failed task (demo)
        </Button>
      </div>
      <div className={s.stack}>
        <Notice>
          In this demo, tasks replay example data in about 6 seconds. They
          continue if you leave the page or refresh.
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
              aria-pressed={filter === v}
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
                  <th scope="col">Task and project</th>
                  <th scope="col">Step</th>
                  <th scope="col">Status</th>
                  <th scope="col">Progress</th>
                  <th scope="col">Started and finished</th>
                  <th scope="col">Action</th>
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
                      <td>{stageTitle(j.stage)}</td>
                      <td>
                        <Status value={j.status} />
                      </td>
                      <td style={{ minWidth: 150 }}>
                        <div className={s.progress}>
                          <span style={{ width: `${j.progress}%` }} />
                        </div>
                        <small>{j.progress}%</small>
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
                              View results
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
            <Empty title={filter === "All jobs" ? "No tasks yet" : `No ${filter.toLowerCase()} tasks`}>
              <p>
                Tasks start when you select “Find sources” (Read) or “Suggest
                pathways” (Design) in a project.
              </p>
              <Link className={s.button} to="/projects">
                Go to projects
              </Link>
            </Empty>
          </div>
        )}
      </div>
    </>
  );
}
