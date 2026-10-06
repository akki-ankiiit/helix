import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Brand } from "../components/ui/Brand";
import { s } from "../components/ui";

export function NotFound() {
  useEffect(() => {
    document.title = "Page not found · Helix";
  }, []);
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div className={s.panel} style={{ width: 460, maxWidth: "100%" }}>
        <Brand />
        <h1 style={{ marginTop: 28 }}>Page not found</h1>
        <p className={s.muted} style={{ margin: "10px 0 24px" }}>
          The link may be mistyped or out of date. Your projects are still
          saved.
        </p>
        <Link className={`${s.button} ${s.primary}`} to="/">
          Go to Helix
        </Link>
      </div>
    </main>
  );
}
