import type {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface Record {
  project: string;
  file: string;
  describes: string[];
  title: string;
  status: TestResult['status'];
  duration: number;
  line: number;
  tc?: string;
  error?: string;
}

export default class MarkdownReporter implements Reporter {
  private results: Record[] = [];
  private startTime = Date.now();
  private outputFile: string;
  private rootDir = process.cwd();
  private fileCache = new Map<string, string[]>();

  constructor(options: { outputFile?: string } = {}) {
    this.outputFile = options.outputFile ?? 'playwright-report/report.md';
  }

  onBegin(config: FullConfig): void {
    this.rootDir = config.configFile
      ? path.dirname(config.configFile)
      : config.rootDir ?? process.cwd();
    this.startTime = Date.now();
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const titlePath = test.titlePath();
    const project = titlePath[1] || 'unknown';
    const describes = titlePath.slice(3, -1);
    const file = path.relative(this.rootDir, test.location.file);
    const line = test.location.line;
    const tc = this.getTcNumber(test.location.file, line);
    const error = result.errors[0]
      ? this.stripAnsi(result.errors[0].message ?? '').trim()
      : undefined;

    this.results.push({
      project,
      file,
      describes,
      title: test.title,
      status: result.status,
      duration: result.duration,
      line,
      tc,
      error,
    });
  }

  async onEnd(result: FullResult): Promise<void> {
    const duration = Date.now() - this.startTime;
    const md = this.buildReport(result, duration);
    const outPath = path.isAbsolute(this.outputFile)
      ? this.outputFile
      : path.join(this.rootDir, this.outputFile);
    await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
    await fs.promises.writeFile(outPath, md, 'utf-8');
    process.stdout.write(`\nMarkdown report: ${outPath}\n`);
  }

  printsToStdio(): boolean {
    return false;
  }

  private buildReport(result: FullResult, duration: number): string {
    const total = this.results.length;
    const passed = this.results.filter((r) => r.status === 'passed').length;
    const failed = this.results.filter((r) => r.status === 'failed').length;
    const skipped = this.results.filter((r) => r.status === 'skipped').length;
    const timedOut = this.results.filter((r) => r.status === 'timedOut').length;
    const interrupted = this.results.filter((r) => r.status === 'interrupted').length;

    const now = new Date().toISOString().replace('T', ' ').split('.')[0] + ' UTC';
    const overall = result.status === 'passed' ? 'PASS' : result.status.toUpperCase();
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

    const lines: string[] = [];
    lines.push(`# Test Run Report`);
    lines.push(``);
    lines.push(`| | |`);
    lines.push(`|---|---|`);
    lines.push(`| **Status** | ${overall} |`);
    lines.push(`| **Generated** | ${now} |`);
    lines.push(`| **Duration** | ${this.formatDuration(duration)} |`);
    lines.push(`| **Total** | ${total} |`);
    lines.push(`| **Passed** | ${passed} (${passRate}%) |`);
    lines.push(`| **Failed** | ${failed} |`);
    if (skipped) lines.push(`| **Skipped** | ${skipped} |`);
    if (timedOut) lines.push(`| **Timed out** | ${timedOut} |`);
    if (interrupted) lines.push(`| **Interrupted** | ${interrupted} |`);
    lines.push(``);

    if (total > 0) {
      lines.push('```mermaid');
      lines.push('pie showData title Test Results');
      if (passed) lines.push(`    "Passed" : ${passed}`);
      if (failed) lines.push(`    "Failed" : ${failed}`);
      if (skipped) lines.push(`    "Skipped" : ${skipped}`);
      if (timedOut) lines.push(`    "Timed out" : ${timedOut}`);
      if (interrupted) lines.push(`    "Interrupted" : ${interrupted}`);
      lines.push('```');
      lines.push(``);
    }

    const failures = this.results.filter(
      (r) => r.status === 'failed' || r.status === 'timedOut' || r.status === 'interrupted',
    );

    if (failures.length > 0) {
      lines.push(`## Failures (${failures.length})`);
      lines.push(``);
      for (const f of failures) {
        const tcPrefix = f.tc ? `${f.tc} — ` : '';
        const describePath = f.describes.length ? ` › ${f.describes.join(' › ')}` : '';
        lines.push(`### ${tcPrefix}${f.title}`);
        lines.push(``);
        lines.push(`- **Status:** ${this.statusLabel(f.status)}`);
        lines.push(`- **Location:** \`${f.file}:${f.line}\` (${f.project}${describePath})`);
        lines.push(`- **Duration:** ${this.formatDuration(f.duration)}`);
        if (f.error) {
          lines.push(``);
          lines.push('```');
          lines.push(f.error);
          lines.push('```');
        }
        lines.push(``);
      }
    }

    lines.push(`## Results`);
    lines.push(``);
    const byProject = this.groupBy(this.results, (r) => r.project);
    for (const [project, projectResults] of byProject) {
      const p = projectResults.filter((r) => r.status === 'passed').length;
      const f = projectResults.filter((r) => r.status === 'failed').length;
      const s = projectResults.filter((r) => r.status === 'skipped').length;
      const summary = [
        `${projectResults.length} tests`,
        `${p} passed`,
        f ? `${f} failed` : null,
        s ? `${s} skipped` : null,
      ]
        .filter(Boolean)
        .join(' · ');
      lines.push(`### \`${project}\` — ${summary}`);
      lines.push(``);

      const byFile = this.groupBy(projectResults, (r) => r.file);
      for (const [file, fileResults] of byFile) {
        lines.push(`<details${this.hasFailureIn(fileResults) ? ' open' : ''}>`);
        lines.push(`<summary><code>${file}</code> (${fileResults.length})</summary>`);
        lines.push(``);

        const byDescribe = this.groupBy(fileResults, (r) => r.describes.join(' › ') || '(top-level)');
        for (const [describe, dResults] of byDescribe) {
          lines.push(`**${describe}**`);
          lines.push(``);
          for (const r of dResults) {
            const label = this.statusLabel(r.status);
            const tc = r.tc ? `**${r.tc}** ` : '';
            const dur = this.formatDuration(r.duration);
            lines.push(`- \`${label}\` ${tc}${r.title} _(${dur})_`);
          }
          lines.push(``);
        }
        lines.push(`</details>`);
        lines.push(``);
      }
    }

    return lines.join('\n');
  }

  private statusLabel(status: TestResult['status']): string {
    switch (status) {
      case 'passed':
        return 'PASS';
      case 'failed':
        return 'FAIL';
      case 'skipped':
        return 'SKIP';
      case 'timedOut':
        return 'TIME';
      case 'interrupted':
        return 'INTR';
      default:
        return String(status).toUpperCase();
    }
  }

  private hasFailureIn(records: Record[]): boolean {
    return records.some(
      (r) => r.status === 'failed' || r.status === 'timedOut' || r.status === 'interrupted',
    );
  }

  private getTcNumber(file: string, line: number): string | undefined {
    if (!this.fileCache.has(file)) {
      try {
        this.fileCache.set(file, fs.readFileSync(file, 'utf-8').split('\n'));
      } catch {
        return undefined;
      }
    }
    const lines = this.fileCache.get(file)!;
    for (let i = line - 2; i >= 0 && i >= line - 5; i--) {
      const trimmed = lines[i]?.trim() ?? '';
      const m = trimmed.match(/\/\/\s*(TC-\d+)/);
      if (m) return m[1];
      if (trimmed && !trimmed.startsWith('//')) break;
    }
    return undefined;
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    const s = ms / 1000;
    if (s < 60) return `${s.toFixed(1)}s`;
    const m = Math.floor(s / 60);
    const rs = Math.round(s - m * 60);
    return `${m}m ${rs}s`;
  }

  private stripAnsi(s: string): string {
    return s.replace(/\[[0-9;]*m/g, '');
  }

  private groupBy<T, K>(items: T[], keyFn: (item: T) => K): Map<K, T[]> {
    const map = new Map<K, T[]>();
    for (const item of items) {
      const key = keyFn(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }
}
