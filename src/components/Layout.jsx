import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Swords,
  Gem,
  Package,
  ShoppingBag,
  Sparkles,
  Clock,
  Shield,
  Settings as SettingsIcon,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, end: true }]
  },
  {
    label: "Roster",
    items: [
      { to: "/characters", label: "Characters", icon: Users },
      { to: "/raids", label: "Raids", icon: Swords },
      { to: "/loot", label: "Loot Wishlist", icon: Gem }
    ]
  },
  {
    label: "Gear",
    items: [
      { to: "/inventory", label: "Inventory", icon: Package },
      { to: "/shopping", label: "Shopping List", icon: ShoppingBag },
      { to: "/buff-profiles", label: "Buff Profiles", icon: Sparkles },
      { to: "/rested", label: "Rested XP", icon: Clock }
    ]
  },
  {
    label: "Simulate",
    items: [
      { to: "/sim/warrior", label: "Warrior Sim", icon: Swords },
      { to: "/sim/rogue", label: "Rogue Sim", icon: Swords },
      { to: "/sim/mage", label: "Mage Sim", icon: Swords }
    ]
  }
];

function NavItem({ to, label, icon: Icon, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? "bg-brand-50 text-brand-700"
            : "text-ink-soft hover:bg-surface-muted hover:text-ink"
        }`
      }
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

function SidebarContent({ onNavigate }) {
  const { user, isAdmin, signOutUser } = useAuth();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white shadow-sm shadow-brand-500/30">
          <Swords className="h-4 w-4" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-semibold tracking-tight text-ink">Raid Tracker</span>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem key={item.to} {...item} onClick={onNavigate} />
              ))}
            </div>
          </div>
        ))}

        {isAdmin ? (
          <div>
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
              Admin
            </p>
            <div className="space-y-0.5">
              <NavItem to="/admin" label="Admin" icon={Shield} onClick={onNavigate} />
            </div>
          </div>
        ) : null}
      </nav>

      <div className="border-t border-border p-3">
        <div className="space-y-0.5">
          <NavItem to="/settings" label="Settings" icon={SettingsIcon} onClick={onNavigate} />
        </div>
        {user ? (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface-muted p-2">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="h-7 w-7 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                {user.email?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-ink">{user.displayName || user.email}</p>
            </div>
            <button
              type="button"
              onClick={signOutUser}
              className="rounded-md p-1.5 text-ink-faint hover:bg-surface-muted hover:text-ink"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-svh bg-canvas">
      <div className="hidden w-64 shrink-0 border-r border-border bg-surface lg:fixed lg:inset-y-0 lg:flex">
        <SidebarContent />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} />
          <div className="relative flex h-full w-72 flex-col bg-surface shadow-pop">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-md p-1.5 text-ink-faint hover:bg-surface-muted"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-h-svh flex-col lg:pl-64">
        <header className="flex h-14 items-center gap-3 border-b border-border bg-surface px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-ink-soft hover:bg-surface-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-ink">Raid Tracker</span>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
