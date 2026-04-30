/**
 * @file Runs Retire.js and pip-audit scans, then generates the plain-text
 * security report used by the npm `scan` script and the GitHub Actions workflow.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const reportDate = process.env.REPORT_DATE || new Date().toISOString().slice(0, 10);
const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
const webRootRelative = process.env.WEB_ROOT || "src/static";
const webRoot = path.resolve(workspace, webRootRelative);
const webRootLabel = path.relative(workspace, webRoot).replace(/\\/g, "/") || ".";
const reportBasename = process.env.REPORT_BASENAME || "security-report.txt";
const reportFile = process.env.REPORT_FILE || path.join(workspace, reportBasename);
const retireJsonFile =
  process.env.RETIRE_OUTPUT_FILE || path.join(workspace, "retire-src-static.json");
const pipAuditJsonFile =
  process.env.PIP_AUDIT_OUTPUT_FILE || path.join(workspace, "pip-audit-python.json");
const pythonRequirementsRelative = (
  process.env.PYTHON_REQUIREMENTS ||
  "install/requirements.txt,install/dev-requirements.txt,docs/requirements.txt"
)
  .split(",")
  .map((requirementFile) => requirementFile.trim())
  .filter(Boolean);

/**
 * @typedef {Object} RequirementFile
 * @property {string} absolutePath Absolute path to the requirements file.
 * @property {string} relativePath Workspace-relative path used in command output.
 */

/**
 * @typedef {Object} PipAuditOutput
 * @property {string} source Requirement file audited by pip-audit.
 * @property {number | null} status pip-audit process exit status.
 * @property {string} output Raw JSON output emitted by pip-audit.
 */

/**
 * @typedef {Object} ParsedPipAudit
 * @property {string} source Requirement file audited by pip-audit.
 * @property {number | null} status pip-audit process exit status.
 * @property {Object} json Parsed pip-audit JSON payload.
 */

/**
 * @typedef {Object} ReportRow
 * @property {string} pkg Package, script, or library name.
 * @property {string} file Source file or requirements file where it was found.
 * @property {string} version Detected dependency version.
 * @property {string} vulnKnown Whether a known vulnerability was detected.
 * @property {string} risk Human-readable risk level.
 * @property {string} cveList CVE or advisory identifiers.
 * @property {string} action Recommended remediation action.
 */

/**
 * Ensures the configured web root exists before launching dependency scans.
 *
 * @throws {Error} When the configured web root is missing or is not a directory.
 * @returns {void}
 */
function ensureWebRootExists() {
  if (!fs.existsSync(webRoot) || !fs.statSync(webRoot).isDirectory()) {
    throw new Error(`Web root not found: ${webRootLabel}`);
  }
}

/**
 * Converts a path to a workspace-relative POSIX-like path when possible.
 *
 * @param {string | null | undefined} file File path to normalize.
 * @returns {string} Workspace-relative path, original normalized path, or "unknown".
 */
function toWorkspaceRelative(file) {
  if (!file || file === "unknown") {
    return "unknown";
  }

  const normalized = file.replace(/\\/g, "/");
  const absolute = path.isAbsolute(file) ? file : path.resolve(workspace, file);
  const relative = path.relative(workspace, absolute);

  if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
    return relative.replace(/\\/g, "/");
  }

  return normalized;
}

/**
 * Reads a single quoted HTML attribute from an already matched tag string.
 *
 * @param {string} tag Full HTML tag text.
 * @param {string} attributeName Attribute name to read.
 * @returns {string} Attribute value, or an empty string when absent.
 */
function getHtmlAttribute(tag, attributeName) {
  const regexp = new RegExp(`${attributeName}\\s*=\\s*['"]([^'"]+)['"]`, "i");
  const match = regexp.exec(tag);
  return match ? match[1] : "";
}

/**
 * Resolves a local npm binary when installed, falling back to the command name.
 *
 * @param {string} command Binary command name.
 * @returns {string} Local executable path or command name.
 */
function getLocalBin(command) {
  const executable = process.platform === "win32" ? `${command}.cmd` : command;
  const localBin = path.join(workspace, "node_modules", ".bin", executable);
  return fs.existsSync(localBin) ? localBin : executable;
}

/**
 * Resolves existing Python requirements files from the configured candidates.
 *
 * @returns {RequirementFile[]} Existing requirements files with absolute and relative paths.
 */
function getPythonRequirementFiles() {
  return pythonRequirementsRelative
    .map((requirementFile) => {
      const absolutePath = path.resolve(workspace, requirementFile);
      return {
        absolutePath,
        relativePath: toWorkspaceRelative(absolutePath),
      };
    })
    .filter(({ absolutePath }) => fs.existsSync(absolutePath));
}

