import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, DesignInputs53, SubProject } from '../types/index.ts';

export interface DesignInputItem {
  seq: number;
  chapterNumber: number;
  chapterTitle: string;
  parameterName: string;
  value: string | number;
  unitOrStandard: string;
}

/**
 * Returns the complete structured array of all 53 (54) design inputs categorized by 6 chapters
 */
export function getStructured53DesignInputs(inputs: DesignInputs53): DesignInputItem[] {
  return [
    // CHAPTER 1: GENERAL & CUSTOMER INFO (1 - 9)
    {
      seq: 1,
      chapterNumber: 1,
      chapterTitle: 'General & Customer Info',
      parameterName: 'Project Name',
      value: inputs.projectName || 'N/A',
      unitOrStandard: 'Vessel / Hull Identifier',
    },
    {
      seq: 2,
      chapterNumber: 1,
      chapterTitle: 'General & Customer Info',
      parameterName: 'Customer & Shipyard',
      value: inputs.customerName || 'N/A',
      unitOrStandard: 'Shipbuilder / Client',
    },
    {
      seq: 3,
      chapterNumber: 1,
      chapterTitle: 'General & Customer Info',
      parameterName: 'Yard / Hull Number',
      value: inputs.yardNumber || 'N/A',
      unitOrStandard: 'Yard Build No.',
    },
    {
      seq: 4,
      chapterNumber: 1,
      chapterTitle: 'General & Customer Info',
      parameterName: 'End Customer / Fleet Owner',
      value: inputs.endCustomer || 'N/A',
      unitOrStandard: 'Operator / Navy / Coast Guard',
    },
    {
      seq: 5,
      chapterNumber: 1,
      chapterTitle: 'General & Customer Info',
      parameterName: 'TNC Reference Number',
      value: inputs.tncRefNo || 'N/A',
      unitOrStandard: 'Commercial / TNC Order Ref',
    },
    {
      seq: 6,
      chapterNumber: 1,
      chapterTitle: 'General & Customer Info',
      parameterName: 'TNC Order Date',
      value: inputs.tncDate || 'N/A',
      unitOrStandard: 'YYYY-MM-DD',
    },
    {
      seq: 7,
      chapterNumber: 1,
      chapterTitle: 'General & Customer Info',
      parameterName: 'Contract Delivery Date',
      value: inputs.contractDeliveryDate || 'N/A',
      unitOrStandard: 'Contract Milestone',
    },
    {
      seq: 8,
      chapterNumber: 1,
      chapterTitle: 'General & Customer Info',
      parameterName: 'Project Lead Engineer',
      value: inputs.projectLeadEngineer || 'N/A',
      unitOrStandard: 'Lead Systems Architect',
    },
    {
      seq: 9,
      chapterNumber: 1,
      chapterTitle: 'General & Customer Info',
      parameterName: 'General Project Remarks',
      value: inputs.generalRemarks || 'Standard Marine Build',
      unitOrStandard: 'Special Requirements / Scope',
    },

    // CHAPTER 2: ENGINE & DG SET SPECS (10 - 18)
    {
      seq: 10,
      chapterNumber: 2,
      chapterTitle: 'Engine & DG Set Specs',
      parameterName: 'DG Electrical Active Power',
      value: inputs.dgRatingKwe,
      unitOrStandard: 'kWe (Electrical Output)',
    },
    {
      seq: 11,
      chapterNumber: 2,
      chapterTitle: 'Engine & DG Set Specs',
      parameterName: 'DG Apparent Power Rating',
      value: inputs.dgRatingKva,
      unitOrStandard: 'kVA (@ 0.8 PF Lagging)',
    },
    {
      seq: 12,
      chapterNumber: 2,
      chapterTitle: 'Engine & DG Set Specs',
      parameterName: 'Type of DG Set',
      value: inputs.typeOfDg,
      unitOrStandard: 'Operational Function (Aux/Emerg/Harbour)',
    },
    {
      seq: 13,
      chapterNumber: 2,
      chapterTitle: 'Engine & DG Set Specs',
      parameterName: 'Engine Series',
      value: inputs.engineSeries,
      unitOrStandard: 'KOEL Marine Series (DV8, DV12, etc.)',
    },
    {
      seq: 14,
      chapterNumber: 2,
      chapterTitle: 'Engine & DG Set Specs',
      parameterName: 'Engine Model Code',
      value: inputs.engineModel,
      unitOrStandard: 'Prime Mover Specification',
    },
    {
      seq: 15,
      chapterNumber: 2,
      chapterTitle: 'Engine & DG Set Specs',
      parameterName: 'Marine Emission Norms',
      value: inputs.emissionNorms,
      unitOrStandard: 'IMO MARPOL Annex VI Tier II/III',
    },
    {
      seq: 16,
      chapterNumber: 2,
      chapterTitle: 'Engine & DG Set Specs',
      parameterName: 'Duty Cycle Rating',
      value: inputs.dutyCycle,
      unitOrStandard: 'Continuous (ISO 8528 COP / Prime)',
    },
    {
      seq: 17,
      chapterNumber: 2,
      chapterTitle: 'Engine & DG Set Specs',
      parameterName: 'Starting Mechanism',
      value: inputs.startType,
      unitOrStandard: 'Electric 24V DC / Pneumatic / Dual',
    },
    {
      seq: 18,
      chapterNumber: 2,
      chapterTitle: 'Engine & DG Set Specs',
      parameterName: 'Speed Governing Standard',
      value: inputs.governingStandard,
      unitOrStandard: 'ISO 8528 Class G2/G3 / ISO 3046',
    },

    // CHAPTER 3: MARINE CLASS & ENVIRONMENT (19 - 27)
    {
      seq: 19,
      chapterNumber: 3,
      chapterTitle: 'Marine Class & Environment',
      parameterName: 'Primary Classification Society',
      value: inputs.primaryClass,
      unitOrStandard: 'IRS / LRS / ABS / DNV / NKK',
    },
    {
      seq: 20,
      chapterNumber: 3,
      chapterTitle: 'Marine Class & Environment',
      parameterName: 'Dual Classification Society',
      value: inputs.dualClass || 'None',
      unitOrStandard: 'Secondary Class Endorsement',
    },
    {
      seq: 21,
      chapterNumber: 3,
      chapterTitle: 'Marine Class & Environment',
      parameterName: 'Design Ambient Air Temp',
      value: inputs.ambientAirTempC,
      unitOrStandard: '°C (Dry Bulb Standard)',
    },
    {
      seq: 22,
      chapterNumber: 3,
      chapterTitle: 'Marine Class & Environment',
      parameterName: 'Engine Room Operating Temp',
      value: inputs.engineRoomTempC,
      unitOrStandard: '°C (Tropical Marine Max)',
    },
    {
      seq: 23,
      chapterNumber: 3,
      chapterTitle: 'Marine Class & Environment',
      parameterName: 'Raw Seawater Cooling Temp',
      value: inputs.seaWaterCoolingTempC,
      unitOrStandard: '°C (Heat Exchanger Design)',
    },
    {
      seq: 24,
      chapterNumber: 3,
      chapterTitle: 'Marine Class & Environment',
      parameterName: 'Design Relative Humidity',
      value: inputs.relativeHumidityPct,
      unitOrStandard: '% RH (Tropical Marine Condition)',
    },
    {
      seq: 25,
      chapterNumber: 3,
      chapterTitle: 'Marine Class & Environment',
      parameterName: 'Static Roll Limit Angle',
      value: inputs.motionRollDeg,
      unitOrStandard: 'Degrees (Classification Society Rule)',
    },
    {
      seq: 26,
      chapterNumber: 3,
      chapterTitle: 'Marine Class & Environment',
      parameterName: 'Static Pitch Limit Angle',
      value: inputs.motionPitchDeg,
      unitOrStandard: 'Degrees (Classification Society Rule)',
    },
    {
      seq: 27,
      chapterNumber: 3,
      chapterTitle: 'Marine Class & Environment',
      parameterName: 'Dynamic Inclination Envelope',
      value: inputs.inclinationDynamicDeg,
      unitOrStandard: 'Degrees (Heavy Sea Condition)',
    },

    // CHAPTER 4: ELECTRICAL SYSTEM (28 - 36)
    {
      seq: 28,
      chapterNumber: 4,
      chapterTitle: 'Electrical System',
      parameterName: 'Main AC Generation Voltage',
      value: inputs.mainAcVoltage,
      unitOrStandard: 'Volts AC (L-L, RMS)',
    },
    {
      seq: 29,
      chapterNumber: 4,
      chapterTitle: 'Electrical System',
      parameterName: 'Control Supply Auxiliary Voltage',
      value: inputs.controlSupplyVoltage,
      unitOrStandard: '24V DC Isolated Battery Backed',
    },
    {
      seq: 30,
      chapterNumber: 4,
      chapterTitle: 'Electrical System',
      parameterName: 'Operating System Frequency',
      value: inputs.systemFrequencyHz,
      unitOrStandard: 'Hz (Nominal)',
    },
    {
      seq: 31,
      chapterNumber: 4,
      chapterTitle: 'Electrical System',
      parameterName: 'Phase & Wire Topology',
      value: inputs.systemPhaseWire,
      unitOrStandard: 'Marine Distribution Standard',
    },
    {
      seq: 32,
      chapterNumber: 4,
      chapterTitle: 'Electrical System',
      parameterName: 'Steady-State Voltage Regulation',
      value: `± ${inputs.voltageRegulationPct} %`,
      unitOrStandard: 'No-load to Full-load',
    },
    {
      seq: 33,
      chapterNumber: 4,
      chapterTitle: 'Electrical System',
      parameterName: 'Frequency Transient Regulation',
      value: `± ${inputs.frequencyRegulationPct} %`,
      unitOrStandard: 'ISO 8528 Class G2/G3 Step Response',
    },
    {
      seq: 34,
      chapterNumber: 4,
      chapterTitle: 'Electrical System',
      parameterName: 'Neutral Earthing System',
      value: inputs.neutralEarthingSystem,
      unitOrStandard: 'Insulated / Solid / High-Resistance',
    },
    {
      seq: 35,
      chapterNumber: 4,
      chapterTitle: 'Electrical System',
      parameterName: 'Short Circuit Withstand Level',
      value: inputs.shortCircuitWithstandCurrentKa,
      unitOrStandard: 'kA (1 sec / 3 sec Thermal Rating)',
    },
    {
      seq: 36,
      chapterNumber: 4,
      chapterTitle: 'Electrical System',
      parameterName: 'Total Harmonic Distortion (THD)',
      value: `< ${inputs.totalHarmonicDistortionThdPct} %`,
      unitOrStandard: 'Line-to-Line Voltage THD Limit',
    },

    // CHAPTER 5: ALTERNATOR SPECS (37 - 46)
    {
      seq: 37,
      chapterNumber: 5,
      chapterTitle: 'Alternator Specs',
      parameterName: 'Alternator Make & Manufacturer',
      value: inputs.alternatorMake,
      unitOrStandard: 'KOEL / Marine Partner Make',
    },
    {
      seq: 38,
      chapterNumber: 5,
      chapterTitle: 'Alternator Specs',
      parameterName: 'Alternator Frame & Model',
      value: inputs.alternatorModel,
      unitOrStandard: 'Screen Protected Drip Proof Marine',
    },
    {
      seq: 39,
      chapterNumber: 5,
      chapterTitle: 'Alternator Specs',
      parameterName: 'Alternator Continuous Rating',
      value: inputs.alternatorKva,
      unitOrStandard: 'kVA (@ Marine Ambient)',
    },
    {
      seq: 40,
      chapterNumber: 5,
      chapterTitle: 'Alternator Specs',
      parameterName: 'Voltage & Synchronous Speed',
      value: inputs.voltageRpmCombo,
      unitOrStandard: 'V / RPM (4-Pole Synchronous)',
    },
    {
      seq: 41,
      chapterNumber: 5,
      chapterTitle: 'Alternator Specs',
      parameterName: 'Automatic Voltage Regulator (AVR)',
      value: inputs.avrModel,
      unitOrStandard: 'Digital / Analog Microprocessor AVR',
    },
    {
      seq: 42,
      chapterNumber: 5,
      chapterTitle: 'Alternator Specs',
      parameterName: 'Anti-Condensation Space Heater',
      value: inputs.spaceHeaterRequired ? 'Required & Fitted' : 'Not Required',
      unitOrStandard: 'Marine Tropical Anti-Moisture',
    },
    {
      seq: 43,
      chapterNumber: 5,
      chapterTitle: 'Alternator Specs',
      parameterName: 'Space Heater Supply Voltage',
      value: inputs.spaceHeaterSupply || '230V AC Single Phase',
      unitOrStandard: 'Auxiliary Shore / Ship Supply',
    },
    {
      seq: 44,
      chapterNumber: 5,
      chapterTitle: 'Alternator Specs',
      parameterName: 'RTD Temperature Sensors',
      value: inputs.rtdSensorsConfiguration,
      unitOrStandard: 'PT100 Simplex Winding & Bearing RTDs',
    },
    {
      seq: 45,
      chapterNumber: 5,
      chapterTitle: 'Alternator Specs',
      parameterName: 'Mechanical Coupling Configuration',
      value: inputs.couplingType,
      unitOrStandard: 'Single Bearing SAE / Flexible Two Bearing',
    },
    {
      seq: 46,
      chapterNumber: 5,
      chapterTitle: 'Alternator Specs',
      parameterName: 'Housing & Flywheel Interface',
      value: inputs.housingFlywheelCombo,
      unitOrStandard: 'SAE Bellhousing & Drive Disc Standard',
    },

    // CHAPTER 6: PANEL & INSTRUMENTATION (47 - 54)
    {
      seq: 47,
      chapterNumber: 6,
      chapterTitle: 'Panel & Instrumentation',
      parameterName: 'Control Panel Mounting Type',
      value: inputs.panelMountingType,
      unitOrStandard: 'Engine-Mounted AVM / Bulkhead / Free Stand',
    },
    {
      seq: 48,
      chapterNumber: 6,
      chapterTitle: 'Panel & Instrumentation',
      parameterName: 'Enclosure Ingress Protection (IP)',
      value: inputs.panelIpRating,
      unitOrStandard: 'IEC 60529 (IP23 / IP44 / IP54 / IP55)',
    },
    {
      seq: 49,
      chapterNumber: 6,
      chapterTitle: 'Panel & Instrumentation',
      parameterName: 'Enclosure Material & Thickness',
      value: inputs.enclosureMaterialGauge,
      unitOrStandard: 'CRCA / SS316 Marine Grade Sheet',
    },
    {
      seq: 50,
      chapterNumber: 6,
      chapterTitle: 'Panel & Instrumentation',
      parameterName: 'Genset Marine Controller Make',
      value: inputs.controllerType,
      unitOrStandard: 'Type-Approved Marine Engine Controller',
    },
    {
      seq: 51,
      chapterNumber: 6,
      chapterTitle: 'Panel & Instrumentation',
      parameterName: 'Ship Automation Interface Protocol',
      value: inputs.shipAutomationInterface,
      unitOrStandard: 'Modbus RTU RS485 / TCP/IP / CANbus J1939',
    },
    {
      seq: 52,
      chapterNumber: 6,
      chapterTitle: 'Panel & Instrumentation',
      parameterName: 'Alarm Annunciation & Trip Logic',
      value: inputs.alarmAnnunciationProtocol,
      unitOrStandard: 'Class-Mandated Pre-alarm & Auto-shutdown',
    },
    {
      seq: 53,
      chapterNumber: 6,
      chapterTitle: 'Panel & Instrumentation',
      parameterName: 'Emergency Stop Safety Circuit',
      value: inputs.emergencyStopCircuit,
      unitOrStandard: 'Hardwired Fail-Safe Dual Loop with Solenoid',
    },
    {
      seq: 54,
      chapterNumber: 6,
      chapterTitle: 'Panel & Instrumentation',
      parameterName: 'Marine Instrumentation Standard',
      value: inputs.safetyInstrumentationStandard,
      unitOrStandard: 'IEC 60092-504 Control & Monitoring Compliance',
    },
  ];
}

