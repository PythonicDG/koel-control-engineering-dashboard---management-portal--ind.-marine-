import React, { useState } from 'react';
import { EcnEcr, Project, User } from '../types/index.ts';

interface EcnMasterProps {
  ecns: EcnEcr[];
  projects: Project[];
  // Resolves true once the server has stored the notice (it also applies the re-open rule)
  onAddEcn: (newEcn: EcnEcr) => Promise<boolean>;
  isCreateModalOpen: boolean;
  onOpenCreateModal: () => void;
  onCloseCreateModal: () => void;
  users?: User[];
}

export const EcnMaster: React.FC<EcnMasterProps> = ({
  ecns,
  projects,
  onAddEcn,
  isCreateModalOpen,
  onOpenCreateModal,
  onCloseCreateModal,
  users = [],
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'ECN' | 'ECR'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // New ECN/ECR Form State (with manual change number as requested)
  const [changeType, setChangeType] = useState<'ECN' | 'ECR'>('ECN');
  const [manualChangeNumber, setManualChangeNumber] = useState('ECN/MAR/2026/028');
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const [partDescription, setPartDescription] = useState('');
  const [reasonForChange, setReasonForChange] = useState('');
  const [engineerName, setEngineerName] = useState('Rajesh Kulkarni');
  const [impactAnalysis, setImpactAnalysis] = useState('Requires updating PLM structure and informing yard electrical team.');
  const [affectedComponent, setAffectedComponent] = useState('Local Control Panel (LCP)');
  const [formError, setFormError] = useState('');

  const filteredEcns = ecns.filter(item => {
    const matchesType = filterType === 'ALL' || item.changeType === filterType;
    const matchesSearch =
      item.manualChangeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.partDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.projectCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleCreateEcn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!manualChangeNumber.trim()) {
      setFormError('Manual change number is required (no automated numbering).');
      return;
    }
    if (!partDescription.trim()) {
      setFormError('Part description is required.');
      return;
    }

    const targetProject = projects.find(p => p.id === selectedProjectId);
    if (!targetProject) {
      setFormError('Please select a valid target project.');
      return;
    }

    const newEcn: EcnEcr = {
      id: `ecn-${Date.now()}`,
      changeType,
      manualChangeNumber: manualChangeNumber.trim(),
      projectId: targetProject.id,
      projectCode: targetProject.projectCode,
      projectName: targetProject.designInputs.projectName,
      partDescription: partDescription.trim(),
      reasonForChange: reasonForChange.trim(),
      engineerName: engineerName.trim(),
      dateLogged: new Date().toISOString().split('T')[0],
      status: 'Open',
      impactAnalysis: impactAnalysis.trim(),
      affectedComponents: [affectedComponent],
    };

    // Rule 1 (re-open a CLOSED project) is enforced by the backend when the notice is saved.
    const saved = await onAddEcn(newEcn);
    if (!saved) {
      setFormError('The change notice could not be saved. Please try again.');
      return;
    }
    onCloseCreateModal();

    // Reset fields
    setPartDescription('');
    setReasonForChange('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              ECN / ECR Master
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 bg-amber-50 text-amber-800 rounded">
              Engineering Change Notice / Request
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manual change registration and Automated Project Lifecycle Rules (Rule 1: Closed projects re-open on change)
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start md:self-auto"
        >
          <i className="fa-solid fa-plus text-xs" />
          <span>+ Create New ECR / ECN</span>
        </button>
      </div>

      {/* Rule 1 Notice Callout Banner */}
      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
          <i className="fa-solid fa-triangle-exclamation text-sm" />
        </div>
        <div>
          <h4 className="font-bold">Lifecycle Rule 1 Enforced</h4>
          <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
            Logging any ECN or ECR against a <strong className="underline">CLOSED</strong> project will automatically revert the project status back to <strong className="underline font-bold text-emerald-900">OPEN</strong>. This ensures any subsequent design changes must undergo full PLM re-verification.
          </p>
        </div>
      </div>

      {/* Filters Bar & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <i className="fa-solid fa-magnifying-glass text-xs" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by change #, project, part description..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-700"
          />
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto text-xs">
          <span className="text-slate-500 font-medium">Filter Type:</span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                filterType === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All ({ecns.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('ECN')}
              className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                filterType === 'ECN' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              ECNs ({ecns.filter(e => e.changeType === 'ECN').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('ECR')}
              className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                filterType === 'ECR' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              ECRs ({ecns.filter(e => e.changeType === 'ECR').length})
            </button>
          </div>
        </div>
      </div>

      {/* ECN List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Change Type</th>
                <th className="py-3 px-4">Manual Change Number</th>
                <th className="py-3 px-4">Target Project</th>
                <th className="py-3 px-4">Affected Component & Part</th>
                <th className="py-3 px-4">Reason for Change</th>
                <th className="py-3 px-4">Lead Engineer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEcns.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                        item.changeType === 'ECN'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {item.changeType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {item.manualChangeNumber}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{item.projectName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{item.projectCode}</div>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-semibold text-slate-700">{item.affectedComponents.join(', ')}</div>
                    <div className="text-[11px] text-slate-600 line-clamp-1">{item.partDescription}</div>
                  </td>
                  <td className="py-3 px-4 max-w-xs text-slate-600">
                    <div className="line-clamp-2">{item.reasonForChange}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {item.engineerName}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {item.dateLogged}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-semibold text-[11px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        item.status === 'Implemented'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'Approved'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      <i className="fa-solid fa-circle text-[7px]" />
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredEcns.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No matching ECN/ECR records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create New ECR / ECN */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-amber-800 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Log New Engineering Change Notice / Request</h3>
                <p className="text-xs text-amber-100 mt-0.5">
                  Manual numbering mode (no automated sequence) & Automatic Closed Project Re-opening
                </p>
              </div>
              <button
                type="button"
                onClick={onCloseCreateModal}
                className="text-amber-200 hover:text-white"
              >
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>

            <form onSubmit={handleCreateEcn} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Change Type</label>
                  <select
                    value={changeType}
                    onChange={e => setChangeType(e.target.value as 'ECN' | 'ECR')}
                    className="w-full border border-slate-300 rounded p-2 text-xs font-bold"
                  >
                    <option value="ECN">ECN - Engineering Change Notice</option>
                    <option value="ECR">ECR - Engineering Change Request</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Manual Change Number (Required)
                  </label>
                  <input
                    type="text"
                    required
                    value={manualChangeNumber}
                    onChange={e => setManualChangeNumber(e.target.value)}
                    placeholder="e.g. ECN/MAR/2026/028"
                    className="w-full border border-slate-300 rounded p-2 text-xs font-mono font-semibold"
                  />
                  <span className="text-[10px] text-slate-400">Specify manual numbering per KOEL standard</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Project</label>
                <select
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs font-medium"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.projectCode} - {p.designInputs.projectName} [{p.status}]
                    </option>
                  ))}
                </select>
                {projects.find(p => p.id === selectedProjectId)?.status === 'CLOSED' && (
                  <div className="p-2.5 mt-2 bg-amber-50 border border-amber-300 rounded text-amber-900 text-[11px] font-semibold flex items-center gap-2">
                    <i className="fa-solid fa-triangle-exclamation text-amber-600" />
                    <span>
                      Notice: This project is currently CLOSED. Under Rule 1, saving this ECN will automatically re-open it to OPEN.
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Affected Component</label>
                  <select
                    value={affectedComponent}
                    onChange={e => setAffectedComponent(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  >
                    <option value="Local Control Panel (LCP)">Local Control Panel (LCP)</option>
                    <option value="Alternator">Alternator</option>
                    <option value="Engine Wiring Harness (EWH)">Engine Wiring Harness (EWH)</option>
                    <option value="Alternator Wiring Harness (AWH)">Alternator Wiring Harness (AWH)</option>
                    <option value="Electrical Interface Diagram">Electrical Interface Diagram</option>
                    <option value="Sensors Group">Sensors Group</option>
                    <option value="Junction Box">Junction Box</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lead Design Engineer</label>
                  <select
                    required
                    value={engineerName}
                    onChange={e => setEngineerName(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs bg-white"
                  >
                    {users && users.length > 0 ? (
                      users.map(u => (
                        <option key={u.id} value={u.fullName}>
                          {u.fullName} ({u.role.toUpperCase()})
                        </option>
                      ))
                    ) : (
                      <option value="Rajesh Kulkarni">Rajesh Kulkarni (ENGINEER)</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Part Description / Change Scope</label>
                <input
                  type="text"
                  required
                  value={partDescription}
                  onChange={e => setPartDescription(e.target.value)}
                  placeholder="e.g. LCP Enclosure gland plate material change to non-magnetic brass plate"
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Change / Marine Requirement</label>
                <textarea
                  rows={2}
                  required
                  value={reasonForChange}
                  onChange={e => setReasonForChange(e.target.value)}
                  placeholder="Explain reason (e.g. IRS / LRS surveyor requirement, shipyard IAS feedback)..."
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Impact Analysis</label>
                <textarea
                  rows={2}
                  value={impactAnalysis}
                  onChange={e => setImpactAnalysis(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onCloseCreateModal}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <i className="fa-solid fa-save" />
                  <span>Save Change & Apply Lifecycle Rules</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
