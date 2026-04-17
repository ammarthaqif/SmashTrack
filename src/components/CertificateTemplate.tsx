import React, { useRef } from 'react';
import { Trophy, Shield, Award, Calendar, MapPin, UserCheck } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Button } from './ui/button';
import { Download, Printer, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface CertificateData {
  playerName: string;
  tournamentName: string;
  achievement: 'Winner' | 'Runner Up' | 'Third Place' | 'Participant';
  date: string;
  venue: string;
  category: string;
  registryId?: string;
}

interface CertificateTemplateProps {
  data: CertificateData;
  onClose: () => void;
}

export default function CertificateTemplate({ data, onClose }: CertificateTemplateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    if (!certificateRef.current) return;
    
    const canvas = await html2canvas(certificateRef.current, {
      scale: 3, // Higher resolution
      useCORS: true,
      logging: false,
      backgroundColor: '#FDFCF6'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`NBR_Certificate_${data.playerName.replace(/\s+/g, '_')}.pdf`);
  };

  const printCertificate = () => {
    window.print();
  };

  const getAchievementStyles = () => {
    switch (data.achievement) {
      case 'Winner':
        return {
          title: 'CHAMPION',
          color: 'text-[#C5A037]',
          badge: <Trophy className="w-16 h-16 text-[#C5A037]" />,
          border: 'border-[#C5A037]'
        };
      case 'Runner Up':
        return {
          title: 'RUNNER UP',
          color: 'text-slate-400',
          badge: <Award className="w-16 h-16 text-slate-400" />,
          border: 'border-slate-400'
        };
      case 'Third Place':
        return {
          title: 'THIRD PLACE',
          color: 'text-amber-700',
          badge: <Award className="w-16 h-16 text-amber-700" />,
          border: 'border-amber-700'
        };
      default:
        return {
          title: 'PARTICIPATION',
          color: 'text-[#0C1222]',
          badge: <Award className="w-16 h-16 text-[#0C1222]/20" />,
          border: 'border-slate-200'
        };
    }
  };

  const styles = getAchievementStyles();

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm print:p-0 print:bg-white overflow-y-auto">
      <div className="max-w-5xl w-full space-y-4 my-auto">
        {/* Controls */}
        <div className="flex justify-between items-center print:hidden bg-[#0C1222] p-4 rounded-t-2xl border-b border-[#C5A037]">
          <div className="flex items-center gap-3">
            <h2 className="text-[#FDFCF6] font-bold uppercase tracking-widest text-sm">Official Registry Document</h2>
            <div className="bg-[#C5A037] text-[#0C1222] text-[10px] font-black px-2 py-0.5 rounded">VERIFIED</div>
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadPDF} className="bg-[#C5A037] hover:bg-[#B39032] text-[#0C1222] border-none shadow-lg">
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
            <Button onClick={printCertificate} variant="outline" className="border-[#FDFCF6]/20 text-[#FDFCF6] hover:bg-[#FDFCF6]/10">
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
            <Button onClick={onClose} variant="ghost" className="text-[#FDFCF6] hover:bg-white/10 ml-2">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Certificate Content */}
        <div 
          ref={certificateRef}
          className="bg-[#FDFCF6] aspect-[1.414/1] relative overflow-hidden shadow-2xl p-12 select-none print:shadow-none"
          id="certificate-print-area"
        >
          {/* Border Elements */}
          <div className={cn("absolute inset-6 border-4", styles.border)} />
          <div className={cn("absolute inset-10 border border-double", styles.border)} />
          
          {/* Corner Decals */}
          <div className={cn("absolute top-6 left-6 w-24 h-24 border-t-8 border-l-8 rounded-tl-xl", styles.border)} />
          <div className={cn("absolute top-6 right-6 w-24 h-24 border-t-8 border-r-8 rounded-tr-xl", styles.border)} />
          <div className={cn("absolute bottom-6 left-6 w-24 h-24 border-b-8 border-l-8 rounded-bl-xl", styles.border)} />
          <div className={cn("absolute bottom-6 right-6 w-24 h-24 border-b-8 border-r-8 rounded-br-xl", styles.border)} />

          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <Trophy className="w-[500px] h-[500px] rotate-12" />
          </div>

          {/* Header */}
          <div className="relative z-10 text-center space-y-6">
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-4 border-y border-[#0C1222]/10 py-2 px-8">
                <Shield className="w-10 h-10 text-[#0C1222]" />
                <div className="text-left">
                  <h3 className="font-serif text-2xl font-black text-[#0C1222] tracking-tighter uppercase leading-tight">
                    National Badminton Registry
                  </h3>
                  <p className="text-[10px] text-[#C5A037] font-bold tracking-[0.3em] uppercase opacity-80">
                    Official Sanctioned Sport Database
                  </p>
                </div>
              </div>
            </div>

            <p className="font-serif italic text-[#0C1222]/60 text-lg uppercase tracking-widest">
              This official document hereby recognizes the performance of
            </p>

            <h1 className="text-6xl font-serif font-black text-[#0C1222] capitalize py-4">
              {data.playerName}
            </h1>

            <div className="space-y-2 py-4">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">For the distinguished achievement of</p>
              <h2 className={cn("text-5xl font-black italic tracking-tighter leading-none", styles.color)}>
                {styles.title}
              </h2>
            </div>

            <div className="flex flex-col items-center gap-2 max-w-2xl mx-auto py-6 border-y border-[#0C1222]/5">
              <p className="text-slate-500 uppercase tracking-[0.2em] font-bold text-xs">At the officially sanctioned event</p>
              <h4 className="text-2xl font-serif font-bold text-[#0C1222]">{data.tournamentName}</h4>
              <div className="flex items-center gap-6 mt-2 text-slate-400 text-xs font-bold font-serif italic">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#C5A037]" /> {data.date}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#C5A037]" /> {data.venue}</span>
                <span className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-[#C5A037]" /> {data.category}</span>
              </div>
            </div>

            {/* Seals & Signatures */}
            <div className="flex justify-between items-end mt-16 px-12">
              <div className="text-center w-48">
                <div className="border-b-2 border-[#0C1222] pb-1 font-serif italic text-lg text-[#0C1222]">
                  Ammar Thaqif
                </div>
                <p className="text-[10px] uppercase font-bold text-[#C5A037] mt-1">Registry Superadmin</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="bg-[#FDFCF6] border-4 border-[#C5A037] p-4 rounded-full shadow-inner relative mb-2">
                   {styles.badge}
                   <div className="absolute inset-0 flex items-center justify-center opacity-10">
                     <Shield className="w-full h-full p-2" />
                   </div>
                </div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">NBR Official Seal</p>
              </div>

              <div className="text-center w-48">
                <div className="border-b-2 border-[#0C1222] pb-1 font-serif text-slate-200">
                  <span className="opacity-0">Signature</span>
                </div>
                <p className="text-[10px] uppercase font-bold text-[#C5A037] mt-1">Sanctioned Official</p>
              </div>
            </div>

            {/* Registry Info */}
            <div className="absolute bottom-10 left-0 right-0 text-center">
              <p className="text-[8px] font-mono text-slate-300 uppercase letter-spacing-widest">
                Document ID: {data.registryId || 'NBR-TEMP-VOLATILE'} • Verified at registry.badminton.gov.national
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #certificate-print-area, #certificate-print-area * {
            visibility: visible;
          }
          #certificate-print-area {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            border: none;
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
}
