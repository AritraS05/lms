import { proxyJSON } from '@/lib/proxyToBackend';

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  return proxyJSON(`/api/disbursement/loans/${id}/disburse`, {
    method: 'POST',
  });
}
