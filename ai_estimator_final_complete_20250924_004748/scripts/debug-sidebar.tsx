import { JSDOM } from "jsdom";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { ERPSystem } from "../src/components/erp-system";

// Allow React to use act during this script
// @ts-expect-error - setting global flag for React
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const dom = new JSDOM(`<!doctype html><html><body><div id="root"></div></body></html>`, {
  url: "http://localhost/",
});

// Expose DOM globals expected by React
(globalThis as any).window = dom.window;
(globalThis as any).document = dom.window.document;
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  writable: false,
  configurable: true,
});

const container = document.getElementById("root");
if (!container) {
  throw new Error("Failed to locate root container");
}

const root = createRoot(container);

function logSidebarWidth(label: string) {
  const wrapper = container.firstElementChild as HTMLElement | null;
  const sidebar = wrapper?.firstElementChild as HTMLElement | null;
  if (!sidebar) {
    console.log(`${label}: sidebar node missing`);
    return;
  }
  console.log(`${label}: ${sidebar.className}`);
}

act(() => {
  root.render(<ERPSystem />);
});

logSidebarWidth("after initial render");

const wrapper = container.firstElementChild as HTMLElement | null;
const sidebar = wrapper?.firstElementChild as HTMLElement | null;
const toggleButton = sidebar?.querySelector("div button");

if (toggleButton) {
  act(() => {
    toggleButton.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  });
  logSidebarWidth("after toggling open");

  act(() => {
    toggleButton.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  });
  logSidebarWidth("after toggling closed");
}

const nav = sidebar?.querySelector("nav");
const menuButtons = nav ? Array.from(nav.querySelectorAll("button")) : [];

if (menuButtons.length === 0) {
  console.log("No menu buttons found to test");
} else {
  menuButtons.forEach((button, index) => {
    act(() => {
      button.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    });
    logSidebarWidth(`after clicking menu index ${index}`);
  });
}

act(() => {
  root.unmount();
});
