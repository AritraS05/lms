import { proxyJSON } from '@/lib/proxyToBackend';

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  return proxyJSON(`/api/sanction/loans/${id}/reject`, {
    method: 'POST',
    body,
  });
}
