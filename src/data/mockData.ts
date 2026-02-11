export interface UserProfile {
  id: string;
  name: string;
  startingWeight: number;
  currentWeight: number;
  goalWeight: number;
  goalTimeframeMonths: number;
  startDate: string;
  dailyCalorieTarget: number;
}

export interface DailyLog {
  date: string;
  totalCalories: number;
  protein: number;
  carbs: number;
  fats: number;
  workoutType: string;
  workoutDurationMins: number;
  currentWeight: number;
}

export const mockUser: UserProfile = {
  id: "1",
  name: "Alex",
  startingWeight: 95,
  currentWeight: 82,
  goalWeight: 75,
  goalTimeframeMonths: 36,
  startDate: "2024-01-15",
  dailyCalorieTarget: 2200,
};

const workoutTypes = ["Running", "Weight Training", "Yoga", "Cycling", "Swimming", "HIIT", "Rest"];

function generateLogs(): DailyLog[] {
  const logs: DailyLog[] = [];
  const start = new Date("2024-01-15");
  const today = new Date();
  let weight = 95;

  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    const isRest = dayOfWeek === 0;
    const calories = 1800 + Math.floor(Math.random() * 800);
    weight = Math.max(75, weight - (Math.random() * 0.08 - 0.02));

    logs.push({
      date: d.toISOString().split("T")[0],
      totalCalories: calories,
      protein: 100 + Math.floor(Math.random() * 80),
      carbs: 150 + Math.floor(Math.random() * 120),
      fats: 40 + Math.floor(Math.random() * 40),
      workoutType: isRest ? "Rest" : workoutTypes[Math.floor(Math.random() * 6)],
      workoutDurationMins: isRest ? 0 : 30 + Math.floor(Math.random() * 60),
      currentWeight: Math.round(weight * 10) / 10,
    });
  }
  return logs;
}

export const mockLogs = generateLogs();

export function getTodayLog(): DailyLog {
  const today = new Date().toISOString().split("T")[0];
  return mockLogs.find((l) => l.date === today) || mockLogs[mockLogs.length - 1];
}

export function getRecentLogs(days: number): DailyLog[] {
  return mockLogs.slice(-days);
}

export function getStreak(): number {
  let streak = 0;
  for (let i = mockLogs.length - 1; i >= 0; i--) {
    if (mockLogs[i].workoutType !== "Rest") streak++;
    else break;
  }
  return streak;
}

export function getWeeklyAvg(): { calories: number; protein: number; weight: number } {
  const week = getRecentLogs(7);
  return {
    calories: Math.round(week.reduce((s, l) => s + l.totalCalories, 0) / week.length),
    protein: Math.round(week.reduce((s, l) => s + l.protein, 0) / week.length),
    weight: Math.round((week.reduce((s, l) => s + l.currentWeight, 0) / week.length) * 10) / 10,
  };
}
