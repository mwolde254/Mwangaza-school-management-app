
import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, X, Loader2, Download } from 'lucide-react';
import { useStudentData } from '../context/StudentDataContext';

interface BulkStudentImportProps {
  onClose: () => void;
  onSuccess: () => void;
}

const BulkStudentImport: React.FC<BulkStudentImportProps> = ({ onClose, onSuccess }) => {
  const { bulkCreateStudents } = useStudentData();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Mock Parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setIsProcessing(true);
      
      // Simulate CSV Parsing delay
      setTimeout(() => {
        // Mock parsed data
        const mockParsed = [
            { name: "John Doe", admNo: "MW-2023-101", grade: "Grade 4", parentEmail: "john@doe.com", status: "VALID" },
            { name: "Jane Smith", admNo: "MW-2023-102", grade: "Grade 4", parentEmail: "jane@smith.com", status: "VALID" },
            { name: "Michael Roe", admNo: "", grade: "Grade 5", parentEmail: "michael@roe.com", status: "ERROR", error: "Missing Adm No" },
        ];
        setParsedData(mockParsed);
        setIsProcessing(false);
      }, 1500);
    }
  };

  const handleImport = async () => {
    setIsUploading(true);
    const validStudents = parsedData.filter(d => d.status === 'VALID').map(d => ({
        name: d.name,
        admissionNumber: d.admNo,
        grade: d.grade,
        parentName: 'Pending Import', // Placeholder
        parentEmail: d.parentEmail,
        enrollmentDate: new Date().toISOString().split('T')[0],
        balance: 0,
        avatarUrl: `https://ui-avatars.com/api/?name=${d.name}&background=random`
    }));

    await bulkCreateStudents(validStudents);
    setIsUploading(false);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 rounded-full p-1"><X size={20}/></button>
        
        <div className="p-8 border-b border-gray-100">
            <h2 className="font-display font-bold text-2xl text-gray-800 mb-1">Bulk Student Import</h2>
            <p className="text-gray-500 text-sm">Upload a CSV file to create multiple student records at once.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
            {!file ? (
                <div className="space-y-6">
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center hover:border-brand-blue hover:bg-brand-blue/5 transition-all cursor-pointer relative">
                        <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer"/>
                        <div className="w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center text-brand-blue mb-4">
                            <UploadCloud size={32}/>
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg">Drag & Drop CSV File</h3>
                        <p className="text-gray-500 text-sm mt-1">or click to browse your computer</p>
                    </div>
                    
                    <div className="flex justify-center">
                        <button className="flex items-center gap-2 text-sm font-bold text-brand-blue hover:underline">
                            <Download size={16}/> Download Template
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {isProcessing ? (
                        <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                            <Loader2 size={32} className="animate-spin text-brand-blue mb-2"/>
                            <p className="text-sm font-bold">Parsing CSV...</p>
                        </div>
                    ) : (
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                    <FileText size={14}/> {file.name}
                                </span>
                                <button onClick={() => { setFile(null); setParsedData([]); }} className="text-xs font-bold text-red-500 hover:underline">Remove</button>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white text-gray-500 font-bold text-xs uppercase border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Adm No</th>
                                        <th className="px-4 py-3">Grade</th>
                                        <th className="px-4 py-3">Parent Email</th>
                                        <th className="px-4 py-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {parsedData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-800">{row.name}</td>
                                            <td className="px-4 py-3 text-gray-600">{row.admNo || '-'}</td>
                                            <td className="px-4 py-3 text-gray-600">{row.grade}</td>
                                            <td className="px-4 py-3 text-gray-600">{row.parentEmail}</td>
                                            <td className="px-4 py-3 text-right">
                                                {row.status === 'VALID' ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-green bg-brand-green/10 px-2 py-1 rounded">
                                                        <CheckCircle2 size={12}/> Valid
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-red bg-brand-red/10 px-2 py-1 rounded" title={row.error}>
                                                        <AlertTriangle size={12}/> Error
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>

        {file && !isProcessing && (
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    <span className="font-bold text-gray-800">{parsedData.filter(d => d.status === 'VALID').length}</span> valid records found.
                </div>
                <button 
                    onClick={handleImport}
                    disabled={isUploading || parsedData.filter(d => d.status === 'VALID').length === 0}
                    className="px-8 h-12 bg-brand-blue text-white font-bold rounded-xl shadow-lg hover:bg-brand-blue/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isUploading ? <Loader2 className="animate-spin" size={18}/> : 'Import Students'}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default BulkStudentImport;
