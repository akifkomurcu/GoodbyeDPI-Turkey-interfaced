import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const upstreamRoot = join(projectRoot, "upstream", "GoodbyeDPI-Turkey");
const resourceRoot = join(projectRoot, "resources", "goodbyedpi");
const binaryDir = join(resourceRoot, "bin");

mkdirSync(binaryDir, { recursive: true });

if (!existsSync(upstreamRoot)) {
  console.error("Upstream repo bulunamadi. Once repository'i clone edin.");
  process.exit(1);
}

const candidateDirectories = [
  join(upstreamRoot, "release"),
  join(upstreamRoot, "dist"),
  join(upstreamRoot, "build"),
  upstreamRoot
];

const candidateFiles = [
  "goodbyedpi.exe",
  "WinDivert.dll",
  "WinDivert64.sys",
  "WinDivert32.sys",
  "LICENSE",
  "README.md",
  "REVERT.md"
];

const copied = [];

for (const directory of candidateDirectories) {
  if (!existsSync(directory)) {
    continue;
  }

  for (const file of candidateFiles) {
    const source = join(directory, file);
    if (!existsSync(source) || statSync(source).isDirectory()) {
      continue;
    }

    const destination =
      file.endsWith(".exe") || file.endsWith(".dll") || file.endsWith(".sys")
        ? join(binaryDir, file)
        : join(resourceRoot, mapDocumentName(file));

    cpSync(source, destination, { recursive: false, force: true });
    copied.push(destination);
  }
}

const resourceManifest = {
  upstreamCommit: readHeadSha(upstreamRoot),
  copiedFiles: copied.map((file) => file.replace(`${projectRoot}/`, "")),
  requiredBinaryFilesPresent: requiredBinaryFilesPresent(binaryDir)
};

writeFileSync(
  join(resourceRoot, "manifest.json"),
  JSON.stringify(resourceManifest, null, 2),
  "utf8"
);

if (copied.length === 0) {
  console.warn(
    "Upstream kaynak kodu bulundu ancak release binary dosyalari bulunamadi. `resources/goodbyedpi/bin` klasorunu Windows release dosyalariyla doldurmaniz gerekiyor."
  );
} else {
  console.log("Kopyalanan dosyalar:");
  for (const item of copied) {
    console.log(`- ${item.replace(`${projectRoot}/`, "")}`);
  }
}

function requiredBinaryFilesPresent(directory) {
  const required = ["goodbyedpi.exe", "WinDivert.dll", "WinDivert64.sys"];
  const existing = new Set(existsSync(directory) ? readdirSync(directory) : []);
  return required.every((name) => existing.has(name));
}

function readHeadSha(repoPath) {
  try {
    return execFileSync("git", ["-C", repoPath, "rev-parse", "HEAD"], {
      encoding: "utf8"
    }).trim();
  } catch {
    return null;
  }
}

function mapDocumentName(file) {
  if (file === "README.md") {
    return "UPSTREAM-README.md";
  }

  if (file === "REVERT.md") {
    return "UPSTREAM-REVERT.md";
  }

  return file;
}
