import { proxyJSON } from '@/lib/proxyToBackend';

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  return proxyJSON(`/api/sanction/loans/${id}/approve`, { method: 'POST' });
}