/**
 * Generates and downloads a multi-sheet formatted Excel workbook (.xlsx)
 * with the 53 Design Inputs and Sub-Projects PLM status matrix.
 */
export function exportProjectToExcel(project: Project) {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // SHEET 1: 53 DESIGN INPUTS SPECIFICATION
  const items = getStructured53DesignInputs(project.designInputs);

  const designInputRows: (string | number)[][] = [
    ['KIRLOSKAR OIL ENGINES LIMITED (KOEL) - INDUSTRIAL MARINE DIVISION'],
    ['CONTROL ENGINEERING SPECIFICATION DOSSIER - 53 DESIGN INPUTS'],
    ['CONFIDENTIAL & PROPRIETARY · STRICTLY FOR AUTHORIZED MARINE USE'],
    [],
    ['PROJECT REFERENCE DETAILS:'],
    ['Project Code:', project.projectCode, '', 'Date Exported:', dateStr],
    ['Project / Vessel Name:', project.designInputs.projectName, '', 'Overall Status:', project.status],
    ['Customer & Shipyard:', project.designInputs.customerName, '', 'PLM Completion:', `${project.progressPercent}%`],
    ['Yard / Hull No:', project.designInputs.yardNumber, '', 'Lead Systems Engineer:', project.designInputs.projectLeadEngineer],
    ['End Customer / Operator:', project.designInputs.endCustomer, '', 'Contract Delivery Date:', project.designInputs.contractDeliveryDate],
    ['Primary Classification:', project.designInputs.primaryClass, '', 'TNC Reference / Date:', `${project.designInputs.tncRefNo} (${project.designInputs.tncDate})`],
    [],
    ['SL NO.', 'CHAPTER / SECTION', 'DESIGN PARAMETER', 'SPECIFIED VALUE', 'ENGINEERING UNIT / STANDARD'],
  ];

  let currentChapter = 0;
  items.forEach(item => {
    if (item.chapterNumber !== currentChapter) {
      currentChapter = item.chapterNumber;
      designInputRows.push([
        '',
        `SECTION ${currentChapter}: ${item.chapterTitle.toUpperCase()}`,
        '-------------------------------------------',
        '-------------------------------------------',
        '-------------------------------------------',
      ]);
    }
    designInputRows.push([
      item.seq,
      item.chapterTitle,
      item.parameterName,
      item.value,
      item.unitOrStandard,
    ]);
  });

  const wsDesignInputs = XLSX.utils.aoa_to_sheet(designInputRows);
  wsDesignInputs['!cols'] = [
    { wch: 8 },  // SL NO
    { wch: 30 }, // CHAPTER
    { wch: 38 }, // PARAMETER
    { wch: 40 }, // VALUE
    { wch: 42 }, // UNITS
  ];
  XLSX.utils.book_append_sheet(wb, wsDesignInputs, '53_Design_Inputs');

  // SHEET 2: SUB-PROJECTS PLM BREAKDOWN
  const subprojectRows: (string | number)[][] = [
    ['KIRLOSKAR OIL ENGINES LIMITED (KOEL) - INDUSTRIAL MARINE DIVISION'],
    [`SUB-PROJECT PLM RELEASE MATRIX FOR ${project.projectCode} (${project.designInputs.projectName})`],
    ['Release Rule 2 Status: All 7 Sub-projects must reach "Released in PLM" before project can close.'],
    [],
    ['SUB-PROJECT ID', 'COMPONENT TYPE', 'PART / GROUP NUMBER', 'PART CATEGORY', 'PLM STATUS', 'TASK STATUS', 'ASSIGNED ENGINEER', 'LAST UPDATED'],
  ];

  project.subProjects.forEach(sp => {
    subprojectRows.push([
      sp.id,
      sp.componentType,
      sp.partOrGroupNumber || 'Pending Allocation',
      sp.isExistingPart ? 'Existing Standard Part' : 'New Engineered Part',
      sp.plmStatus,
      sp.taskStatus,
      sp.assignedEngineer,
      sp.lastUpdated,
    ]);
  });

  const wsSubProjects = XLSX.utils.aoa_to_sheet(subprojectRows);
  wsSubProjects['!cols'] = [
    { wch: 14 },
    { wch: 32 },
    { wch: 26 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 24 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSubProjects, 'SubProjects_PLM');

  // SHEET 3: EXECUTIVE SUMMARY & COMPLIANCE SIGN-OFF
  const summaryRows: (string | number)[][] = [
    ['KIRLOSKAR OIL ENGINES LIMITED (KOEL) - INDUSTRIAL MARINE DIVISION'],
    ['EXECUTIVE SUMMARY & TECHNICAL COMPLIANCE SIGN-OFF'],
    [],
    ['METRIC / ATTRIBUTE', 'VALUE / STATEMENT'],
    ['Project Code', project.projectCode],
    ['Vessel Identifier', project.designInputs.projectName],
    ['Shipbuilder / Yard', `${project.designInputs.customerName} (Yard: ${project.designInputs.yardNumber})`],
    ['DG Rating', `${project.designInputs.dgRatingKva} kVA / ${project.designInputs.dgRatingKwe} kWe @ 0.8 PF`],
    ['Engine Series & Model', `${project.designInputs.engineSeries} (${project.designInputs.engineModel})`],
    ['Classification Society', `${project.designInputs.primaryClass} (Dual Class: ${project.designInputs.dualClass || 'None'})`],
    ['Main Electrical Output', `${project.designInputs.mainAcVoltage}V, 3-Phase, ${project.designInputs.systemFrequencyHz}Hz`],
    ['Alternator Selected', `${project.designInputs.alternatorMake} ${project.designInputs.alternatorModel}`],
    ['Genset Controller', project.designInputs.controllerType],
    ['Automation Protocol', project.designInputs.shipAutomationInterface],
    ['Overall PLM Completion', `${project.progressPercent}%`],
    ['Project Lifecycle Status', project.status],
    [],
    ['TECHNICAL APPROVAL SIGN-OFF:'],
    ['Role', 'Name & Title', 'Signature', 'Date', 'Stamp'],
    ['Prepared By', project.designInputs.projectLeadEngineer, '', dateStr, 'KOEL Control Engg'],
    ['Reviewed By', 'Amesh Gadugale (Lead Marine Systems Architect)', '', dateStr, 'KOEL Pune Plant'],
    ['Quality & Class Surveyor', `${project.designInputs.primaryClass} Surveyor Representative`, '', dateStr, 'Class Surveyor Seal'],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 30 },
    { wch: 50 },
    { wch: 20 },
    { wch: 15 },
    { wch: 25 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Compliance_SignOff');

  const filename = `${project.projectCode}_53_Design_Inputs.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Generates and downloads a multi-page formatted PDF report
 * containing all 53 Design Inputs and Sub-Projects PLM status matrix.
 */
export function exportProjectToPdf(project: Project) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryNavy: [number, number, number] = [12, 74, 138];   // #0c4a8a
  const secondaryTeal: [number, number, number] = [15, 118, 110]; // #0f766e
  const textDark: [number, number, number] = [30, 41, 59];
  const bgHeader: [number, number, number] = [241, 245, 249];

  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Top Title Banner
  doc.setFillColor(...primaryNavy);
  doc.rect(0, 0, 210, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('KIRLOSKAR OIL ENGINES LIMITED (KOEL) · INDUSTRIAL MARINE DIVISION', 14, 9);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Control Engineering Department · 53 Design Inputs Technical Specification Dossier', 14, 15);
  doc.text(`Doc ID: KOEL-ENG-53DI-${project.projectCode}  |  Generated: ${dateStr}`, 14, 19);

  // Project Executive Info Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(...bgHeader);
  doc.roundedRect(14, 26, 182, 30, 2, 2, 'FD');

  doc.setTextColor(...primaryNavy);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`PROJECT: ${project.designInputs.projectName} [${project.projectCode}]`, 18, 32);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textDark);

  // Column 1
  doc.text(`Customer / Shipyard: ${project.designInputs.customerName}`, 18, 38);
  doc.text(`Yard / Hull No: ${project.designInputs.yardNumber}`, 18, 43);
  doc.text(`End Customer: ${project.designInputs.endCustomer}`, 18, 48);
  doc.text(`TNC Ref: ${project.designInputs.tncRefNo} (${project.designInputs.tncDate})`, 18, 53);

  // Column 2
  doc.text(`Primary Class: ${project.designInputs.primaryClass} (Dual: ${project.designInputs.dualClass || 'None'})`, 110, 38);
  doc.text(`DG Rating: ${project.designInputs.dgRatingKva} kVA / ${project.designInputs.dgRatingKwe} kWe`, 110, 43);
  doc.text(`Engine Model: ${project.designInputs.engineSeries} (${project.designInputs.engineModel})`, 110, 48);
  doc.text(`Project Status: ${project.status} (${project.progressPercent}% PLM Complete)`, 110, 53);

  const items = getStructured53DesignInputs(project.designInputs);

  // Generate 6 structured tables for the 6 Chapters
  const chapterTitles = [
    'Chapter 1: General & Customer Information (Inputs 1 - 9)',
    'Chapter 2: Engine & DG Set Specifications (Inputs 10 - 18)',
    'Chapter 3: Marine Classification & Environmental Limits (Inputs 19 - 27)',
    'Chapter 4: Electrical Distribution & Power Quality (Inputs 28 - 36)',
    'Chapter 5: Alternator Electro-Mechanical Specifications (Inputs 37 - 46)',
    'Chapter 6: Local Control Panel & Automation Instrumentation (Inputs 47 - 54)',
  ];

  let startY = 60;

  for (let ch = 1; ch <= 6; ch++) {
    const chapterItems = items.filter(it => it.chapterNumber === ch);
    const tableBody = chapterItems.map(it => [
      it.seq.toString(),
      it.parameterName,
      String(it.value),
      it.unitOrStandard,
    ]);

    autoTable(doc, {
      startY: startY,
      head: [
        [
          {
            content: chapterTitles[ch - 1],
            colSpan: 4,
            styles: {
              fillColor: primaryNavy,
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 8.5,
              halign: 'left',
            },
          },
        ],
        ['#', 'Parameter Name', 'Specified Value', 'Standard / Units'],
      ],
      body: tableBody,
      margin: { left: 14, right: 14 },
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 1.6,
        textColor: textDark,
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: secondaryTeal,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 60, fontStyle: 'bold' },
        2: { cellWidth: 54 },
        3: { cellWidth: 60 },
      },
      pageBreak: 'auto',
    });

    // @ts-ignore - jspdf-autotable adds lastAutoTable to doc
    startY = doc.lastAutoTable.finalY + 6;
  }

  // SUB-PROJECTS PLM RELEASE TABLE
  autoTable(doc, {
    startY: startY,
    head: [
      [
        {
          content: 'Sub-Projects Universal PLM Workflow Status (Rule 2 Mandatory Gate)',
          colSpan: 5,
          styles: {
            fillColor: primaryNavy,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8.5,
            halign: 'left',
          },
        },
      ],
      ['Component Sub-Project', 'Part / Group Number', 'Category', 'PLM Status', 'Assigned Engineer'],
    ],
    body: project.subProjects.map(sp => [
      sp.componentType,
      sp.partOrGroupNumber || 'Pending Allocation',
      sp.isExistingPart ? 'Existing Standard' : 'New Engineered Part',
      sp.plmStatus,
      sp.assignedEngineer,
    ]),
    margin: { left: 14, right: 14 },
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.6,
      textColor: textDark,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 40 },
      2: { cellWidth: 32 },
      3: { cellWidth: 30, halign: 'center' },
      4: { cellWidth: 30 },
    },
    pageBreak: 'auto',
  });

  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 6;

  // Check if sign-off box fits on the current page or needs a new page
  if (finalY > 240) {
    doc.addPage();
    finalY = 20;
  }

  // Engineering Sign-off Box
  autoTable(doc, {
    startY: finalY,
    head: [
      [
        {
          content: 'Engineering Approvals & Classification Society Endorsement',
          colSpan: 4,
          styles: {
            fillColor: primaryNavy,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8,
          },
        },
      ],
      ['Engineering Role', 'Name / Designation', 'Signature & Seal', 'Date'],
    ],
    body: [
      ['Prepared By', project.designInputs.projectLeadEngineer, 'Approved via KOEL PLM Portal', dateStr],
      ['Reviewed By', 'Amesh Gadugale (Lead Marine Architect)', 'Digitally Signed', dateStr],
      ['Classification Surveyor', `${project.designInputs.primaryClass} Marine Survey Authority`, 'Class Endorsement Pending / Received', dateStr],
    ],
    margin: { left: 14, right: 14 },
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: textDark,
    },
    headStyles: {
      fillColor: [100, 116, 139],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
  });

  // Add Page Numbers and Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);

    // Footer divider line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 287, 196, 287);

    doc.text(
      `KOEL Control Engineering (Ind. Marine) · Project: ${project.projectCode} · Confidential`,
      14,
      292
    );
    doc.text(`Page ${i} of ${totalPages}`, 196, 292, { align: 'right' });
  }

  const filename = `${project.projectCode}_53_Design_Inputs_Spec.pdf`;
  doc.save(filename);
}
