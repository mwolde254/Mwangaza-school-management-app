
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Smile, Shield, Zap, Heart, Activity, 
  CheckCircle2, Users, Layers, ArrowRight, 
  Quote, Smartphone, Globe, ChevronLeft
} from 'lucide-react';

const AboutView: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      
      {/* NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="text-brand-blue group-hover:scale-110 transition-transform duration-300">
               <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="22" stroke="currentColor" strokeWidth="9" />
                  <path d="M50 5V18 M50 82V95 M5 50H18 M82 50H95 M18.18 18.18L27.37 27.37 M72.63 72.63L81.82 81.82 M18.18 81.82L27.37 72.63 M72.63 27.37L81.82 18.18" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
               </svg>
            </div>
            <span className="font-display font-extrabold text-xl text-brand-blue">Mwangaza</span>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-blue transition-colors"
          >
            <ChevronLeft size={16} /> Back to Home
          </button>
        </div>
      </nav>

      {/* A. HERO SECTION */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-b from-gray-50 via-sky-50/30 to-white">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-blue/5 border border-brand-blue/20 rounded-full text-brand-blue text-xs font-bold shadow-sm mb-6 animate-fade-in">
            <Heart size={14} className="text-brand-red fill-brand-red"/>
            <span>Built with love in Nairobi</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-extrabold text-brand-blue mb-6 leading-tight animate-slide-up">
            Mwangaza brings joy to school management.
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto animate-slide-up" style={{animationDelay: '0.1s'}}>
            Powered by modern tech, designed for Kenyan classrooms. We exist because tracking a child’s potential should never feel like paperwork.
          </p>
          <button className="px-8 py-4 bg-brand-green text-white font-bold rounded-[12px] shadow-xl shadow-brand-green/20 hover:bg-brand-green/90 hover:-translate-y-1 transition-all flex items-center gap-2 mx-auto animate-slide-up" style={{animationDelay: '0.2s'}}>
            Join the Movement <ArrowRight size={20}/>
          </button>
        </div>
        
        {/* Abstract Background Shapes */}
        <div className="absolute top-20 -left-20 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 -right-20 w-80 h-80 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none"></div>
      </section>

      {/* B. IMPACT SNAPSHOT */}
      <section className="bg-brand-blue py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val: "45k+", label: "Competencies Tracked" },
              { val: "99.9%", label: "System Uptime" },
              { val: "+40%", label: "Fee Collection Rate" },
              { val: "Zero", label: "Data Bundles Wasted" }
            ].map((stat, idx) => (
              <div key={idx} className="space-y-1">
                <p className="text-4xl md:text-5xl font-display font-extrabold text-brand-yellow">{stat.val}</p>
                <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* C. PHILOSOPHY GRID */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display font-extrabold text-3xl text-gray-900">Why "Playful Professionalism"?</h2>
            <p className="text-gray-500 mt-2">Serious software doesn't have to be boring.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white/70 backdrop-blur-md rounded-[24px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-sky/30 transition-all group">
              <div className="w-14 h-14 bg-brand-yellow/10 rounded-2xl flex items-center justify-center text-brand-yellow-600 mb-6 group-hover:scale-110 transition-transform">
                <Smile size={32} strokeWidth={2.5}/>
              </div>
              <h3 className="font-display font-bold text-xl text-gray-800 mb-3">Joyful Usage</h3>
              <p className="text-gray-600 leading-relaxed">
                We design to lower anxiety for parents and teachers. Friendly colors, clear language, and forgiving interfaces make Mwangaza a delight to use.
              </p>
            </div>

            <div className="p-8 bg-white/70 backdrop-blur-md rounded-[24px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-blue/30 transition-all group">
              <div className="w-14 h-14 bg-brand-blue/10 rounded-2xl flex items-center justify-center text-brand-blue mb-6 group-hover:scale-110 transition-transform">
                <Shield size={32} strokeWidth={2.5}/>
              </div>
              <h3 className="font-display font-bold text-xl text-gray-800 mb-3">Serious Power</h3>
              <p className="text-gray-600 leading-relaxed">
                Under the hood, it's enterprise-grade infrastructure. Bank-level security and real-time database syncing ensure data is safe and always available.
              </p>
            </div>

            <div className="p-8 bg-white/70 backdrop-blur-md rounded-[24px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-green/30 transition-all group">
              <div className="w-14 h-14 bg-brand-green/10 rounded-2xl flex items-center justify-center text-brand-green mb-6 group-hover:scale-110 transition-transform">
                <Users size={32} strokeWidth={2.5}/>
              </div>
              <h3 className="font-display font-bold text-xl text-gray-800 mb-3">Accessibility</h3>
              <p className="text-gray-600 leading-relaxed">
                Priced for the community. We optimize for low-bandwidth environments so every parent in Kenya can stay connected to their child's education.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* D. OUR STORY */}
      <section className="py-24 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 space-y-6">
              <span className="text-brand-blue font-bold text-sm uppercase tracking-wider">Our Origin</span>
              <h2 className="font-display font-extrabold text-4xl text-gray-900 leading-tight">
                Born in the transition, <br/>refined by the teacher.
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                When Kenya shifted to the Competency Based Curriculum (CBC), we saw teachers drowning in paperwork. The old systems couldn't handle the new, holistic assessment methods.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                We sat down with Head Teacher Mr. Kamau in a small office in Westlands. He showed us his stack of assessment rubrics. "I want to spend time teaching," he said, "not filling forms." That was the spark. We built Mwangaza to turn that stack of papers into a single swipe.
              </p>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="absolute inset-0 bg-brand-blue rounded-[32px] rotate-3 opacity-10"></div>
              <img 
                src="https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                alt="Teacher in classroom" 
                className="relative rounded-[32px] shadow-2xl border-4 border-white z-10 hover:rotate-1 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* E. HISTORY TIMELINE */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative border-l-4 border-brand-green/20 ml-6 md:ml-0 md:pl-8 space-y-16">
            
            {/* Node 1 */}
            <div className="relative md:flex gap-8 items-start">
              <div className="absolute -left-[42px] md:-left-[46px] top-0 w-6 h-6 rounded-full bg-brand-green border-4 border-white shadow-md"></div>
              <div className="md:w-32 pt-1">
                <span className="font-display font-bold text-2xl text-brand-green">2023</span>
              </div>
              <div className="flex-1 mt-2 md:mt-0">
                <h3 className="font-bold text-xl text-gray-800">The Spark</h3>
                <p className="text-gray-600 mt-2">Prototype piloted in 3 schools. Feedback was instantaneous: "Make it simpler." We stripped away 50% of the features to focus on what mattered.</p>
              </div>
            </div>

            {/* Node 2 */}
            <div className="relative md:flex gap-8 items-start">
              <div className="absolute -left-[42px] md:-left-[46px] top-0 w-6 h-6 rounded-full bg-brand-green border-4 border-white shadow-md"></div>
              <div className="md:w-32 pt-1">
                <span className="font-display font-bold text-2xl text-brand-green">2024</span>
              </div>
              <div className="flex-1 mt-2 md:mt-0">
                <h3 className="font-bold text-xl text-gray-800">Offline Breakthrough</h3>
                <p className="text-gray-600 mt-2">We introduced 'Mwangaza Sync', allowing teachers in remote areas to grade without internet. Data syncs automatically when connection is restored.</p>
              </div>
            </div>

            {/* Node 3 */}
            <div className="relative md:flex gap-8 items-start">
              <div className="absolute -left-[42px] md:-left-[46px] top-0 w-6 h-6 rounded-full bg-brand-blue border-4 border-white shadow-md ring-4 ring-brand-blue/10"></div>
              <div className="md:w-32 pt-1">
                <span className="font-display font-bold text-2xl text-brand-blue">2025</span>
              </div>
              <div className="flex-1 mt-2 md:mt-0">
                <h3 className="font-bold text-xl text-gray-800">The Ecosystem</h3>
                <p className="text-gray-600 mt-2">Launching Transport and Finance modules. Mwangaza becomes a full-stack OS for modern Kenyan schools.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* F. MISSION & VISION */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-brand-sky/10 p-8 rounded-[24px] border border-brand-sky/20">
              <h3 className="font-display font-bold text-xl text-brand-blue mb-4">Our Mission</h3>
              <p className="text-gray-700 leading-relaxed font-medium">
                To eliminate friction in education management so educators can focus on inspiring the next generation.
              </p>
            </div>
            <div className="bg-brand-yellow/10 p-8 rounded-[24px] border border-brand-yellow/20">
              <h3 className="font-display font-bold text-xl text-brand-yellow-600 mb-4">Our Vision</h3>
              <p className="text-gray-700 leading-relaxed font-medium">
                A Kenya where every parent is connected to their child's learning journey, regardless of distance or device.
              </p>
            </div>
            <div className="bg-brand-green/10 p-8 rounded-[24px] border border-brand-green/20">
              <h3 className="font-display font-bold text-xl text-brand-green mb-4">Our Promise</h3>
              <p className="text-gray-700 leading-relaxed font-medium">
                Software that listens. We build what schools need, not what Silicon Valley thinks they need.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* G. HOW WE BUILD */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="font-display font-extrabold text-3xl text-gray-900 mb-12">Playful Design, Serious Code.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-left">
            {[
              "Human-First UI/UX",
              "Offline Resilience",
              "Data Sovereignty",
              "Lightweight Assets",
              "Real-time Sync",
              "Local Payment APIs"
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                <div className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                  <CheckCircle2 size={16}/>
                </div>
                <span className="font-bold text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* H. THE ECOSYSTEM */}
      <section className="py-24 bg-brand-blue text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h2 className="font-display font-extrabold text-3xl mb-16">The Connected Platform</h2>
          
          <div className="relative h-[400px] flex items-center justify-center">
            {/* Central Node */}
            <div className="relative z-20 w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.3)]">
              <div className="text-center">
                <div className="text-brand-blue font-display font-extrabold text-xl">Mwangaza</div>
                <div className="text-gray-400 text-xs font-bold tracking-widest uppercase">Core</div>
              </div>
            </div>

            {/* Orbiting Nodes */}
            <div className="absolute inset-0 animate-spin-slow">
               {/* Node 1: Admissions */}
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6">
                  <div className="w-24 h-24 bg-brand-green rounded-full flex flex-col items-center justify-center shadow-xl border-4 border-brand-blue animate-spin-reverse-slow">
                     <Users size={24} className="text-white mb-1"/>
                     <span className="text-[10px] font-bold text-white uppercase">Admissions</span>
                  </div>
               </div>
               {/* Node 2: Finance */}
               <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6">
                  <div className="w-24 h-24 bg-brand-yellow rounded-full flex flex-col items-center justify-center shadow-xl border-4 border-brand-blue animate-spin-reverse-slow">
                     <Globe size={24} className="text-brand-blue mb-1"/>
                     <span className="text-[10px] font-bold text-brand-blue uppercase">Finance</span>
                  </div>
               </div>
               {/* Node 3: Transport */}
               <div className="absolute top-1/2 left-0 -translate-x-6 -translate-y-1/2">
                  <div className="w-24 h-24 bg-brand-sky rounded-full flex flex-col items-center justify-center shadow-xl border-4 border-brand-blue animate-spin-reverse-slow">
                     <Smartphone size={24} className="text-brand-blue mb-1"/>
                     <span className="text-[10px] font-bold text-brand-blue uppercase">Comms</span>
                  </div>
               </div>
               {/* Node 4: Academics */}
               <div className="absolute top-1/2 right-0 translate-x-6 -translate-y-1/2">
                  <div className="w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center shadow-xl border-4 border-brand-blue animate-spin-reverse-slow">
                     <Layers size={24} className="text-brand-blue mb-1"/>
                     <span className="text-[10px] font-bold text-brand-blue uppercase">Academics</span>
                  </div>
               </div>
            </div>
            
            {/* Connecting Lines (Static Visuals) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
               <div className="w-[1px] h-full bg-white"></div>
               <div className="h-[1px] w-full bg-white"></div>
            </div>
          </div>
        </div>
      </section>

      {/* I. FOOTER */}
      <footer className="bg-[#0f172a] text-white pt-20 pb-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Quote size={40} className="text-brand-sky mx-auto mb-6 opacity-50"/>
          <p className="text-2xl md:text-3xl font-display font-bold leading-normal mb-8">
            "Before Mwangaza, CBC reporting was a nightmare. Now, it's the highlight of our term. Parents are happier, and teachers are less stressed."
          </p>
          <div className="flex items-center justify-center gap-4 mb-16">
             <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-xl font-bold">JK</div>
             <div className="text-left">
                <p className="font-bold text-white">Mr. J. Kamau</p>
                <p className="text-brand-sky text-sm">Head Teacher, Nairobi</p>
             </div>
          </div>

          <div className="p-8 bg-white/5 rounded-3xl border border-white/10">
             <h3 className="font-display font-bold text-2xl mb-4">Ready to turn the lights on?</h3>
             <p className="text-gray-400 mb-8">Join over 50 schools modernizing their operations today.</p>
             <button className="px-8 py-4 bg-brand-blue text-white font-bold rounded-xl shadow-lg hover:bg-brand-blue/80 transition-all">
                Join Waitlist
             </button>
          </div>

          <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
             <p>&copy; 2024 Mwangaza Systems. All rights reserved.</p>
             <div className="flex gap-6 mt-4 md:mt-0">
                <span className="hover:text-white cursor-pointer">Privacy</span>
                <span className="hover:text-white cursor-pointer">Terms</span>
                <span className="hover:text-white cursor-pointer">Twitter</span>
             </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default AboutView;
