import React, { useState, useEffect } from 'react';
import { getSingleDatePresets, formatDate, stripTime } from '../services/dateUtils';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { RetroButton } from './RetroButton';

interface DatePickerProps {
  date: Date;
  onChange: (date: Date) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({ date, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(date));
  const [tempDate, setTempDate] = useState<Date>(date);
  
  // Calculate today at midnight for comparison
  const today = stripTime(new Date());

  useEffect(() => {
    if (isOpen) {
        setTempDate(new Date(date));
        setViewDate(new Date(date));
    }
  }, [isOpen, date]);

  const presets = getSingleDatePresets();

  const handleDayClick = (day: Date) => {
    // Prevent future dates
    if (day > today) return;
    setTempDate(day);
  };

  const handlePresetClick = (d: Date) => {
    // Presets shouldn't technically generate future dates based on logic, but safe to update
    setTempDate(d);
    setViewDate(new Date(d));
  };

  const handleApply = () => {
    onChange(tempDate);
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
                <button 
                  onClick={() => {
                      // Optional: prevent going to next month if it's completely in the future? 
                      // For now, allowing nav, just disabling days is sufficient.
                      setViewDate(new Date(year, month + 1, 1))
                  }} 
                  className="hover:text-[#8AFF80]"
                >
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
                    const selectedStr = formatDate(tempDate);
                    const isSelected = dStr === selectedStr;
                    const isFuture = d > today;
                    
                    let className = "w-8 h-8 flex items-center justify-center text-sm transition-colors border border-transparent ";
                    
                    if (isFuture) {
                        className += "text-[#708CA9]/20 cursor-not-allowed";
                    } else if (isSelected) {
                        className += "bg-[#8AFF80] text-[#0B0D0F] font-bold border-[#8AFF80] cursor-pointer";
                    } else {
                        className += "text-[#708CA9] hover:border-[#708CA9] cursor-pointer";
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
        {formatDate(date)}
      </RetroButton>

      {isOpen && (
        <>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90]" onClick={() => setIsOpen(false)} />
            <div className={`
                fixed 
                top-[50%] 
                left-[50%] 
                translate-x-[-50%] 
                translate-y-[-50%] 
                w-[90vw] md:w-[600px] 
                max-h-[85vh] 
                bg-[#0B0D0F] border-2 border-[#708CA9] 
                shadow-[8px_8px_0px_0px_rgba(112,140,169,0.5)] 
                z-[100] flex flex-col md:flex-row
            `}>
                
                {/* Sidebar - Presets */}
                <div className="w-full md:w-1/3 border-b-2 md:border-b-0 md:border-r-2 border-[#708CA9] overflow-y-auto max-h-[150px] md:max-h-none p-2 bg-[#0B0D0F]">
                    <div className="sticky top-0 bg-[#0B0D0F] pb-2 text-[#8AFF80] text-xs uppercase font-bold border-b border-[#708CA9]/30 mb-2 pt-1">
                        Quick Select
                    </div>
                    {Object.entries(presets).map(([category, items]) => (
                        <div key={category} className="mb-4">
                            {items.map(p => (
                                <button
                                    key={p.label}
                                    onClick={() => handlePresetClick(p.date)}
                                    className={`
                                        w-full text-left px-2 py-1 text-sm hover:bg-[#708CA9]/20 hover:text-[#8AFF80] transition-colors
                                        ${formatDate(tempDate) === formatDate(p.date) ? 'text-[#8AFF80] font-bold bg-[#708CA9]/10' : 'text-[#708CA9]'}
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
