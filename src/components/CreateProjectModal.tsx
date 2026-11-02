import React, { useState } from 'react';
import { Project, DesignInputs53, SubProject } from '../types/index.ts';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: Project) => void;
  nextProjectIndex: number;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
  nextProjectIndex,
}) => {
  const [activeSection, setActiveSection] = useState<number>(1);

  const defaultInputs: DesignInputs53 = {
    // 1. General & Customer Info (1-9)
    projectName: 'Naval Offshore Patrol Vessel 500 kVA Aux DG',
    customerName: 'Goa Shipyard Limited (GSL)',
    yardNumber: 'GSL-YD-1280',
    endCustomer: 'Indian Navy',
    tncRefNo: 'TNC/GSL/2026/NAV-092',
    tncDate: new Date().toISOString().split('T')[0],
    contractDeliveryDate: '2027-04-30',
    projectLeadEngineer: 'Rajesh Kulkarni',
    generalRemarks: 'Dual class IRS/ABS certified emergency/auxiliary package with shock mounting.',

    // 2. Engine & DG Set Specs (10-18)
    dgRatingKwe: 400,
    dgRatingKva: 500,
    typeOfDg: 'Auxiliary Genset',
    engineSeries: 'DV12 Marine',
    engineModel: 'DV12-M Marine Turbocharged Intercooled',
    emissionNorms: 'IMO Tier II',
    dutyCycle: 'Continuous Marine Duty (PRP)',
    startType: 'Dual: Electric 24V DC + Pneumatic',
    governingStandard: 'ISO 8528 Class G3 / IRS Part 4',

    // 3. Marine Class & Environment (19-27)
    primaryClass: 'IRS',
    dualClass: 'ABS',
    ambientAirTempC: 45,
    engineRoomTempC: 50,
    seaWaterCoolingTempC: 32,
    relativeHumidityPct: 95,
    motionRollDeg: 22.5,
    motionPitchDeg: 10,
    inclinationDynamicDeg: 22.5,

    // 4. Electrical System (28-36)
    mainAcVoltage: 415,
    controlSupplyVoltage: '24V DC Isolated Marine Grade',
    systemFrequencyHz: 50,
    systemPhaseWire: '3 Phase 3 Wire Insulated Neutral',
    voltageRegulationPct: 0.5,
    frequencyRegulationPct: 1.0,
    neutralEarthingSystem: 'Insulated Neutral with Continuous Insulation Monitor',
    shortCircuitWithstandCurrentKa: 40,
    totalHarmonicDistortionThdPct: 3.0,

    // 5. Alternator Specs (37-45)
    alternatorMake: 'KOEL Marine',
    alternatorModel: 'KOEL 4CM-355-S4',
    alternatorKva: 500,
    voltageRpmCombo: '415V / 1500 RPM',
    avrModel: 'KOEL Digital D-510 with PMG',
    spaceHeaterRequired: true,
    spaceHeaterSupply: '230V AC Single Phase 300W',
    rtdSensorsConfiguration: '6x PT100 Stator Winding + 2x Bearing PT100',
    couplingType: 'Single Bearing Close-Coupled SAE Disc',
    housingFlywheelCombo: 'SAE 0 / 18',

    // 6. Panel & Instrumentation (46-53)
    panelMountingType: 'Off-Engine Bulkhead Mounted',
    panelIpRating: 'IP44',
    enclosureMaterialGauge: 'CRCA 2.0mm Marine Powder Coated RAL 7035',
    controllerType: 'DeepSea DSE8610 MKII Marine Auto-Synchronizing',
    shipAutomationInterface: 'Dual Redundant Modbus RTU RS485',
    alarmAnnunciationProtocol: 'IRS Marine Auto-Shutdown + Pre-Alarm Beacon',
    emergencyStopCircuit: 'Hardwired Fail-Safe Dual Loop with Wire-Break Monitor',
    safetyInstrumentationStandard: 'IEC 60092-504',
  };

  const [formData, setFormData] = useState<DesignInputs53>(defaultInputs);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const projectCode = `KOEL-MAR-2026-${String(nextProjectIndex).padStart(3, '0')}`;
    const newId = `proj-${Date.now()}`;

    // Initialize all 7 sub-projects per universal PLM workflow
    const initialSubProjects: SubProject[] = [
      {
        id: `sp-${Date.now()}-1`,
        componentType: 'Alternator',
        isExistingPart: false,
        partOrGroupNumber: `${formData.alternatorModel}-SOTR-01`,
        plmStatus: 'Pending',
        taskTitle: 'Release / Revise Structure in PLM & Inform Stakeholders',
        taskStatus: 'Feedback Awaited',
        lastUpdated: new Date().toLocaleDateString(),
        assignedEngineer: formData.projectLeadEngineer,
        sotr: {
          sotrNumber: `SOTR-2026-${projectCode}`,
          createdAt: new Date().toISOString().split('T')[0],
          status: 'Feedback Awaited',
          chapter1_general: {
            projectTitle: formData.projectName,
            vesselType: 'Patrol Vessel / Offshore',
            operatingZone: 'Indian EEZ & Coastal',
            ambientRating: `${formData.ambientAirTempC}°C Ambient, ${formData.relativeHumidityPct}% RH`,
          },
          chapter2_electricalRatings: {
            continuousKva: formData.alternatorKva,
            voltage: formData.mainAcVoltage,
            frequencyHz: formData.systemFrequencyHz,
            powerFactor: 0.8,
            speedRpm: formData.systemFrequencyHz === 60 ? 1800 : 1500,
            connectionType: 'Star (3P3W)',
          },
          chapter3_excitationAvr: {
            avrType: formData.avrModel,
            pmgFitted: true,
            voltageRegulationPct: formData.voltageRegulationPct,
            quadratureDroop: true,
          },
          chapter4_thermalInsulation: {
            insulationClass: 'Class H Vacuum Pressure Impregnated',
            tempRiseClass: 'Class F (90K limit)',
            rtdWindingCount: 6,
            bearingRtdCount: 2,
            spaceHeaterWatts: 300,
            spaceHeaterVolts: 230,
          },
          chapter5_mechanicalCoupling: {
            enclosureIp: 'IP23',
            mountingType: 'IM B34',
            housingSize: formData.housingFlywheelCombo.split('/')[0].trim(),
            flywheelSize: formData.housingFlywheelCombo.split('/')[1]?.trim() || '18',
            bearingType: 'Regreasable Deep Groove',
          },
          chapter6_classCertifications: {
            classificationSociety: formData.primaryClass,
            marineCertRequired: true,
            witnessTestRequired: true,
            fatScheduleDate: '2026-12-20',
          },
        },
      },
      {
        id: `sp-${Date.now()}-2`,
        componentType: 'Local Control Panel (LCP)',
        isExistingPart: false,
        partOrGroupNumber: 'DV2.M821.05.0.PR',
        plmStatus: 'Pending',
        taskTitle: 'Release / Revise Structure in PLM & Inform Stakeholders',
        taskStatus: 'Open',
        lastUpdated: new Date().toLocaleDateString(),
        assignedEngineer: formData.projectLeadEngineer,
      },
      {
        id: `sp-${Date.now()}-3`,
        componentType: 'Engine Wiring Harness (EWH)',
        isExistingPart: false,
        partOrGroupNumber: `EWH-${formData.engineSeries.slice(0, 4)}-MAR-01`,
        plmStatus: 'Pending',
        taskTitle: 'Release / Revise Structure in PLM & Inform Stakeholders',
        taskStatus: 'Open',
        lastUpdated: new Date().toLocaleDateString(),
        assignedEngineer: formData.projectLeadEngineer,
      },
      {
        id: `sp-${Date.now()}-4`,
        componentType: 'Alternator Wiring Harness (AWH)',
        isExistingPart: true,
        partOrGroupNumber: 'AWH-STD-4CM-01',
        plmStatus: 'Pending',
        taskTitle: 'Release / Revise Structure in PLM & Inform Stakeholders',
        taskStatus: 'Open',
        lastUpdated: new Date().toLocaleDateString(),
        assignedEngineer: formData.projectLeadEngineer,
      },
      {
        id: `sp-${Date.now()}-5`,
        componentType: 'Electrical Interface Diagram',
        isExistingPart: false,
        partOrGroupNumber: `EID-${formData.yardNumber}-REV-0`,
        plmStatus: 'Pending',
        taskTitle: 'Release / Revise Structure in PLM & Inform Stakeholders',
        taskStatus: 'Open',
        lastUpdated: new Date().toLocaleDateString(),
        assignedEngineer: formData.projectLeadEngineer,
      },
      {
        id: `sp-${Date.now()}-6`,
        componentType: 'Sensors Group',
        isExistingPart: true,
        partOrGroupNumber: 'SENS-GRP-MAR-STD',
        plmStatus: 'Pending',
        taskTitle: 'Release / Revise Structure in PLM & Inform Stakeholders',
        taskStatus: 'Open',
        lastUpdated: new Date().toLocaleDateString(),
        assignedEngineer: formData.projectLeadEngineer,
      },
      {
        id: `sp-${Date.now()}-7`,
        componentType: 'Junction Box',
        isExistingPart: false,
        partOrGroupNumber: 'JBX-MAR-IP54-05',
        plmStatus: 'Pending',
        taskTitle: 'Release / Revise Structure in PLM & Inform Stakeholders',
        taskStatus: 'Open',
        lastUpdated: new Date().toLocaleDateString(),
        assignedEngineer: formData.projectLeadEngineer,
      },
    ];

    const newProject: Project = {
      id: newId,
      projectCode,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progressPercent: 15,
      designInputs: formData,
      subProjects: initialSubProjects,
      ecnIds: [],
    };

    onCreateProject(newProject);
    onClose();
  };

  const sections = [
    { id: 1, title: '1. General & Customer Info', count: '9 Inputs' },
    { id: 2, title: '2. Engine & DG Specs', count: '9 Inputs' },
    { id: 3, title: '3. Marine Class & Environment', count: '9 Inputs' },
    { id: 4, title: '4. Electrical System', count: '9 Inputs' },
    { id: 5, title: '5. Alternator Specs', count: '9 Inputs' },
    { id: 6, title: '6. Panel & Instrumentation', count: '8 Inputs' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-900/80 px-2 py-0.5 rounded font-mono text-xs font-bold">
                53 DESIGN INPUTS FORM
              </span>
              <h2 className="text-base font-bold text-white">Create New Marine Project</h2>
            </div>
            <p className="text-xs text-emerald-100 mt-0.5">
              Structured 6-Chapter capture for industrial marine applications & PLM initialization
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg"
          >
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex overflow-x-auto gap-1 text-xs shrink-0">
          {sections.map(sec => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSection === sec.id
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{sec.title}</span>
              <span className="text-[10px] text-slate-400 font-mono">({sec.count})</span>
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* SECTION 1: General & Customer Info (9 parameters) */}
          {activeSection === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800 border-b pb-2 flex items-center gap-2">
                <i className="fa-solid fa-folder-open text-emerald-700" />
                <span>Section 1: General & Customer Information (9 Parameters)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">1. Project Title / Description</label>
                  <input
                    type="text"
                    required
                    value={formData.projectName}
                    onChange={e => setFormData({ ...formData, projectName: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">2. Customer Name</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">3. Yard Number / Hull ID</label>
                  <input
                    type="text"
                    required
                    value={formData.yardNumber}
                    onChange={e => setFormData({ ...formData, yardNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">4. End Customer / Operator</label>
                  <input
                    type="text"
                    value={formData.endCustomer}
                    onChange={e => setFormData({ ...formData, endCustomer: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">5. TNC Reference Number</label>
                  <input
                    type="text"
                    value={formData.tncRefNo}
                    onChange={e => setFormData({ ...formData, tncRefNo: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">6. TNC Date</label>
                  <input
                    type="date"
                    value={formData.tncDate}
                    onChange={e => setFormData({ ...formData, tncDate: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">7. Contract Delivery Date</label>
                  <input
                    type="date"
                    value={formData.contractDeliveryDate}
                    onChange={e => setFormData({ ...formData, contractDeliveryDate: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">8. Project Lead Engineer</label>
                  <input
                    type="text"
                    value={formData.projectLeadEngineer}
                    onChange={e => setFormData({ ...formData, projectLeadEngineer: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div className="col-span-1 md:col-span-3">
                  <label className="block font-semibold text-slate-700 mb-1">9. General Engineering Remarks</label>
                  <textarea
                    rows={2}
                    value={formData.generalRemarks}
                    onChange={e => setFormData({ ...formData, generalRemarks: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: Engine & DG Set Specs (9 parameters) */}
          {activeSection === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800 border-b pb-2 flex items-center gap-2">
                <i className="fa-solid fa-gears text-emerald-700" />
                <span>Section 2: Engine & DG Set Specifications (9 Parameters)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">10. DG Rating kVA</label>
                  <input
                    type="number"
                    value={formData.dgRatingKva}
                    onChange={e => setFormData({ ...formData, dgRatingKva: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">11. DG Rating kWe</label>
                  <input
                    type="number"
                    value={formData.dgRatingKwe}
                    onChange={e => setFormData({ ...formData, dgRatingKwe: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">12. Type of DG</label>
                  <select
                    value={formData.typeOfDg}
                    onChange={e => setFormData({ ...formData, typeOfDg: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  >
                    <option value="Auxiliary Genset">Auxiliary Genset</option>
                    <option value="Emergency Genset">Emergency Genset</option>
                    <option value="Harbour Genset">Harbour Genset</option>
                    <option value="Diesel Electric Propulsion">Diesel Electric Propulsion</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">13. Engine Series</label>
                  <select
                    value={formData.engineSeries}
                    onChange={e => setFormData({ ...formData, engineSeries: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  >
                    <option value="DV8 Marine">DV8 Marine</option>
                    <option value="DV12 Marine">DV12 Marine</option>
                    <option value="4K1080 Marine">4K1080 Marine</option>
                    <option value="6SL9088 Marine">6SL9088 Marine</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">14. Engine Model</label>
                  <input
                    type="text"
                    value={formData.engineModel}
                    onChange={e => setFormData({ ...formData, engineModel: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">15. Emission Norms</label>
                  <select
                    value={formData.emissionNorms}
                    onChange={e => setFormData({ ...formData, emissionNorms: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  >
                    <option value="IMO Tier II">IMO Tier II</option>
                    <option value="IMO Tier III">IMO Tier III</option>
                    <option value="CPCB-IV+ Marine">CPCB-IV+ Marine</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">16. Duty Cycle</label>
                  <select
                    value={formData.dutyCycle}
                    onChange={e => setFormData({ ...formData, dutyCycle: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  >
                    <option value="Continuous Marine Duty (PRP)">Continuous Marine Duty (PRP)</option>
                    <option value="Continuous Marine Duty (COP)">Continuous Marine Duty (COP)</option>
                    <option value="Emergency Standby (ESP)">Emergency Standby (ESP)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">17. Start Type</label>
                  <select
                    value={formData.startType}
                    onChange={e => setFormData({ ...formData, startType: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  >
                    <option value="Electric 24V DC">Electric 24V DC</option>
                    <option value="Pneumatic Air Starter">Pneumatic Air Starter</option>
                    <option value="Dual: Electric 24V DC + Pneumatic">Dual: Electric 24V DC + Pneumatic</option>
                    <option value="Dual: Electric 24V DC + Hydraulic">Dual: Electric 24V DC + Hydraulic</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">18. Governing Standard</label>
                  <input
                    type="text"
                    value={formData.governingStandard}
                    onChange={e => setFormData({ ...formData, governingStandard: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: Marine Class & Environment (9 parameters) */}
          {activeSection === 3 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800 border-b pb-2 flex items-center gap-2">
                <i className="fa-solid fa-water text-emerald-700" />
                <span>Section 3: Marine Classification & Environmental Limits (9 Parameters)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">19. Primary Class Society</label>
                  <select
                    value={formData.primaryClass}
                    onChange={e => setFormData({ ...formData, primaryClass: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs font-bold"
                  >
                    <option value="IRS">IRS (Indian Register of Shipping)</option>
                    <option value="LRS">LRS (Lloyd's Register)</option>
                    <option value="ABS">ABS (American Bureau of Shipping)</option>
                    <option value="DNV">DNV (Det Norske Veritas)</option>
                    <option value="NKK">NKK (ClassNK)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">20. Dual Class Society</label>
                  <select
                    value={formData.dualClass}
                    onChange={e => setFormData({ ...formData, dualClass: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  >
                    <option value="None">None</option>
                    <option value="IRS">IRS</option>
                    <option value="ABS">ABS</option>
                    <option value="LRS">LRS</option>
                    <option value="DNV">DNV</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">21. Ambient Air Temp (°C)</label>
                  <input
                    type="number"
                    value={formData.ambientAirTempC}
                    onChange={e => setFormData({ ...formData, ambientAirTempC: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">22. Engine Room Temp (°C)</label>
                  <input
                    type="number"
                    value={formData.engineRoomTempC}
                    onChange={e => setFormData({ ...formData, engineRoomTempC: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">23. Sea Water Cooling Temp (°C)</label>
                  <input
                    type="number"
                    value={formData.seaWaterCoolingTempC}
                    onChange={e => setFormData({ ...formData, seaWaterCoolingTempC: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">24. Relative Humidity (%)</label>
                  <input
                    type="number"
                    value={formData.relativeHumidityPct}
                    onChange={e => setFormData({ ...formData, relativeHumidityPct: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">25. Motion Limits: Roll (°)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.motionRollDeg}
                    onChange={e => setFormData({ ...formData, motionRollDeg: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">26. Motion Limits: Pitch (°)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.motionPitchDeg}
                    onChange={e => setFormData({ ...formData, motionPitchDeg: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">27. Dynamic Inclination (°)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.inclinationDynamicDeg}
                    onChange={e => setFormData({ ...formData, inclinationDynamicDeg: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: Electrical System (9 parameters) */}
          {activeSection === 4 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800 border-b pb-2 flex items-center gap-2">
                <i className="fa-solid fa-plug-circle-bolt text-emerald-700" />
                <span>Section 4: Electrical System Architecture (9 Parameters)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">28. Main AC Voltage (V)</label>
                  <input
                    type="number"
                    value={formData.mainAcVoltage}
                    onChange={e => setFormData({ ...formData, mainAcVoltage: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">29. Control Supply Voltage</label>
                  <input
                    type="text"
                    value={formData.controlSupplyVoltage}
                    onChange={e => setFormData({ ...formData, controlSupplyVoltage: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">30. System Frequency (Hz)</label>
                  <select
                    value={formData.systemFrequencyHz}
                    onChange={e => setFormData({ ...formData, systemFrequencyHz: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  >
                    <option value={50}>50 Hz</option>
                    <option value={60}>60 Hz</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">31. System Phase & Wire</label>
                  <select
                    value={formData.systemPhaseWire}
                    onChange={e => setFormData({ ...formData, systemPhaseWire: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  >
                    <option value="3 Phase 3 Wire Insulated Neutral">3 Phase 3 Wire Insulated Neutral</option>
                    <option value="3 Phase 4 Wire Solidly Earthed">3 Phase 4 Wire Solidly Earthed</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">32. Voltage Regulation (+/- %)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.voltageRegulationPct}
                    onChange={e => setFormData({ ...formData, voltageRegulationPct: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">33. Frequency Regulation (+/- %)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.frequencyRegulationPct}
                    onChange={e => setFormData({ ...formData, frequencyRegulationPct: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">34. Neutral Earthing System</label>
                  <input
                    type="text"
                    value={formData.neutralEarthingSystem}
                    onChange={e => setFormData({ ...formData, neutralEarthingSystem: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">35. Short-Circuit Withstand (kA)</label>
                  <input
                    type="number"
                    value={formData.shortCircuitWithstandCurrentKa}
                    onChange={e => setFormData({ ...formData, shortCircuitWithstandCurrentKa: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">36. THD Total Harmonic Dist (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.totalHarmonicDistortionThdPct}
                    onChange={e => setFormData({ ...formData, totalHarmonicDistortionThdPct: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: Alternator Specs (9 parameters) */}
          {activeSection === 5 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800 border-b pb-2 flex items-center gap-2">
                <i className="fa-solid fa-bolt text-emerald-700" />
                <span>Section 5: Alternator Specifications (9 Parameters)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">37. Alternator Make</label>
                  <input
                    type="text"
                    value={formData.alternatorMake}
                    onChange={e => setFormData({ ...formData, alternatorMake: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">38. Alternator Model</label>
                  <input
                    type="text"
                    value={formData.alternatorModel}
                    onChange={e => setFormData({ ...formData, alternatorModel: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">39. Alternator Rating kVA</label>
                  <input
                    type="number"
                    value={formData.alternatorKva}
                    onChange={e => setFormData({ ...formData, alternatorKva: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">40. Voltage / RPM Combination</label>
                  <input
                    type="text"
                    value={formData.voltageRpmCombo}
                    onChange={e => setFormData({ ...formData, voltageRpmCombo: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">41. AVR Make & Model</label>
                  <input
                    type="text"
                    value={formData.avrModel}
                    onChange={e => setFormData({ ...formData, avrModel: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">42. Space Heater Supply</label>
                  <input
                    type="text"
                    value={formData.spaceHeaterSupply}
                    onChange={e => setFormData({ ...formData, spaceHeaterSupply: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">43. RTD Sensors Configuration</label>
                  <input
                    type="text"
                    value={formData.rtdSensorsConfiguration}
                    onChange={e => setFormData({ ...formData, rtdSensorsConfiguration: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">44. Coupling Type</label>
                  <input
                    type="text"
                    value={formData.couplingType}
                    onChange={e => setFormData({ ...formData, couplingType: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">45. SAE Housing / Flywheel Combo</label>
                  <input
                    type="text"
                    value={formData.housingFlywheelCombo}
                    onChange={e => setFormData({ ...formData, housingFlywheelCombo: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: Panel & Instrumentation (8 parameters) */}
          {activeSection === 6 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800 border-b pb-2 flex items-center gap-2">
                <i className="fa-solid fa-table-cells text-emerald-700" />
                <span>Section 6: Panel & Control Instrumentation (8 Parameters)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">46. Panel Mount Type</label>
                  <select
                    value={formData.panelMountingType}
                    onChange={e => setFormData({ ...formData, panelMountingType: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  >
                    <option value="Off-Engine Bulkhead Mounted">Off-Engine Bulkhead Mounted</option>
                    <option value="Off-Engine Free Standing">Off-Engine Free Standing</option>
                    <option value="Engine Mounted Anti-Vibration">Engine Mounted Anti-Vibration</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">47. Panel IP Rating</label>
                  <select
                    value={formData.panelIpRating}
                    onChange={e => setFormData({ ...formData, panelIpRating: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs font-semibold"
                  >
                    <option value="IP44">IP44 Marine Standard</option>
                    <option value="IP54">IP54 Marine Dust & Splash</option>
                    <option value="IP23">IP23 Screen Protected</option>
                    <option value="IP55">IP55 Water Jet Resistant</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">48. Enclosure Material & Gauge</label>
                  <input
                    type="text"
                    value={formData.enclosureMaterialGauge}
                    onChange={e => setFormData({ ...formData, enclosureMaterialGauge: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">49. Controller Type</label>
                  <select
                    value={formData.controllerType}
                    onChange={e => setFormData({ ...formData, controllerType: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  >
                    <option value="DeepSea DSE8610 MKII Marine Auto-Synchronizing">DeepSea DSE8610 MKII Marine</option>
                    <option value="ComAp InteliDrive Marine">ComAp InteliDrive Marine</option>
                    <option value="Deif AGC-4 Marine Core Controller">Deif AGC-4 Marine Core Controller</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">50. Ship Interfaces</label>
                  <input
                    type="text"
                    value={formData.shipAutomationInterface}
                    onChange={e => setFormData({ ...formData, shipAutomationInterface: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">51. Alarm Annunciation</label>
                  <input
                    type="text"
                    value={formData.alarmAnnunciationProtocol}
                    onChange={e => setFormData({ ...formData, alarmAnnunciationProtocol: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">52. Emergency Stop Circuit</label>
                  <input
                    type="text"
                    value={formData.emergencyStopCircuit}
                    onChange={e => setFormData({ ...formData, emergencyStopCircuit: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">53. Safety Instrumentation Standard</label>
                  <input
                    type="text"
                    value={formData.safetyInstrumentationStandard}
                    onChange={e => setFormData({ ...formData, safetyInstrumentationStandard: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer inside scroll / sticky */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeSection > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveSection(prev => prev - 1)}
                  className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  ← Previous Section
                </button>
              )}
              {activeSection < 6 && (
                <button
                  type="button"
                  onClick={() => setActiveSection(prev => prev + 1)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
                >
                  Next Section →
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2"
              >
                <i className="fa-solid fa-check" />
                <span>Save Project & Initialize PLM</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
