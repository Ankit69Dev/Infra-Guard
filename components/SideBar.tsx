"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  BarChart3,
  Bell,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Map,
  MessageSquareWarning,
  Settings,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  Wrench,
  FileWarning,
  type LucideIcon,
} from "lucide-react";

/* Put your logo at /public/logo.png (square, ~64x64 or larger) */
const LOGO_SRC = "/logo.jpeg";

type NavItem = { name: string; href: string; icon: LucideIcon };

const mainItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Reports", href: "/dashboard/reports", icon: FileWarning },
  { name: "Infrastructure Map", href: "/dashboard/map", icon: Map },
  { name: "Assets", href: "/dashboard/assets", icon: Building2 },
  { name: "Risk Intelligence", href: "/dashboard/risk", icon: TriangleAlert },
  { name: "AI Insights", href: "/dashboard/ai-insights", icon: Sparkles },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
];

const secondaryItems: NavItem[] = [
  { name: "Alerts", href: "/dashboard/alerts", icon: Bell },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar({
  onCollapsedChange,
}: {
  /** Optional: shift your page content (ml-64 / ml-[76px]) when the sidebar collapses */
  onCollapsedChange?: (collapsed: boolean) => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const user = session?.user;
  const name = user?.name ?? "Infrastructure Admin";
  const email = user?.email ?? "Administrator";

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    onCollapsedChange?.(next);
  }

  function renderItem(item: NavItem) {
    const Icon = item.icon;
    const active =
      item.href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname.startsWith(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`group relative flex h-12 items-center rounded-xl text-[15px] transition-colors duration-150 ${
          collapsed ? "justify-center" : "gap-3 px-2"
        } ${
          active
            ? "bg-gradient-to-r from-white/[0.09] to-white/[0.03] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 ${
            active
              ? "bg-emerald-400/15 text-emerald-300 ring-1 ring-inset ring-emerald-300/20"
              : "text-zinc-500 group-hover:bg-white/[0.06] group-hover:text-zinc-200"
          }`}
        >
          <Icon size={19} strokeWidth={1.8} />
        </span>

        {!collapsed && (
          <>
            <span className="truncate">{item.name}</span>
            {active && (
              <span className="ml-auto mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
            )}
          </>
        )}

        {collapsed && (
          <span className="pointer-events-none absolute left-[calc(100%+12px)] z-[100] whitespace-nowrap rounded-lg border border-white/10 bg-[#141a29] px-3 py-2 text-sm font-medium text-zinc-100 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
            {item.name}
          </span>
        )}
      </Link>
    );
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-white/[0.07] bg-gradient-to-b from-[#0f1523] to-[#090d17] text-white transition-[width] duration-200 ${
        collapsed ? "w-[76px]" : "w-64"
      }`}
    >
      {/* Collapse toggle */}
      <button
        onClick={toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-[34px] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#0f1523] text-zinc-500 shadow-md transition-colors hover:text-zinc-100"
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      {/* Brand */}
      <Link
        href="/dashboard"
        className={`flex h-[68px] shrink-0 items-center border-b border-white/[0.07] ${
          collapsed ? "justify-center" : "gap-3 px-5"
        }`}
      >
        {logoFailed ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm font-bold ring-1 ring-inset ring-white/10">
            I
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={LOGO_SRC}
            alt="Infra Guard Logo"
            width={36}
            height={36}
            onError={() => setLogoFailed(true)}
            className="h-9 w-9 shrink-0 rounded-xl object-contain"
          />
        )}

        {!collapsed && (
          <div className="leading-none">
            <div className="text-[19px] font-semibold tracking-tight">
              Infra Guard
            </div>
            <div className="mt-1.5 text-[11px] font-medium text-zinc-500">
              Infrastructure Intelligence
            </div>
          </div>
        )}
      </Link>

      {/* Main navigation */}
      <nav
        className={`flex-1 px-3 py-4 ${
          collapsed
            ? "overflow-visible"
            : "overflow-y-auto [scrollbar-color:#27272a_transparent] [scrollbar-width:thin]"
        }`}
      >
        <div className="space-y-1">{mainItems.map(renderItem)}</div>
      </nav>

      {/* Alerts + Settings */}
      <div className="shrink-0 space-y-1 border-t border-white/[0.07] px-3 py-3">
        {secondaryItems.map(renderItem)}
      </div>

      {/* User */}
      <div className="shrink-0 border-t border-white/[0.07] p-3">
        <div
          className={`flex items-center rounded-xl border border-white/[0.07] bg-white/[0.03] ${
            collapsed ? "flex-col gap-2 p-2" : "gap-3 p-2.5"
          }`}
        >
          <div className="relative shrink-0">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={name}
                referrerPolicy="no-referrer"
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0b101b]" />
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[14.5px] font-medium text-zinc-100">
                {name}
              </p>
              <p className="mt-0.5 truncate text-[12.5px] text-zinc-500">
                {email}
              </p>
            </div>
          )}

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            title="Sign out"
            aria-label="Sign out"
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-100"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}