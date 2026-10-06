import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";

const BASE = process.env.HELIX_URL || "";
const projects = [
  ["HX-001", "Tile cleaner for ceramic and porcelain surfaces"],
  ["HX-002", "Cementitious tile adhesive"],
  ["HX-003", "Two-component epoxy tile grout"],
  ["HX-004", "Two-component epoxy bonding adhesive"],
  ["HX-005", "Cementitious waterproofing coating"],
] as const;
const steps = ["type", "sources", "describe", "literature", "review", "create"];
const subs = ["approaches", "components", "composition", "process", "experiment"];

async function enter(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.getByRole("button", { name: "Explore demo workspace" }).click();
  await expect(page).toHaveURL(/\/projects$/);
}

test("projects list: five construction-chemical reference samples with cards, table, search and filters", async ({ page }) => {
  await enter(page);
  for (const [, title] of projects) await expect(page.getByRole("heading", { name: title, level: 2 })).toBeVisible();
  const body = (await page.locator("main").innerText()).toLowerCase();
  for (const word of ["aspirin", "paracetamol", "synthesis"]) expect(body).not.toContain(word);
  await expect(page.getByRole("link", { name: /View project/ })).toHaveCount(5);
  await page.getByPlaceholder("Search by project, category or focus").fill("epoxy");
  await expect(page.getByText("Showing 2 of 5 projects.")).toBeVisible();
  await page.getByPlaceholder("Search by project, category or focus").fill("");
  await page.getByLabel("Filter by product category").selectOption("Waterproofing coating");
  await expect(page.getByText("Showing 1 of 5 projects.")).toBeVisible();
  await page.getByLabel("Filter by product category").selectOption("All types");
  await page.getByRole("button", { name: "Table view" }).click();
  const table = page.getByRole("region", { name: "Projects table" });
  for (const h of ["Project", "Product category", "Selected approach", "Ingredients", "Plan status", "Experimental validation", "Final report", "Actions"])
    await expect(table.getByRole("columnheader", { name: h, exact: true })).toBeVisible();
  await table.getByRole("row", { name: /Cementitious tile adhesive/ }).getByRole("button", { name: "Sources" }).click();
  await expect(page.getByRole("dialog").getByRole("link", { name: /Techline 9/ })).toHaveAttribute("href", /dow\.com/);
});

for (const [id, title] of projects) {
  test(`${id}: every step and substep opens; tables, infographics and report`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await enter(page);
    await page.goto(`${BASE}/projects/${id}`);
    await expect(page).toHaveURL(new RegExp(`${id}/create$`));
    await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
    const triplet = page.locator("dl").filter({ hasText: "Experimental validation" }).first();
    await expect(triplet).toContainText("Completed");
    await expect(triplet).toContainText("Reference sample");
    await expect(triplet).toContainText("Not performed");
    for (const region of ["Pathway comparison", "Processing conditions", "Performance-testing matrix", "Cost table", "Literature table"])
      await expect(page.getByRole("region", { name: region })).toBeVisible();
    await expect(page.getByRole("region", { name: /^Formulation table/ }).first()).toBeVisible();
    for (const fig of ["Formulation composition by function", "Processing flow", "Project summary", "Performance comparison of trial batches"])
      await expect(page.getByRole("heading", { name: fig })).toBeVisible();
    await expect(page.getByRole("region", { name: "Cost table" }).getByRole("row", { name: /Total/ })).toContainText("Not estimated");
    for (const step of steps) {
      await page.goto(`${BASE}/projects/${id}/${step}`);
      await expect(page.locator("#step-heading")).toBeVisible();
    }
    for (const sub of subs) {
      await page.goto(`${BASE}/projects/${id}/pathways/${sub}`);
      await expect(page.locator("#step-heading")).toHaveText("Pathways");
      await expect(page.getByRole("tab", { selected: true })).toBeVisible();
    }
    await page.goto(`${BASE}/projects/${id}/pathways/components`);
    await expect(page.getByText(/Saved results from/)).toBeVisible();
    await page.goto(`${BASE}/projects/${id}/create`);
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download report" }).first().click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(new RegExp(`^${id}-.*-report\\.html$`));
    const html = readFileSync((await file.path())!, "utf8");
    for (const s of ["Plan status", "Reference sample", "Not performed", "Composition, wt.%", "Processing conditions", "Performance-testing matrix", "Unit rate, ₹/kg", "Not estimated", "Literature"])
      expect(html).toContain(s);
    expect(html.toLowerCase()).not.toMatch(/aspirin|paracetamol|synthesis/);
    expect(html).not.toMatch(/\$\d/);
    expect(errors).toEqual([]);
  });
}

