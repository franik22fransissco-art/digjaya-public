import { NavLink, useNavigate } from 'react-router-dom';
import { Home, FileText, CalendarPlus, Search, MessageCircle } from 'lucide-react';

const menus = [
  { to: '/',           icon: Home,          label: 'Beranda', end: true },
  { to: '/sk',         icon: FileText,       label: 'S&K'              },
  { to: '/booking',    icon: CalendarPlus,   label: 'Pesan'            },
  { to: '/cek-status', icon: Search,         label: 'Status'           },
];

export default function BottomNav() {
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex">
        {menus.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-2 gap-0.5 transition-colors ${
                isActive ? 'text-orange-500' : 'text-gray-400'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}

        {/* Chat WA */}
        <button
          onClick={() => window.open('https://wa.me/6285862177805', '_blank')}
          className="flex flex-col items-center justify-center flex-1 py-2 gap-0.5 text-green-500"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-[10px] font-medium">Chat</span>
        </button>
      </div>
    </nav>
  );
}
