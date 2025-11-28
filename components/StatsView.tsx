import React, { useMemo, useState, useEffect } from 'react';
import { AppState, DateRange, Granularity } from '../types';
import { aggregateData, getPresets } from '../services/dateUtils';
import { DateRangePicker } from './DateRangePicker';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { RetroButton } from './RetroButton';
import { generateInsights } from '../services/geminiService';
import { Brain, Terminal, Filter, CheckSquare, Square } from 'lucide-react';

interface StatsViewProps {
  state: AppState;
}

export const StatsView: React.FC<StatsViewProps> = ({ state }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Default range: Last 14 days
  const [dateRange, setDateRange] = useState<DateRange>(getPresets().Last[1]); // Index 1 is Last 14 days
  const [granularity, setGranularity] = useState<Granularity>('day');
  
  // Question Filter State
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Initialize selected IDs with all questions when questions load
  useEffect(() => {
    if (state.questions.length > 0 && selectedQuestionIds.length === 0) {
        setSelectedQuestionIds(state.questions.map(q => q.id));
    }
  }, [state.questions.length]);

  const filteredQuestions = useMemo(() => {
    return state.questions.filter(q => selectedQuestionIds.includes(q.id));
  }, [state.questions, selectedQuestionIds]);

  const chartData = useMemo(() => {
    return aggregateData(state.logs, filteredQuestions, dateRange, granularity);
  }, [state.logs, filteredQuestions, dateRange, granularity]);

  const handleGenerateInsight = async () => {
    setLoading(true);
    setError(null);
    setInsight(null);
    try {
      // We pass the filtered questions to the AI as well to keep context relevant
      const filteredState: AppState = {
          ...state,
          questions: filteredQuestions
      };
      const result = await generateInsights(filteredState);
      setInsight(result);
    } catch (err: any) {
      setError(err.message || "Failed to contact AI Core");
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (id: string) => {
    if (selectedQuestionIds.includes(id)) {
        setSelectedQuestionIds(prev => prev.filter(qid => qid !== id));
    } else {
        setSelectedQuestionIds(prev => [...prev, id]);
    }
  };

  const selectAll = () => setSelectedQuestionIds(state.questions.map(q => q.id));
  const clearAll = () => setSelectedQuestionIds([]);

  return (
    <div className="space-y-8">
      <div className="border-b-2 border-[#708CA9] pb-4 mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
        <h2 className="text-3xl uppercase animate-pulse text-[#708CA9]">>> ANALYTICS</h2>
        
        <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto items-start md:items-center flex-wrap">
          {/* Granularity Toggle */}
          <div className="flex border-2 border-[#708CA9]">
            {(['day', 'week', 'month'] as Granularity[]).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`
                  px-3 py-1 text-sm uppercase font-mono transition-colors
                  ${granularity === g 
                    ? 'bg-[#708CA9] text-[#0B0D0F] font-bold' 
                    : 'bg-[#0B0D0F] text-[#708CA9] hover:text-[#8AFF80]'}
                `}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
             <RetroButton 
                onClick={() => setIsFilterOpen(!isFilterOpen)} 
                icon={<Filter className="w-4 h-4" />}
                className={isFilterOpen ? 'bg-[#708CA9]/10' : ''}
             >
                SOURCES [{selectedQuestionIds.length}]
             </RetroButton>

             {isFilterOpen && (
                 <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsFilterOpen(false)} />
                    <div className="absolute top-full right-0 mt-2 w-72 bg-[#0B0D0F] border-2 border-[#708CA9] shadow-[8px_8px_0px_0px_rgba(112,140,169,0.5)] z-40 flex flex-col max-h-[400px]">
                        <div className="p-2 border-b border-[#708CA9] flex justify-between bg-[#708CA9]/10">
                            <button onClick={selectAll} className="text-xs text-[#8AFF80] hover:underline">ALL</button>
                            <span className="text-xs text-[#708CA9]">FILTER_SOURCES</span>
                            <button onClick={clearAll} className="text-xs text-[#FF80BF] hover:underline">NONE</button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-1">
                            {state.questions.map(q => {
                                const isSelected = selectedQuestionIds.includes(q.id);
                                return (
                                    <div 
                                        key={q.id} 
                                        onClick={() => toggleQuestion(q.id)}
                                        className={`
                                            flex items-center gap-2 px-2 py-2 cursor-pointer transition-colors text-sm border border-transparent
                                            ${isSelected ? 'bg-[#708CA9]/10 text-[#8AFF80] border-[#708CA9]/30' : 'text-[#708CA9] hover:border-[#708CA9]'}
                                        `}
                                    >
                                        {isSelected ? <CheckSquare className="w-4 h-4 shrink-0" /> : <Square className="w-4 h-4 shrink-0" />}
                                        <span className="truncate">{q.text}</span>
                                    </div>
                                )
                            })}
                            {state.questions.length === 0 && (
                                <div className="p-4 text-center text-[#708CA9] text-xs">NO_SOURCES_FOUND</div>
                            )}
                        </div>
                    </div>
                 </>
             )}
          </div>

          <DateRangePicker range={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {/* Chart Section */}
      <div className="border-2 border-[#708CA9] p-4 bg-[#0B0D0F] relative">
        <div className="absolute top-0 left-0 bg-[#708CA9] text-[#0B0D0F] px-2 text-sm font-bold flex items-center gap-2">
           <Filter className="w-3 h-3" />
           DATA_VISUALIZATION [{granularity.toUpperCase()}]
        </div>
        <div className="h-80 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={granularity === 'day' ? 20 : 40} margin={{top: 20, right: 30, left: 0, bottom: 5}}>
              <CartesianGrid stroke="#708CA9" strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis 
                dataKey="key" 
                stroke="#708CA9" 
                tick={{fill: '#708CA9', fontFamily: 'Cascadia Code', fontSize: 14}} 
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#708CA9" 
                tick={{fill: '#708CA9', fontFamily: 'Cascadia Code'}}
                allowDecimals={false}
              />
              <Tooltip 
                cursor={{fill: '#708CA9', opacity: 0.1}}
                contentStyle={{ backgroundColor: '#0B0D0F', border: '2px solid #708CA9', color: '#708CA9', borderRadius: 0 }}
                itemStyle={{ color: '#8AFF80' }}
                labelStyle={{ color: '#708CA9', borderBottom: '1px solid #708CA9', marginBottom: '4px' }}
              />
              <Bar dataKey="yes" name="Positive" stackId="a" fill="#8AFF80">
                {chartData.map((entry, index) => (
                    <Cell key={`cell-yes-${index}`} stroke="#0B0D0F" strokeWidth={2} />
                ))}
              </Bar>
              <Bar dataKey="no" name="Negative" stackId="a" fill="#FF80BF">
                {chartData.map((entry, index) => (
                    <Cell key={`cell-no-${index}`} stroke="#0B0D0F" strokeWidth={2} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {chartData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0B0D0F]/80 z-10 text-[#708CA9]">
            NO DATA POINTS FOUND FOR SELECTED RANGE
          </div>
        )}
      </div>

      {/* AI Section */}
      <div className="border-2 border-[#708CA9] p-6 relative bg-[#0B0D0F]">
         <div className="absolute top-0 left-0 bg-[#708CA9] text-[#0B0D0F] px-2 text-sm font-bold flex items-center gap-2">
            <Brain className="w-4 h-4" /> AI_CONSULTANT
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1 min-h-[150px] w-full border-2 border-[#708CA9] border-dashed p-4 font-mono text-lg leading-relaxed text-[#708CA9]">
             {loading ? (
               <div className="flex flex-col items-center justify-center h-full space-y-2 text-[#8AFF80]">
                 <Terminal className="w-8 h-8 animate-spin" />
                 <span className="animate-pulse">PROCESSING DATA STREAMS...</span>
               </div>
             ) : error ? (
                <div className="text-[#FF80BF]">
                  ERROR: {error}
                  <br/>
                  <span className="text-xs text-[#708CA9]">CHECK API KEY CONFIGURATION.</span>
                </div>
             ) : insight ? (
               <div className="whitespace-pre-wrap text-[#8AFF80]">{insight}</div>
             ) : (
               <div className="text-[#708CA9] flex flex-col items-center justify-center h-full">
                 <span>AWAITING INPUT COMMAND.</span>
               </div>
             )}
          </div>
          
          <div className="md:w-48 w-full">
             <RetroButton 
              onClick={handleGenerateInsight} 
              disabled={loading}
              className="w-full"
              variant="primary"
              icon={<Brain className="w-5 h-5" />}
            >
               {loading ? 'COMPUTING...' : 'RUN_ANALYSIS'}
             </RetroButton>
             <p className="text-xs text-[#708CA9] mt-2 text-center">
               REQUIRES ACTIVE UPLINK (API KEY).
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};