test("multicomponent calculations: epoxy ratio, polymer/cement and the workbook", async ({ page }) => {
  await enter(page);
  await page.goto(`${BASE}/projects/HX-003/pathways/composition`);
  await expect(page.getByText("Part A : Part B = 100 : 12 by weight").first()).toBeVisible();
  await expect(page.getByText("47.7 phr")).toBeVisible();
  await page.goto(`${BASE}/projects/HX-005/pathways/composition`);
  await expect(page.getByRole("region", { name: "Component ratios" })).toContainText("0.64");
  await expect(page.getByRole("region", { name: "Component ratios" })).toContainText("Meets guide");
  await page.goto(`${BASE}/projects/HX-002/create`);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Workbook (.xlsx)" }).click();
  const book = XLSX.read(readFileSync((await (await download).path())!), { type: "buffer" });
  expect(book.SheetNames).toEqual(["Summary", "Formulation", "Approaches", "Process", "Tests", "Cost", "Literature"]);
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(book.Sheets.Formulation);
  expect(rows.find((r) => r.Ingredient === "Ordinary Portland cement")!["Batch quantity (kg)"]).toBeCloseTo(8.75, 6);
});

test("Use as starting point: copy is editable, recalculates, accepts a proposal, saves and reopens; reference intact", async ({ page }) => {
  await enter(page);
  await page.goto(`${BASE}/projects/HX-002/create`);
  await page.getByRole("button", { name: "Use as starting point" }).first().click();
  await expect(page).toHaveURL(/\/projects\/HX-101\/type$/);
  await page.getByLabel(/Project title/).fill("My C2TE adhesive");
  await page.goto(`${BASE}/projects/HX-101/pathways/composition`);
  await page.getByLabel(/Batch size/).first().fill("10");
  const table = page.getByRole("region", { name: "Formulation table: Powder" });
  await expect(table.getByRole("row", { name: /Ordinary Portland cement/ })).toContainText("3.500");
  await page.getByLabel("Redispersible polymer powder composition in wt.%").fill("4");
  await expect(table.getByRole("row", { name: /Total/ })).toContainText("101.00");
  await expect(page.getByText(/Proposed: change Silica sand from 38.05% to 37.05%/)).toBeVisible();
  await page.getByRole("button", { name: "Accept proposed change" }).click();
  await expect(table.getByRole("row", { name: /Total/ })).toContainText("100.00");
  await page.reload();
  await expect(page.getByRole("region", { name: "Formulation table: Powder" }).getByRole("row", { name: /Total/ })).toContainText("balanced");
  await page.goto(`${BASE}/projects/HX-101/create`);
  await expect(page.getByText("Plan status").first()).toBeVisible();
  await page.getByRole("button", { name: /Generate plan/ }).click();
  await expect(page.locator("dl").filter({ hasText: "Experimental validation" }).first()).toContainText("User project");
  await page.goto(`${BASE}/projects/HX-101`);
  await expect(page.getByRole("heading", { name: "My C2TE adhesive", level: 1 })).toBeVisible();
  await page.goto(`${BASE}/projects/HX-002/pathways/composition`);
  await expect(page.getByRole("region", { name: "Formulation table: Powder" }).getByRole("row", { name: /Redispersible/ })).toContainText("3.00");
});

