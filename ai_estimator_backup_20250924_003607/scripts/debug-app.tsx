import { JSDOM } from "jsdom";
import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import App from "../src/App";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const dom = new JSDOM(`<!doctype html><html><body><div id="root"></div></body></html>`, {
  url: "http://localhost/",
});

(globalThis as any).window = dom.window;
(globalThis as any).document = dom.window.document;
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  writable: false,
  configurable: true,
});

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

(globalThis as any).ResizeObserver = ResizeObserver;
(globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
(globalThis as any).cancelAnimationFrame = (id: number) => clearTimeout(id);
(globalThis as any).scrollTo = () => {};

if (!dom.window.matchMedia) {
  dom.window.matchMedia = () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
    media: "",
    onchange: null,
  });
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Failed to find root container");
}

const root = createRoot(container);

function logSidebar(label: string, sidebar: HTMLElement | null) {
  if (!sidebar) {
    console.log(`${label}: sidebar not found`);
    return;
  }
  console.log(`${label}: ${sidebar.className}`);
}

await act(async () => {
  root.render(<App />);
});

const allButtons = Array.from(document.querySelectorAll("button"));
const erpNavButton = allButtons.find((btn) => btn.textContent?.trim() === "ERP");

if (!erpNavButton) {
  console.log("ERP navigation button not found");
  await act(async () => {
    root.unmount();
  });
  process.exit(0);
}

await act(async () => {
  erpNavButton.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
});

await act(async () => Promise.resolve());

const sidebarCandidates = Array.from(document.querySelectorAll("div")) as HTMLElement[];
const erpSidebar = sidebarCandidates.find((div) =>
  div.classList.contains("bg-green-50") &&
  div.classList.contains("shadow-lg") &&
  div.classList.contains("overflow-hidden")
);

logSidebar("after navigation", erpSidebar ?? null);

const nav = erpSidebar?.querySelector("nav");
const menuButtons = nav ? Array.from(nav.querySelectorAll("button")) : [];

if (menuButtons.length === 0) {
  console.log("No ERP menu buttons found");
} else {
  menuButtons.forEach((button, index) => {
    act(() => {
      button.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    });
    logSidebar(`after clicking ERP menu index ${index}`, erpSidebar ?? null);
  });
}

await act(async () => {
  root.unmount();
});
