export const SCHEMA_VERSION = 1;

export const mealTemplates = [
  { id: "breakfast-eggs", slot: "breakfast", name: "ไข่ 2 ฟอง + ขนมปังโฮลวีต + นม", kcal: 430, protein: 30, portion: "ไข่ 2 ฟอง, ขนมปัง 2 แผ่น, นมจืดไขมันต่ำ 1 กล่อง" },
  { id: "breakfast-porridge", slot: "breakfast", name: "โจ๊กไก่เพิ่มไข่", kcal: 450, protein: 32, portion: "โจ๊กไก่ 1 ชาม, เพิ่มเนื้อไก่และไข่ 1 ฟอง" },
  { id: "breakfast-yogurt", slot: "breakfast", name: "Greek yogurt + กล้วย + Whey", kcal: 410, protein: 38, portion: "Greek yogurt 200 g, กล้วย 1 ผล, Whey 1 scoop" },
  { id: "breakfast-tuna", slot: "breakfast", name: "แซนด์วิชทูน่า + นม", kcal: 440, protein: 34, portion: "ขนมปังโฮลวีต 2 แผ่น, ทูน่าในน้ำแร่ 1 กระป๋อง, นม 1 กล่อง" },

  { id: "lunch-chicken-rice", slot: "lunch", name: "ข้าวไก่ย่าง + ผัก", kcal: 590, protein: 45, portion: "ข้าว 2 ทัพพี, ไก่ย่างไม่ติดหนัง 180 g, ผัก 2 กำมือ" },
  { id: "lunch-suki", slot: "lunch", name: "สุกี้น้ำเพิ่มเนื้อ", kcal: 540, protein: 42, portion: "สุกี้น้ำ 1 ชาม, เพิ่มไก่/ทะเล, น้ำจิ้มแยก" },
  { id: "lunch-basil", slot: "lunch", name: "กะเพราอกไก่ + ไข่ต้ม", kcal: 620, protein: 47, portion: "ข้าว 2 ทัพพี, กะเพราอกไก่, ไข่ต้ม 1 ฟอง, ขอใช้น้ำมันน้อย" },
  { id: "lunch-somtam", slot: "lunch", name: "ส้มตำ + ไก่ย่าง + ข้าว", kcal: 580, protein: 44, portion: "ส้มตำหวานน้อย, ไก่ย่างไม่ติดหนัง, ข้าว 1.5–2 ทัพพี" },

  { id: "dinner-fish", slot: "dinner", name: "ปลาย่าง + ข้าว + ผัก", kcal: 610, protein: 48, portion: "ปลา 180–200 g, ข้าว 2 ทัพพี, ผัก 2 กำมือ" },
  { id: "dinner-soup", slot: "dinner", name: "แกงจืดเต้าหู้หมูสับ + ข้าว", kcal: 570, protein: 40, portion: "แกงจืดชามใหญ่, ข้าว 2 ทัพพี, เพิ่มไข่ต้ม 1 ฟอง" },
  { id: "dinner-stirfry", slot: "dinner", name: "ไก่ผัดผัก + ข้าว", kcal: 620, protein: 46, portion: "ไก่ 180 g, ผัก 2 กำมือ, ข้าว 2 ทัพพี, น้ำมันน้อย" },
  { id: "dinner-convenience", slot: "dinner", name: "ชุดร้านสะดวกซื้อ Protein สูง", kcal: 600, protein: 50, portion: "อกไก่ 2 ชิ้น, ไข่ 2 ฟอง, สลัด, ข้าว 1 ถ้วย" },

  { id: "snack-whey", slot: "snack", name: "Whey + กล้วย", kcal: 250, protein: 27, portion: "Whey 1 scoop, กล้วย 1 ผล" },
  { id: "snack-yogurt", slot: "snack", name: "Greek yogurt", kcal: 220, protein: 20, portion: "Greek yogurt 200 g, ผลไม้เล็กน้อย" },
  { id: "snack-milk-eggs", slot: "snack", name: "นม + ไข่ต้ม", kcal: 260, protein: 22, portion: "นม High Protein 1 กล่อง, ไข่ต้ม 1 ฟอง" },
  { id: "snack-soy", slot: "snack", name: "นมถั่วเหลือง + ถั่วแระ", kcal: 280, protein: 21, portion: "นมถั่วเหลืองไม่หวาน 1 กล่อง, ถั่วแระ 1 ถ้วยเล็ก" }
];

