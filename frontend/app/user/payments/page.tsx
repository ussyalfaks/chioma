'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { format } from 'date-fns';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  Clock3,
  ReceiptText,
  Search,
} from 'lucide-react';
import { useAuth } from '@/store/authStore';
import {
  type DashboardPayment,
  loadTenantPayments,
} from '@/lib/dashboard-data';

const statusStyles: Record<DashboardPayment['status'], string> = {
  COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
  REFUNDED: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
};

export default function TenantPaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<DashboardPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      const nextPayments = await loadTenantPayments(user?.id);
      if (active) {
        setPayments(nextPayments);
        setLoading(false);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const filteredPayments = payments.filter((payment) => {
    const haystack = [
      payment.propertyName,
      payment.counterpartyName,
      payment.paymentMethod,
      payment.referenceNumber,
      payment.notes,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  const totalPaid = payments
    .filter((p) => p.direction === 'outgoing')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalRefunded = payments
    .filter((p) => p.direction === 'incoming')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">
              Payment History
            </p>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Track every rent payment and refund
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-200/50">
              Consolidated rent payments, refunds, and references for audit or
              dispute follow-up.
            </p>
          </div>
          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-300/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search payment history"
              className="h-11 w-full rounded-full border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white placeholder:text-blue-300/30 outline-none focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20 transition"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <SummaryCard
            icon={<ArrowUpRight className="h-5 w-5 text-rose-400" />}
            label="Rent paid"
            value={formatCurrency(totalPaid)}
            tone="rose"
          />
          <SummaryCard
            icon={<ArrowDownLeft className="h-5 w-5 text-sky-400" />}
            label="Refunds received"
            value={formatCurrency(totalRefunded)}
            tone="sky"
          />
          <SummaryCard
            icon={<BadgeCheck className="h-5 w-5 text-emerald-400" />}
            label="Confirmed records"
            value={`${payments.filter((p) => p.status === 'COMPLETED').length}`}
            tone="emerald"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-white">Ledger entries</h2>
            <p className="text-sm text-blue-200/40">
              Payment references, dates, counterparties, and statuses.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-semibold text-blue-200/40">
            <Clock3 className="h-3.5 w-3.5" />
            Latest {payments.length} records
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-blue-500" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <ReceiptText className="h-10 w-10 text-blue-300/20 mb-4" />
            <p className="text-lg font-semibold text-white">
              No matching payments
            </p>
            <p className="mt-1 max-w-md text-sm text-blue-200/40">
              Adjust the search term to find a reference, property, or payment
              note.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/5 text-xs font-bold uppercase tracking-widest text-blue-300/30">
                <tr>
                  <th className="px-6 py-4">Transaction</th>
                  <th className="px-6 py-4">Counterparty</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-white/5 transition-colors align-top"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white">
                        {payment.propertyName}
                      </p>
                      <p className="mt-0.5 text-xs text-blue-200/40">
                        {payment.agreementReference} ·{' '}
                        {format(new Date(payment.paymentDate), 'MMM d, yyyy')}
                      </p>
                      {payment.notes && (
                        <p className="mt-1 text-xs text-blue-200/30">
                          {payment.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-blue-200/60">
                      {payment.counterpartyName}
                    </td>
                    <td className="px-6 py-4 text-blue-200/60">
                      {payment.paymentMethod}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-blue-200/40">
                      {payment.referenceNumber ?? 'Not available'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={
                          payment.direction === 'incoming'
                            ? 'font-bold text-emerald-400'
                            : 'font-bold text-white'
                        }
                      >
                        {payment.direction === 'incoming' ? '+' : '-'}
                        {formatCurrency(payment.amount, payment.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold border ${statusStyles[payment.status]}`}
                      >
                        {payment.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: 'rose' | 'sky' | 'emerald';
}) {
  const toneMap = {
    rose: 'bg-rose-500/10 border-rose-500/20',
    sky: 'bg-sky-500/10 border-sky-500/20',
    emerald: 'bg-emerald-500/10 border-emerald-500/20',
  };
  return (
    <div className={`rounded-2xl border ${toneMap[tone]} p-5`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10">
        {icon}
      </div>
      <p className="mt-4 text-sm font-medium text-blue-200/50">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-white">
        {value}
      </p>
    </div>
  );
}

function formatCurrency(amount: number, currency = 'USDC') {
  return `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(amount)} ${currency}`;
}
