export type UserRole = 'admin' | 'engineer';

export interface User {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: UserRole;
  email: string;
  department: string;
  lastLogin?: string;
  active: boolean;
}

export type ProjectStatus = 'OPEN' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'CLOSED';

export type SubProjectComponentType =
  | 'Alternator'
  | 'Local Control Panel (LCP)'
  | 'Engine Wiring Harness (EWH)'
  | 'Alternator Wiring Harness (AWH)'
  | 'Electrical Interface Diagram'
  | 'Sensors Group'
  | 'Junction Box';

export type PLMStatus = 'Pending' | 'In Review' | 'Released in PLM';

export type AlternatorWorkflowStatus =
  | 'Mail notification pending'
  | 'Pending in PLM'
  | 'Released in PLM'
  | 'Other';

export interface WorkflowTaskItem {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  dueDate?: string;
  assignedTo?: string;
}

export interface SubProject {
  id: string;
  componentType: SubProjectComponentType;
  isExistingPart: boolean;
  partOrGroupNumber: string; // e.g. DV2.M821.02.0.PR
  plmStatus: PLMStatus;
  taskTitle: string;
  taskStatus: 'Open' | 'Feedback Awaited' | 'Completed';
  lastUpdated: string;
  assignedEngineer: string;
  // Alternator specific workflow & tasks
  alternatorStatus?: AlternatorWorkflowStatus;
  customStatusText?: string;
  actionTasks?: WorkflowTaskItem[];
  copiedFromProjectCode?: string;
  copiedFromModel?: string;
  // Alternator specific SOTR details
  sotr?: SOTRData;
  feedbackNotes?: string;
  attachedDocumentName?: string;
  existingPartNumber?: string;
  attachedDrawingFileName?: string;
}

export interface SOTRData {
  sotrNumber: string;
  createdAt: string;
  status: 'Draft' | 'Submitted' | 'Feedback Awaited' | 'Approved' | 'More Info Needed';
  chapter1_general: {
    projectTitle: string;
    vesselType: string;
    operatingZone: string;
    ambientRating: string;
  };
  chapter2_electricalRatings: {
    continuousKva: number;
    voltage: number;
    frequencyHz: number;
    powerFactor: number;
    speedRpm: number;
    connectionType: string;
  };
  chapter3_excitationAvr: {
    avrType: string;
    pmgFitted: boolean;
    voltageRegulationPct: number;
    quadratureDroop: boolean;
  };
  chapter4_thermalInsulation: {
    insulationClass: string;
    tempRiseClass: string;
    rtdWindingCount: number;
    bearingRtdCount: number;
    spaceHeaterWatts: number;
    spaceHeaterVolts: number;
  };
  chapter5_mechanicalCoupling: {
    enclosureIp: string;
    mountingType: string;
    housingSize: string;
    flywheelSize: string;
    bearingType: string;
  };
  chapter6_classCertifications: {
    classificationSociety: string;
    marineCertRequired: boolean;
    witnessTestRequired: boolean;
    fatScheduleDate: string;
  };
}

export interface DesignInputs53 {
  // 1. General & Customer Info (1-9)
  projectName: string;
  customerName: string;
  yardNumber: string;
  endCustomer: string;
  tncRefNo: string;
  tncDate: string;
  contractDeliveryDate: string;
  projectLeadEngineer: string;
  generalRemarks: string;

  // 2. Engine & DG Set Specs (10-18)
  dgRatingKwe: number;
  dgRatingKva: number;
  typeOfDg: string; // Auxiliary, Emergency, Harbour, Propulsion
  engineSeries: string; // DV8, DV12, 4K1080, 6SL9088, etc.
  engineModel: string;
  emissionNorms: string; // IMO Tier II, IMO Tier III, CPCB-IV+
  dutyCycle: string; // Prime, Continuous, Standby
  startType: string; // Electric 24V DC, Pneumatic, Dual
  governingStandard: string; // ISO 8528, ISO 3046, Class Rules

  // 3. Marine Class & Environment (19-27)
  primaryClass: string; // IRS, LRS, ABS, DNV, NKK, BV, RINA
  dualClass: string; // None, or secondary class
  ambientAirTempC: number;
  engineRoomTempC: number;
  seaWaterCoolingTempC: number;
  relativeHumidityPct: number;
  motionRollDeg: number;
  motionPitchDeg: number;
  inclinationDynamicDeg: number;

