import { test, expect, type Page } from "@playwright/test";
import * as XLSX from "xlsx";
import { readFileSync } from "node:fs";
async function demo(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: "Explore demo workspace" }).click();
  await page.getByRole("radio", { name: /Scientist I work/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
}
test("pasted results reject incompatible units and preserve missing specimens", async ({
  page,
}) => {
  await demo(page);
  await page.goto("/projects/helix-001?stage=Results");
  await page.getByRole("button", { name: "Paste from spreadsheet" }).click();
  await page.getByLabel("Paste spreadsheet cells").fill("slip\t0.4\t\t0.5\tcm");
  await page.getByRole("button", { name: "Preview column mappings" }).click();
  await expect(
    page.getByText("Unit does not match", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Apply validated rows" }),
  ).toBeDisabled();
  await page.getByLabel("Paste spreadsheet cells").fill("slip\t0.4\t\t0.5\tmm");
  await page.getByRole("button", { name: "Preview column mappings" }).click();
  await page.getByRole("button", { name: "Apply validated rows" }).click();
  await page.goto("/settings");
  await page.getByLabel("Demo role", { exact: true }).selectOption("Reviewer");
  await page.goto("/projects/helix-001?stage=Results");
  await expect(
    page.getByRole("button", { name: "Review results", exact: true }),
  ).toBeDisabled();
  await page.goto("/projects/helix-001?stage=Final");
  await page.getByRole("checkbox").check();
  await expect(
    page.getByRole("button", { name: "Approve formulation" }),
  ).toBeDisabled();
  await expect(
    page.getByText("slip: mandatory test pending or not passing", {
      exact: true,
    }),
  ).toBeVisible();
});
test("research jobs continue across navigation and failed jobs can retry", async ({
  page,
}) => {
  await demo(page);
  await page.goto("/tasks");
  await page.getByRole("button", { name: "Demonstrate failed job" }).click();
  await page
    .getByRole("link", { name: "Projects", exact: false })
    .first()
    .click();
  await page.goto("/tasks");
  await expect(
    page.getByRole("button", { name: "Retry", exact: true }),
  ).toBeVisible({ timeout: 12000 });
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByRole("link", { name: "Review results" })).toBeVisible({
    timeout: 12000,
  });
});
test("contextual assistant requires explicit acceptance of a brief change", async ({
  page,
}) => {
  await demo(page);
  await page.goto("/projects/helix-001?stage=Analysis");
  await page.getByRole("button", { name: "Ask Helix", exact: true }).click();
  await page
    .getByRole("button", { name: "Suggest a lower-cost variant." })
    .click();
  await expect(
    page.getByText("Proposed brief revision", { exact: true }),
  ).toBeVisible();
  let revision = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("helix-demo-workspace")!).state
        .projects[0].revisions.length,
  );
  expect(revision).toBe(1);
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  revision = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("helix-demo-workspace")!).state
        .projects[0].revisions.length,
  );
  expect(revision).toBe(2);
});
test("desktop themes, responsive layouts, and primary routes have no page overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/login");
  for (const width of [1280, 1440, 1920, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(
      page.getByRole("heading", { name: "Welcome to Helix" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("button", { name: "dark theme", exact: true }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await demo(page);
  for (const route of [
    "/projects",
    "/projects/helix-001?stage=Trials",
    "/benchmarks",
    "/raw-materials",
    "/templates",
    "/reports",
    "/tasks",
    "/settings",
  ]) {
    await page.goto(route);
    await page.locator("main h1").waitFor();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      route,
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
test("exports a real versioned workbook and imports a reviewed material template", async ({
  page,
}) => {
  await demo(page);
  await page.goto("/projects/helix-001");
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export workbook", exact: true })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  const book = XLSX.read(readFileSync((await download.path())!), {
    type: "buffer",
  });
  expect(book.SheetNames).toEqual(
    expect.arrayContaining([
      "Brief",
      "Results",
      "Analysis",
      "Sources",
      "Approvals",
    ]),
  );
  expect(XLSX.utils.sheet_to_json(book.Sheets.Results)).toHaveLength(8);
  const imported = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    imported,
    XLSX.utils.json_to_sheet([
      {
        name: "Test alternative filler",
        function: "Filler",
        grade: "Fine",
        supplier: "Test supplier",
        price: "",
        currency: "USD",
        stock: "Available",
        min: 0,
        max: 20,
      },
    ]),
    "Materials",
  );
  await page.goto("/raw-materials");
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "materials.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: XLSX.write(imported, { type: "buffer", bookType: "xlsx" }),
    });
  await page.getByRole("button", { name: "Validate & preview 1 rows" }).click();
  await page.getByRole("button", { name: "Import validated rows" }).click();
  await expect(
    page.getByText("Test alternative filler", { exact: true }),
  ).toBeVisible();
  const material = await page.evaluate(() =>
    JSON.parse(
      localStorage.getItem("helix-demo-workspace")!,
    ).state.materials.find(
      (m: { name: string }) => m.name === "Test alternative filler",
    ),
  );
  expect(material.price).toBeNull();
  expect(material.approved).toBe(false);
});
