
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") ?? "";

  const isMobile =
    /Android|iPhone|iPod|Mobile|IEMobile|Opera Mini/i.test(userAgent);

  const isTablet =
    /iPad|Tablet|PlayBook|Silk/i.test(userAgent);

  const isDesktopRequiredPage =
    request.nextUrl.pathname === "/desktop-required";

  if ((isMobile || isTablet) && !isDesktopRequiredPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/desktop-required";
    url.search = "";

    return NextResponse.redirect(url);
  }

  if (
    !(isMobile || isTablet) &&
    isDesktopRequiredPage
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
