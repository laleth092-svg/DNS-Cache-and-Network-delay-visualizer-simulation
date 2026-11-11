import React, { useState } from 'react';
import {
  BookOpen,
  Play,
  Zap,
  Globe,
  Database,
  Layers,
  Server,
  ArrowRight,
  Sparkles,
  Flame,
  Radio,
  Lock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Check,
} from 'lucide-react';
import { ScenarioDefinition, NETWORK_SCENARIOS } from '../data/defaultDnsDatabase';

interface ScenarioDrawerProps {
  onSelectScenario: (scenario: ScenarioDefinition) => void;
  activeScenarioId?: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'Why does transmission delay (d_trans = L / R) not depend on the physical distance between two hosts?',
    options: [
      'Because physical distance is negligible in modern networks.',
      'Because transmission delay is the time needed by the NIC to push the packet bits onto the physical link, governed solely by packet size L and bandwidth R.',
      'Because the speed of light in fiber accelerates long-distance transmissions.',
      'Because router queue buffers cancel out physical link length.',
    ],
    correctIndex: 1,
    explanation: 'Transmission delay (L/R) depends solely on how fast the network card can serialize bits onto the cable. Physical travel time is propagation delay (d/s).',
  },
  {
    id: 2,
    question: 'In DNS resolution, what is the key difference between Recursive and Iterative modes?',
    options: [
      'Iterative mode uses TCP, whereas Recursive mode uses UDP.',
      'In Recursive mode, the Local Resolver takes full responsibility for querying Root, TLD, and Authoritative servers on the client’s behalf. In Iterative mode, the client itself follows each referral step-by-step.',
      'Recursive mode only checks the L1 browser cache, while Iterative checks the OS cache.',
      'Iterative mode is used only for IPv6 AAAA records.',
    ],
    correctIndex: 1,
    explanation: 'Recursive queries (RD=1) ask the resolver to "resolve completely or fail". In iterative queries, each contacted nameserver returns a referral to the next server in the hierarchy.',
  },
  {
    id: 3,
    question: 'What occurs when traffic intensity I = (L · a) / R exceeds 1.0 at a router output port?',
    options: [
      'The transmission rate R automatically doubles to handle the load.',
      'Packets arrive faster than the link can push them out, causing the queue buffer to overflow and packet loss (drops) to occur.',
      'Propagation delay drops to zero.',
      'The router switches from UDP to TLS encryption.',
    ],
    correctIndex: 1,
    explanation: 'When arrival rate exceeds service capacity (I > 1.0), the queue buffer fills up indefinitely until full capacity is reached, leading to packet drops.',
  },
  {
    id: 4,
    question: 'What does the AA (Authoritative Answer) bit in a DNS header signify?',
    options: [
      'The response came from the official name server that owns the zone file, rather than a cached intermediate copy.',
      'The query was sent using Anycast routing.',
      'The record has expired from all local caches.',
      'The response is truncated and requires TCP fallback.',
    ],
    correctIndex: 0,
    explanation: 'AA=1 indicates the responding server is authoritative for the queried domain zone, ensuring the data is official and freshly verified.',
  },
];

