import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  FlaskConical,
  Fingerprint,
  GitBranch,
  BookOpen,
  ShieldCheck,
  LockKeyhole,
  LoaderCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Brand } from "../../components/ui/Brand";
import { Button, Field, Modal, ThemeControl, s } from "../../components/ui";
import { authentication } from "../../services/demo";
import { useWorkspace } from "../../stores/workspace";
import c from "./Login.module.css";
const schema = z.object({
  email: z.email("Enter a valid work email address."),
  password: z.string().min(1, "Enter your password."),
});
function MaterialNetwork() {
  const rings = Array.from({ length: 23 }, (_, i) => {
    const t = i / 22,
      a = t * Math.PI * 3.3;
    const cx = 105 + t * 284,
      cy = 235 - t * 164;
    return {
      x: cx + Math.cos(a) * 65,
      y: cy + Math.sin(a) * 39,
      x2: cx - Math.cos(a) * 65,
      y2: cy - Math.sin(a) * 39,
    };
  });
  return (
    <svg
      className={c.network}
      viewBox="0 0 500 330"
      fill="none"
      aria-label="An abstract molecular helix, connecting material requirements to discovery"
      role="img"
    >
      <defs>
        <linearGradient id="strand" x1="80" y1="260" x2="430" y2="40">
          <stop stopColor="#b6a8ec" />
          <stop offset=".5" stopColor="#7854db" />
          <stop offset="1" stopColor="#c3b7eb" />
        </linearGradient>
        <radialGradient id="node">
          <stop stopColor="#fbfaff" />
          <stop offset=".5" stopColor="#b7a5ed" />
          <stop offset="1" stopColor="#8063c0" />
        </radialGradient>
      </defs>
      <g stroke="var(--muted)" opacity=".17" strokeWidth=".6">
        <path d="M52 50v238h400M52 288l360-226M104 309V37M52 241h403M53 110h400M404 35v275" />
        <ellipse
          cx="253"
          cy="179"
          rx="204"
          ry="72"
          transform="rotate(-29 253 179)"
          strokeDasharray="3 5"
        />
        <path d="M42 50h20M52 40v20M394 62h20M404 52v20M442 288h20M452 278v20" />
      </g>
      <path
        d={rings.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ")}
        stroke="url(#strand)"
        strokeWidth="2"
      />
      <path
        d={rings.map((p, i) => `${i ? "L" : "M"}${p.x2},${p.y2}`).join(" ")}
        stroke="url(#strand)"
        strokeWidth="2"
      />
      {rings.map((p, i) => (
        <g key={i}>
          <line
            x1={p.x}
            y1={p.y}
            x2={p.x2}
            y2={p.y2}
            stroke="#9884c8"
            strokeWidth=".85"
            opacity=".5"
          />
          {i > 0 && (
            <>
              <line
                x1={p.x}
                y1={p.y}
                x2={rings[i - 1].x2}
                y2={rings[i - 1].y2}
                stroke="#a899c7"
                strokeWidth=".6"
                opacity=".28"
              />
              <line
                x1={p.x2}
                y1={p.y2}
                x2={rings[i - 1].x}
                y2={rings[i - 1].y}
                stroke="#a899c7"
                strokeWidth=".6"
                opacity=".28"
              />
            </>
          )}
          <circle
            cx={p.x}
            cy={p.y}
            r={i % 3 === 0 ? 5 : 3.5}
            fill="url(#node)"
          />
          <circle
            cx={p.x2}
            cy={p.y2}
            r={i % 3 === 0 ? 5 : 3.5}
            fill="url(#node)"
          />
        </g>
      ))}
      <g fontSize="7" fill="var(--muted)" letterSpacing="1">
        <text x="55" y="30">
          STRUCTURE / 001
        </text>
        <text x="369" y="314">
          MATERIAL SPACE
        </text>
      </g>
      <g stroke="#947ccf" strokeWidth=".7">
        <path d="M83 222H29v-25M408 107h56V82" />
      </g>
    </svg>
  );
}
export function Login() {
  const navigate = useNavigate();
  const store = useWorkspace();
  const [show, setShow] = useState(false),
    [error, setError] = useState(""),
    [modal, setModal] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });
  async function submit(data: z.infer<typeof schema>) {
    setError("");
    try {
      await authentication.signIn(data.email, data.password);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function enter() {
    const existing = store.user;
    if (!existing) store.login();
    const state = useWorkspace.getState();
    navigate(
      "/projects",
    );
  }
  return (
    <div className={c.page}>
      <section className={c.story}>
        <Brand />
        <div className={c.tag}>
          <span />A workspace for what comes next
        </div>
        <h1 className={c.headline}>
          From product need
          <br />
          to <em>formulation.</em>
        </h1>
        <p className={c.intro}>
          Connect requirements, research, and laboratory insight.
          <br />
          Give your next material a considered starting point.
        </p>
        <div className={c.art}>
          <MaterialNetwork />
          <span className={c.artLabel}>
            A question.
            <br />A connection.
          </span>
          <span className={c.artLabel}>A new possibility.</span>
        </div>
        <div className={c.ideas}>
          <div>
            <BookOpen size={14} />
            Evidence-backed research
          </div>
          <div>
            <FlaskConical size={14} />
            Structured experiments
          </div>
          <div>
            <GitBranch size={14} />
            Traceable decisions
          </div>
        </div>
        <div className={c.caption}>
          <span>Built for the science. Designed for the scientist.</span>
          <span>01 — ∞</span>
        </div>
      </section>
      <section className={c.formSide}>
        <div className={c.mobileBrand}>
          <Brand descriptor={false} />
        </div>
        <div className={c.topTools}>
          <span>Your workspace, your perspective</span>
          <ThemeControl />
        </div>
        <div className={c.formContainer}>
          <div className={c.welcomeIcon}>
            <Fingerprint size={23} strokeWidth={1.4} />
          </div>
          <h2>Welcome to Helix</h2>
          <p className={c.subtitle}>Sign in to your materials workspace.</p>
          <form className={c.form} onSubmit={handleSubmit(submit)} noValidate>
            <Field label="Work email">
              <div className={c.inputWrap}>
                <input
                  type="email"
                  autoComplete="username"
                  placeholder="you@company.com"
                  aria-label="Work email"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <span role="alert" className={s.error}>
                  {errors.email.message}
                </span>
              )}
            </Field>
            <Field label="Password">
              <div className={c.inputWrap}>
                <input
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  aria-label="Password"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                <button
                  type="button"
                  className={c.eye}
                  aria-label={show ? "Hide password" : "Show password"}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <span role="alert" className={s.error}>
                  {errors.password.message}
                </span>
              )}
            </Field>
            <div className={c.options}>
              <label className={c.remember}>
                <input type="checkbox" />
                Remember me
              </label>
              <Link className={c.forgot} to="/forgot-password">
                Forgot password?
              </Link>
            </div>
            {error && (
              <div className={c.error} role="alert">
                {error}
              </div>
            )}
            <Button
              type="submit"
              variant="primary"
              className={c.submit}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
              {isSubmitting ? (
                <LoaderCircle size={16} />
              ) : (
                <ArrowRight size={16} />
              )}
            </Button>
          </form>
          <div className={c.or}>New to the workspace?</div>
          <Button className={c.demoButton} onClick={enter}>
            <FlaskConical size={15} />
            Explore demo workspace
            <ArrowRight size={14} />
          </Button>
          <p className={c.demoNote}>
            A little curiosity goes a long way. No account needed.
            <br />
            Illustrative data. Local demo. No live AI or authentication.
          </p>
          <div className={c.security}>
            <LockKeyhole size={12} />
            Your ideas deserve a dedicated workspace.
          </div>
        </div>
        <footer className={c.footer}>
          <span>© 2026 Helix. Made for discovery.</span>
          <div className={c.footerLinks}>
            <button onClick={() => setModal("Privacy & demo data")}>
              Privacy
            </button>
            <button onClick={() => setModal("Help & support")}>
              Get help ↗
            </button>
          </div>
        </footer>
      </section>
      {modal && (
        <Modal title={modal} onClose={() => setModal("")}>
          <p className={s.muted}>
            Helix is a local frontend demonstration. Demo project data is stored
            in this browser and can be cleared in Settings. Passwords are never
            stored. No authentication provider, extraction service, live
            collaboration, or AI backend is connected. Use only illustrative
            data.
          </p>
        </Modal>
      )}
    </div>
  );
}
export function ForgotPassword() {
  const [error, setError] = useState("");
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div className={s.panel} style={{ width: 440, maxWidth: "100%" }}>
        <Brand />
        <h1 style={{ marginTop: 32 }}>Reset your password</h1>
        <p className={s.muted} style={{ margin: "12px 0 24px" }}>
          Recovery requires a connected authentication service.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await authentication.recover("");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          <Field label="Work email">
            <input type="email" required placeholder="you@company.com" />
          </Field>
          <Button variant="primary" style={{ marginTop: 20 }}>
            <ShieldCheck size={16} />
            Check recovery availability
          </Button>
        </form>
        {error && (
          <p role="alert" className={s.error} style={{ marginTop: 20 }}>
            {error}
          </p>
        )}
        <Link
          to="/login"
          style={{ display: "block", marginTop: 24, color: "var(--accent)" }}
        >
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}
