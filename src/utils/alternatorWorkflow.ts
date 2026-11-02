import {
  AlternatorWorkflowStatus,
  WorkflowTaskItem,
  PLMStatus,
  AlternatorCatalogItem,
  Project,
  SOTRData,
} from '../types/index.ts';

export interface MatchingAlternatorOption {
  id: string;
  sourceType: 'catalog' | 'project';
  sourceTitle: string;
  projectCode?: string;
  customerName?: string;
  model: string;
  series: string;
  ratingKva: number;
  voltageV: number;
  frequencyHz: number;
  rpm: number;
  frameSize: string;
  ipProtection: string;
  cooling: string;
  avrModel?: string;
  partNumber?: string;
  sotr?: SOTRData;
  marineSocieties: string[];
}

/**
 * Dynamically generates the required PLM Action Tasks based on the selected status
 * (Action Checklist / Task list to execute)
 */
export function getTasksForAlternatorStatus(
  status: AlternatorWorkflowStatus,
  customText?: string
): WorkflowTaskItem[] {
  if (status === 'Mail notification pending') {
    return [
      {
        id: 'task-mail-1',
        title: 'Draft & Send Marine SOTR Mail Notification',
        description: 'Issue official email notice with alternator electrical ratings, classification societies (IRS/ABS), and duty cycle to PLM Team & Chief Electrical Lead.',
        isCompleted: false,
      },
      {
        id: 'task-mail-2',
        title: 'Attach Shipyard Technical Contract (TNC) & Single Line Diagram',
        description: 'Verify yard contract limits, temperature rise limits (Class F 90K), and attach preliminary drawings to mail notice.',
        isCompleted: false,
      },
      {
        id: 'task-mail-3',
        title: 'Obtain Engineering Stakeholder Sign-Off to Proceed',
        description: 'Receive confirmation from Chief Electrical Lead to register part number into PLM vault.',
        isCompleted: false,
      },
    ];
  }

  if (status === 'Pending in PLM') {
    return [
      {
        id: 'task-plm-1',
        title: 'Submit 3D CAD Model & General Arrangement (GA) to PLM Vault',
        description: 'Validate SAE close coupling dimensions (SAE housing/flywheel disc) and upload verified CAD assembly into PLM.',
        isCompleted: false,
      },
      {
        id: 'task-plm-2',
        title: 'Classification Society Type-Approval Verification',
        description: 'Submit technical documentation package to IRS/ABS/LRS surveyors for marine class certification.',
        isCompleted: false,
      },
      {
        id: 'task-plm-3',
        title: 'Perform Torsional Vibration Analysis (TVA) Compatibility Check',
        description: 'Cross-check alternator rotor inertia and shaft stiffness against engine coupling dynamics.',
        isCompleted: false,
      },
      {
        id: 'task-plm-4',
        title: 'Compile Bill of Materials (BOM) & Terminal Box Arrangement',
        description: 'Ensure PT100 RTD sensors (6 stator + 2 bearing) and 230V space heater are mapped in PLM BOM.',
        isCompleted: false,
      },
    ];
  }

  if (status === 'Released in PLM') {
    return [
      {
        id: 'task-rel-1',
        title: 'Verify Engineering Release Gate in PLM System',
        description: 'Confirm all drawings, BOM structures, and Class certificates are released to status "Released in PLM".',
        isCompleted: true,
      },
      {
        id: 'task-rel-2',
        title: 'Notify Shop Floor & Testing Division',
        description: 'Release manufacturing routing and alternator dispatch order to shop floor assembly bay.',
        isCompleted: false,
      },
      {
        id: 'task-rel-3',
        title: 'Schedule Witness FAT with Classification Surveyor',
        description: 'Schedule Factory Acceptance Test (FAT) with IRS/ABS marine surveyor for 110% overload and temperature rise tests.',
        isCompleted: false,
      },
    ];
  }

  // Other (Custom Status)
  const taskLabel = customText?.trim() || 'Custom Action Gate';
  return [
    {
      id: 'task-other-1',
      title: `Action: ${taskLabel}`,
      description: `Follow up and complete action items for custom requirement: "${taskLabel}".`,
      isCompleted: false,
    },
    {
      id: 'task-other-2',
      title: 'Update Project Lead upon Completion',
      description: 'Document completion evidence in the project dossier and update PLM workflow.',
      isCompleted: false,
    },
  ];
}

