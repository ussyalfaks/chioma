import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/store/authStore';
import { Uploader } from '@/components/ui/Uploader';
import { useState } from 'react';

export const metadata: Metadata = {
    title: 'New Dispute | Tenant Portal',
    description: 'File a new rental dispute.',
};

export default function NewDisputePage() {
    const { user, isAuthenticated, loading } = useAuthStore();
    const [formData, setFormData] = useState({
        propertyId: '',
        disputeType: '',
        description: '',
        requestedAmount: '',
    });
    const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    if (!isAuthenticated || user?.role !== 'tenant') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-8">
                <div className="max-w-md text-center text-white">
                    <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
                    <p className="text-xl mb-8 text-blue-200/80">Only tenants can file disputes.</p>
                    <Link href="/login">
                        <Button className="bg-white text-neutral-900 hover:bg-neutral-100 font-semibold px-8 h-12 text-lg">
                            Sign in as Tenant
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        // TODO: POST /api/disputes with formData + evidenceFiles
        // useMutation hook
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Redirect to disputes list
            window.location.href = '/tenant/disputes';
        } catch (error) {
            console.error('Failed to create dispute:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-8 flex items-center text-sm text-neutral-400 space-x-2">
                <Link href="/tenant/disputes" className="hover:text-white transition-colors flex items-center gap-1">
                    <ArrowLeft size={16} />
                    All Disputes
                </Link>
                <span>→</span>
                <span className="font-semibold text-white">New Dispute</span>
            </div>

            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900 mb-3">File New Dispute</h1>
                    <p className="text-xl text-neutral-600 max-w-md mx-auto">
                        Report issues with your rental property or agreement
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="property" className="block text-sm font-medium text-neutral-700 mb-2">
                                Property
                            </label>
                            <Select value={formData.propertyId} onValueChange={(value) => setFormData({ ...formData, propertyId: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select property" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="prop-1">Sunset Apartments, Unit 4B</SelectItem>
                                    <SelectItem value="prop-2">Ocean View Tower, Apt 12C</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="amount" className="block text-sm font-medium text-neutral-700 mb-2">
                                Requested Amount (₦)
                            </label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0.00"
                                value={formData.requestedAmount}
                                onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="type" className="block text-sm font-medium text-neutral-700 mb-2">
                            Dispute Type
                        </label>
                        <Select value={formData.disputeType} onValueChange={(value) => setFormData({ ...formData, disputeType: value })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MAINTENANCE">Maintenance Issue</SelectItem>
                                <SelectItem value="SECURITY_DEPOSIT">Security Deposit</SelectItem>
                                <SelectItem value="RENT_ADJUSTMENT">Rent Adjustment</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-2">
                            Description
                        </label>
                        <Textarea
                            id="description"
                            rows={6}
                            placeholder="Provide detailed description of the issue, dates, communications attempted, etc..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="resize-none"
                        />
                    </div>

                    <div>
                        <Label>Evidence/Documents (Photos, receipts, emails)</Label>
                        <Uploader
                            label="Evidence"
                            accept="image/*,application/pdf"
                            multiple
                            maxFiles={5}
                            onFilesSelected={setEvidenceFiles}
                        />
                        {evidenceFiles.length > 0 && (
                            <p className="text-sm text-neutral-500 mt-2">{evidenceFiles.length} file{evidenceFiles.length > 1 ? 's' : ''} selected</p>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-neutral-200">
                        <Link href="/tenant/disputes" className="flex-1">
                            <Button type="button" variant="outline" className="w-full sm:w-auto">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" className="flex-1 font-semibold sm:w-auto" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Creating Dispute...
                                </>
                            ) : (
                                'File Dispute'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
