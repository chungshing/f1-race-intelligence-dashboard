import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
        return new NextResponse('Admin not configured.', { status: 503 });
    }

    const header = request.headers.get('authorization');
    if (header?.startsWith('Basic ')) {
        try {
            const decoded = atob(header.slice(6));
            const password = decoded.slice(decoded.indexOf(':') + 1);
            if (password === expected) return NextResponse.next();
        } catch {}
    }

    return new NextResponse('Authentication required.', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
    });
}

export const config = {
    matcher: ['/admin/:path*', '/api/sync', '/api/backfill'],
};
