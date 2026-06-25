import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { runPreRelease } from './pre-release.mjs';

test('runs backend, frontend, and TestSprite checks in parallel', async () => {
  const outputDir = await mkdtemp(join(tmpdir(), 'pre-release-pass-'));
  const started = [];
  let releaseTasks;
  const allStarted = new Promise((resolve) => {
    releaseTasks = resolve;
  });

  const resultPromise = runPreRelease({
    outputDir,
    runTask: async (task) => {
      started.push(task.name);
      if (started.length === 3) {
        releaseTasks();
      }
      await allStarted;
      return { ...task, exitCode: 0 };
    },
  });

  await allStarted;
  assert.deepEqual(started.sort(), ['Backend', 'Frontend', 'TestSprite']);

  const result = await resultPromise;
  assert.equal(result.decision, 'GO');
  assert.match(
    await readFile(join(outputDir, 'release-decision.md'), 'utf8'),
    /Decision: GO/,
  );
});

test('returns NO-GO when any parallel check fails', async () => {
  const outputDir = await mkdtemp(join(tmpdir(), 'pre-release-fail-'));

  const result = await runPreRelease({
    outputDir,
    runTask: async (task) => ({
      ...task,
      exitCode: task.name === 'TestSprite' ? 1 : 0,
    }),
  });

  assert.equal(result.decision, 'NO-GO');
  assert.match(
    await readFile(join(outputDir, 'release-decision.md'), 'utf8'),
    /\| TestSprite \| failed \|/,
  );
});
