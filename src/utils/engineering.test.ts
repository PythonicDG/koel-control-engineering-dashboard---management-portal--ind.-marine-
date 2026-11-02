import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAlternatorSizing, recommendCableAndGland } from './engineering.ts';
import { canCloseProject, processEcnProjectLifecycle, calculateProjectProgress } from './rules.ts';
import { SubProject, Project, EcnEcr } from '../types/index.ts';

test('Alternator sizing calculates Ns, Pn, Qn, and In accurately for standard 4-pole 415V 50Hz alternator', () => {
  const result = calculateAlternatorSizing({
    snKva: 500,
    vllVolts: 415,
    powerFactor: 0.8,
    poles: 4,
    frequencyHz: 50,
  });

  // Ns = (120 * 50) / 4 = 1500 RPM
  assert.equal(result.nsRpm, 1500);

  // Pn = 500 * 0.8 = 400 kW
  assert.equal(result.pnKw, 400);

  // Qn = 500 * sin(acos(0.8)) = 500 * 0.6 = 300 kVAR
  assert.equal(result.qnKvar, 300);

  // In = (500 * 1000) / (sqrt(3) * 415) = 500000 / 718.799 = 695.60 A
  assert.ok(Math.abs(result.inAmperes - 695.6) < 0.2);
});

test('Cable and gland matrix recommends proper cable cross-section and gland size', () => {
  const recommendation = recommendCableAndGland(100, 0.85);
  assert.ok(recommendation.maxCurrentRatingA >= (100 / 0.85));
  assert.ok(['M32', 'M40', 'M50'].includes(recommendation.recommendedGlandSize));
});

test('Rule 2: Project closure requires all sub-projects to be Released in PLM', () => {
  const partialSubProjects: SubProject[] = [
    {
      id: 'sp-1',
      componentType: 'Alternator',
      isExistingPart: true,
      partOrGroupNumber: 'ALT-4BM-350',
      plmStatus: 'Released in PLM',
      taskTitle: 'Release Structure in PLM',
      taskStatus: 'Completed',
      lastUpdated: '2026-10-01',
      assignedEngineer: 'engineer',
    },
    {
      id: 'sp-2',
      componentType: 'Local Control Panel (LCP)',
      isExistingPart: false,
      partOrGroupNumber: 'DV2.M821.02.0.PR',
      plmStatus: 'In Review',
      taskTitle: 'Release Structure in PLM',
      taskStatus: 'Open',
      lastUpdated: '2026-10-02',
      assignedEngineer: 'engineer',
    },
  ];

  const check1 = canCloseProject(partialSubProjects);
  assert.equal(check1.canClose, false);
  assert.equal(check1.unreleasedCount, 1);
  assert.deepEqual(check1.unreleasedNames, ['Local Control Panel (LCP)']);

  // Update second subproject to Released in PLM
  const completedSubProjects: SubProject[] = partialSubProjects.map(sp => ({
    ...sp,
    plmStatus: 'Released in PLM',
  }));

  const check2 = canCloseProject(completedSubProjects);
  assert.equal(check2.canClose, true);
  assert.equal(check2.unreleasedCount, 0);
});

test('Rule 1: Creating ECN against a CLOSED project automatically re-opens the project to OPEN', () => {
  const mockProjects: Project[] = [
    {
      id: 'proj-1',
      projectCode: 'KOEL-MAR-2026-001',
      status: 'CLOSED',
      createdAt: '2026-01-01',
      updatedAt: '2026-02-01',
      progressPercent: 100,
      designInputs: {} as any,
      subProjects: [],
      ecnIds: [],
    },
  ];

  const mockEcn: EcnEcr = {
    id: 'ecn-999',
    changeType: 'ECN',
    manualChangeNumber: 'ECN/MAR/2026/042',
    projectId: 'proj-1',
    projectCode: 'KOEL-MAR-2026-001',
    projectName: 'Naval Tugboat Auxiliary Genset',
    partDescription: 'Governor actuator linkage pin clearance specification change',
    reasonForChange: 'IRS surveyor audit finding during sea trial',
    engineerName: 'R. Kulkarni',
    dateLogged: '2026-10-22',
    status: 'Open',
    impactAnalysis: 'Low mechanical impact, rewires auxiliary feedback',
    affectedComponents: ['Local Control Panel (LCP)'],
  };

  const result = processEcnProjectLifecycle(mockEcn, mockProjects);
  assert.equal(result.didReopen, true);
  assert.equal(result.affectedProjectCode, 'KOEL-MAR-2026-001');
  assert.equal(result.updatedProjects[0].status, 'OPEN');
  assert.ok(result.updatedProjects[0].ecnIds.includes('ecn-999'));
});
