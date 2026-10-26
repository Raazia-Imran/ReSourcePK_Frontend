/* global process, console, document, innerWidth, URL */
// Isolated presentation checks: every API response is synthetic, never a backend test.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const out =
  process.env.UI_OUTPUT_DIR || fs.mkdtempSync(join(tmpdir(), "rethread-ui-"));
fs.mkdirSync(out, { recursive: true });
const base = process.env.UI_BASE_URL || "http://127.0.0.1:3000";
const listing = {
  id: "listing-ui",
  title:
    "Reclaimed cotton twill — heavyweight surplus for responsible production",
  description:
    "Synthetic UI fixture only. Long material descriptions should wrap naturally without obscuring purchase controls.",
  material: "Cotton",
  condition: "Unused surplus",
  unit: "kg",
  quantity: "2500",
  min_order_quantity: "25",
  price_per_unit: "350",
  organization_name:
    "Karachi Textile Collective and Circular Materials Workshop",
  purchase_mode: "both",
  status: "published",
  version: 1,
  images: [],
  price_tiers: [{ minQuantity: 100, pricePerUnit: 300 }],
  location: "Karachi",
  color: "Natural",
  composition: "100% cotton",
};
const order = {
  id: "order-ui",
  listing_title: listing.title,
  quantity: 50,
  unit: "kg",
  total_minor: 1750000,
  status: "pending_payment",
  created_at: "2026-10-25T10:00:00Z",
  payment_due_at: "2027-10-29T10:00:00Z",
};
const stats = {
  summary: {
    order_count: 12,
    awaiting_seller: 3,
    awaiting_payment: 2,
    paid_orders: 7,
    paid_quantity_by_unit: [],
  },
  recent: [order],
  listings: { published: 12, drafts: 3, pending_review: 4, total: 19 },
  orders: {
    total: 15,
    paid: 7,
    awaiting_response: 3,
    awaiting_seller: 3,
    paid_total_minor: 12000000,
  },
  users: { verified: 12, total: 15 },
  organizations: { active: 5, total: 6 },
  applications: { pending: 3 },
  monthly: [],
  auditActivity: [],
};
const collection = (items = []) => ({
  items,
  total: items.length,
  page: 1,
  limit: 20,
});
function identity(role) {
  return {
    user: {
      id: "ui-user",
      full_name: "Synthetic Reviewer With A Long Display Name",
      email: "ui@example.invalid",
      email_verified: true,
      status: "active",
    },
    platformRoles: ["admin", "reviewer"].includes(role)
      ? [role === "admin" ? "platform_admin" : "platform_reviewer"]
      : [],
    platformPermissions:
      role === "reviewer" ? ["listings.review", "seller_requests.review"] : [],
    memberships: ["owner", "manager", "staff"].includes(role)
      ? [
          {
            organization_id: "org-ui",
            slug: "textiles",
            organization_name: listing.organization_name,
            role,
            can_invite_staff: role !== "staff",
            permissions: [
              "listings.view",
              "listings.manage",
              ...(role !== "staff" ? ["orders.confirm"] : []),
            ],
          },
        ]
      : [],
  };
}
async function setup(page, role, state = "populated") {
  // Fixture dispatcher mirrors independent API shapes; never imported by the app.
  // eslint-disable-next-line sonarjs/cognitive-complexity
  await page.route("http://localhost:5000/**", async (route) => {
    const url = new URL(route.request().url()),
      path = url.pathname.replace("/api/v1", "");
    let data;
    if (path === "/auth/refresh") {
      if (role === "public")
        return route.fulfill({
          status: 401,
          json: { error: { message: "Signed out" } },
        });
      data = { accessToken: "synthetic-browser-only", context: identity(role) };
    } else if (state === "error")
      return route.fulfill({
        status: 503,
        json: {
          error: {
            message:
              "The service is temporarily unavailable. Please try again.",
          },
        },
      });
    else if (path.includes("analytics")) data = stats;
    else if (path.endsWith("/settings"))
      data = {
        name: listing.organization_name,
        slug: "textiles",
        role: "owner",
        status: "active",
      };
    else if (path === "/platform/reviewers")
      data =
        state === "empty"
          ? []
          : [
              {
                user_id: "reviewer-ui",
                full_name: "Synthetic Reviewer",
                email: "reviewer@example.invalid",
                permissions: ["listings.review"],
              },
            ];
    else if (path.endsWith("/members"))
      data =
        state === "empty"
          ? []
          : [
              {
                membership_id: "staff-ui",
                full_name: "Synthetic Staff With A Long Name",
                email: "long.staff.address@example.invalid",
                role: "staff",
                permissions: ["listings.view"],
              },
            ];
    else if (path === "/seller/requests/mine") data = [];
    else if (path === "/platform/seller-requests")
      data =
        state === "empty"
          ? []
          : [
              {
                id: "request-ui",
                organization_name: listing.organization_name,
                applicant_name: "Synthetic Applicant",
                applicant_email: "test@example.invalid",
                cnic_last_four: "0000",
                contact_number: "03000000000",
                business_address: "Synthetic address for browser layout only",
                created_at: order.created_at,
              },
            ];
    else if (path.startsWith("/payment-attempts/"))
      data = {
        status: "succeeded",
        order_status: "expired",
        reconciliation_required: true,
      };
    else if (path === "/listings/listing-ui") data = listing;
    else if (path.endsWith("/purchase-groups")) data = collection();
    else if (path.includes("listings"))
      data = collection(
        state === "empty"
          ? []
          : [
              listing,
              {
                ...listing,
                id: "listing-ui-2",
                status: path.includes("organizations") ? "draft" : "published",
              },
            ],
      );
    else if (path.includes("orders"))
      data = collection(state === "empty" ? [] : [order]);
    else data = collection();
    return route.fulfill({
      json: { data },
      headers: {
        "access-control-allow-origin": base,
        "access-control-allow-credentials": "true",
      },
    });
  });
}
const routes = {
  public: [
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/resend-verification",
    "/verify-email",
    "/reset-password",
    "/reviewer/login",
    "/team/login",
    "/accept-invitation",
    "/marketplace",
    "/marketplace/listings/listing-ui",
  ],
  buyer: [
    "/buyer/overview",
    "/buyer/discover-materials",
    "/buyer/requirements",
    "/buyer/my-purchases",
    "/buyer/impact",
    "/seller/application",
    "/payment/return?attempt=ui",
  ],
  owner: [
    "/org/textiles/overview",
    "/org/textiles/listings",
    "/org/textiles/orders",
    "/org/textiles/team-access",
    "/org/textiles/analytics",
    "/org/textiles/settings",
  ],
  manager: [
    "/org/textiles/overview",
    "/org/textiles/listings",
    "/org/textiles/orders",
    "/org/textiles/team-access",
  ],
  staff: [
    "/org/textiles/overview",
    "/org/textiles/listings",
    "/org/textiles/team-access",
  ],
  admin: [
    "/admin/overview",
    "/admin/organizations",
    "/admin/users",
    "/admin/review-queue",
    "/admin/seller-applications",
    "/admin/reviewers",
    "/admin/platform-analytics",
  ],
  reviewer: [
    "/admin/overview",
    "/admin/review-queue",
    "/admin/seller-applications",
  ],
};
let browser;
// Sequential presentation matrix keeps screenshots and errors tied to their route.
// eslint-disable-next-line sonarjs/cognitive-complexity
(async () => {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.CHROMIUM_EXECUTABLE }
      : {}),
  });
  let results = [],
    failures = [];
  for (const [role, paths] of Object.entries(routes)) {
    const context = await browser.newContext();
    const page = await context.newPage();
    let errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await setup(page, role);
    for (const width of [360, 390, 768, 1024, 1280, 1440])
      for (const path of paths) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(base + path);
        await page.waitForTimeout(300);
        await page.evaluate(() => document.fonts.ready);
        const result = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          heading: document.querySelector("h1")?.textContent,
          offenders: [
            ...document.querySelectorAll(
              "main input, main select, main textarea, main .button",
            ),
          ]
            .filter((e) => {
              let r = e.getBoundingClientRect();
              return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1);
            })
            .map((e) => e.className + ":" + e.textContent.slice(0, 40)),
        }));
        const row = { role, width, path, ...result, errors: [...errors] };
        errors = [];
        results.push(row);
        if (result.overflow || result.offenders.length || row.errors.length)
          failures.push(row);
        if (
          (width === 390 || width === 1440) &&
          [
            "/login",
            "/org/textiles/listings",
            "/buyer/my-purchases",
            "/admin/reviewers",
            "/admin/review-queue",
            "/org/textiles/team-access",
          ].includes(path)
        )
          await page.screenshot({
            animations: "disabled",
            path: `${out}/${role}-${width}-${path.replaceAll("/", "_")}.png`,
            fullPage: true,
          });
      }
    await context.close();
    console.log("checked", role);
  }
  // Keyboard drawer behavior and expanded forms are checked independently of API writes.
  for (const role of [
    "buyer",
    "owner",
    "manager",
    "staff",
    "admin",
    "reviewer",
  ]) {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    await setup(page, role);
    const path = routes[role][0];
    await page.goto(base + path);
    await page.waitForTimeout(300);
    const trigger = page.getByRole("button", {
      name: "Open navigation",
      exact: true,
    });
    await trigger.click();
    await page.getByRole("dialog").waitFor();
    await page.keyboard.press("Escape");
    assert(
      await trigger.evaluate((e) => e === document.activeElement),
      "Drawer restores keyboard focus",
    );
    await page.close();
  }
  for (const state of ["empty", "error"]) {
    const page = await browser.newPage({
      viewport: { width: 360, height: 800 },
    });
    await setup(page, "buyer", state);
    await page.goto(base + "/buyer/discover-materials");
    await page.waitForTimeout(300);
    assert(
      await page
        .locator("body")
        .innerText()
        .then((t) =>
          t.includes(
            state === "empty"
              ? "No published materials"
              : "temporarily unavailable",
          ),
        ),
    );
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    await page.close();
  }
  const interactive = await browser.newPage({
    viewport: { width: 360, height: 800 },
    reducedMotion: "reduce",
  });
  await setup(interactive, "owner");
  await interactive.goto(base + "/org/textiles/listings");
  await interactive.getByRole("button", { name: "Add price tier" }).click();
  await interactive.getByText("Manage listing images", { exact: true }).click();
  assert(
    await interactive.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  await interactive.screenshot({
    path: out + "/expanded-mobile.png",
    fullPage: true,
  });
  await interactive.close();
  console.log(
    "keyboard drawers, empty/error states, expanded tier/image controls passed",
  );
  fs.writeFileSync(
    out + "/results.json",
    JSON.stringify({ count: results.length, failures, results }, null, 2),
  );
  console.log(
    JSON.stringify({ count: results.length, failures, output: out }, null, 2),
  );

  process.exitCode = failures.length ? 1 : 0;
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await browser?.close();
  });
