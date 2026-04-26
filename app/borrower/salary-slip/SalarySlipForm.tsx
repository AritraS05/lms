'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  ALLOWED_SLIP_EXTENSIONS,
  ALLOWED_SLIP_MIMETYPES,
  MAX_SALARY_SLIP_BYTES,
} from '@/lib/borrower';

const MAX_MB = (MAX_SALARY_SLIP_BYTES / (1024 * 1024)).toFixed(0);

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function SalarySlipForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    setError(null);
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setFile(null);
      return;
    }
    if (
      !(ALLOWED_SLIP_MIMETYPES as readonly string[]).includes(f.type)
    ) {
      setError('Only PDF, JPG, or PNG files are allowed.');
      setFile(null);
      e.target.value = '';
      return;
    }
    if (f.size > MAX_SALARY_SLIP_BYTES) {
      setError(`File is too large. Max ${MAX_MB} MB.`);
      setFile(null);
      e.target.value = '';
      return;
    }
    setFile(f);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError('Pick a file first.');
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file, file.name);

      const res = await fetch('/api/borrower/salary-slip', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 201) {
        router.push('/dashboard');
        router.refresh();
        return;
      }
      setError(data.message ?? `Upload failed (${res.status})`);
    } catch (err) {
      console.error(err);
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <label
        htmlFor="file"
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center transition-colors hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
      >
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {file ? file.name : 'Click to choose a file'}
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {file
            ? `${file.type || 'unknown type'} · ${formatBytes(file.size)}`
            : `PDF, JPG, or PNG — up to ${MAX_MB} MB`}
        </span>
        <input
          id="file"
          type="file"
          className="sr-only"
          accept={ALLOWED_SLIP_EXTENSIONS}
          onChange={onPick}
        />
      </label>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !file}
        className="flex h-10 w-full items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? 'Uploading…' : 'Upload salary slip'}
      </button>
    </form>
  );
}
