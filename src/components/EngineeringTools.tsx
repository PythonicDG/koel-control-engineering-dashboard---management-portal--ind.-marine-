import React, { useState } from 'react';
import {
  calculateAlternatorSizing,
  recommendCableAndGland,
  CABLE_MATRIX,
  AWG_GAUGE_TABLE,
  AlternatorSizingResult,
} from '../utils/engineering.ts';

export const EngineeringTools: React.FC = () => {
  // Sizing Calculator Inputs
  const [snKva, setSnKva] = useState<number>(500);
  const [vllVolts, setVllVolts] = useState<number>(415);
  const [powerFactor, setPowerFactor] = useState<number>(0.8);
  const [poles, setPoles] = useState<number>(4);
  const [frequencyHz, setFrequencyHz] = useState<number>(50);

  // Derating factor for cable calculation
  const [deratingFactor, setDeratingFactor] = useState<number>(0.85);

  // AWG search
  const [awgSearch, setAwgSearch] = useState<string>('');

  // Active Tool Tab
  const [activeTab, setActiveTab] = useState<'sizing' | 'cableMatrix' | 'awgTable'>('sizing');

  // Copied indicator
  const [copied, setCopied] = useState<boolean>(false);

  // Compute Alternator Sizing Results
  const sizingResult: AlternatorSizingResult = calculateAlternatorSizing({
    snKva,
    vllVolts,
    powerFactor,
    poles,
    frequencyHz,
  });

  // Recommended Cable
  const cableRecommendation = recommendCableAndGland(sizingResult.inAmperes, deratingFactor);

  const handleCopySpecs = () => {
    const text = `KOEL Marine Alternator Sizing Specifications:
• Sn (Apparent Power): ${snKva} kVA
• Line-to-Line Voltage: ${vllVolts} V @ ${frequencyHz} Hz
• Power Factor: ${powerFactor} (Phase angle: ${sizingResult.phaseAngleDeg}°)
• Poles: ${poles} Poles
• Synchronous Speed (Ns): ${sizingResult.nsRpm} RPM
• Active Power (Pn): ${sizingResult.pnKw} kW
• Reactive Power (Qn): ${sizingResult.qnKvar} kVAR
• Rated Full-Load Current (In): ${sizingResult.inAmperes} A
• Recommended Cable: ${cableRecommendation.cableCrossSectionSqMm} sq mm (${cableRecommendation.recommendedGlandSize} gland)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredAwg = AWG_GAUGE_TABLE.filter(item =>
    item.awg.toLowerCase().includes(awgSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Engineering Tools Suite
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded">
              Interactive Design Calculators
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            IEC 60034 / IEC 60092 compliant Alternator Sizing, Cable & Gland Matrix, and AWG Gauge Master
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('sizing')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'sizing' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            <i className="fa-solid fa-calculator mr-1.5" />
            Alternator Sizing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cableMatrix')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'cableMatrix' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            <i className="fa-solid fa-network-wired mr-1.5" />
            Cable & Gland Matrix
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('awgTable')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'awgTable' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            <i className="fa-solid fa-table-list mr-1.5" />
            AWG Wire Gauge Master
          </button>
        </div>
      </div>

      {/* TOOL 1: Alternator Sizing Calculator */}
      {activeTab === 'sizing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Panel (5 cols) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Interactive Alternator Parameters
                </h3>
                <p className="text-xs text-slate-500">
                  Input rated apparent power, voltage, power factor and poles
                </p>
              </div>

              {/* Sn kVA Input */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-semibold text-slate-700">
                  <label htmlFor="input-sn">Sn - Apparent Power (kVA)</label>
                  <span className="font-mono text-emerald-800">{snKva} kVA</span>
                </div>
                <input
                  id="input-sn"
                  type="number"
                  min={10}
                  max={2500}
                  value={snKva}
                  onChange={e => setSnKva(Math.max(1, Number(e.target.value)))}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs focus:ring-1 focus:ring-emerald-700"
                />
                <input
                  type="range"
                  min={50}
                  max={1500}
                  step={25}
                  value={snKva}
                  onChange={e => setSnKva(Number(e.target.value))}
                  className="w-full accent-emerald-700"
                />
              </div>

              {/* Vll Volts Input */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-semibold text-slate-700">
                  <label htmlFor="input-vll">Vll - Line-to-Line Voltage (V)</label>
                  <span className="font-mono text-emerald-800">{vllVolts} V</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[380, 415, 440].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVllVolts(v)}
                      className={`py-1.5 rounded-lg border font-mono font-semibold text-xs cursor-pointer ${
                        vllVolts === v
                          ? 'bg-emerald-800 text-white border-emerald-800'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {v} V
                    </button>
                  ))}
                </div>
              </div>

              {/* Power Factor (PF) */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-semibold text-slate-700">
                  <label htmlFor="input-pf">PF - Power Factor (cos φ)</label>
                  <span className="font-mono text-emerald-800">{powerFactor.toFixed(2)}</span>
                </div>
                <input
                  id="input-pf"
                  type="range"
                  min={0.5}
                  max={1.0}
                  step={0.01}
                  value={powerFactor}
                  onChange={e => setPowerFactor(Number(e.target.value))}
                  className="w-full accent-emerald-700"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0.50</span>
                  <span>0.80 (Standard Marine)</span>
                  <span>1.00</span>
                </div>
              </div>

              {/* Poles & Frequency */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Poles</label>
                  <select
                    value={poles}
                    onChange={e => setPoles(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  >
                    <option value={2}>2 Poles</option>
                    <option value={4}>4 Poles (Standard 1500/1800)</option>
                    <option value={6}>6 Poles (1000/1200)</option>
                    <option value={8}>8 Poles (750/900)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Frequency (Hz)</label>
                  <select
                    value={frequencyHz}
                    onChange={e => setFrequencyHz(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  >
                    <option value={50}>50 Hz</option>
                    <option value={60}>60 Hz</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Output Calculated Results Panel (7 cols) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Synchronous Alternator Sizing Results
                    </h3>
                    <p className="text-xs text-slate-500">
                      Standard electro-mechanical formulas dynamically evaluated
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopySpecs}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <i className={`fa-solid ${copied ? 'fa-check text-emerald-600' : 'fa-copy'}`} />
                    <span>{copied ? 'Copied Specs!' : 'Copy Specs'}</span>
                  </button>
                </div>

                {/* 4 Core Results Display Cards */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {/* Result 1: Ns (rpm) */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                      Synchronous Speed (Ns)
                    </span>
                    <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
                      {sizingResult.nsRpm} <span className="text-sm font-sans font-medium text-slate-500">RPM</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block mt-1">
                      Formula: (120 × f) / P = (120 × {frequencyHz}) / {poles}
                    </span>
                  </div>

                  {/* Result 2: Pn (kW) */}
                  <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200">
                    <span className="text-[11px] font-bold text-emerald-800 block uppercase tracking-wider">
                      Active Power (Pn)
                    </span>
                    <div className="text-2xl font-extrabold text-emerald-800 font-mono mt-1">
                      {sizingResult.pnKw} <span className="text-sm font-sans font-medium text-emerald-700">kW</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-mono block mt-1">
                      Formula: Sn × cos φ = {snKva} × {powerFactor}
                    </span>
                  </div>

                  {/* Result 3: Qn (kVAR) */}
                  <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200">
                    <span className="text-[11px] font-bold text-blue-800 block uppercase tracking-wider">
                      Reactive Power (Qn)
                    </span>
                    <div className="text-2xl font-extrabold text-blue-800 font-mono mt-1">
                      {sizingResult.qnKvar} <span className="text-sm font-sans font-medium text-blue-700">kVAR</span>
                    </div>
                    <span className="text-[10px] text-blue-600 font-mono block mt-1">
                      Formula: Sn × sin φ (φ = {sizingResult.phaseAngleDeg}°)
                    </span>
                  </div>

                  {/* Result 4: In (A) */}
                  <div className="p-4 bg-purple-50/70 rounded-xl border border-purple-200">
                    <span className="text-[11px] font-bold text-purple-800 block uppercase tracking-wider">
                      Rated Line Current (In)
                    </span>
                    <div className="text-2xl font-extrabold text-purple-800 font-mono mt-1">
                      {sizingResult.inAmperes} <span className="text-sm font-sans font-medium text-purple-700">A</span>
                    </div>
                    <span className="text-[10px] text-purple-600 font-mono block mt-1">
                      Formula: (Sn × 1000) / (√3 × Vll)
                    </span>
                  </div>
                </div>

                {/* Direct Linkage to Cable Recommendation */}
                <div className="mt-4 p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      Recommended Marine Feeder Cable
                    </span>
                    <div className="text-sm font-bold">
                      {cableRecommendation.cableCrossSectionSqMm} sq mm Copper XLPE / EPR Armoured
                    </div>
                    <div className="text-xs text-slate-400">
                      Gland Size: <strong className="text-white font-mono">{cableRecommendation.recommendedGlandSize}</strong> · Max Current: <strong className="text-white font-mono">{cableRecommendation.maxCurrentRatingA} A</strong> (derated 0.85)
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('cableMatrix')}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer"
                  >
                    View Cable Matrix →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOOL 2: Cable & Gland Sizing Matrix */}
      {activeTab === 'cableMatrix' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Marine Grade XLPE/EPR Armoured Cable & Gland Matrix (IEC 60092-352)
              </h3>
              <p className="text-xs text-slate-500">
                Continuous current-carrying ampacities at 45°C ambient with marine gland sizing
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Ambient Derating Factor:</span>
              <select
                value={deratingFactor}
                onChange={e => setDeratingFactor(Number(e.target.value))}
                className="border border-slate-300 rounded px-2 py-1 font-mono text-xs bg-white"
              >
                <option value={0.80}>0.80 (50°C Engine Room)</option>
                <option value={0.85}>0.85 (45°C Standard Marine)</option>
                <option value={0.90}>0.90 (40°C Switchboard Room)</option>
                <option value={1.00}>1.00 (Nominal 30°C)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 text-slate-700 font-bold font-sans border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Cable Cross-Section (mm²)</th>
                  <th className="py-2.5 px-4">Recommended Gland Size</th>
                  <th className="py-2.5 px-4">Base Ampacity (A)</th>
                  <th className="py-2.5 px-4">Derated Capacity ({deratingFactor}x)</th>
                  <th className="py-2.5 px-4">Voltage Drop (mV/A/m)</th>
                  <th className="py-2.5 px-4">Status for {sizingResult.inAmperes} A</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {CABLE_MATRIX.map(c => {
                  const deratedCap = Math.round(c.maxCurrentRatingA * deratingFactor);
                  const isRecommended = c.cableCrossSectionSqMm === cableRecommendation.cableCrossSectionSqMm;
                  const isSufficient = deratedCap >= sizingResult.inAmperes;

                  return (
                    <tr
                      key={c.cableCrossSectionSqMm}
                      className={isRecommended ? 'bg-emerald-50 font-bold' : 'hover:bg-slate-50'}
                    >
                      <td className="py-2.5 px-4 text-slate-800">
                        {c.cableCrossSectionSqMm} mm²
                        {isRecommended && (
                          <span className="ml-2 font-sans text-[10px] bg-emerald-700 text-white px-1.5 py-0.5 rounded">
                            Recommended
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{c.recommendedGlandSize}</td>
                      <td className="py-2.5 px-4 text-slate-600">{c.maxCurrentRatingA} A</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{deratedCap} A</td>
                      <td className="py-2.5 px-4 text-slate-600">{c.voltageDropPerMeterMv} mV</td>
                      <td className="py-2.5 px-4 font-sans">
                        {isSufficient ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <i className="fa-solid fa-circle-check text-xs" />
                            <span>Compliant</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">Underrated</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TOOL 3: AWG Wire Gauge Master */}
      {activeTab === 'awgTable' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                AWG (American Wire Gauge) Master Engineering Table
              </h3>
              <p className="text-xs text-slate-500">
                Wire conductor diameters, cross-sectional areas, resistance and marine ampacity ratings
              </p>
            </div>

            <div className="w-full sm:w-64 relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <i className="fa-solid fa-magnifying-glass text-xs" />
              </span>
              <input
                type="text"
                value={awgSearch}
                onChange={e => setAwgSearch(e.target.value)}
                placeholder="Search gauge (e.g. 4/0, 2 AWG, 10)..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 text-slate-700 font-bold font-sans border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">AWG Gauge</th>
                  <th className="py-2.5 px-4">Conductor Diameter (mm)</th>
                  <th className="py-2.5 px-4">Cross-Sectional Area (mm²)</th>
                  <th className="py-2.5 px-4">DC Resistance @ 20°C (Ω/km)</th>
                  <th className="py-2.5 px-4">Max Ampacity Marine 75°C (A)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAwg.map(row => (
                  <tr key={row.awg} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{row.awg}</td>
                    <td className="py-2.5 px-4 text-slate-700">{row.diameterMm} mm</td>
                    <td className="py-2.5 px-4 text-slate-700">{row.areaSqMm} mm²</td>
                    <td className="py-2.5 px-4 text-slate-700">{row.copperResistanceOhmPerKm} Ω/km</td>
                    <td className="py-2.5 px-4 font-bold text-emerald-800">{row.maxAmpacityMarineA} A</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
