'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Upload, FolderOpen, FileText } from 'lucide-react';
import type { Document, DocumentMetadata } from '@/components/documents';

const DocumentViewerModal = dynamic(
  () =>
    import('@/components/documents').then((mod) => ({
      default: mod.DocumentViewerModal,
    })),
  { ssr: false },
);
const DocumentUploadModal = dynamic(
  () =>
    import('@/components/documents').then((mod) => ({
      default: mod.DocumentUploadModal,
    })),
  { ssr: false },
);
const DocumentListModal = dynamic(
  () =>
    import('@/components/documents').then((mod) => ({
      default: mod.DocumentListModal,
    })),
  { ssr: false },
);

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Lease Agreement - 123 Main St.pdf',
    type: 'pdf',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    size: 2457600,
    uploadedBy: 'user-1',
    uploadedByName: 'John Landlord',
    uploadedAt: new Date('2024-03-15T10:30:00').toISOString(),
    category: 'lease',
    description: 'Annual lease agreement for property at 123 Main Street',
  },
  {
    id: '2',
    name: 'Property Inspection Report.pdf',
    type: 'pdf',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    size: 1843200,
    uploadedBy: 'user-2',
    uploadedByName: 'Jane Inspector',
    uploadedAt: new Date('2024-03-10T14:20:00').toISOString(),
    category: 'inspection',
    description: 'Move-in inspection report with photos',
  },
  {
    id: '3',
    name: 'Payment Receipt March 2024.pdf',
    type: 'pdf',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    size: 512000,
    uploadedBy: 'user-3',
    uploadedByName: 'Bob Tenant',
    uploadedAt: new Date('2024-03-01T09:15:00').toISOString(),
    category: 'payment',
    description: 'Rent payment receipt for March 2024',
  },
];

const initialDocuments =
  process.env.NODE_ENV === 'production' ? [] : mockDocuments;

export default function TenantDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);

  const handleUpload = async (
    files: File[],
    metadata: DocumentMetadata,
  ): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const newDocuments: Document[] = files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      type: file.type.startsWith('image/')
        ? 'image'
        : file.type === 'application/pdf'
          ? 'pdf'
          : 'docx',
      url: URL.createObjectURL(file),
      size: file.size,
      uploadedBy: 'current-user',
      uploadedByName: 'Current User',
      uploadedAt: new Date().toISOString(),
      category: metadata.category,
      description: metadata.description,
    }));
    setDocuments((prev) => [...newDocuments, ...prev]);
  };

  const handleDownload = (documentId: string) => {
    const doc = documents.find((d) => d.id === documentId);
    if (doc) {
      const link = window.document.createElement('a');
      link.href = doc.url;
      link.download = doc.name;
      link.click();
    }
  };

  const handleDelete = (documentId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== documentId));
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setIsListModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight mb-1">
          Documents
        </h1>
        <p className="text-blue-200/50">
          Upload, view, and manage your rental documents.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-4">
            <FileText className="text-blue-400" size={20} />
          </div>
          <h3 className="text-2xl font-black text-white mb-0.5">
            {documents.length}
          </h3>
          <p className="text-sm text-blue-200/40">Total Documents</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center mb-4">
            <FolderOpen className="text-purple-400" size={20} />
          </div>
          <h3 className="text-2xl font-black text-white mb-0.5">
            {new Set(documents.map((d) => d.category)).size}
          </h3>
          <p className="text-sm text-blue-200/40">Categories</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
            <Upload className="text-emerald-400" size={20} />
          </div>
          <h3 className="text-2xl font-black text-white mb-0.5">
            {(
              documents.reduce((acc, doc) => acc + doc.size, 0) /
              (1024 * 1024)
            ).toFixed(1)}{' '}
            MB
          </h3>
          <p className="text-sm text-blue-200/40">Total Storage</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 text-sm"
        >
          <Upload size={16} />
          Upload Documents
        </button>
        <button
          onClick={() => setIsListModalOpen(true)}
          className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors border border-white/10 flex items-center gap-2 text-sm"
        >
          <FolderOpen size={16} />
          Browse All
        </button>
      </div>

      {/* Recent Documents */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-white/5">
          <h2 className="text-lg font-bold text-white">Recent Documents</h2>
        </div>
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <FolderOpen className="text-blue-300/20 mb-4" size={48} />
            <p className="text-white font-semibold mb-1">No documents yet</p>
            <p className="text-blue-200/40 text-sm mb-6">
              Your landlord hasn&apos;t uploaded any documents for your account.
            </p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-sm"
            >
              Upload Your First Document
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {documents.slice(0, 5).map((doc) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDocument(doc)}
                className="px-6 py-4 hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="text-blue-400" size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate text-sm">
                      {doc.name}
                    </p>
                    <p className="text-xs text-blue-200/40 mt-0.5">
                      {new Date(doc.uploadedAt).toLocaleDateString()} ·{' '}
                      {(doc.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg shrink-0">
                  {doc.category}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <DocumentViewerModal
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
        onDownload={handleDownload}
      />
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />
      <DocumentListModal
        documents={documents}
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        onView={handleViewDocument}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onUploadClick={() => {
          setIsListModalOpen(false);
          setIsUploadModalOpen(true);
        }}
      />
    </div>
  );
}
