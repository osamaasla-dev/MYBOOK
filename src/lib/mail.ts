import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
let resend: Resend | null = null;
const getResend = () => {
  if (!resend) resend = new Resend(RESEND_API_KEY);
  return resend;
};

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
}) {
  // In E2E runs, avoid hitting real email provider. Control behavior via env.
  const e2e = process.env.E2E === "true";
  const e2eMode = process.env.E2E_MAIL_MODE; // "noop" | "fail" | undefined
  if (e2e) {
    if (e2eMode === "fail") {
      throw new Error("E2E forced mail failure");
    }
    // default noop: simulate success
    return undefined as unknown as { id: string };
  }
  const { data, error } = await getResend().emails.send({
    from: "onboarding@resend.dev",
    to: [opts.to],
    subject: opts.subject,
    html: opts.html,
  });
  if (error) {
    throw error;
  }
  return data;
}
