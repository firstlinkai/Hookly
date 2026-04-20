import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Settings, 
  CreditCard, 
  LogOut,
  Bell
} from 'lucide-react';

export default function DashboardLayout() {
  const { signOut, profile } = useAuthStore();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
    { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-64 bg-black border-r border-[#F5C518]/20 text-white flex flex-col">
        <div className="h-16 flex items-center px-6 font-bold text-2xl tracking-widest text-white">
          HOOK<span className="text-[#F5C518]">LY</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? 'bg-white/10 text-white' 
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center mb-4">
            <div className="h-8 w-8 rounded-full bg-[#F5C518] text-black flex items-center justify-center font-bold">
              {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
            </div>
            <div className="ml-3 truncate">
              <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-background border-b border-border flex items-center justify-end px-8">
          <button className="p-2 text-muted-foreground hover:text-foreground relative">
            <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-[#F5C518] ring-2 ring-background" />
            <Bell className="h-6 w-6" />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
