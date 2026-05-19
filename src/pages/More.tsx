import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { logOut } from '../lib/firebase';
import { 
  Briefcase, 
  BellRing, 
  BookOpen, 
  LogOut, 
  ChevronRight,
  User
} from 'lucide-react';
import { cn } from '../lib/utils';

export function More() {
  const store = useStore();
  const navigate = useNavigate();
  const user = store.user;

  const menuItems = [
    { name: 'Business Finance', icon: Briefcase, path: '/finance/business', color: 'text-blue-500', bg: 'bg-blue-50' },
    { name: 'Payments', icon: BellRing, path: '/payments', color: 'text-purple-500', bg: 'bg-purple-50' },
    { name: 'Remember Book', icon: BookOpen, path: '/notes', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-0 h-full flex flex-col max-w-2xl mx-auto">
      <div className="flex flex-col justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Menu</h1>
          <p className="text-sm text-gray-500">More settings and features</p>
        </div>
      </div>

      <div className="bg-[#272625]/[0.03] p-[17px] rounded-[19px]">
        <div className="design-card p-4 flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl overflow-hidden">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">{user?.name}</p>
              <p className="text-sm tracking-tight text-gray-500">{user?.email}</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">PRO</span>
        </div>

        <div className="flex justify-between items-center mb-2 px-1 mt-6">
          <h2 className="text-[#8C8684] text-xs font-medium tracking-tight uppercase">Features</h2>
        </div>
        
        <div className="design-card divide-y divide-gray-100 overflow-hidden">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", item.bg, item.color)}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-900">{item.name}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center mb-2 px-1 mt-6">
          <h2 className="text-[#8C8684] text-xs font-medium tracking-tight uppercase">Settings</h2>
        </div>
        <div className="design-card overflow-hidden">
           <button
             onClick={() => store.toggleDarkMode()}
             className="w-full flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
           >
             <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900">Dark Mode</span>
             </div>
             <div className="text-gray-500">
               {store.isDarkMode ? "On" : "Off"}
             </div>
           </button>
           <button
             onClick={() => logOut()}
             className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-red-600"
           >
             <LogOut className="w-5 h-5" />
             <span className="text-sm font-medium">Log Out</span>
           </button>
        </div>
      </div>
    </div>
  );
}
