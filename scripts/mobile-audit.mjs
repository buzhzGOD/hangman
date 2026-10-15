import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");
const fail = (message) => { console.error(`FAIL: ${message}`); process.exitCode = 1; };
const pass = (message) => console.log(`PASS: ${message}`);
const requireMatch = (label, pattern) => (typeof pattern === "boolean" ? pattern : pattern.test(html)) ? pass(label) : fail(label);

requireMatch("Viewport allows device-width and initial scale", /<meta\s+name=["']viewport["'][^>]*width=device-width[^>]*initial-scale=1/i);
requireMatch("Viewport does not disable user zoom", (() => { const viewport = html.match(/<meta\\s+name=["']viewport["'][^>]*content=["']([^"']*)/i)?.[1] ?? ""; return !/(?:user-scalable\\s*=\\s*no|maximum-scale\\s*=\\s*[0-4](?:\\.\\d+)?)/i.test(viewport); })());
requireMatch("Safe-area viewport support", /viewport-fit=cover/i);
requireMatch("Horizontal overflow is guarded", /html,body\s*\{[^}]*overflow-x:\s*(?:clip|hidden)/s);
requireMatch("Responsive small-phone breakpoint exists", /@media\s*\(max-width:\s*360px\)/);
requireMatch("Phone and tablet breakpoint exists", /@media\s*\(min-width:\s*600px\)/);
requireMatch("Desktop breakpoint exists", /@media\s*\(min-width:\s*900px\)/);
requireMatch("Landscape short-screen layout exists", /@media\s*\(orientation:\s*landscape\)\s*and\s*\(max-height:\s*500px\)/);
requireMatch("Reduced-motion preference is respected", /prefers-reduced-motion:\s*reduce/);
requireMatch("Visible keyboard focus styles exist", /button:focus-visible,select:focus-visible,input:focus-visible\s*\{[^}]*outline/s);
requireMatch("On-screen keyboard touch action is optimized", /#kb button\s*\{[^}]*touch-action:\s*manipulation/s);
requireMatch("Small-phone keyboard keys have 44px minimum height", /@media\s*\(max-width:\s*380px\)[\s\S]*?#kb button\s*\{[^}]*min-height:\s*44px/s);
requireMatch("Settings button has 44px phone target", /@media\s*\(max-width:\s*600px\)[\s\S]*?#setbtn\s*\{[^}]*min-height:\s*44px/s);
requireMatch("Theme control has 44px phone target", /@media\s*\(max-width:\s*600px\)[\s\S]*?#themebtn\s*\{[^}]*min-height:\s*44px/s);
requireMatch("Select controls have 44px phone target", /@media\s*\(max-width:\s*600px\)[\s\S]*?\.ctl \.sel select\s*\{[^}]*min-height:\s*44px/s);
requireMatch("Typing action controls have 44px phone target", /@media\s*\(max-width:\s*600px\)[\s\S]*?\.typebox button\s*\{[^}]*min-height:\s*44px/s);
requireMatch("Restart action has 48px phone target", /@media\s*\(max-width:\s*600px\)[\s\S]*?#again\s*\{[^}]*min-height:\s*48px/s);
requireMatch("Text entry retains mobile-friendly 16px font", /\.typebox input\s*\{[^}]*font-size:\s*16px/s);
requireMatch("Theme and keyboard controls have accessible names", /id=["']themebtn["'][^>]*aria-label=/i && /id=["']setbtn["'][^>]*aria-label=/i);

if (process.exitCode) process.exit(1);
console.log("Static mobile audit checks passed. These checks inspect source; they do not replace browser/device testing.");
