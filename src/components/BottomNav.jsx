import { NavLink } from 'react-router-dom';
import { Home, FileText, CalendarPlus, Search, MessageCircle } from 'lucide-react';
import { ADMIN_WA_NUMBER } from '../utils/constants';

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
                <div className={`flex flex-col items-center py-3 gap-1 relative transition-colors duration-200 ${
                  isActive ? 'text-orange-500' : 'text-gray-400'
                }`}>
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-orange-500 rounded-b-full" />
                  )}
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.25 : 2} />
                  <span className="text-xs font-semibold">{label}</span>
                </div>
              )}
            </NavLink>
          ))}

          {/* Chat WA */}
          <button
            onClick={() => window.open(`https://wa.me/${ADMIN_WA_NUMBER}`, '_blank', 'noopener,noreferrer')}
            className="flex-1 flex flex-col items-center py-3 gap-1 text-emerald-500 transition-opacity duration-200 active:opacity-70"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs font-semibold">Chat</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
