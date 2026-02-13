import { Home, Search, Camera, BarChart3, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const tabs = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/scan", icon: Camera, label: "Scan", center: true },
  { to: "/progress", icon: BarChart3, label: "Progress" },
  { to: "/settings", icon: User, label: "Profile" },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-3 mb-2 rounded-2xl bg-card/70 dark:bg-card/60 backdrop-blur-xl border border-border/50 shadow-lg">
        <div className="flex items-end justify-around px-2 py-2">
          {tabs.map(({ to, icon: Icon, label, center }) => {
            const active = pathname === to;

            if (center) {
              return (
                <NavLink
                  key={to}
                  to={to}
                  className="flex flex-col items-center -mt-5"
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 transition-transform active:scale-90 ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] mt-1 font-medium text-primary">
                    {label}
                  </span>
                </NavLink>
              );
            }

            return (
              <NavLink
                key={to}
                to={to}
                className="flex flex-col items-center gap-0.5 py-1 px-3 min-w-[48px] min-h-[44px] justify-center"
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
