import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AltArrowDown, AltArrowUp, ClockCircle } from "@solar-icons/react";

interface ModernTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const pad = (v: number | string) => String(v).padStart(2, "0");
const to24 = (h12: number, period: "AM" | "PM") =>
  period === "PM" ? (h12 === 12 ? 12 : h12 + 12) : h12 === 12 ? 0 : h12;

export function ModernTimePicker({
  value,
  onChange,
  className = "",
}: ModernTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState("09");
  const [minutes, setMinutes] = useState("00");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");
  const ref = useRef<HTMLDivElement | null>(null);

  const parse = useCallback((v: string) => {
    if (!v) return;
    const m = v.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
    if (m) {
      const hh = parseInt(m[1], 10);
      const mm = m[2];
      const cap = m[3]?.toUpperCase() as "AM" | "PM" | undefined;
      const periodFrom24 = cap ?? (hh >= 12 ? "PM" : "AM");
      const displayHour = cap
        ? hh === 0
          ? 12
          : hh > 12
          ? hh - 12
          : hh
        : hh === 0
        ? 12
        : hh > 12
        ? hh - 12
        : hh;
      setHours(pad(displayHour));
      setMinutes(mm);
      setPeriod(periodFrom24);
    } else {
      const parts = v.split(":");
      if (parts.length === 2) {
        const hh = parseInt(parts[0], 10);
        setHours(pad(hh === 0 ? 12 : hh > 12 ? hh - 12 : hh));
        setMinutes(pad(parts[1].slice(0, 2)));
        setPeriod(hh >= 12 ? "PM" : "AM");
      }
    }
  }, []);

  useEffect(() => parse(value), [value, parse]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const emit = (h12: string, m: string, p: "AM" | "PM") =>
    onChange(`${pad(to24(parseInt(h12, 10), p))}:${m}`);

  const changeHour = (delta: number) => {
    const next = (((parseInt(hours, 10) - 1 + delta) % 12) + 12) % 12 + 1;
    const nh = pad(next);
    setHours(nh);
    emit(nh, minutes, period);
  };

  const changeMinute = (delta: number) => {
    const next = (parseInt(minutes, 10) + delta + 60) % 60;
    const nm = pad(next);
    setMinutes(nm);
    emit(hours, nm, period);
  };

  const togglePeriod = () => {
    const np = period === "AM" ? "PM" : "AM";
    setPeriod(np);
    emit(hours, minutes, np);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((s) => !s)}
        className="flex items-center justify-between w-full px-4 py-2.5 bg-secondary border border-border rounded-lg hover:border-primary/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <div className="flex items-center gap-2">
          <ClockCircle weight="LineDuotone" className="w-5 h-5 text-muted-foreground" />
          <span className="font-medium text-sm">
            {hours}:{minutes} {period}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 left-0 right-0 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-center gap-3">
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => changeHour(1)}
                    className="p-2 hover:bg-secondary rounded-md"
                  >
                    <AltArrowUp weight="LineDuotone" className="h-5 w-5 text-foreground" />
                  </button>
                  <div className="w-20 h-16 flex items-center justify-center bg-primary/10 border border-primary/20 rounded-xl">
                    <span className="text-3xl font-bold text-primary tabular-nums">
                      {hours}
                    </span>
                  </div>
                  <button
                    onClick={() => changeHour(-1)}
                    className="p-2 hover:bg-secondary rounded-md"
                  >
                    <AltArrowDown weight="LineDuotone" className="h-5 w-5 text-foreground" />
                  </button>
                  <span className="text-xs text-muted-foreground mt-1">
                    Hours
                  </span>
                </div>

                <div className="flex items-center h-16 mt-11">
                  <span className="text-3xl font-bold text-muted-foreground">:</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => changeMinute(5)}
                    className="p-2 hover:bg-secondary rounded-md"
                  >
                    <AltArrowUp weight="LineDuotone" className="h-5 w-5 text-foreground" />
                  </button>
                  <div className="w-20 h-16 flex items-center justify-center bg-primary/10 border border-primary/20 rounded-xl">
                    <span className="text-3xl font-bold text-primary tabular-nums">
                      {minutes}
                    </span>
                  </div>
                  <button
                    onClick={() => changeMinute(-5)}
                    className="p-2 hover:bg-secondary rounded-md"
                  >
                    <AltArrowDown weight="LineDuotone" className="h-5 w-5 text-foreground" />
                  </button>
                  <span className="text-xs text-muted-foreground mt-1">
                    Minutes
                  </span>
                </div>

                <div className="flex flex-col items-center gap-2 ml-2">
                  <button
                    onClick={togglePeriod}
                    className="w-20 h-16 flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-xl transition-all active:scale-95 shadow-lg mt-11"
                  >
                    {period}
                  </button>
                  <span className="text-xs text-muted-foreground mt-1">
                    Period
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}