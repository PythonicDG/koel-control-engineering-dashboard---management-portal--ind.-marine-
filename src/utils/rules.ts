import { SubProject, Project, ProjectStatus, EcnEcr } from '../types/index.ts';

/**
 * Rule 2: A main project can ONLY be marked "CLOSED" when ALL sub-projects reach "Released in PLM" status.
 */
export function canCloseProject(subProjects: SubProject[]): { canClose: boolean; unreleasedCount: number; unreleasedNames: string[] } {
  if (!subProjects || subProjects.length === 0) {
    return { canClose: false, unreleasedCount: 0, unreleasedNames: ['No sub-projects configured'] };
  }

  const unreleased = subProjects.filter(sp => sp.plmStatus !== 'Released in PLM');
  return {
    canClose: unreleased.length === 0,
    unreleasedCount: unreleased.length,
    unreleasedNames: unreleased.map(u => u.componentType),
  };
}

/**
 * Rule 1: Saving an ECN/ECR against a CLOSED project automatically re-opens the project status to "OPEN".
 */
export function processEcnProjectLifecycle(
  ecn: EcnEcr,
  projects: Project[]
): { updatedProjects: Project[]; didReopen: boolean; affectedProjectCode?: string } {
  let didReopen = false;
  let affectedProjectCode: string | undefined;

  const updatedProjects = projects.map(proj => {
    if (proj.id === ecn.projectId || proj.projectCode === ecn.projectCode) {
      affectedProjectCode = proj.projectCode;
      const wasClosed = proj.status === 'CLOSED';
      const updatedEcnIds = proj.ecnIds.includes(ecn.id) ? proj.ecnIds : [...proj.ecnIds, ecn.id];

      if (wasClosed) {
        didReopen = true;
        return {
          ...proj,
          status: 'OPEN' as ProjectStatus,
          updatedAt: new Date().toISOString(),
          ecnIds: updatedEcnIds,
        };
      } else {
        return {
          ...proj,
          updatedAt: new Date().toISOString(),
          ecnIds: updatedEcnIds,
        };
      }
    }
    return proj;
  });

  return { updatedProjects, didReopen, affectedProjectCode };
}

/**
 * Calculates project overall progress percentage based on design inputs completion and subprojects PLM statuses
 */
export function calculateProjectProgress(subProjects: SubProject[]): number {
  if (!subProjects || subProjects.length === 0) return 0;
  
  let score = 0;
  for (const sp of subProjects) {
    if (sp.plmStatus === 'Released in PLM') {
      score += 100;
    } else if (sp.plmStatus === 'In Review') {
      score += 50;
    } else {
      score += 15;
    }
  }

  return Math.round(score / subProjects.length);
}
