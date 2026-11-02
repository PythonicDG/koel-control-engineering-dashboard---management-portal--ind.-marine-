import test from 'node:test';
import assert from 'node:assert/strict';
import { getStructured53DesignInputs } from './projectExport.ts';
import { INITIAL_PROJECTS } from '../data/initialData.ts';

test('getStructured53DesignInputs maps all 53 design inputs correctly across 6 chapters', () => {
  const sampleProject = INITIAL_PROJECTS[0];
  const items = getStructured53DesignInputs(sampleProject.designInputs);

  // Check total parameter count (54 detailed inputs covering the standard 53 parameters)
  assert.equal(items.length, 54);

  // Check chapters 1 to 6 are all present
  const chapters = new Set(items.map(i => i.chapterNumber));
  assert.equal(chapters.size, 6);
  assert.ok(chapters.has(1));
  assert.ok(chapters.has(2));
  assert.ok(chapters.has(3));
  assert.ok(chapters.has(4));
  assert.ok(chapters.has(5));
  assert.ok(chapters.has(6));

  // Check specific parameter mapping
  const projNameItem = items.find(i => i.parameterName === 'Project Name');
  assert.ok(projNameItem);
  assert.equal(projNameItem?.value, sampleProject.designInputs.projectName);

  const primaryClassItem = items.find(i => i.parameterName === 'Primary Classification Society');
  assert.ok(primaryClassItem);
  assert.equal(primaryClassItem?.value, sampleProject.designInputs.primaryClass);

  const dgRatingItem = items.find(i => i.parameterName === 'DG Apparent Power Rating');
  assert.ok(dgRatingItem);
  assert.equal(dgRatingItem?.value, sampleProject.designInputs.dgRatingKva);
});