/**
 * Runs Retire.js against the configured web root and stores its JSON output.
 *
 * @throws {Error} When Retire.js cannot be executed.
 * @returns {void}
 */
function runRetireScan() {
  const retire = getLocalBin("retire");
  const result = spawnSync(retire, ["--path", webRootLabel, "--outputformat", "json"], {
    cwd: workspace,
    encoding: "utf8",
  });

  if (result.error) {
    throw new Error(`Unable to execute Retire.js: ${result.error.message}`);
  }

  fs.writeFileSync(retireJsonFile, result.stdout || "", "utf8");

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
}

/**
 * Runs pip-audit once per requirements file and stores all raw JSON outputs.
 *
 * @param {RequirementFile[]} requirementFiles Requirements files to scan.
 * @throws {Error} When pip-audit cannot be executed or exits without JSON output.
 * @returns {void}
 */
function runPipAuditScans(requirementFiles) {
  const pipAudit = process.platform === "win32" ? "pip-audit.exe" : "pip-audit";
  /** @type {PipAuditOutput[]} */
  const outputs = requirementFiles.map(({ relativePath }) => {
    const result = spawnSync(pipAudit, ["-r", relativePath, "--format", "json"], {
      cwd: workspace,
      encoding: "utf8",
    });

    if (result.error) {
      throw new Error(`Unable to execute pip-audit: ${result.error.message}`);
    }

    if (result.stderr) {
      process.stderr.write(result.stderr);
    }

    if (result.status !== 0 && !(result.stdout || "").trim()) {
      throw new Error(
        `pip-audit failed for ${relativePath}: ${result.stderr || "no output"}`
      );
    }

    return {
      source: relativePath,
      status: result.status,
      output: result.stdout || "",
    };
  });

  fs.writeFileSync(pipAuditJsonFile, JSON.stringify(outputs, null, 2), "utf8");
}

/**
 * Loads the Retire.js JSON output and falls back to an empty report on parse errors.
 *
 * @returns {{data?: Object[], results?: Object[]}} Parsed Retire.js payload.
 */
function loadRetireJson() {
  try {
    return JSON.parse(fs.readFileSync(retireJsonFile, "utf8") || "{}");
  } catch (error) {
    console.warn(`Impossible de parser ${path.basename(retireJsonFile)}:`, error.message);
    return { data: [] };
  }
}

/**
 * Loads the stored pip-audit outputs and parses each embedded JSON payload.
 *
 * @returns {ParsedPipAudit[]} Parsed pip-audit results grouped by requirements file.
 */
function loadPipAuditJson() {
  try {
    return JSON.parse(fs.readFileSync(pipAuditJsonFile, "utf8") || "[]").map(
      ({ source, status, output }) => {
        let json = {};
        try {
          json = JSON.parse(output || "{}");
        } catch (error) {
          console.warn(
            `Impossible de parser le résultat pip-audit ${source}:`,
            error.message
          );
        }
        return { source, status, json };
      }
    );
  } catch (error) {
    console.warn(
      `Impossible de parser ${path.basename(pipAuditJsonFile)}:`,
      error.message
    );
    return [];
  }
}

/**
 * Converts Retire.js findings into normalized report rows.
 *
 * @param {{data?: Object[], results?: Object[]}} json Parsed Retire.js payload.
 * @returns {ReportRow[]} Deduplicated JavaScript vulnerability report rows.
 */
function collectRetireRows(json) {
  const issues = Array.isArray(json.data)
    ? json.data
    : Array.isArray(json.results)
      ? json.results
      : [];
  const rows = [];
  const seen = new Set();

  issues.forEach((item) => {
    const file = toWorkspaceRelative(item.file || item.fileName || "unknown");
    const results =
      Array.isArray(item.results) && item.results.length > 0 ? item.results : [item];

    results.forEach((result) => {
      const pkg =
        result.package || result.component || result.componentName || path.basename(file);
      const version = result.version || result.componentVersion || "inconnue";
      const vulns = Array.isArray(result.vulnerabilities)
        ? result.vulnerabilities
        : Array.isArray(result.vulns)
          ? result.vulns
          : [];
      const vulnKnown = vulns.length > 0 ? "Oui" : "Non";
      const severity = vulns.map((vuln) => (vuln.severity || "").toLowerCase());
      const risk =
        vulnKnown === "Oui"
          ? severity.includes("high")
            ? "Critique"
            : severity.includes("medium")
              ? "Élevé"
              : "Moyen"
          : "Faible";
      const action =
        vulnKnown === "Oui"
          ? "Mettre à jour ou remplacer la dépendance vulnérable"
          : "Aucune action urgente";
      const cves = Array.from(
        new Set(
          vulns.flatMap((vuln) => {
            const identifiers = vuln.identifiers || {};
            return Array.isArray(identifiers.CVE) ? identifiers.CVE : [];
          })
        )
      );
      const cveList = cves.length > 0 ? cves.join(", ") : "Aucune";
      const key = `${pkg}|${file}|${version}|${risk}|${cveList}`;

      if (!seen.has(key)) {
        seen.add(key);
        rows.push({ pkg, file, version, vulnKnown, risk, cveList, action });
      }
    });
  });

  return rows;
}

