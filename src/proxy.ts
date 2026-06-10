import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const url = new URL(request.url);
  const response = NextResponse.next();
  
  if (url.searchParams.get('test') === 'true') {
    response.cookies.set('testMode', 'true', { path: '/' });
  } else if (url.pathname === '/' && request.headers.get('x-e2e-test') !== 'true') {
    response.cookies.delete('testMode');
  }
  
  return response;
}