  // 4. Electrical System (28-36)
  mainAcVoltage: number; // e.g. 415V
  controlSupplyVoltage: string; // 24V DC isolated
  systemFrequencyHz: number; // 50Hz, 60Hz
  systemPhaseWire: string; // 3 Phase 3 Wire / 3 Phase 4 Wire
  voltageRegulationPct: number; // +/- 0.5%, +/- 1.0%
  frequencyRegulationPct: number; // ISO 8528 G2, G3
  neutralEarthingSystem: string; // Insulated Neutral, Solidly Earthed, High Resistance
  shortCircuitWithstandCurrentKa: number;
  totalHarmonicDistortionThdPct: number;

  // 5. Alternator Specs (37-45)
  alternatorMake: string;
  alternatorModel: string;
  alternatorKva: number;
  voltageRpmCombo: string; // 415V / 1500 RPM, 440V / 1800 RPM
  avrModel: string;
  spaceHeaterRequired: boolean;
  spaceHeaterSupply: string;
  rtdSensorsConfiguration: string; // 6x PT100 Winding + 2x Bearing
  couplingType: string; // Single Bearing SAE, Two Bearing Flexible
  housingFlywheelCombo: string; // SAE 1 / 14, SAE 0 / 18

  // 6. Panel & Instrumentation (46-53)
  panelMountingType: string; // Engine Mounted, Off-Engine Free Standing, Bulkhead
  panelIpRating: string; // IP23, IP44, IP54, IP55
  enclosureMaterialGauge: string; // CRCA 2.0mm, SS316 2.0mm
  controllerType: string; // DeepSea Marine, ComAp InteliDrive Marine, Deif AGC-4
  shipAutomationInterface: string; // Modbus RTU RS485, Modbus TCP/IP, CANopen J1939
  alarmAnnunciationProtocol: string; // NAMUR / Marine Class auto-shutdown + pre-alarms
  emergencyStopCircuit: string; // Hardwired fail-safe dual loop
  safetyInstrumentationStandard: string; // IEC 60092-504
}

export interface Project {
  id: string;
  projectCode: string; // e.g. KOEL-MAR-2026-001
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  progressPercent: number;
  designInputs: DesignInputs53;
  subProjects: SubProject[];
  ecnIds: string[];
}

export interface EcnEcr {
  id: string;
  changeType: 'ECN' | 'ECR';
  manualChangeNumber: string; // Manual change number - no auto numbering!
  projectId: string;
  projectCode: string;
  projectName: string;
  partDescription: string;
  reasonForChange: string;
  engineerName: string;
  dateLogged: string;
  status: 'Open' | 'Under Investigation' | 'Approved' | 'Implemented';
  impactAnalysis: string;
  affectedComponents: string[];
}

export interface SiteVisit {
  id: string;
  visitDate: string;
  shipyardName: string;
  customerName: string;
  vesselYardNumber: string;
  engineerName: string;
  purpose: string;
  findings: string;
  actionItems: string;
  uploadedDocumentName?: string;
  status: 'Scheduled' | 'Completed' | 'Pending Follow-up';
}

export interface AlternatorCatalogItem {
  id: string;
  model: string;
  series: string;
  ratingKva: number;
  voltageV: number;
  frequencyHz: number;
  rpm: number;
  frameSize: string;
  ipProtection: string;
  efficiencyPct: number;
  cooling: string;
  weightKg: number;
  marineApprovedSocieties: string[];
}

export interface InspectionAuthority {
  id: string;
  code: string; // IRS, LRS, ABS, DNV, NKK, BV, RINA
  fullName: string;
  country: string;
  marineRulesEdition: string;
  standardTempRiseLimits: string;
  witnessTestingRequirements: string;
  officialRuleDocumentName: string;
  pdfUrl?: string;
  contactRepresentative: string;
}

export interface CableSizingRow {
  currentA: number;
  cableSizeSqMm: number;
  glandSize: string;
  cableType: string;
  voltageDropPerMeterMv: number;
  shortCircuitRatingKa: number;
}

export interface FormFieldConfig {
  id: string;
  formId: 'project' | 'siteVisit' | 'ecn' | 'trials' | 'drawings';
  fieldKey: string;
  label: string;
  section: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  isMandatory: boolean;
  isCustom?: boolean;
  options?: string[];
  defaultValue?: string | number | boolean;
}

