import React, { useState } from 'react';
import { User, UserRole, FormFieldConfig } from '../types/index.ts';

interface AdminPanelProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  formFields?: FormFieldConfig[];
  onAddFormField?: (field: FormFieldConfig) => void;
  onToggleMandatory?: (fieldId: string) => void;
  onRemoveFormField?: (fieldId: string) => void;
  projectsCount?: number;
  onResetToDefaultData?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  formFields = [],
  onAddFormField,
  onToggleMandatory,
  onRemoveFormField,
  projectsCount = 3,
  onResetToDefaultData,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'dropdowns' | 'rules' | 'formSettings' | 'storage'>('users');

  // User creation form
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('koel2026');
  const [newRole, setNewRole] = useState<UserRole>('engineer');
  const [newDepartment, setNewDepartment] = useState('Marine Electrical Systems');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // Password editing state
  const [editingPasswordUser, setEditingPasswordUser] = useState<User | null>(null);
  const [updatedPasswordValue, setUpdatedPasswordValue] = useState('');
  const [pwdUpdateSuccess, setPwdUpdateSuccess] = useState<string | null>(null);

  // Dynamic dropdown customizable lists
  const [marineSocieties, setMarineSocieties] = useState<string[]>([
    'IRS (Indian Register of Shipping)',
    "LRS (Lloyd's Register)",
    'ABS (American Bureau of Shipping)',
    'DNV (Det Norske Veritas)',
    'NKK (ClassNK)',
    'BV (Bureau Veritas)',
    'RINA (Registro Italiano Navale)',
  ]);
  const [newSociety, setNewSociety] = useState('');

  const [engineSeriesList, setEngineSeriesList] = useState<string[]>([
    'DV8 Marine',
    'DV12 Marine',
    '4K1080 Marine',
    '6SL9088 Marine',
    'DV16 Marine',
  ]);
  const [newSeries, setNewSeries] = useState('');

  const [controllerTypes, setControllerTypes] = useState<string[]>([
    'DeepSea DSE8610 MKII Marine Auto-Synchronizing',
    'ComAp InteliDrive Marine',
    'Deif AGC-4 Marine Core Controller',
    'Woodward easYgen-3200XT Marine',
  ]);
  const [newController, setNewController] = useState('');

  // Rules Configuration
  const [rule1AutoReopen, setRule1AutoReopen] = useState(true);
  const [rule2StrictPlmRelease, setRule2StrictPlmRelease] = useState(true);
  const [requireFatWitnessSurveyor, setRequireFatWitnessSurveyor] = useState(true);

  // Form Settings & Custom Fields State
  const [selectedFormId, setSelectedFormId] = useState<'project' | 'siteVisit' | 'ecn' | 'trials' | 'drawings'>('project');
  const [isAddCustomFieldOpen, setIsAddCustomFieldOpen] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldSection, setNewFieldSection] = useState('General & Customer Info');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox'>('text');
  const [newFieldMandatory, setNewFieldMandatory] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [fieldSuccessMsg, setFieldSuccessMsg] = useState<string | null>(null);

  const handleCreateCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldLabel.trim()) return;

    const generatedKey = newFieldLabel
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_');

    const newField: FormFieldConfig = {
      id: `fld-custom-${Date.now()}`,
      formId: selectedFormId,
      fieldKey: generatedKey,
      label: newFieldLabel.trim(),
      section: newFieldSection.trim() || 'Custom Fields',
      type: newFieldType,
      isMandatory: newFieldMandatory,
      isCustom: true,
      options: newFieldType === 'select' ? newFieldOptions.split(',').map(s => s.trim()).filter(Boolean) : undefined,
    };

    if (onAddFormField) {
      onAddFormField(newField);
    }

    setFieldSuccessMsg(`Field "${newField.label}" added to ${selectedFormId.toUpperCase()} form.`);
    setTimeout(() => setFieldSuccessMsg(null), 4000);

    setIsAddCustomFieldOpen(false);
    setNewFieldLabel('');
    setNewFieldOptions('');
    setNewFieldMandatory(false);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newFullName.trim()) return;

    const newUser: User = {
      id: `usr-${Date.now()}`,
      username: newUsername.trim().toLowerCase(),
      password: newPassword.trim() || 'koel2026',
      fullName: newFullName.trim(),
      email: newEmail.trim() || `${newUsername.trim()}@kirloskar.com`,
      role: newRole,
      department: newDepartment.trim(),
      active: true,
      lastLogin: 'Never',
    };

    onAddUser(newUser);
    setIsAddUserOpen(false);
    setNewUsername('');
    setNewFullName('');
    setNewEmail('');
    setNewPassword('koel2026');
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPasswordUser || !updatedPasswordValue.trim()) return;

    onUpdateUser({
      ...editingPasswordUser,
      password: updatedPasswordValue.trim(),
    });

    setPwdUpdateSuccess(`Password updated successfully for @${editingPasswordUser.username}`);
    setTimeout(() => setPwdUpdateSuccess(null), 3500);
    setEditingPasswordUser(null);
    setUpdatedPasswordValue('');
  };

  const handleToggleUserStatus = (user: User) => {
    onUpdateUser({ ...user, active: !user.active });
  };

  const handleAddSociety = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSociety.trim()) return;
    setMarineSocieties([...marineSocieties, newSociety.trim()]);
    setNewSociety('');
  };

  const handleAddSeries = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeries.trim()) return;
    setEngineSeriesList([...engineSeriesList, newSeries.trim()]);
    setNewSeries('');
  };

  const handleAddController = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newController.trim()) return;
    setControllerTypes([...controllerTypes, newController.trim()]);
    setNewController('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Settings & Admin Governance
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 bg-purple-50 text-purple-800 rounded">
              Administrator Privileged Access
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            User credentials, role assignments, dynamic dropdown dictionary, and project lifecycle governance
          </p>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'users' ? 'bg-white text-purple-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fa-solid fa-users-gear mr-1.5" />
            User Management
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('formSettings')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'formSettings' ? 'bg-white text-purple-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fa-solid fa-list-check mr-1.5" />
            Form Settings & Fields
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dropdowns')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'dropdowns' ? 'bg-white text-purple-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fa-solid fa-sliders mr-1.5" />
            Dropdown Dictionary
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'rules' ? 'bg-white text-purple-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fa-solid fa-shield mr-1.5" />
            System Rules & Policies
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('storage')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'storage' ? 'bg-white text-purple-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fa-solid fa-database mr-1.5" />
            Data Persistence & Backup
          </button>
        </div>
      </div>

      {/* TAB 1: User Management */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-800">System Users & Role-Based Access</h3>
              <p className="text-xs text-slate-500">Configure credentials and administrative capabilities</p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddUserOpen(true)}
              className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-user-plus text-xs" />
              <span>+ Add New User</span>
            </button>
          </div>

          {/* Password update feedback toast */}
          {pwdUpdateSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
              <i className="fa-solid fa-circle-check text-emerald-600" />
              <span>{pwdUpdateSuccess}</span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Password Protection</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Login</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{u.fullName}</div>
                        <div className="text-[11px] font-mono text-slate-500">@{u.username}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold text-[11px] uppercase tracking-wider px-2 py-0.5 rounded ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-800 font-bold'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{u.department}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400 font-bold text-xs">••••••••</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPasswordUser(u);
                              setUpdatedPasswordValue(u.password || '');
                            }}
                            className="text-[10px] text-purple-700 hover:text-purple-900 font-bold underline cursor-pointer"
                          >
                            Reset
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            u.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {u.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{u.lastLogin || 'Never'}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleToggleUserStatus(u)}
                          className="px-2.5 py-1 border border-slate-300 rounded text-xs hover:bg-slate-100 text-slate-700 cursor-pointer"
                        >
                          {u.active ? 'Disable' : 'Enable'}
                        </button>
                        {u.username !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => onDeleteUser(u.id)}
                            className="px-2 py-1 text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
                            title="Delete User"
                          >
                            <i className="fa-solid fa-trash-can" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Dynamic Dropdown Customization */}
      {activeTab === 'dropdowns' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* List 1: Marine Classification Societies */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Classification Societies</h3>
              <p className="text-xs text-slate-500">Configures dropdown in Project Form</p>
            </div>

            <form onSubmit={handleAddSociety} className="flex gap-2 text-xs">
              <input
                type="text"
                placeholder="New society (e.g. CCS, KR)..."
                value={newSociety}
                onChange={e => setNewSociety(e.target.value)}
                className="flex-1 border border-slate-300 rounded-lg p-2"
              />
              <button
                type="submit"
                className="px-3 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold"
              >
                +
              </button>
            </form>

            <ul className="space-y-1.5 text-xs">
              {marineSocieties.map((soc, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <span className="font-medium text-slate-800">{soc}</span>
                  <button
                    type="button"
                    onClick={() => setMarineSocieties(marineSocieties.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* List 2: Engine Series Master */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Engine Series Options</h3>
              <p className="text-xs text-slate-500">Configures engine selection in 53 Inputs</p>
            </div>

            <form onSubmit={handleAddSeries} className="flex gap-2 text-xs">
              <input
                type="text"
                placeholder="New engine series (e.g. 8SL9088)..."
                value={newSeries}
                onChange={e => setNewSeries(e.target.value)}
                className="flex-1 border border-slate-300 rounded-lg p-2"
              />
              <button
                type="submit"
                className="px-3 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold"
              >
                +
              </button>
            </form>

            <ul className="space-y-1.5 text-xs">
              {engineSeriesList.map((ser, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <span className="font-medium text-slate-800">{ser}</span>
                  <button
                    type="button"
                    onClick={() => setEngineSeriesList(engineSeriesList.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* List 3: Marine Controller Types */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Marine Controller Types</h3>
              <p className="text-xs text-slate-500">LCP Controller options</p>
            </div>

            <form onSubmit={handleAddController} className="flex gap-2 text-xs">
              <input
                type="text"
                placeholder="New controller type..."
                value={newController}
                onChange={e => setNewController(e.target.value)}
                className="flex-1 border border-slate-300 rounded-lg p-2"
              />
              <button
                type="submit"
                className="px-3 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold"
              >
                +
              </button>
            </form>

            <ul className="space-y-1.5 text-xs">
              {controllerTypes.map((ctrl, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <span className="font-medium text-slate-800 truncate pr-2">{ctrl}</span>
                  <button
                    type="button"
                    onClick={() => setControllerTypes(controllerTypes.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-rose-600 shrink-0"
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* TAB 3: System Rules & Governance */}
      {activeTab === 'rules' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Engineering Governance Rules & Automations</h3>
            <p className="text-xs text-slate-500">Enable or tune automated gates across PLM lifecycle</p>
          </div>

          <div className="space-y-4">
            {/* Rule 1 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <i className="fa-solid fa-rotate-left text-amber-600" />
                  <span>Rule 1: Auto Re-Open Closed Projects on ECN / ECR</span>
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  When enabled, logging any Engineering Change Notice (ECN) or Request (ECR) against a project currently marked CLOSED will automatically revert its status to OPEN.
                </p>
              </div>
              <input
                type="checkbox"
                checked={rule1AutoReopen}
                onChange={e => setRule1AutoReopen(e.target.checked)}
                className="w-5 h-5 accent-emerald-700 cursor-pointer shrink-0 mt-1"
              />
            </div>

            {/* Rule 2 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <i className="fa-solid fa-lock text-emerald-700" />
                  <span>Rule 2: Strict Sub-Project PLM Release Gate for Project Closure</span>
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mandates that all 7 sub-projects (Alternator, LCP, EWH, AWH, Electrical Interface Diagram, Sensors Group, Junction Box) must have reached "Released in PLM" before the project can be marked CLOSED.
                </p>
              </div>
              <input
                type="checkbox"
                checked={rule2StrictPlmRelease}
                onChange={e => setRule2StrictPlmRelease(e.target.checked)}
                className="w-5 h-5 accent-emerald-700 cursor-pointer shrink-0 mt-1"
              />
            </div>

            {/* Rule 3 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <i className="fa-solid fa-stamp text-blue-600" />
                  <span>Rule 3: Enforce Marine Classification Society FAT Surveyor Witness</span>
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Requires formal surveyor witness documentation before final test protocol sign-off on marine alternators over 250 kVA.
                </p>
              </div>
              <input
                type="checkbox"
                checked={requireFatWitnessSurveyor}
                onChange={e => setRequireFatWitnessSurveyor(e.target.checked)}
                className="w-5 h-5 accent-emerald-700 cursor-pointer shrink-0 mt-1"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Form Settings & Custom Fields */}
      {activeTab === 'formSettings' && (
        <div className="space-y-6">
          {/* Header & Form Selector Bar */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <i className="fa-solid fa-sliders text-purple-700" />
                  <span>Dynamic Form Settings & Mandatory Field Configuration</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Customize input fields across all marine modules, toggle mandatory validation flags, and add custom engineering parameters.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddCustomFieldOpen(prev => !prev)}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0 transition-colors"
              >
                <i className={`fa-solid ${isAddCustomFieldOpen ? 'fa-xmark' : 'fa-plus'} text-xs`} />
                <span>{isAddCustomFieldOpen ? 'Close Form' : '+ Add Custom Field'}</span>
              </button>
            </div>

            {/* Select Target Form */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-700 mr-1">Select Form:</span>
              {[
                { id: 'project', label: 'Marine Project Creation Form', icon: 'fa-ship' },
                { id: 'siteVisit', label: 'Site Visit Record Form', icon: 'fa-clipboard-user' },
                { id: 'ecn', label: 'ECN / ECR Change Form', icon: 'fa-file-signature' },
                { id: 'trials', label: 'FAT & Sea Trials Form', icon: 'fa-anchor' },
                { id: 'drawings', label: 'Drawing & Wiring Master Form', icon: 'fa-compass-drafting' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setSelectedFormId(f.id as any);
                    if (f.id === 'project') setNewFieldSection('General & Customer Info');
                    else if (f.id === 'siteVisit') setNewFieldSection('Inspection Details');
                    else if (f.id === 'ecn') setNewFieldSection('Change Information');
                    else if (f.id === 'trials') setNewFieldSection('Trial Specifications');
                    else if (f.id === 'drawings') setNewFieldSection('Drawing Control');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                    selectedFormId === f.id
                      ? 'bg-purple-50 text-purple-900 border-purple-300 font-bold shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <i className={`fa-solid ${f.icon} text-xs`} />
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Feedback message */}
          {fieldSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <i className="fa-solid fa-circle-check text-emerald-600" />
              <span>{fieldSuccessMsg}</span>
            </div>
          )}

          {/* New Custom Field Creation Panel */}
          {isAddCustomFieldOpen && (
            <div className="bg-purple-50/70 p-5 rounded-xl border border-purple-200 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-950 font-bold text-sm">
                  <i className="fa-solid fa-plus-circle text-purple-700" />
                  <span>Add New Custom Field to {selectedFormId.toUpperCase()} Form</span>
                </div>
                <span className="text-[11px] text-purple-700 font-semibold bg-purple-100 px-2 py-0.5 rounded-full">
                  Target Form: {selectedFormId}
                </span>
              </div>

              <form onSubmit={handleCreateCustomField} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Field Label *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Yard Inspector Contact"
                      value={newFieldLabel}
                      onChange={e => setNewFieldLabel(e.target.value)}
                      className="w-full bg-white border border-purple-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-purple-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Section / Group *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. General, Electrical, Mechanical"
                      value={newFieldSection}
                      onChange={e => setNewFieldSection(e.target.value)}
                      className="w-full bg-white border border-purple-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-purple-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Data Type *</label>
                    <select
                      value={newFieldType}
                      onChange={e => setNewFieldType(e.target.value as any)}
                      className="w-full bg-white border border-purple-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-purple-700 focus:outline-none font-semibold"
                    >
                      <option value="text">Text (Single-line)</option>
                      <option value="number">Numeric (Values / Ratings)</option>
                      <option value="date">Date Picker</option>
                      <option value="select">Dropdown Select</option>
                      <option value="textarea">Text Area (Multi-line Notes)</option>
                      <option value="checkbox">Checkbox (Boolean True/False)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Validation Constraint</label>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newFieldMandatory}
                        onChange={e => setNewFieldMandatory(e.target.checked)}
                        className="w-4 h-4 accent-purple-700 rounded"
                      />
                      <span className="font-bold text-slate-800">Mandatory (Required Field *)</span>
                    </label>
                  </div>
                </div>

                {newFieldType === 'select' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Dropdown Options (comma-separated list)
                    </label>
                    <input
                      type="text"
                      placeholder="Option 1, Option 2, Option 3"
                      value={newFieldOptions}
                      onChange={e => setNewFieldOptions(e.target.value)}
                      className="w-full bg-white border border-purple-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-purple-700 focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddCustomFieldOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save & Inject Field
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Fields List Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Configured Form Fields
                </span>
                <span className="bg-purple-100 text-purple-900 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                  {formFields.filter(f => f.formId === selectedFormId).length} Total Fields
                </span>
                <span className="bg-emerald-100 text-emerald-900 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                  {formFields.filter(f => f.formId === selectedFormId && f.isMandatory).length} Mandatory
                </span>
                <span className="bg-slate-200 text-slate-800 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                  {formFields.filter(f => f.formId === selectedFormId && !f.isMandatory).length} Optional
                </span>
              </div>
              <span className="text-slate-500 text-[11px]">
                Click the Mandatory switch to toggle validation requirement in real time
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-slate-400">#</th>
                    <th className="py-3 px-4">Field Label & Key</th>
                    <th className="py-3 px-4">Section / Category</th>
                    <th className="py-3 px-4">Field Type</th>
                    <th className="py-3 px-4">Origin</th>
                    <th className="py-3 px-4">Mandatory Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formFields
                    .filter(f => f.formId === selectedFormId)
                    .map((field, idx) => (
                      <tr key={field.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{field.label}</span>
                            {field.isMandatory && (
                              <span className="text-rose-600 font-bold text-sm leading-none" title="Mandatory field">*</span>
                            )}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                            key: {field.fieldKey}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-700 border border-slate-200">
                            {field.section}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-[11px] font-semibold text-slate-700 uppercase bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                            {field.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {field.isCustom ? (
                            <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              Custom Field
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 w-fit">
                              <i className="fa-solid fa-cube text-[9px]" />
                              Standard
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => onToggleMandatory && onToggleMandatory(field.id)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                              field.isMandatory
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                            }`}
                            title="Click to toggle mandatory status"
                          >
                            <i className={`fa-solid ${field.isMandatory ? 'fa-toggle-on text-emerald-700 text-sm' : 'fa-toggle-off text-slate-400 text-sm'}`} />
                            <span>{field.isMandatory ? 'Mandatory (Required *)' : 'Optional'}</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {field.isCustom ? (
                            <button
                              type="button"
                              onClick={() => onRemoveFormField && onRemoveFormField(field.id)}
                              className="text-rose-600 hover:text-rose-800 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1 ml-auto"
                              title="Delete custom field"
                            >
                              <i className="fa-solid fa-trash-can" />
                              <span>Remove</span>
                            </button>
                          ) : (
                            <span className="text-slate-300 text-[11px] italic" title="System standard field cannot be deleted">
                              System core
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}

                  {formFields.filter(f => f.formId === selectedFormId).length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No fields configured for this form yet. Click "+ Add Custom Field" above to register new fields.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Data Persistence & Backup */}
      {activeTab === 'storage' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <i className="fa-solid fa-database text-purple-700" />
                  <span>Data Persistence & Automatic Storage Status</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  All marine projects, drawing attachments, ECNs, and user changes are automatically saved to your browser's persistent storage.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-900 px-3 py-1.5 rounded-lg border border-emerald-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Auto-Save Storage: ACTIVE</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 block">Marine Projects in Storage</span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block font-mono">{projectsCount}</span>
                <span className="text-[11px] text-emerald-700 font-medium">All sub-projects, drawings & SOTRs saved</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 block">Registered Users</span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block font-mono">{users.length}</span>
                <span className="text-[11px] text-slate-500">Admins and Engineers</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 block">Custom Form Fields</span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block font-mono">{formFields.length}</span>
                <span className="text-[11px] text-slate-500">Configured field definitions</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-xs text-slate-800">Factory Data Reset</h4>
                <p className="text-[11px] text-slate-500">
                  Restore default initial sample marine projects and discard custom edits.
                </p>
              </div>

              {onResetToDefaultData && (
                <button
                  type="button"
                  onClick={onResetToDefaultData}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-rotate-left text-xs" />
                  <span>Restore Sample Marine Projects</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-purple-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Add New User</h3>
                <p className="text-xs text-purple-200 mt-0.5">Create portal credentials & assign role</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="text-purple-200 hover:text-white"
              >
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">User ID / Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. vkumar"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vivek Kumar"
                  value={newFullName}
                  onChange={e => setNewFullName(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. v.kumar@kirloskar.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Initial Account Password *</span>
                  <span className="text-[10px] text-emerald-700 font-normal">Strict Password Protection</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. koel2026"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">User Role</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full border border-slate-300 rounded p-2 text-xs font-bold"
                  >
                    <option value="engineer">Engineer Role</option>
                    <option value="admin">Admin Role</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={e => setNewDepartment(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  Create User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {editingPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 bg-purple-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-key text-amber-400" />
                <h3 className="font-bold text-sm">Update User Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPasswordUser(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 text-purple-900 space-y-1">
                <div><strong>User:</strong> {editingPasswordUser.fullName}</div>
                <div className="font-mono text-[11px]">@{editingPasswordUser.username} ({editingPasswordUser.role.toUpperCase()})</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Password * (Strictly Verified on Login)
                </label>
                <input
                  type="text"
                  required
                  value={updatedPasswordValue}
                  onChange={e => setUpdatedPasswordValue(e.target.value)}
                  placeholder="Enter new password..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold focus:ring-1 focus:ring-purple-700 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Password protection is active. Users must enter this exact case-sensitive password to authenticate.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPasswordUser(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
