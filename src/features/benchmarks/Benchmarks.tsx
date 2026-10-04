import { Badge, s } from "../../components/ui";
import { BenchmarkPicker } from "./BenchmarkPicker";
import { useWorkspace } from "../../stores/workspace";
export function Benchmarks() {
  const count = useWorkspace((s) => s.benchmarks.length);
  return (
    <>
      <div className={s.pageHeader}>
        <div>
          <div className={s.eyebrow} style={{ marginBottom: 10 }}>
            CONTEXT FOR YOUR NEXT MATERIAL
          </div>
          <h1>Benchmark library</h1>
          <p>
            Reference products with clear provenance, versions, and a place in
            the evidence.
          </p>
        </div>
        <Badge>{count} reference records</Badge>
      </div>
      <div className={s.panel}>
        <BenchmarkPicker library />
      </div>
    </>
  );
}
