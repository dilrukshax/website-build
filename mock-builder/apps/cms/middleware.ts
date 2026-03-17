import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];
const PUBLIC_PATHS = ['/preview'];
const ONBOARDING_PATHS = ['/onboarding'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const accessToken = request.cookies.get('accessToken')?.value;

    const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path));
    const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
    const isOnboardingPath = ONBOARDING_PATHS.some((path) => pathname.startsWith(path));

    // Redirect authenticated users away from auth pages
    if (isAuthPath && accessToken) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Redirect unauthenticated users to login (except public or auth paths)
    if (!isAuthPath && !isPublicPath && !isOnboardingPath && !accessToken) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Onboarding pages require authentication
    if (isOnboardingPath && !accessToken) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    ],
};
