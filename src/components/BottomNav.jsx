import { NavLink } from 'react-router-dom';
import { Home, FileText, CalendarPlus, Search, MessageCircle } from 'lucide-react';

const menus = [
  { to: '/',           icon: Home,          label: 'Beranda', end: true },
  { to: '/sk',         icon: FileText,       label: 'S&K'              },
  { to: '/booking',    icon: CalendarPlus,   label: 'Pesan'            },
  { to: '/cek-status', icon: Search,         label: 'Status'           },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      <div className="bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-lg shadow-black/5">
        <div className="flex">
          {menus.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="flex-1"
            >
              {({ isActive }) => (
                <div className={`flex flex-col items-center py-2.5 gap-0.5 relative transition-colors ${
                  isActive ? 'text-orange-500' : 'text-gray-400'
                }`}>
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 rounded-b-full" />
                  )}
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-bold">{label}</span>
                </div>
              )}
            </NavLink>
          ))}

          {/* Chat WA */}
          <button
            onClick={() => window.open('https://wa.me/6285862177805', '_blank')}
            className="flex-1 flex flex-col items-center py-2.5 gap-0.5 text-emerald-500 transition-opacity active:opacity-70"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-[10px] font-bold">Chat</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
