import { Badge, s } from "../../components/ui";
import { BenchmarkPicker } from "./BenchmarkPicker";
import { useWorkspace } from "../../stores/workspace";
export function Benchmarks() {
  const count = useWorkspace((s) => s.benchmarks.length);
  return (
    <>
      <div className={s.pageHeader}>
        <div>
          <h1>Benchmarks</h1>
          <p>
            Existing products to compare your results against. Each shows where
            its values came from (data sheet, lab test or manual entry).
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
