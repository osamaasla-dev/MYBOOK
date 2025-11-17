const authMessages = {
  signup: {
    success: "Account created successfully!",
    emailInUse:
      "This email is already in use. Please sign in or use another email.",
    fieldsRequired: "All fields are required.",
    invalidEmail: "Invalid email",
    invalidPassword:
      "Password must be at least 8 characters and include uppercase, lowercase, and a symbol",
    invalidName: "Name is too short",
    invalidPhone: "Invalid phone number",
    passwordsMismatch: "Passwords do not match",
    serverError: "Internal server error.",
  },
  password: {
    forgotSent:
      "If an account exists for this email, a reset link has been sent.",
    resetEmailSubject: "Reset your password",
    resetEmailFailed:
      "Failed to send password reset email. Please try again later.",
    invalidToken: "Invalid or expired reset link.",
    resetSuccess: "Your password has been reset successfully.",
  },
  lockout: {
    locked: (minutes: number) =>
      `Your account is temporarily locked. Please try again in ${minutes} minutes.`,
  },
  signin: {
    success: "Signed in successfully!",
    invalidCredentials: "Invalid email or password.",
    emailNotVerified:
      "Your email is not verified. Please check your inbox and verify your account.",
    fieldsRequired: "All fields are required.",
    serverError: "Internal server error.",
  },
  verify: {
    title: {
      verifying: "Verifying your email...",
      pending: "Verification email sent",
      success: "Email verified",
      error: "Verification failed",
    },
    info: {
      wait: "Please wait while we verify your email.",
      checkInbox: "Please check your inbox for the verification link.",
      redirecting: "Redirecting you to sign in...",
    },
    result: {
      missingToken: "Missing verification token.",
      success: "Your email has been verified successfully.",
      failed: "Invalid or expired verification token.",
    },
  },
};
export default authMessages;
