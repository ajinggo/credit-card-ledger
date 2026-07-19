# Password Recovery Design

**Date:** 2026-07-19
**Status:** Approved for planning

## Goal

Add a complete Supabase email password-recovery flow to the existing cloud-ledger sign-in panel. A signed-out user must be able to request a reset email, return through the Supabase recovery link, set a new password, and continue into the ledger without changing ledger data, database policies, or synchronization behavior.

## Scope

### Included

- Add a visible `忘记密码？` command to the sign-in state.
- Add an email-only reset-request state.
- Send reset email through `client.auth.resetPasswordForEmail()`.
- Detect Supabase's `PASSWORD_RECOVERY` auth event.
- Add a new-password state with password confirmation.
- Save the new password through `client.auth.updateUser({ password })`.
- Resume the existing signed-in ledger preparation after a successful update.
- Add loading, success, validation, and error states.
- Preserve the existing mobile and desktop authentication-panel design.
- Update static asset versions so deployed browsers load the new flow.
- Add focused automated regression tests and responsive browser verification.

### Not Included

- No database schema or RLS changes.
- No custom email provider or email-template redesign.
- No administrator-driven password reset.
- No password-strength meter, passkeys, MFA, or current-password change screen.
- No changes to ledger records, backup format, financial calculations, or cloud synchronization ownership.
- No GitHub push until the user explicitly requests it.

## Chosen Approach

Reuse the existing authentication panel as a four-state interface:

1. `signin`: email and password; login, create-account, and forgot-password commands.
2. `signup`: email and password; registration and return-to-login commands.
3. `request-reset`: email only; send-reset-email and return-to-login commands.
4. `update-password`: new password and confirmation; save-new-password command.

This approach avoids a second modal and avoids adding a separately routed page to a static site. The authentication overlay remains the only authentication surface and continues to cover the ledger while authentication is incomplete.

## Interface Design

### Sign In

- Keep the existing title, email field, password field, primary login button, and create-account command.
- Add `忘记密码？` as a restrained secondary command near the password field or secondary actions.

### Request Reset

- Title: `找回密码`.
- Show the email field only.
- Primary action: `发送重置邮件`.
- Secondary action: `返回登录`.
- On success, show: `如果该邮箱已注册，重置邮件将发送到你的邮箱。`
- Keep the same response whether or not the email exists to avoid account enumeration.

### Update Password

- Title: `设置新密码`.
- Hide the email field.
- Show `新密码` and `确认新密码` fields.
- Both fields use `autocomplete="new-password"`.
- Require at least eight characters and an exact match.
- Primary action: `保存新密码`.
- Do not expose signup or reset-request navigation while the recovery session is active.

### Completion

- Call `updateUser({ password })` using the authenticated recovery session.
- Show a success toast: `密码已更新`.
- Continue through the existing `prepareLedger()` path so account ownership and first-sync behavior remain unchanged.

### Responsive Behavior

- Keep the existing authentication panel width and single-column mobile layout.
- New controls must use the existing Apple system font and button styles.
- Visible mobile controls must remain at least 44px high.
- Text and fields must not overflow at 360px, 390px, 430px, or 1440px viewports.

## Supabase Flow

### Reset Request

The client calls:

```js
client.auth.resetPasswordForEmail(email, {
  redirectTo: `${location.origin}${location.pathname}`,
});
```

The redirect deliberately excludes the current query string and hash. Supabase appends the recovery parameters needed to establish the recovery session.

### Recovery Return

- Keep `detectSessionInUrl: true` in the Supabase client.
- Register the auth-state listener early enough to observe `PASSWORD_RECOVERY` before normal signed-in preparation can permanently hide the authentication panel.
- When `PASSWORD_RECOVERY` fires with a session, store that session, keep the page auth-locked, show the authentication overlay, and enter `update-password` mode.
- Do not read or write ledger data until the new password is accepted.

### Password Update

The client calls:

```js
client.auth.updateUser({ password });
```

After success, clear recovery mode and run the existing signed-in ledger preparation using the current session.

