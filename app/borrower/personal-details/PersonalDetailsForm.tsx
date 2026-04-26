'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  EMPLOYMENT_MODES,
  type EmploymentMode,
  type BreFailure,
} from '@/lib/borrower';

interface Props {
  defaultName: string;
  previousProfile: {
    fullName: string;
    pan: string;
    dob: string;
    monthlySalary: number;
    employmentMode: EmploymentMode;
    rejectionReasons: BreFailure[];
  } | null;
}

// Mirror of the server-side PAN_REGEX. Authoritative check still runs server-side.
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export default function PersonalDetailsForm({
  defaultName,
  previousProfile,
}: Props) {
  const router = useRouter();

  const [fullName, setFullName] = useState(
    previousProfile?.fullName ?? defaultName,
  );
  const [pan, setPan] = useState(previousProfile?.pan ?? '');
  const [dob, setDob] = useState(
    previousProfile?.dob ? previousProfile.dob.slice(0, 10) : '',
  );
  const [monthlySalary, setMonthlySalary] = useState(
    previousProfile?.monthlySalary?.toString() ?? '',
  );
  const [employmentMode, setEmploymentMode] = useState<EmploymentMode>(
    previousProfile?.employmentMode ?? 'Salaried',
  );

  const [failures, setFailures] = useState<BreFailure[]>(
    previousProfile?.rejectionReasons ?? [],
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function failureFor(rule: BreFailure['rule']): string | undefined {
    return failures.find((f) => f.rule === rule)?.message;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFailures([]);
    setFieldErrors({});
    setGeneralError(null);

    // Lightweight client-side preflight (the real BRE lives on the server).
    const preflight: BreFailure[] = [];
    if (!PAN_REGEX.test(pan.toUpperCase())) {
      preflight.push({
        rule: 'pan',
        message:
          'PAN must be 5 letters, 4 digits, then 1 letter (e.g. ABCDE1234F).',
      });
    }
    const salaryNum = Number(monthlySalary);
    if (!Number.isFinite(salaryNum) || salaryNum < 0) {
      preflight.push({
        rule: 'salary',
        message: 'Monthly salary must be a non-negative number.',
      });
    }
    if (preflight.length) {
      setFailures(preflight);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/borrower/personal-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          pan: pan.toUpperCase(),
          dob,
          monthlySalary: salaryNum,
          employmentMode,
        }),
      });
      const data = await res.json();

      if (res.status === 201) {
        // Eligible — proceed.
        router.push('/dashboard');
        router.refresh();
        return;
      }

      if (res.status === 422 && Array.isArray(data.failures)) {
        setFailures(data.failures as BreFailure[]);
        return;
      }

      if (res.status === 400 && data.errors) {
        setFieldErrors(data.errors);
        return;
      }

      setGeneralError(data.message ?? 'Something went wrong');
    } catch {
      setGeneralError('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <Field
        id="fullName"
        label="Full name"
        value={fullName}
        onChange={setFullName}
        required
        error={fieldErrors.fullName?.[0]}
      />

      <Field
        id="pan"
        label="PAN"
        value={pan}
        onChange={(v) => setPan(v.toUpperCase())}
        required
        placeholder="ABCDE1234F"
        maxLength={10}
        hint="5 letters, 4 digits, 1 letter."
        error={fieldErrors.pan?.[0] ?? failureFor('pan')}
        uppercase
      />

      <Field
        id="dob"
        label="Date of birth"
        type="date"
        value={dob}
        onChange={setDob}
        required
        error={fieldErrors.dob?.[0] ?? failureFor('age')}
      />

      <Field
        id="monthlySalary"
        label="Monthly salary (₹)"
        type="number"
        value={monthlySalary}
        onChange={setMonthlySalary}
        required
        min={0}
        step={1}
        error={fieldErrors.monthlySalary?.[0] ?? failureFor('salary')}
      />

      <div>
        <label
          htmlFor="employmentMode"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Employment mode
        </label>
        <select
          id="employmentMode"
          value={employmentMode}
          onChange={(e) => setEmploymentMode(e.target.value as EmploymentMode)}
          className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          {EMPLOYMENT_MODES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        {(fieldErrors.employmentMode?.[0] ?? failureFor('employment')) && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {fieldErrors.employmentMode?.[0] ?? failureFor('employment')}
          </p>
        )}
      </div>

      {failures.length > 0 && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm dark:border-red-900 dark:bg-red-950/40">
          <p className="font-medium text-red-800 dark:text-red-300">
            Application blocked by eligibility check:
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-red-700 dark:text-red-300">
            {failures.map((f) => (
              <li key={f.rule}>{f.message}</li>
            ))}
          </ul>
        </div>
      )}

      {generalError && (
        <p className="text-sm text-red-600 dark:text-red-400">{generalError}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex h-10 w-full items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? 'Checking eligibility…' : 'Continue'}
      </button>
    </form>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  min?: number;
  step?: number;
  hint?: string;
  error?: string;
  uppercase?: boolean;
}

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
  maxLength,
  min,
  step,
  hint,
  error,
  uppercase,
}: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        min={min}
        step={step}
        className={`mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 ${
          uppercase ? 'uppercase' : ''
        }`}
      />
      {hint && !error && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
