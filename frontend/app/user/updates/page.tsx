'use client';

import React, { useState } from 'react';
import { Bell, Wrench, LayoutGrid, List } from 'lucide-react';
import AnnouncementsFeed from '@/components/announcements/AnnouncementsFeed';
import TenantMaintenanceTracker from '@/components/maintenance/TenantMaintenanceTracker';

type ViewTab = 'announcements' | 'maintenance';
type ViewMode = 'combined' | 'separate';

export default function PropertyUpdatesPage() {
  const [activeTab, setActiveTab] = useState<ViewTab>('announcements');
  const [viewMode, setViewMode] = useState<ViewMode>('combined');

  const tabs = [
    { id: 'announcements' as ViewTab, label: 'Announcements', icon: Bell },
    { id: 'maintenance' as ViewTab, label: 'Maintenance', icon: Wrench },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-1">
            Updates & Maintenance
          </h1>
          <p className="text-blue-200/50">
            Stay informed with announcements and manage your maintenance
            requests.
          </p>
        </div>
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          <button
            onClick={() => setViewMode('combined')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              viewMode === 'combined'
                ? 'bg-blue-600 text-white'
                : 'text-blue-200/50 hover:text-white'
            }`}
          >
            <LayoutGrid size={15} />
            Combined
          </button>
          <button
            onClick={() => setViewMode('separate')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              viewMode === 'separate'
                ? 'bg-blue-600 text-white'
                : 'text-blue-200/50 hover:text-white'
            }`}
          >
            <List size={15} />
            Separate
          </button>
        </div>
      </div>

      {viewMode === 'combined' ? (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                  <Bell className="text-blue-400" size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-200/50">
                    New Announcements
                  </p>
                  <p className="text-2xl font-black text-white">3</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
                  <Wrench className="text-amber-400" size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-200/50">
                    Open Requests
                  </p>
                  <p className="text-2xl font-black text-white">2</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Wrench className="text-emerald-400" size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-200/50">
                    Resolved This Month
                  </p>
                  <p className="text-2xl font-black text-white">5</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnnouncementsFeed />
            <TenantMaintenanceTracker />
          </div>
        </div>
      ) : (
        <div>
          {/* Tabs */}
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-6 w-fit">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-blue-200/50 hover:text-white'
                  }`}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'announcements' && <AnnouncementsFeed />}
          {activeTab === 'maintenance' && <TenantMaintenanceTracker />}
        </div>
      )}
    </div>
  );
}
