import * as React from 'react';
import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { Match, Tournament } from '../types';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Trophy, Activity, MapPin, Calendar, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';

interface AudienceViewProps {
  tournamentId: string;
  onBack: () => void;
}

export default function AudienceView({ tournamentId, onBack }: AudienceViewProps) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    const unsubscribeT = onSnapshot(doc(db, `tournaments/${tournamentId}`), (snapshot) => {
      if (snapshot.exists()) {
        setTournament({ id: snapshot.id, ...snapshot.data() } as Tournament);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `tournaments/${tournamentId}`);
    });

    const q = query(collection(db, `tournaments/${tournamentId}/matches`));
    const unsubscribeM = onSnapshot(q, (snapshot) => {
      setMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `tournaments/${tournamentId}/matches`);
    });

    return () => {
      unsubscribeT();
      unsubscribeM();
    };
  }, [tournamentId]);

  const ongoingMatches = matches.filter(m => m.status === 'ongoing');
  const scheduledMatches = matches.filter(m => m.status === 'scheduled');
  const completedMatches = matches.filter(m => m.status === 'completed');

  if (!tournament) return <div className="p-8 text-center">Finding tournament...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-blue-600 text-white p-6 rounded-b-[2.5rem] shadow-lg">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex gap-4">
              {tournament.logoUrl && (
                <img 
                  src={tournament.logoUrl} 
                  alt="Logo" 
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-lg"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="space-y-1">
                <Button variant="ghost" size="sm" onClick={onBack} className="text-blue-100 hover:text-white -ml-2 mb-2">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <h1 className="text-3xl font-black tracking-tight">{tournament.name}</h1>
                <div className="flex items-center gap-3 text-blue-100 text-sm">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {tournament.venue}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {tournament.date}</span>
                </div>
              </div>
            </div>
            <Trophy className="w-10 h-10 text-yellow-400 drop-shadow-lg" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 -mt-6 space-y-8">
        {/* Live Matches */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Activity className="w-5 h-5 text-red-500 animate-pulse" />
            <h2 className="font-bold text-slate-900 uppercase tracking-wider text-sm">Live Now</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {ongoingMatches.length > 0 ? (
                ongoingMatches.map((match) => (
                  <motion.div
                    key={match.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Card className="border-none shadow-xl overflow-hidden bg-white">
                      <div className="bg-slate-900 text-white px-4 py-2 flex justify-between items-center text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <span>COURT {match.courtNumber}</span>
                          {(match.stage || match.roundName) && (
                            <span className="text-white/40 font-medium px-2 py-0.5 bg-white/5 rounded">
                              {match.stage === 'group' ? match.groupName : match.roundName}
                            </span>
                          )}
                        </div>
                        <Badge className="bg-red-500 text-[10px] h-5">LIVE</Badge>
                      </div>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 text-center space-y-2">
                            <div className="text-lg font-bold truncate">{match.player1}</div>
                            <motion.div 
                              key={`${match.id}-s1-${match.score1}`}
                              initial={{ scale: 1.2, color: '#3b82f6' }}
                              animate={{ scale: 1, color: '#0f172a' }}
                              className="text-5xl font-black tabular-nums"
                            >
                              {match.score1}
                            </motion.div>
                            {match.server === 'p1' && <Badge variant="secondary" className="bg-yellow-400 text-slate-900">SERVE</Badge>}
                          </div>
                          <div className="text-slate-300 font-black italic">VS</div>
                          <div className="flex-1 text-center space-y-2">
                            <div className="text-lg font-bold truncate">{match.player2}</div>
                            <motion.div 
                              key={`${match.id}-s2-${match.score2}`}
                              initial={{ scale: 1.2, color: '#ef4444' }}
                              animate={{ scale: 1, color: '#0f172a' }}
                              className="text-5xl font-black tabular-nums"
                            >
                              {match.score2}
                            </motion.div>
                            {match.server === 'p2' && <Badge variant="secondary" className="bg-yellow-400 text-slate-900">SERVE</Badge>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <Card className="col-span-full border-dashed border-2 border-slate-200 bg-transparent flex items-center justify-center p-12 text-slate-400 italic">
                  No matches currently live
                </Card>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Other Matches */}
        <section className="space-y-4">
          <h2 className="font-bold text-slate-900 uppercase tracking-wider text-sm px-2">Schedule & Results</h2>
          <div className="space-y-3">
            {matches.filter(m => m.status !== 'ongoing').map((match) => (
              <Card key={match.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                      C{match.courtNumber}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{match.player1} vs {match.player2}</div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-slate-500 uppercase font-medium">{match.status}</div>
                        {(match.stage || match.roundName) && (
                          <>
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                            <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                              {match.stage === 'group' ? match.groupName : match.roundName}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {match.status === 'completed' ? (
                      <div className="font-mono font-bold text-lg text-blue-600">{match.score1} - {match.score2}</div>
                    ) : (
                      <div className="text-xs font-bold text-slate-400 uppercase">TBD</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
