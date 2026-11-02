import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { Project, EcnEcr, SiteVisit } from '../types/index.ts';
import { ActiveView } from './Sidebar.tsx';

Chart.register(...registerables);

interface DashboardOverviewProps {
  projects: Project[];
  ecns: EcnEcr[];
  siteVisits: SiteVisit[];
  onNavigate: (view: ActiveView, projectId?: string) => void;
  onOpenNewProjectModal?: () => void;
  onOpenNewEcnModal?: () => void;
  onOpenNewSiteVisitModal?: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  projects,
  ecns,
  siteVisits,
  onNavigate,
}) => {
  const progressBarCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const statusPieCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const barChartInstance = useRef<Chart | null>(null);
  const pieChartInstance = useRef<Chart | null>(null);

  // Month-wise filter state (Default 'ALL' shows all projects on refresh / load)
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  // Filter projects by month
  const filteredProjects = projects.filter(p => {
    if (selectedMonth === 'ALL') return true;
    const createdMonth = p.createdAt ? p.createdAt.substring(0, 7) : '';
    const tncMonth = p.designInputs?.tncDate ? p.designInputs.tncDate.substring(0, 7) : '';
    return createdMonth === selectedMonth || tncMonth === selectedMonth;
  });

  // Extract available unique months from projects data
  const availableMonths = Array.from(
    new Set(
      projects
        .flatMap(p => [
          p.createdAt ? p.createdAt.substring(0, 7) : null,
          p.designInputs?.tncDate ? p.designInputs.tncDate.substring(0, 7) : null,
        ])
        .filter((m): m is string => Boolean(m))
    )
  ).sort().reverse();

  // Helper to format YYYY-MM into readable string e.g. "October 2026"
  const formatMonthName = (ym: string) => {
    const [year, month] = ym.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Derived metrics dynamically reflecting the active month filter
  const totalProjects = filteredProjects.length;
  const closedProjects = filteredProjects.filter(p => p.status === 'CLOSED').length;
  const openProjects = totalProjects - closedProjects;
  const totalEcns = ecns.length;
  const totalSiteVisits = siteVisits.length;

  // Initialize and update Chart.js instances
  useEffect(() => {
    // 1. Spacious Bar Chart: Project Execution & PLM Release Progress (%)
    if (progressBarCanvasRef.current) {
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }

      // Filtered projects ordered cleanly
      const sortedProjects = [...filteredProjects].sort((a, b) => a.projectCode.localeCompare(b.projectCode));
      const labels = sortedProjects.length > 0 ? sortedProjects.map(p => p.projectCode) : ['No Projects in Month'];
      const data = sortedProjects.length > 0 ? sortedProjects.map(p => p.progressPercent) : [0];

      barChartInstance.current = new Chart(progressBarCanvasRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'PLM Release Progress (%)',
              data,
              // Vibrant dark green bars as specified
              backgroundColor: '#064e3b',
              hoverBackgroundColor: '#043d2e',
              borderRadius: 8,
              borderSkipped: false,
              barThickness: 42,
              maxBarThickness: 56,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: { top: 12, bottom: 4, left: 8, right: 8 },
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                stepSize: 20,
                callback: value => `${value}%`,
                font: { family: 'Plus Jakarta Sans, sans-serif', size: 12, weight: 600 },
                color: '#64748b',
                padding: 8,
              },
              grid: {
                color: '#e2e8f0',
              },
              border: {
                dash: [4, 4],
              },
            },
            x: {
              ticks: {
                font: { family: 'Plus Jakarta Sans, sans-serif', size: 12, weight: 600 },
                color: '#1e293b',
                padding: 8,
              },
              grid: { display: false },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#064e3b',
              titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: 'bold' },
              bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: context => ` Engineering & PLM Progress: ${context.parsed.y}%`,
                title: items => {
                  const p = sortedProjects[items[0].dataIndex];
                  return p ? `${p.projectCode} · ${p.designInputs.projectName}` : '';
                },
              },
            },
          },
        },
      });
    }

    // 2. Circular Donut Chart: Project Status Distribution (blue, orange, green)
    if (statusPieCanvasRef.current) {
      if (pieChartInstance.current) {
        pieChartInstance.current.destroy();
      }

      const inProgressCount = filteredProjects.filter(p => p.status === 'IN_PROGRESS').length;
      const pureOpenCount = filteredProjects.filter(p => p.status === 'OPEN').length;
      const closedCount = closedProjects;
      const hasData = inProgressCount + pureOpenCount + closedCount > 0;

      pieChartInstance.current = new Chart(statusPieCanvasRef.current, {
        type: 'doughnut',
        data: {
          labels: ['In Progress', 'Open / New', 'Closed / PLM Released'],
          datasets: [
            {
              data: hasData ? [inProgressCount, pureOpenCount, closedCount] : [0, 0, 0],
              // Explicit blue, orange, green matching prompt
              backgroundColor: ['#2563eb', '#f59e0b', '#10b981'],
              hoverBackgroundColor: ['#1d4ed8', '#d97706', '#059669'],
              borderWidth: 3,
              borderColor: '#ffffff',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                boxHeight: 12,
                borderRadius: 3,
                useBorderRadius: true,
                font: { family: 'Plus Jakarta Sans, sans-serif', size: 11, weight: 600 },
                color: '#334155',
                padding: 16,
              },
            },
            tooltip: {
              backgroundColor: '#0f172a',
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: context => ` Projects: ${context.parsed} (${totalProjects > 0 ? Math.round((context.parsed / totalProjects) * 100) : 0}%)`,
              },
            },
          },
        },
      });
    }

    return () => {
      if (barChartInstance.current) barChartInstance.current.destroy();
      if (pieChartInstance.current) pieChartInstance.current.destroy();
    };
  }, [filteredProjects, closedProjects, totalProjects]);

  // Action Points & Gates list with exactly 7 items showcasing highlighted tasks
  const actionGates = [
    {
      id: 'gate-1',
      title: 'SOTR Feedback Awaited',
      projectCode: 'KOEL-MAR-2026-003',
      projectId: 'proj-3',
      sublabel: 'Alternator 750 kVA: SOTR submitted to shipyard & DNV. Awaiting confirmation of dynamic inclination limits.',
      isHighlighted: true,
      tag: 'Awaited',
      tagType: 'warning',
    },
    {
      id: 'gate-2',
      title: 'Junction Box',
      projectCode: 'KOEL-MAR-2026-001',
      projectId: 'proj-1',
      sublabel: 'Structure not released in PLM. Terminal rail allocation & brass gland plate ingress verification pending.',
      isHighlighted: false,
      tag: 'PLM Pending',
      tagType: 'danger',
    },
    {
      id: 'gate-3',
      title: 'ECR/MAR/2026/007 Impact Sign-off',
      projectCode: 'KOEL-MAR-2026-003',
      projectId: 'proj-3',
      sublabel: 'Auxiliary pre-lube pump control interlock wiring modification requested by ONGC / L&T Yard.',
      isHighlighted: false,
      tag: 'ECR Review',
      tagType: 'info',
    },
    {
      id: 'gate-4',
      title: 'LCP Non-Magnetic Gland Plate',
      projectCode: 'KOEL-MAR-2026-001',
      projectId: 'proj-1',
      sublabel: 'IRS Part 4 Ch 8 eddy current heating prevention drawing release validation for 350 kVA genset.',
      isHighlighted: false,
      tag: 'Drawing Rev',
      tagType: 'neutral',
    },
    {
      id: 'gate-5',
      title: 'Electrical Interface Diagram (EID)',
      projectCode: 'KOEL-MAR-2026-001',
      projectId: 'proj-1',
      sublabel: 'EID-YD1264-REV-C interface schematics submitted for Indian Coast Guard yard approval.',
      isHighlighted: false,
      tag: 'In Review',
      tagType: 'neutral',
    },
    {
      id: 'gate-6',
      title: 'FAT Witness Protocol Schedule',
      projectCode: 'KOEL-MAR-2026-003',
      projectId: 'proj-3',
      sublabel: 'DNV Surveyor witnessed factory acceptance testing schedule reservation for emergency DG set.',
      isHighlighted: false,
      tag: 'FAT Schedule',
      tagType: 'teal',
    },
    {
      id: 'gate-7',
      title: 'AVM Deflection Certificate Sign-off',
      projectCode: 'KOEL-MAR-2026-001',
      projectId: 'proj-1',
      sublabel: 'Closeout of MDL Yard 1264 vibration isolation mount alignment trial report with IRS surveyor.',
      isHighlighted: false,
      tag: 'Yard Protocol',
      tagType: 'teal',
    },
  ];

  // Marine projects for table display matching the active month filter
  const displayProjects = filteredProjects.slice(0, 3);

  return (
    <div className="space-y-5 lg:space-y-6 max-w-[1720px] mx-auto">
      {/* Top Action Bar: Month-wise Filter & Refresh Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 pb-1">
        <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Marine Engineering Operations</span>
          <span className="hidden sm:inline-block text-slate-300">|</span>
          <span className="text-slate-500 font-normal">
            {selectedMonth === 'ALL'
              ? `All Projects (${filteredProjects.length})`
              : `Month: ${formatMonthName(selectedMonth)} (${filteredProjects.length} ${filteredProjects.length === 1 ? 'Project' : 'Projects'})`}
          </span>
        </div>

        {/* Month-wise Filter on the Right */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-300 shadow-xs ring-1 ring-emerald-500/10">
            <i className="fa-solid fa-filter text-emerald-700 text-xs" />
            <label htmlFor="month-filter-select" className="text-xs font-bold text-slate-700 whitespace-nowrap">
              Filter Month:
            </label>
            <select
              id="month-filter-select"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL">All Months (All Projects)</option>
              {availableMonths.map(ym => (
                <option key={ym} value={ym}>
                  {formatMonthName(ym)}
                </option>
              ))}
            </select>
          </div>

          {/* Reset to All Projects Button */}
          <button
            type="button"
            onClick={() => setSelectedMonth('ALL')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer ${
              selectedMonth !== 'ALL'
                ? 'bg-[#064e3b] text-white hover:bg-[#043d2e] ring-1 ring-emerald-600/30'
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
            }`}
            title="Reset / Show All Projects"
          >
            <i className="fa-solid fa-arrows-rotate text-[11px]" />
            <span>All Projects</span>
          </button>
        </div>
      </div>

      {/* Five Key KPI Metric Cards (Spacious, Big Numbers, Mini-Icons, Breathing Room) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 lg:gap-4 xl:gap-5">
        {/* KPI 1: Total Projects (3) */}
        <div
          onClick={() => onNavigate('projectMaster')}
          className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2.5">
            <span className="text-xs lg:text-sm font-semibold text-slate-600">Total Projects</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-emerald-50 text-slate-600 group-hover:text-emerald-700 flex items-center justify-center transition-colors">
              <i className="fa-solid fa-ship text-xs" />
            </div>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 tabular-nums tracking-tight">
              {totalProjects}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              Active engineering portfolio
            </div>
          </div>
        </div>

        {/* KPI 2: Open Projects (2) */}
        <div
          onClick={() => onNavigate('projectMaster')}
          className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2.5">
            <span className="text-xs lg:text-sm font-semibold text-slate-600">Open Projects</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <i className="fa-solid fa-spinner text-xs" />
            </div>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-extrabold text-blue-600 tabular-nums tracking-tight">
              {openProjects}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              In design &amp; PLM staging
            </div>
          </div>
        </div>

        {/* KPI 3: Closed Projects (1) */}
        <div
          onClick={() => onNavigate('projectMaster')}
          className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2.5">
            <span className="text-xs lg:text-sm font-semibold text-slate-600">Closed Projects</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <i className="fa-solid fa-circle-check text-xs" />
            </div>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-extrabold text-emerald-700 tabular-nums tracking-tight">
              {closedProjects}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              100% PLM released &amp; audited
            </div>
          </div>
        </div>

        {/* KPI 4: No. of ECNs/ECRs (2) */}
        <div
          onClick={() => onNavigate('ecnMaster')}
          className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2.5">
            <span className="text-xs lg:text-sm font-semibold text-slate-600">No. of ECNs/ECRs</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <i className="fa-solid fa-file-signature text-xs" />
            </div>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-extrabold text-amber-600 tabular-nums tracking-tight">
              {totalEcns}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              Engineering changes tracked
            </div>
          </div>
        </div>

        {/* KPI 5: No. of Site Visits (3) */}
        <div
          onClick={() => onNavigate('siteVisits')}
          className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-teal-300 transition-all cursor-pointer group flex flex-col justify-between col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2.5">
            <span className="text-xs lg:text-sm font-semibold text-slate-600">No. of Site Visits</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <i className="fa-solid fa-anchor text-xs" />
            </div>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-extrabold text-teal-700 tabular-nums tracking-tight">
              {totalSiteVisits}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              Shipyards &amp; sea trial records
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Action Gates (Widely Spaced Cards) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 lg:gap-6">
        {/* Top-Left / Main: Broad Bar Chart (8 cols) */}
        <div className="xl:col-span-8 bg-white p-5 lg:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Project Execution &amp; PLM Release Progress (%)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Spacious progress metrics across marine orders on a 0-100% engineering scale
              </p>
            </div>

            {/* Live PLM Engine Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              Live PLM Engine
            </span>
          </div>

          <div className="h-56 lg:h-60 w-full">
            <canvas ref={progressBarCanvasRef} />
          </div>
        </div>

        {/* Top-Right: Project Status Distribution (4 cols) */}
        <div className="xl:col-span-4 bg-white p-5 lg:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Project Status Distribution
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-1">
              Circular breakdown of active &amp; closed projects
            </p>
          </div>

          <div className="h-48 lg:h-52 w-full flex items-center justify-center my-auto">
            <canvas ref={statusPieCanvasRef} />
          </div>
        </div>
      </div>

      {/* Bottom Row: Summary Table (7 cols) + Action Points & Gates (5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 lg:gap-6">
        {/* Bottom-Left: Active Marine Projects Summary (7 cols) */}
        <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="p-4 lg:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Active Marine Projects Summary
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Clean modern grid of active marine orders with 53 design inputs
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('projectMaster')}
              className="text-xs font-bold text-[#064e3b] hover:text-emerald-700 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>View All Projects</span>
              <i className="fa-solid fa-arrow-right text-[10px]" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 font-bold text-slate-700">Code</th>
                  <th className="py-2.5 px-4 font-bold text-slate-700">Project Name</th>
                  <th className="py-2.5 px-4 font-bold text-slate-700">Customer &amp; Yard</th>
                  <th className="py-2.5 px-4 font-bold text-slate-700">Rating</th>
                  <th className="py-2.5 px-4 font-bold text-slate-700">Class</th>
                  <th className="py-2.5 px-4 font-bold text-slate-700">Status</th>
                  <th className="py-2.5 px-4 font-bold text-slate-700 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayProjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <i className="fa-solid fa-calendar-xmark text-slate-400 text-xl" />
                        <p className="font-semibold text-xs text-slate-700">
                          No marine projects recorded for {formatMonthName(selectedMonth)}
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedMonth('ALL')}
                          className="mt-1 px-3 py-1 bg-[#064e3b] text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-[#043d2e]"
                        >
                          View All Projects
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayProjects.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-900">
                        {p.projectCode}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div className="font-semibold">{p.designInputs.projectName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {p.designInputs.typeOfDg}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div className="font-medium">{p.designInputs.customerName}</div>
                        <div className="text-[10px] text-slate-400">{p.designInputs.yardNumber}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-800">
                        <div className="font-semibold">{p.designInputs.dgRatingKva} kVA</div>
                        <div className="text-[10px] text-slate-400">{p.designInputs.dgRatingKwe} kWe</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-[11px] text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                          {p.designInputs.primaryClass}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold text-[11px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
                            p.status === 'CLOSED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : p.status === 'IN_PROGRESS'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.status === 'CLOSED'
                                ? 'bg-emerald-600'
                                : p.status === 'IN_PROGRESS'
                                ? 'bg-blue-600'
                                : 'bg-amber-600'
                            }`}
                          />
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onNavigate('projectMaster', p.id)}
                          className="px-3 py-1 text-xs font-semibold text-white bg-[#064e3b] hover:bg-[#043d2e] rounded-lg transition-colors cursor-pointer shadow-2xs"
                        >
                          Open PLM →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-2.5 bg-slate-50/50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between px-4">
            <span>
              {selectedMonth === 'ALL'
                ? 'Showing marine builds across all months'
                : `Showing marine builds for ${formatMonthName(selectedMonth)}`}
            </span>
            <span className="font-medium text-emerald-800">{displayProjects.length} projects visible</span>
          </div>
        </div>

        {/* Bottom-Right: Action Points & Gates (7 items) (5 cols) */}
        <div className="xl:col-span-5 bg-white p-4 lg:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <i className="fa-solid fa-triangle-exclamation text-xs" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Action Points &amp; Gates</h3>
                <p className="text-[11px] text-slate-500">Critical engineering approvals and bottlenecks</p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-300/50">
              7 items
            </span>
          </div>

          {/* List of 7 Items */}
          <div className="space-y-2 my-2.5 max-h-[340px] overflow-y-auto pr-1">
            {actionGates.map(item => {
              if (item.isHighlighted) {
                // Highlighted task box: "SOTR Feedback Awaited" (KOEL-MAR-2026-003) with yellow alert icon
                return (
                  <div
                    key={item.id}
                    onClick={() => onNavigate('projectMaster', item.projectId)}
                    className="p-3 bg-amber-50/90 border-2 border-amber-400 rounded-xl text-xs hover:bg-amber-100/70 transition-all cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-amber-950 mb-1">
                      <span className="flex items-center gap-2">
                        {/* Yellow Alert Icon */}
                        <i className="fa-solid fa-triangle-exclamation text-amber-500 text-sm" />
                        <span className="text-xs font-extrabold text-amber-950 tracking-tight">
                          {item.title}
                        </span>
                      </span>
                      <span className="text-[11px] font-mono font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">
                        {item.projectCode}
                      </span>
                    </div>
                    <p className="text-amber-900/90 font-medium leading-relaxed pl-6 text-[11px]">
                      {item.sublabel}
                    </p>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  onClick={() => onNavigate('projectMaster', item.projectId)}
                  className="p-2 bg-slate-50/80 hover:bg-slate-100/90 border border-slate-200/80 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between font-semibold text-slate-900 mb-0.5">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span className="text-xs font-bold text-slate-800">{item.title}</span>
                    </span>

                    {/* Tag label */}
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                        item.tagType === 'danger'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : item.tagType === 'warning'
                          ? 'bg-amber-100 text-amber-800'
                          : item.tagType === 'teal'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.tag}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pl-3.5 text-[11px] text-slate-500">
                    <span className="truncate pr-2">{item.sublabel}</span>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">
                      {item.projectCode}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 font-medium">
              Click any gate item to open directly in Project Master
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};