export const workoutTemplates = {
  A: {
    name: "Workout A · Hybrid",
    duration: 35,
    run: true,
    exercises: ["Leg Press", "Chest Press", "Lat Pulldown", "Seated Leg Curl"]
  },
  B: {
    name: "Workout B · Strength",
    duration: 35,
    run: false,
    exercises: ["Leg Press", "Chest Press", "Seated Row", "Shoulder Press", "Leg Curl"]
  },
  C: {
    name: "Workout C · Hybrid",
    duration: 35,
    run: true,
    exercises: ["Leg Press", "Chest Press", "Seated Row", "Leg Extension"]
  }
};

export function createDefaultState(today = new Date().toISOString().slice(0, 10)) {
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: {
      startDate: today,
      calorieTarget: 2000,
      proteinMin: 120,
      proteinMax: 150,
      safetyAcknowledged: false
    },
    workoutLogs: [],
    mealLogs: [],
    weightLogs: [],
    inBodyRecords: []
  };
}

export function calculateMealTotals(items = []) {
  return items.reduce((total, item) => ({
    kcal: total.kcal + Number(item.kcal || 0),
    protein: total.protein + Number(item.protein || 0)
  }), { kcal: 0, protein: 0 });
}

export function progressionAdvice({ reps1, reps2, rpe, pain = false } = {}) {
  const reps = [Number(reps1), Number(reps2)];
  const effort = Number(rpe);
  if (pain) return { status: "stop", label: "หยุดท่านี้และประเมินอาการก่อนฝึกต่อ" };
  if (effort >= 9) return { status: "reduce", label: "ครั้งหน้าลดน้ำหนักหนึ่งระดับหรือพักเพิ่ม" };
  if (reps.every(value => value >= 12) && effort <= 7) {
    return { status: "increase", label: "พร้อมเพิ่มน้ำหนักหนึ่งระดับของเครื่อง" };
  }
  return { status: "hold", label: "คงน้ำหนักเดิมและสะสม reps ด้วยฟอร์มที่ดี" };
}

export function runningStageForWeek(week) {
  const stages = [
    { runSeconds: 30, walkSeconds: 90 },
    { runSeconds: 45, walkSeconds: 75 },
    { runSeconds: 60, walkSeconds: 60 },
    { runSeconds: 90, walkSeconds: 60 },
    { runSeconds: 120, walkSeconds: 60 },
    { runSeconds: 180, walkSeconds: 60 }
  ];
  const stage = Math.min(5, Math.max(0, Math.floor((Number(week) - 1) / 2)));
  return { ...stages[stage], totalMinutes: 10, stage: stage + 1 };
}

export function currentWeek(startDate, now = new Date()) {
  const start = new Date(`${startDate}T00:00:00`);
  const elapsed = Math.max(0, now.getTime() - start.getTime());
  return Math.min(12, Math.floor(elapsed / 604800000) + 1);
}

export function mergeInBodyRecords(existing = [], incoming = []) {
  const byDate = new Map(existing.map(record => [record.date, record]));
  incoming.forEach(record => byDate.set(record.date, record));
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function validateInBodyImport(data) {
  if (!data || data.schemaVersion !== SCHEMA_VERSION || data.type !== "healthy-tracker-inbody" || !Array.isArray(data.records)) return false;
  return data.records.every(record => {
    const numbers = [record.weightKg, record.skeletalMuscleKg, record.bodyFatMassKg, record.bodyFatPercent, record.visceralFatLevel];
    return /^\d{4}-\d{2}-\d{2}$/.test(record.date) && numbers.every(value => Number.isFinite(Number(value)));
  });
}

export function validateBackup(data) {
  if (!data || data.schemaVersion !== SCHEMA_VERSION || !data.appState) return false;
  const state = data.appState;
  return state.schemaVersion === SCHEMA_VERSION
    && state.settings && typeof state.settings === "object"
    && [state.workoutLogs, state.mealLogs, state.weightLogs, state.inBodyRecords].every(Array.isArray);
}

export function createBackup(state, exportedAt = new Date().toISOString()) {
  return { schemaVersion: SCHEMA_VERSION, exportedAt, appState: state };
}

export function weeklyCompletion(workoutLogs, now = new Date()) {
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() + mondayOffset);
  return workoutLogs.filter(log => new Date(`${log.date}T00:00:00`) >= monday).length;
}
