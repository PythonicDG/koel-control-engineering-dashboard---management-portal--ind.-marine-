import React, { useState, useEffect } from 'react';
import { api, errorMessage } from '../api/client.ts';

export interface TrialRecord {
  id: string;
  trialCode: string;
  projectCode: string;
  vesselName: string;
  trialType: 'FAT' | 'HAT' | 'SAT (Sea Trial)';
  date: string;
  shipyard: string;
  classificationSociety: string;
  surveyorName: string;
  loadTestProfile: string;
  voltageDipPct: number;
  frequencyRecoverySec: number;
  oilPressureBar: number;
  coolingWaterTempC: number;
  status: 'Passed & Stamped' | 'Conditional Approval' | 'Under Observation';
  remarks: string;
}

export const TrialsMaster: React.FC = () => {
  const [trials, setTrials] = useState<TrialRecord[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.trials
      .list()
      .then(rows => !cancelled && setTrials(rows))
      .catch(err => !cancelled && setApiError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New trial form state
  const [projectCode, setProjectCode] = useState('KOEL-MAR-2026-001');
  const [vesselName, setVesselName] = useState('');
  const [trialType, setTrialType] = useState<'FAT' | 'HAT' | 'SAT (Sea Trial)'>('SAT (Sea Trial)');
  const [shipyard, setShipyard] = useState('');
  const [classificationSociety, setClassificationSociety] = useState('IRS');
  const [surveyorName, setSurveyorName] = useState('');
  const [loadTestProfile, setLoadTestProfile] = useState('');
  const [voltageDipPct, setVoltageDipPct] = useState(11.5);
  const [status, setStatus] = useState<'Passed & Stamped' | 'Conditional Approval' | 'Under Observation'>('Passed & Stamped');
  const [remarks, setRemarks] = useState('');

  const filtered = trials.filter(t => {
    const matchesSearch =
      t.trialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.projectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.vesselName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.shipyard.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || t.trialType === filterType;
    return matchesSearch && matchesType;
  });

  const handleAddTrial = async (e: React.FormEvent) => {
    setApiError(null);
    e.preventDefault();
    if (!vesselName || !shipyard) return;

    const newRecord: TrialRecord = {
      id: `tr-${Date.now()}`,
      trialCode: `${trialType.slice(0, 3)}-MAR-2026-${String(trials.length + 1).padStart(3, '0')}`,
      projectCode,
      vesselName,
      trialType,
      date: new Date().toISOString().split('T')[0],
      shipyard,
      classificationSociety,
      surveyorName: surveyorName || 'Attending Class Surveyor',
      loadTestProfile: loadTestProfile || '100% Continuous PRP Load Test with AVR transient recording',
      voltageDipPct,
      frequencyRecoverySec: 1.0,
      oilPressureBar: 4.8,
      coolingWaterTempC: 38,
      status,
      remarks: remarks || 'All parameters within classification society tolerances.',
    };

    try {
      const saved = await api.trials.create(newRecord);
      setTrials(prev => [saved, ...prev]);
    } catch (err) {
      setApiError(errorMessage(err));
      return;
    }
    setIsModalOpen(false);

    // reset
    setVesselName('');
    setShipyard('');
    setSurveyorName('');
    setLoadTestProfile('');
    setRemarks('');
  };

  return (
    <div className="space-y-6 max-w-[1720px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              FAT &amp; Sea Trials Record
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
              Marine Acceptance Testing Log
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official record of Factory Acceptance Trials (FAT), Harbour Acceptance Trials (HAT), and Sea Trials (SAT) with class society endorsements
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer self-start md:self-auto"
        >
          <i className="fa-solid fa-plus text-xs" />
          <span>+ Log New Trial / FAT Record</span>
        </button>
      </div>

      {apiError && (
        <div className="p-3 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 text-xs">{apiError}</div>
      )}

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Logged Trials</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{trials.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Sea Trials (SAT)</span>
          <div className="text-2xl font-bold text-emerald-800 mt-1">
            {trials.filter(t => t.trialType.includes('SAT')).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Harbour Acceptance (HAT)</span>
          <div className="text-2xl font-bold text-teal-800 mt-1">
            {trials.filter(t => t.trialType === 'HAT').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Factory Testing (FAT)</span>
          <div className="text-2xl font-bold text-blue-800 mt-1">
            {trials.filter(t => t.trialType === 'FAT').length}
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
            placeholder="Search trial code, vessel, shipyard..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064e3b]"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Type:</label>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 font-medium"
          >
            <option value="ALL">All Trial Types</option>
            <option value="SAT (Sea Trial)">Sea Trials (SAT)</option>
            <option value="HAT">Harbour Trials (HAT)</option>
            <option value="FAT">Factory Acceptance (FAT)</option>
          </select>
        </div>
      </div>

      {/* Trials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(t => (
          <div
            key={t.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-3.5"
          >
            <div>
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {t.trialCode}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                    {t.vesselName}
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">{t.projectCode}</div>
                </div>

                <span
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase shrink-0 ${
                    t.status === 'Passed & Stamped'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {t.status}
                </span>
              </div>

              <div className="space-y-2 mt-3 text-xs">
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Class Society</span>
                    <span className="font-bold text-slate-800">{t.classificationSociety}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Surveyor</span>
                    <span className="font-semibold text-slate-800 truncate block">{t.surveyorName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Transient Dip</span>
                    <span className="font-mono font-bold text-slate-800">{t.voltageDipPct}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Recovery</span>
                    <span className="font-mono font-bold text-slate-800">{t.frequencyRecoverySec} s</span>
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-[11px] font-bold text-slate-700 block">Testing Scope:</span>
                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{t.loadTestProfile}</p>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-700 block">Surveyor Remarks:</span>
                  <p className="text-[11px] text-slate-600 italic line-clamp-2 mt-0.5">{t.remarks}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>{t.shipyard}</span>
              <span className="font-mono">{t.date}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 bg-[#064e3b] text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Record Marine Trial / FAT Log</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-emerald-200 hover:text-white cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>
            <form onSubmit={handleAddTrial} className="p-6 space-y-4 text-xs">
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
                  <label className="block font-bold text-slate-700 mb-1">Trial Type</label>
                  <select
                    value={trialType}
                    onChange={e => setTrialType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="SAT (Sea Trial)">SAT (Sea Trial)</option>
                    <option value="HAT">HAT (Harbour Acceptance)</option>
                    <option value="FAT">FAT (Factory Acceptance)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Vessel / Yard Name *</label>
                <input
                  type="text"
                  required
                  value={vesselName}
                  onChange={e => setVesselName(e.target.value)}
                  placeholder="e.g. Naval Patrol Craft / Yard 1264"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shipyard / Location *</label>
                  <input
                    type="text"
                    required
                    value={shipyard}
                    onChange={e => setShipyard(e.target.value)}
                    placeholder="e.g. Mazagon Dock / Cochin Shipyard"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Class Society</label>
                  <select
                    value={classificationSociety}
                    onChange={e => setClassificationSociety(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="IRS">IRS</option>
                    <option value="LRS">LRS</option>
                    <option value="DNV">DNV</option>
                    <option value="ABS">ABS</option>
                    <option value="ClassNK">ClassNK</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Surveyor Name</label>
                  <input
                    type="text"
                    value={surveyorName}
                    onChange={e => setSurveyorName(e.target.value)}
                    placeholder="e.g. Mr. S. Nair"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Voltage Dip (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={voltageDipPct}
                    onChange={e => setVoltageDipPct(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Load Test Scope</label>
                <input
                  type="text"
                  value={loadTestProfile}
                  onChange={e => setLoadTestProfile(e.target.value)}
                  placeholder="e.g. 100% full rating step load + overload test"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Surveyor Remarks &amp; Endorsement</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Class surveyor observations and endorsement status..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
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
                  Save Trial Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
