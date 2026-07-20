import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const indexHtml = await readFile(new URL("index.html", root), "utf8");
const organicCss = await readFile(new URL("organic-liquid.css", root), "utf8");
const cloudSync = await readFile(new URL("cloud-sync.js", root), "utf8");

const recoveryMarker = "Password Recovery V83";
const performanceMarker = "Performance Pass V82";
const recoveryMarkerIndex = organicCss.lastIndexOf(recoveryMarker);
const recoveryLayer = recoveryMarkerIndex >= 0 ? organicCss.slice(recoveryMarkerIndex) : "";

test("email field exposes its stable id and message relationship", () => {
  assert.match(
    indexHtml,
    /<label id="authEmailField">[\s\S]*?<input id="authEmail" type="email" autocomplete="email" aria-describedby="authMessage" required\s*\/>/,
  );
});

test("password field exposes its stable ids and current-password input", () => {
  assert.match(
    indexHtml,
    /<label id="authPasswordField">[\s\S]*?<span id="authPasswordLabel">密码<\/span>[\s\S]*?<input id="authPassword" type="password" autocomplete="current-password" minlength="8" aria-describedby="authMessage" required\s*\/>/,
  );
});

test("confirmation field starts hidden and disabled for recovery state control", () => {
  assert.match(
    indexHtml,
    /<label id="authConfirmPasswordField" hidden>[\s\S]*?<span>确认新密码<\/span>[\s\S]*?<input id="authConfirmPassword" type="password" autocomplete="new-password" minlength="8" aria-describedby="authMessage" disabled\s*\/>/,
  );
});

test("forgot-password command cannot submit the authentication form", () => {
  assert.match(
    indexHtml,
    /<button id="authForgotPasswordButton" class="auth-text-button" type="button">忘记密码？<\/button>/,
  );
});

test("secondary actions retain the existing authentication mode command", () => {
  assert.match(
    indexHtml,
    /<div class="auth-secondary-actions">[\s\S]*?<button id="authForgotPasswordButton"[\s\S]*?<button id="authModeButton" class="btn-ghost auth-mode-button" type="button">没有账号，创建一个<\/button>[\s\S]*?<\/div>/,
  );
});

test("password recovery layer follows the performance layer", () => {
  assert.ok(
    recoveryMarkerIndex > organicCss.lastIndexOf(performanceMarker),
    "Password Recovery V83 must appear after Performance Pass V82",
  );
});

test("password recovery layer explicitly removes hidden auth fields", () => {
  assert.match(
    recoveryLayer,
    /\.auth-form\s+\[hidden\]\s*\{[\s\S]*?display:\s*none\s*!important;?[\s\S]*?\}/,
  );
});

test("secondary authentication commands use the approved grid layout", () => {
  assert.match(
    recoveryLayer,
    /\.auth-secondary-actions\s*\{[\s\S]*?display:\s*grid;?[\s\S]*?justify-items:\s*center;?[\s\S]*?gap:\s*0\.2rem;?[\s\S]*?\}/,
  );
});

test("recovery controls preserve touch sizing and disabled feedback", () => {
  assert.match(
    recoveryLayer,
    /\.auth-text-button\s*\{[\s\S]*?min-height:\s*44px;?[\s\S]*?font:\s*inherit;?[\s\S]*?\}/,
  );
  assert.match(
    recoveryLayer,
    /\.auth-form\s+:is\(button,\s*input\):disabled\s*\{[\s\S]*?cursor:\s*not-allowed;?[\s\S]*?opacity:\s*0\.58;?[\s\S]*?\}/,
  );
});

test("mobile authentication panel is height-bounded and scrollable", () => {
  assert.match(
    recoveryLayer,
    /@media\s*\(max-width:\s*520px\)\s*\{[\s\S]*?\.auth-panel\s*\{[\s\S]*?max-height:\s*calc\(100dvh\s*-\s*2rem\);?[\s\S]*?overflow-y:\s*auto;?[\s\S]*?\}/,
  );
});

test("cloud source is available for later recovery wiring", () => {
  assert.match(cloudSync, /function setupCloudLedger/);
});
