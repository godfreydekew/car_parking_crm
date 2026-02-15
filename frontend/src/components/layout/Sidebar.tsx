import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarCheck,
  Car,
  Clock,
  Users,
  BarChart3,
  Settings,
  PlaneTakeoff,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: "Check-in/out", href: "/check-in-out", icon: Car },
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Bookings", href: "/bookings", icon: CalendarCheck },
  { name: "Cars On Site", href: "/operations", icon: Clock },
  { name: "Overstays", href: "/overstays", icon: Clock },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-14 border-b border-sidebar-border px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <PlaneTakeoff className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">OR Tambo Parking</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => onClose()}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-medium text-sidebar-foreground">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">Admin User</p>
              <p className="text-xs text-muted-foreground truncate">admin@parkfly.co.za</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
