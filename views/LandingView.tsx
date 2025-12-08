
import React, { useState } from 'react';
import { TuningFork, Gavel, BookOpen, Home, ChevronLeft, LogIn, UserPlus, Settings, Sparkles } from 'lucide-react';
import { UserRole } from '../types';
import AdmissionsWizard from '../components/AdmissionsWizard';

interface LandingViewProps {
  onLoginSelect: (role: UserRole) => void;
  onSignupSelect: () => void;
}

const LandingView: React.FC<LandingViewProps> = ({ onLoginSelect, onSignupSelect }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  // Configuration for each role card strictly following DLS
  const roles = [
    {
      id: UserRole.ADMIN,
      title: 'System Admin',
      icon: Settings, // Using Settings as TuningFork might vary in icon sets, represents config well
      color: 'text-brand-blue',
      borderColor: 'border-brand-blue',
      bgHover: 'group-hover:bg-brand-blue/5',
      desc: 'Full access to finance, users, and system configuration.'
    },
    {
      id: UserRole.PRINCIPAL,
      title: 'School Principal',
      icon: Gavel,
      color: 'text-brand-blue',
      borderColor: 'border-brand-blue',
      bgHover: 'group-hover:bg-brand-blue/5',
      desc: 'Executive oversight, reporting, and critical approvals.'
    },
    {
      id: UserRole.TEACHER,
      title: 'Class Teacher',
      icon: BookOpen,
      color: 'text-brand-green',
      borderColor: 'border-brand-green',
      bgHover: 'group-hover:bg-brand-green/5',
      desc: 'Daily attendance, grading, and competency recording.'
    },
    {
      id: UserRole.PARENT,
      title: 'Parent/Guardian',
      icon: Home,
      color: 'text-brand-sky',
      borderColor: 'border-brand-sky',
      bgHover: 'group-hover:bg-brand-sky/5',
      desc: "Track child's progress, fees, and communication."
    }
  ];

  const activeRoleConfig = roles.find(r => r.id === selectedRole);

  if (showWizard) {
      return <AdmissionsWizard onExit={() => setShowWizard(false)} />;
  }

  return (
    <div className="min-h-screen bg-brand-grey flex flex-col items-center justify-center p-6 relative">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-blue via-brand-green to-brand-yellow"></div>

      <div className="w-full max-w-6xl z-10">
        
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in relative">
          <h1 className="text-5xl font-display font-bold text-brand-blue mb-3 tracking-tight">Mwangaza</h1>
          <p className="text-gray-500 font-sans text-lg">Choose your entry point.</p>
          
          {/* Public Admissions CTA */}
          <div className="mt-6">
             <button 
                onClick={() => setShowWizard(true)}
                className="px-6 py-3 bg-brand-yellow text-brand-blue font-bold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2 mx-auto"
             >
                <Sparkles size={18}/> New Student? Apply Now
             </button>
          </div>
        </div>

        {!selectedRole ? (
          /* ROLE SELECTION GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`
                  group h-full flex flex-col text-left
                  bg-brand-card rounded-[12px] p-6 
                  shadow-sm hover:shadow-md 
                  transition-all duration-300 transform hover:-translate-y-1 
                  border border-transparent hover:border-gray-200
                  ${role.color.replace('text-', 'hover:border-opacity-50 hover:border-')}
                `}
              >
                {/* Icon Container */}
                <div className={`
                  mb-6 p-4 rounded-full w-16 h-16 
                  flex items-center justify-center 
                  bg-brand-grey ${role.bgHover} 
                  transition-colors duration-300
                `}>
                  <role.icon size={32} className={`${role.color}`} strokeWidth={1.5} />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                  <h3 className="font-display font-bold text-xl text-gray-800 mb-2 group-hover:text-brand-blue transition-colors">
                    {role.title}
                  </h3>
                  <p className="font-sans text-sm text-gray-500 leading-relaxed">
                    {role.desc}
                  </p>
                </div>

                {/* Accent Border on Hover (Simulated via bottom border or container style) */}
                <div className={`mt-6 h-1 w-0 group-hover:w-full bg-current ${role.color} transition-all duration-500 rounded-full opacity-0 group-hover:opacity-100`}></div>
              </button>
            ))}
          </div>
        ) : (
          /* AUTH CHOICE VIEW */
          <div className="max-w-md mx-auto animate-fade-in">
            <button 
              onClick={() => setSelectedRole(null)} 
              className="mb-8 flex items-center gap-2 text-gray-400 hover:text-brand-blue transition-colors text-sm font-bold uppercase tracking-wide group"
            >
              <div className="p-1 rounded-full bg-white group-hover:bg-brand-blue group-hover:text-white transition-colors">
                 <ChevronLeft size={16} />
              </div>
              Back to Roles
            </button>

            <div className="bg-brand-card rounded-[12px] shadow-lg border border-gray-100 p-8 text-center relative overflow-hidden">
              {/* Decorative background blob */}
              <div className={`absolute top-0 left-0 w-full h-2 bg-current ${activeRoleConfig?.color} opacity-80`}></div>

              <div className={`mx-auto w-24 h-24 rounded-full bg-brand-grey flex items-center justify-center mb-6 border-4 border-white shadow-sm`}>
                 {activeRoleConfig && <activeRoleConfig.icon size={48} className={activeRoleConfig.color} strokeWidth={1.5} />}
              </div>
              
              <h2 className="font-display font-bold text-2xl text-gray-800 mb-2">{activeRoleConfig?.title}</h2>
              <p className="text-gray-500 font-sans text-sm mb-8 leading-relaxed">
                Welcome back. Please select how you would like to proceed.
              </p>
              
              <div className="space-y-4">
                {/* Primary Action: Log In */}
                <button 
                  onClick={() => onLoginSelect(selectedRole)}
                  className="w-full h-12 bg-brand-blue text-white rounded-[12px] font-sans font-bold text-sm shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 transition-all flex items-center justify-center gap-2 focus:ring-4 focus:ring-brand-sky/30"
                >
                  <LogIn size={18} /> Log In
                </button>
                
                {/* Secondary Action: Create Account */}
                <button 
                  onClick={onSignupSelect}
                  className="w-full h-12 bg-transparent border-2 border-gray-200 text-gray-800 rounded-[12px] font-sans font-bold text-sm hover:border-brand-sky hover:text-brand-sky transition-all flex items-center justify-center gap-2 focus:ring-4 focus:ring-brand-sky/30"
                >
                  <UserPlus size={18} /> Create Account
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      
      {/* Footer */}
      <div className="absolute bottom-6 text-center w-full text-xs text-gray-400 font-sans">
        &copy; {new Date().getFullYear()} Mwangaza Education System. Secure & Encrypted.
      </div>
    </div>
  );
};

export default LandingView;
