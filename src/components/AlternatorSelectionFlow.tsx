import React, { useState } from 'react';
import {
  AlternatorCatalogItem,
  Project,
  SOTRData,
  SubProject,
  AlternatorWorkflowStatus,
  WorkflowTaskItem,
  User,
} from '../types/index.ts';
import {
  findMatchingAlternators,
  MatchingAlternatorOption,
  getTasksForAlternatorStatus,
  mapAlternatorStatusToPlm,
} from '../utils/alternatorWorkflow.ts';

interface AlternatorSelectionFlowProps {
  targetKva: number;
  targetVoltage: number;
  projectName: string;
  projectCode: string;
  catalog: AlternatorCatalogItem[];
  existingProjects: Project[];
  assignedEngineer: string;
  users?: User[];
  onSelectExistingAlternator: (data: {
    subProject: SubProject;
    selectedOption: MatchingAlternatorOption;
    status: AlternatorWorkflowStatus;
    customStatusText: string;
    tasks: WorkflowTaskItem[];
  }) => void;
  onSaveNewAlternator: (data: {
    subProject: SubProject;
    sotr: SOTRData;
    status: AlternatorWorkflowStatus;
    customStatusText: string;
    tasks: WorkflowTaskItem[];
  }) => void;
  onCancel: () => void;
}

