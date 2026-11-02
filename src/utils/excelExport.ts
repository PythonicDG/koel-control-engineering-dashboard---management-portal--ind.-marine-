import * as XLSX from 'xlsx';
import { SOTRData } from '../types/index.ts';

export function exportSotrToExcel(sotr: SOTRData, projectName: string, projectCode: string) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Cover & Summary
  const summaryRows = [
    ['KIRLOSKAR OIL ENGINES LIMITED (KOEL) - INDUSTRIAL MARINE DIVISION'],
    ['STANDARD ORDER TECHNICAL REQUIREMENT (SOTR) SPECIFICATION SHEET'],
    ['Document ID:', sotr.sotrNumber, 'Date Generated:', sotr.createdAt],
    ['Project Code:', projectCode, 'Project Name:', projectName],
    ['Current SOTR Status:', sotr.status],
    [],
    ['CHAPTER 1: GENERAL & VESSEL OPERATING ENVELOPE'],
    ['Parameter', 'Value', 'Unit / Note'],
    ['Project Title', sotr.chapter1_general.projectTitle, 'Marine Application'],
    ['Vessel Type', sotr.chapter1_general.vesselType, 'Hull / Application Type'],
    ['Operating Zone', sotr.chapter1_general.operatingZone, 'Trading Area'],
    ['Ambient Rating Condition', sotr.chapter1_general.ambientRating, 'ISO / Marine Standard'],
    [],
    ['CHAPTER 2: ELECTRICAL RATINGS & PERFORMANCE'],
    ['Parameter', 'Value', 'Unit / Note'],
    ['Continuous Power (kVA)', sotr.chapter2_electricalRatings.continuousKva, 'kVA at rated PF'],
    ['Nominal Voltage', sotr.chapter2_electricalRatings.voltage, 'Volts AC (RMS)'],
    ['System Frequency', sotr.chapter2_electricalRatings.frequencyHz, 'Hz'],
    ['Power Factor (cos phi)', sotr.chapter2_electricalRatings.powerFactor, 'Lagging'],
    ['Synchronous Speed', sotr.chapter2_electricalRatings.speedRpm, 'RPM'],
    ['Stator Connection', sotr.chapter2_electricalRatings.connectionType, 'Star / Delta'],
    [],
    ['CHAPTER 3: EXCITATION & VOLTAGE REGULATION (AVR)'],
    ['Parameter', 'Value', 'Unit / Note'],
    ['AVR Make & Type', sotr.chapter3_excitationAvr.avrType, 'Digital / Analog Automatic Voltage Regulator'],
    ['Permanent Magnet Generator (PMG)', sotr.chapter3_excitationAvr.pmgFitted ? 'Fitted (Required)' : 'Not Fitted (Self-excited)', 'Short-circuit sustained excitation'],
    ['Steady-State Voltage Regulation', `+/- ${sotr.chapter3_excitationAvr.voltageRegulationPct}%`, 'Across no-load to full-load'],
    ['Quadrature Droop CT', sotr.chapter3_excitationAvr.quadratureDroop ? 'Included' : 'Not Included', 'For parallel operation'],
    [],
    ['CHAPTER 4: THERMAL, INSULATION & MONITORING'],
    ['Parameter', 'Value', 'Unit / Note'],
    ['Stator Insulation Class', sotr.chapter4_thermalInsulation.insulationClass, 'Class H standard'],
    ['Temperature Rise Class', sotr.chapter4_thermalInsulation.tempRiseClass, 'Class F marine allowed rise'],
    ['Winding RTD Sensors', `${sotr.chapter4_thermalInsulation.rtdWindingCount}x PT100 Simplex`, 'Embedded in stator slots'],
    ['Bearing RTD Sensors', `${sotr.chapter4_thermalInsulation.bearingRtdCount}x PT100 Simplex`, 'Drive End & Non-Drive End'],
    ['Anti-Condensation Space Heater', `${sotr.chapter4_thermalInsulation.spaceHeaterWatts} Watts @ ${sotr.chapter4_thermalInsulation.spaceHeaterVolts}V AC`, 'Single Phase Supply'],
    [],
    ['CHAPTER 5: MECHANICAL COUPLING & ENCLOSURE'],
    ['Parameter', 'Value', 'Unit / Note'],
    ['Enclosure Protection Index', sotr.chapter5_mechanicalCoupling.enclosureIp, 'IEC 60034-5'],
    ['Mounting Arrangement', sotr.chapter5_mechanicalCoupling.mountingType, 'IM B34 / IM B35'],
    ['SAE Adaptor Housing Size', sotr.chapter5_mechanicalCoupling.housingSize, 'SAE Flange Interface'],
    ['Flywheel Drive Disc Size', sotr.chapter5_mechanicalCoupling.flywheelSize, 'SAE Disc Interface'],
    ['Bearing System', sotr.chapter5_mechanicalCoupling.bearingType, 'Regreasable Deep Groove'],
    [],
    ['CHAPTER 6: MARINE CLASSIFICATION & QUALITY AUDIT'],
    ['Parameter', 'Value', 'Unit / Note'],
    ['Classification Society', sotr.chapter6_classCertifications.classificationSociety, 'Rules & Survey compliance'],
    ['Marine Works Certificate (Class 3.2)', sotr.chapter6_classCertifications.marineCertRequired ? 'Mandatory' : 'Standard 3.1', 'EN 10204 / Class Society'],
    ['Witnessed Factory Acceptance Test (FAT)', sotr.chapter6_classCertifications.witnessTestRequired ? 'Required by Class Surveyor' : 'Routine Internal Test', 'Load bench, overload & heat run'],
    ['Target FAT Schedule Date', sotr.chapter6_classCertifications.fatScheduleDate, 'ISO Date format'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(summaryRows);
  // Column widths
  ws['!cols'] = [{ wch: 36 }, { wch: 34 }, { wch: 32 }];

  XLSX.utils.book_append_sheet(wb, ws, 'KOEL_SOTR_Spec');

  const filename = `${sotr.sotrNumber || 'SOTR'}_${projectCode}_KOEL_Spec.xlsx`;
  XLSX.writeFile(wb, filename);
}
