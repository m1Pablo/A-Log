import React, { useState, useEffect } from 'react';
import { DateRange } from '../types';
import { getPresets, formatDate, stripTime } from '../services/dateUtils';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { RetroButton } from './RetroButton';

interface DateRangePickerProps {
  range: DateRange;
  onChange: (range: DateRange) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ range, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(range.start));
  const [tempRange, setTempRange] = useState<DateRange>(range);

  // Sync temp range when opening or external change
  useEffect(() => {
    if (isOpen) {
        setTempRange(range);
        setViewDate(new Date(range.start));
    }
  }, [isOpen, range]);

  const presets = getPresets();

  const handleDayClick = (day: Date) => {
    // If we have a start but no end, or if we have both, start new selection
    const startStr = formatDate(tempRange.start);
    const endStr = formatDate(tempRange.end);
    
    // Reset if complete range exists and user clicks (start new range)
    // Or if start > end (shouldn't happen but sanity check)
    if (startStr !== endStr && tempRange.end) {
        setTempRange({ start: day, end: day, label: 'Custom' });
    } else {
        // Completing the range
        if (day < tempRange.start) {
            setTempRange({ start: day, end: tempRange.start, label: 'Custom' });
        } else {
            setTempRange({ ...tempRange, end: day, label: 'Custom' });
        }
    }
  };

  const handlePresetClick = (preset: DateRange) => {
    setTempRange(preset);
    // Immediately jump calendar to the start of the preset
    setViewDate(new Date(preset.start));
  };

  const handleApply = () => {
    onChange(tempRange);
    setIsOpen(false);
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay(); // 0-6
    
    const days: (Date | null)[] = [];
    
    // Pad start
    for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
    }
    
    // Days
    for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push(new Date(year, month, i));
    }

    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4 text-[#708CA9]">
                <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="hover:text-[#8AFF80]">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-bold text-lg">
                    {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="hover:text-[#8AFF80]">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {weekDays.map(d => (
                    <div key={d} className="text-xs text-[#708CA9] opacity-60">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days.map((d, idx) => {
                    if (!d) return <div key={`empty-${idx}`} />;
                    
                    const dStr = formatDate(d);
                    const sStr = formatDate(tempRange.start);
                    const eStr = formatDate(tempRange.end);
                    const isStart = dStr === sStr;
                    const isEnd = dStr === eStr;
                    const isInRange = d >= stripTime(tempRange.start) && d <= stripTime(tempRange.end);
                    
                    let className = "w-8 h-8 flex items-center justify-center text-sm cursor-pointer transition-colors border border-transparent ";
                    
                    if (isStart || isEnd) {
                        className += "bg-[#8AFF80] text-[#0B0D0F] font-bold border-[#8AFF80]";
                    } else if (isInRange) {
                        className += "bg-[#8AFF80]/20 text-[#8AFF80] border-[#8AFF80]/30";
                    } else {
                        className += "text-[#708CA9] hover:border-[#708CA9]";
                    }

                    return (
                        <div key={dStr} onClick={() => handleDayClick(d)} className={className}>
                            {d.getDate()}
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  return (
    <div className="relative z-50">
      <RetroButton 
        onClick={() => setIsOpen(!isOpen)} 
        icon={<CalendarIcon className="w-4 h-4" />}
        className="w-full md:w-auto"
      >
        {range.label || `${formatDate(range.start)} : ${formatDate(range.end)}`}
      </RetroButton>

      {isOpen && (
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setIsOpen(false)} />
            <div className={`
                fixed 
                md:absolute 
                top-[50%] md:top-full 
                left-[50%] md:left-auto md:right-0 
                translate-x-[-50%] md:translate-x-0 
                translate-y-[-50%] md:translate-y-2 
                w-[90vw] md:w-[600px] 
                max-h-[85vh] 
                bg-[#0B0D0F] border-2 border-[#708CA9] 
                shadow-[8px_8px_0px_0px_rgba(112,140,169,0.5)] 
                z-50 flex flex-col md:flex-row
            `}>
                
                {/* Sidebar - Presets */}
                <div className="w-full md:w-1/3 border-b-2 md:border-b-0 md:border-r-2 border-[#708CA9] overflow-y-auto max-h-[150px] md:max-h-none p-2 bg-[#0B0D0F]">
                    <div className="sticky top-0 bg-[#0B0D0F] pb-2 text-[#8AFF80] text-xs uppercase font-bold border-b border-[#708CA9]/30 mb-2 pt-1">
                        Quick Select
                    </div>
                    {Object.entries(presets).map(([category, items]) => (
                        <div key={category} className="mb-4">
                            <div className="text-[#708CA9] text-xs uppercase opacity-70 mb-1 px-2">{category}</div>
                            {items.map(p => (
                                <button
                                    key={p.label}
                                    onClick={() => handlePresetClick(p)}
                                    className={`
                                        w-full text-left px-2 py-1 text-sm hover:bg-[#708CA9]/20 hover:text-[#8AFF80] transition-colors
                                        ${tempRange.label === p.label ? 'text-[#8AFF80] font-bold bg-[#708CA9]/10' : 'text-[#708CA9]'}
                                    `}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Main Calendar Area */}
                <div className="flex-1 flex flex-col">
                    {renderCalendar()}
                    
                    <div className="p-4 border-t-2 border-[#708CA9] flex justify-end gap-2 bg-[#0B0D0F] mt-auto">
                         <span className="mr-auto text-xs text-[#708CA9] self-center hidden sm:inline-block">
                            {formatDate(tempRange.start)} -&gt; {formatDate(tempRange.end)}
                         </span>
                        <RetroButton variant="secondary" onClick={() => setIsOpen(false)} className="text-sm py-1 px-3">
                            CANCEL
                        </RetroButton>
                        <RetroButton onClick={handleApply} className="text-sm py-1 px-3">
                            CONFIRM
                        </RetroButton>
                    </div>
                </div>
            </div>
        </>
      )}
    </div>
  );
};