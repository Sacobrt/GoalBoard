import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { Calendar } from "../../../components/ui/calendar";

/**
 * Date + time picker. Returns a full Date object (with time) via onSelect.
 * Uses react-day-picker dropdown caption for month/year navigation.
 */
export function DateTimePicker({ selected, onSelect }) {
    const [time, setTime] = useState("00:00");

    // Keep time input in sync when selected changes externally
    useEffect(() => {
        if (selected) setTime(format(selected, "HH:mm"));
    }, [selected]);

    function handleDaySelect(day) {
        if (!day) {
            onSelect(null);
            return;
        }
        const [h, m] = time.split(":").map(Number);
        const d = new Date(day);
        d.setHours(h, m, 0, 0);
        onSelect(d);
    }

    function handleTimeChange(e) {
        const val = e.target.value;
        setTime(val);
        if (selected) {
            const [h, m] = val.split(":").map(Number);
            const d = new Date(selected);
            d.setHours(h, m, 0, 0);
            onSelect(d);
        }
    }

    return (
        <div>
            <Calendar mode="single" selected={selected ?? undefined} onSelect={handleDaySelect} captionLayout="dropdown" fromYear={2020} toYear={2035} />
            <div className="border-t border-slate-100 px-3 py-2.5 flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-xs font-medium text-slate-500">Time</span>
                <input
                    type="time"
                    value={time}
                    onChange={handleTimeChange}
                    className="flex-1 border border-slate-200 rounded-md px-2 py-1 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400"
                />
            </div>
        </div>
    );
}
