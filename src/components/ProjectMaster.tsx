import React, { useState } from 'react';
import {
  Project,
  SubProject,
  SOTRData,
  DesignInputs53,
  PLMStatus,
  User,
  SubProjectComponentType,
  AlternatorCatalogItem,
  AlternatorWorkflowStatus,
  WorkflowTaskItem,
} from '../types/index.ts';
import { canCloseProject, calculateProjectProgress } from '../utils/rules.ts';
import { exportSotrToExcel } from '../utils/excelExport.ts';
import { exportProjectToExcel, exportProjectToPdf } from '../utils/projectExport.ts';
import { ProjectDossierModal } from './ProjectDossierModal.tsx';
import { AlternatorSelectionFlow } from './AlternatorSelectionFlow.tsx';
import { SubProjectTreeView } from './SubProjectTreeView.tsx';
import {
  getTasksForAlternatorStatus,
  mapAlternatorStatusToPlm,
  MatchingAlternatorOption,
} from '../utils/alternatorWorkflow.ts';

export const AVAILABLE_SUBPROJECT_OPTIONS: {
  type: SubProjectComponentType;
  title: string;
  defaultPart: string;
  icon: string;
}[] = [
  { type: 'Alternator', title: 'Alternator SOTR & Engineering Spec Release', defaultPart: 'ALT-1004-MAR', icon: 'fa-bolt' },
  { type: 'Local Control Panel (LCP)', title: 'LCP Enclosure, General Arrangement & Controller Release', defaultPart: 'LCP-2004-MAR', icon: 'fa-table-cells' },
  { type: 'Engine Wiring Harness (EWH)', title: 'EWH Schematic, Loom Routing & Connector Release', defaultPart: 'EWH-3004-MAR', icon: 'fa-network-wired' },
  { type: 'Alternator Wiring Harness (AWH)', title: 'AWH Power Cabling & Terminal Release', defaultPart: 'AWH-4004-MAR', icon: 'fa-network-wired' },
  { type: 'Electrical Interface Diagram', title: 'Shipyard Interface & Single Line Diagram Release', defaultPart: 'EID-5004-MAR', icon: 'fa-diagram-project' },
  { type: 'Sensors Group', title: 'Pressure, Temperature & Speed Sensor BOM Release', defaultPart: 'SNS-6004-MAR', icon: 'fa-microchip' },
  { type: 'Junction Box', title: 'Terminal Box & Ingress Protection GA Release', defaultPart: 'JB-7004-MAR', icon: 'fa-box-archive' },
];

interface ProjectMasterProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onUpdateProject: (updated: Project) => void;
  onCreateProject: (newProject: Project) => void;
  onOpenNewProjectModal: () => void;
  isCreateModalOpen?: boolean;
  onCloseCreateModal?: () => void;
  currentUser?: User | null;
  onDeleteProject?: (projectId: string) => void;
  users?: User[];
  catalog?: AlternatorCatalogItem[];
}

