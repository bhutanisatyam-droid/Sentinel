import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Proxy securely to the Python backend
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
    const res = await fetch(`${apiBaseUrl}/api/kyc/compute-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to compute risk' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
