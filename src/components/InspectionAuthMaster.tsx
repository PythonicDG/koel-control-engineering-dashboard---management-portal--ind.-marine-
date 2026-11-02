import React, { useState } from 'react';
import { InspectionAuthority } from '../types/index.ts';

interface InspectionAuthMasterProps {
  authorities: InspectionAuthority[];
  onUpdateAuthority: (updated: InspectionAuthority) => void;
}

export const InspectionAuthMaster: React.FC<InspectionAuthMasterProps> = ({
  authorities,
  onUpdateAuthority,
}) => {
  const [selectedAuth, setSelectedAuth] = useState<InspectionAuthority | null>(authorities[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [tempRiseInput, setTempRiseInput] = useState('');
  const [witnessInput, setWitnessInput] = useState('');
  const [ruleDocName, setRuleDocName] = useState('');

  const handleSelect = (auth: InspectionAuthority) => {
    setSelectedAuth(auth);
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    if (!selectedAuth) return;
    setTempRiseInput(selectedAuth.standardTempRiseLimits);
    setWitnessInput(selectedAuth.witnessTestingRequirements);
    setRuleDocName(selectedAuth.officialRuleDocumentName);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selectedAuth) return;
    const updated: InspectionAuthority = {
      ...selectedAuth,
      standardTempRiseLimits: tempRiseInput,
      witnessTestingRequirements: witnessInput,
      officialRuleDocumentName: ruleDocName,
    };
    onUpdateAuthority(updated);
    setSelectedAuth(updated);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Inspection Auth Master
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-800 rounded">
              Marine Classification Societies Directory
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Rules, surveyor witness testing protocols, temperature rise limits, and class manuals
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Authority Selector Cards (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Classification Societies
          </div>
          {authorities.map(auth => {
            const isSelected = selectedAuth?.id === auth.id;
            return (
              <div
                key={auth.id}
                onClick={() => handleSelect(auth)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-700 bg-blue-50/70 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-9 h-9 rounded-lg font-bold font-mono text-sm flex items-center justify-center ${
                        isSelected
                          ? 'bg-blue-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {auth.code}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{auth.code}</h4>
                      <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{auth.fullName}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">{auth.country}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Authority Details, Rules and PDF attachments (8 cols) */}
        <div className="lg:col-span-8">
          {selectedAuth ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-700 text-white font-mono font-extrabold text-xl flex items-center justify-center shadow-xs">
                    {selectedAuth.code}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selectedAuth.fullName}</h2>
                    <p className="text-xs text-slate-500">
                      Headquarters: {selectedAuth.country} · Contact: {selectedAuth.contactRepresentative}
                    </p>
                  </div>
                </div>

                {!isEditing ? (
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold self-start sm:self-auto cursor-pointer"
                  >
                    <i className="fa-solid fa-pen-to-square mr-1 text-slate-500" />
                    Edit Class Rules
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold"
                    >
                      Save Rules
                    </button>
                  </div>
                )}
              </div>

              {/* Rules Edition */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Applicable Marine Rules Specification
                </span>
                <p className="text-xs font-semibold text-slate-800">
                  {selectedAuth.marineRulesEdition}
                </p>
              </div>

              {/* Standard Temperature Rise Limits */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <i className="fa-solid fa-temperature-half text-amber-600" />
                  <span>Standard Temperature Rise Limits for Marine Gensets</span>
                </span>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={tempRiseInput}
                    onChange={e => setTempRiseInput(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  />
                ) : (
                  <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200/80 leading-relaxed">
                    {selectedAuth.standardTempRiseLimits}
                  </p>
                )}
              </div>

              {/* Witness Testing Requirements */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <i className="fa-solid fa-clipboard-check text-emerald-600" />
                  <span>Class Surveyor Witness Testing & FAT Protocol</span>
                </span>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={witnessInput}
                    onChange={e => setWitnessInput(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  />
                ) : (
                  <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200/80 leading-relaxed">
                    {selectedAuth.witnessTestingRequirements}
                  </p>
                )}
              </div>

              {/* Official Class Rule PDF Manual Attachment Options */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <i className="fa-solid fa-file-pdf text-rose-600" />
                  <span>Class Rule PDF Manual Attachment</span>
                </span>

                {isEditing ? (
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Attached PDF File Name</label>
                    <input
                      type="text"
                      value={ruleDocName}
                      onChange={e => setRuleDocName(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                        <i className="fa-solid fa-file-pdf text-lg" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          {selectedAuth.officialRuleDocumentName}
                        </div>
                        <div className="text-[11px] text-slate-500">Official Marine Standard · PDF Attachment</div>
                      </div>
                    </div>

                    <a
                      href="/assets/aistudio/logo_b5b9411a.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square text-xs text-blue-600" />
                      <span>Inspect Rule PDF</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              Select a classification society to view rule details and surveyor witness protocols.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
