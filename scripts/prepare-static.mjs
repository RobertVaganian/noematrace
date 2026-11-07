import { copyFile, mkdir } from "node:fs/promises";

await mkdir("dist/case-study", { recursive: true });
await copyFile("dist/index.html", "dist/case-study/index.html");
await copyFile("dist/index.html", "dist/404.html");
