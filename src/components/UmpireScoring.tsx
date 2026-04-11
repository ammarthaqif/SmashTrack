import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { Match } from '../types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface UmpireScoringProps {
  matchId: string;
  tournamentId: string;
  onExit: () => void;
}

export default function UmpireScoring({ matchId, tournamentId, onExit }: UmpireScoringProps) {
  const [match, setMatch] = useState<Match | null>(null);
  const [undoStack, setUndoStack] = useState<Partial<Match>[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, `tournaments/${tournamentId}/matches/${matchId}`), (snapshot) => {
      if (snapshot.exists()) {
        setMatch({ id: snapshot.id, ...snapshot.data() } as Match);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `tournaments/${tournamentId}/matches/${matchId}`);
    });
    return () => unsubscribe();
  }, [matchId, tournamentId]);

  const updateScore = async (player: 1 | 2, amount: number) => {
    if (!match) return;
    
    // Save state for undo
    setUndoStack(prev => [...prev, { score1: match.score1, score2: match.score2, server: match.server, sets: [...match.sets] }]);

    const matchRef = doc(db, `tournaments/${tournamentId}/matches/${matchId}`);
    let newScore1 = player === 1 ? match.score1 + amount : match.score1;
    let newScore2 = player === 2 ? match.score2 + amount : match.score2;

    // Basic Badminton Logic: Server changes on point win if it was opponent's serve
    let newServer = match.server;
    if (player === 1) newServer = 'p1';
    if (player === 2) newServer = 'p2';

    // Check for set win (21 points, or 2 point lead after 20, max 30)
    const isSetOver = (s1: number, s2: number) => {
      if (s1 >= 21 && s1 - s2 >= 2) return true;
      if (s2 >= 21 && s2 - s1 >= 2) return true;
      if (s1 === 30 || s2 === 30) return true;
      return false;
    };

    if (isSetOver(newScore1, newScore2)) {
      const newSets = [...match.sets, { s1: newScore1, s2: newScore2 }];
      await updateDoc(matchRef, {
        score1: 0,
        score2: 0,
        sets: newSets,
        currentSet: match.currentSet + 1,
        status: newSets.length >= 2 && (
          (newSets.filter(s => s.s1 > s.s2).length >= 2) || 
          (newSets.filter(s => s.s2 > s.s1).length >= 2)
        ) ? 'completed' : 'ongoing'
      });
      return;
    }

    await updateDoc(matchRef, {
      score1: Math.max(0, newScore1),
      score2: Math.max(0, newScore2),
      server: newServer,
      status: 'ongoing'
    });
  };

  const undo = async () => {
    if (undoStack.length === 0) return;
    const lastState = undoStack[undoStack.length - 1];
    const matchRef = doc(db, `tournaments/${tournamentId}/matches/${matchId}`);
    await updateDoc(matchRef, lastState);
    setUndoStack(prev => prev.slice(0, -1));
  };

  const endMatch = async () => {
    if (!match) return;
    const matchRef = doc(db, `tournaments/${tournamentId}/matches/${matchId}`);
    await updateDoc(matchRef, {
      status: 'completed'
    });
    onExit();
  };

  if (!match) return <div className="p-8 text-center">Loading match...</div>;

  return (
    <div className="fixed inset-0 bg-slate-950 text-white z-[100] flex flex-col overflow-hidden select-none">
      {/* Top Bar */}
      <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onExit} className="text-white/60 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" /> Exit
          </Button>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-sm font-medium text-white/80">Court {match.courtNumber} • {match.isDoubles ? 'Doubles' : 'Singles'}</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={undo} disabled={undoStack.length === 0} className="bg-transparent border-white/20 text-white hover:bg-white/10">
            <RotateCcw className="w-4 h-4 mr-2" /> Undo
          </Button>
          <Badge className="bg-green-500 animate-pulse">LIVE</Badge>
        </div>
      </div>

      {/* Main Scoring Area - Optimized for Landscape */}
      <div className="flex-1 flex">
        {/* Player 1 Side */}
        <div 
          className={cn(
            "flex-1 flex flex-col items-center justify-center relative cursor-pointer transition-all active:scale-95",
            match.server === 'p1' ? "bg-blue-600/20" : "bg-transparent"
          )}
          onClick={() => updateScore(1, 1)}
        >
          {match.server === 'p1' && (
            <motion.div layoutId="server" className="absolute top-8 bg-yellow-400 text-slate-900 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
              Serving
            </motion.div>
          )}
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold opacity-60 uppercase tracking-widest">{match.player1}</h3>
            <div className="text-[15vw] font-black leading-none tabular-nums drop-shadow-2xl">{match.score1}</div>
          </div>
          <div className="absolute bottom-8 text-white/20 text-xs uppercase tracking-[0.3em]">Tap to add point</div>
        </div>

        {/* Divider */}
        <div className="w-px bg-white/10 flex flex-col items-center justify-center gap-4 py-8">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white/40">VS</div>
        </div>

        {/* Player 2 Side */}
        <div 
          className={cn(
            "flex-1 flex flex-col items-center justify-center relative cursor-pointer transition-all active:scale-95",
            match.server === 'p2' ? "bg-red-600/20" : "bg-transparent"
          )}
          onClick={() => updateScore(2, 1)}
        >
          {match.server === 'p2' && (
            <motion.div layoutId="server" className="absolute top-8 bg-yellow-400 text-slate-900 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
              Serving
            </motion.div>
          )}
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold opacity-60 uppercase tracking-widest">{match.player2}</h3>
            <div className="text-[15vw] font-black leading-none tabular-nums drop-shadow-2xl">{match.score2}</div>
          </div>
          <div className="absolute bottom-8 text-white/20 text-xs uppercase tracking-[0.3em]">Tap to add point</div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="h-20 border-t border-white/10 bg-slate-900/80 flex items-center justify-around px-4">
        <Button variant="ghost" className="flex-col h-auto py-2 gap-1 text-white/60" onClick={() => updateScore(1, -1)}>
          <span className="text-xs font-bold">-1 P1</span>
        </Button>
        <div className="flex items-center gap-8">
          {match.sets.map((set, idx) => (
            <div key={idx} className="text-center">
              <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Set {idx + 1}</p>
              <p className="font-mono text-lg">{set.s1}-{set.s2}</p>
            </div>
          ))}
          <Button className="bg-white text-slate-950 hover:bg-slate-200 font-bold px-8" onClick={endMatch}>
            End Match
          </Button>
          <div className="text-center">
            <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Current</p>
            <p className="font-mono text-lg">Set {match.currentSet}</p>
          </div>
        </div>
        <Button variant="ghost" className="flex-col h-auto py-2 gap-1 text-white/60" onClick={() => updateScore(2, -1)}>
          <span className="text-xs font-bold">-1 P2</span>
        </Button>
      </div>
    </div>
  );
}
