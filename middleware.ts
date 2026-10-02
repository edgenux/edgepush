import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/moe")) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.replace(/^\/moe/, "/admin") || "/admin"
    return NextResponse.redirect(url)
  }

  const session = await auth()

  if (pathname.startsWith("/api/")) {
    const protectedApis = [
      "/api/channels",
      "/api/endpoint-groups",
      "/api/endpoints",
      "/api/weixin",
    ]

    const isProtectedApi = protectedApis.some((api) => pathname.startsWith(api))

    if (isProtectedApi && !session) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 })
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  if (
    session &&
    (pathname === "/login" || pathname === "/register")
  ) {
    return NextResponse.redirect(new URL("/admin/endpoints", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/moe/:path*",
    "/api/channels/:path*",
    "/api/endpoint-groups/:path*",
    "/api/endpoints/:path*",
    "/api/weixin/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
}
