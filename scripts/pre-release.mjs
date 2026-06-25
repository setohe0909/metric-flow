import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const releaseTasks = [
  {
    name: 'Backend',
    command: 'npm',
    args: ['run', 'build-and-test'],
    cwd: resolve('backend'),
  },
  {
    name: 'Frontend',
    command: 'npm',
    args: ['run', 'build'],
    cwd: resolve('frontend'),
  },
  {
    name: 'TestSprite',
    command: 'npm',
    args: ['run', 'release:test:testsprite'],
    cwd: resolve('.'),
  },
];

function executeTask(task) {
  return new Promise((resolveTask) => {
    console.log(`\n[pre-release] Starting ${task.name}...`);
    const child = spawn(task.command, task.args, {
      cwd: task.cwd,
      env: process.env,
      stdio: 'inherit',
    });

    child.on('error', (error) => {
      console.error(`[pre-release] ${task.name}: ${error.message}`);
      resolveTask({ ...task, exitCode: 1 });
    });
    child.on('close', (exitCode) => {
      resolveTask({ ...task, exitCode: exitCode ?? 1 });
    });
  });
}

export async function runPreRelease({
  outputDir = resolve('reports/pre-release'),
  runTask = executeTask,
} = {}) {
  const results = await Promise.all(releaseTasks.map((task) => runTask(task)));
  const decision = results.every(({ exitCode }) => exitCode === 0)
    ? 'GO'
    : 'NO-GO';

  await mkdir(outputDir, { recursive: true });
  await writeFile(
    resolve(outputDir, 'release-decision.md'),
    [
      '# Pre-release Decision',
      '',
      `- Decision: ${decision}`,
      `- Generated at: ${new Date().toISOString()}`,
      '',
      '| Check | Result |',
      '| --- | --- |',
      ...results.map(
        ({ name, exitCode }) =>
          `| ${name} | ${exitCode === 0 ? 'passed' : 'failed'} |`,
      ),
      '',
    ].join('\n'),
  );

  return { decision, results, outputDir };
}

async function main() {
  const result = await runPreRelease();
  console.log(`\nPre-release decision: ${result.decision}`);
  process.exitCode = result.decision === 'GO' ? 0 : 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main();
}
