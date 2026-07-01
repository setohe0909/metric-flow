import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const managerSource = readFileSync(new URL('./manager.tsx', import.meta.url), 'utf8');

test('SharePoint connector setup uses a guided Microsoft Graph flow', () => {
  assert.match(
    managerSource,
    /Microsoft Graph setup/i,
    'SharePoint form should read as a Microsoft Graph setup flow',
  );
  assert.match(
    managerSource,
    /Lists, libraries, files/i,
    'SharePoint selector should describe dashboard-relevant content types',
  );
  assert.match(
    managerSource,
    /sharePointFieldErrors/,
    'SharePoint fields should use in-app validation instead of native browser tooltips',
  );
  assert.match(
    managerSource,
    /Guardar SharePoint/,
    'SharePoint submit action should use connector-specific copy',
  );
});
