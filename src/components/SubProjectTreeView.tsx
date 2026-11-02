import React, { useState } from 'react';
import { SubProject, AlternatorWorkflowStatus, PLMStatus, SOTRData } from '../types/index.ts';

interface SubProjectTreeViewProps {
  projectCode: string;
  projectName: string;
  subProjects: SubProject[];
  onToggleTask: (subProjectId: string, taskId: string) => void;
  onRemoveSubProject: (subProjectId: string) => void;
  onOpenAlternatorFlow?: () => void;
  onUpdatePlmStatus?: (subProjectId: string, status: PLMStatus) => void;
  onUpdateAlternatorStatus?: (subProjectId: string, status: AlternatorWorkflowStatus, customText?: string) => void;
  onEditSubProject?: (subProject: SubProject) => void;
  onDownloadSotrExcel?: (sotr: SOTRData) => void;
  readOnly?: boolean;
}

export const SubProjectTreeView: React.FC<SubProjectTreeViewProps> = ({
  projectCode,
  projectName,
  subProjects,
  onToggleTask,
  onRemoveSubProject,
  onOpenAlternatorFlow,
  onUpdatePlmStatus,
  onUpdateAlternatorStatus,
  onEditSubProject,
  onDownloadSotrExcel,
  readOnly = false,
}) => {
  // Track collapsed state for branches (all expanded by default)
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  const toggleNode = (nodeId: string) => {
    setCollapsedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const expandAll = () => setCollapsedNodes({});
  const collapseAll = () => {
    const all: Record<string, boolean> = {};
    subProjects.forEach(sp => {
      all[sp.id] = true;
    });
    setCollapsedNodes(all);
  };

  const getComponentIcon = (type: string) => {
    if (type.includes('Alternator Wiring')) return 'fa-plug-circle-bolt text-teal-600';
    if (type.includes('Alternator')) return 'fa-bolt text-amber-500';
    if (type.includes('Panel') || type.includes('LCP')) return 'fa-table-cells text-blue-600';
    if (type.includes('Harness') || type.includes('EWH')) return 'fa-network-wired text-indigo-600';
    if (type.includes('Diagram')) return 'fa-diagram-project text-purple-600';
    if (type.includes('Sensor')) return 'fa-microchip text-rose-500';
    if (type.includes('Junction')) return 'fa-box-archive text-emerald-600';
    return 'fa-cube text-slate-600';
  };

  // Overall metrics
  const totalTasks = subProjects.reduce((acc, sp) => acc + (sp.actionTasks?.length || 0), 0);
  const completedTasks = subProjects.reduce(
    (acc, sp) => acc + (sp.actionTasks?.filter(t => t.isCompleted).length || 0),
    0
  );
  const releasedCount = subProjects.filter(sp => sp.plmStatus === 'Released in PLM').length;

  if (subProjects.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-lg">
          <i className="fa-solid fa-folder-tree" />
        </div>
        <h4 className="font-bold text-sm text-slate-800">No Sub-Projects in Scope Tree</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Select and add components from the dropdown above. The hierarchical Product Structure Tree will render automatically with branches and action checklists.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Tree View Header Toolbar */}
      <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-sm font-bold">
            <i className="fa-solid fa-folder-tree" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm tracking-tight text-white">
                Product Breakdown Structure (PBS) · Tree View
              </h4>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {subProjects.length} Nodes
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive hierarchical breakdown of marine project components, gates & action tasks
            </p>
          </div>
        </div>

        {/* Controls & Quick Metrics */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-300 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700">
            <span>PLM Released: <strong className="text-emerald-400">{releasedCount}/{subProjects.length}</strong></span>
            {totalTasks > 0 && (
              <>
                <span>·</span>
                <span>Tasks: <strong className="text-amber-400">{completedTasks}/{totalTasks}</strong></span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={expandAll}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors cursor-pointer"
              title="Expand all tree branches"
            >
              <i className="fa-solid fa-angles-down text-[10px] mr-1" />
              Expand
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors cursor-pointer"
              title="Collapse all tree branches"
            >
              <i className="fa-solid fa-angles-up text-[10px] mr-1" />
              Collapse
            </button>
          </div>
        </div>
      </div>

      {/* Hierarchical Tree Body */}
      <div className="p-5 sm:p-6 bg-slate-50/50">
        {/* ROOT NODE: The Project itself */}
        <div className="relative">
          <div className="flex items-center gap-3 p-3.5 bg-white rounded-xl border-2 border-emerald-700/60 shadow-xs">
            <span className="w-9 h-9 rounded-lg bg-emerald-800 text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0">
              <i className="fa-solid fa-ship" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                  {projectCode}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Root Assembly (Level 0)
                </span>
              </div>
              <h5 className="font-bold text-xs sm:text-sm text-slate-900 truncate mt-0.5">
                {projectName || 'Marine Auxiliary Genset Package'}
              </h5>
            </div>

            <div className="text-right text-xs shrink-0">
              <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                {subProjects.length} Sub-Assemblies
              </span>
            </div>
          </div>

          {/* Vertical Connecting Rail */}
          <div className="relative pl-6 sm:pl-8 mt-2 space-y-4 before:content-[''] before:absolute before:left-4 sm:before:left-5 before:top-0 before:bottom-3 before:w-0.5 before:bg-slate-300">
            {subProjects.map((sp, spIdx) => {
              const isAlternator = sp.componentType === 'Alternator';
              const isCollapsed = collapsedNodes[sp.id] || false;
              const tasks = sp.actionTasks || [];
              const completedTasksCount = tasks.filter(t => t.isCompleted).length;
              const isLastChild = spIdx === subProjects.length - 1;

              return (
                <div key={sp.id} className="relative group">
                  {/* Horizontal Branch Connector Line */}
                  <div className="absolute -left-6 sm:-left-8 top-5 w-6 sm:w-8 h-0.5 bg-slate-300 group-hover:bg-emerald-600 transition-colors" />

                  {/* BRANCH CARD (Level 1 Component Node) */}
                  <div
                    className={`bg-white rounded-xl border transition-all duration-200 ${
                      sp.plmStatus === 'Released in PLM'
                        ? 'border-emerald-300 hover:border-emerald-400'
                        : sp.plmStatus === 'In Review'
                        ? 'border-blue-300 hover:border-blue-400'
                        : 'border-slate-200 hover:border-slate-300'
                    } shadow-xs hover:shadow-md overflow-hidden`}
                  >
                    {/* Node Header Row */}
                    <div className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Collapse / Expand Toggle Button with Component Icon */}
                        <button
                          type="button"
                          onClick={() => toggleNode(sp.id)}
                          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 flex items-center justify-center text-sm font-bold shrink-0 transition-colors cursor-pointer border border-slate-200"
                          title={isCollapsed ? 'Expand branch details' : 'Collapse branch details'}
                        >
                          <i className={`fa-solid ${getComponentIcon(sp.componentType)}`} />
                        </button>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                              {sp.componentType}
                            </h5>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                sp.isExistingPart
                                  ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              }`}
                            >
                              {sp.isExistingPart ? 'Existing Part' : 'New Design'}
                            </span>

                            {/* Alternator Workflow Status Badge */}
                            {isAlternator && (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                <i className="fa-solid fa-bolt text-[9px] text-amber-600" />
                                <span>
                                  {sp.alternatorStatus === 'Other' && sp.customStatusText
                                    ? `Other: ${sp.customStatusText}`
                                    : (sp.alternatorStatus || 'Mail notification pending')}
                                </span>
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                            <span className="font-mono text-[11px]">
                              {sp.isExistingPart ? 'Existing Part No:' : 'Part No:'}{' '}
                              <strong className="text-slate-800 font-bold">
                                {sp.existingPartNumber || sp.partOrGroupNumber || 'PENDING'}
                              </strong>
                            </span>

                            {sp.attachedDrawingFileName && (
                              <>
                                <span>·</span>
                                <span
                                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-mono font-semibold"
                                  title={`Existing Drawing: ${sp.attachedDrawingFileName}`}
                                >
                                  <i className="fa-solid fa-paperclip text-blue-600 text-[10px]" />
                                  <span>Drawing: {sp.attachedDrawingFileName}</span>
                                </span>
                              </>
                            )}

                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <i className="fa-solid fa-user-gear text-slate-400 text-[10px]" />
                              <span>Lead: <strong className="text-slate-700">{sp.assignedEngineer}</strong></span>
                            </span>
                            {sp.copiedFromModel && (
                              <>
                                <span>·</span>
                                <span className="text-emerald-700 font-medium text-[11px]">
                                  Copied: {sp.copiedFromModel}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Status Dropdown & Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
                        {/* PLM Status Pill / Dropdown */}
                        {onUpdatePlmStatus ? (
                          <select
                            value={sp.plmStatus}
                            onChange={e => onUpdatePlmStatus(sp.id, e.target.value as PLMStatus)}
                            aria-label={`Change PLM Status for ${sp.componentType}`}
                            className={`text-xs font-bold rounded-lg px-2.5 py-1 border cursor-pointer focus:outline-none ${
                              sp.plmStatus === 'Released in PLM'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : sp.plmStatus === 'In Review'
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            <option value="Pending">Pending in PLM</option>
                            <option value="In Review">In Review</option>
                            <option value="Released in PLM">Released in PLM</option>
                          </select>
                        ) : (
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                              sp.plmStatus === 'Released in PLM'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : sp.plmStatus === 'In Review'
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            {sp.plmStatus}
                          </span>
                        )}

                        {/* Alternator Specific Actions: Edit SOTR / Export SOTR */}
                        {isAlternator && (
                          <>
                            {sp.sotr && onDownloadSotrExcel && (
                              <button
                                type="button"
                                onClick={() => onDownloadSotrExcel(sp.sotr!)}
                                className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                title="Download SOTR Specification Excel"
                              >
                                <i className="fa-solid fa-file-excel text-emerald-600" />
                                <span className="hidden sm:inline">Excel</span>
                              </button>
                            )}

                            {onOpenAlternatorFlow && (
                              <button
                                type="button"
                                onClick={onOpenAlternatorFlow}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                title="Open / Edit SOTR Specification Form directly on screen"
                              >
                                <i className="fa-solid fa-pen-to-square text-emerald-700" />
                                <span>{sp.sotr ? 'Edit SOTR' : 'Configure SOTR'}</span>
                              </button>
                            )}
                          </>
                        )}

                        {onEditSubProject && (
                          <button
                            type="button"
                            onClick={() => onEditSubProject(sp)}
                            className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-semibold cursor-pointer transition-colors"
                            title="Edit part number, engineer or notes"
                          >
                            <i className="fa-solid fa-gear text-slate-500" />
                          </button>
                        )}

                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => onRemoveSubProject(sp.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove sub-project from scope"
                          >
                            <i className="fa-solid fa-trash-can text-xs" />
                          </button>
                        )}

                        {/* Expand / Collapse Chevron */}
                        <button
                          type="button"
                          onClick={() => toggleNode(sp.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                          title={isCollapsed ? 'Expand' : 'Collapse'}
                        >
                          <i className={`fa-solid ${isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'} text-xs`} />
                        </button>
                      </div>
                    </div>

                    {/* EXPANDABLE LEAVES SECTION (Action Tasks & Workflow Status) */}
                    {!isCollapsed && (
                      <div className="px-4 pb-4 pt-2 bg-slate-50/70 border-t border-slate-100 space-y-3">
                        {/* If Alternator: Workflow status dropdown inside leaf */}
                        {isAlternator && onUpdateAlternatorStatus && (
                          <div className="p-2.5 bg-white rounded-lg border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-700">Change Workflow Status:</span>
                              <select
                                value={sp.alternatorStatus || 'Mail notification pending'}
                                onChange={e =>
                                  onUpdateAlternatorStatus(
                                    sp.id,
                                    e.target.value as AlternatorWorkflowStatus,
                                    sp.customStatusText
                                  )
                                }
                                className="text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-md px-2 py-1 focus:outline-none cursor-pointer"
                              >
                                <option value="Mail notification pending">1. Mail notification pending</option>
                                <option value="Pending in PLM">2. Pending in PLM</option>
                                <option value="Released in PLM">3. Released in PLM</option>
                                <option value="Other">4. Other (Specify)</option>
                              </select>
                            </div>

                            {sp.alternatorStatus === 'Other' && (
                              <input
                                type="text"
                                value={sp.customStatusText || ''}
                                placeholder="Specify custom status / notes..."
                                onChange={e =>
                                  onUpdateAlternatorStatus(sp.id, 'Other', e.target.value)
                                }
                                className="text-xs bg-white border border-purple-300 rounded px-2 py-1 focus:outline-none flex-1 max-w-sm"
                              />
                            )}
                          </div>
                        )}

                        {/* Attached Engineering Drawing Card for Existing Sub-Projects */}
                        {sp.attachedDrawingFileName && (
                          <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0">
                                <i className="fa-solid fa-file-pdf" />
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-slate-900 truncate text-[12px]">
                                    {sp.attachedDrawingFileName}
                                  </span>
                                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                                    Drawing Attached
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Existing drawing linked to sub-project · Re-used BOM specification verified
                                </div>
                              </div>
                            </div>

                            <span className="shrink-0 text-[11px] font-bold text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-blue-300 flex items-center gap-1.5 self-start sm:self-auto">
                              <i className="fa-solid fa-circle-check text-emerald-600 text-xs" />
                              <span>PLM Reference Locked</span>
                            </span>
                          </div>
                        )}

                        {/* CHILD LEAVES: Dynamic Action Tasks Checklist */}
                        {tasks.length > 0 ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                <i className="fa-solid fa-list-check text-emerald-700 text-xs" />
                                <span>Action Tasks To Execute:</span>
                              </div>
                              <span className="font-mono text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {completedTasksCount} / {tasks.length} Completed
                              </span>
                            </div>

                            {/* Sub-tree branches with connecting rails */}
                            <div className="relative pl-5 space-y-1.5 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-3 before:w-0.5 before:bg-slate-200">
                              {tasks.map(task => (
                                <div key={task.id} className="relative flex items-start gap-2.5">
                                  {/* Sub-branch horizontal elbow */}
                                  <div className="absolute -left-5 top-2.5 w-3 h-0.5 bg-slate-200" />

                                  <label
                                    className={`flex-1 p-2 bg-white rounded-lg border transition-colors cursor-pointer flex items-start gap-2.5 text-xs ${
                                      task.isCompleted
                                        ? 'border-slate-200 bg-slate-50/60 opacity-80'
                                        : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={task.isCompleted}
                                      onChange={() => onToggleTask(sp.id, task.id)}
                                      className="mt-0.5 text-emerald-700 rounded focus:ring-emerald-700 cursor-pointer"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div
                                        className={`font-semibold ${
                                          task.isCompleted
                                            ? 'line-through text-slate-400 font-normal'
                                            : 'text-slate-800'
                                        }`}
                                      >
                                        {task.title}
                                      </div>
                                      {task.description && (
                                        <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                          {task.description}
                                        </div>
                                      )}
                                    </div>
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic py-1">
                            No action tasks registered for this component.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
