import React, { useState } from 'react';
import { SiteVisit, User, FormFieldConfig } from '../types/index.ts';

interface SiteVisitMasterProps {
  siteVisits: SiteVisit[];
  onAddSiteVisit: (newVisit: SiteVisit) => void;
  users?: User[];
  formFields?: FormFieldConfig[];
  currentUser?: User | null;
  onOpenFormSettings?: () => void;
}

export const SiteVisitMaster: React.FC<SiteVisitMasterProps> = ({
  siteVisits,
  onAddSiteVisit,
  users = [],
  formFields = [],
  currentUser,
  onOpenFormSettings,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [shipyardName, setShipyardName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [vesselYardNumber, setVesselYardNumber] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [engineerName, setEngineerName] = useState(users[0]?.fullName || 'Rajesh Kulkarni');
  const [purpose, setPurpose] = useState('');
  const [findings, setFindings] = useState('');
  const [actionItems, setActionItems] = useState('');
  const [uploadedDocumentName, setUploadedDocumentName] = useState('');
  const [status, setStatus] = useState<'Scheduled' | 'Completed' | 'Pending Follow-up'>('Completed');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  const isFieldMandatory = (fieldKey: string, defaultMandatory: boolean = false): boolean => {
    const config = formFields.find(f => f.formId === 'siteVisit' && f.fieldKey === fieldKey);
    return config ? config.isMandatory : defaultMandatory;
  };

  const customFields = formFields.filter(f => f.formId === 'siteVisit' && f.isCustom);

  const filteredVisits = siteVisits.filter(v =>
    v.shipyardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.vesselYardNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.engineerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipyardName.trim() || !purpose.trim()) return;

    const newVisit: SiteVisit = {
      id: `sv-${Date.now()}`,
      visitDate,
      shipyardName: shipyardName.trim(),
      customerName: customerName.trim() || 'Shipyard Technical Cell',
      vesselYardNumber: vesselYardNumber.trim() || 'Yard Inspection',
      engineerName: engineerName.trim() || 'Marine Field Engineer',
      purpose: purpose.trim(),
      findings: findings.trim() || 'All critical interfaces verified compliant with KOEL marine guidelines.',
      actionItems: actionItems.trim() || 'Proceed with shipyard commissioning protocol.',
      uploadedDocumentName: uploadedDocumentName.trim() || 'Site_Inspection_Report.pdf',
      status,
    };

    onAddSiteVisit(newVisit);
    setViewMode('list');

    // Reset fields
    setShipyardName('');
    setCustomerName('');
    setVesselYardNumber('');
    setPurpose('');
    setFindings('');
    setActionItems('');
    setUploadedDocumentName('');
    setCustomFieldValues({});
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Site Visit Record
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded">
              Yard & Ship Inspection Database
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Log engineering presence, alignment checks, FAT witness logs, and sea trial telemetry
          </p>
        </div>

        {viewMode === 'list' ? (
          <button
            type="button"
            onClick={() => setViewMode('create')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-800 hover:bg-indigo-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start md:self-auto"
          >
            <i className="fa-solid fa-plus text-xs" />
            <span>+ Log Customer / Shipyard Visit</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer self-start md:self-auto"
          >
            <i className="fa-solid fa-arrow-left text-xs" />
            <span>← Back to All Visit Records</span>
          </button>
        )}
      </div>

      {/* VIEW MODE 1: In-Window Form (No Popups!) */}
      {viewMode === 'create' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8 space-y-6">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <i className="fa-solid fa-clipboard-user text-indigo-700" />
                <span>Log New Customer / Shipyard Site Visit Record</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Record field telemetry, alignment protocols, and surveyor observations directly in the main window
              </p>
            </div>
            <div className="flex items-center gap-2">
              {currentUser?.role === 'admin' && (
                <button
                  type="button"
                  onClick={onOpenFormSettings}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Form Settings & Mandatory Field Configuration (Admin only)"
                >
                  <i className="fa-solid fa-sliders text-purple-700 text-xs" />
                  <span>Form Settings</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Visit Date {isFieldMandatory('visitDate', true) && <span className="text-rose-600">*</span>}
                </label>
                <input
                  type="date"
                  required={isFieldMandatory('visitDate', true)}
                  value={visitDate}
                  onChange={e => setVisitDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-700/20 focus:border-indigo-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Visit Status {isFieldMandatory('status', true) && <span className="text-rose-600">*</span>}
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-indigo-700/20 focus:border-indigo-700 focus:outline-none"
                >
                  <option value="Completed">Completed</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Pending Follow-up">Pending Follow-up</option>
                </select>
              </div>

              {/* DYNAMIC USER DROPDOWN for Attending Engineer */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Attending / Responsible Engineer {isFieldMandatory('engineerName', true) && <span className="text-rose-600">*</span>}
                </label>
                <select
                  required={isFieldMandatory('engineerName', true)}
                  value={engineerName}
                  onChange={e => setEngineerName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-indigo-700/20 focus:border-indigo-700 focus:outline-none"
                >
                  {users.length > 0 ? (
                    users.map(u => (
                      <option key={u.id} value={u.fullName}>
                        {u.fullName} ({u.role.toUpperCase()})
                      </option>
                    ))
                  ) : (
                    <option value="Rajesh Kulkarni">Rajesh Kulkarni (ENGINEER)</option>
                  )}
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Dynamically populated from system users
                </span>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Shipyard / Facility Location Name {isFieldMandatory('shipyardName', true) && <span className="text-rose-600">*</span>}
                </label>
                <input
                  type="text"
                  required={isFieldMandatory('shipyardName', true)}
                  placeholder="e.g. Mazagon Dock Shipbuilders Limited (MDL), Mumbai"
                  value={shipyardName}
                  onChange={e => setShipyardName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-700/20 focus:border-indigo-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Vessel / Yard Hull No. {isFieldMandatory('vesselYardNumber', true) && <span className="text-rose-600">*</span>}
                </label>
                <input
                  type="text"
                  required={isFieldMandatory('vesselYardNumber', true)}
                  placeholder="e.g. Yard 1264 Fast Patrol Vessel"
                  value={vesselYardNumber}
                  onChange={e => setVesselYardNumber(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-700/20 focus:border-indigo-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Customer / Vessel Owner {isFieldMandatory('customerName', false) && <span className="text-rose-600">*</span>}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Indian Coast Guard"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-700/20 focus:border-indigo-700 focus:outline-none"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Purpose of Visit {isFieldMandatory('purpose', true) && <span className="text-rose-600">*</span>}
                </label>
                <input
                  type="text"
                  required={isFieldMandatory('purpose', true)}
                  placeholder="e.g. Anti-vibration mount alignment & FAT witness"
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-700/20 focus:border-indigo-700 focus:outline-none"
                />
              </div>

              <div className="col-span-1 md:col-span-2 lg:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Key Findings & Measurements {isFieldMandatory('findings', false) && <span className="text-rose-600">*</span>}
                </label>
                <textarea
                  rows={3}
                  placeholder="Record alignment TIR, insulation resistance values, temperature rises..."
                  value={findings}
                  onChange={e => setFindings(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-700/20 focus:border-indigo-700 focus:outline-none"
                />
              </div>

              <div className="col-span-1 md:col-span-2 lg:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Action Items / Surveyor Follow-ups
                </label>
                <textarea
                  rows={2}
                  placeholder="Items requiring design updates, revised drawings or PLM releases..."
                  value={actionItems}
                  onChange={e => setActionItems(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-700/20 focus:border-indigo-700 focus:outline-none"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Attach Inspection Document / Certificate Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. MDL_Alignment_Certificate.pdf"
                  value={uploadedDocumentName}
                  onChange={e => setUploadedDocumentName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-mono focus:ring-2 focus:ring-indigo-700/20 focus:border-indigo-700 focus:outline-none"
                />
              </div>
            </div>

            {/* Admin Custom Fields for Site Visit */}
            {customFields.length > 0 && (
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                    CUSTOM FIELDS
                  </span>
                  <span className="font-bold text-slate-800 text-xs">
                    Admin Configured Site Visit Fields
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customFields.map(fld => (
                    <div key={fld.id}>
                      <label className="block font-semibold text-slate-700 mb-1">
                        {fld.label} {fld.isMandatory && <span className="text-rose-600">*</span>}
                      </label>
                      <input
                        type={fld.type}
                        required={fld.isMandatory}
                        value={customFieldValues[fld.fieldKey] || ''}
                        onChange={e => setCustomFieldValues({ ...customFieldValues, [fld.fieldKey]: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl p-2 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="px-5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-800 hover:bg-indigo-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <i className="fa-solid fa-check text-xs" />
                <span>Save Site Visit Log</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* VIEW MODE 2: List View */
        <>
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
                placeholder="Search shipyard, vessel, or engineer..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-700"
              />
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Total Logged Visits: <strong className="text-slate-800 tabular-nums">{siteVisits.length}</strong> (Updates KPI automatically)
            </div>
          </div>

          {/* Visits Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVisits.map(visit => (
              <div
                key={visit.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 block mb-0.5">
                      <i className="fa-regular fa-calendar mr-1" />
                      {visit.visitDate}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {visit.shipyardName}
                    </h3>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Vessel: <span className="font-semibold text-slate-800">{visit.vesselYardNumber}</span>
                      {visit.customerName && <span> ({visit.customerName})</span>}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      visit.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {visit.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider">
                      Purpose of Visit:
                    </span>
                    <p className="text-slate-700 leading-relaxed mt-0.5">{visit.purpose}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-1.5">
                    <div>
                      <span className="font-bold text-slate-800 text-[11px]">Key Findings:</span>
                      <p className="text-slate-600 text-xs mt-0.5">{visit.findings}</p>
                    </div>
                    {visit.actionItems && (
                      <div>
                        <span className="font-bold text-slate-800 text-[11px]">Action Items:</span>
                        <p className="text-slate-600 text-xs mt-0.5">{visit.actionItems}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <i className="fa-solid fa-user-gear text-slate-400" />
                    <span>Engineer: <strong className="text-slate-700">{visit.engineerName}</strong></span>
                  </span>

                  {visit.uploadedDocumentName ? (
                    <span className="flex items-center gap-1 text-emerald-700 font-mono text-[11px] bg-emerald-50 px-2 py-0.5 rounded">
                      <i className="fa-solid fa-paperclip" />
                      <span>{visit.uploadedDocumentName}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">No attachments</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
