
import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { LayoutDashboard, Users, Settings, LogOut, Search, Bell, X, Camera, Phone, User as UserIcon, Check, ChevronLeft, ChevronRight, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useStudentData } from '../context/StudentDataContext';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  role: UserRole;
  currentView: 'DASHBOARD' | 'SETTINGS' | 'STUDENTS';
  onNavigate: (view: 'DASHBOARD' | 'SETTINGS' | 'STUDENTS', studentId?: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, role, currentView, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { students, notifications, markNotificationRead, connectionStatus, pendingChanges } = useStudentData();
  const { user, logout } = useAuth();
  
  // Filter notifications for current user
  const myNotifications = notifications
    .filter(n => n.userId === 'all' || n.userId === user?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const unreadCount = myNotifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    myNotifications.forEach(n => {
      if (!n.read) markNotificationRead(n.id);
    });
  };
  
  // Global search filtering
  const filteredResults = searchQuery.length > 2 
    ? students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const handleSearchResultClick = (studentId: string) => {
    onNavigate('STUDENTS', studentId);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-brand-grey flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside 
        className={`
          w-full bg-brand-blue text-white flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}
        `}
      >
        {/* Branding & Toggle */}
        <div className={`p-4 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isSidebarCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="text-2xl font-bold font-display tracking-tight text-white flex items-center gap-2">
                <span className="text-3xl">☀</span> Mwangaza
              </h1>
              <p className="text-brand-sky text-xs mt-1 uppercase tracking-widest font-semibold opacity-80">Education System</p>
            </div>
          )}
          {/* Desktop Toggle Button */}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-sky/50"
            aria-label={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}
          </button>
        </div>

        {/* Global User Profile Widget (Fixed at Top) */}
        <div className="px-4 mb-2">
           <button 
             onClick={() => onNavigate('SETTINGS')}
             className={`
               w-full bg-brand-blue/50 hover:bg-white/10 rounded-xl flex items-center cursor-pointer transition-colors border border-white/10 text-left group focus:outline-none focus:ring-2 focus:ring-brand-sky/50
               ${isSidebarCollapsed ? 'justify-center p-2' : 'p-3 gap-3'}
             `}
             title={isSidebarCollapsed ? "Profile Settings" : undefined}
           >
             <div className="relative flex-shrink-0">
                <img src={user?.avatarUrl} alt="" className="w-10 h-10 rounded-full border-2 border-brand-sky group-hover:border-white transition-colors object-cover" />
                <div className="absolute -bottom-1 -right-1 bg-brand-sky text-brand-blue rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Settings size={10} />
                </div>
             </div>
             {!isSidebarCollapsed && (
               <div className="overflow-hidden">
                 <p className="text-sm font-bold text-white group-hover:text-brand-sky transition-colors truncate">{user?.name}</p>
                 <p className="text-xs text-brand-sky font-display truncate opacity-80">{user?.role}</p>
               </div>
             )}
           </button>
        </div>

        {/* Navigation */}
        <nav className="mt-2 px-2 space-y-2 flex-1">
          <NavItem 
            active={currentView === 'DASHBOARD'} 
            onClick={() => onNavigate('DASHBOARD')}
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            collapsed={isSidebarCollapsed}
          />
          
          <NavItem 
            active={currentView === 'STUDENTS'} 
            onClick={() => onNavigate('STUDENTS')} 
            icon={<Users size={20} />} 
            label={role === UserRole.PARENT ? "My Children" : "Students"} 
            collapsed={isSidebarCollapsed}
          />
          
          <NavItem 
            active={currentView === 'SETTINGS'} 
            onClick={() => onNavigate('SETTINGS')}
            icon={<Settings size={20} />} 
            label="Settings" 
            collapsed={isSidebarCollapsed}
          />
        </nav>

        {/* Logout (Footer) */}
        <div className="p-4 mt-auto">
          <button 
            onClick={logout}
            className={`
              flex items-center justify-center gap-2 bg-brand-blue/30 hover:bg-brand-red/90 text-white rounded-lg transition-colors text-xs font-bold uppercase tracking-wider border border-white/5 focus:outline-none focus:ring-2 focus:ring-brand-red/50
              ${isSidebarCollapsed ? 'w-10 h-10 p-0 mx-auto rounded-full' : 'w-full px-4 py-3'}
            `}
            title={isSidebarCollapsed ? "Sign Out" : undefined}
          >
            <LogOut size={16} /> 
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative transition-all duration-300 ease-in-out">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Global Search (Student, ID...)" 
                className="w-full h-10 pl-10 pr-4 bg-brand-grey/50 rounded-lg border-none focus:ring-2 focus:ring-brand-sky/50 text-sm font-medium transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {/* Search Dropdown */}
              {searchQuery.length > 2 && (
                <div className="absolute top-12 left-0 w-full bg-white shadow-lg rounded-lg p-2 z-50 border border-gray-100 animate-slide-up">
                  {filteredResults.length > 0 ? (
                    filteredResults.map(s => (
                      <div key={s.id} onClick={() => handleSearchResultClick(s.id)} className="p-2 hover:bg-brand-grey rounded cursor-pointer flex items-center gap-3">
                        <img src={s.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                        <div>
                          <p className="text-sm font-bold text-gray-800">{s.name}</p>
                          <p className="text-xs text-gray-500">{s.grade} • {s.admissionNumber}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500">No results found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Connectivity Status Indicator */}
            <div 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                connectionStatus === 'ONLINE' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' :
                connectionStatus === 'SYNCING' ? 'bg-brand-yellow/10 text-brand-yellow-600 border-brand-yellow/30' :
                'bg-brand-red/10 text-brand-red border-brand-red/20'
              }`}
              title={connectionStatus === 'OFFLINE' ? `${pendingChanges} changes pending sync` : 'System Online'}
            >
                {connectionStatus === 'ONLINE' && <Wifi size={14}/>}
                {connectionStatus === 'OFFLINE' && <WifiOff size={14}/>}
                {connectionStatus === 'SYNCING' && <RefreshCw size={14} className="animate-spin"/>}
                
                <span className="hidden sm:inline">
                    {connectionStatus === 'ONLINE' ? 'Online' : 
                     connectionStatus === 'SYNCING' ? 'Syncing...' : 
                     `Offline (${pendingChanges})`}
                </span>
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="p-2 text-gray-500 hover:text-brand-blue relative focus:outline-none focus:ring-2 focus:ring-brand-sky/50 rounded-full"
              >
                <Bell size={20} />
                {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-brand-red rounded-full"></span>}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-white shadow-xl rounded-xl p-4 z-50 border border-gray-100 animate-slide-up">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                    <h3 className="font-bold text-sm text-gray-800">Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-xs text-brand-sky font-bold hover:underline">Mark all read</button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                    {myNotifications.length > 0 ? myNotifications.map(n => (
                      <div key={n.id} onClick={() => markNotificationRead(n.id)} className={`text-sm p-3 rounded-lg border transition-all cursor-pointer ${n.read ? 'bg-white border-transparent hover:bg-gray-50' : 'bg-brand-blue/5 border-brand-blue/10'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className={`font-bold text-xs ${n.type === 'WARNING' ? 'text-brand-yellow' : n.type === 'INFO' ? 'text-brand-blue' : 'text-gray-700'}`}>{n.title}</span>
                          <span className="text-[10px] text-gray-400">{n.date}</span>
                        </div>
                        <p className={`text-xs ${n.read ? 'text-gray-500' : 'text-gray-800'}`}>{n.message}</p>
                      </div>
                    )) : (
                      <div className="text-center py-4 text-xs text-gray-400 italic">No notifications</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active = false, onClick, collapsed = false }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, collapsed?: boolean }) => (
  <div className="relative group">
    <button 
      onClick={onClick}
      className={`
        flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-brand-sky/50
        ${collapsed 
          ? 'justify-center w-10 h-10 rounded-xl mx-auto' 
          : 'w-full gap-3 px-4 py-3 rounded-lg'
        }
        ${active 
          ? 'bg-brand-sky/10 text-brand-sky' 
          : 'text-gray-300 hover:bg-brand-blue/50 hover:text-white'
        }
      `}
    >
      {icon}
      {!collapsed && <span className="font-medium text-sm whitespace-nowrap">{label}</span>}
    </button>

    {/* Tooltip for Collapsed State */}
    {collapsed && (
      <div className="absolute left-14 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs font-bold rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
        {label}
        {/* Tooltip Arrow */}
        <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
      </div>
    )}
  </div>
);

export default Layout;
