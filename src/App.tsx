/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Project,
  EcnEcr,
  SiteVisit,
  AlternatorCatalogItem,
  InspectionAuthority,
  FormFieldConfig,
} from './types/index.ts';
import { api, errorMessage, tokenStore, AUTH_EXPIRED_EVENT } from './api/client.ts';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar, ActiveView } from './components/Sidebar.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { DashboardOverview } from './components/DashboardOverview.tsx';
import { ProjectMaster } from './components/ProjectMaster.tsx';
import { CreateProjectView } from './components/CreateProjectView.tsx';
import { EcnMaster } from './components/EcnMaster.tsx';
import { SiteVisitMaster } from './components/SiteVisitMaster.tsx';
import { AlternatorMaster } from './components/AlternatorMaster.tsx';
import { InspectionAuthMaster } from './components/InspectionAuthMaster.tsx';
import { EngineeringTools } from './components/EngineeringTools.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { TrialsMaster } from './components/TrialsMaster.tsx';
import { DrawingsMaster } from './components/DrawingsMaster.tsx';

// Browser-only data keys used before the Django backend existed. Cleared on start
// so stale local copies can never be mistaken for real (database) data.
const LEGACY_STORAGE_KEYS = [
  'koel_marine_current_user',
  'koel_marine_users',
  'koel_marine_projects',
  'koel_marine_ecns',
  'koel_marine_site_visits',
  'koel_marine_alternators',
  'koel_marine_authorities',
  'koel_marine_form_fields',
];

