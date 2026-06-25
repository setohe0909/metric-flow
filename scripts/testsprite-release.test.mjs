import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { runReleaseCheck } from './testsprite-release.mjs';

const validEnv = {
  TESTSPRITE_API_KEY: 'test-key',
  TESTSPRITE_PROJECT_ID: 'proj_test',
};

test('writes approval artifacts when the TestSprite suite passes', async () => {
  const outputDir = await mkdtemp(join(tmpdir(), 'testsprite-pass-'));
  const calls = [];

  const result = await runReleaseCheck({
    env: validEnv,
    outputDir,
    runCommand: async (command, args) => {
      calls.push({ command, args });
      return { exitCode: 0, stdout: '{"status":"passed"}\n', stderr: '' };
    },
  });

  assert.equal(result.decision, 'GO');
  assert.deepEqual(calls, [
    {
      command: 'npx',
      args: [
        '--yes',
        '--registry=https://registry.npmjs.org',
        '@testsprite/testsprite-cli@0.1.2',
        'test',
        'rerun',
        '--all',
        '--project',
        'proj_test',
        '--no-auto-heal',
        '--wait',
        '--output',
        'json',
      ],
    },
  ]);
  assert.match(
    await readFile(join(outputDir, 'release-decision.md'), 'utf8'),
    /Decision: GO/,
  );
  assert.equal(
    await readFile(join(outputDir, 'testsprite-result.json'), 'utf8'),
    '{"status":"passed"}\n',
  );
});

test('writes a blocking decision and preserves diagnostics when tests fail', async () => {
  const outputDir = await mkdtemp(join(tmpdir(), 'testsprite-fail-'));

  const result = await runReleaseCheck({
    env: validEnv,
    outputDir,
    runCommand: async () => ({
      exitCode: 1,
      stdout: '{"status":"failed"}\n',
      stderr: 'One or more tests failed\n',
    }),
  });

  assert.equal(result.decision, 'NO-GO');
  assert.match(
    await readFile(join(outputDir, 'release-decision.md'), 'utf8'),
    /Decision: NO-GO/,
  );
  assert.match(
    await readFile(join(outputDir, 'testsprite-cli.log'), 'utf8'),
    /One or more tests failed/,
  );
});

test('rejects execution when required secrets are missing', async () => {
  const outputDir = await mkdtemp(join(tmpdir(), 'testsprite-config-'));

  await assert.rejects(
    runReleaseCheck({
      env: {},
      outputDir,
      runCommand: async () => {
        throw new Error('must not execute');
      },
    }),
    /TESTSPRITE_API_KEY, TESTSPRITE_PROJECT_ID/,
  );
});