/**
 * Maps Alternator Workflow Status to standard PLM Status
 */
export function mapAlternatorStatusToPlm(status: AlternatorWorkflowStatus): PLMStatus {
  switch (status) {
    case 'Released in PLM':
      return 'Released in PLM';
    case 'Pending in PLM':
      return 'In Review';
    case 'Mail notification pending':
    case 'Other':
    default:
      return 'Pending';
  }
}

/**
 * Compiles matching suggestions from both the catalog database and previous projects
 */
export function findMatchingAlternators(
  targetKva: number,
  targetVoltage: number,
  catalog: AlternatorCatalogItem[],
  existingProjects: Project[]
): {
  exactMatches: MatchingAlternatorOption[];
  otherOptions: MatchingAlternatorOption[];
} {
  const allOptions: MatchingAlternatorOption[] = [];

  // 1. From previous projects
  existingProjects.forEach(proj => {
    const altSub = proj.subProjects.find(sp => sp.componentType === 'Alternator');
    if (altSub) {
      allOptions.push({
        id: `proj-alt-${proj.id}`,
        sourceType: 'project',
        sourceTitle: `Project ${proj.projectCode} (${proj.designInputs.customerName})`,
        projectCode: proj.projectCode,
        customerName: proj.designInputs.customerName,
        model: proj.designInputs.alternatorModel || 'KOEL Marine Alternator',
        series: `${proj.designInputs.engineSeries || 'Marine'} Coupled`,
        ratingKva: proj.designInputs.alternatorKva || proj.designInputs.dgRatingKva || 500,
        voltageV: proj.designInputs.mainAcVoltage || 415,
        frequencyHz: proj.designInputs.systemFrequencyHz || 50,
        rpm: 1500,
        frameSize: proj.designInputs.housingFlywheelCombo || 'SAE 0 / 18',
        ipProtection: 'IP23',
        cooling: 'IC01 Marine Screen Protected',
        avrModel: proj.designInputs.avrModel,
        partNumber: altSub.partOrGroupNumber,
        sotr: altSub.sotr,
        marineSocieties: [proj.designInputs.primaryClass || 'IRS', proj.designInputs.dualClass || 'ABS'].filter(Boolean),
      });
    }
  });

  // 2. From Catalog Database
  catalog.forEach(item => {
    // avoid duplicates if already present
    if (!allOptions.some(o => o.model === item.model)) {
      allOptions.push({
        id: `cat-alt-${item.id}`,
        sourceType: 'catalog',
        sourceTitle: `KOEL Marine Catalog DB`,
        model: item.model,
        series: item.series,
        ratingKva: item.ratingKva,
        voltageV: item.voltageV,
        frequencyHz: item.frequencyHz,
        rpm: item.rpm,
        frameSize: item.frameSize,
        ipProtection: item.ipProtection,
        cooling: item.cooling,
        avrModel: 'KOEL Digital D-510 with PMG',
        partNumber: `ALT-${item.frameSize.replace(/[^A-Za-z0-9]/g, '')}-MAR`,
        marineSocieties: item.marineApprovedSocieties,
      });
    }
  });

  // Separate exact/close matches based on target kVA & voltage
  const exactMatches = allOptions.filter(
    opt =>
      Math.abs(opt.ratingKva - targetKva) <= 100 &&
      (targetVoltage === 0 || opt.voltageV === targetVoltage || Math.abs(opt.voltageV - targetVoltage) <= 25)
  );

  const exactIds = new Set(exactMatches.map(m => m.id));
  const otherOptions = allOptions.filter(opt => !exactIds.has(opt.id));

  return { exactMatches, otherOptions };
}