/**
 * Converts pip-audit findings into normalized report rows.
 *
 * @param {ParsedPipAudit[]} audits Parsed pip-audit results.
 * @returns {ReportRow[]} Deduplicated Python vulnerability report rows.
 */
function collectPipAuditRows(audits) {
  const rows = [];
  const seen = new Set();

  audits.forEach(({ source, json }) => {
    const dependencies = Array.isArray(json.dependencies) ? json.dependencies : [];
    dependencies.forEach((dependency) => {
      const vulns = Array.isArray(dependency.vulns) ? dependency.vulns : [];
      vulns.forEach((vuln) => {
        const aliases = Array.isArray(vuln.aliases) ? vuln.aliases : [];
        const cves = aliases.filter((alias) => /^CVE-/i.test(alias));
        const advisoryIds = [
          ...cves,
          ...aliases.filter((alias) => !/^CVE-/i.test(alias)),
        ];

        if (vuln.id && !advisoryIds.includes(vuln.id)) {
          advisoryIds.push(vuln.id);
        }

        const cveList = advisoryIds.length > 0 ? advisoryIds.join(", ") : "Aucune";
        const fixVersions = Array.isArray(vuln.fix_versions) ? vuln.fix_versions : [];
        const action =
          fixVersions.length > 0
            ? `Mettre à jour vers ${fixVersions.join(", ")}`
            : "Mettre à jour ou remplacer la dépendance vulnérable";
        const key = `${dependency.name}|${dependency.version}|${source}|${cveList}`;

        if (!seen.has(key)) {
          seen.add(key);
          rows.push({
            pkg: dependency.name || "unknown",
            file: source,
            version: dependency.version || "inconnue",
            vulnKnown: "Oui",
            risk: "À qualifier",
            cveList,
            action,
          });
        }
      });
    });
  });

  return rows;
}

/**
 * Walks HTML files under the web root and lists script and stylesheet references.
 *
 * @param {string} [dir=webRoot] Directory to inspect recursively.
 * @returns {string[]} Markdown list items describing detected HTML resources.
 */
function collectHtmlResourceLines(dir = webRoot) {
  const resourceLines = [];

  /**
   * Recursively scans HTML files while skipping dependency and VCS directories.
   *
   * @param {string} currentDir Directory currently being inspected.
   * @returns {void}
   */
  const walk = (currentDir) => {
    fs.readdirSync(currentDir, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === ".git" || entry.name === "node_modules") {
          return;
        }
        walk(full);
        return;
      }

      if (!entry.isFile() || !full.endsWith(".html")) {
        return;
      }

      const content = fs.readFileSync(full, "utf8");
      const relativePath = path.relative(workspace, full).replace(/\\/g, "/");
      const regexp = /<script\b[^>]*>/gi;
      let match;
      while ((match = regexp.exec(content))) {
        const src = getHtmlAttribute(match[0], "src");
        if (src) {
          resourceLines.push(`- \`${relativePath}\`: script \`${src}\``);
        }
      }

      const stylesheetRegexp = /<link\b[^>]*>/gi;
      while ((match = stylesheetRegexp.exec(content))) {
        const rel = getHtmlAttribute(match[0], "rel").toLowerCase();
        const href = getHtmlAttribute(match[0], "href");
        if (href && rel.split(/\s+/).includes("stylesheet")) {
          resourceLines.push(`- \`${relativePath}\`: stylesheet \`${href}\``);
        }
      }
    });
  };

  walk(dir);
  return resourceLines;
}

/**
 * Appends vulnerability rows to an existing report string.
 *
 * @param {string} report Report content accumulated so far.
 * @param {ReportRow[]} rows Rows to append.
 * @param {string} emptySource Source label used when no rows are present.
 * @returns {string} Report content with dependency rows appended.
 */
