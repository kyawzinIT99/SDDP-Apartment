"use client";

import { useEffect, useState } from "react";

function digits(value: string, size: number) {
  return value.replace(/\D/g, "").slice(0, size);
}

function fromIso(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return { year: "", month: "", day: "" };
  return { year: match[1], month: match[2], day: match[3] };
}

export function toIsoDate(day: string, month: string, year: string) {
  if (year.length !== 4 || !day || !month) return "";
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return "";
  return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function TypedDateField({
  name,
  value = "",
  onChange,
}: {
  name?: string;
  value?: string;
  onChange?: (iso: string) => void;
}) {
  const initial = fromIso(value);
  const [day, setDay] = useState(initial.day);
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);

  useEffect(() => {
    if (!value) {
      setDay("");
      setMonth("");
      setYear("");
      return;
    }
    const next = fromIso(value);
    setDay(next.day);
    setMonth(next.month);
    setYear(next.year);
  }, [value]);

  function update(nextDay: string, nextMonth: string, nextYear: string) {
    setDay(nextDay);
    setMonth(nextMonth);
    setYear(nextYear);
    const iso = toIsoDate(nextDay, nextMonth, nextYear);
    if (iso || (!nextDay && !nextMonth && !nextYear)) onChange?.(iso);
  }

  return (
    <div className="date-by-type">
      {name ? <input type="hidden" name={name} value={toIsoDate(day, month, year)} /> : null}
      <input type="text" inputMode="numeric" autoComplete="off" placeholder="DD" maxLength={2} aria-label="Day" value={day} onChange={(event) => update(digits(event.target.value, 2), month, year)} />
      <input type="text" inputMode="numeric" autoComplete="off" placeholder="MM" maxLength={2} aria-label="Month" value={month} onChange={(event) => update(day, digits(event.target.value, 2), year)} />
      <input type="text" inputMode="numeric" autoComplete="off" placeholder="YYYY" maxLength={4} aria-label="Year" value={year} onChange={(event) => update(day, month, digits(event.target.value, 4))} />
    </div>
  );
}
