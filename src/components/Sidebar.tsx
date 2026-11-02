import React from 'react';
import { UserRole } from '../types/index.ts';

export type ActiveView =
  | 'dashboard'
  | 'projectMaster'
  | 'createProject'
  | 'ecnMaster'
  | 'siteVisits'
  | 'trialsRecord'
  | 'drawingsMaster'
  | 'alternatorMaster'
  | 'inspectionAuth'
  | 'engineeringTools'
  | 'adminPanel';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  userRole: UserRole;
  counts: {
    totalProjects: number;
    openEcns: number;
    siteVisits: number;
    pendingTasks: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeView,
  onSelectView,
  userRole,
  counts,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as ActiveView,
      label: 'Main Dashboard',
      icon: 'fa-solid fa-chart-line',
      badge: null,
      adminOnly: false,
    },
    {
      id: 'projectMaster' as ActiveView,
      label: 'Project Master',
      icon: 'fa-solid fa-ship',
      badge: counts.totalProjects > 0 ? String(counts.totalProjects) : null,
      badgeColor: 'bg-emerald-700 text-emerald-100',
      adminOnly: false,
    },
    {
      id: 'ecnMaster' as ActiveView,
      label: 'ECN / ECR Master',
      icon: 'fa-solid fa-file-signature',
      badge: counts.openEcns > 0 ? String(counts.openEcns) : null,
      badgeColor: 'bg-amber-400 text-slate-900 font-bold',
      adminOnly: false,
    },
    {
      id: 'siteVisits' as ActiveView,
      label: 'Site Visit Record',
      icon: 'fa-solid fa-anchor',
      badge: counts.siteVisits > 0 ? String(counts.siteVisits) : null,
      badgeColor: 'bg-teal-700 text-teal-100',
      adminOnly: false,
    },
    {
      id: 'trialsRecord' as ActiveView,
      label: 'FAT & Sea Trials Record',
      icon: 'fa-solid fa-water',
      badge: null,
      adminOnly: false,
    },
    {
      id: 'drawingsMaster' as ActiveView,
      label: 'Drawing & Wiring Master',
      icon: 'fa-solid fa-compass-drafting',
      badge: null,
      adminOnly: false,
    },
    {
      id: 'alternatorMaster' as ActiveView,
      label: 'Alternator Master',
      icon: 'fa-solid fa-bolt',
      badge: null,
      adminOnly: false,
    },
    {
      id: 'inspectionAuth' as ActiveView,
      label: 'Inspection Auth Master',
      icon: 'fa-solid fa-stamp',
      badge: null,
      adminOnly: false,
    },
    {
      id: 'engineeringTools' as ActiveView,
      label: 'Engineering Tools',
      icon: 'fa-solid fa-calculator',
      badge: null,
      badgeColor: '',
      adminOnly: false,
    },
    {
      id: 'adminPanel' as ActiveView,
      label: 'Settings / Admin P...',
      icon: 'fa-solid fa-sliders',
      badge: 'ADMIN',
      badgeColor: 'bg-emerald-400 text-slate-950 font-extrabold',
      adminOnly: true,
    },
  ];

  const visibleItems = menuItems.filter(item => !item.adminOnly || userRole === 'admin');

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 top-20 bg-slate-900/60 backdrop-blur-xs z-30 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Dark Green Collapsible Side Navigation Drawer */}
      <aside
        className={`fixed lg:sticky top-20 z-30 h-[calc(100vh-5rem)] bg-[#064e3b] text-white border-r border-[#043d2e] shadow-lg transition-all duration-300 ease-in-out flex flex-col justify-between shrink-0 ${
          isOpen ? 'w-68 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'
        }`}
      >
        {/* Navigation Items with Spaced-out Breathing Room */}
        <div className="py-6 px-3.5 overflow-y-auto space-y-1.5 flex-1">
          <div className="space-y-1.5">
            {visibleItems.map(item => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectView(item.id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-left transition-all cursor-pointer group ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md font-semibold ring-1 ring-teal-300/30'
                      : 'text-emerald-100/80 hover:text-white hover:bg-emerald-800/50 font-medium'
                  }`}
                  title={item.label}
                >
                  <div
                    className={`w-6 flex justify-center text-base shrink-0 ${
                      isActive ? 'text-white' : 'text-emerald-300 group-hover:text-white'
                    }`}
                  >
                    <i className={item.icon} />
                  </div>

                  {isOpen && (
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <span className="text-xs lg:text-[13px] tracking-tight truncate">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md ml-2 shrink-0 ${
                            item.badgeColor || (isActive ? 'bg-emerald-800 text-white' : 'bg-emerald-900 text-emerald-200')
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
};