function writeRows(report, rows, emptySource) {
  if (rows.length === 0) {
    return (
      report +
      `- Aucun résultat enregistré | ${emptySource} | - | Non | Faible | Aucune | Aucune action urgente\n`
    );
  }

  rows.forEach((row) => {
    report += `- ${row.pkg} | ${row.file} | ${row.version} | ${row.vulnKnown} | ${row.risk} | ${row.cveList} | ${row.action}\n`;
  });

  return report;
}

/**
 * Builds the final text report and writes it to the configured report file.
 *
 * @param {ReportRow[]} jsRows JavaScript dependency rows.
 * @param {ReportRow[]} pythonRows Python dependency rows.
 * @param {string[]} htmlResourceLines Detected HTML script and stylesheet references.
 * @param {RequirementFile[]} requirementFiles Requirements files included in the audit.
 * @returns {void}
 */
function writeReport(jsRows, pythonRows, htmlResourceLines, requirementFiles) {
  const jsVulnCount = jsRows.filter((row) => row.vulnKnown === "Oui").length;
  const pythonVulnCount = pythonRows.filter((row) => row.vulnKnown === "Oui").length;
  const requirementLabels = requirementFiles.map(
    ({ relativePath }) => `\`${relativePath}\``
  );
  let report = "";
  report += "Mviewer Studio - Rapport d'audit sécurité JavaScript et Python\n";
  report += "==============================================================\n\n";
  report += `Date: ${reportDate}\n`;
  report += `Périmètre web: \`${webRootLabel}/\`\n`;
  report += `Périmètre Python: ${requirementLabels.length > 0 ? requirementLabels.join(", ") : "aucun fichier requirements trouvé"}\n\n`;
  report += "Résumé exécutif\n";
  report += "----------------\n";
  report += `- Scan Retire.js exécuté sur \`${webRootLabel}/\`\n`;
  report += "- Scan pip-audit exécuté sur les requirements Python\n";
  report += `- Dépendances JavaScript vulnérables détectées: ${jsVulnCount}\n`;
  report += `- Dépendances Python vulnérables détectées: ${pythonVulnCount}\n`;
  report += "- Rapport généré au format texte\n\n";
  report += "Dépendances JavaScript\n";
  report += "----------------------\n\n";
  report +=
    "Script / Librairie | Source | Version | Vuln connue | Risque | CVE / Advisory | Action recommandée\n";
  report +=
    "-------------------|--------|---------|--------------|--------|----------------|--------------------\n";
  report = writeRows(report, jsRows, `${webRootLabel}/`);

  report += "\nDépendances Python\n";
  report += "------------------\n\n";
  report +=
    "Package | Source | Version | Vuln connue | Risque | CVE / Advisory | Action recommandée\n";
  report +=
    "--------|--------|---------|--------------|--------|----------------|--------------------\n";
  report = writeRows(
    report,
    pythonRows,
    requirementLabels.length > 0 ? requirementLabels.join(", ") : "requirements Python"
  );

  report += "\nRessources HTML détectées\n";
  report += "-------------------------\n";
  report +=
    htmlResourceLines.length === 0
      ? "- Aucune ressource HTML détectée\n"
      : `${htmlResourceLines.join("\n")}\n`;
  report += "\nRecommandations\n";
  report += "---------------\n";
  report += "- Corriger les vulnérabilités identifiées par Retire.js.\n";
  report += "- Corriger les vulnérabilités identifiées par pip-audit.\n";
  report +=
    "- Mettre à jour les bibliothèques vulnérables ou anciennes dans `src/static/`.\n";
  report +=
    "- Contraindre les versions Python sensibles dans les fichiers requirements.\n";
  report +=
    "- Ajouter SRI pour les scripts et styles distants référencés par les HTML.\n";

  fs.writeFileSync(reportFile, report, "utf8");
}

/**
 * Executes the full security audit workflow and exposes the report path to GitHub Actions.
 *
 * @returns {void}
 */
function main() {
  ensureWebRootExists();
  const requirementFiles = getPythonRequirementFiles();
  runRetireScan();
  runPipAuditScans(requirementFiles);
  const jsRows = collectRetireRows(loadRetireJson());
  const pythonRows = collectPipAuditRows(loadPipAuditJson());
  const htmlResourceLines = collectHtmlResourceLines();
  writeReport(jsRows, pythonRows, htmlResourceLines, requirementFiles);

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `report-file=${reportFile}\n`, "utf8");
  }

  console.log(`Generated report at ${reportFile}`);
}

main();