export const ProjectMaster: React.FC<ProjectMasterProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  onUpdateProject,
  onCreateProject,
  isCreateModalOpen,
  onCloseCreateModal,
  currentUser,
  onDeleteProject,
  users = [],
  catalog = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Export states
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [dossierModalProject, setDossierModalProject] = useState<Project | null>(null);
  const [exportToast, setExportToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Sub-project modal state for Alternator SOTR
  const [activeSotrSubproject, setActiveSotrSubproject] = useState<{
    project: Project;
    subProject: SubProject;
  } | null>(null);

  // Sub-project modal state for editing Universal Part info
  const [activeEditSubproject, setActiveEditSubproject] = useState<{
    project: Project;
    subProject: SubProject;
  } | null>(null);

  // Close project validation feedback banner
  const [closeErrorMsg, setCloseErrorMsg] = useState<{
    projectId: string;
    msg: string;
    unreleased: string[];
  } | null>(null);

  // On-demand sub-project state inside ProjectMaster
  const [isAddSubprojectOpen, setIsAddSubprojectOpen] = useState(false);
  const [isAlternatorFlowOpen, setIsAlternatorFlowOpen] = useState(false);
  const [subProjectViewMode, setSubProjectViewMode] = useState<'tree' | 'cards'>('tree');
  const [newSpType, setNewSpType] = useState<SubProjectComponentType | ''>('Alternator');
  const [newSpEngineer, setNewSpEngineer] = useState<string>(
    currentUser?.fullName || (users && users[0]?.fullName) || 'Rajesh Kulkarni'
  );
  const [newSpPartNo, setNewSpPartNo] = useState<string>('ALT-1004-MAR');
  const [newSpIsExisting, setNewSpIsExisting] = useState<boolean>(false);
  const [newSpExistingPartNo, setNewSpExistingPartNo] = useState<string>('');
  const [newSpAttachedDrawing, setNewSpAttachedDrawing] = useState<string>('');

  // Alternator Workflow Handlers for ProjectMaster
  const handleAlternatorSelectExisting = (data: {
    subProject: SubProject;
    selectedOption: MatchingAlternatorOption;
    status: AlternatorWorkflowStatus;
    customStatusText: string;
    tasks: WorkflowTaskItem[];
  }) => {
    if (!selectedProject) return;
    const updatedSubProjects = [
      ...selectedProject.subProjects.filter(sp => sp.componentType !== 'Alternator'),
      data.subProject,
    ];
    const newProgress = calculateProjectProgress(updatedSubProjects);
    onUpdateProject({
      ...selectedProject,
      subProjects: updatedSubProjects,
      progressPercent: newProgress,
      updatedAt: new Date().toISOString(),
    });
    setIsAlternatorFlowOpen(false);
    setIsAddSubprojectOpen(false);
    setNewSpType('');
  };

  const handleAlternatorSaveNew = (data: {
    subProject: SubProject;
    sotr: SOTRData;
    status: AlternatorWorkflowStatus;
    customStatusText: string;
    tasks: WorkflowTaskItem[];
  }) => {
    if (!selectedProject) return;
    const updatedSubProjects = [
      ...selectedProject.subProjects.filter(sp => sp.componentType !== 'Alternator'),
      data.subProject,
    ];
    const newProgress = calculateProjectProgress(updatedSubProjects);
    onUpdateProject({
      ...selectedProject,
      subProjects: updatedSubProjects,
      progressPercent: newProgress,
      updatedAt: new Date().toISOString(),
    });
    setIsAlternatorFlowOpen(false);
    setIsAddSubprojectOpen(false);
    setNewSpType('');
  };

  const handleToggleSubProjectTask = (project: Project, subProjectId: string, taskId: string) => {
    const updatedSubProjects = project.subProjects.map(sp => {
      if (sp.id === subProjectId) {
        const tasks = sp.actionTasks || getTasksForAlternatorStatus(sp.alternatorStatus || 'Mail notification pending', sp.customStatusText);
        const updatedTasks = tasks.map(t =>
          t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
        );
        return { ...sp, actionTasks: updatedTasks };
      }
      return sp;
    });
    onUpdateProject({ ...project, subProjects: updatedSubProjects, updatedAt: new Date().toISOString() });
  };

  const handleUpdateAlternatorWorkflowStatus = (
    project: Project,
    subProjectId: string,
    newStatus: AlternatorWorkflowStatus,
    customText?: string
  ) => {
    const newTasks = getTasksForAlternatorStatus(newStatus, customText);
    const newPlmStatus = mapAlternatorStatusToPlm(newStatus);
    const updatedSubProjects = project.subProjects.map(sp => {
      if (sp.id === subProjectId) {
        return {
          ...sp,
          alternatorStatus: newStatus,
          customStatusText: newStatus === 'Other' ? (customText !== undefined ? customText : sp.customStatusText) : undefined,
          plmStatus: newPlmStatus,
          actionTasks: newTasks,
          taskStatus: newStatus === 'Released in PLM' ? ('Completed' as const) : sp.taskStatus,
          lastUpdated: new Date().toLocaleDateString(),
        };
      }
      return sp;
    });
    const newProgress = calculateProjectProgress(updatedSubProjects);
    onUpdateProject({
      ...project,
      subProjects: updatedSubProjects,
      progressPercent: newProgress,
      status: newProgress === 100 && project.status === 'CLOSED' ? 'CLOSED' : project.status,
      updatedAt: new Date().toISOString(),
    });
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  // Filter projects list
  const filteredProjects = projects.filter(p => {
    const matchesSearch =
      p.projectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.designInputs.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.designInputs.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.designInputs.yardNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass =
      classFilter === 'ALL' || p.designInputs.primaryClass === classFilter;
    const matchesStatus =
      statusFilter === 'ALL' || p.status === statusFilter;

    return matchesSearch && matchesClass && matchesStatus;
  });

  // Handler to add a new sub-project to an existing project on-demand
  const handleAddSubprojectToProject = (project: Project) => {
    if (!newSpType) {
      alert('Please select a component type first.');
      return;
    }
    const currentType = newSpType as SubProjectComponentType;
    const config = AVAILABLE_SUBPROJECT_OPTIONS.find(c => c.type === currentType);
    const newSpId = `sp-${project.projectCode.toLowerCase()}-${Date.now().toString(36)}`;
    const partNum = newSpPartNo.trim() || config?.defaultPart || `${currentType.slice(0, 3).toUpperCase()}-1001`;

    let sotrData: SOTRData | undefined = undefined;
    if (newSpType === 'Alternator') {
      sotrData = {
        sotrNumber: `SOTR-${project.projectCode}-ALT`,
        createdAt: new Date().toISOString(),
        status: 'Draft',
        chapter1_general: {
          projectTitle: project.designInputs.projectName,
          vesselType: 'Marine Vessel',
          operatingZone: 'Worldwide Tropical',
          ambientRating: `${project.designInputs.ambientAirTempC}°C Amb / ${project.designInputs.engineRoomTempC}°C ER`,
        },
        chapter2_electricalRatings: {
          continuousKva: project.designInputs.alternatorKva || 500,
          voltage: project.designInputs.mainAcVoltage || 415,
          frequencyHz: project.designInputs.systemFrequencyHz || 50,
          powerFactor: 0.8,
          speedRpm: 1500,
          connectionType: project.designInputs.systemPhaseWire || '3 Phase 3 Wire',
        },
        chapter3_excitationAvr: {
          avrType: project.designInputs.avrModel || 'KOEL Digital D-510',
          pmgFitted: true,
          voltageRegulationPct: project.designInputs.voltageRegulationPct || 0.5,
          quadratureDroop: true,
        },
        chapter4_thermalInsulation: {
          insulationClass: 'Class H Vacuum Pressure Impregnation (VPI)',
          tempRiseClass: 'Class F (90K limit per IRS Part 4)',
          rtdWindingCount: 6,
          bearingRtdCount: 2,
          spaceHeaterWatts: 300,
          spaceHeaterVolts: 230,
        },
        chapter5_mechanicalCoupling: {
          enclosureIp: 'IP23 with Marine Washable Filters',
          mountingType: project.designInputs.couplingType || 'IM B21 Close Coupled',
          housingSize: (project.designInputs.housingFlywheelCombo || 'SAE 0 / 18').split('/')[0].trim(),
          flywheelSize: (project.designInputs.housingFlywheelCombo || 'SAE 0 / 18').split('/')[1]?.trim() || '18',
          bearingType: 'Regreasable Antifriction with PT100',
        },
        chapter6_classCertifications: {
          classificationSociety: project.designInputs.primaryClass || 'IRS',
          marineCertRequired: true,
          witnessTestRequired: true,
          fatScheduleDate: '2027-02-15',
        },
      };
    }

    const finalPartNum = newSpIsExisting
      ? (newSpExistingPartNo.trim() || newSpPartNo.trim() || `${currentType.slice(0, 3).toUpperCase()}-EX`)
      : (newSpPartNo.trim() || config?.defaultPart || `${currentType.slice(0, 3).toUpperCase()}-1001`);

    const newSubProject: SubProject = {
      id: newSpId,
      componentType: currentType,
      isExistingPart: newSpIsExisting,
      partOrGroupNumber: finalPartNum,
      existingPartNumber: newSpIsExisting ? (newSpExistingPartNo.trim() || finalPartNum) : undefined,
      attachedDrawingFileName: newSpIsExisting && newSpAttachedDrawing.trim() ? newSpAttachedDrawing.trim() : undefined,
      plmStatus: 'Pending',
      taskTitle: config?.title || `${currentType} PLM Release Task`,
      taskStatus: 'Open',
      lastUpdated: new Date().toLocaleDateString(),
      assignedEngineer: newSpEngineer || currentUser?.fullName || 'Rajesh Kulkarni',
      sotr: sotrData,
    };

    const updatedSubProjects = [...project.subProjects, newSubProject];
    const newProgress = calculateProjectProgress(updatedSubProjects);
    const updatedProject: Project = {
      ...project,
      subProjects: updatedSubProjects,
      progressPercent: newProgress,
      status: newProgress === 100 && project.status === 'CLOSED' ? 'CLOSED' : (project.status === 'CLOSED' ? 'OPEN' : project.status),
      updatedAt: new Date().toISOString(),
    };

    onUpdateProject(updatedProject);
    setIsAddSubprojectOpen(false);
    setNewSpPartNo('');
    setNewSpExistingPartNo('');
    setNewSpAttachedDrawing('');
    setNewSpIsExisting(false);
  };

  // Handler to remove a sub-project from a project
  const handleRemoveSubprojectFromProject = (project: Project, subProjectId: string) => {
    const updatedSubProjects = project.subProjects.filter(sp => sp.id !== subProjectId);
    const newProgress = calculateProjectProgress(updatedSubProjects);
    const updatedProject: Project = {
      ...project,
      subProjects: updatedSubProjects,
      progressPercent: newProgress,
      updatedAt: new Date().toISOString(),
    };
    onUpdateProject(updatedProject);
    setCloseErrorMsg(null);
  };

  // Handler for closing a project (enforces Rule 2)
  const handleAttemptCloseProject = (project: Project) => {
    setCloseErrorMsg(null);
    const check = canCloseProject(project.subProjects);

    if (!check.canClose) {
      setCloseErrorMsg({
        projectId: project.id,
        msg: `Cannot mark project as CLOSED. Rule 2 requires ALL ${project.subProjects.length} configured sub-projects to reach "Released in PLM" status. Currently ${check.unreleasedCount} sub-project(s) remain unreleased.`,
        unreleased: check.unreleasedNames,
      });
      return;
    }

    const updated: Project = {
      ...project,
      status: 'CLOSED',
      progressPercent: 100,
      updatedAt: new Date().toISOString(),
    };
    onUpdateProject(updated);
  };

  // Handler for reopening a project manually
  const handleReopenProject = (project: Project) => {
    const updated: Project = {
      ...project,
      status: 'OPEN',
      updatedAt: new Date().toISOString(),
    };
    onUpdateProject(updated);
  };

  // Handler for updating a subproject PLM status
  const handleUpdateSubprojectPlm = (
    project: Project,
    subProjectId: string,
    newPlmStatus: PLMStatus,
    newPartNumber?: string,
    isExisting?: boolean
  ) => {
    const updatedSubProjects = project.subProjects.map(sp => {
      if (sp.id === subProjectId) {
        return {
          ...sp,
          plmStatus: newPlmStatus,
          partOrGroupNumber: newPartNumber !== undefined ? newPartNumber : sp.partOrGroupNumber,
          isExistingPart: isExisting !== undefined ? isExisting : sp.isExistingPart,
          taskStatus: newPlmStatus === 'Released in PLM' ? ('Completed' as const) : sp.taskStatus,
          lastUpdated: new Date().toLocaleDateString(),
        };
      }
      return sp;
    });

    const newProgress = calculateProjectProgress(updatedSubProjects);
    const updatedProject: Project = {
      ...project,
      subProjects: updatedSubProjects,
      progressPercent: newProgress,
      status: newProgress === 100 && project.status === 'CLOSED' ? 'CLOSED' : project.status,
      updatedAt: new Date().toISOString(),
    };

    onUpdateProject(updatedProject);
    setCloseErrorMsg(null);
  };

  // Handler to export SOTR Excel
  const handleDownloadSotrExcel = (sotr: SOTRData, project: Project) => {
    exportSotrToExcel(sotr, project.designInputs.projectName, project.projectCode);
  };

  // Handler for Exporting 53 Design Inputs to PDF
  const handleExportProjectPdf = (project: Project) => {
    try {
      setIsExportingPdf(true);
      exportProjectToPdf(project);
      setExportToast({
        msg: `Successfully exported 53 Design Inputs PDF for ${project.projectCode}`,
        type: 'success',
      });
      setTimeout(() => setExportToast(null), 4000);
    } catch (err) {
      console.error('PDF export failed:', err);
      setExportToast({
        msg: 'Failed to generate PDF document. Check console for details.',
        type: 'error',
      });
      setTimeout(() => setExportToast(null), 4000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handler for Exporting 53 Design Inputs to Excel (.xlsx)
  const handleExportProjectExcel = (project: Project) => {
    try {
      setIsExportingExcel(true);
      exportProjectToExcel(project);
      setExportToast({
        msg: `Successfully exported 53 Design Inputs Excel (.xlsx) for ${project.projectCode}`,
        type: 'success',
      });
      setTimeout(() => setExportToast(null), 4000);
    } catch (err) {
      console.error('Excel export failed:', err);
      setExportToast({
        msg: 'Failed to generate Excel workbook. Check console for details.',
        type: 'error',
      });
      setTimeout(() => setExportToast(null), 4000);
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Project Master</h1>
            <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded">
              Marine Design Inputs & PLM Lifecycle
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Standard Order Technical Requirements (SOTR), Class Approval tracking & Sub-project release gates
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            // Trigger open modal in parent
            onSelectProject(null);
            const event = new CustomEvent('open-new-project-modal');
            window.dispatchEvent(event);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start md:self-auto"
        >
          <i className="fa-solid fa-plus text-xs" />
          <span>+ Create New Project / Add Design Inputs</span>
        </button>
      </div>

      {/* Main View: If a project is selected, show its deep PLM view; otherwise show the summary list */}
      {selectedProject ? (
        <div className="space-y-6">
          {/* Back button & Project Header bar */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onSelectProject(null);
                    setCloseErrorMsg(null);
                  }}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Back to all projects"
                >
                  <i className="fa-solid fa-arrow-left text-sm" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      {selectedProject.projectCode}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">
                      {selectedProject.designInputs.projectName}
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span><strong>Customer:</strong> {selectedProject.designInputs.customerName} ({selectedProject.designInputs.yardNumber})</span>
                    <span>·</span>
                    <span><strong>Class:</strong> {selectedProject.designInputs.primaryClass}</span>
                    <span>·</span>
                    <span><strong>Lead:</strong> {selectedProject.designInputs.projectLeadEngineer}</span>
                  </div>
                </div>
              </div>

              {/* Status Action & Export 53 Inputs Toolbar */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* 53 Design Inputs Export Utility */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleExportProjectPdf(selectedProject)}
                    disabled={isExportingPdf}
                    className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    title="Generate and download formatted 53 Design Inputs Specification PDF"
                  >
                    <i className="fa-solid fa-file-pdf" />
                    <span>{isExportingPdf ? 'Exporting PDF...' : 'Export PDF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportProjectExcel(selectedProject)}
                    disabled={isExportingExcel}
                    className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    title="Generate and download formatted 53 Design Inputs Specification Excel Workbook (.xlsx)"
                  >
                    <i className="fa-solid fa-file-excel" />
                    <span>{isExportingExcel ? 'Exporting Excel...' : 'Export Excel (.xlsx)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDossierModalProject(selectedProject)}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Preview interactive 53 Design Inputs Dossier and Print"
                  >
                    <i className="fa-solid fa-eye text-[#0c4a8a]" />
                    <span className="hidden sm:inline">Dossier</span>
                  </button>
                </div>

                <div className="text-right pl-1">
                  <div className="text-xs font-semibold text-slate-500">Project Status</div>
                  <span
                    className={`font-bold text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 ${
                      selectedProject.status === 'CLOSED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedProject.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <i className="fa-solid fa-circle text-[8px]" />
                    {selectedProject.status}
                  </span>
                </div>

                {selectedProject.status === 'CLOSED' ? (
                  <button
                    type="button"
                    onClick={() => handleReopenProject(selectedProject)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <i className="fa-solid fa-lock-open mr-1 text-slate-500" />
                    Re-open Project
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAttemptCloseProject(selectedProject)}
                    className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-circle-check text-xs" />
                    <span>Close Project (Release Gate)</span>
                  </button>
                )}

                {currentUser?.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => setProjectToDelete(selectedProject)}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Delete Project permanently (Admin only)"
                  >
                    <i className="fa-solid fa-trash-can text-xs" />
                    <span>Delete Project</span>
                  </button>
                )}
              </div>
            </div>

            {/* Export Feedback Toast Banner if any */}
            {exportToast && (
              <div
                role="alert"
                className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between animate-in fade-in ${
                  exportToast.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <i
                    className={`fa-solid ${
                      exportToast.type === 'success' ? 'fa-circle-check text-emerald-600' : 'fa-circle-xmark text-rose-600'
                    }`}
                  />
                  <span>{exportToast.msg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setExportToast(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            )}

            {/* Rule 2 Error Banner if closure failed */}
            {closeErrorMsg && closeErrorMsg.projectId === selectedProject.id && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs space-y-1.5 animate-in fade-in">
                <div className="font-bold flex items-center gap-2">
                  <i className="fa-solid fa-triangle-exclamation text-rose-600 text-sm" />
                  <span>Rule 2 Validation Constraint: Project Cannot Be Closed</span>
                </div>
                <p className="leading-relaxed">{closeErrorMsg.msg}</p>
                <div className="pt-1">
                  <span className="font-semibold text-rose-900">Unreleased Sub-Projects:</span>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-rose-700">
                    {closeErrorMsg.unreleased.map(name => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* 6 Structured Chapters / 53 Parameters Accordion / Quick Inspection */}
            <details className="text-xs group border border-slate-200 rounded-lg p-3 bg-slate-50/60">
              <summary className="font-bold text-slate-800 cursor-pointer flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-list-check text-emerald-700" />
                  <span>View Captured Marine Design Inputs (Chapters 1 to 6)</span>
                </div>
                <span className="text-emerald-700 group-open:rotate-180 transition-transform">
                  <i className="fa-solid fa-chevron-down" />
                </span>
              </summary>

              <div className="space-y-4 pt-3 mt-2 border-t border-slate-200">
                {/* Inputs Quick Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      <i className="fa-solid fa-ship text-xs" />
                    </div>
                    <div>
                      <div className="font-bold text-emerald-950 text-xs">
                        Complete Marine Design Inputs Specification
                      </div>
                      <div className="text-[11px] text-emerald-800">
                        Formal engineering standard dossier with Chapters 1 to 6
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => handleExportProjectPdf(selectedProject)}
                      disabled={isExportingPdf}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <i className="fa-solid fa-file-pdf text-xs" />
                      <span>Download PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportProjectExcel(selectedProject)}
                      disabled={isExportingExcel}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <i className="fa-solid fa-file-excel text-xs" />
                      <span>Download Excel (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDossierModalProject(selectedProject)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <i className="fa-solid fa-expand text-xs text-[#0c4a8a]" />
                      <span>Full Dossier View</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Chapter 1 */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 border-b pb-1 text-[11px] uppercase tracking-wider text-emerald-800">
                    1. General & Customer Info
                  </div>
                  <div className="text-slate-600"><strong>Customer:</strong> {selectedProject.designInputs.customerName}</div>
                  <div className="text-slate-600"><strong>Yard No:</strong> {selectedProject.designInputs.yardNumber}</div>
                  <div className="text-slate-600"><strong>End Customer:</strong> {selectedProject.designInputs.endCustomer}</div>
                  <div className="text-slate-600"><strong>TNC Ref & Date:</strong> {selectedProject.designInputs.tncRefNo} ({selectedProject.designInputs.tncDate})</div>
                  <div className="text-slate-600"><strong>Delivery Date:</strong> {selectedProject.designInputs.contractDeliveryDate}</div>
                  <div className="text-slate-600"><strong>Remarks:</strong> {selectedProject.designInputs.generalRemarks}</div>
                </div>

                {/* Chapter 2 */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 border-b pb-1 text-[11px] uppercase tracking-wider text-emerald-800">
                    2. Engine & DG Set Specs
                  </div>
                  <div className="text-slate-600"><strong>Rating:</strong> {selectedProject.designInputs.dgRatingKva} kVA / {selectedProject.designInputs.dgRatingKwe} kWe</div>
                  <div className="text-slate-600"><strong>Type of DG:</strong> {selectedProject.designInputs.typeOfDg}</div>
                  <div className="text-slate-600"><strong>Series & Model:</strong> {selectedProject.designInputs.engineSeries} ({selectedProject.designInputs.engineModel})</div>
                  <div className="text-slate-600"><strong>Emission Norms:</strong> {selectedProject.designInputs.emissionNorms}</div>
                  <div className="text-slate-600"><strong>Duty & Start:</strong> {selectedProject.designInputs.dutyCycle} · {selectedProject.designInputs.startType}</div>
                  <div className="text-slate-600"><strong>Governing:</strong> {selectedProject.designInputs.governingStandard}</div>
                </div>

                {/* Chapter 3 */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 border-b pb-1 text-[11px] uppercase tracking-wider text-emerald-800">
                    3. Marine Class & Environment
                  </div>
                  <div className="text-slate-600"><strong>Primary Class:</strong> {selectedProject.designInputs.primaryClass} (Dual: {selectedProject.designInputs.dualClass})</div>
                  <div className="text-slate-600"><strong>Ambient Air/Water:</strong> {selectedProject.designInputs.ambientAirTempC}°C / {selectedProject.designInputs.seaWaterCoolingTempC}°C</div>
                  <div className="text-slate-600"><strong>Engine Room Temp:</strong> {selectedProject.designInputs.engineRoomTempC}°C · RH {selectedProject.designInputs.relativeHumidityPct}%</div>
                  <div className="text-slate-600"><strong>Motion Limits:</strong> Roll {selectedProject.designInputs.motionRollDeg}° · Pitch {selectedProject.designInputs.motionPitchDeg}°</div>
                  <div className="text-slate-600"><strong>Dynamic Inclination:</strong> {selectedProject.designInputs.inclinationDynamicDeg}°</div>
                </div>

                {/* Chapter 4 */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 border-b pb-1 text-[11px] uppercase tracking-wider text-emerald-800">
                    4. Electrical System
                  </div>
                  <div className="text-slate-600"><strong>Main AC:</strong> {selectedProject.designInputs.mainAcVoltage}V · {selectedProject.designInputs.systemFrequencyHz}Hz</div>
                  <div className="text-slate-600"><strong>Phase & Wire:</strong> {selectedProject.designInputs.systemPhaseWire}</div>
                  <div className="text-slate-600"><strong>Control Supply:</strong> {selectedProject.designInputs.controlSupplyVoltage}</div>
                  <div className="text-slate-600"><strong>Regulation:</strong> Volt +/-{selectedProject.designInputs.voltageRegulationPct}%, Freq +/-{selectedProject.designInputs.frequencyRegulationPct}%</div>
                  <div className="text-slate-600"><strong>Earthing:</strong> {selectedProject.designInputs.neutralEarthingSystem}</div>
                  <div className="text-slate-600"><strong>SC KA / THD:</strong> {selectedProject.designInputs.shortCircuitWithstandCurrentKa} kA / {selectedProject.designInputs.totalHarmonicDistortionThdPct}%</div>
                </div>

                {/* Chapter 5 */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 border-b pb-1 text-[11px] uppercase tracking-wider text-emerald-800">
                    5. Alternator Specs
                  </div>
                  <div className="text-slate-600"><strong>Model:</strong> {selectedProject.designInputs.alternatorModel} ({selectedProject.designInputs.alternatorMake})</div>
                  <div className="text-slate-600"><strong>Rating & Speed:</strong> {selectedProject.designInputs.alternatorKva} kVA · {selectedProject.designInputs.voltageRpmCombo}</div>
                  <div className="text-slate-600"><strong>AVR:</strong> {selectedProject.designInputs.avrModel}</div>
                  <div className="text-slate-600"><strong>Space Heater:</strong> {selectedProject.designInputs.spaceHeaterRequired ? selectedProject.designInputs.spaceHeaterSupply : 'None'}</div>
                  <div className="text-slate-600"><strong>RTD Sensors:</strong> {selectedProject.designInputs.rtdSensorsConfiguration}</div>
                  <div className="text-slate-600"><strong>Coupling / SAE:</strong> {selectedProject.designInputs.couplingType} · {selectedProject.designInputs.housingFlywheelCombo}</div>
                </div>

                {/* Chapter 6 */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 border-b pb-1 text-[11px] uppercase tracking-wider text-emerald-800">
                    6. Panel & Instrumentation
                  </div>
                  <div className="text-slate-600"><strong>Mounting:</strong> {selectedProject.designInputs.panelMountingType}</div>
                  <div className="text-slate-600"><strong>IP & Material:</strong> {selectedProject.designInputs.panelIpRating} · {selectedProject.designInputs.enclosureMaterialGauge}</div>
                  <div className="text-slate-600"><strong>Controller:</strong> {selectedProject.designInputs.controllerType}</div>
                  <div className="text-slate-600"><strong>Ship Interface:</strong> {selectedProject.designInputs.shipAutomationInterface}</div>
                  <div className="text-slate-600"><strong>Alarms:</strong> {selectedProject.designInputs.alarmAnnunciationProtocol}</div>
                  <div className="text-slate-600"><strong>E-Stop / Standard:</strong> {selectedProject.designInputs.emergencyStopCircuit} · {selectedProject.designInputs.safetyInstrumentationStandard}</div>
                </div>
              </div>
            </div>
          </details>
        </div>

          {/* Section B: Sub-Project Execution & Universal PLM Workflow */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Sub-Projects & Universal PLM Workflow
                  </h3>
                  <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                    {selectedProject.subProjects.length} Scope Item{selectedProject.subProjects.length === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  All {selectedProject.subProjects.length} configured sub-component{selectedProject.subProjects.length === 1 ? '' : 's'} must reach "Released in PLM" before project can close
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="text-xs text-slate-600 font-semibold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  Progress: <span className="text-emerald-800 font-bold">{selectedProject.progressPercent}%</span>
                </div>

                {/* View Mode Switcher: Tree View vs Cards */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSubProjectViewMode('tree')}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                      subProjectViewMode === 'tree'
                        ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 font-medium'
                    }`}
                    title="Switch to Product Structure Tree View"
                  >
                    <i className="fa-solid fa-folder-tree text-[11px]" />
                    <span>Tree View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubProjectViewMode('cards')}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                      subProjectViewMode === 'cards'
                        ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 font-medium'
                    }`}
                    title="Switch to Card Grid View"
                  >
                    <i className="fa-solid fa-table-cells text-[11px]" />
                    <span>Cards</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddSubprojectOpen(prev => !prev)}
                  className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <i className={`fa-solid ${isAddSubprojectOpen ? 'fa-xmark' : 'fa-plus'}`} />
                  <span>{isAddSubprojectOpen ? 'Close Form' : '+ Add Sub-Project'}</span>
                </button>
              </div>
            </div>

            {/* Dropdown Add Sub-Project Form */}
            {isAddSubprojectOpen && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                    <i className="fa-solid fa-layer-group text-emerald-700" />
                    <span>Select & Add Applicable Sub-Project to this Marine Project</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    Selecting Alternator opens smart suggestions directly below
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Component Type *
                    </label>
                    <select
                      value={newSpType}
                      onChange={e => {
                        const val = e.target.value as SubProjectComponentType | '';
                        setNewSpType(val);
                        const match = AVAILABLE_SUBPROJECT_OPTIONS.find(c => c.type === val);
                        if (match) setNewSpPartNo(match.defaultPart);
                        if (val === 'Alternator') {
                          setIsAlternatorFlowOpen(true);
                        } else {
                          setIsAlternatorFlowOpen(false);
                        }
                      }}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:ring-1 focus:ring-emerald-700 focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Select Component Type --</option>
                      {AVAILABLE_SUBPROJECT_OPTIONS.map(opt => {
                        const alreadyExists = selectedProject.subProjects.some(sp => sp.componentType === opt.type);
                        return (
                          <option key={opt.type} value={opt.type}>
                            {opt.type} {alreadyExists ? '(Already in project)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Assigned Lead Engineer *
                    </label>
                    <select
                      value={newSpEngineer}
                      onChange={e => setNewSpEngineer(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                    >
                      {users && users.length > 0 ? (
                        users.map(u => (
                          <option key={u.id} value={u.fullName}>
                            {u.fullName} ({u.role.toUpperCase()})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Rajesh Kulkarni">Rajesh Kulkarni (Lead Alternator)</option>
                          <option value="Amit Sharma">Amit Sharma (Marine Automation Lead)</option>
                          <option value="Suresh Patil">Suresh Patil (Electrical Systems Lead)</option>
                          <option value="Vikram Deshmukh">Vikram Deshmukh (Production Engineer)</option>
                        </>
                      )}
                    </select>
                  </div>

                  {newSpType !== 'Alternator' && (
                    <div className="col-span-1 md:col-span-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                          Part Strategy
                        </label>
                        <div className="flex items-center gap-3 text-xs">
                          <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-300">
                            <input
                              type="radio"
                              name="newSpIsExistingRadio"
                              checked={!newSpIsExisting}
                              onChange={() => setNewSpIsExisting(false)}
                              className="text-emerald-700 focus:ring-emerald-700"
                            />
                            <span className="font-bold text-slate-800">New Design</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-300">
                            <input
                              type="radio"
                              name="newSpIsExistingRadio"
                              checked={newSpIsExisting}
                              onChange={() => setNewSpIsExisting(true)}
                              className="text-emerald-700 focus:ring-emerald-700"
                            />
                            <span className="font-bold text-emerald-900">Existing Part</span>
                          </label>
                        </div>
                      </div>

                      {/* When Existing Part is selected */}
                      {newSpIsExisting ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
                          <div>
                            <label className="block font-bold text-emerald-950 text-xs mb-1.5 flex items-center gap-1.5">
                              <i className="fa-solid fa-barcode text-emerald-700" />
                              <span>Enter Existing Part Number <span className="text-rose-600">*</span></span>
                            </label>
                            <input
                              type="text"
                              value={newSpExistingPartNo}
                              onChange={e => setNewSpExistingPartNo(e.target.value)}
                              placeholder="e.g. DV2.M821.02.0.PR or LCP-GSL-EX-415V"
                              className="w-full text-xs bg-white border border-emerald-300 rounded-lg p-2 font-mono text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                            />
                            <p className="text-[10px] text-emerald-800 mt-1">
                              Re-using existing BOM item from inventory or past marine project.
                            </p>
                          </div>

                          <div>
                            <label className="block font-bold text-emerald-950 text-xs mb-1.5 flex items-center gap-1.5">
                              <i className="fa-solid fa-file-arrow-up text-emerald-700" />
                              <span>Attach Existing Drawing (.pdf, .dwg, .dxf)</span>
                            </label>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <label className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shrink-0 flex items-center gap-1.5">
                                  <i className="fa-solid fa-paperclip text-xs" />
                                  <span>Browse File</span>
                                  <input
                                    type="file"
                                    accept=".pdf,.dwg,.dxf,.stp,.step,.zip,.png,.jpg"
                                    className="hidden"
                                    onChange={e => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        setNewSpAttachedDrawing(file.name);
                                      }
                                    }}
                                  />
                                </label>

                                <input
                                  type="text"
                                  placeholder="Drawing file name or URL..."
                                  value={newSpAttachedDrawing}
                                  onChange={e => setNewSpAttachedDrawing(e.target.value)}
                                  className="flex-1 border border-emerald-300 bg-white rounded-lg p-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                                />
                              </div>

                              {/* Sample Presets */}
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                <span className="text-slate-500 font-medium">Sample Drawings:</span>
                                {[
                                  `${(newSpType || 'SubProject').replace(/[^A-Za-z0-9]/g, '_')}_Schematic_Rev4.pdf`,
                                  `${(newSpType || 'SubProject').slice(0, 3).toUpperCase()}_Arrangement_Plan.dwg`,
                                ].map(sampleName => (
                                  <button
                                    key={sampleName}
                                    type="button"
                                    onClick={() => setNewSpAttachedDrawing(sampleName)}
                                    className="px-2 py-0.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded font-mono transition-colors cursor-pointer"
                                  >
                                    + {sampleName}
                                  </button>
                                ))}
                              </div>

                              {newSpAttachedDrawing && (
                                <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-emerald-300 text-xs">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <i className="fa-solid fa-file-pdf text-rose-600 text-sm" />
                                    <span className="font-mono font-bold text-slate-800 truncate">
                                      {newSpAttachedDrawing}
                                    </span>
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded">
                                      Ready to attach
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setNewSpAttachedDrawing('')}
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
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                            New Design Part / Group Number (Optional)
                          </label>
                          <input
                            type="text"
                            value={newSpPartNo}
                            onChange={e => setNewSpPartNo(e.target.value)}
                            placeholder="e.g. LCP-1004-MAR"
                            className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-800 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {newSpType !== 'Alternator' && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-200">
                    <button
                      type="button"
                      onClick={() => setIsAddSubprojectOpen(false)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSubprojectToProject(selectedProject)}
                      className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <i className="fa-solid fa-plus text-xs" />
                      <span>Confirm & Add to Project</span>
                    </button>
                  </div>
                )}

                {/* Alternator Smart Suggestions & SOTR embedded directly at adding time! */}
                {(newSpType === 'Alternator' || isAlternatorFlowOpen) && (
                  <div className="pt-3 border-t-2 border-emerald-600/40">
                    <AlternatorSelectionFlow
                      targetKva={selectedProject.designInputs.alternatorKva || selectedProject.designInputs.dgRatingKva || 500}
                      targetVoltage={selectedProject.designInputs.mainAcVoltage || 415}
                      projectName={selectedProject.designInputs.projectName}
                      projectCode={selectedProject.projectCode}
                      catalog={catalog}
                      existingProjects={projects.filter(p => p.id !== selectedProject.id)}
                      assignedEngineer={newSpEngineer || currentUser?.fullName || 'Rajesh Kulkarni'}
                      users={users}
                      onSelectExistingAlternator={handleAlternatorSelectExisting}
                      onSaveNewAlternator={handleAlternatorSaveNew}
                      onCancel={() => {
                        setIsAlternatorFlowOpen(false);
                        setNewSpType('');
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Standalone Alternator flow when opened from Tree View "Edit SOTR" button */}
            {isAlternatorFlowOpen && !isAddSubprojectOpen && (
              <AlternatorSelectionFlow
                targetKva={selectedProject.designInputs.alternatorKva || selectedProject.designInputs.dgRatingKva || 500}
                targetVoltage={selectedProject.designInputs.mainAcVoltage || 415}
                projectName={selectedProject.designInputs.projectName}
                projectCode={selectedProject.projectCode}
                catalog={catalog}
                existingProjects={projects.filter(p => p.id !== selectedProject.id)}
                assignedEngineer={currentUser?.fullName || 'Rajesh Kulkarni'}
                users={users}
                onSelectExistingAlternator={handleAlternatorSelectExisting}
                onSaveNewAlternator={handleAlternatorSaveNew}
                onCancel={() => setIsAlternatorFlowOpen(false)}
              />
            )}

            {/* Sub-Projects Display: Tree View (Default) vs Card View */}
            {subProjectViewMode === 'tree' ? (
              <SubProjectTreeView
                projectCode={selectedProject.projectCode}
                projectName={selectedProject.designInputs.projectName}
                subProjects={selectedProject.subProjects}
                onToggleTask={(subProjectId, taskId) =>
                  handleToggleSubProjectTask(selectedProject, subProjectId, taskId)
                }
                onRemoveSubProject={subProjectId =>
                  handleRemoveSubprojectFromProject(selectedProject, subProjectId)
                }
                onOpenAlternatorFlow={() => setIsAlternatorFlowOpen(true)}
                onUpdatePlmStatus={(subProjectId, status) =>
                  handleUpdateSubprojectPlm(selectedProject, subProjectId, status)
                }
                onUpdateAlternatorStatus={(subProjectId, status, customText) =>
                  handleUpdateAlternatorWorkflowStatus(selectedProject, subProjectId, status, customText)
                }
                onEditSubProject={sp =>
                  setActiveEditSubproject({ project: selectedProject, subProject: sp })
                }
                onDownloadSotrExcel={sotr =>
                  handleDownloadSotrExcel(sotr, selectedProject)
                }
              />
            ) : selectedProject.subProjects.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-lg">
                  <i className="fa-solid fa-layer-group" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  No Sub-Projects Configured for this Project
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Only applicable sub-projects should be added. Click the button below or "+ Add Sub-Project" above to select and track items in the PLM workflow.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddSubprojectOpen(true)}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <i className="fa-solid fa-plus" />
                  <span>Select & Add First Sub-Project</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {selectedProject.subProjects.map(sp => {
                  const isAlternator = sp.componentType === 'Alternator';

                  return (
                    <div
                      key={sp.id}
                      className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-3"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              sp.plmStatus === 'Released in PLM'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sp.plmStatus === 'In Review'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            <i
                              className={
                                isAlternator
                                  ? 'fa-solid fa-bolt'
                                  : sp.componentType.includes('Panel')
                                  ? 'fa-solid fa-table-cells'
                                  : sp.componentType.includes('Harness')
                                  ? 'fa-solid fa-network-wired'
                                  : sp.componentType.includes('Diagram')
                                  ? 'fa-solid fa-diagram-project'
                                  : sp.componentType.includes('Sensor')
                                  ? 'fa-solid fa-microchip'
                                  : 'fa-solid fa-box-archive'
                              }
                            />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900">{sp.componentType}</h4>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                  sp.isExistingPart
                                    ? 'bg-slate-100 text-slate-700'
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                }`}
                              >
                                {sp.isExistingPart ? 'Existing Part' : 'New Design Part'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                              <span>
                                Part/Group No: <span className="font-mono font-semibold text-slate-800">{sp.partOrGroupNumber || 'Pending entry'}</span>
                              </span>
                              {sp.isExistingPart && sp.existingPartNumber && sp.existingPartNumber !== sp.partOrGroupNumber && (
                                <>
                                  <span>·</span>
                                  <span className="text-emerald-800 font-mono text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                    Ref: {sp.existingPartNumber}
                                  </span>
                                </>
                              )}
                              {sp.attachedDrawingFileName && (
                                <>
                                  <span>·</span>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-mono">
                                    <i className="fa-solid fa-paperclip text-[10px]" />
                                    <span>Drawing: {sp.attachedDrawingFileName}</span>
                                  </span>
                                </>
                              )}
                              <span>·</span>
                              <span>Assigned: {sp.assignedEngineer}</span>
                              <span>·</span>
                              <span>Updated: {sp.lastUpdated}</span>
                            </div>
                          </div>
                        </div>

                        {/* PLM Status Pill and Transitions */}
                        <div className="flex items-center gap-2 self-start md:self-auto">
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                              sp.plmStatus === 'Released in PLM'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sp.plmStatus === 'In Review'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                sp.plmStatus === 'Released in PLM'
                                  ? 'bg-emerald-600'
                                  : sp.plmStatus === 'In Review'
                                  ? 'bg-blue-600'
                                  : 'bg-amber-600'
                              }`}
                            />
                            {sp.plmStatus}
                          </span>

                          {/* Dropdown to change PLM status directly */}
                          <select
                            value={sp.plmStatus}
                            onChange={e =>
                              handleUpdateSubprojectPlm(
                                selectedProject,
                                sp.id,
                                e.target.value as PLMStatus
                              )
                            }
                            aria-label={`Change PLM Status for ${sp.componentType}`}
                            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1 bg-white font-medium focus:ring-1 focus:ring-emerald-700 focus:outline-none cursor-pointer"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Review">In Review</option>
                            <option value="Released in PLM">Released in PLM</option>
                          </select>
                        </div>
                      </div>

                      {/* Alternator Specific Workflow Status & Dynamic Action Tasks */}
                      {isAlternator && (
                        <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                                <i className="fa-solid fa-bolt text-emerald-700" />
                                <span>Alternator Workflow Status:</span>
                              </span>
                              <select
                                value={sp.alternatorStatus || (sp.plmStatus === 'Released in PLM' ? 'Released in PLM' : 'Mail notification pending')}
                                onChange={e =>
                                  handleUpdateAlternatorWorkflowStatus(
                                    selectedProject,
                                    sp.id,
                                    e.target.value as AlternatorWorkflowStatus,
                                    sp.customStatusText
                                  )
                                }
                                className="text-xs border border-emerald-300 rounded-lg px-2.5 py-1 bg-white font-bold text-emerald-900 focus:ring-1 focus:ring-emerald-700 focus:outline-none cursor-pointer"
                              >
                                <option value="Mail notification pending">1. Mail notification pending</option>
                                <option value="Pending in PLM">2. Pending in PLM</option>
                                <option value="Released in PLM">3. Released in PLM</option>
                                <option value="Other">4. Other (Specify)</option>
                              </select>
                            </div>

                            <span className="text-[11px] font-semibold text-emerald-800">
                              Action tasks update automatically when status changes
                            </span>
                          </div>

                          {sp.alternatorStatus === 'Other' && (
                            <div className="flex items-center gap-2 bg-purple-50 p-2.5 rounded-lg border border-purple-200">
                              <span className="text-[11px] font-bold text-purple-900 shrink-0">Custom Status / Reason:</span>
                              <input
                                type="text"
                                value={sp.customStatusText || ''}
                                placeholder="Type custom status (e.g. Awaiting client TVA study / classification survey)..."
                                onChange={e =>
                                  handleUpdateAlternatorWorkflowStatus(
                                    selectedProject,
                                    sp.id,
                                    'Other',
                                    e.target.value
                                  )
                                }
                                className="w-full text-xs bg-white border border-purple-300 rounded p-1.5 focus:outline-none"
                              />
                            </div>
                          )}

                          {/* Dynamic Action Tasks Checklist */}
                          {(() => {
                            const tasks = sp.actionTasks || getTasksForAlternatorStatus(sp.alternatorStatus || 'Mail notification pending', sp.customStatusText);
                            const completedCount = tasks.filter(t => t.isCompleted).length;
                            return (
                              <div className="space-y-1.5 pt-2 border-t border-emerald-200/80">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <i className="fa-solid fa-list-check text-emerald-700" />
                                    <span>Dynamic Action Tasks to Execute:</span>
                                  </span>
                                  <span className="font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                                    {completedCount} / {tasks.length} Done
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  {tasks.map(task => (
                                    <label
                                      key={task.id}
                                      className="flex items-start gap-2 p-2 bg-white rounded-lg border border-slate-200 hover:bg-emerald-50/50 cursor-pointer text-xs transition-colors"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={task.isCompleted}
                                        onChange={() => handleToggleSubProjectTask(selectedProject, sp.id, task.id)}
                                        className="mt-0.5 text-emerald-700 rounded cursor-pointer"
                                      />
                                      <div className="flex-1">
                                        <div className={task.isCompleted ? 'line-through text-slate-400 font-normal' : 'font-semibold text-slate-800'}>
                                          {task.title}
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{task.description}</div>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* General PLM Task Item */}
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <i className="fa-solid fa-list-check text-slate-500" />
                            <span>Task: {sp.taskTitle}</span>
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            PLM Workflow Gate: Verify 3D model, electrical schematic, BOM and shipyard classification documentation.
                            {sp.feedbackNotes && (
                              <span className="text-amber-800 block mt-1 font-medium">
                                Note: {sp.feedbackNotes}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isAlternator && (
                            <>
                              {sp.sotr ? (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadSotrExcel(sp.sotr!, selectedProject)}
                                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                                >
                                  <i className="fa-solid fa-file-excel text-emerald-700" />
                                  <span>Export Excel SOTR</span>
                                </button>
                              ) : null}

                              {/* Direct Screen View SOTR (No Popup!) */}
                              <button
                                type="button"
                                onClick={() => setIsAlternatorFlowOpen(true)}
                                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded font-semibold text-xs cursor-pointer flex items-center gap-1"
                                title="Open SOTR Form directly on screen (In-Window, Non-Popup)"
                              >
                                <i className="fa-solid fa-pen-to-square text-emerald-700" />
                                <span>{sp.sotr ? 'Edit SOTR on Screen' : '+ Create SOTR on Screen'}</span>
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => setActiveEditSubproject({ project: selectedProject, subProject: sp })}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded font-semibold text-xs cursor-pointer"
                          >
                            <i className="fa-solid fa-gear mr-1 text-slate-500" />
                            Part / PLM Setup
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveSubprojectFromProject(selectedProject, sp.id)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded font-semibold text-xs cursor-pointer flex items-center gap-1"
                            title="Remove this sub-project from project scope"
                          >
                            <i className="fa-solid fa-trash-can text-rose-600" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Summary Table of all Projects */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-50/50">
            <div className="w-full md:w-80 relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <i className="fa-solid fa-magnifying-glass text-xs" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by code, customer, yard, project name..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-white"
              />
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto text-xs">
              <span className="text-slate-500 font-medium">Filter Class:</span>
              <select
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
                aria-label="Filter by Marine Classification"
                className="border border-slate-300 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none"
              >
                <option value="ALL">All Marine Classes</option>
                <option value="IRS">IRS</option>
                <option value="LRS">LRS</option>
                <option value="ABS">ABS</option>
                <option value="DNV">DNV</option>
                <option value="NKK">NKK</option>
              </select>

              <span className="text-slate-500 font-medium ml-2">Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                aria-label="Filter by Project Status"
                className="border border-slate-300 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Project Code</th>
                  <th className="py-3 px-4">Project Title & Yard</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">DG Rating</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">PLM Sub-Projects</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map(proj => {
                  const releasedCount = proj.subProjects.filter(sp => sp.plmStatus === 'Released in PLM').length;

                  return (
                    <tr
                      key={proj.id}
                      onClick={() => onSelectProject(proj.id)}
                      className="hover:bg-emerald-50/60 transition-colors cursor-pointer group"
                      title="Click to open this project"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 group-hover:text-emerald-800">
                        {proj.projectCode}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-emerald-950 flex items-center gap-1.5">
                          <span>{proj.designInputs.projectName}</span>
                          <i className="fa-solid fa-chevron-right text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">Yard: {proj.designInputs.yardNumber}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {proj.designInputs.customerName}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {proj.designInputs.dgRatingKva} kVA
                        <div className="text-[11px] text-slate-400">{proj.designInputs.dgRatingKwe} kWe</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {proj.designInputs.primaryClass}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-700">
                          {releasedCount} / {proj.subProjects.length} Released
                        </span>
                        <div className="w-24 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-1.5 rounded-full"
                            style={{ width: `${(releasedCount / (proj.subProjects.length || 1)) * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 tabular-nums">
                        {proj.progressPercent}%
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold text-[11px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            proj.status === 'CLOSED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : proj.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              proj.status === 'CLOSED' ? 'bg-emerald-600' : 'bg-blue-600'
                            }`}
                          />
                          {proj.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportProjectPdf(proj);
                            }}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title={`Export PDF for ${proj.projectCode}`}
                          >
                            <i className="fa-solid fa-file-pdf text-sm" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportProjectExcel(proj);
                            }}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                            title={`Export Excel for ${proj.projectCode}`}
                          >
                            <i className="fa-solid fa-file-excel text-sm" />
                          </button>
                          {currentUser?.role === 'admin' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProjectToDelete(proj);
                              }}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer ml-1"
                              title="Delete Project (Admin only)"
                            >
                              <i className="fa-solid fa-trash-can text-sm" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                      No matching marine projects found. Adjust search filters or create a new project.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Alternator SOTR Chapters 1 to 6 Modal */}
      {activeSotrSubproject && (
        <SotrModal
          project={activeSotrSubproject.project}
          subProject={activeSotrSubproject.subProject}
          onClose={() => setActiveSotrSubproject(null)}
          onSaveSotr={(updatedSotr, feedbackStatus) => {
            const updatedSubProjects = activeSotrSubproject.project.subProjects.map(sp => {
              if (sp.id === activeSotrSubproject.subProject.id) {
                return {
                  ...sp,
                  sotr: updatedSotr,
                  taskStatus: feedbackStatus || ('Feedback Awaited' as const),
                  lastUpdated: new Date().toLocaleDateString(),
                };
              }
              return sp;
            });

            onUpdateProject({
              ...activeSotrSubproject.project,
              subProjects: updatedSubProjects,
              updatedAt: new Date().toISOString(),
            });
            setActiveSotrSubproject(null);
          }}
        />
      )}

      {/* Modal 2: Universal Subproject Part Setup Modal */}
      {activeEditSubproject && (
        <SubprojectConfigModal
          subProject={activeEditSubproject.subProject}
          onClose={() => setActiveEditSubproject(null)}
          onSave={(isExisting, partNumber, plmStatus, feedbackNotes, existingPartNumber, attachedDrawingFileName) => {
            const updatedSubProjects = activeEditSubproject.project.subProjects.map(sp => {
              if (sp.id === activeEditSubproject.subProject.id) {
                return {
                  ...sp,
                  isExistingPart: isExisting,
                  partOrGroupNumber: partNumber,
                  existingPartNumber: isExisting ? (existingPartNumber || sp.existingPartNumber || partNumber) : undefined,
                  attachedDrawingFileName: isExisting ? (attachedDrawingFileName || sp.attachedDrawingFileName) : undefined,
                  plmStatus,
                  feedbackNotes: feedbackNotes || sp.feedbackNotes,
                  lastUpdated: new Date().toLocaleDateString(),
                };
              }
              return sp;
            });

            const newProgress = calculateProjectProgress(updatedSubProjects);
            onUpdateProject({
              ...activeEditSubproject.project,
              subProjects: updatedSubProjects,
              progressPercent: newProgress,
              updatedAt: new Date().toISOString(),
            });
            setActiveEditSubproject(null);
          }}
        />
      )}

      {/* Modal 3: 53 Design Inputs Specification Dossier Preview & Print */}
      {dossierModalProject && (
        <ProjectDossierModal
          project={dossierModalProject}
          isOpen={!!dossierModalProject}
          onClose={() => setDossierModalProject(null)}
        />
      )}

      {/* Delete Project Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-triangle-exclamation text-rose-200 text-lg" />
                <h3 className="font-bold text-sm">Delete Marine Project</h3>
              </div>
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="text-white/80 hover:text-white p-1"
              >
                <i className="fa-solid fa-xmark text-base" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed">
                Are you sure you want to permanently delete this project? This action cannot be undone.
              </p>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-mono font-bold text-slate-900">{projectToDelete.projectCode}</div>
                <div className="font-semibold text-slate-800">{projectToDelete.designInputs.projectName}</div>
                <div className="text-slate-500 text-[11px]">
                  Yard: {projectToDelete.designInputs.yardNumber} · Customer: {projectToDelete.designInputs.customerName}
                </div>
              </div>

              <div className="text-[11px] text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100 flex items-start gap-2">
                <i className="fa-solid fa-circle-exclamation mt-0.5 shrink-0" />
                <span>
                  Admin authorization confirmed. All 7 PLM sub-projects, SOTR specifications, and linked records will be purged.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setProjectToDelete(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteProject) {
                      onDeleteProject(projectToDelete.id);
                    }
                    if (selectedProjectId === projectToDelete.id) {
                      onSelectProject(null);
                    }
                    setProjectToDelete(null);
                  }}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <i className="fa-solid fa-trash-can text-xs" />
                  <span>Delete Permanently</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// SOTR Editor Modal Component
interface SotrModalProps {
  project: Project;
  subProject: SubProject;
  onClose: () => void;
  onSaveSotr: (sotr: SOTRData, feedbackStatus?: 'Feedback Awaited' | 'Completed' | 'Open') => void;
}

const SotrModal: React.FC<SotrModalProps> = ({ project, subProject, onClose, onSaveSotr }) => {
  const existingSotr: SOTRData = subProject.sotr || {
    sotrNumber: `SOTR-KOEL-${project.projectCode}-${Date.now().toString().slice(-4)}`,
    createdAt: new Date().toISOString().split('T')[0],
    status: 'Feedback Awaited',
    chapter1_general: {
      projectTitle: project.designInputs.projectName,
      vesselType: 'Standard Marine Vessel',
      operatingZone: 'Coastal & Deep Sea',
      ambientRating: '45°C Ambient / 95% RH',
    },
    chapter2_electricalRatings: {
      continuousKva: project.designInputs.alternatorKva || project.designInputs.dgRatingKva,
      voltage: project.designInputs.mainAcVoltage || 415,
      frequencyHz: project.designInputs.systemFrequencyHz || 50,
      powerFactor: 0.8,
      speedRpm: 1500,
      connectionType: 'Star (3 Phase 4 Wire)',
    },
    chapter3_excitationAvr: {
      avrType: project.designInputs.avrModel || 'KOEL Digital D-510',
      pmgFitted: true,
      voltageRegulationPct: project.designInputs.voltageRegulationPct || 0.5,
      quadratureDroop: true,
    },
    chapter4_thermalInsulation: {
      insulationClass: 'Class H Vacuum Pressure Impregnated',
      tempRiseClass: 'Class F (90K rise marine limit)',
      rtdWindingCount: 6,
      bearingRtdCount: 2,
      spaceHeaterWatts: 250,
      spaceHeaterVolts: 230,
    },
    chapter5_mechanicalCoupling: {
      enclosureIp: 'IP23',
      mountingType: 'IM B34',
      housingSize: 'SAE 1',
      flywheelSize: 'SAE 14',
      bearingType: 'Regreasable Deep Groove',
    },
    chapter6_classCertifications: {
      classificationSociety: project.designInputs.primaryClass || 'IRS',
      marineCertRequired: true,
      witnessTestRequired: true,
      fatScheduleDate: '2026-11-30',
    },
  };

  const [formData, setFormData] = useState<SOTRData>(existingSotr);
  const [activeTab, setActiveTab] = useState<number>(1);
  const [feedbackAction, setFeedbackAction] = useState<'Awaited' | 'Received' | 'MoreInfo'>('Awaited');
  const [attachmentName, setAttachmentName] = useState<string>('Surveyor_Review_Comments.pdf');

  const handleExportExcel = () => {
    exportSotrToExcel(formData, project.designInputs.projectName, project.projectCode);
  };

  const handleSave = () => {
    let nextStatus: 'Draft' | 'Submitted' | 'Feedback Awaited' | 'Approved' | 'More Info Needed' = 'Feedback Awaited';
    let taskStatus: 'Feedback Awaited' | 'Completed' | 'Open' = 'Feedback Awaited';

    if (feedbackAction === 'Received') {
      nextStatus = 'Approved';
      taskStatus = 'Completed';
    } else if (feedbackAction === 'MoreInfo') {
      nextStatus = 'More Info Needed';
      taskStatus = 'Open';
    }

    onSaveSotr({ ...formData, status: nextStatus }, taskStatus);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold bg-emerald-900/80 px-2 py-0.5 rounded">
                {formData.sotrNumber}
              </span>
              <h3 className="text-base font-bold">Standard Order Technical Requirement (SOTR)</h3>
            </div>
            <p className="text-xs text-emerald-100 mt-0.5">
              Alternator Engineering Specification Chapters 1 through 6
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

        {/* Tab Strip for Chapters 1-6 */}
        <div className="flex overflow-x-auto bg-slate-100 px-4 py-2 border-b border-slate-200 gap-1 text-xs">
          {[
            { id: 1, label: 'Ch 1: General & Vessel' },
            { id: 2, label: 'Ch 2: Electrical' },
            { id: 3, label: 'Ch 3: AVR & Excitation' },
            { id: 4, label: 'Ch 4: Thermal & RTDs' },
            { id: 5, label: 'Ch 5: Mechanical & SAE' },
            { id: 6, label: 'Ch 6: Class & FAT' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {activeTab === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Title</label>
                <input
                  type="text"
                  value={formData.chapter1_general.projectTitle}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      chapter1_general: { ...formData.chapter1_general, projectTitle: e.target.value },
                    })
                  }
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vessel Type</label>
                <input
                  type="text"
                  value={formData.chapter1_general.vesselType}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      chapter1_general: { ...formData.chapter1_general, vesselType: e.target.value },
                    })
                  }
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operating Zone</label>
                <input
                  type="text"
                  value={formData.chapter1_general.operatingZone}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      chapter1_general: { ...formData.chapter1_general, operatingZone: e.target.value },
                    })
                  }
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ambient Rating Envelope</label>
                <input
                  type="text"
                  value={formData.chapter1_general.ambientRating}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      chapter1_general: { ...formData.chapter1_general, ambientRating: e.target.value },
                    })
                  }
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Continuous kVA</label>
                <input
                  type="number"
                  value={formData.chapter2_electricalRatings.continuousKva}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      chapter2_electricalRatings: {
                        ...formData.chapter2_electricalRatings,
                        continuousKva: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nominal Voltage (V)</label>
                <input
                  type="number"
                  value={formData.chapter2_electricalRatings.voltage}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      chapter2_electricalRatings: {
                        ...formData.chapter2_electricalRatings,
                        voltage: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Frequency (Hz)</label>
                <select
                  value={formData.chapter2_electricalRatings.frequencyHz}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      chapter2_electricalRatings: {
                        ...formData.chapter2_electricalRatings,
                        frequencyHz: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                >
                  <option value={50}>50 Hz</option>
                  <option value={60}>60 Hz</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Power Factor (cos phi)</label>
                <input
                  type="number"
                  step="0.05"
                  value={formData.chapter2_electricalRatings.powerFactor}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      chapter2_electricalRatings: {
                        ...formData.chapter2_electricalRatings,
                        powerFactor: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Speed (RPM)</label>
                <input
                  type="number"
                  value={formData.chapter2_electricalRatings.speedRpm}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      chapter2_electricalRatings: {
                        ...formData.chapter2_electricalRatings,
                        speedRpm: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Connection Type</label>
                <input
                  type="text"
                  value={formData.chapter2_electricalRatings.connectionType}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      chapter2_electricalRatings: {
                        ...formData.chapter2_electricalRatings,
                        connectionType: e.target.value,
                      },
                    })
                  }
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>
            </div>
          )}

          {activeTab === 3 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">AVR Type / Model</label>
                <input
                  type="text"
                  value={formData.chapter3_excitationAvr.avrType}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      chapter3_excitationAvr: { ...formData.chapter3_excitationAvr, avrType: e.target.value },
                    })
                  }
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Voltage Regulation (+/-% )</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.chapter3_excitationAvr.voltageRegulationPct}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      chapter3_excitationAvr: {
                        ...formData.chapter3_excitationAvr,
                        voltageRegulationPct: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>
              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="pmg-cb"
                  checked={formData.chapter3_excitationAvr.pmgFitted}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      chapter3_excitationAvr: { ...formData.chapter3_excitationAvr, pmgFitted: e.target.checked },
                    })
                  }
                  className="rounded text-emerald-700"
                />
                <label htmlFor="pmg-cb" className="font-semibold text-slate-700">Permanent Magnet Generator (PMG) Fitted</label>
              </div>
              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="droop-cb"
                  checked={formData.chapter3_excitationAvr.quadratureDroop}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      chapter3_excitationAvr: { ...formData.chapter3_excitationAvr, quadratureDroop: e.target.checked },
                    })
                  }
                  className="rounded text-emerald-700"
                />
                <label htmlFor="droop-cb" className="font-semibold text-slate-700">Quadrature Droop CT Fitted (Parallel Operation)</label>
              </div>
            </div>
          )}

          {activeTab === 4 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Insulation Class</label>
                <input
                  type="text"
                  value={formData.chapter4_thermalInsulation.insulationClass}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      chapter4_thermalInsulation: { ...formData.chapter4_thermalInsulation, insulationClass: e.target.value },
                    })
                  }
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Temperature Rise Class</label>
                <input
                  type="text"
                  value={formData.chapter4_thermalInsulation.tempRiseClass}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      chapter4_thermalInsulation: { ...formData.chapter4_thermalInsulation, tempRiseClass: e.target.value },
                    })
                  }
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Winding RTDs (PT100)</label>
                <input
                  type="number"
                  value={formData.chapter4_thermalInsulation.rtdWindingCount}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      chapter4_thermalInsulation: { ...formData.chapter4_thermalInsulation, rtdWindingCount: Number(e.target.value) },
                    })
                  }
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bearing RTDs (PT100)</label>
                <input
                  type="number"
                  value={formData.chapter4_thermalInsulation.bearingRtdCount}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      chapter4_thermalInsulation: { ...formData.chapter4_thermalInsulation, bearingRtdCount: Number(e.target.value) },
                    })
                  }
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>
            </div>
          )}

          {activeTab === 5 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Enclosure IP Rating</label>
                <select
                  value={formData.chapter5_mechanicalCoupling.enclosureIp}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      chapter5_mechanicalCoupling: { ...formData.chapter5_mechanicalCoupling, enclosureIp: e.target.value },
                    })
                  }
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                >
                  <option value="IP23">IP23 Standard Marine</option>
                  <option value="IP44">IP44 Water Cooled</option>
                  <option value="IP54">IP54 Marine Sealed</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">SAE Adaptor Housing</label>
                <input
                  type="text"
                  value={formData.chapter5_mechanicalCoupling.housingSize}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      chapter5_mechanicalCoupling: { ...formData.chapter5_mechanicalCoupling, housingSize: e.target.value },
                    })
                  }
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Drive Disc Flywheel Size</label>
                <input
                  type="text"
                  value={formData.chapter5_mechanicalCoupling.flywheelSize}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      chapter5_mechanicalCoupling: { ...formData.chapter5_mechanicalCoupling, flywheelSize: e.target.value },
                    })
                  }
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bearing Arrangement</label>
                <input
                  type="text"
                  value={formData.chapter5_mechanicalCoupling.bearingType}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      chapter5_mechanicalCoupling: { ...formData.chapter5_mechanicalCoupling, bearingType: e.target.value },
                    })
                  }
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>
            </div>
          )}

          {activeTab === 6 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Classification Society</label>
                <select
                  value={formData.chapter6_classCertifications.classificationSociety}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      chapter6_classCertifications: { ...formData.chapter6_classCertifications, classificationSociety: e.target.value },
                    })
                  }
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                >
                  <option value="IRS">IRS (Indian Register of Shipping)</option>
                  <option value="LRS">LRS (Lloyd's Register)</option>
                  <option value="ABS">ABS (American Bureau of Shipping)</option>
                  <option value="DNV">DNV (Det Norske Veritas)</option>
                  <option value="NKK">NKK (ClassNK)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">FAT Scheduled Date</label>
                <input
                  type="date"
                  value={formData.chapter6_classCertifications.fatScheduleDate}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      chapter6_classCertifications: { ...formData.chapter6_classCertifications, fatScheduleDate: e.target.value },
                    })
                  }
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="marine-cert-cb"
                  checked={formData.chapter6_classCertifications.marineCertRequired}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      chapter6_classCertifications: { ...formData.chapter6_classCertifications, marineCertRequired: e.target.checked },
                    })
                  }
                  className="rounded text-emerald-700"
                />
                <label htmlFor="marine-cert-cb" className="font-semibold text-slate-700">Marine Class 3.2 Certificate Mandatory</label>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="witness-cb"
                  checked={formData.chapter6_classCertifications.witnessTestRequired}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      chapter6_classCertifications: { ...formData.chapter6_classCertifications, witnessTestRequired: e.target.checked },
                    })
                  }
                  className="rounded text-emerald-700"
                />
                <label htmlFor="witness-cb" className="font-semibold text-slate-700">Witnessed FAT by Classification Surveyor</label>
              </div>
            </div>
          )}

          {/* SOTR Feedback Workflow Task Panel */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 mt-4 space-y-3">
            <div className="font-bold text-amber-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-comments text-amber-700" />
                <span>Supplier / Class Feedback Workflow Gate</span>
              </span>
              <span className="text-[11px] font-mono text-amber-800">
                Current: {formData.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label
                className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center gap-2 ${
                  feedbackAction === 'Awaited'
                    ? 'border-amber-600 bg-white font-bold text-amber-900 shadow-xs'
                    : 'border-amber-200 bg-amber-50/50 text-amber-800'
                }`}
              >
                <input
                  type="radio"
                  name="feedbackAction"
                  checked={feedbackAction === 'Awaited'}
                  onChange={() => setFeedbackAction('Awaited')}
                  className="text-amber-700"
                />
                <span>SOTR Feedback Awaited</span>
              </label>

              <label
                className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center gap-2 ${
                  feedbackAction === 'Received'
                    ? 'border-emerald-600 bg-white font-bold text-emerald-900 shadow-xs'
                    : 'border-amber-200 bg-amber-50/50 text-amber-800'
                }`}
              >
                <input
                  type="radio"
                  name="feedbackAction"
                  checked={feedbackAction === 'Received'}
                  onChange={() => setFeedbackAction('Received')}
                  className="text-emerald-700"
                />
                <span>Feedback Received (Approved)</span>
              </label>

              <label
                className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center gap-2 ${
                  feedbackAction === 'MoreInfo'
                    ? 'border-rose-600 bg-white font-bold text-rose-900 shadow-xs'
                    : 'border-amber-200 bg-amber-50/50 text-amber-800'
                }`}
              >
                <input
                  type="radio"
                  name="feedbackAction"
                  checked={feedbackAction === 'MoreInfo'}
                  onChange={() => setFeedbackAction('MoreInfo')}
                  className="text-rose-700"
                />
                <span>More Info Needed</span>
              </label>
            </div>

            {feedbackAction === 'Received' && (
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="font-semibold text-slate-700">Attached Feedback Document:</span>
                <input
                  type="text"
                  value={attachmentName}
                  onChange={e => setAttachmentName(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1 text-xs bg-white font-mono flex-1"
                />
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <i className="fa-solid fa-file-excel text-xs" />
            <span>Export As-Is Excel SOTR (.xlsx)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
            >
              Save SOTR Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Universal Subproject Config Modal (Existing vs New Part)
interface SubprojectConfigModalProps {
  subProject: SubProject;
  onClose: () => void;
  onSave: (
    isExisting: boolean,
    partNumber: string,
    plmStatus: PLMStatus,
    notes?: string,
    existingPartNumber?: string,
    attachedDrawingFileName?: string
  ) => void;
}

const SubprojectConfigModal: React.FC<SubprojectConfigModalProps> = ({
  subProject,
  onClose,
  onSave,
}) => {
  const [isExisting, setIsExisting] = useState(subProject.isExistingPart);
  const [partNumber, setPartNumber] = useState(subProject.partOrGroupNumber || '');
  const [existingPartNumber, setExistingPartNumber] = useState(
    subProject.existingPartNumber || (subProject.isExistingPart ? subProject.partOrGroupNumber : '')
  );
  const [attachedDrawing, setAttachedDrawing] = useState(subProject.attachedDrawingFileName || '');
  const [plmStatus, setPlmStatus] = useState<PLMStatus>(subProject.plmStatus);
  const [notes, setNotes] = useState(subProject.feedbackNotes || '');

  const handleSave = () => {
    const finalPartNo = isExisting
      ? (existingPartNumber.trim() || partNumber.trim())
      : (partNumber.trim() || subProject.partOrGroupNumber);

    onSave(
      isExisting,
      finalPartNo,
      plmStatus,
      notes,
      isExisting ? (existingPartNumber.trim() || finalPartNo) : undefined,
      isExisting && attachedDrawing.trim() ? attachedDrawing.trim() : undefined
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">Universal Sub-Project Setup</h3>
            <p className="text-xs text-slate-400 mt-0.5">{subProject.componentType}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-2">Part Configuration Strategy</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2 ${
                  isExisting
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="partConfig"
                  checked={isExisting}
                  onChange={() => setIsExisting(true)}
                  className="text-emerald-700"
                />
                <span>Existing Part / BOM</span>
              </label>

              <label
                className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2 ${
                  !isExisting
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="partConfig"
                  checked={!isExisting}
                  onChange={() => setIsExisting(false)}
                  className="text-emerald-700"
                />
                <span>New Design Part</span>
              </label>
            </div>
          </div>

          {/* DYNAMIC FIELDS WHEN EXISTING IS SELECTED */}
          {isExisting ? (
            <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-3">
              <div>
                <label className="block font-bold text-emerald-950 mb-1 flex items-center gap-1.5">
                  <i className="fa-solid fa-barcode text-emerald-700" />
                  <span>Enter Existing Part Number <span className="text-rose-600">*</span></span>
                </label>
                <input
                  type="text"
                  value={existingPartNumber}
                  onChange={e => setExistingPartNumber(e.target.value)}
                  placeholder="e.g. DV2.M821.02.0.PR"
                  className="w-full border border-emerald-300 rounded-lg p-2 font-mono text-xs bg-white text-slate-900 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-emerald-950 mb-1 flex items-center gap-1.5">
                  <i className="fa-solid fa-file-arrow-up text-emerald-700" />
                  <span>Attach Existing Drawing (.pdf, .dwg, .dxf)</span>
                </label>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg cursor-pointer transition-colors text-xs font-bold flex items-center gap-1 shrink-0">
                      <i className="fa-solid fa-paperclip text-xs" />
                      <span>Browse File</span>
                      <input
                        type="file"
                        accept=".pdf,.dwg,.dxf,.stp,.step,.zip,.png,.jpg"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAttachedDrawing(file.name);
                          }
                        }}
                      />
                    </label>

                    <input
                      type="text"
                      placeholder="Drawing file name or URL..."
                      value={attachedDrawing}
                      onChange={e => setAttachedDrawing(e.target.value)}
                      className="flex-1 border border-emerald-300 bg-white rounded-lg p-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>

                  {/* Sample Presets */}
                  <div className="flex flex-wrap items-center gap-1 text-[10px]">
                    <span className="text-slate-500 font-medium">Presets:</span>
                    {[
                      `${subProject.componentType.replace(/[^A-Za-z0-9]/g, '_')}_Schematic_Rev4.pdf`,
                      `${subProject.componentType.slice(0, 3).toUpperCase()}_Arrangement_Plan.dwg`,
                    ].map(sampleName => (
                      <button
                        key={sampleName}
                        type="button"
                        onClick={() => setAttachedDrawing(sampleName)}
                        className="px-2 py-0.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded font-mono transition-colors cursor-pointer"
                      >
                        + {sampleName}
                      </button>
                    ))}
                  </div>

                  {attachedDrawing && (
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-emerald-300 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <i className="fa-solid fa-file-lines text-blue-600 text-sm" />
                        <span className="font-mono font-bold text-slate-800 truncate">
                          {attachedDrawing}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachedDrawing('')}
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
            /* WHEN NEW DESIGN IS SELECTED */
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                New Design Part / Group Number (Optional)
              </label>
              <input
                type="text"
                value={partNumber}
                onChange={e => setPartNumber(e.target.value)}
                placeholder="e.g. DV2.M821.02.0.PR"
                className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">PLM Release Status</label>
            <select
              value={plmStatus}
              onChange={e => setPlmStatus(e.target.value as PLMStatus)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none"
            >
              <option value="Pending">Pending (Not yet submitted to PLM)</option>
              <option value="In Review">In Review (Under PLM engineering audit)</option>
              <option value="Released in PLM">Released in PLM (Approved & Locked)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes / Stakeholder Communication</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Enter details about drawings, revisions or shipyard signoffs..."
              className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            Save Sub-Project Setup
          </button>
        </div>
      </div>
    </div>
  );
};
