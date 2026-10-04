import { test, expect, type Page } from "@playwright/test";
async function enter(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore demo workspace" }).click();
  await page.getByRole("radio", { name: /Scientist I work/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
}
test("login, demo intake, persisted brief, and formulation start", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeDisabled();
  await enter(page);
  await page.getByRole("radio", { name: /Tile, stone and flooring/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("radio", { name: /Tile and stone adhesives/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByLabel("Project name", { exact: true })
    .fill("E2E exterior adhesive");
  await page.reload();
  await expect(page.getByLabel("Project name", { exact: true })).toHaveValue(
    "E2E exterior adhesive",
  );
  await page
    .getByLabel("Presentation mode", { exact: true })
    .selectOption("Non-scientist");
  await expect(page.getByLabel("Project name", { exact: true })).toHaveValue(
    "E2E exterior adhesive",
  );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "4. Review" }).click();
  await page.getByRole("button", { name: "Start formulation" }).click();
  await expect(
    page.getByRole("heading", { name: "E2E exterior adhesive", exact: true }),
  ).toBeVisible();
});
test("failed baseline creates a new iteration and retains historical results", async ({
  page,
}) => {
  await enter(page);
  await page.goto("/projects/helix-001?stage=Analysis");
  await page.getByLabel("Compare trial revision").selectOption("trial-1");
  await expect(
    page.getByRole("button", { name: "Accept iteration" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Accept iteration" }).click();
  await expect(page).toHaveURL(/stage=Trials/);
  await expect(
    page.getByText("T03 · accepted iteration", { exact: true }),
  ).toBeVisible();
  const data = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("helix-demo-workspace")!).state
        .projects[0],
  );
  expect(data.trials).toHaveLength(3);
  expect(data.results).toHaveLength(8);
  expect(data.trials[0].locked).toBe(true);
});
test("approval requires reviewer sign-off and locks the approved revision", async ({
  page,
}) => {
  await enter(page);
  await page.goto("/projects/helix-001?stage=Final");
  await expect(
    page.getByRole("button", { name: "Approve formulation" }),
  ).toBeDisabled();
  await page.goto("/settings");
  await page.getByLabel("Demo role", { exact: true }).selectOption("Reviewer");
  await page.goto("/projects/helix-001?stage=Results");
  await page
    .getByRole("button", { name: "Review results", exact: true })
    .click();
  await page.goto("/projects/helix-001?stage=Final");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Approve formulation" }).click();
  await expect(
    page.getByText("Approved · locked", { exact: true }),
  ).toBeVisible();
  const data = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("helix-demo-workspace")!).state
        .projects[0],
  );
  expect(data.trials[1].locked).toBe(true);
  expect(data.approvals.at(-1).action).toBe("Approved");
});
