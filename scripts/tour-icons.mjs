// Build the tour's UI symbols from the same installed Phosphor icon family.
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import {
  HandIcon, CursorIcon, FileIcon, DatabaseIcon, CheckIcon,
  WarningCircleIcon, ArrowsOutSimpleIcon, CalculatorIcon, MinusIcon, PlusIcon,
  ArrowsHorizontalIcon, ArrowsVerticalIcon, CircleIcon, LockSimpleIcon,
} from "@phosphor-icons/react";

const destination = process.argv[2];
const require = createRequire(import.meta.url);
let sharp;
try { sharp = require("sharp"); }
catch {
  if (!process.env.NOEMATRACE_MEDIA_NODE_MODULES) throw new Error("Media generation requires the sharp package.");
  sharp = require(`${process.env.NOEMATRACE_MEDIA_NODE_MODULES}/sharp`);
}
if (!destination) throw new Error("Provide an output directory for intermediate icon files.");
await mkdir(destination, { recursive: true });
const icons = { hand: HandIcon, cursor: CursorIcon, file: FileIcon, database: DatabaseIcon,
  check: CheckIcon, warning: WarningCircleIcon, fit: ArrowsOutSimpleIcon, compare: CalculatorIcon,
  minus: MinusIcon, plus: PlusIcon, "resize-x": ArrowsHorizontalIcon, "resize-y": ArrowsVerticalIcon,
  circle: CircleIcon, lock: LockSimpleIcon };
for (const [name, Icon] of Object.entries(icons)) {
  const markup = renderToStaticMarkup(React.createElement(Icon, {
    size: 48, color: "#ffffff", weight: name === "cursor" ? "fill" : "regular",
  }));
  await writeFile(`${destination}/${name}.svg`, markup);
  await sharp(Buffer.from(markup)).png().toFile(`${destination}/${name}.png`);
}
