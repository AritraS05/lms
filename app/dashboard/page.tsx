import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/getCurrentUser';
import LogoutButton from './LogoutButton';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            LMS Dashboard
          </h1>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Welcome, {user.name}
          </h2>
          <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Email</dt>
              <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">
                {user.email}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Role</dt>
              <dd className="mt-1">
                <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
                  {user.role}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Member since</dt>
              <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">
                {new Date(user.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>

        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          Loan management modules will appear here next.
        </p>
      </main>
    </div>
  );
}
