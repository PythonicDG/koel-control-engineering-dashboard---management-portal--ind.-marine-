import React, { useState } from 'react';
import {
  Project,
  DesignInputs53,
  SubProject,
  User,
  FormFieldConfig,
  SubProjectComponentType,
  AlternatorCatalogItem,
  AlternatorWorkflowStatus,
  WorkflowTaskItem,
  SOTRData,
} from '../types/index.ts';
import { AlternatorSelectionFlow } from './AlternatorSelectionFlow.tsx';
import { SubProjectTreeView } from './SubProjectTreeView.tsx';
import { MatchingAlternatorOption } from '../utils/alternatorWorkflow.ts';

interface CreateProjectViewProps {
  onBack: () => void;
  onCreateProject: (project: Project) => void;
  nextProjectIndex: number;
  users: User[];
  formFields: FormFieldConfig[];
  currentUser?: User | null;
  onOpenFormSettings?: () => void;
  catalog?: AlternatorCatalogItem[];
  existingProjects?: Project[];
}

export const CreateProjectView: React.FC<CreateProjectViewProps> = ({
  onBack,
  onCreateProject,
  nextProjectIndex,
  users,
  formFields,
  currentUser,
  onOpenFormSettings,
  catalog = [],
  existingProjects = [],
}) => {
  const [activeSection, setActiveSection] = useState<number>(1);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  // On-demand sub-projects state (no forced predefined list!)
  const [selectedSubProjects, setSelectedSubProjects] = useState<SubProject[]>([]);
  const [componentToAdd, setComponentToAdd] = useState<SubProjectComponentType | ''>('');
  const [engineerToAdd, setEngineerToAdd] = useState<string>(users[0]?.fullName || 'Rajesh Kulkarni');
  const [partNumberToAdd, setPartNumberToAdd] = useState<string>('');
  const [isExistingToAdd, setIsExistingToAdd] = useState<boolean>(false);
  const [existingPartNumberToAdd, setExistingPartNumberToAdd] = useState<string>('');
  const [attachedDrawingFileNameToAdd, setAttachedDrawingFileNameToAdd] = useState<string>('');
  const [isAlternatorFlowOpen, setIsAlternatorFlowOpen] = useState<boolean>(false);

  // Helper to check if a field is mandatory based on Admin config
  const isFieldMandatory = (fieldKey: string, defaultMandatory: boolean = false): boolean => {
    const config = formFields.find(f => f.formId === 'project' && f.fieldKey === fieldKey);
    return config ? config.isMandatory : defaultMandatory;
  };

  // Get custom fields configured for project form
  const projectCustomFields = formFields.filter(f => f.formId === 'project' && f.isCustom);

  const defaultInputs: DesignInputs53 = {
    // 1. General & Customer Info
    projectName: 'Naval Offshore Patrol Vessel 500 kVA Aux DG',
    customerName: 'Goa Shipyard Limited (GSL)',
    yardNumber: 'GSL-YD-1280',
    endCustomer: 'Indian Navy',
    tncRefNo: 'TNC/GSL/2026/NAV-092',
    tncDate: new Date().toISOString().split('T')[0],
    contractDeliveryDate: '2027-04-30',
    projectLeadEngineer: users[0]?.fullName || 'Rajesh Kulkarni',
    generalRemarks: 'Dual class IRS/ABS certified emergency/auxiliary package with shock mounting.',

    // 2. Engine & DG Set Specs
    dgRatingKwe: 400,
    dgRatingKva: 500,
    typeOfDg: 'Auxiliary Genset',
    engineSeries: 'DV12 Marine',
    engineModel: 'DV12-M Marine Turbocharged Intercooled',
    emissionNorms: 'IMO Tier II',
    dutyCycle: 'Continuous Marine Duty (PRP)',
    startType: 'Dual: Electric 24V DC + Pneumatic',
    governingStandard: 'ISO 8528 Class G3 / IRS Part 4',

    // 3. Marine Class & Environment
    primaryClass: 'IRS',
    dualClass: 'ABS',
    ambientAirTempC: 45,
    engineRoomTempC: 50,
    seaWaterCoolingTempC: 32,
    relativeHumidityPct: 95,
    motionRollDeg: 22.5,
    motionPitchDeg: 10,
    inclinationDynamicDeg: 22.5,

    // 4. Electrical System
    mainAcVoltage: 415,
    controlSupplyVoltage: '24V DC Isolated Marine Grade',
    systemFrequencyHz: 50,
    systemPhaseWire: '3 Phase 3 Wire Insulated Neutral',
    voltageRegulationPct: 0.5,
    frequencyRegulationPct: 1.0,
    neutralEarthingSystem: 'Insulated Neutral with Continuous Insulation Monitor',
    shortCircuitWithstandCurrentKa: 40,
    totalHarmonicDistortionThdPct: 3.0,

    // 5. Alternator Specs
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

    // 6. Panel & Instrumentation
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

  const handleAddSubProject = (compType?: SubProjectComponentType) => {
    const type = compType || (componentToAdd as SubProjectComponentType);
    if (!type) {
      alert('Please choose a component from the dropdown first.');
      return;
    }
    if (type === 'Alternator') {
      setIsAlternatorFlowOpen(true);
      return;
    }

    const existing = selectedSubProjects.find(sp => sp.componentType === type);
    if (existing) {
      alert(`${type} is already added in project scope.`);
      return;
    }

    const finalPartNumber = isExistingToAdd
      ? (existingPartNumberToAdd.trim() || partNumberToAdd.trim() || `${type.replace(/[^A-Za-z0-9]/g, '-').toUpperCase()}-EX`)
      : (partNumberToAdd.trim() || `${type.replace(/[^A-Za-z0-9]/g, '-').toUpperCase()}-PENDING`);

    const newId = `sp-${Date.now()}-${selectedSubProjects.length + 1}`;
    const newSp: SubProject = {
      id: newId,
      componentType: type,
      isExistingPart: isExistingToAdd,
      partOrGroupNumber: finalPartNumber,
      existingPartNumber: isExistingToAdd ? (existingPartNumberToAdd.trim() || finalPartNumber) : undefined,
      attachedDrawingFileName: isExistingToAdd && attachedDrawingFileNameToAdd.trim() ? attachedDrawingFileNameToAdd.trim() : undefined,
      plmStatus: 'Pending',
      taskTitle: `Release / Revise Structure in PLM & Inform Stakeholders`,
      taskStatus: 'Open',
      lastUpdated: new Date().toLocaleDateString(),
      assignedEngineer: engineerToAdd || formData.projectLeadEngineer,
    };

    setSelectedSubProjects(prev => [...prev, newSp]);
    setPartNumberToAdd('');
    setExistingPartNumberToAdd('');
    setAttachedDrawingFileNameToAdd('');
    setIsExistingToAdd(false);
  };

  const handleAlternatorSelectExisting = (data: {
    subProject: SubProject;
    selectedOption: MatchingAlternatorOption;
    status: AlternatorWorkflowStatus;
    customStatusText: string;
    tasks: WorkflowTaskItem[];
  }) => {
    setSelectedSubProjects(prev => [
      ...prev.filter(sp => sp.componentType !== 'Alternator'),
      data.subProject,
    ]);

    // Copy specs from selected existing alternator into formData
    setFormData(prev => ({
      ...prev,
      alternatorModel: data.selectedOption.model,
      alternatorMake: 'KOEL Marine',
      alternatorKva: data.selectedOption.ratingKva,
      mainAcVoltage: data.selectedOption.voltageV,
      systemFrequencyHz: data.selectedOption.frequencyHz,
      housingFlywheelCombo: data.selectedOption.frameSize || prev.housingFlywheelCombo,
      avrModel: data.selectedOption.avrModel || prev.avrModel,
    }));

    setIsAlternatorFlowOpen(false);
  };

  const handleAlternatorSaveNew = (data: {
    subProject: SubProject;
    sotr: SOTRData;
    status: AlternatorWorkflowStatus;
    customStatusText: string;
    tasks: WorkflowTaskItem[];
  }) => {
    setSelectedSubProjects(prev => [
      ...prev.filter(sp => sp.componentType !== 'Alternator'),
      data.subProject,
    ]);

    // Update formData from SOTR specs
    setFormData(prev => ({
      ...prev,
      alternatorKva: data.sotr.chapter2_electricalRatings.continuousKva,
      mainAcVoltage: data.sotr.chapter2_electricalRatings.voltage,
      systemFrequencyHz: data.sotr.chapter2_electricalRatings.frequencyHz,
      avrModel: data.sotr.chapter3_excitationAvr.avrType,
      voltageRegulationPct: data.sotr.chapter3_excitationAvr.voltageRegulationPct,
      primaryClass: data.sotr.chapter6_classCertifications.classificationSociety || prev.primaryClass,
    }));

    setIsAlternatorFlowOpen(false);
  };

  const handleToggleSubProjectTask = (subProjectId: string, taskId: string) => {
    setSelectedSubProjects(prev =>
      prev.map(sp => {
        if (sp.id === subProjectId && sp.actionTasks) {
          const updated = sp.actionTasks.map(t =>
            t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
          );
          return { ...sp, actionTasks: updated };
        }
        return sp;
      })
    );
  };

  const handleRemoveSubProject = (id: string) => {
    setSelectedSubProjects(prev => prev.filter(sp => sp.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const projectCode = `KOEL-MAR-2026-${String(nextProjectIndex).padStart(3, '0')}`;
    const newId = `proj-${Date.now()}`;

    // ONLY include the sub-projects that the user specifically selected and added!
    const newProject: Project = {
      id: newId,
      projectCode,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progressPercent: 0,
      designInputs: formData,
      subProjects: selectedSubProjects,
      ecnIds: [],
    };

    onCreateProject(newProject);
  };

  const sections = [
    { id: 1, title: '1. General & Customer Info', icon: 'fa-ship' },
    { id: 2, title: '2. Engine & DG Specs', icon: 'fa-gears' },
    { id: 3, title: '3. Marine Class & Environment', icon: 'fa-anchor' },
    { id: 4, title: '4. Electrical System', icon: 'fa-bolt' },
    { id: 5, title: '5. Alternator Specs', icon: 'fa-fan' },
    { id: 6, title: '6. Panel & Instrumentation', icon: 'fa-microchip' },
    { id: 7, title: `7. Sub-Projects (${selectedSubProjects.length})`, icon: 'fa-layer-group' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Banner (In-Window, Non-Popup) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200 shrink-0"
            title="Back to Project Master"
          >
            <i className="fa-solid fa-arrow-left text-sm" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                KOEL-MAR-2026-{String(nextProjectIndex).padStart(3, '0')}
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Create New Marine Project
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Complete Structured Marine Engineering Specification & Universal PLM Sub-Project Workflow
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {currentUser?.role === 'admin' && (
            <button
              type="button"
              onClick={onOpenFormSettings}
              className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Form Settings & Mandatory Field Configuration (Admin only)"
            >
              <i className="fa-solid fa-sliders text-purple-700 text-xs" />
              <span>Form Settings</span>
            </button>
          )}
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-check text-xs" />
            <span>Create & Initialize Project</span>
          </button>
        </div>
      </div>

      {/* Chapter Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex overflow-x-auto gap-1 text-xs">
        {sections.map(sec => (
          <button
            key={sec.id}
            type="button"
            onClick={() => setActiveSection(sec.id)}
            className={`px-4 py-2.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              activeSection === sec.id
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <i className={`fa-solid ${sec.icon} text-xs`} />
            <span>{sec.title}</span>
          </button>
        ))}
      </div>

      {/* Main Form Body (In-Window Container) */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8 space-y-6 text-xs">
        {/* SECTION 1: General & Customer Info */}
        {activeSection === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <i className="fa-solid fa-ship text-emerald-700" />
                <span>Chapter 1: General & Customer Information</span>
              </h3>
              <span className="text-slate-400 text-xs">Customer, vessel and commercial identity</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="col-span-1 md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1.5">
                  1. Project Title / Description {isFieldMandatory('projectName', true) && <span className="text-rose-600">*</span>}
                </label>
                <input
                  type="text"
                  required={isFieldMandatory('projectName', true)}
                  value={formData.projectName}
                  onChange={e => setFormData({ ...formData, projectName: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  2. Customer Name {isFieldMandatory('customerName', true) && <span className="text-rose-600">*</span>}
                </label>
                <input
                  type="text"
                  required={isFieldMandatory('customerName', true)}
                  value={formData.customerName}
                  onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  3. Yard / Hull Number {isFieldMandatory('yardNumber', true) && <span className="text-rose-600">*</span>}
                </label>
                <input
                  type="text"
                  required={isFieldMandatory('yardNumber', true)}
                  value={formData.yardNumber}
                  onChange={e => setFormData({ ...formData, yardNumber: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  4. End Customer / Navy / Fleet Owner {isFieldMandatory('endCustomer', false) && <span className="text-rose-600">*</span>}
                </label>
                <input
                  type="text"
                  value={formData.endCustomer}
                  onChange={e => setFormData({ ...formData, endCustomer: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  5. TNC Reference Number {isFieldMandatory('tncRefNo', false) && <span className="text-rose-600">*</span>}
                </label>
                <input
                  type="text"
                  value={formData.tncRefNo}
                  onChange={e => setFormData({ ...formData, tncRefNo: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  6. TNC Date {isFieldMandatory('tncDate', false) && <span className="text-rose-600">*</span>}
                </label>
                <input
                  type="date"
                  value={formData.tncDate}
                  onChange={e => setFormData({ ...formData, tncDate: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  7. Contract Delivery Date {isFieldMandatory('contractDeliveryDate', true) && <span className="text-rose-600">*</span>}
                </label>
                <input
                  type="date"
                  required={isFieldMandatory('contractDeliveryDate', true)}
                  value={formData.contractDeliveryDate}
                  onChange={e => setFormData({ ...formData, contractDeliveryDate: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              {/* DYNAMIC USER DROPDOWN for Project Lead Engineer */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  8. Project Lead Engineer (Assigned) {isFieldMandatory('projectLeadEngineer', true) && <span className="text-rose-600">*</span>}
                </label>
                <select
                  required={isFieldMandatory('projectLeadEngineer', true)}
                  value={formData.projectLeadEngineer}
                  onChange={e => setFormData({ ...formData, projectLeadEngineer: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.fullName}>
                      {u.fullName} ({u.role.toUpperCase()} - {u.department})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Dynamically loaded from registered system users
                </span>
              </div>

              <div className="col-span-1 md:col-span-2 lg:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1.5">
                  9. General Technical Remarks & Contract Scope
                </label>
                <textarea
                  rows={3}
                  value={formData.generalRemarks}
                  onChange={e => setFormData({ ...formData, generalRemarks: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: Engine & DG Specs */}
        {activeSection === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <i className="fa-solid fa-gears text-emerald-700" />
                <span>Chapter 2: Engine & Marine DG Specifications</span>
              </h3>
              <span className="text-slate-400 text-xs">Rating, propulsion/auxiliary duty and emission ratings</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  10. DG Electrical Rating (kWe) {isFieldMandatory('dgRatingKwe', true) && <span className="text-rose-600">*</span>}
                </label>
                <input
                  type="number"
                  required={isFieldMandatory('dgRatingKwe', true)}
                  value={formData.dgRatingKwe}
                  onChange={e => setFormData({ ...formData, dgRatingKwe: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  11. DG Apparent Power (kVA) {isFieldMandatory('dgRatingKva', true) && <span className="text-rose-600">*</span>}
                </label>
                <input
                  type="number"
                  required={isFieldMandatory('dgRatingKva', true)}
                  value={formData.dgRatingKva}
                  onChange={e => setFormData({ ...formData, dgRatingKva: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  12. Type of Marine DG {isFieldMandatory('typeOfDg', true) && <span className="text-rose-600">*</span>}
                </label>
                <select
                  value={formData.typeOfDg}
                  onChange={e => setFormData({ ...formData, typeOfDg: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                >
                  <option value="Auxiliary Genset">Auxiliary Genset</option>
                  <option value="Emergency Genset">Emergency Genset</option>
                  <option value="Harbour Genset">Harbour Genset</option>
                  <option value="Diesel Electric Propulsion">Diesel Electric Propulsion</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  13. Engine Series {isFieldMandatory('engineSeries', true) && <span className="text-rose-600">*</span>}
                </label>
                <select
                  value={formData.engineSeries}
                  onChange={e => setFormData({ ...formData, engineSeries: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                >
                  <option value="DV8 Marine">DV8 Marine</option>
                  <option value="DV12 Marine">DV12 Marine</option>
                  <option value="4K1080 Marine">4K1080 Marine</option>
                  <option value="6SL9088 Marine">6SL9088 Marine</option>
                  <option value="DV16 Marine">DV16 Marine</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  14. Engine Model / Variant {isFieldMandatory('engineModel', true) && <span className="text-rose-600">*</span>}
                </label>
                <input
                  type="text"
                  required={isFieldMandatory('engineModel', true)}
                  value={formData.engineModel}
                  onChange={e => setFormData({ ...formData, engineModel: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  15. Emission Norms Compliance {isFieldMandatory('emissionNorms', true) && <span className="text-rose-600">*</span>}
                </label>
                <select
                  value={formData.emissionNorms}
                  onChange={e => setFormData({ ...formData, emissionNorms: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                >
                  <option value="IMO Tier II">IMO Tier II (MARPOL Annex VI)</option>
                  <option value="IMO Tier III">IMO Tier III (with SCR / EGR)</option>
                  <option value="CPCB-IV+">CPCB-IV+ (Inland Waterways)</option>
                  <option value="Non-Regulated Inland">Non-Regulated Inland</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  16. Duty Cycle Rating
                </label>
                <select
                  value={formData.dutyCycle}
                  onChange={e => setFormData({ ...formData, dutyCycle: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                >
                  <option value="Continuous Marine Duty (PRP)">Continuous Marine Duty (PRP)</option>
                  <option value="Standby Marine Duty (ESP)">Standby Marine Duty (ESP)</option>
                  <option value="Unrestricted Continuous (COP)">Unrestricted Continuous (COP)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  17. Starting System Architecture
                </label>
                <select
                  value={formData.startType}
                  onChange={e => setFormData({ ...formData, startType: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                >
                  <option value="Dual: Electric 24V DC + Pneumatic">Dual: Electric 24V DC + Pneumatic</option>
                  <option value="Electric 24V DC Isolated">Electric 24V DC Isolated</option>
                  <option value="Pneumatic Air Motor Direct">Pneumatic Air Motor Direct</option>
                  <option value="Dual Electric (Primary + Secondary)">Dual Electric (Primary + Secondary)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  18. Governing Standard & Class
                </label>
                <select
                  value={formData.governingStandard}
                  onChange={e => setFormData({ ...formData, governingStandard: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                >
                  <option value="ISO 8528 Class G3 / IRS Part 4">ISO 8528 Class G3 / IRS Part 4</option>
                  <option value="ISO 8528 Class G2">ISO 8528 Class G2</option>
                  <option value="ISO 3046 Marine Governor Rules">ISO 3046 Marine Governor Rules</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: Marine Class & Environment */}
        {activeSection === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <i className="fa-solid fa-anchor text-emerald-700" />
                <span>Chapter 3: Marine Classification & Environmental Limits</span>
              </h3>
              <span className="text-slate-400 text-xs">IRS, ABS, LRS, DNV requirements and tilt/roll angles</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  19. Primary Marine Classification Society {isFieldMandatory('primaryClass', true) && <span className="text-rose-600">*</span>}
                </label>
                <select
                  value={formData.primaryClass}
                  onChange={e => setFormData({ ...formData, primaryClass: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                >
                  <option value="IRS">IRS (Indian Register of Shipping)</option>
                  <option value="LRS">LRS (Lloyd's Register)</option>
                  <option value="ABS">ABS (American Bureau of Shipping)</option>
                  <option value="DNV">DNV (Det Norske Veritas)</option>
                  <option value="NKK">NKK (ClassNK)</option>
                  <option value="BV">BV (Bureau Veritas)</option>
                  <option value="RINA">RINA</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  20. Dual / Secondary Marine Class
                </label>
                <select
                  value={formData.dualClass}
                  onChange={e => setFormData({ ...formData, dualClass: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                >
                  <option value="None">None (Single Class)</option>
                  <option value="ABS">ABS (American Bureau of Shipping)</option>
                  <option value="IRS">IRS (Indian Register of Shipping)</option>
                  <option value="LRS">LRS (Lloyd's Register)</option>
                  <option value="DNV">DNV (Det Norske Veritas)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  21. Design Ambient Air Temperature (°C)
                </label>
                <input
                  type="number"
                  value={formData.ambientAirTempC}
                  onChange={e => setFormData({ ...formData, ambientAirTempC: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  22. Max Engine Room Temperature (°C)
                </label>
                <input
                  type="number"
                  value={formData.engineRoomTempC}
                  onChange={e => setFormData({ ...formData, engineRoomTempC: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  23. Sea Water Cooling Temperature (°C)
                </label>
                <input
                  type="number"
                  value={formData.seaWaterCoolingTempC}
                  onChange={e => setFormData({ ...formData, seaWaterCoolingTempC: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  24. Design Relative Humidity (% RH)
                </label>
                <input
                  type="number"
                  value={formData.relativeHumidityPct}
                  onChange={e => setFormData({ ...formData, relativeHumidityPct: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  25. Dynamic Rolling Motion Angle (°)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.motionRollDeg}
                  onChange={e => setFormData({ ...formData, motionRollDeg: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  26. Dynamic Pitching Motion Angle (°)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.motionPitchDeg}
                  onChange={e => setFormData({ ...formData, motionPitchDeg: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  27. Combined Dynamic Inclination (°)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.inclinationDynamicDeg}
                  onChange={e => setFormData({ ...formData, inclinationDynamicDeg: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: Electrical System */}
        {activeSection === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <i className="fa-solid fa-bolt text-emerald-700" />
                <span>Chapter 4: Electrical Distribution & Earthing System</span>
              </h3>
              <span className="text-slate-400 text-xs">Voltage, frequency, insulation monitoring and harmonic thresholds</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  28. Main AC Generation Voltage (V) {isFieldMandatory('mainAcVoltage', true) && <span className="text-rose-600">*</span>}
                </label>
                <input
                  type="number"
                  required={isFieldMandatory('mainAcVoltage', true)}
                  value={formData.mainAcVoltage}
                  onChange={e => setFormData({ ...formData, mainAcVoltage: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  29. Control Supply Auxiliary Voltage
                </label>
                <input
                  type="text"
                  value={formData.controlSupplyVoltage}
                  onChange={e => setFormData({ ...formData, controlSupplyVoltage: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  30. System Frequency (Hz) {isFieldMandatory('systemFrequencyHz', true) && <span className="text-rose-600">*</span>}
                </label>
                <select
                  value={formData.systemFrequencyHz}
                  onChange={e => setFormData({ ...formData, systemFrequencyHz: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                >
                  <option value={50}>50 Hz (1500 RPM Synchronous)</option>
                  <option value={60}>60 Hz (1800 RPM Synchronous)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  31. System Phase & Wire Configuration
                </label>
                <select
                  value={formData.systemPhaseWire}
                  onChange={e => setFormData({ ...formData, systemPhaseWire: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                >
                  <option value="3 Phase 3 Wire Insulated Neutral">3 Phase 3 Wire Insulated Neutral (Marine Standard)</option>
                  <option value="3 Phase 4 Wire Solidly Earthed">3 Phase 4 Wire Solidly Earthed Neutral</option>
                  <option value="3 Phase 3 Wire High Resistance Earthed">3 Phase 3 Wire High Resistance Earthed</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  32. Steady State Voltage Regulation (± %)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.voltageRegulationPct}
                  onChange={e => setFormData({ ...formData, voltageRegulationPct: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  33. Frequency Regulation Class (± %)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.frequencyRegulationPct}
                  onChange={e => setFormData({ ...formData, frequencyRegulationPct: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  34. Neutral Earthing & Insulation Protocol
                </label>
                <input
                  type="text"
                  value={formData.neutralEarthingSystem}
                  onChange={e => setFormData({ ...formData, neutralEarthingSystem: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  35. Short Circuit Withstand Capability (kA / 1s)
                </label>
                <input
                  type="number"
                  value={formData.shortCircuitWithstandCurrentKa}
                  onChange={e => setFormData({ ...formData, shortCircuitWithstandCurrentKa: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  36. Total Harmonic Distortion THD (% max)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.totalHarmonicDistortionThdPct}
                  onChange={e => setFormData({ ...formData, totalHarmonicDistortionThdPct: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: Alternator Specs */}
        {activeSection === 5 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <i className="fa-solid fa-fan text-emerald-700" />
                  <span>Chapter 5: Alternator Engineering & SOTR Parameters</span>
                </h3>
                <span className="text-slate-400 text-xs">Close-coupling, PMG excitation, RTD sensors and heaters</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveSection(7);
                  setIsAlternatorFlowOpen(true);
                }}
                className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <i className="fa-solid fa-sparkles text-amber-300 text-xs" />
                <span>Smart Alternator Match & SOTR Scope (In-Window)</span>
              </button>
            </div>

            {/* Smart Matching Helper Alert */}
            <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <i className="fa-solid fa-database text-emerald-700 text-base mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-emerald-950">
                    Smart Alternator Database & Past Projects Matching Active
                  </div>
                  <div className="text-emerald-800 text-[11px]">
                    Current DG Rating: <strong>{formData.dgRatingKva} kVA · {formData.mainAcVoltage}V</strong>. You can choose an existing matching alternator from previous projects or design a new one with direct SOTR form in Chapter 7.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveSection(7);
                  setIsAlternatorFlowOpen(true);
                }}
                className="px-3 py-1 bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-bold shrink-0 cursor-pointer"
              >
                Match / Configure SOTR
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  37. Alternator Make / Brand
                </label>
                <input
                  type="text"
                  value={formData.alternatorMake}
                  onChange={e => setFormData({ ...formData, alternatorMake: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  38. Alternator Model / Frame
                </label>
                <input
                  type="text"
                  value={formData.alternatorModel}
                  onChange={e => setFormData({ ...formData, alternatorModel: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  39. Alternator Base Rating (kVA)
                </label>
                <input
                  type="number"
                  value={formData.alternatorKva}
                  onChange={e => setFormData({ ...formData, alternatorKva: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  40. Voltage / RPM Combination
                </label>
                <input
                  type="text"
                  value={formData.voltageRpmCombo}
                  onChange={e => setFormData({ ...formData, voltageRpmCombo: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  41. Automatic Voltage Regulator (AVR)
                </label>
                <input
                  type="text"
                  value={formData.avrModel}
                  onChange={e => setFormData({ ...formData, avrModel: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  42. Anti-Condensation Space Heater
                </label>
                <select
                  value={formData.spaceHeaterRequired ? 'true' : 'false'}
                  onChange={e => setFormData({ ...formData, spaceHeaterRequired: e.target.value === 'true' })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                >
                  <option value="true">Required (Fitted with Terminal Box)</option>
                  <option value="false">Not Required</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  43. Space Heater Auxiliary Power Supply
                </label>
                <input
                  type="text"
                  value={formData.spaceHeaterSupply}
                  onChange={e => setFormData({ ...formData, spaceHeaterSupply: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  44. RTD Thermal Sensor Configuration
                </label>
                <input
                  type="text"
                  value={formData.rtdSensorsConfiguration}
                  onChange={e => setFormData({ ...formData, rtdSensorsConfiguration: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  45. Mechanical Coupling & SAE Combo
                </label>
                <input
                  type="text"
                  value={`${formData.couplingType} (${formData.housingFlywheelCombo})`}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData({ ...formData, couplingType: val });
                  }}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6: Panel & Instrumentation */}
        {activeSection === 6 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <i className="fa-solid fa-microchip text-emerald-700" />
                <span>Chapter 6: Control Panel, Automation & Instrumentation</span>
              </h3>
              <span className="text-slate-400 text-xs">Controllers, ship telemetry, alarms and marine emergency circuits</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  46. Local Control Panel Mounting Type
                </label>
                <select
                  value={formData.panelMountingType}
                  onChange={e => setFormData({ ...formData, panelMountingType: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                >
                  <option value="Off-Engine Bulkhead Mounted">Off-Engine Bulkhead Mounted (Recommended)</option>
                  <option value="Engine Mounted with Anti-Vibration Mounts">Engine Mounted with Anti-Vibration Mounts</option>
                  <option value="Free Standing Marine Floor Panel">Free Standing Marine Floor Panel</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  47. Panel Enclosure Ingress Protection (IP)
                </label>
                <select
                  value={formData.panelIpRating}
                  onChange={e => setFormData({ ...formData, panelIpRating: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                >
                  <option value="IP44">IP44 Marine Ingress Protected</option>
                  <option value="IP54">IP54 Dust & Splashing Protected</option>
                  <option value="IP55">IP55 Heavy Spray Protected</option>
                  <option value="IP23">IP23 Standard Louvered</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  48. Panel Material & Gauge
                </label>
                <input
                  type="text"
                  value={formData.enclosureMaterialGauge}
                  onChange={e => setFormData({ ...formData, enclosureMaterialGauge: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  49. Marine Genset Controller Model
                </label>
                <select
                  value={formData.controllerType}
                  onChange={e => setFormData({ ...formData, controllerType: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                >
                  <option value="DeepSea DSE8610 MKII Marine Auto-Synchronizing">DeepSea DSE8610 MKII Marine Auto-Synchronizing</option>
                  <option value="ComAp InteliDrive Marine">ComAp InteliDrive Marine</option>
                  <option value="Deif AGC-4 Marine Core Controller">Deif AGC-4 Marine Core Controller</option>
                  <option value="Woodward easYgen-3200XT Marine">Woodward easYgen-3200XT Marine</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  50. Ship Automation & SCADA Interface
                </label>
                <input
                  type="text"
                  value={formData.shipAutomationInterface}
                  onChange={e => setFormData({ ...formData, shipAutomationInterface: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  51. Alarm Annunciation & Class Shutdown Protocol
                </label>
                <input
                  type="text"
                  value={formData.alarmAnnunciationProtocol}
                  onChange={e => setFormData({ ...formData, alarmAnnunciationProtocol: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  52. Emergency Stop Circuit Architecture
                </label>
                <input
                  type="text"
                  value={formData.emergencyStopCircuit}
                  onChange={e => setFormData({ ...formData, emergencyStopCircuit: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  53. Marine Electrical Safety Standard
                </label>
                <input
                  type="text"
                  value={formData.safetyInstrumentationStandard}
                  onChange={e => setFormData({ ...formData, safetyInstrumentationStandard: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 7: Applicable Sub-Projects Selection (On-Demand Scope) */}
        {activeSection === 7 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <i className="fa-solid fa-layer-group text-emerald-700" />
                  <span>Chapter 7: Applicable Sub-Projects & Scope Selection</span>
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Select and add only the components that are applicable for this project from the dropdown. No predefined components are forced.
                </p>
              </div>

              <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold w-fit">
                {selectedSubProjects.length} Selected
              </span>
            </div>

            {/* Dropdown Add Sub-Project Control Box */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-bold">
                    +
                  </span>
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    Add Sub-Project Component from Dropdown
                  </h4>
                </div>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  Selecting Alternator opens smart database suggestions directly below
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Component Type *
                  </label>
                  <select
                    value={componentToAdd}
                    onChange={e => {
                      const val = e.target.value as SubProjectComponentType | '';
                      setComponentToAdd(val);
                      if (val === 'Alternator') {
                        setIsAlternatorFlowOpen(true);
                      } else {
                        setIsAlternatorFlowOpen(false);
                      }
                    }}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none font-semibold cursor-pointer"
                  >
                    <option value="">-- Choose Component to Add --</option>
                    <option value="Alternator">Alternator (Smart Suggestions & SOTR)</option>
                    <option value="Local Control Panel (LCP)">Local Control Panel (LCP)</option>
                    <option value="Engine Wiring Harness (EWH)">Engine Wiring Harness (EWH)</option>
                    <option value="Alternator Wiring Harness (AWH)">Alternator Wiring Harness (AWH)</option>
                    <option value="Electrical Interface Diagram">Electrical Interface Diagram</option>
                    <option value="Sensors Group">Sensors Group</option>
                    <option value="Junction Box">Junction Box</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Assigned Engineer (User Dropdown)
                  </label>
                  <select
                    value={engineerToAdd}
                    onChange={e => setEngineerToAdd(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none cursor-pointer"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.fullName}>
                        {u.fullName} ({u.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                {componentToAdd && componentToAdd !== 'Alternator' && (
                  <div className="col-span-1 md:col-span-3 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          Part Strategy for {componentToAdd}:
                        </span>
                        <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-white">
                          <button
                            type="button"
                            onClick={() => setIsExistingToAdd(false)}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                              !isExistingToAdd
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            New Design
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsExistingToAdd(true)}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                              isExistingToAdd
                                ? 'bg-emerald-700 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Existing Part
                          </button>
                        </div>
                      </div>

                      <span className="text-[11px] text-slate-500">
                        {isExistingToAdd
                          ? 'Specify existing part number and attach reference drawing'
                          : 'Create brand new design structure for this project'}
                      </span>
                    </div>

                    {/* DYNAMIC FIELD: When Existing Part is selected */}
                    {isExistingToAdd ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200">
                        <div>
                          <label className="block font-bold text-emerald-950 text-xs mb-1.5 flex items-center gap-1.5">
                            <i className="fa-solid fa-barcode text-emerald-700" />
                            <span>Enter Existing Part Number <span className="text-rose-600">*</span></span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. DV2.M821.02.0.PR or LCP-GSL-EX-415V"
                            value={existingPartNumberToAdd}
                            onChange={e => setExistingPartNumberToAdd(e.target.value)}
                            className="w-full border border-emerald-300 bg-white rounded-xl p-2.5 text-xs font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                          />
                          <p className="text-[10px] text-emerald-800 mt-1">
                            Enter the legacy/standard part number to re-use.
                          </p>
                        </div>

                        <div>
                          <label className="block font-bold text-emerald-950 text-xs mb-1.5 flex items-center gap-1.5">
                            <i className="fa-solid fa-file-arrow-up text-emerald-700" />
                            <span>Attach Existing Drawing (.pdf, .dwg, .dxf)</span>
                          </label>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <label className="px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shrink-0 flex items-center gap-1.5">
                                <i className="fa-solid fa-paperclip text-xs" />
                                <span>Browse File</span>
                                <input
                                  type="file"
                                  accept=".pdf,.dwg,.dxf,.stp,.step,.zip,.png,.jpg"
                                  className="hidden"
                                  onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setAttachedDrawingFileNameToAdd(file.name);
                                    }
                                  }}
                                />
                              </label>

                              <input
                                type="text"
                                placeholder="Drawing file name or URL..."
                                value={attachedDrawingFileNameToAdd}
                                onChange={e => setAttachedDrawingFileNameToAdd(e.target.value)}
                                className="flex-1 border border-emerald-300 bg-white rounded-lg p-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                              />
                            </div>

                            {/* Sample presets shortcut */}
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                              <span className="text-slate-500 font-medium">Sample Drawings:</span>
                              {[
                                `${componentToAdd.replace(/[^A-Za-z0-9]/g, '_')}_Schematic_Rev3.pdf`,
                                `${componentToAdd.slice(0, 3).toUpperCase()}_Assembly_2D.dwg`,
                              ].map(sampleName => (
                                <button
                                  key={sampleName}
                                  type="button"
                                  onClick={() => setAttachedDrawingFileNameToAdd(sampleName)}
                                  className="px-2 py-0.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded font-mono transition-colors cursor-pointer"
                                >
                                  + {sampleName}
                                </button>
                              ))}
                            </div>

                            {attachedDrawingFileNameToAdd && (
                              <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-emerald-300 text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <i className="fa-solid fa-file-pdf text-rose-600 text-sm" />
                                  <span className="font-mono font-bold text-slate-800 truncate">
                                    {attachedDrawingFileNameToAdd}
                                  </span>
                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded">
                                    Ready to attach
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setAttachedDrawingFileNameToAdd('')}
                                  className="text-slate-400 hover:text-rose-600 ml-2"
                                  title="Remove attachment"
                                >
                                  <i className="fa-solid fa-xmark" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* When New Design is selected */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-semibold text-slate-700 text-xs mb-1.5">
                            New Design Part / Group Number (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. LCP-GSL-NEW-01"
                            value={partNumberToAdd}
                            onChange={e => setPartNumberToAdd(e.target.value)}
                            className="w-full border border-slate-300 bg-white rounded-xl p-2.5 text-xs font-mono focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">
                            Leave blank to auto-generate temporary placeholder.
                          </p>
                        </div>

                        <div className="flex items-center p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-indigo-900">
                          <i className="fa-solid fa-circle-info text-indigo-500 mr-2 text-sm" />
                          <span>A new CAD model and schematic drawing will be created in PLM for this sub-project.</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          setComponentToAdd('');
                          setPartNumberToAdd('');
                          setExistingPartNumberToAdd('');
                          setAttachedDrawingFileNameToAdd('');
                        }}
                        className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSubProject()}
                        className="py-2 px-5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <i className="fa-solid fa-plus text-xs" />
                        <span>Add {componentToAdd} to Scope</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick shortcut pills */}
              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-500 text-[11px]">Quick Add:</span>
                {[
                  'Alternator',
                  'Local Control Panel (LCP)',
                  'Engine Wiring Harness (EWH)',
                  'Alternator Wiring Harness (AWH)',
                  'Electrical Interface Diagram',
                  'Sensors Group',
                  'Junction Box',
                ].map(cName => {
                  const isAdded = selectedSubProjects.some(sp => sp.componentType === cName);
                  if (isAdded) return null;
                  return (
                    <button
                      key={cName}
                      type="button"
                      onClick={() => {
                        if (cName === 'Alternator') {
                          setComponentToAdd('Alternator');
                          setIsAlternatorFlowOpen(true);
                        } else {
                          setComponentToAdd(cName as SubProjectComponentType);
                        }
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-300 hover:border-emerald-300 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <i className="fa-solid fa-plus text-[9px] text-emerald-600" />
                      <span>{cName}</span>
                    </button>
                  );
                })}
              </div>

              {/* Smart Alternator Selection & Suggestions: Appears right here after selecting Alternator at sub-project adding time! */}
              {(componentToAdd === 'Alternator' || isAlternatorFlowOpen) && (
                <div className="pt-3 border-t-2 border-emerald-500/50">
                  <AlternatorSelectionFlow
                    targetKva={formData.alternatorKva || formData.dgRatingKva || 500}
                    targetVoltage={formData.mainAcVoltage || 415}
                    projectName={formData.projectName}
                    projectCode={`KOEL-MAR-2026-${String(nextProjectIndex).padStart(3, '0')}`}
                    catalog={catalog}
                    existingProjects={existingProjects}
                    assignedEngineer={engineerToAdd || formData.projectLeadEngineer}
                    users={users}
                    onSelectExistingAlternator={handleAlternatorSelectExisting}
                    onSaveNewAlternator={handleAlternatorSaveNew}
                    onCancel={() => {
                      setIsAlternatorFlowOpen(false);
                      setComponentToAdd('');
                    }}
                  />
                </div>
              )}
            </div>

            {/* Professional Hierarchical Product Structure Tree View */}
            <div className="space-y-3">
              <SubProjectTreeView
                projectCode={`KOEL-MAR-2026-${String(nextProjectIndex).padStart(3, '0')}`}
                projectName={formData.projectName}
                subProjects={selectedSubProjects}
                onToggleTask={handleToggleSubProjectTask}
                onRemoveSubProject={handleRemoveSubProject}
                onOpenAlternatorFlow={() => setIsAlternatorFlowOpen(true)}
              />
            </div>
          </div>
        )}

        {/* DYNAMIC ADMIN CUSTOM FIELDS (If added in Admin Panel) */}
        {projectCustomFields.length > 0 && (
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                ADMIN CUSTOM FIELDS
              </span>
              <h4 className="font-bold text-sm text-slate-800">
                Additional Project Fields Configured in Admin Panel
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {projectCustomFields.map(fld => (
                <div key={fld.id}>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    {fld.label} {fld.isMandatory && <span className="text-rose-600">*</span>}
                    <span className="text-[10px] font-normal text-slate-400 ml-1.5">({fld.section})</span>
                  </label>
                  {fld.type === 'select' ? (
                    <select
                      required={fld.isMandatory}
                      value={customFieldValues[fld.fieldKey] || ''}
                      onChange={e => setCustomFieldValues({ ...customFieldValues, [fld.fieldKey]: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                    >
                      <option value="">-- Select option --</option>
                      {fld.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : fld.type === 'textarea' ? (
                    <textarea
                      rows={2}
                      required={fld.isMandatory}
                      value={customFieldValues[fld.fieldKey] || ''}
                      onChange={e => setCustomFieldValues({ ...customFieldValues, [fld.fieldKey]: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                    />
                  ) : (
                    <input
                      type={fld.type}
                      required={fld.isMandatory}
                      value={customFieldValues[fld.fieldKey] || ''}
                      onChange={e => setCustomFieldValues({ ...customFieldValues, [fld.fieldKey]: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Navigation & Submit */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {activeSection > 1 && (
              <button
                type="button"
                onClick={() => setActiveSection(prev => prev - 1)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-2"
              >
                <i className="fa-solid fa-chevron-left text-[10px]" />
                <span>Previous Chapter</span>
              </button>
            )}
            {activeSection < 7 && (
              <button
                type="button"
                onClick={() => setActiveSection(prev => prev + 1)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2"
              >
                <span>Next Chapter</span>
                <i className="fa-solid fa-chevron-right text-[10px]" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <i className="fa-solid fa-check text-xs" />
              <span>Create Project & Initialize Sub-Projects</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
