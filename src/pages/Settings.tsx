import React from 'react';
import { useStore } from '../store/useStore';
import { logOut } from '../lib/firebase';
import { 
  LogOut, 
  Moon,
  Sun,
  Shield,
  User,
  Bell,
  Globe
} from 'lucide-react';
import { cn, CURRENCIES } from '../lib/utils';

export function Settings() {
  const store = useStore();
  const user = store.user;

  return (
    <div className="space-y-6 pb-20 lg:pb-0 h-full flex flex-col max-w-2xl mx-auto">
      <div className="flex flex-col justify-between items-start gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Manage your account and preferences</p>
        </div>
      </div>

      <div className="bg-[#272625]/[0.03] p-[17px] rounded-[19px]">
        {/* Profile Section */}
        <div className="design-card p-4 flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-2xl overflow-hidden">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">{user?.name}</p>
              <p className="text-sm tracking-tight text-gray-500">{user?.email}</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">PRO</span>
        </div>

        {/* Preferences */}
        <div className="flex justify-between items-center mb-2 px-1">
          <h2 className="text-[#8C8684] text-xs font-medium tracking-tight uppercase">Preferences</h2>
        </div>
        <div className="design-card divide-y divide-gray-100 overflow-hidden mb-6">
           <div className="w-full flex items-center justify-between p-4 transition-colors">
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-gray-100 text-gray-700">
                 <Globe className="w-5 h-5" />
               </div>
               <span className="text-sm font-medium text-gray-900">Currency</span>
             </div>
             <select
               value={store.currency}
               onChange={(e) => store.setCurrency(e.target.value)}
               className="text-sm font-medium text-gray-700 bg-transparent border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
             >
               {CURRENCIES.map(c => (
                 <option key={c.code} value={c.code}>
                   {c.flag} {c.code} - {c.name}
                 </option>
               ))}
             </select>
           </div>
           <button
             onClick={() => store.toggleDarkMode()}
             className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
           >
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-gray-100 text-gray-700">
                 {store.isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
               </div>
               <span className="text-sm font-medium text-gray-900">Dark Mode</span>
             </div>
             <div className="text-gray-500 font-medium text-sm">
               {store.isDarkMode ? "On" : "Off"}
             </div>
           </button>
           <button
             onClick={() => store.togglePrivacyMode()}
             className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
           >
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-gray-100 text-gray-700">
                 <Shield className="w-5 h-5" />
               </div>
               <span className="text-sm font-medium text-gray-900">Privacy Mode</span>
             </div>
             <div className="text-gray-500 font-medium text-sm">
               {store.isPrivacyMode ? "On" : "Off"}
             </div>
           </button>
        </div>

        {/* Account Actions */}
        <div className="flex justify-between items-center mb-2 px-1">
          <h2 className="text-[#8C8684] text-xs font-medium tracking-tight uppercase">Account actions</h2>
        </div>
        <div className="design-card overflow-hidden">
           <button
             onClick={() => logOut()}
             className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-red-600"
           >
             <LogOut className="w-5 h-5" />
             <span className="text-sm font-medium">Sign Out</span>
           </button>
        </div>
      </div>
    </div>
  );
}
