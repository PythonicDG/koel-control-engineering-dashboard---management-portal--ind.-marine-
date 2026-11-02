import React, { useState, useEffect } from 'react';
import { api, errorMessage } from '../api/client.ts';

export interface DrawingItem {
  id: string;
  drawingNumber: string;
  revision: string;
  title: string;
  projectCode: string;
  category: 'LCP Schematic' | 'Engine Wiring (EWH)' | 'Single Line Diagram (SLD)' | 'General Arrangement (GA)' | 'Junction Box';
  cadFormat: 'DWG' | 'PDF' | 'STEP' | 'DXF';
  plmReleaseStatus: 'Released in PLM' | 'Under Review' | 'Draft Pending';
  releaseDate: string;
  designer: string;
  approver: string;
  classificationApproval: 'Approved' | 'Submitted to Class' | 'Internal Only';
}

export const DrawingsMaster: React.FC = () => {
  const [drawings, setDrawings] = useState<DrawingItem[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.drawings
      .list()
      .then(rows => !cancelled && setDrawings(rows))
      .catch(err => !cancelled && setApiError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [drawingNumber, setDrawingNumber] = useState('');
  const [revision, setRevision] = useState('Rev A');
  const [title, setTitle] = useState('');
  const [projectCode, setProjectCode] = useState('KOEL-MAR-2026-001');
  const [category, setCategory] = useState<DrawingItem['category']>('LCP Schematic');
  const [cadFormat, setCadFormat] = useState<DrawingItem['cadFormat']>('DWG');
  const [plmReleaseStatus, setPlmReleaseStatus] = useState<DrawingItem['plmReleaseStatus']>('Released in PLM');

  const filtered = drawings.filter(d => {
    const matchesSearch =
      d.drawingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.projectCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || d.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleAddDrawing = async (e: React.FormEvent) => {
    setApiError(null);
    e.preventDefault();
    if (!drawingNumber || !title) return;

    const newDrawing: DrawingItem = {
      id: `dwg-${Date.now()}`,
      drawingNumber: drawingNumber.trim(),
      revision,
      title: title.trim(),
      projectCode,
      category,
      cadFormat,
      plmReleaseStatus,
      releaseDate: new Date().toISOString().split('T')[0],
      designer: 'Pooja Deshmukh',
      approver: 'Amesh Gadugale',
      classificationApproval: plmReleaseStatus === 'Released in PLM' ? 'Approved' : 'Submitted to Class',
    };

    try {
      const saved = await api.drawings.create(newDrawing);
      setDrawings(prev => [saved, ...prev]);
    } catch (err) {
      setApiError(errorMessage(err));
      return;
    }
    setIsModalOpen(false);

    // reset
    setDrawingNumber('');
    setTitle('');
  };

  return (
    <div className="space-y-6 max-w-[1720px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Drawing &amp; Wiring Master
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-teal-100 text-teal-800 rounded-full border border-teal-300">
              PLM Electrical &amp; Mechanical Schematics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Central repository of General Arrangement (GA), Single Line Diagrams (SLD), Engine Wiring Harnesses, and LCP control schematics
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer self-start md:self-auto"
        >
          <i className="fa-solid fa-plus text-xs" />
          <span>+ Release New Drawing</span>
        </button>
      </div>

      {apiError && (
        <div className="p-3 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 text-xs">{apiError}</div>
      )}

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Drawings</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{drawings.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Released in PLM</span>
          <div className="text-2xl font-bold text-emerald-800 mt-1">
            {drawings.filter(d => d.plmReleaseStatus === 'Released in PLM').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Under PLM Review</span>
          <div className="text-2xl font-bold text-amber-800 mt-1">
            {drawings.filter(d => d.plmReleaseStatus === 'Under Review').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Class Approved</span>
          <div className="text-2xl font-bold text-teal-800 mt-1">
            {drawings.filter(d => d.classificationApproval === 'Approved').length}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <i className="fa-solid fa-magnifying-glass text-xs" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search drawing number, title, project..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064e3b]"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Category:</label>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 font-medium"
          >
            <option value="ALL">All Categories</option>
            <option value="LCP Schematic">LCP Schematic</option>
            <option value="Engine Wiring (EWH)">Engine Wiring (EWH)</option>
            <option value="Single Line Diagram (SLD)">Single Line Diagram (SLD)</option>
            <option value="General Arrangement (GA)">General Arrangement (GA)</option>
            <option value="Junction Box">Junction Box</option>
          </select>
        </div>
      </div>

      {/* Drawings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Drawing No.</th>
                <th className="py-3 px-4">Revision</th>
                <th className="py-3 px-4">Drawing Title</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">CAD Format</th>
                <th className="py-3 px-4">PLM Status</th>
                <th className="py-3 px-4">Release Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-900">
                    {d.drawingNumber}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                    {d.revision}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs">
                    <div>{d.title}</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      By {d.designer} · Approved: {d.approver}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{d.projectCode}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {d.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold font-mono text-[10px] border border-blue-200">
                      {d.cadFormat}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                        d.plmReleaseStatus === 'Released in PLM'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : d.plmReleaseStatus === 'Under Review'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          d.plmReleaseStatus === 'Released in PLM'
                            ? 'bg-emerald-600'
                            : 'bg-amber-600'
                        }`}
                      />
                      {d.plmReleaseStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{d.releaseDate}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      className="px-2.5 py-1 text-[11px] font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-300 transition-colors cursor-pointer"
                    >
                      <i className="fa-solid fa-file-arrow-down mr-1" />
                      CAD
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 bg-[#064e3b] text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Release New Engineering Drawing</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-emerald-200 hover:text-white cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>
            <form onSubmit={handleAddDrawing} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Drawing Number *</label>
                  <input
                    type="text"
                    required
                    value={drawingNumber}
                    onChange={e => setDrawingNumber(e.target.value)}
                    placeholder="e.g. DWG/KOEL-MAR/LCP-821-02"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Revision</label>
                  <input
                    type="text"
                    required
                    value={revision}
                    onChange={e => setRevision(e.target.value)}
                    placeholder="e.g. Rev A"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Drawing Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Engine Room Local Control Panel Front Fascia & Cable Entry"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Project Code</label>
                  <select
                    value={projectCode}
                    onChange={e => setProjectCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="KOEL-MAR-2026-001">KOEL-MAR-2026-001</option>
                    <option value="KOEL-MAR-2026-002">KOEL-MAR-2026-002</option>
                    <option value="KOEL-MAR-2026-003">KOEL-MAR-2026-003</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="LCP Schematic">LCP Schematic</option>
                    <option value="Engine Wiring (EWH)">Engine Wiring (EWH)</option>
                    <option value="Single Line Diagram (SLD)">Single Line Diagram (SLD)</option>
                    <option value="General Arrangement (GA)">General Arrangement (GA)</option>
                    <option value="Junction Box">Junction Box</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CAD Format</label>
                  <select
                    value={cadFormat}
                    onChange={e => setCadFormat(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="DWG">AutoCAD (.DWG)</option>
                    <option value="PDF">Engineering PDF (.PDF)</option>
                    <option value="STEP">3D Model (.STEP)</option>
                    <option value="DXF">2D DXF (.DXF)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PLM Release Status</label>
                  <select
                    value={plmReleaseStatus}
                    onChange={e => setPlmReleaseStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Released in PLM">Released in PLM</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Draft Pending">Draft Pending</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-lg font-bold cursor-pointer"
                >
                  Save &amp; Release Drawing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
