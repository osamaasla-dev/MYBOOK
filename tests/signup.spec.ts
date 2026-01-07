import { test, expect, type Page } from "@playwright/test";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import { prisma } from "./utils/prisma";
type SignupData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  birthDate: string;
  gender: "MALE" | "FEMALE";
};

const createdUserIds = new Set<string>();

test.afterEach(async () => {
  if (!createdUserIds.size) return;
  await prisma.user.deleteMany({
    where: { id: { in: Array.from(createdUserIds) } },
  });
  createdUserIds.clear();
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

function buildSignupData(overrides: Partial<SignupData> = {}): SignupData {
  const phone = `+201${faker.string.numeric(9)}`;
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email().toLowerCase(),
    phone,
    password: "StrongPass1!",
    birthDate: "2000-01-01",
    gender: "MALE",
    ...overrides,
  };
}

async function fillSignUpForm(page: Page, data: SignupData) {
  await page.fill("[data-testid=first-name-input]", data.firstName);
  await page.fill("[data-testid=last-name-input]", data.lastName);
  await page.fill("[data-testid=email-input]", data.email);
  await page.fill("[data-testid=phone-input]", data.phone);
  await page.getByTestId("gender-select").click();
  const genderLabel = data.gender === "MALE" ? "Male" : "Female";
  await page
    .getByRole("option", { name: genderLabel, exact: true })
    .filter({ hasNot: page.locator('[aria-selected="true"]') })
    .click();
  await page.fill("[data-testid=birth-date-input]", data.birthDate);
  await page.fill("[data-testid=password-input]", data.password);
  await page.fill("[data-testid=confirm-password-input]", data.password);
}

async function waitForVerificationToken(email: string, attempts = 20) {
  for (let i = 0; i < attempts; i++) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user?.verificationToken) {
      return user;
    }
    await new Promise((res) => setTimeout(res, 500));
  }
  throw new Error(`User with email ${email} was not created in time`);
}

test.describe("Signup flow E2E", () => {
  test("creates account, verifies email, and signs in", async ({ page }) => {
    test.setTimeout(60_000);

    const data = buildSignupData();

    await page.goto("/signup");
    await fillSignUpForm(page, data);
    await page.click("[data-testid=signup-button]");

    await page.waitForURL(/\/verify-email\?pending=1/);
    await expect(
      page.locator("[data-testid=verify-status-pending]")
    ).toBeVisible();

    const user = await waitForVerificationToken(data.email);
    createdUserIds.add(user.id);
    const token = user.verificationToken!;

    await page.goto(`/verify-email?token=${token}`);
    await expect(
      page.locator("[data-testid=verify-status-success]")
    ).toBeVisible();

    await page.goto("/signin");
    await page.fill("[data-testid=email-input]", data.email);
    await page.fill("[data-testid=password-input]", data.password);
    await page.click("[data-testid=signin-button]");

    await expect(page).toHaveURL(/\/user/, { timeout: 50000 });

    await page.context().storageState({ path: "auth.json" });
  });

  test("shows inline validation errors for weak inputs", async ({ page }) => {
    await page.goto("/signup");

    await page.click("[data-testid=signup-button]");
    await expect(page.locator('[role="alert"]').first()).toBeVisible();

    const data = buildSignupData({
      password: "password1!",
    });
    await fillSignUpForm(page, data);
    await page.fill("[data-testid=password-input]", data.password);
    await page.fill("[data-testid=confirm-password-input]", data.password);
    await page.click("[data-testid=signup-button]");

    await expect(
      page.locator("text=Password needs an uppercase letter")
    ).toBeVisible();
  });

  test("shows server error when email already exists", async ({ page }) => {
    const existing = buildSignupData();
    const hashed = await bcrypt.hash(existing.password, 10);

    const user = await prisma.user.create({
      data: {
        username: `user_${Date.now()}`,
        name: `${existing.firstName} ${existing.lastName}`,
        firstName: existing.firstName,
        lastName: existing.lastName,
        email: existing.email,
        phone: existing.phone,
        password: hashed,
        gender: existing.gender,
        birthDate: new Date(existing.birthDate),
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });
    createdUserIds.add(user.id);

    await page.goto("/signup");
    await fillSignUpForm(page, {
      ...buildSignupData(),
      email: existing.email,
    });
    await page.click("[data-testid=signup-button]");

    const errorAlert = page.getByRole("alert");
    await expect(errorAlert).toBeVisible();
    await expect(page).toHaveURL(/\/signup/);
  });
});
