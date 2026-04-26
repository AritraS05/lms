import { proxyJSON } from '@/lib/proxyToBackend';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  return proxyJSON(`/api/loans/${id}`, { method: 'GET' });
}
