export type TaskCadence = "DAILY" | "WEEKLY" | "MONTHLY";

export const TASK_CADENCE_LABELS: Record<TaskCadence, string> = {
  DAILY: "Quotidienne",
  WEEKLY: "Hebdomadaire",
  MONTHLY: "Mensuelle",
};

function isoWeek(date: Date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

export function currentPeriodKey(cadence: TaskCadence, now = new Date()) {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  if (cadence === "DAILY") return `${y}-${m}-${d}`;
  if (cadence === "MONTHLY") return `${y}-${m}`;
  const week = isoWeek(now);
  return `${week.year}-W${String(week.week).padStart(2, "0")}`;
}

export function periodDisplay(cadence: TaskCadence, periodKey: string) {
  if (cadence === "DAILY") return `Jour ${periodKey}`;
  if (cadence === "WEEKLY") return `Semaine ${periodKey.replace("-W", "-")}`;
  return `Mois ${periodKey}`;
}