export default function App() {
  // Authentication: the token lives in localStorage, the user profile comes from the API.
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(() => !!tokenStore.get());

  // App data (loaded from the Django API after sign-in)
  const [usersList, setUsersList] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [ecns, setEcns] = useState<EcnEcr[]>([]);
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);
  const [alternators, setAlternators] = useState<AlternatorCatalogItem[]>([]);
  const [authorities, setAuthorities] = useState<InspectionAuthority[]>([]);
  const [formFields, setFormFields] = useState<FormFieldConfig[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    try {
      LEGACY_STORAGE_KEYS.forEach(k => localStorage.removeItem(k));
    } catch {
      /* storage unavailable */
    }
  }, []);

  // Restore the session from a saved token
  useEffect(() => {
    if (!tokenStore.get()) return;
    let cancelled = false;
    api.auth
      .me()
      .then(user => !cancelled && setCurrentUser(user))
      .catch(() => tokenStore.clear())
      .finally(() => !cancelled && setIsRestoringSession(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // The API rejected our token (expired / signed out elsewhere)
  useEffect(() => {
    const onExpired = () => setCurrentUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  const loadAllData = useCallback(async () => {
    setIsLoadingData(true);
    setLoadError(null);
    try {
      const [u, p, e, s, a, au, f] = await Promise.all([
        api.users.list(),
        api.projects.list(),
        api.ecns.list(),
        api.siteVisits.list(),
        api.alternators.list(),
        api.authorities.list(),
        api.formFields.list(),
      ]);
      setUsersList(u);
      setProjects(p);
      setEcns(e);
      setSiteVisits(s);
      setAlternators(a);
      setAuthorities(au);
      setFormFields(f);
    } catch (err) {
      setLoadError(errorMessage(err));
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const currentUserId = currentUser?.id;
  useEffect(() => {
    if (currentUserId) void loadAllData();
  }, [currentUserId, loadAllData]);

  // Navigation & UI States
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Modal for ECN (if triggered)
  const [isCreateEcnModalOpen, setIsCreateEcnModalOpen] = useState<boolean>(false);

  // Notification Toast for Lifecycle Rule Triggers
  const [toastMessage, setToastMessage] = useState<{
    id: number;
    title: string;
    description: string;
    type: 'success' | 'warning' | 'info';
  } | null>(null);

  // Listen for custom event from ProjectMaster create button to switch in-window
  useEffect(() => {
    const handleOpenProjectForm = () => setActiveView('createProject');
    window.addEventListener('open-new-project-modal', handleOpenProjectForm);
    return () => window.removeEventListener('open-new-project-modal', handleOpenProjectForm);
  }, []);

  // Show Toast Helper
  const showToast = (title: string, description: string, type: 'success' | 'warning' | 'info' = 'info') => {
    const id = Date.now();
    setToastMessage({ id, title, description, type });
    setTimeout(() => {
      setToastMessage(prev => (prev?.id === id ? null : prev));
    }, 6000);
  };

  // Login handler (LoginScreen has already authenticated against the API)
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    showToast(
      'Authenticated Successfully',
      `Welcome to Marine Operations Portal, ${user.fullName}. Role: ${user.role.toUpperCase()}`,
      'success'
    );
  };

  // Logout handler
  const handleLogout = async () => {
    await api.auth.logout();
    setCurrentUser(null);
    setProjects([]);
    setEcns([]);
    setSiteVisits([]);
    setUsersList([]);
    setActiveView('dashboard');
    setSelectedProjectId(null);
    showToast('Signed Out', 'You have been safely signed out of the session.', 'info');
  };

  const showError = (title: string, err: unknown) => showToast(title, errorMessage(err), 'warning');

  // Project updates (optimistic: UI updates immediately, rolled back from the server on failure)
  const handleUpdateProject = async (updated: Project) => {
    setProjects(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    try {
      const saved = await api.projects.update(updated.id, updated);
      setProjects(prev => prev.map(p => (p.id === saved.id ? saved : p)));
      showToast(
        'Project Updated',
        `Changes saved for ${saved.projectCode} (${saved.designInputs.projectName})`,
        'success'
      );
    } catch (err) {
      showError('Project Update Failed', err);
      api.projects.list().then(setProjects).catch(() => {});
    }
  };

  const handleCreateProject = async (newProject: Project) => {
    try {
      const saved = await api.projects.create(newProject);
      setProjects(prev => [saved, ...prev]);
      setSelectedProjectId(saved.id);
      setActiveView('projectMaster');
      showToast(
        'Project Created & Initialized',
        `New Project ${saved.projectCode} registered with Design Specifications and ${saved.subProjects.length} Sub-Project(s).`,
        'success'
      );
    } catch (err) {
      showError('Project Creation Failed', err);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const target = projects.find(p => p.id === projectId);
    try {
      await api.projects.remove(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
      }
      showToast(
        'Project Deleted',
        `Project ${target?.projectCode || ''} has been permanently deleted.`,
        'info'
      );
    } catch (err) {
      showError('Project Delete Failed', err);
    }
  };

  // Form Field Configuration handlers for Admin Panel
  const handleAddFormField = async (newField: FormFieldConfig) => {
    try {
      const saved = await api.formFields.create(newField);
      setFormFields(prev => [...prev, saved]);
      showToast('Field Added', `Field "${saved.label}" added to ${saved.formId.toUpperCase()} form.`, 'success');
    } catch (err) {
      showError('Could Not Add Field', err);
    }
  };

  const handleToggleMandatory = async (fieldId: string) => {
    const field = formFields.find(f => f.id === fieldId);
    if (!field) return;
    try {
      const saved = await api.formFields.patch(fieldId, { isMandatory: !field.isMandatory });
      setFormFields(prev => prev.map(f => (f.id === fieldId ? saved : f)));
      showToast(
        'Field Setting Updated',
        `Field "${saved.label}" is now ${saved.isMandatory ? 'MANDATORY (Required *)' : 'OPTIONAL'}.`,
        'info'
      );
    } catch (err) {
      showError('Could Not Update Field', err);
    }
  };

  const handleRemoveFormField = async (fieldId: string) => {
    const target = formFields.find(f => f.id === fieldId);
    try {
      await api.formFields.remove(fieldId);
      setFormFields(prev => prev.filter(f => f.id !== fieldId));
      if (target) {
        showToast('Field Removed', `Custom field "${target.label}" removed from form.`, 'info');
      }
    } catch (err) {
      showError('Could Not Remove Field', err);
    }
  };

  // ECN / ECR: the server logs the notice and applies Rule 1 (re-open a CLOSED project).
  // Resolves true when saved so the form can close itself.
  const handleAddEcn = async (newEcn: EcnEcr): Promise<boolean> => {
    try {
      const { ecn, project, didReopen } = await api.ecns.log(newEcn);
      setEcns(prev => [ecn, ...prev]);
      if (project) {
        setProjects(prev => prev.map(p => (p.id === project.id ? project : p)));
      }

      if (didReopen && project) {
        showToast(
          'Rule 1 Auto-Reopen Enforced!',
          `Project ${project.projectCode} was previously CLOSED. Logging ${ecn.changeType} "${ecn.manualChangeNumber}" has automatically re-opened the project status to OPEN!`,
          'warning'
        );
      } else {
        showToast(
          'Change Notice Logged',
          `Registered ${ecn.changeType} "${ecn.manualChangeNumber}" against ${ecn.projectCode}`,
          'success'
        );
      }
      return true;
    } catch (err) {
      showError('Could Not Log Change Notice', err);
      return false;
    }
  };

  // Site Visit updates
  const handleAddSiteVisit = async (newVisit: SiteVisit) => {
    try {
      const saved = await api.siteVisits.create(newVisit);
      setSiteVisits(prev => [saved, ...prev]);
      showToast(
        'Site Visit Logged',
        `Inspection record for ${saved.shipyardName} recorded. KPI counter updated.`,
        'success'
      );
    } catch (err) {
      showError('Could Not Save Site Visit', err);
    }
  };

  // Alternator updates
  const handleAddAlternator = async (item: AlternatorCatalogItem) => {
    try {
      const saved = await api.alternators.create(item);
      setAlternators(prev => [saved, ...prev]);
      showToast('Alternator Added', `Model ${saved.model} saved to Marine Database.`, 'success');
    } catch (err) {
      showError('Could Not Save Alternator', err);
    }
  };

  // Inspection Authority updates
  const handleUpdateAuthority = async (updated: InspectionAuthority) => {
    try {
      const saved = await api.authorities.update(updated.id, updated);
      setAuthorities(prev => prev.map(a => (a.id === saved.id ? saved : a)));
      showToast('Rules Updated', `Class requirements for ${saved.code} updated.`, 'success');
    } catch (err) {
      showError('Could Not Update Rules', err);
    }
  };

  // User management updates (admin only; passwords are hashed by the server and never returned)
  const handleAddUser = async (user: User) => {
    try {
      const saved = await api.users.create(user);
      setUsersList(prev => [...prev, saved]);
      showToast('User Created', `User @${saved.username} created with ${saved.role} permissions.`, 'success');
    } catch (err) {
      showError('Could Not Create User', err);
    }
  };

  const handleUpdateUser = async (user: User) => {
    const { fullName, role, email, department, active, password } = user;
    try {
      const saved = await api.users.patch(user.id, {
        fullName,
        role,
        email,
        department,
        active,
        ...(password ? { password } : {}),
      });
      setUsersList(prev => prev.map(u => (u.id === saved.id ? saved : u)));
      if (currentUser && saved.id === currentUser.id) setCurrentUser(saved);
      showToast('User Updated', `Settings saved for @${saved.username}.`, 'info');
    } catch (err) {
      showError('Could Not Update User', err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await api.users.remove(userId);
      setUsersList(prev => prev.filter(u => u.id !== userId));
      showToast('User Removed', 'User account successfully deleted.', 'info');
    } catch (err) {
      showError('Could Not Delete User', err);
    }
  };

  // Navigation handler
  const handleNavigate = (view: ActiveView, projectId?: string) => {
    if (view === 'adminPanel' && currentUser?.role !== 'admin') {
      showToast('Access Denied', 'Administrator role required to access settings.', 'warning');
      return;
    }
    setActiveView(view);
    if (projectId) {
      setSelectedProjectId(projectId);
    }
  };

  // Waiting for the saved session token to be verified
  if (isRestoringSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-sm text-slate-500">
        Restoring your session...
      </div>
    );
  }

  // If user is not logged in, show Login Screen
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Calculate Counts for Sidebar badges
  const sidebarCounts = {
    totalProjects: projects.length,
    openEcns: ecns.filter(e => e.status === 'Open' || e.status === 'Under Investigation').length,
    siteVisits: siteVisits.length,
    pendingTasks: projects.reduce(
      (acc, p) => acc + p.subProjects.filter(sp => sp.taskStatus !== 'Completed').length,
      0
    ),
  };

  // Factory Data Reset handler
  const handleResetToDefaultData = async () => {
    if (window.confirm('Are you sure you want to restore default sample marine data? All custom projects, ECN/ECRs and site visits in the database will be reset to factory sample data.')) {
      try {
        await api.resetSampleData();
        const [p, e, s] = await Promise.all([api.projects.list(), api.ecns.list(), api.siteVisits.list()]);
        setProjects(p);
        setEcns(e);
        setSiteVisits(s);
        setSelectedProjectId(null);
        showToast('Data Restored', 'Restored default sample marine projects & lifecycle data.', 'info');
      } catch (err) {
        showError('Could Not Restore Sample Data', err);
      }
    }
  };

  // Next free project number: highest existing KOEL-MAR-YYYY-NNN suffix + 1
  // (projects.length + 1 would re-use a code after a project is deleted).
  const nextProjectIndex =
    projects.reduce((max, p) => {
      const n = parseInt(p.projectCode.split('-').pop() || '0', 10);
      return Number.isFinite(n) ? Math.max(max, n) : max;
    }, 0) + 1;

  const viewTitles: Record<ActiveView, string> = {
    dashboard: 'Command Hub',
    projectMaster: 'Project Master',
    createProject: 'Create New Marine Project',
    ecnMaster: 'ECN / ECR Master',
    siteVisits: 'Site Visit Records',
    trialsRecord: 'FAT & Sea Trials Record',
    drawingsMaster: 'Drawing & Wiring Master',
    alternatorMaster: 'Alternator Database',
    inspectionAuth: 'Inspection Authorities',
    engineeringTools: 'Engineering Tools',
    adminPanel: 'Admin Panel & Governance',
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans antialiased">
      {/* Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        activeViewTitle={viewTitles[activeView]}
      />

      {/* Main Body Area: Collapsible Dark Green Sidebar + Expansive 16:9 Content Viewport */}
      <div className="flex-1 flex w-full max-w-[1920px] mx-auto">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeView={activeView}
          onSelectView={handleNavigate}
          userRole={currentUser.role}
          counts={sidebarCounts}
        />

        {/* Dynamic Main Viewport on Light Gray Background */}
        <main className="flex-1 min-w-0 p-5 sm:p-6 lg:p-8 xl:p-10 overflow-y-auto bg-slate-100">
          {/* Active Toast Notification */}
          {toastMessage && (
            <div
              className={`mb-5 p-4 rounded-xl border text-xs shadow-md flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
                toastMessage.type === 'warning'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : toastMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-blue-50 border-blue-300 text-blue-900'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <i
                  className={`fa-solid text-sm mt-0.5 ${
                    toastMessage.type === 'warning'
                      ? 'fa-triangle-exclamation text-amber-600'
                      : toastMessage.type === 'success'
                      ? 'fa-circle-check text-emerald-600'
                      : 'fa-circle-info text-blue-600'
                  }`}
                />
                <div>
                  <h4 className="font-bold text-xs">{toastMessage.title}</h4>
                  <p className="mt-0.5 leading-relaxed text-[11px] opacity-90">
                    {toastMessage.description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="opacity-60 hover:opacity-100 p-1 cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-xs" />
              </button>
            </div>
          )}

          {/* Data loading / connection error banner */}
          {loadError && (
            <div className="mb-5 p-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 text-xs flex items-center justify-between gap-3">
              <span>
                <strong>Could not load data from the server.</strong> {loadError}
              </span>
              <button
                type="button"
                onClick={() => void loadAllData()}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}
          {isLoadingData && !loadError && projects.length === 0 && (
            <div className="mb-5 p-4 rounded-xl border border-slate-200 bg-white text-xs text-slate-500">
              Loading portal data...
            </div>
          )}

          {/* View 1: Main Dashboard Overview */}
          {activeView === 'dashboard' && (
            <DashboardOverview
              projects={projects}
              ecns={ecns}
              siteVisits={siteVisits}
              onNavigate={handleNavigate}
              onOpenNewProjectModal={() => setActiveView('createProject')}
              onOpenNewEcnModal={() => setIsCreateEcnModalOpen(true)}
              onOpenNewSiteVisitModal={() => setActiveView('siteVisits')}
            />
          )}

          {/* View 2: Project Master */}
          {activeView === 'projectMaster' && (
            <ProjectMaster
              projects={projects}
              selectedProjectId={selectedProjectId}
              onSelectProject={id => setSelectedProjectId(id)}
              onUpdateProject={handleUpdateProject}
              onCreateProject={handleCreateProject}
              onOpenNewProjectModal={() => setActiveView('createProject')}
              isCreateModalOpen={false}
              onCloseCreateModal={() => {}}
              currentUser={currentUser}
              onDeleteProject={handleDeleteProject}
              users={usersList}
              catalog={alternators}
            />
          )}

          {/* View 2B: In-Window Create Project Form (No Modal!) */}
          {activeView === 'createProject' && (
            <CreateProjectView
              onBack={() => setActiveView('projectMaster')}
              onCreateProject={handleCreateProject}
              nextProjectIndex={nextProjectIndex}
              users={usersList}
              formFields={formFields}
              currentUser={currentUser}
              onOpenFormSettings={() => setActiveView('adminPanel')}
              catalog={alternators}
              existingProjects={projects}
            />
          )}

          {/* View 3: ECN / ECR Master */}
          {activeView === 'ecnMaster' && (
            <EcnMaster
              ecns={ecns}
              projects={projects}
              onAddEcn={handleAddEcn}
              isCreateModalOpen={isCreateEcnModalOpen}
              onOpenCreateModal={() => setIsCreateEcnModalOpen(true)}
              onCloseCreateModal={() => setIsCreateEcnModalOpen(false)}
              users={usersList}
            />
          )}

          {/* View 4: Site Visit Record (In-Window form enabled) */}
          {activeView === 'siteVisits' && (
            <SiteVisitMaster
              siteVisits={siteVisits}
              onAddSiteVisit={handleAddSiteVisit}
              users={usersList}
              formFields={formFields}
              currentUser={currentUser}
              onOpenFormSettings={() => setActiveView('adminPanel')}
            />
          )}

          {/* View 4B: FAT & Sea Trials Record */}
          {activeView === 'trialsRecord' && <TrialsMaster />}

          {/* View 4C: Drawing & Wiring Master */}
          {activeView === 'drawingsMaster' && <DrawingsMaster />}

          {/* View 5: Alternator Master */}
          {activeView === 'alternatorMaster' && (
            <AlternatorMaster
              alternators={alternators}
              onAddAlternator={handleAddAlternator}
            />
          )}

          {/* View 6: Inspection Auth Master */}
          {activeView === 'inspectionAuth' && (
            <InspectionAuthMaster
              authorities={authorities}
              onUpdateAuthority={handleUpdateAuthority}
            />
          )}

          {/* View 7: Engineering Tools */}
          {activeView === 'engineeringTools' && <EngineeringTools />}

          {/* View 8: Settings / Admin Panel with Form Settings & Custom Fields */}
          {activeView === 'adminPanel' && currentUser.role === 'admin' && (
            <AdminPanel
              users={usersList}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              formFields={formFields}
              onAddFormField={handleAddFormField}
              onToggleMandatory={handleToggleMandatory}
              onRemoveFormField={handleRemoveFormField}
              projectsCount={projects.length}
              onResetToDefaultData={handleResetToDefaultData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