test("complete seven-step workflow for a new epoxy grout; blob shows and clears", async ({ page }) => {
  await enter(page);
  await page.getByRole("button", { name: "New project" }).click();
  await expect(page).toHaveURL(/\/projects\/new$/);
  await expect(page.getByRole("heading", { name: "What are you formulating?" })).toBeVisible();
  await page.getByRole("link", { name: /Tile, stone and flooring/ }).click();
  await expect(page).toHaveURL(/\/projects\/new\/tile$/);
  await expect(page.getByRole("button", { name: "Start project" })).toBeDisabled();
  await page.getByRole("radio", { name: /Epoxy grouts/ }).click();
  await expect(page.getByRole("radio", { name: /^Epoxy grout\b/ })).toBeChecked();
  await page.reload();
  await expect(page.getByRole("radio", { name: /Epoxy grouts/ })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "Start project" }).click();
  await expect(page).toHaveURL(/\/projects\/HX-101\/type$/);
  await expect(page.getByLabel(/Product category/)).toHaveValue("tile");
  await expect(page.getByLabel(/Product family/)).toHaveValue("tile-2");
  await page.getByLabel(/Formulation task/).selectOption("New formulation");
  await page.getByLabel(/Project title/).fill("Epoxy grout trial");
  await page.getByRole("button", { name: "Next: Data Sources" }).click();
  const add = page.getByRole("group", { name: "Add a data source" });
  await add.getByLabel(/Document type/).selectOption("Raw-material data sheet");
  await add.getByLabel(/^Title/).fill("Epoxy curing agents guide");
  await add.getByLabel(/Link/).fill("ftp://bad");
  await add.getByRole("button", { name: "Add source" }).click();
  await expect(page.getByText("Enter a full link starting with https://")).toBeVisible();
  await add.getByLabel(/Link/).fill("https://products.evonik.com/assets/90/41/Epoxy_curing_agents_product_guide_Americas_EN_Asset_819041.pdf");
  await add.getByRole("button", { name: "Add source" }).click();
  await page.getByRole("button", { name: "Next: Describe" }).click();
  await page.getByLabel(/Objective/).fill("Develop an epoxy grout for kitchen tile joints.");
  await page.getByLabel(/^Application/).fill("Grouting floor joints");
  await page.getByRole("button", { name: "Add substrate" }).click();
  await page.getByLabel("Substrates and surfaces 1").fill("Porcelain tile joints");
  await page.getByRole("button", { name: "Next: Literature" }).click();
  await page.getByRole("button", { name: "Add literature record" }).click();
  await page.getByLabel("Relevant finding").fill("Amidoamine hardener listed for tile grouts at 50 phr.");
  await page.getByRole("button", { name: "Next: Pathways" }).click();
  await expect(page).toHaveURL(/pathways\/approaches$/);
  await page.getByLabel(/Approach name/).fill("Amidoamine-cured filled epoxy");
  await page.getByRole("button", { name: "Add approach" }).click();
  await page.getByLabel(/Why this approach/).fill("Supplier lists the hardener for tile grouts.");
  await page.getByRole("tab", { name: /Components/ }).click();
  await page.getByRole("button", { name: "Identify formulation components" }).click();
  await expect(page.getByText("Identifying formulation components…")).toBeVisible();
  await expect(page.getByText("Identifying formulation components…")).toBeHidden({ timeout: 10000 });
  await expect(page.getByText(/Suggested a starting component list/)).toBeVisible();
  await page.getByRole("tab", { name: /Composition/ }).click();
  for (const [label, v] of [["Liquid epoxy resin composition in wt.%", "25"], ["Silica sand composition in wt.%", "73"], ["Fumed silica composition in wt.%", "2"], ["Amine hardener composition in wt.%", "100"]])
    await page.getByLabel(label).fill(v);
  await page.getByLabel("Part A (resin + filler), parts by weight").fill("100");
  await page.getByLabel("Part B (hardener), parts by weight").fill("12.5");
  await expect(page.getByRole("region", { name: "Formulation table: Part A (resin + filler)" }).getByRole("row", { name: /Total/ })).toContainText("balanced");
  await page.getByRole("tab", { name: /Process/ }).click();
  await page.getByRole("button", { name: "Add processing stage" }).click();
  await page.getByLabel("Stage 1 stage").fill("Site mixing");
  await page.getByRole("tab", { name: /Experiment/ }).click();
  await page.getByRole("button", { name: /Add suggested tests/ }).click();
  for (const [i, t] of ["≥ 45 min", "Water cleanable", "To be set"].entries()) await page.getByLabel(/target$/).nth(i).fill(t);
  await page.getByRole("button", { name: "Add trial batch" }).click();
  await page.getByRole("navigation", { name: "Project workflow" }).getByRole("button", { name: /Review/ }).click();
  await expect(page.getByText(/are complete/)).toBeVisible();
  await page.getByRole("button", { name: "Continue to Create" }).click();
  await page.getByRole("button", { name: "Generate plan" }).click();
  await expect(page.locator("#outcome")).toHaveText("Epoxy grout plan: Amidoamine-cured filled epoxy");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download report" }).first().click();
  expect((await download).suggestedFilename()).toBe("HX-101-epoxy-grout-trial-report.html");
  await page.goto(`${BASE}/projects/HX-101/describe`);
  await page.getByLabel(/Batch size/).fill("12");
  await page.goto(`${BASE}/projects/HX-101/create`);
  await expect(page.getByText("The plan is out of date")).toBeVisible();
});