export const ScenarioDrawer: React.FC<ScenarioDrawerProps> = ({
  onSelectScenario,
  activeScenarioId,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'scenarios' | 'quiz'>('scenarios');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const getScenarioIcon = (id: string) => {
    switch (id) {
      case 'cold_lookup':
        return <Globe className="w-4 h-4 text-sky-400" />;
      case 'browser_hit':
        return <Layers className="w-4 h-4 text-emerald-400" />;
      case 'os_hit':
        return <Database className="w-4 h-4 text-indigo-400" />;
      case 'resolver_hit':
        return <Server className="w-4 h-4 text-amber-400" />;
      case 'cname_alias':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'nxdomain_negative':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'doh_handshake':
        return <Lock className="w-4 h-4 text-emerald-400" />;
      case 'satellite_link':
        return <Radio className="w-4 h-4 text-sky-400" />;
      default:
        return <Zap className="w-4 h-4 text-sky-400" />;
    }
  };

  const handleSelectAnswer = (qId: number, optIdx: number) => {
    if (showResults) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const score = QUIZ_QUESTIONS.filter(
    (q) => selectedAnswers[q.id] === q.correctIndex
  ).length;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-y-auto">
      {/* Top Header & Sub-tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span>Computer Networks Guided Lab &amp; Knowledge Exam</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Hands-on experiments demonstrating multi-tier DNS cache hits, recursive delegation walks, negative caching, and the four fundamental network delays.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveSubTab('scenarios')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'scenarios'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Guided Lab Scenarios ({NETWORK_SCENARIOS.length})
          </button>
          <button
            onClick={() => setActiveSubTab('quiz')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'quiz'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Knowledge Check Quiz
          </button>
        </div>
      </div>

      {/* Tab 1: Guided Scenarios Grid */}
      {activeSubTab === 'scenarios' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {NETWORK_SCENARIOS.map((scenario) => {
            const isActive = activeScenarioId === scenario.id;
            return (
              <div
                key={scenario.id}
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                  isActive
                    ? 'bg-slate-900 border-sky-400/80 ring-2 ring-sky-400/30 shadow-xl shadow-sky-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                        {getScenarioIcon(scenario.id)}
                      </div>
                      <h3 className="text-sm font-bold text-slate-100">
                        {scenario.title}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-sky-400 font-semibold bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/80">
                      {scenario.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    {scenario.description}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 mb-3 space-y-1">
                    <span className="text-amber-400 font-bold block mb-1">
                      Educational Focus:
                    </span>
                    <p className="leading-relaxed">{scenario.educationalFocus}</p>
                  </div>

                  {/* Takeaway Bullets */}
                  <div className="space-y-1 mb-4">
                    {scenario.takeaways.map((point, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  <div className="text-xs font-mono text-slate-400">
                    Target: <span className="text-slate-200 font-bold">{scenario.targetDomain}</span>{' '}
                    <span className="text-sky-400">({scenario.recordType})</span>
                  </div>

                  <button
                    onClick={() => onSelectScenario(scenario)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-sky-500 text-slate-950'
                        : 'bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-slate-200'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Scenario</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Interactive Networking Quiz */}
      {activeSubTab === 'quiz' && (
        <div className="max-w-3xl mx-auto space-y-6 w-full">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                <span>DNS &amp; Network Delay Mastery Quiz</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Test your understanding of DNS hierarchy, RFC 1035 flags, and Kurose &amp; Ross delay equations.
              </p>
            </div>
            {showResults && (
              <div className="text-right">
                <span className="text-xs text-slate-400">Score:</span>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  {score} / {QUIZ_QUESTIONS.length} (
                  {Math.round((score / QUIZ_QUESTIONS.length) * 100)}%)
                </div>
              </div>
            )}
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {QUIZ_QUESTIONS.map((q, idx) => {
              const selectedOpt = selectedAnswers[q.id];
              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-sky-400 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h4 className="text-xs font-semibold text-slate-100 leading-relaxed">
                      {q.question}
                    </h4>
                  </div>

                  <div className="space-y-2 pl-7">
                    {q.options.map((opt, optIdx) => {
                      const isChosen = selectedOpt === optIdx;
                      const isCorrect = q.correctIndex === optIdx;
                      let btnStyle = 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300';

                      if (showResults) {
                        if (isCorrect) {
                          btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-semibold';
                        } else if (isChosen && !isCorrect) {
                          btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-300';
                        }
                      } else if (isChosen) {
                        btnStyle = 'bg-sky-500/20 border-sky-400 text-sky-200 font-semibold';
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={showResults}
                          onClick={() => handleSelectAnswer(q.id, optIdx)}
                          className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${btnStyle}`}
                        >
                          <span className="font-mono text-slate-500 text-[11px] mt-0.5">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          <span className="flex-1 leading-relaxed">{opt}</span>
                          {showResults && isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          )}
                          {showResults && isChosen && !isCorrect && (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {showResults && (
                    <div className="pl-7 pt-2">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                        <strong className="text-sky-300">Explanation: </strong>
                        {q.explanation}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2">
            {!showResults ? (
              <button
                onClick={() => setShowResults(true)}
                disabled={Object.keys(selectedAnswers).length < QUIZ_QUESTIONS.length}
                className="px-5 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md"
              >
                Submit Answers
              </button>
            ) : (
              <button
                onClick={() => {
                  setSelectedAnswers({});
                  setShowResults(false);
                }}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all"
              >
                Retake Quiz
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
