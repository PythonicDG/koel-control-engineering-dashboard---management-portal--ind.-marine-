import React, { useState } from 'react';
import { Project } from '../types/index.ts';
import { getStructured53DesignInputs, exportProjectToPdf, exportProjectToExcel } from '../utils/projectExport.ts';

interface ProjectDossierModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectDossierModal: React.FC<ProjectDossierModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !project) return null;

  const [activeTab, setActiveTab] = useState<number>(0); // 0 = All Chapters, 1..6 = Specific Chapter
  const [filterText, setFilterText] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const items = getStructured53DesignInputs(project.designInputs);

  const filteredItems = items.filter(it => {
    const matchesTab = activeTab === 0 || it.chapterNumber === activeTab;
    const matchesText =
      filterText.trim() === '' ||
      it.parameterName.toLowerCase().includes(filterText.toLowerCase()) ||
      String(it.value).toLowerCase().includes(filterText.toLowerCase()) ||
      it.unitOrStandard.toLowerCase().includes(filterText.toLowerCase()) ||
      it.chapterTitle.toLowerCase().includes(filterText.toLowerCase());

    return matchesTab && matchesText;
  });

  const handleCopyAll = () => {
    const textData = items
      .map(it => `[Ch.${it.chapterNumber}] ${it.seq}. ${it.parameterName}: ${it.value} (${it.unitOrStandard})`)
      .join('\n');
    navigator.clipboard.writeText(textData);
    setCopyFeedback('Copied all 53 design input specifications to clipboard!');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="53 Design Inputs Specification Dossier"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0c4a8a] to-[#07244a] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <i className="fa-solid fa-file-contract text-lg text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  53 Design Inputs Engineering Dossier
                </h2>
                <span className="text-[11px] font-mono bg-white/20 px-2 py-0.5 rounded text-white font-semibold">
                  {project.projectCode}
                </span>
              </div>
              <p className="text-xs text-blue-100/80">
                {project.designInputs.projectName} · {project.designInputs.customerName} (Yard: {project.designInputs.yardNumber})
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportProjectToPdf(project)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download formatted PDF Document"
            >
              <i className="fa-solid fa-file-pdf text-xs" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>

            <button
              type="button"
              onClick={() => exportProjectToExcel(project)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download formatted Excel Workbook (.xlsx)"
            >
              <i className="fa-solid fa-file-excel text-xs" />
              <span className="hidden sm:inline">Export Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print Dossier"
            >
              <i className="fa-solid fa-print text-xs" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer ml-2"
              aria-label="Close modal"
            >
              <i className="fa-solid fa-xmark text-sm" />
            </button>
          </div>
        </div>

        {/* Filter & Chapter Tabs Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between shrink-0">
          {/* Chapter Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab(0)}
              className={`px-2.5 py-1.5 rounded-lg font-semibold shrink-0 cursor-pointer transition-colors ${
                activeTab === 0
                  ? 'bg-[#0c4a8a] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All 6 Chapters (53)
            </button>
            {[
              { num: 1, title: '1. General' },
              { num: 2, title: '2. Engine/DG' },
              { num: 3, title: '3. Class/Env' },
              { num: 4, title: '4. Electrical' },
              { num: 5, title: '5. Alternator' },
              { num: 6, title: '6. Panel/Auto' },
            ].map(ch => (
              <button
                key={ch.num}
                type="button"
                onClick={() => setActiveTab(ch.num)}
                className={`px-2.5 py-1.5 rounded-lg font-semibold shrink-0 cursor-pointer transition-colors ${
                  activeTab === ch.num
                    ? 'bg-[#0c4a8a] text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {ch.title}
              </button>
            ))}
          </div>

          {/* Search Filter & Copy Button */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-60">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <i className="fa-solid fa-magnifying-glass text-xs" />
              </span>
              <input
                type="text"
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                placeholder="Filter 53 parameters..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0c4a8a]"
              />
            </div>

            <button
              type="button"
              onClick={handleCopyAll}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fa-regular fa-copy text-xs" />
              <span>Copy All</span>
            </button>
          </div>
        </div>

        {/* Copy Feedback Alert */}
        {copyFeedback && (
          <div className="px-6 py-2 bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border-b border-emerald-200">
            <i className="fa-solid fa-circle-check text-emerald-600" />
            <span>{copyFeedback}</span>
          </div>
        )}

        {/* Content Body: Scrollable Dossier Table */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Executive Specification Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">DG Rating</div>
              <div className="font-bold text-slate-900 font-mono">
                {project.designInputs.dgRatingKva} kVA / {project.designInputs.dgRatingKwe} kWe
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Marine Class</div>
              <div className="font-bold text-slate-900">
                {project.designInputs.primaryClass}
                {project.designInputs.dualClass && ` / ${project.designInputs.dualClass}`}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Engine & Series</div>
              <div className="font-bold text-slate-900">
                {project.designInputs.engineSeries} ({project.designInputs.engineModel})
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">PLM Sub-Projects</div>
              <div className="font-bold text-emerald-700 font-mono">
                {project.subProjects.filter(s => s.plmStatus === 'Released in PLM').length} / {project.subProjects.length} Released ({project.progressPercent}%)
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0c4a8a]/5 text-slate-800 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3 w-36">Chapter</th>
                  <th className="py-2.5 px-4">Design Parameter</th>
                  <th className="py-2.5 px-4">Specified Technical Value</th>
                  <th className="py-2.5 px-4">Engineering Standard / Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => (
                  <tr key={item.seq} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 text-center font-mono text-slate-400 font-semibold">
                      {item.seq}
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        Ch. {item.chapterNumber}
                      </span>
                    </td>
                    <td className="py-2 px-4 font-semibold text-slate-900">
                      {item.parameterName}
                    </td>
                    <td className="py-2 px-4 font-mono font-bold text-[#0c4a8a]">
                      {String(item.value)}
                    </td>
                    <td className="py-2 px-4 text-slate-500 font-mono text-[11px]">
                      {item.unitOrStandard}
                    </td>
                  </tr>
                ))}

                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      No parameters match the current search filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Sub-Projects PLM Matrix */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <i className="fa-solid fa-diagram-project text-emerald-700" />
              <span>Associated Sub-Projects & PLM Release Status (Rule 2 Mandatory Gate)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {project.subProjects.map(sp => (
                <div
                  key={sp.id}
                  className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1 shadow-xs"
                >
                  <div className="font-bold text-slate-800 truncate">{sp.componentType}</div>
                  <div className="text-[11px] font-mono text-slate-500 truncate">
                    {sp.partOrGroupNumber || 'Pending Allocation'}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        sp.plmStatus === 'Released in PLM'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sp.plmStatus === 'In Review'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {sp.plmStatus}
                    </span>
                    <span className="text-[10px] text-slate-400">{sp.assignedEngineer.split(' ')[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
          <div>
            Showing <strong className="text-slate-800">{filteredItems.length}</strong> of 54 technical parameter inputs for <strong>{project.projectCode}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportProjectToPdf(project)}
              className="px-4 py-2 bg-[#0c4a8a] hover:bg-[#083563] text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-2"
            >
              <i className="fa-solid fa-file-pdf" />
              <span>Download Formatted PDF</span>
            </button>
            <button
              type="button"
              onClick={() => exportProjectToExcel(project)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-2"
            >
              <i className="fa-solid fa-file-excel" />
              <span>Download Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 font-semibold text-slate-700 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
