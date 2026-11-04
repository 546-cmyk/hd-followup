import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, FileText, ClipboardList, Bell, User } from 'lucide-react';
import { useAuth } from '@client/src/hooks/useAuth';

const navItems = [
  { to: '/parent/home', label: '首页', icon: Home },
  { to: '/parent/diary', label: '记录', icon: FileText },
  { to: '/parent/rintala', label: '随访', icon: ClipboardList },
  { to: '/parent/reminder', label: '提醒', icon: Bell },
  { to: '/parent/profile', label: '我的', icon: User },
];

const ParentLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="parent-app">
      <div className="pb-16">
        <Outlet />
      </div>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-border z-50 safe-area-bottom">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`
              }
            >
              <item.icon size={22} strokeWidth={1.5} />
              <span className="text-xs mt-1">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default ParentLayout;
