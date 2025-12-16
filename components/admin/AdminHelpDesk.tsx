
import React, { useState, useMemo } from 'react';
import { useStudentData } from '../../context/StudentDataContext';
import { useAuth } from '../../context/AuthContext';
import { Search, User, Briefcase, UserCircle, MapPin, GraduationCap, Loader2, Send, MessageCircle } from 'lucide-react';
import { TicketStatus, TicketPriority } from '../../types';
import { formatDistanceToNow, format } from 'date-fns';

const inputClass = "w-full h-12 px-4 rounded-[6px] border border-gray-200 focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 outline-none transition-all font-sans text-gray-700 bg-white";

const AdminHelpDesk = () => {
  const { supportTickets, replyToTicket, updateTicket, staffRecords } = useStudentData();
  const { user } = useAuth();
  
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [ticketFilterStatus, setTicketFilterStatus] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [ticketSearchTerm, setTicketSearchTerm] = useState('');

  const filteredTickets = useMemo(() => {
      return supportTickets.filter(t => {
          const matchesStatus = ticketFilterStatus === 'ALL' || t.status === ticketFilterStatus;
          const matchesSearch = t.subject.toLowerCase().includes(ticketSearchTerm.toLowerCase()) || t.requestorName.toLowerCase().includes(ticketSearchTerm.toLowerCase()) || t.id.includes(ticketSearchTerm);
          return matchesStatus && matchesSearch;
      }).sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [supportTickets, ticketFilterStatus, ticketSearchTerm]);

  const selectedTicket = useMemo(() => supportTickets.find(t => t.id === selectedTicketId), [supportTickets, selectedTicketId]);

  const handleResolveTicket = async () => {
    if(!selectedTicketId || !ticketReply) return;
    setIsSendingReply(true);
    await replyToTicket(selectedTicketId, {
        senderId: user?.id || 'admin',
        senderName: user?.name || 'Admin',
        role: 'ADMIN',
        message: ticketReply
    });
    if (selectedTicket?.status === 'OPEN') {
        await updateTicket(selectedTicketId, { status: 'IN_PROGRESS' });
    }
    setIsSendingReply(false);
    setTicketReply('');
  };

  const handleChangeTicketStatus = async (status: TicketStatus) => {
      if(!selectedTicketId) return;
      await updateTicket(selectedTicketId, { status });
  };

  const handleChangeTicketPriority = async (priority: TicketPriority) => {
      if(!selectedTicketId) return;
      await updateTicket(selectedTicketId, { priority });
  };

  const handleAssignTicket = async (staffId: string) => {
      if(!selectedTicketId) return;
      const staff = staffRecords.find(s => s.userId === staffId);
      await updateTicket(selectedTicketId, { assignedToId: staffId, assignedToName: staff?.fullName });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)] animate-slide-up">
        {/* Left Pane: Inbox List (Col 4) */}
        <div className="lg:col-span-4 flex flex-col bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 space-y-3 bg-gray-50">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                    <input 
                        type="text" 
                        placeholder="Search tickets..." 
                        value={ticketSearchTerm}
                        onChange={(e) => setTicketSearchTerm(e.target.value)}
                        className={`${inputClass} pl-10 h-10 text-sm`}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(status => (
                        <button 
                            key={status}
                            onClick={() => setTicketFilterStatus(status as any)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border ${
                                ticketFilterStatus === status 
                                    ? 'bg-brand-blue text-white border-brand-blue' 
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-brand-blue/30'
                            }`}
                        >
                            {status.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredTickets.length > 0 ? filteredTickets.map(ticket => (
                    <div 
                        key={ticket.id}
                        onClick={() => setSelectedTicketId(ticket.id)}
                        className={`p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-brand-grey/50 ${selectedTicketId === ticket.id ? 'bg-brand-blue/5 border-l-4 border-l-brand-blue' : 'border-l-4 border-l-transparent'}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                    ticket.status === 'OPEN' ? 'bg-brand-yellow' : 
                                    ticket.status === 'IN_PROGRESS' ? 'bg-brand-sky' : 
                                    'bg-brand-green'
                                }`}></div>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                    ticket.priority === 'CRITICAL' ? 'bg-brand-red/10 text-brand-red' : 
                                    ticket.priority === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                                    'bg-gray-100 text-gray-500'
                                }`}>
                                    {ticket.priority}
                                </span>
                            </div>
                            <span className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}</span>
                        </div>
                        <h4 className={`text-sm font-bold mb-1 line-clamp-1 ${selectedTicketId === ticket.id ? 'text-brand-blue' : 'text-gray-800'}`}>
                            {ticket.subject}
                        </h4>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                                {ticket.requestorRole === 'PARENT' ? <User size={12}/> : <Briefcase size={12}/>}
                                {ticket.requestorName}
                            </span>
                            <span className="bg-gray-100 px-1.5 rounded text-[10px] uppercase font-bold">{ticket.category}</span>
                        </div>
                    </div>
                )) : (
                    <div className="p-8 text-center text-gray-400 text-sm">No tickets found.</div>
                )}
            </div>
        </div>

        {/* Right Pane: Ticket Detail (Col 8) */}
        <div className="lg:col-span-8 bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden flex flex-col relative">
            {selectedTicket ? (
                <>
                    {/* Detail Header */}
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-xs text-gray-400">#{selectedTicket.id}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${selectedTicket.source === 'PARENT' ? 'bg-brand-sky/10 text-brand-sky' : 'bg-purple-100 text-purple-600'}`}>
                                    {selectedTicket.source} TICKET
                                </span>
                            </div>
                            <h3 className="font-display font-bold text-xl text-gray-800">{selectedTicket.subject}</h3>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><UserCircle size={14}/> {selectedTicket.requestorName}</span>
                                {selectedTicket.location && <span className="flex items-center gap-1"><MapPin size={14}/> {selectedTicket.location}</span>}
                                {selectedTicket.studentName && <span className="flex items-center gap-1"><GraduationCap size={14}/> {selectedTicket.studentName}</span>}
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex gap-2">
                                <select 
                                    value={selectedTicket.status}
                                    onChange={(e) => handleChangeTicketStatus(e.target.value as any)}
                                    className="h-8 pl-2 pr-6 rounded text-xs font-bold bg-white border border-gray-200 focus:border-brand-blue outline-none"
                                >
                                    <option value="OPEN">Open</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="RESOLVED">Resolved</option>
                                </select>
                                <select 
                                    value={selectedTicket.priority}
                                    onChange={(e) => handleChangeTicketPriority(e.target.value as any)}
                                    className={`h-8 pl-2 pr-6 rounded text-xs font-bold border outline-none ${
                                        selectedTicket.priority === 'CRITICAL' ? 'bg-brand-red/10 text-brand-red border-brand-red/20' : 
                                        selectedTicket.priority === 'HIGH' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                        'bg-white border-gray-200 text-gray-600'
                                    }`}
                                >
                                    <option value="NORMAL">Normal</option>
                                    <option value="HIGH">High</option>
                                    <option value="CRITICAL">Critical</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Assigned To:</span>
                                <select 
                                    value={selectedTicket.assignedToId || ''}
                                    onChange={(e) => handleAssignTicket(e.target.value)}
                                    className="h-6 text-xs bg-transparent border-b border-gray-300 focus:border-brand-blue outline-none w-32"
                                >
                                    <option value="">Unassigned</option>
                                    {staffRecords.map(staff => (
                                        <option key={staff.userId || staff.id} value={staff.userId || staff.id}>{staff.fullName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Chat Thread */}
                    <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6">
                        {selectedTicket.messages.map((msg, idx) => {
                            const isStaff = msg.role === 'ADMIN' || msg.role === 'TEACHER' || msg.role === 'PRINCIPAL';
                            const isMe = msg.senderId === user?.id; // Assuming user.id available
                            
                            return (
                                <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isStaff ? 'bg-brand-blue text-white' : 'bg-brand-grey text-gray-600'}`}>
                                        {msg.senderName[0]}
                                    </div>
                                    <div className={`max-w-[80%]`}>
                                        <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'justify-end' : ''}`}>
                                            <span className="text-xs font-bold text-gray-700">{msg.senderName}</span>
                                            <span className="text-[10px] text-gray-400">{format(new Date(msg.timestamp), 'MMM d, HH:mm')}</span>
                                        </div>
                                        <div className={`p-3 rounded-xl text-sm leading-relaxed ${
                                            isMe ? 'bg-brand-blue text-white rounded-tr-none' : 
                                            isStaff ? 'bg-brand-blue/5 text-gray-800 rounded-tl-none border border-brand-blue/10' :
                                            'bg-gray-100 text-gray-800 rounded-tl-none'
                                        }`}>
                                            {msg.message}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Reply Box */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50">
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={ticketReply}
                                onChange={(e) => setTicketReply(e.target.value)}
                                placeholder="Type your reply..."
                                className="flex-1 h-10 px-4 rounded-[6px] border border-gray-200 focus:border-brand-blue outline-none text-sm"
                                onKeyPress={(e) => e.key === 'Enter' && handleResolveTicket()}
                            />
                            <button 
                                onClick={handleResolveTicket}
                                disabled={!ticketReply.trim() || isSendingReply}
                                className="h-10 px-4 bg-brand-blue text-white rounded-[12px] font-bold text-sm hover:bg-brand-blue/90 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSendingReply ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
                                Reply
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <MessageCircle size={48} className="mb-4 opacity-20"/>
                    <p>Select a ticket to view details</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default AdminHelpDesk;