export const AlternatorSelectionFlow: React.FC<AlternatorSelectionFlowProps> = ({
  targetKva,
  targetVoltage,
  projectName,
  projectCode,
  catalog,
  existingProjects,
  assignedEngineer,
  users = [],
  onSelectExistingAlternator,
  onSaveNewAlternator,
  onCancel,
}) => {
  // Step 1: Decision Mode: 'choose_mode' | 'existing_browser' | 'new_sotr_form'
  const [step, setStep] = useState<'choose_mode' | 'existing_browser' | 'new_sotr_form'>('choose_mode');

  // Search matches
  const { exactMatches, otherOptions } = findMatchingAlternators(
    targetKva,
    targetVoltage,
    catalog,
    existingProjects
  );

  // Existing selection state
  const [selectedMatch, setSelectedMatch] = useState<MatchingAlternatorOption | null>(
    exactMatches[0] || otherOptions[0] || null
  );
  const [workflowStatus, setWorkflowStatus] = useState<AlternatorWorkflowStatus>('Mail notification pending');
  const [customStatusText, setCustomStatusText] = useState<string>('');
  const [assignedEng, setAssignedEng] = useState<string>(assignedEngineer);

  // New SOTR form state (In-Window, no popup!)
  const initialNewSotr: SOTRData = {
    sotrNumber: `SOTR-KOEL-${projectCode}-NEW`,
    createdAt: new Date().toISOString().split('T')[0],
    status: 'Draft',
    chapter1_general: {
      projectTitle: projectName,
      vesselType: 'Marine Vessel (IRS / ABS / LRS Class)',
      operatingZone: 'Worldwide Tropical Unrestricted',
      ambientRating: '45°C Ambient / 50°C Engine Room / 32°C Sea Water',
    },
    chapter2_electricalRatings: {
      continuousKva: targetKva || 500,
      voltage: targetVoltage || 415,
      frequencyHz: 50,
      powerFactor: 0.8,
      speedRpm: 1500,
      connectionType: 'Star Insulated Neutral (3 Phase 3 Wire)',
    },
    chapter3_excitationAvr: {
      avrType: 'KOEL Digital D-510 with Auxiliary Winding / PMG',
      pmgFitted: true,
      voltageRegulationPct: 0.5,
      quadratureDroop: true,
    },
    chapter4_thermalInsulation: {
      insulationClass: 'Class H Vacuum Pressure Impregnation (VPI)',
      tempRiseClass: 'Class F (90K limit per IRS Part 4 Rules)',
      rtdWindingCount: 6,
      bearingRtdCount: 2,
      spaceHeaterWatts: 300,
      spaceHeaterVolts: 230,
    },
    chapter5_mechanicalCoupling: {
      enclosureIp: 'IP23 Marine Screen Protected with Air Filter',
      mountingType: 'Single Bearing Close Coupled IM B21',
      housingSize: 'SAE 0',
      flywheelSize: 'SAE 18',
      bearingType: 'Regreasable Deep Groove Antifriction with PT100',
    },
    chapter6_classCertifications: {
      classificationSociety: 'IRS',
      marineCertRequired: true,
      witnessTestRequired: true,
      fatScheduleDate: '2027-03-15',
    },
  };

  const [newSotrData, setNewSotrData] = useState<SOTRData>(initialNewSotr);
  const [sotrActiveChapter, setSotrActiveChapter] = useState<number>(1);

  // Dynamic tasks preview
  const currentTasks = getTasksForAlternatorStatus(workflowStatus, customStatusText);

  // Handle Confirm Existing
  const handleConfirmExisting = () => {
    if (!selectedMatch) return;

    const tasks = getTasksForAlternatorStatus(workflowStatus, customStatusText);
    const plmStatus = mapAlternatorStatusToPlm(workflowStatus);

    // Build SOTR data from the selected option if available or synthesized
    const sotrObj: SOTRData = selectedMatch.sotr || {
      sotrNumber: `SOTR-${projectCode}-${selectedMatch.model.replace(/[^A-Za-z0-9]/g, '-')}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: workflowStatus === 'Released in PLM' ? 'Approved' : 'Submitted',
      chapter1_general: {
        projectTitle: projectName,
        vesselType: selectedMatch.customerName ? `Built for ${selectedMatch.customerName}` : 'Marine Vessel',
        operatingZone: 'Worldwide Tropical',
        ambientRating: '45°C Ambient / 50°C Engine Room',
      },
      chapter2_electricalRatings: {
        continuousKva: selectedMatch.ratingKva,
        voltage: selectedMatch.voltageV,
        frequencyHz: selectedMatch.frequencyHz,
        powerFactor: 0.8,
        speedRpm: selectedMatch.rpm,
        connectionType: 'Star Insulated Neutral',
      },
      chapter3_excitationAvr: {
        avrType: selectedMatch.avrModel || 'KOEL Digital D-510',
        pmgFitted: true,
        voltageRegulationPct: 0.5,
        quadratureDroop: true,
      },
      chapter4_thermalInsulation: {
        insulationClass: 'Class H VPI',
        tempRiseClass: 'Class F (90K rise)',
        rtdWindingCount: 6,
        bearingRtdCount: 2,
        spaceHeaterWatts: 300,
        spaceHeaterVolts: 230,
      },
      chapter5_mechanicalCoupling: {
        enclosureIp: selectedMatch.ipProtection,
        mountingType: 'Single Bearing Close-Coupled',
        housingSize: selectedMatch.frameSize.includes('/') ? selectedMatch.frameSize.split('/')[0].trim() : 'SAE 0',
        flywheelSize: selectedMatch.frameSize.includes('/') ? selectedMatch.frameSize.split('/')[1]?.trim() || '18' : '18',
        bearingType: 'Regreasable Antifriction PT100',
      },
      chapter6_classCertifications: {
        classificationSociety: selectedMatch.marineSocieties[0] || 'IRS',
        marineCertRequired: true,
        witnessTestRequired: true,
        fatScheduleDate: '2027-02-28',
      },
    };

    const newSub: SubProject = {
      id: `sp-${projectCode.toLowerCase()}-alt-${Date.now().toString(36)}`,
      componentType: 'Alternator',
      isExistingPart: true,
      partOrGroupNumber: selectedMatch.partNumber || `ALT-${selectedMatch.model.replace(/[^A-Za-z0-9]/g, '')}-MAR`,
      plmStatus,
      taskTitle: `Alternator PLM Gate: ${selectedMatch.model}`,
      taskStatus: workflowStatus === 'Released in PLM' ? 'Completed' : 'Open',
      lastUpdated: new Date().toLocaleDateString(),
      assignedEngineer: assignedEng,
      alternatorStatus: workflowStatus,
      customStatusText: workflowStatus === 'Other' ? customStatusText : undefined,
      actionTasks: tasks,
      copiedFromProjectCode: selectedMatch.projectCode,
      copiedFromModel: selectedMatch.model,
      sotr: sotrObj,
    };

    onSelectExistingAlternator({
      subProject: newSub,
      selectedOption: selectedMatch,
      status: workflowStatus,
      customStatusText,
      tasks,
    });
  };

  // Handle Save New SOTR
  const handleSaveNew = () => {
    const tasks = getTasksForAlternatorStatus(workflowStatus, customStatusText);
    const plmStatus = mapAlternatorStatusToPlm(workflowStatus);

    const newSub: SubProject = {
      id: `sp-${projectCode.toLowerCase()}-alt-${Date.now().toString(36)}`,
      componentType: 'Alternator',
      isExistingPart: false,
      partOrGroupNumber: `ALT-NEW-${Date.now().toString().slice(-4)}-MAR`,
      plmStatus,
      taskTitle: `New Design Alternator SOTR & Specification Release`,
      taskStatus: workflowStatus === 'Released in PLM' ? 'Completed' : 'Open',
      lastUpdated: new Date().toLocaleDateString(),
      assignedEngineer: assignedEng,
      alternatorStatus: workflowStatus,
      customStatusText: workflowStatus === 'Other' ? customStatusText : undefined,
      actionTasks: tasks,
      sotr: newSotrData,
    };

    onSaveNewAlternator({
      subProject: newSub,
      sotr: newSotrData,
      status: workflowStatus,
      customStatusText,
      tasks,
    });
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-emerald-500/40 shadow-lg p-5 sm:p-7 space-y-6 animate-in fade-in duration-200">
      {/* Top Banner with Decision Mode Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-sm">
              <i className="fa-solid fa-bolt" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Alternator Scope Configuration & Smart Suggestions
              </h3>
              <p className="text-xs text-slate-500">
                Existing Database Suggestion vs New SOTR Design Form (In-Window, Non-Popup)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {step !== 'choose_mode' && (
            <button
              type="button"
              onClick={() => setStep('choose_mode')}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <i className="fa-solid fa-arrow-left text-[10px]" />
              <span>Back to Decision</span>
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-slate-500 hover:text-slate-800 rounded-lg text-xs font-medium cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* VIEW 1: CHOOSE MODE (Existing Match vs New Design) */}
      {step === 'choose_mode' && (
        <div className="space-y-6">
          <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 flex items-start gap-3">
            <i className="fa-solid fa-circle-info text-emerald-700 text-base mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-emerald-950">
                Alternator Selection: Select Matching Model from Database or Create New Design SOTR
              </p>
              <p className="text-emerald-800">
                Matching alternators for project rating <strong>{targetKva} kVA · {targetVoltage}V</strong> are listed below. Choose whether to reuse an existing alternator or configure a new engineering design.
              </p>
            </div>
          </div>

          {/* Dual Decision Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Existing Alternator */}
            <div
              onClick={() => setStep('existing_browser')}
              className="p-5 rounded-2xl border-2 border-emerald-600 bg-linear-to-br from-emerald-50/50 to-white hover:border-emerald-700 hover:shadow-md transition-all cursor-pointer space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg font-bold group-hover:scale-105 transition-transform">
                  <i className="fa-solid fa-database" />
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  {exactMatches.length} Matches Found
                </span>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                  1. Select Existing / Database Alternator
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Directly copy ratings and specifications from previous projects or KOEL catalog. Then select initial workflow status (Mail pending, Pending in PLM, Released in PLM, or Other).
                </p>
              </div>
              <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-xs font-bold text-emerald-800">
                <span>Browse Matching Alternators</span>
                <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 2: New Alternator SOTR */}
            <div
              onClick={() => setStep('new_sotr_form')}
              className="p-5 rounded-2xl border-2 border-indigo-500 bg-linear-to-br from-indigo-50/40 to-white hover:border-indigo-600 hover:shadow-md transition-all cursor-pointer space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center text-lg font-bold group-hover:scale-105 transition-transform">
                  <i className="fa-solid fa-file-signature" />
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200">
                  Full 6 Chapters SOTR
                </span>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-800 transition-colors">
                  2. New Alternator Design (New SOTR)
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Open the full 6-chapter SOTR specification form directly on screen (No Popup) to edit electrical, thermal, mechanical, and class certification ratings.
                </p>
              </div>
              <div className="pt-2 border-t border-indigo-100 flex items-center justify-between text-xs font-bold text-indigo-800">
                <span>Open SOTR Form on Screen</span>
                <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Quick Preview of Suggested Matches */}
          {exactMatches.length > 0 && (
            <div className="space-y-3">
              <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-sparkles text-amber-500" />
                <span>Quick Matches for {targetKva} kVA / {targetVoltage}V:</span>
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {exactMatches.slice(0, 3).map(m => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedMatch(m);
                      setStep('existing_browser');
                    }}
                    className="p-3 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 rounded-xl cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-emerald-800">{m.model}</span>
                      <span className="bg-white border px-1.5 py-0.5 rounded text-[10px] text-slate-600">
                        {m.sourceType === 'project' ? m.projectCode : 'Catalog'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 font-semibold">
                      {m.ratingKva} kVA · {m.voltageV}V · {m.rpm} RPM
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {m.customerName ? `Client: ${m.customerName}` : m.series}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: EXISTING ALTERNATOR BROWSER & STATUS SELECTOR */}
      {step === 'existing_browser' && (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <i className="fa-solid fa-list-check text-emerald-700" />
              <span>Step 1: Choose Matching Alternator & Copy Data</span>
            </h4>
            <span className="text-xs text-slate-500 font-medium">
              Click any card to copy old project / catalog specifications
            </span>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-1">
            {[...exactMatches, ...otherOptions].map(opt => {
              const isSelected = selectedMatch?.id === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedMatch(opt)}
                  className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'border-emerald-700 bg-emerald-50/80 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {opt.model}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          opt.sourceType === 'project'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {opt.sourceType === 'project' ? opt.projectCode : 'Catalog DB'}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-emerald-800">
                      {opt.ratingKva} kVA · {opt.voltageV}V · {opt.frequencyHz}Hz · {opt.rpm} RPM
                    </div>

                    <div className="text-[11px] text-slate-600">
                      <strong>Housing/Flywheel:</strong> {opt.frameSize}
                    </div>

                    {opt.customerName && (
                      <div className="text-[11px] text-slate-500">
                        <strong>Yard/Client:</strong> {opt.customerName}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Part: <strong className="font-mono text-slate-700">{opt.partNumber || 'Ready'}</strong></span>
                    {isSelected && (
                      <span className="font-bold text-emerald-800 flex items-center gap-1">
                        <i className="fa-solid fa-circle-check" /> Selected
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Step 2: Choose Workflow Status & Task Generation */}
          {selectedMatch && (
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div>
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    Step 2: Choose Initial Alternator Workflow Status
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Selected Model: <strong className="text-emerald-800">{selectedMatch.model}</strong> ({selectedMatch.ratingKva} kVA)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-semibold text-slate-600">Lead Engineer:</label>
                  <select
                    value={assignedEng}
                    onChange={e => setAssignedEng(e.target.value)}
                    className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1"
                  >
                    {users && users.length > 0 ? (
                      users.map(u => (
                        <option key={u.id} value={u.fullName}>{u.fullName}</option>
                      ))
                    ) : (
                      <option value="Rajesh Kulkarni">Rajesh Kulkarni (Lead Alternator)</option>
                    )}
                  </select>
                </div>
              </div>

              {/* 4 Status Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    id: 'Mail notification pending',
                    label: '1. Mail notification pending',
                    color: 'amber',
                    desc: 'Official notification email pending to stakeholders',
                  },
                  {
                    id: 'Pending in PLM',
                    label: '2. Pending in PLM',
                    color: 'blue',
                    desc: 'Under PLM vault registration and review',
                  },
                  {
                    id: 'Released in PLM',
                    label: '3. Released in PLM',
                    color: 'emerald',
                    desc: 'Engineering sign-off complete & drawing released',
                  },
                  {
                    id: 'Other',
                    label: '4. Other (Specify)',
                    color: 'purple',
                    desc: 'Custom project gate or study needed',
                  },
                ].map(item => {
                  const isChecked = workflowStatus === item.id;
                  return (
                    <label
                      key={item.id}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                        isChecked
                          ? 'border-emerald-700 bg-white shadow-xs'
                          : 'border-slate-200 bg-slate-100/60 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="workflowStatusRadio"
                          checked={isChecked}
                          onChange={() => setWorkflowStatus(item.id as AlternatorWorkflowStatus)}
                          className="text-emerald-700 focus:ring-emerald-700"
                        />
                        <span className="font-bold text-xs text-slate-900">{item.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 pl-5">{item.desc}</p>
                    </label>
                  );
                })}
              </div>

              {/* If "Other" is selected, show editable text box as requested */}
              {workflowStatus === 'Other' && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1.5 animate-in fade-in">
                  <label className="block text-xs font-bold text-purple-950">
                    Custom Status / Reason (Specify details below) *
                  </label>
                  <input
                    type="text"
                    value={customStatusText}
                    onChange={e => setCustomStatusText(e.target.value)}
                    placeholder="e.g. Awaiting client motor starting study / TVA calculation pending from yard"
                    className="w-full text-xs bg-white border border-purple-300 rounded-lg p-2 font-medium text-slate-800 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                  <p className="text-[10px] text-purple-700">
                    This status will be displayed on the sub-project card and will automatically generate the required action tasks.
                  </p>
                </div>
              )}

              {/* Dynamic Action Tasks Preview */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <i className="fa-solid fa-list-check text-emerald-700" />
                    <span>Dynamic Action Tasks to Execute:</span>
                  </h5>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {currentTasks.length} Action Items Generated for this Status
                  </span>
                </div>

                <div className="space-y-1.5">
                  {currentTasks.map(t => (
                    <div
                      key={t.id}
                      className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs flex items-start gap-2.5 shadow-2xs"
                    >
                      <i className={`fa-solid ${t.isCompleted ? 'fa-circle-check text-emerald-600' : 'fa-circle-dot text-amber-500'} mt-0.5 text-xs`} />
                      <div>
                        <div className="font-semibold text-slate-800">{t.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{t.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep('choose_mode')}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Change Mode
                </button>
                <button
                  type="button"
                  onClick={handleConfirmExisting}
                  className="px-6 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-check" />
                  <span>Confirm & Save Existing Alternator</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: DIRECT IN-WINDOW SOTR FORM (NO POPUP!) */}
      {step === 'new_sotr_form' && (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {newSotrData.sotrNumber}
                </span>
                <h4 className="font-bold text-sm text-slate-900">
                  Direct Marine Alternator SOTR Specification Form (Screen View)
                </h4>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Screen-embedded form for all 6 SOTR Chapters. No popup dialog.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-slate-600">Assigned Engineer:</label>
              <select
                value={assignedEng}
                onChange={e => setAssignedEng(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1"
              >
                {users && users.length > 0 ? (
                  users.map(u => (
                    <option key={u.id} value={u.fullName}>{u.fullName}</option>
                  ))
                ) : (
                  <option value="Rajesh Kulkarni">Rajesh Kulkarni (Lead Alternator)</option>
                )}
              </select>
            </div>
          </div>

          {/* Chapter Tabs */}
          <div className="flex overflow-x-auto gap-1 border-b border-slate-200 pb-2 text-xs">
            {[
              { id: 1, title: '1. General', icon: 'fa-ship' },
              { id: 2, title: '2. Ratings', icon: 'fa-bolt' },
              { id: 3, title: '3. Excitation / AVR', icon: 'fa-microchip' },
              { id: 4, title: '4. Insulation & RTD', icon: 'fa-temperature-half' },
              { id: 5, title: '5. Mechanical SAE', icon: 'fa-gears' },
              { id: 6, title: '6. Marine Class', icon: 'fa-anchor' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSotrActiveChapter(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  sotrActiveChapter === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <i className={`fa-solid ${tab.icon} text-[10px]`} />
                <span>{tab.title}</span>
              </button>
            ))}
          </div>

          {/* Chapter Content Form Fields */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200">
            {/* Chapter 1: General */}
            {sotrActiveChapter === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project Title</label>
                  <input
                    type="text"
                    value={newSotrData.chapter1_general.projectTitle}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter1_general: { ...newSotrData.chapter1_general, projectTitle: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vessel Type / Duty</label>
                  <input
                    type="text"
                    value={newSotrData.chapter1_general.vesselType}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter1_general: { ...newSotrData.chapter1_general, vesselType: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Operating Zone</label>
                  <input
                    type="text"
                    value={newSotrData.chapter1_general.operatingZone}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter1_general: { ...newSotrData.chapter1_general, operatingZone: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ambient Limits</label>
                  <input
                    type="text"
                    value={newSotrData.chapter1_general.ambientRating}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter1_general: { ...newSotrData.chapter1_general, ambientRating: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>
            )}

            {/* Chapter 2: Electrical Ratings */}
            {sotrActiveChapter === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Continuous Rating (kVA)</label>
                  <input
                    type="number"
                    value={newSotrData.chapter2_electricalRatings.continuousKva}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter2_electricalRatings: {
                          ...newSotrData.chapter2_electricalRatings,
                          continuousKva: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Generation Voltage (V)</label>
                  <input
                    type="number"
                    value={newSotrData.chapter2_electricalRatings.voltage}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter2_electricalRatings: {
                          ...newSotrData.chapter2_electricalRatings,
                          voltage: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Frequency (Hz)</label>
                  <select
                    value={newSotrData.chapter2_electricalRatings.frequencyHz}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter2_electricalRatings: {
                          ...newSotrData.chapter2_electricalRatings,
                          frequencyHz: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  >
                    <option value={50}>50 Hz (1500 RPM)</option>
                    <option value={60}>60 Hz (1800 RPM)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Power Factor</label>
                  <input
                    type="number"
                    step="0.05"
                    value={newSotrData.chapter2_electricalRatings.powerFactor}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter2_electricalRatings: {
                          ...newSotrData.chapter2_electricalRatings,
                          powerFactor: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Speed (RPM)</label>
                  <input
                    type="number"
                    value={newSotrData.chapter2_electricalRatings.speedRpm}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter2_electricalRatings: {
                          ...newSotrData.chapter2_electricalRatings,
                          speedRpm: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Connection Configuration</label>
                  <input
                    type="text"
                    value={newSotrData.chapter2_electricalRatings.connectionType}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter2_electricalRatings: {
                          ...newSotrData.chapter2_electricalRatings,
                          connectionType: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>
            )}

            {/* Chapter 3: Excitation & AVR */}
            {sotrActiveChapter === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">AVR Type & Model</label>
                  <input
                    type="text"
                    value={newSotrData.chapter3_excitationAvr.avrType}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter3_excitationAvr: {
                          ...newSotrData.chapter3_excitationAvr,
                          avrType: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Steady State Voltage Regulation %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newSotrData.chapter3_excitationAvr.voltageRegulationPct}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter3_excitationAvr: {
                          ...newSotrData.chapter3_excitationAvr,
                          voltageRegulationPct: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="pmgFittedCb"
                    checked={newSotrData.chapter3_excitationAvr.pmgFitted}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter3_excitationAvr: {
                          ...newSotrData.chapter3_excitationAvr,
                          pmgFitted: e.target.checked,
                        },
                      })
                    }
                    className="text-emerald-700 rounded"
                  />
                  <label htmlFor="pmgFittedCb" className="font-semibold text-slate-800">
                    PMG (Permanent Magnet Generator) Excitation Fitted
                  </label>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="droopCb"
                    checked={newSotrData.chapter3_excitationAvr.quadratureDroop}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter3_excitationAvr: {
                          ...newSotrData.chapter3_excitationAvr,
                          quadratureDroop: e.target.checked,
                        },
                      })
                    }
                    className="text-emerald-700 rounded"
                  />
                  <label htmlFor="droopCb" className="font-semibold text-slate-800">
                    Quadrature Droop CT Fitted (For Parallel Operation)
                  </label>
                </div>
              </div>
            )}

            {/* Chapter 4: Thermal & RTD */}
            {sotrActiveChapter === 4 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Insulation Class</label>
                  <input
                    type="text"
                    value={newSotrData.chapter4_thermalInsulation.insulationClass}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter4_thermalInsulation: {
                          ...newSotrData.chapter4_thermalInsulation,
                          insulationClass: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Temperature Rise Class</label>
                  <input
                    type="text"
                    value={newSotrData.chapter4_thermalInsulation.tempRiseClass}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter4_thermalInsulation: {
                          ...newSotrData.chapter4_thermalInsulation,
                          tempRiseClass: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stator RTD PT100 Quantity</label>
                  <input
                    type="number"
                    value={newSotrData.chapter4_thermalInsulation.rtdWindingCount}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter4_thermalInsulation: {
                          ...newSotrData.chapter4_thermalInsulation,
                          rtdWindingCount: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bearing RTD PT100 Quantity</label>
                  <input
                    type="number"
                    value={newSotrData.chapter4_thermalInsulation.bearingRtdCount}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter4_thermalInsulation: {
                          ...newSotrData.chapter4_thermalInsulation,
                          bearingRtdCount: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Space Heater Rating (Watts)</label>
                  <input
                    type="number"
                    value={newSotrData.chapter4_thermalInsulation.spaceHeaterWatts}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter4_thermalInsulation: {
                          ...newSotrData.chapter4_thermalInsulation,
                          spaceHeaterWatts: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Space Heater Voltage (V AC)</label>
                  <input
                    type="number"
                    value={newSotrData.chapter4_thermalInsulation.spaceHeaterVolts}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter4_thermalInsulation: {
                          ...newSotrData.chapter4_thermalInsulation,
                          spaceHeaterVolts: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>
            )}

            {/* Chapter 5: Mechanical & SAE Coupling */}
            {sotrActiveChapter === 5 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Enclosure & Ingress Protection</label>
                  <input
                    type="text"
                    value={newSotrData.chapter5_mechanicalCoupling.enclosureIp}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter5_mechanicalCoupling: {
                          ...newSotrData.chapter5_mechanicalCoupling,
                          enclosureIp: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mounting Type</label>
                  <input
                    type="text"
                    value={newSotrData.chapter5_mechanicalCoupling.mountingType}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter5_mechanicalCoupling: {
                          ...newSotrData.chapter5_mechanicalCoupling,
                          mountingType: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SAE Housing Size</label>
                  <input
                    type="text"
                    value={newSotrData.chapter5_mechanicalCoupling.housingSize}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter5_mechanicalCoupling: {
                          ...newSotrData.chapter5_mechanicalCoupling,
                          housingSize: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SAE Flywheel Disc Size</label>
                  <input
                    type="text"
                    value={newSotrData.chapter5_mechanicalCoupling.flywheelSize}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter5_mechanicalCoupling: {
                          ...newSotrData.chapter5_mechanicalCoupling,
                          flywheelSize: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Bearing Arrangement</label>
                  <input
                    type="text"
                    value={newSotrData.chapter5_mechanicalCoupling.bearingType}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter5_mechanicalCoupling: {
                          ...newSotrData.chapter5_mechanicalCoupling,
                          bearingType: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>
            )}

            {/* Chapter 6: Marine Class Certifications */}
            {sotrActiveChapter === 6 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Classification Society</label>
                  <input
                    type="text"
                    value={newSotrData.chapter6_classCertifications.classificationSociety}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter6_classCertifications: {
                          ...newSotrData.chapter6_classCertifications,
                          classificationSociety: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Scheduled FAT Date</label>
                  <input
                    type="date"
                    value={newSotrData.chapter6_classCertifications.fatScheduleDate}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter6_classCertifications: {
                          ...newSotrData.chapter6_classCertifications,
                          fatScheduleDate: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="marineCertCb"
                    checked={newSotrData.chapter6_classCertifications.marineCertRequired}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter6_classCertifications: {
                          ...newSotrData.chapter6_classCertifications,
                          marineCertRequired: e.target.checked,
                        },
                      })
                    }
                    className="text-emerald-700 rounded"
                  />
                  <label htmlFor="marineCertCb" className="font-semibold text-slate-800">
                    Works Test Certificate (WTC) & Type Approval Required
                  </label>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="witnessCb"
                    checked={newSotrData.chapter6_classCertifications.witnessTestRequired}
                    onChange={e =>
                      setNewSotrData({
                        ...newSotrData,
                        chapter6_classCertifications: {
                          ...newSotrData.chapter6_classCertifications,
                          witnessTestRequired: e.target.checked,
                        },
                      })
                    }
                    className="text-emerald-700 rounded"
                  />
                  <label htmlFor="witnessCb" className="font-semibold text-slate-800">
                    Witnessed Testing by Class Surveyor at Factory (FAT)
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Workflow Status Selection for New SOTR as requested */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Set Initial Workflow Status & Dynamic Task List:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { id: 'Mail notification pending', label: '1. Mail notification pending' },
                { id: 'Pending in PLM', label: '2. Pending in PLM' },
                { id: 'Released in PLM', label: '3. Released in PLM' },
                { id: 'Other', label: '4. Other (Specify)' },
              ].map(item => (
                <label
                  key={item.id}
                  className={`p-2.5 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-2 text-xs font-bold ${
                    workflowStatus === item.id
                      ? 'border-emerald-700 bg-white shadow-2xs text-emerald-950'
                      : 'border-slate-200 bg-slate-100/70 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="newWorkflowStatusRadio"
                    checked={workflowStatus === item.id}
                    onChange={() => setWorkflowStatus(item.id as AlternatorWorkflowStatus)}
                    className="text-emerald-700"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            {workflowStatus === 'Other' && (
              <div className="pt-2">
                <input
                  type="text"
                  value={customStatusText}
                  onChange={e => setCustomStatusText(e.target.value)}
                  placeholder="Specify custom status / notes..."
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
                />
              </div>
            )}

            {/* Dynamic Tasks Preview */}
            <div className="pt-2 border-t border-slate-200">
              <span className="text-[11px] font-bold text-slate-700">Generated Action Tasks to Execute:</span>
              <div className="mt-1 space-y-1">
                {currentTasks.map(t => (
                  <div key={t.id} className="text-xs text-slate-600 flex items-center gap-2 bg-white px-2.5 py-1 rounded border border-slate-200">
                    <i className="fa-solid fa-list-check text-emerald-700 text-[10px]" />
                    <span>{t.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep('choose_mode')}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Back to Choice
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNew}
                className="px-6 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <i className="fa-solid fa-check" />
                <span>Save & Register New Alternator SOTR</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
