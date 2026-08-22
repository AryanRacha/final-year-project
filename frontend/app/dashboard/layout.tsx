'use client';

import React, { useState } from 'react';
import { VercelSidebar } from '@/components/VercelSidebar';
import { AddProjectModal } from '@/components/AddProjectModal';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-black text-zinc-100">
      {/* Left Sidebar */}
      <VercelSidebar onOpenAddModal={() => setIsAddModalOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#000000] overflow-y-auto">
        {children}
      </main>

      {/* Connect Modal */}
      <AddProjectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }}
      />
    </div>
  );
}