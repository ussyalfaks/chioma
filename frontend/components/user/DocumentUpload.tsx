'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useUploadDocument,
  DocumentType,
} from '@/lib/query/hooks/use-landlord-documents';
import { useAuthStore } from '@/store/authStore';

interface DocumentUploadProps {
  propertyId?: string;
  propertyName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function DocumentUpload({
  propertyId,
  propertyName,
  onSuccess,
  onCancel,
  className = '',
}: DocumentUploadProps) {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'OTHER' as DocumentType,
    description: '',
    propertyId: propertyId || '',
    propertyName: propertyName || '',
  });

  const uploadMutation = useUploadDocument();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!formData.name) {
        setFormData((prev) => ({ ...prev, name: file.name }));
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !formData.name.trim()) return;

    uploadMutation.mutate(
      {
        file: selectedFile,
        metadata: {
          name: formData.name,
          type: formData.type,
          description: formData.description,
          propertyId: formData.propertyId,
          propertyName: formData.propertyName,
        },
      },
      {
        onSuccess: () => {
          setSelectedFile(null);
          setFormData({
            name: '',
            type: 'OTHER',
            description: '',
            propertyId: propertyId || '',
            propertyName: propertyName || '',
          });
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          if (onSuccess) {
            onSuccess();
          }
        },
      },
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      <div className="bg-white rounded-3xl p-8 border border-neutral-100 shadow-sm">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">
          Upload Document
        </h2>

        <div className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">
              File <span className="text-red-500">*</span>
            </label>
            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                selectedFile
                  ? 'border-green-300 bg-green-50'
                  : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp"
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-8 h-8 text-green-500" />
                  <div className="text-left">
                    <div className="font-medium text-neutral-900">
                      {selectedFile.name}
                    </div>
                    <div className="text-sm text-neutral-500">
                      {formatFileSize(selectedFile.size)}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
                  <p className="text-sm text-neutral-600 mb-1">
                    Click to upload a file
                  </p>
                  <p className="text-xs text-neutral-400">
                    PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG, GIF, WebP (max
                    50MB)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Document Name */}
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium text-neutral-700"
            >
              Document Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              placeholder="Enter document name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              className="w-full"
            />
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <label
              htmlFor="type"
              className="text-sm font-medium text-neutral-700"
            >
              Document Type
            </label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleInputChange('type', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LEASE">Lease Agreement</SelectItem>
                <SelectItem value="INSPECTION">Inspection Report</SelectItem>
                <SelectItem value="RECEIPT">Receipt</SelectItem>
                <SelectItem value="CONTRACT">Contract</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Property */}
          {!propertyId && (
            <div className="space-y-2">
              <label
                htmlFor="property"
                className="text-sm font-medium text-neutral-700"
              >
                Property
              </label>
              <Input
                id="property"
                placeholder="Property name or address"
                value={formData.propertyName}
                onChange={(e) =>
                  handleInputChange('propertyName', e.target.value)
                }
                className="w-full"
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <label
              htmlFor="description"
              className="text-sm font-medium text-neutral-700"
            >
              Description (Optional)
            </label>
            <Textarea
              id="description"
              placeholder="Add a brief description of the document..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={uploadMutation.isPending}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={
            uploadMutation.isPending || !selectedFile || !formData.name.trim()
          }
        >
          {uploadMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload Document'
          )}
        </Button>
      </div>
    </form>
  );
}
