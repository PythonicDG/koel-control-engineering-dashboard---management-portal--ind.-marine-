import React, { useState } from 'react';
import { AlternatorCatalogItem } from '../types/index.ts';

interface AlternatorMasterProps {
  alternators: AlternatorCatalogItem[];
  onAddAlternator: (item: AlternatorCatalogItem) => void;
}

export const AlternatorMaster: React.FC<AlternatorMasterProps> = ({
  alternators,
  onAddAlternator,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [seriesFilter, setSeriesFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Alternator form state
  const [model, setModel] = useState('');
  const [series, setSeries] = useState('4BM Marine Series');
  const [ratingKva, setRatingKva] = useState(400);
  const [voltageV, setVoltageV] = useState(415);
  const [frequencyHz, setFrequencyHz] = useState(50);
  const [rpm, setRpm] = useState(1500);
  const [frameSize, setFrameSize] = useState('4BM-355');
  const [ipProtection, setIpProtection] = useState('IP23');
  const [efficiencyPct, setEfficiencyPct] = useState(94.5);
  const [cooling, setCooling] = useState('IC01 Screen Protected');
  const [weightKg, setWeightKg] = useState(1650);

  const filteredAlternators = alternators.filter(item => {
    const matchesSearch =
      item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.series.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.frameSize.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeries = seriesFilter === 'ALL' || item.series.includes(seriesFilter);
    return matchesSearch && matchesSeries;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!model.trim()) return;

    const newItem: AlternatorCatalogItem = {
      id: `alt-${Date.now()}`,
      model: model.trim(),
      series,
      ratingKva: Number(ratingKva),
      voltageV: Number(voltageV),
      frequencyHz: Number(frequencyHz),
      rpm: Number(rpm),
      frameSize: frameSize.trim(),
      ipProtection,
      efficiencyPct: Number(efficiencyPct),
      cooling,
      weightKg: Number(weightKg),
      marineApprovedSocieties: ['IRS', 'LRS', 'ABS', 'DNV'],
    };

    onAddAlternator(newItem);
    setIsModalOpen(false);
    setModel('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Alternator Master
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded">
              KOEL Marine Catalog DB
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Standard 4BM, 4CM, and 6BM Marine Synchronous Alternator frames, ratings and classification type approvals
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start md:self-auto"
        >
          <i className="fa-solid fa-plus text-xs" />
          <span>+ Add Alternator Model to DB</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <i className="fa-solid fa-magnifying-glass text-xs" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search model, frame size, or series..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
          />
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto text-xs">
          <span className="text-slate-500 font-medium">Filter Series:</span>
          <select
            value={seriesFilter}
            onChange={e => setSeriesFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none"
          >
            <option value="ALL">All Series</option>
            <option value="4BM">4BM Marine Series</option>
            <option value="4CM">4CM Heavy Marine Series</option>
            <option value="6BM">6BM Medium Speed</option>
          </select>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAlternators.map(alt => (
          <div
            key={alt.id}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
                  {alt.series}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{alt.model}</h3>
              </div>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
                {alt.ratingKva} kVA
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono">
              <div>
                <span className="text-slate-400 text-[10px] block font-sans">VOLTAGE & SPEED</span>
                <span className="font-semibold text-slate-800">{alt.voltageV}V / {alt.rpm} RPM</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-sans">FREQUENCY & IP</span>
                <span className="font-semibold text-slate-800">{alt.frequencyHz}Hz / {alt.ipProtection}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-sans">FRAME SIZE</span>
                <span className="font-semibold text-slate-800">{alt.frameSize}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-sans">EFFICIENCY</span>
                <span className="font-semibold text-emerald-700">{alt.efficiencyPct}%</span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="text-slate-600">
                <strong>Cooling:</strong> {alt.cooling}
              </div>
              <div className="text-slate-600">
                <strong>Weight:</strong> {alt.weightKg} kg
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Class Society Type Approvals:
              </span>
              <div className="flex flex-wrap gap-1">
                {alt.marineApprovedSocieties.map(soc => (
                  <span
                    key={soc}
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200"
                  >
                    {soc}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add Alternator to Catalog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Add KOEL Alternator Model to Database</h3>
                <p className="text-xs text-emerald-100 mt-0.5">Configure ratings, frame size and cooling topology</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-emerald-200 hover:text-white"
              >
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Model Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KOEL 4BM-355-M4"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Series</label>
                  <select
                    value={series}
                    onChange={e => setSeries(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  >
                    <option value="4BM Marine Series">4BM Marine Series</option>
                    <option value="4CM Heavy Marine Series">4CM Heavy Marine Series</option>
                    <option value="6BM Medium Speed Marine">6BM Medium Speed Marine</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Frame Size</label>
                  <input
                    type="text"
                    required
                    value={frameSize}
                    onChange={e => setFrameSize(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rating kVA</label>
                  <input
                    type="number"
                    value={ratingKva}
                    onChange={e => setRatingKva(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Voltage (V)</label>
                  <input
                    type="number"
                    value={voltageV}
                    onChange={e => setVoltageV(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Speed (RPM)</label>
                  <input
                    type="number"
                    value={rpm}
                    onChange={e => setRpm(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Frequency (Hz)</label>
                  <select
                    value={frequencyHz}
                    onChange={e => setFrequencyHz(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  >
                    <option value={50}>50 Hz</option>
                    <option value={60}>60 Hz</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">IP Rating</label>
                  <select
                    value={ipProtection}
                    onChange={e => setIpProtection(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  >
                    <option value="IP23">IP23</option>
                    <option value="IP44">IP44</option>
                    <option value="IP54">IP54</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Efficiency (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={efficiencyPct}
                    onChange={e => setEfficiencyPct(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cooling Type</label>
                  <input
                    type="text"
                    value={cooling}
                    onChange={e => setCooling(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dry Weight (kg)</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={e => setWeightKg(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Model to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