### Redirect Configuration

Supabase Authentication URL Configuration must allow at least:

```text
https://credit-card-ledger.vercel.app/**
http://127.0.0.1:8769/**
```

The deployed origin should remain the production Site URL. A localhost/127.0.0.1 redirect is for local verification only.

## State And Event Rules

- `signin` and `signup` continue to use the existing submit handler behavior.
- The forgot-password command enters `request-reset` without submitting the sign-in form.
- `request-reset` validates only the email address.
- `update-password` validates the two password fields and requires an active recovery session.
- Buttons are disabled while an auth request is running and re-enabled in a `finally` path.
- `SIGNED_OUT` returns to `signin` unless a request-reset success message is being shown.
- `SIGNED_IN` prepares the ledger only when recovery mode is not active.
- `PASSWORD_RECOVERY` always takes precedence over ordinary signed-in preparation.
- `TOKEN_REFRESHED` updates the stored session without changing the visible auth mode.

## Error Handling

- Missing or invalid email: `请输入有效邮箱。`
- Password shorter than eight characters: `新密码至少需要 8 位。`
- Password mismatch: `两次输入的密码不一致。`
- Missing recovery session: `重置链接已失效，请重新发送重置邮件。`
- Supabase request or update errors remain visible in the auth message region with error styling.
- Reset-request success uses the same privacy-preserving message for every email.
- Network or SDK-loading failures continue to use the existing authentication error path.

## Security Constraints

- Use only the browser-safe Supabase publishable key already present in the project.
- Do not add or expose a service-role key.
- Do not infer authorization from user metadata.
- Do not reveal whether an email address exists.
- Do not store either new-password field in local storage, cloud snapshots, logs, URLs, or analytics.
- Clear password fields when leaving their state and after a successful update.
- Do not bypass the Supabase recovery session requirement.

## Code Boundaries

- `index.html`: add recovery controls and the confirmation-password field; bump cache versions.
- `organic-liquid.css`: style the new secondary actions and hidden field states in the existing auth panel.
- `cloud-sync.js`: implement the four-state auth controller and Supabase recovery calls/events.
- `tests/password-recovery.test.mjs`: add focused source and behavior contracts.
- Existing financial, ledger, model, and database files remain unchanged.

An additional auth model file should be introduced only if tests demonstrate that state or validation logic cannot remain clear and independently testable inside the existing auth controller.

## Testing Strategy

### Automated

- Test required recovery controls and accessible field attributes.
- Test the four auth modes and their visible-field contracts.
- Test reset-email call shape and current-origin redirect construction.
- Test `PASSWORD_RECOVERY` precedence over ordinary `SIGNED_IN` preparation.
- Test new-password length and confirmation validation.
- Test `updateUser({ password })` and successful continuation into `prepareLedger()`.
- Test privacy-preserving reset success messaging.
- Test buttons are restored after Supabase errors.
- Test fresh CSS/JavaScript cache versions.
- Run all existing ledger, mobile, drawer, performance, and cloud-source tests.

### Browser Verification

- Verify sign-in, request-reset, and update-password layouts at 360x800, 390x844, 430x932, and 1440x900.
- Confirm no horizontal overflow or overlapping controls.
- Confirm mobile touch targets are at least 44px.
- Confirm the reset email reaches the configured mailbox only with explicit user participation.
- Confirm a real recovery link returns to the configured origin and opens `设置新密码`.
- Confirm a successful password update enters the existing ledger and preserves cloud data.

## Acceptance Criteria

- A signed-out user can request a password-reset email from the existing login panel.
- The response does not reveal whether the email is registered.
- A valid Supabase recovery link opens the new-password state on the same site.
- Invalid, expired, short, or mismatched recovery attempts show actionable errors.
- A valid new password is saved and the user enters the existing ledger flow.
- Existing login, signup, logout, first-sync, cloud ownership, and ledger synchronization behavior continue to pass regression tests.
- Mobile and desktop authentication layouts remain visually consistent and free of overflow.
- No production or GitHub deployment occurs without an explicit later request.