test("identification failure path explains the fix and clears the blob", async ({ page }) => {
  await enter(page);
  await page.goto(`${BASE}/projects/new/tile?family=tile-0`);
  await page.getByRole("button", { name: "Start project" }).click();
  await expect(page).toHaveURL(/HX-101\/type$/);
  await page.evaluate(() => {
    const st = JSON.parse(localStorage.getItem("helix-planner")!);
    st.state.projects[0].category = "";
    localStorage.setItem("helix-planner", JSON.stringify(st));
  });
  await page.goto(`${BASE}/projects/HX-101/pathways/components`);
  await expect(page.getByRole("button", { name: "Identify formulation components" })).toBeDisabled();
  await expect(page.getByText(/Choose a product category in/)).toBeVisible();
  await page.getByRole("link", { name: "Type" }).first().click();
  await expect(page).toHaveURL(/\/type$/);
});

test("earlier synthesis-era user projects are archived, not deleted", async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await page.evaluate(() => {
    localStorage.setItem("helix-planner", JSON.stringify({ version: 1, state: { projects: [{ id: "HX-101", title: "My old plan", stages: [] }], nextNumber: 102 } }));
  });
  await page.getByRole("button", { name: "Explore demo workspace" }).click();
  await expect(page.getByText("Showing 5 of 5 projects.")).toBeVisible();
  await page.goto(`${BASE}/settings`);
  await expect(page.getByRole("heading", { name: "Archived projects" })).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("helix-planner")!));
  expect(stored.version).toBe(3);
  expect(stored.state.archived[0].title).toBe("My old plan");
  expect(stored.state.nextNumber).toBe(102);
});

test("new project: category and family come first; unknown category redirects", async ({ page }) => {
  await enter(page);
  await page.goto(`${BASE}/projects/new/not-a-category`);
  await expect(page).toHaveURL(/\/projects\/new$/);
  await page.getByPlaceholder("Search categories and product families").fill("waterproof");
  await expect(page.getByRole("link", { name: /Waterproofing and sealing/ })).toBeVisible();
  await page.getByRole("link", { name: /Waterproofing and sealing/ }).click();
  await page.getByRole("radio", { name: /Joint sealants/ }).click();
  await expect(page.getByRole("radio", { name: /General formulation/ })).toBeChecked();
  await page.getByRole("button", { name: "Back to categories" }).click();
  await expect(page).toHaveURL(/\/projects\/new$/);
  await page.getByRole("button", { name: "Back to projects" }).click();
  await expect(page).toHaveURL(/\/projects$/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("helix-planner") || '{"state":{"projects":[]}}').state.projects.length)).toBe(0);
});

test("direct links, refresh, back/forward, legacy routes", async ({ page }) => {
  await enter(page);
  await page.goto(`${BASE}/projects/HX-004/pathways/process`);
  await expect(page).toHaveTitle("Pathways · Process · Two-component epoxy bonding adhesive · Helix");
  await page.reload();
  await expect(page.getByRole("tab", { name: /Process/ })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: /Experiment/ }).click();
  await page.goBack();
  await expect(page).toHaveURL(/pathways\/process$/);
  await page.goForward();
  await expect(page).toHaveURL(/pathways\/experiment$/);
  await page.goto(`${BASE}/projects/HX-004/pathways/analysis`);
  await expect(page).toHaveURL(/HX-004\/(create|pathways)/);
  for (const legacy of ["/benchmarks", "/raw-materials", "/templates", "/tasks"]) {
    await page.goto(`${BASE}${legacy}`);
    await expect(page).toHaveURL(/\/projects$/);
  }
  await page.goto(`${BASE}/projects/HX-999/type`);
  await expect(page.getByText("Project not found", { exact: true }).last()).toBeVisible();
});

test("mobile layout, keyboard navigation and no horizontal overflow", async ({ page }) => {
  await enter(page);
  for (const width of [390, 820, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/projects", "/projects/new", "/projects/new/tile?family=tile-0", "/projects/HX-002/type", "/projects/HX-005/create", "/projects/HX-003/pathways/composition", "/projects/HX-002/pathways/experiment", "/projects/HX-001/literature", "/reports", "/settings"]) {
      await page.goto(`${BASE}${route}`);
      await page.locator("main h1").first().waitFor();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width} ${route}`).toBe(true);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/projects/HX-001/create`);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Reports" }).click();
  await expect(page).toHaveURL(/\/reports$/);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BASE}/projects/HX-002/pathways/approaches`);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.getByRole("tab", { name: /Approaches/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/pathways\/components$/);
});
