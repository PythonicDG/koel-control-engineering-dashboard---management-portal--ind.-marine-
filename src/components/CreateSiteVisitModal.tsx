import React, { useState } from 'react';
import { SiteVisit } from '../types/index.ts';

interface CreateSiteVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSiteVisit: (newVisit: SiteVisit) => void;
}

export const CreateSiteVisitModal: React.FC<CreateSiteVisitModalProps> = ({
  isOpen,
  onClose,
  onAddSiteVisit,
}) => {
  const [shipyardName, setShipyardName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [vesselYardNumber, setVesselYardNumber] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [engineerName, setEngineerName] = useState('Rajesh Kulkarni');
  const [purpose, setPurpose] = useState('');
  const [findings, setFindings] = useState('');
  const [actionItems, setActionItems] = useState('');
  const [status, setStatus] = useState<'Scheduled' | 'Completed' | 'Pending Follow-up'>('Completed');

  if (!isOpen) return null;

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
      findings: findings.trim() || 'Interface parameters, coupling runout, and control panel wiring verified.',
      actionItems: actionItems.trim() || 'Proceed with shipyard commissioning protocol.',
      uploadedDocumentName: 'Site_Inspection_Report.pdf',
      status,
    };

    onAddSiteVisit(newVisit);
    onClose();

    // Reset
    setShipyardName('');
    setCustomerName('');
    setVesselYardNumber('');
    setPurpose('');
    setFindings('');
    setActionItems('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-[#064e3b] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <i className="fa-solid fa-clipboard-user text-emerald-300 text-sm" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Add New Site Visit Record</h3>
              <p className="text-[11px] text-emerald-200">
                Log shipyard, dock inspection, FAT, or sea trial telemetry
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Shipyard / Facility Name *
              </label>
              <input
                type="text"
                required
                value={shipyardName}
                onChange={e => setShipyardName(e.target.value)}
                placeholder="e.g. Cochin Shipyard Ltd / Mazagon Dock"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Customer / Owner Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="e.g. Indian Navy / Coast Guard / Mercator"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vessel / Yard Number
              </label>
              <input
                type="text"
                value={vesselYardNumber}
                onChange={e => setVesselYardNumber(e.target.value)}
                placeholder="e.g. Yard 1187 / Hull CS-45"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date of Visit
              </label>
              <input
                type="date"
                required
                value={visitDate}
                onChange={e => setVisitDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Attending Engineer
              </label>
              <input
                type="text"
                value={engineerName}
                onChange={e => setEngineerName(e.target.value)}
                placeholder="e.g. Rajesh Kulkarni"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Visit Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
              >
                <option value="Completed">Completed</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Pending Follow-up">Pending Follow-up</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Purpose of Visit *
            </label>
            <input
              type="text"
              required
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder="e.g. Generator Set Commissioning, Alignment Check & Sea Trial"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Key Technical Findings
            </label>
            <textarea
              rows={2}
              value={findings}
              onChange={e => setFindings(e.target.value)}
              placeholder="Summary of engineering observation, voltage regulation, vibration readings..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Action Items / Follow-up Requirements
            </label>
            <input
              type="text"
              value={actionItems}
              onChange={e => setActionItems(e.target.value)}
              placeholder="e.g. Submit FAT trial log to classification surveyor"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#064e3b] hover:bg-[#043d2e] rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-2"
            >
              <i className="fa-solid fa-check text-xs" />
              <span>Save Visit Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
