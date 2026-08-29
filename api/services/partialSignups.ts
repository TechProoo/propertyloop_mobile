import api from "../client";

export interface CapturePartialSignupInput {
  email: string;
  name?: string;
  phone?: string;
  role?: "BUYER" | "AGENT" | "VENDOR";
  step?: string;
}

/**
 * Record a signup-in-progress so an abandoned registration can be followed up
 * on. Fire-and-forget while the user is still on the form — never awaited and
 * never surfaces an error, because the user didn't ask for this and a failure
 * must not interrupt them.
 */
export function capturePartialSignup(input: CapturePartialSignupInput): void {
  void api
    .post("/partial-signups", { ...input, source: "mobile" })
    .catch(() => {});
}

export default { capture: capturePartialSignup };
