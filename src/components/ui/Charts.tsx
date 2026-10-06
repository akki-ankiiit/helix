import type { ReactNode } from "react";
import { Check, Minus, X } from "lucide-react";
import c from "./charts.module.css";

/**
 * A chart with a title, a one-line takeaway, and its values in a table so
 * the information never depends on reading the graphic or its colours.
 */
export function Figure({
  title,
  takeaway,
  children,
  values,
  note,
}: {
  title: string;
  takeaway: ReactNode;
  children: ReactNode;
  values?: { headers: string[]; rows: (string | number)[][] };
  note?: ReactNode;
}) {
  return (
    <figure className={c.figure}>
      <figcaption>
        <h3>{title}</h3>
        <p>{takeaway}</p>
      </figcaption>
      {children}
      {note && <p className={c.note}>{note}</p>}
      {values && (
        <details className={c.values}>
          <summary>Show values as a table</summary>
          <div className={c.valuesWrap}>
            <table>
              <thead>
                <tr>
                  {values.headers.map((h, i) => (
                    <th key={h} className={i ? c.num : ""}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {values.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((v, j) => (
                      <td key={j} className={j ? c.num : ""}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </figure>
  );
}

export interface TargetSeries {
  label: string;
  value: number | null;
  display: string;
  /** Visual role: earlier trial, latest trial, or reference product. */
  tone: "previous" | "current" | "reference";
  meets?: boolean | null;
}
export interface TargetRow {
  name: string;
  unit: string;
  /** Lower and/or upper bound of the passing range. */
  min?: number;
  max?: number;
  targetText: string;
  series: TargetSeries[];
}

/**
 * Measured vs target. Each property has its own zero-based scale because the
 * units differ; bars are never compared across rows.
 */
export function TargetChart({ rows }: { rows: TargetRow[] }) {
  return (
    <div className={c.targetChart}>
      <Legend
        items={[
          { label: "Earlier trial", tone: "previous" },
          { label: "Latest trial", tone: "current" },
          { label: "Benchmark", tone: "reference" },
          { label: "Passing range", tone: "zone" },
        ]}
      />
      {rows.map((row) => {
        const values = row.series
          .map((s) => s.value)
          .filter((v): v is number => v !== null);
        const scaleMax =
          Math.max(...values, row.max ?? 0, row.min ?? 0, 0) * 1.2 || 1;
        const pct = (v: number) => `${Math.min(100, (v / scaleMax) * 100)}%`;
        const zoneLeft = row.min !== undefined ? pct(row.min) : "0%";
        const zoneRight =
          row.max !== undefined ? `${100 - (row.max / scaleMax) * 100}%` : "0%";
        return (
          <div className={c.targetRow} key={row.name}>
            <div className={c.targetLabel}>
              <b>{row.name}</b>
              <small>
                Target {row.targetText} {row.unit}
              </small>
            </div>
            <div className={c.targetBars}>
              <div className={c.overlay} aria-hidden="true">
                <div
                  className={c.zone}
                  style={{ left: zoneLeft, right: zoneRight }}
                />
                {row.min !== undefined && (
                  <span className={c.targetLine} style={{ left: pct(row.min) }} />
                )}
                {row.max !== undefined && (
                  <span className={c.targetLine} style={{ left: pct(row.max) }} />
                )}
              </div>
              {row.series.map((s) => (
                <div className={c.barLine} key={s.label}>
                  <span className={c.seriesName}>{s.label}</span>
                  <div className={c.track}>
                    {s.value !== null ? (
                      <span
                        className={`${c.bar} ${c[s.tone]}`}
                        style={{ width: pct(s.value) }}
                      />
                    ) : null}
                  </div>
                  <span className={c.barValue}>
                    {s.value === null ? "No data" : `${s.display} ${row.unit}`}
                    {s.meets === true && (
                      <Check size={12} aria-label="meets target" />
                    )}
                    {s.meets === false && (
                      <X size={12} aria-label="misses target" />
                    )}
                    {s.meets === null && s.value !== null && (
                      <Minus size={12} aria-label="not evaluated" />
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Horizontal bars on one shared, zero-based scale. */
export function BarList({
  items,
}: {
  items: {
    label: string;
    value: number | null;
    display: string;
    highlight?: boolean;
    tag?: string;
  }[];
}) {
  const max =
    Math.max(...items.map((i) => i.value ?? 0).filter(Number.isFinite), 0) ||
    1;
  return (
    <div className={c.barList}>
      {items.map((item) => (
        <div className={c.barItem} key={item.label}>
          <span className={c.barItemLabel}>
            {item.label}
            {item.tag && <em>{item.tag}</em>}
          </span>
          <div className={c.track}>
            {item.value !== null && (
              <span
                className={`${c.bar} ${item.highlight ? c.current : c.previous}`}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            )}
          </div>
          <span className={c.barValue}>{item.display}</span>
        </div>
      ))}
    </div>
  );
}

const palette = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];
/** A 100% breakdown with a labelled legend (values are always in text). */
export function Breakdown({
  items,
  label,
}: {
  label: string;
  items: { name: string; share: number; display: string }[];
}) {
  const total = items.reduce((a, b) => a + b.share, 0) || 1;
  return (
    <div className={c.breakdown}>
      <div className={c.stack} role="img" aria-label={label}>
        {items.map((item, i) => (
          <span
            key={item.name}
            title={`${item.name}: ${item.display}`}
            style={{
              width: `${(item.share / total) * 100}%`,
              background: palette[i % palette.length],
            }}
          />
        ))}
      </div>
      <ul className={c.legendList}>
        {items.map((item, i) => (
          <li key={item.name}>
            <span
              className={c.swatch}
              style={{ background: palette[i % palette.length] }}
              aria-hidden="true"
            />
            <span>{item.name}</span>
            <b>{item.display}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Legend({
  items,
}: {
  items: { label: string; tone: "previous" | "current" | "reference" | "zone" }[];
}) {
  return (
    <ul className={c.legend} aria-label="Chart legend">
      {items.map((i) => (
        <li key={i.label}>
          <span className={`${c.key} ${c[i.tone]}`} aria-hidden="true" />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

export function PieChart({
  items,
  label,
}: {
  label: string;
  items: { name: string; share: number; display: string }[];
}) {
  const total = items.reduce((a, b) => a + b.share, 0) || 1;
  let cumulative = 0;

  return (
    <div className={c.breakdown}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
        <svg
          viewBox="-1.05 -1.05 2.1 2.1"
          style={{ transform: "rotate(-90deg)", width: "100%", maxWidth: "220px", maxHeight: "220px", overflow: "visible" }}
          aria-label={label}
        >
          {items.map((item, i) => {
            const share = item.share / total;
            if (share >= 0.999) {
              return (
                <circle
                  key={item.name}
                  cx="0"
                  cy="0"
                  r="1"
                  fill={palette[i % palette.length]}
                >
                  <title>{`${item.name}: ${item.display}`}</title>
                </circle>
              );
            }
            const startAngle = cumulative * 2 * Math.PI;
            const endAngle = (cumulative + share) * 2 * Math.PI;
            cumulative += share;

            const startX = Math.cos(startAngle);
            const startY = Math.sin(startAngle);
            const endX = Math.cos(endAngle);
            const endY = Math.sin(endAngle);

            const largeArcFlag = share > 0.5 ? 1 : 0;

            const pathData = [
              `M 0 0`,
              `L ${startX} ${startY}`,
              `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
              `Z`,
            ].join(" ");

            return (
              <path
                key={item.name}
                d={pathData}
                fill={palette[i % palette.length]}
                stroke="var(--surface)"
                strokeWidth="0.02"
              >
                <title>{`${item.name}: ${item.display}`}</title>
              </path>
            );
          })}
        </svg>
      </div>
      <ul className={c.legendList}>
        {items.map((item, i) => (
          <li key={item.name}>
            <span
              className={c.swatch}
              style={{ background: palette[i % palette.length] }}
              aria-hidden="true"
            />
            <span>{item.name}</span>
            <b>{item.display}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
