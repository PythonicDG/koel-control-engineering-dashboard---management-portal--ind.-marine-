import React from 'react';
import { User } from '../types/index.ts';
import { BrandLogo } from './BrandLogo.tsx';

interface NavbarProps {
  currentUser: User;
  onLogout: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeViewTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
      {/* Prominent horizontal header with ample white space */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 h-20 flex items-center justify-between gap-6">
        {/* Left Zone: Hamburger Menu + Kirloskar Logo & KOEL MARINE Badge */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? 'Collapse menu' : 'Expand menu'}
            className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200/60"
            title="Toggle Sidebar Menu"
          >
            {/* Clean three horizontal lines */}
            <svg
              className="w-5 h-5 text-slate-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Green Kirloskar Brand Logo + Teal-Green KOEL MARINE badge (No duplicate KOEL text) */}
          <BrandLogo size="md" />
        </div>

        {/* Center-Left Zone: Title in bold with clean ample white space */}
        <div className="hidden md:flex items-center gap-3.5 flex-1 pl-2">
          <div className="h-7 w-px bg-slate-200 mr-1" />
          <h1 className="text-base lg:text-lg font-bold text-slate-900 tracking-tight whitespace-nowrap">
            Control Engineering Dashboard (Ind.Marine)
          </h1>
        </div>

        {/* Right Zone: User Profile Section & Subtle Red Outlined Logout */}
        <div className="flex items-center gap-4 shrink-0">
          {/* User profile section - Clean Admin role only */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs lg:text-sm font-bold text-slate-800 leading-tight">
                Admin
              </div>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 tracking-wider">
                  ADMIN
                </span>
              </div>
            </div>

            {/* Circular avatar "AD" */}
            <div
              className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-800 to-teal-700 text-white font-bold flex items-center justify-center text-xs shadow-xs ring-2 ring-emerald-500/20 shrink-0"
              title="Administrator"
            >
              AD
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          {/* Logout button with exit icon in subtle red outlined style */}
          <button
            type="button"
            onClick={onLogout}
            title="Sign out of Marine Portal"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50/70 border border-rose-300 hover:border-rose-400 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <i className="fa-solid fa-arrow-right-from-bracket text-xs text-rose-600" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

