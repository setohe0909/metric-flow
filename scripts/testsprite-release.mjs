import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TESTSPRITE_VERSION = '0.1.2';

function execute(command, args, options) {
  return new Promise((resolveCommand, reject) => {
    const child = spawn(command, args, options);
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      process.stdout.write(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
      process.stderr.write(chunk);
    });
    child.on('error', reject);
    child.on('close', (exitCode) => {
      resolveCommand({ exitCode: exitCode ?? 1, stdout, stderr });
    });
  });
}

export async function runReleaseCheck({
  env = process.env,
  outputDir = resolve('reports/testsprite'),
  runCommand = execute,
} = {}) {
  const requiredVariables = ['TESTSPRITE_API_KEY', 'TESTSPRITE_PROJECT_ID'];
  const missingVariables = requiredVariables.filter((name) => !env[name]?.trim());

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVariables.join(', ')}`,
    );
  }

  await mkdir(outputDir, { recursive: true });

  const args = [
    '--yes',
    '--registry=https://registry.npmjs.org',
    `@testsprite/testsprite-cli@${TESTSPRITE_VERSION}`,
    'test',
    'rerun',
    '--all',
    '--project',
    env.TESTSPRITE_PROJECT_ID,
    '--no-auto-heal',
    '--wait',
    '--output',
    'json',
  ];
  const result = await runCommand('npx', args, {
    env,
    stdio: ['inherit', 'pipe', 'pipe'],
  });
  const decision = result.exitCode === 0 ? 'GO' : 'NO-GO';
  const generatedAt = new Date().toISOString();

  await Promise.all([
    writeFile(
      resolve(outputDir, 'testsprite-result.json'),
      result.stdout || '{}\n',
    ),
    writeFile(
      resolve(outputDir, 'testsprite-cli.log'),
      `${result.stdout}${result.stderr}`,
    ),
    writeFile(
      resolve(outputDir, 'release-decision.md'),
      [
        '# TestSprite Release Decision',
        '',
        `- Decision: ${decision}`,
        `- Project: ${env.TESTSPRITE_PROJECT_ID}`,
        `- Generated at: ${generatedAt}`,
        `- CLI exit code: ${result.exitCode}`,
        '',
        decision === 'GO'
          ? 'The TestSprite project suite passed.'
          : 'The release is blocked. Review the TestSprite JSON result and CLI log.',
        '',
      ].join('\n'),
    ),
  ]);

  return { ...result, decision, outputDir };
}

async function main() {
  try {
    const result = await runReleaseCheck();
    console.log(`\nTestSprite release decision: ${result.decision}`);
    process.exitCode = result.exitCode;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 2;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main();
}
