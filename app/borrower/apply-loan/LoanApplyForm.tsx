'use client';

import { useMemo, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  INTEREST_RATE_PCT,
  MAX_PRINCIPAL,
  MAX_TENURE_DAYS,
  MIN_PRINCIPAL,
  MIN_TENURE_DAYS,
  PRINCIPAL_STEP,
  TENURE_STEP,
  formatINR,
  formatINR2,
  simpleInterest,
  totalRepayment,
} from '@/lib/loan';

const DEFAULT_PRINCIPAL = 100_000;
const DEFAULT_TENURE = 90;

export default function LoanApplyForm() {
  const router = useRouter();
  const [principal, setPrincipal] = useState<number>(DEFAULT_PRINCIPAL);
  const [tenureDays, setTenureDays] = useState<number>(DEFAULT_TENURE);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Live calc — recompute as sliders move.
  const interest = useMemo(
    () => simpleInterest(principal, tenureDays),
    [principal, tenureDays],
  );
  const total = useMemo(
    () => totalRepayment(principal, tenureDays),
    [principal, tenureDays],
  );
  const months = (tenureDays / 30).toFixed(1);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/loans/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ principal, tenureDays }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 201) {
        router.push('/dashboard');
        router.refresh();
        return;
      }
      setError(data.message ?? `Application failed (${res.status})`);
    } catch (err) {
      console.error(err);
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      <Slider
        label="Loan amount"
        value={principal}
        min={MIN_PRINCIPAL}
        max={MAX_PRINCIPAL}
        step={PRINCIPAL_STEP}
        formatValue={formatINR}
        leftLabel={formatINR(MIN_PRINCIPAL)}
        rightLabel={formatINR(MAX_PRINCIPAL)}
        onChange={setPrincipal}
      />

      <Slider
        label="Tenure"
        value={tenureDays}
        min={MIN_TENURE_DAYS}
        max={MAX_TENURE_DAYS}
        step={TENURE_STEP}
        formatValue={(v) => `${v} days`}
        leftLabel={`${MIN_TENURE_DAYS} days`}
        rightLabel={`${MAX_TENURE_DAYS} days`}
        onChange={setTenureDays}
        sublabel={`≈ ${months} months`}
      />

      <CalcPanel
        principal={principal}
        tenureDays={tenureDays}
        interest={interest}
        total={total}
      />

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex h-11 w-full items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? 'Submitting…' : 'Apply'}
      </button>
    </form>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatValue: (v: number) => string;
  leftLabel: string;
  rightLabel: string;
  onChange: (v: number) => void;
  sublabel?: string;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  formatValue,
  leftLabel,
  rightLabel,
  onChange,
  sublabel,
}: SliderProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
        <div className="text-right">
          <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {formatValue(value)}
          </span>
          {sublabel && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {sublabel}
            </p>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900 dark:bg-zinc-800 dark:accent-zinc-50"
      />
      <div className="mt-1 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

interface CalcPanelProps {
  principal: number;
  tenureDays: number;
  interest: number;
  total: number;
}

function CalcPanel({
  principal,
  tenureDays,
  interest,
  total,
}: CalcPanelProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Live calculation
        </h3>
        <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
          {INTEREST_RATE_PCT}% p.a. · Simple Interest
        </span>
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <Row label="Principal" value={formatINR(principal)} />
        <Row label="Tenure" value={`${tenureDays} days`} />
        <Row
          label={`Interest @ ${INTEREST_RATE_PCT}% p.a.`}
          value={formatINR2(interest)}
        />
      </dl>

      <div className="my-4 border-t border-zinc-200 dark:border-zinc-800" />

      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Total repayment
        </span>
        <span className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {formatINR2(total)}
        </span>
      </div>

      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        SI = (P × R × T) / (365 × 100) ={' '}
        ({formatINR(principal)} × {INTEREST_RATE_PCT} × {tenureDays}) / 36,500
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-zinc-600 dark:text-zinc-400">{label}</dt>
      <dd className="font-medium text-zinc-900 dark:text-zinc-50">{value}</dd>
    </div>
  );
}
