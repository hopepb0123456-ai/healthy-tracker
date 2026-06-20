import {
  SCHEMA_VERSION,
  mealTemplates,
  workoutTemplates,
  createDefaultState,
  calculateMealTotals,
  progressionAdvice,
  runningStageForWeek,
  currentWeek,
  mergeInBodyRecords,
  validateInBodyImport,
  validateBackup,
  createBackup,
  weeklyCompletion
} from "./core.js";

const STORAGE_KEY = "healthyTracker:v1";
const metricLabels = {
  weightKg: { name: "Weight", unit: "kg" },
  skeletalMuscleKg: { name: "Skeletal Muscle Mass", unit: "kg" },
  bodyFatMassKg: { name: "Body Fat Mass", unit: "kg" },
  bodyFatPercent: { name: "Body Fat", unit: "%" },
  visceralFatLevel: { name: "Visceral Fat Level", unit: "" }
};
const slotLabels = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };

let state = loadState();
let toastTimer;

function localDate(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored?.schemaVersion === SCHEMA_VERSION && stored.settings && Array.isArray(stored.workoutLogs)) return stored;
  } catch (_) {
    // A bad local value must not prevent the app from opening.
  }
  return createDefaultState(localDate());
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function setProgress(selector, value, max) {
  document.querySelector(selector).style.width = `${Math.min(100, Math.max(0, value / max * 100))}%`;
}

function todayMealLog(date = localDate()) {
  return state.mealLogs.find(log => log.date === date) || { date, items: [] };
}

function ensureMealLog(date) {
  let log = state.mealLogs.find(item => item.date === date);
  if (!log) {
    log = { date, items: [] };
    state.mealLogs.push(log);
  }
  return log;
}

function renderToday() {
  const completion = weeklyCompletion(state.workoutLogs);
  const totals = calculateMealTotals(todayMealLog().items);
  const nextKey = ["A", "B", "C"][Math.min(2, completion)];
  const next = workoutTemplates[nextKey];

  document.querySelector("#todayWorkoutCount").textContent = `${completion} / 3`;
  document.querySelector("#todayCalories").textContent = `${Math.round(totals.kcal).toLocaleString()} / ${state.settings.calorieTarget.toLocaleString()}`;
  document.querySelector("#todayProtein").textContent = `${Math.round(totals.protein)} / ${state.settings.proteinMin}–${state.settings.proteinMax} g`;
  document.querySelector("#nextWorkoutName").textContent = next.name;
  document.querySelector("#nextWorkoutDetail").textContent = next.run ? "Machines 25 นาที + Walk–run 10 นาที" : "Machine strength 35 นาที";
  setProgress("#workoutProgress", completion, 3);
  setProgress("#calorieProgress", totals.kcal, state.settings.calorieTarget);
  setProgress("#proteinProgress", totals.protein, state.settings.proteinMin);
}

function latestExerciseLog(exerciseName) {
  const ordered = [...state.workoutLogs].sort((a, b) => b.date.localeCompare(a.date));
  for (const log of ordered) {
    const exercise = log.exercises.find(item => item.name === exerciseName);
    if (exercise) return exercise;
  }
  return null;
}

function renderWorkoutForm() {
  const key = document.querySelector("#workoutTemplate").value;
  const template = workoutTemplates[key];
  const list = document.querySelector("#exerciseList");
  list.replaceChildren();

  template.exercises.forEach((name, index) => {
    const latest = latestExerciseLog(name);
    const advice = latest ? progressionAdvice(latest) : { status: "hold", label: "เริ่มเบา ๆ ให้เหลือแรงประมาณ 3 reps" };
    const card = document.createElement("article");
    card.className = "exercise-card";
    card.dataset.exercise = name;
    card.innerHTML = `
      <header>
        <div><h3>${name}</h3><p>2 working sets · 8–12 reps · RPE 6–7</p></div>
        <span class="week-badge">${index + 1}/${template.exercises.length}</span>
      </header>
      <div class="exercise-fields">
        <label>Weight (kg)<input data-field="weightKg" type="number" min="0" step="0.5" inputmode="decimal" value="${latest?.weightKg ?? ""}" required></label>
        <label>Set 1 reps<input data-field="reps1" type="number" min="1" max="30" inputmode="numeric" required></label>
        <label>Set 2 reps<input data-field="reps2" type="number" min="1" max="30" inputmode="numeric" required></label>
        <label>RPE<input data-field="rpe" type="number" min="1" max="10" step="0.5" inputmode="decimal" required></label>
      </div>
      <label class="check-row"><input data-field="pain" type="checkbox"> มีอาการเจ็บผิดปกติในท่านี้</label>
      <p class="advice ${advice.status}">${advice.label}</p>`;
    list.append(card);
  });

  const week = currentWeek(state.settings.startDate);
  const run = runningStageForWeek(week);
  document.querySelector("#runCard").hidden = !template.run;
  document.querySelector("#runStageTitle").textContent = `Stage ${run.stage} · Week ${week}`;
  document.querySelector("#runStageDetail").textContent = `Jog ${run.runSeconds} วินาที / Walk ${run.walkSeconds} วินาที สลับจนครบ 10 นาที ไม่ไล่ pace`;
}

function renderWorkoutHistory() {
  const history = document.querySelector("#workoutHistory");
  history.replaceChildren();
  [...state.workoutLogs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).forEach(log => {
    const item = document.createElement("article");
    item.className = "history-item";
    const copy = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = workoutTemplates[log.template]?.name || `Workout ${log.template}`;
    const detail = document.createElement("p");
    detail.textContent = `${log.date} · ${log.exercises.length} machines${log.run?.completed ? " · Run complete" : ""}`;
    copy.append(title, detail);
    item.append(copy);
    history.append(item);
  });
}

function renderMeals() {
  const date = document.querySelector("#foodDate").value || localDate();
  const log = todayMealLog(date);
  const container = document.querySelector("#mealSlots");
  container.replaceChildren();

  Object.entries(slotLabels).forEach(([slot, label]) => {
    const section = document.createElement("article");
    section.className = "meal-slot";
    const options = mealTemplates.filter(meal => meal.slot === slot)
      .map(meal => `<option value="${meal.id}">${meal.name} · ${meal.kcal} kcal · P ${meal.protein}g</option>`).join("");
    section.innerHTML = `<header><h3>${label}</h3><span class="week-badge">${log.items.filter(item => item.slot === slot).length} รายการ</span></header>
      <div class="meal-picker"><select aria-label="เลือก ${label}">${options}</select><button class="secondary" type="button">เพิ่ม</button></div>`;
    const select = section.querySelector("select");
    section.querySelector("button").addEventListener("click", () => addMealTemplate(date, select.value));

    log.items.filter(item => item.slot === slot).forEach(item => {
      const row = document.createElement("div");
      row.className = "logged-meal";
      const text = document.createElement("div");
      const name = document.createElement("p");
      name.textContent = item.name;
      const values = document.createElement("small");
      values.textContent = `${item.kcal} kcal · Protein ${item.protein}g`;
      text.append(name, values);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "icon-button";
      remove.setAttribute("aria-label", `ลบ ${item.name}`);
      remove.textContent = "ลบ";
      remove.addEventListener("click", () => removeMeal(date, item.id));
      row.append(text, remove);
      section.append(row);
    });
    container.append(section);
  });

  const totals = calculateMealTotals(log.items);
  document.querySelector("#foodCalories").textContent = Math.round(totals.kcal).toLocaleString();
  document.querySelector("#foodProtein").textContent = `${Math.round(totals.protein)} g`;
  document.querySelector("#calorieTargetLabel").textContent = state.settings.calorieTarget.toLocaleString();
}

function addMealTemplate(date, templateId) {
  const template = mealTemplates.find(item => item.id === templateId);
  if (!template) return;
  ensureMealLog(date).items.push({ ...template, id: crypto.randomUUID(), templateId: template.id });
  saveState();
  showToast("เพิ่มมื้ออาหารแล้ว");
}

function removeMeal(date, id) {
  const log = ensureMealLog(date);
  log.items = log.items.filter(item => item.id !== id);
  saveState();
}

function renderProgress() {
  const records = [...state.inBodyRecords].sort((a, b) => a.date.localeCompare(b.date));
  const metric = document.querySelector("#metricSelect").value;
  const meta = metricLabels[metric];
  document.querySelector("#chartTitle").textContent = meta.name;
  document.querySelector("#chartEmpty").hidden = records.length > 0;
  document.querySelector("#progressChart").hidden = records.length === 0;

  if (records.length) drawChart(records, metric, meta.unit);

  const latest = records.at(-1);
  const cards = document.querySelector("#inBodyCards");
  cards.replaceChildren();
  if (latest) {
    Object.entries(metricLabels).forEach(([key, label]) => {
      const card = document.createElement("article");
      card.className = "metric-card";
      const name = document.createElement("span");
      name.textContent = label.name;
      const value = document.createElement("strong");
      value.textContent = `${latest[key]}${label.unit ? ` ${label.unit}` : ""}`;
      card.append(name, value);
      cards.append(card);
    });
  }
}

function drawChart(records, metric, unit) {
  const svg = document.querySelector("#progressChart");
  const width = 600;
  const height = 240;
  const pad = { x: 38, y: 28 };
  const values = records.map(record => Number(record[metric]));
  const low = Math.min(...values);
  const high = Math.max(...values);
  const spread = high - low || 1;
  const x = index => pad.x + index * ((width - pad.x * 2) / Math.max(1, records.length - 1));
  const y = value => height - pad.y - ((value - low) / spread) * (height - pad.y * 2);
  const points = values.map((value, index) => `${x(index)},${y(value)}`).join(" ");
  const areaPoints = `${pad.x},${height - pad.y} ${points} ${x(records.length - 1)},${height - pad.y}`;
  svg.innerHTML = `
    <line class="chart-axis" x1="${pad.x}" y1="${height - pad.y}" x2="${width - pad.x}" y2="${height - pad.y}" />
    <polygon class="chart-area" points="${areaPoints}" />
    <polyline class="chart-line" points="${points}" />
    ${values.map((value, index) => `<circle class="chart-dot" cx="${x(index)}" cy="${y(value)}" r="6"><title>${records[index].date}: ${value}${unit}</title></circle>`).join("")}
    <text class="chart-label" x="${pad.x}" y="${height - 4}">${records[0].date.slice(2)}</text>
    <text class="chart-label" text-anchor="end" x="${width - pad.x}" y="${height - 4}">${records.at(-1).date.slice(2)}</text>`;

  const change = values.at(-1) - values[0];
  document.querySelector("#chartStats").innerHTML = `<span>Latest: <strong>${values.at(-1)}${unit}</strong></span><span>Change: <strong>${change > 0 ? "+" : ""}${change.toFixed(1)}${unit}</strong></span>`;
}

function renderSettings() {
  document.querySelector("#startDate").value = state.settings.startDate;
  document.querySelector("#calorieTarget").value = state.settings.calorieTarget;
  document.querySelector("#proteinMin").value = state.settings.proteinMin;
  document.querySelector("#proteinMax").value = state.settings.proteinMax;
}

function renderAll() {
  const week = currentWeek(state.settings.startDate);
  document.querySelector("#weekBadge").textContent = `Week ${week} / 12`;
  renderToday();
  renderWorkoutForm();
  renderWorkoutHistory();
  renderMeals();
  renderProgress();
  renderSettings();
}

function showView(viewId) {
  document.querySelectorAll(".view").forEach(view => view.classList.toggle("active", view.id === viewId));
  document.querySelectorAll(".bottom-nav button").forEach(button => button.classList.toggle("active", button.dataset.view === viewId));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function readJsonFile(file) {
  return JSON.parse(await file.text());
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

document.querySelectorAll(".bottom-nav button").forEach(button => button.addEventListener("click", () => showView(button.dataset.view)));
document.querySelectorAll("[data-go]").forEach(button => button.addEventListener("click", () => showView(button.dataset.go)));

document.querySelector("#workoutTemplate").addEventListener("change", renderWorkoutForm);
document.querySelector("#foodDate").addEventListener("change", renderMeals);
document.querySelector("#metricSelect").addEventListener("change", renderProgress);

document.querySelector("#workoutForm").addEventListener("submit", event => {
  event.preventDefault();
  const template = document.querySelector("#workoutTemplate").value;
  const exercises = [...document.querySelectorAll(".exercise-card")].map(card => ({
    name: card.dataset.exercise,
    weightKg: Number(card.querySelector('[data-field="weightKg"]').value),
    reps1: Number(card.querySelector('[data-field="reps1"]').value),
    reps2: Number(card.querySelector('[data-field="reps2"]').value),
    rpe: Number(card.querySelector('[data-field="rpe"]').value),
    pain: card.querySelector('[data-field="pain"]').checked
  }));
  state.workoutLogs.push({
    id: crypto.randomUUID(),
    date: document.querySelector("#workoutDate").value,
    template,
    exercises,
    run: workoutTemplates[template].run ? { ...runningStageForWeek(currentWeek(state.settings.startDate)), completed: document.querySelector("#runCompleted").checked } : null
  });
  saveState();
  event.target.reset();
  document.querySelector("#workoutDate").value = localDate();
  showToast("บันทึก Workout แล้ว—ดีพอที่จะทำต่อ");
});

document.querySelector("#customMealForm").addEventListener("submit", event => {
  event.preventDefault();
  const date = document.querySelector("#foodDate").value;
  ensureMealLog(date).items.push({
    id: crypto.randomUUID(),
    slot: document.querySelector("#customMealSlot").value,
    name: document.querySelector("#customMealName").value.trim(),
    kcal: Number(document.querySelector("#customMealKcal").value),
    protein: Number(document.querySelector("#customMealProtein").value),
    custom: true
  });
  saveState();
  event.target.reset();
  showToast("เพิ่ม Custom meal แล้ว");
});

document.querySelector("#weightForm").addEventListener("submit", event => {
  event.preventDefault();
  const date = document.querySelector("#weightDate").value;
  const value = Number(document.querySelector("#weightValue").value);
  state.weightLogs = state.weightLogs.filter(log => log.date !== date);
  state.weightLogs.push({ date, weightKg: value });
  state.weightLogs.sort((a, b) => a.date.localeCompare(b.date));
  saveState();
  event.target.reset();
  document.querySelector("#weightDate").value = localDate();
  showToast("บันทึก Weight แล้ว ดูแนวโน้ม ไม่ตัดสินวันเดียว");
});

document.querySelector("#settingsForm").addEventListener("submit", event => {
  event.preventDefault();
  const min = Number(document.querySelector("#proteinMin").value);
  const max = Number(document.querySelector("#proteinMax").value);
  if (max < min) {
    showToast("Protein maximum ต้องไม่น้อยกว่า minimum");
    return;
  }
  state.settings = {
    ...state.settings,
    startDate: document.querySelector("#startDate").value,
    calorieTarget: Number(document.querySelector("#calorieTarget").value),
    proteinMin: min,
    proteinMax: max
  };
  saveState();
  showToast("บันทึก Settings แล้ว");
});

document.querySelector("#exportBackup").addEventListener("click", () => {
  downloadJson(`healthy-tracker-backup-${localDate()}.json`, createBackup(state));
  showToast("Export backup แล้ว");
});

document.querySelector("#importBackup").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const backup = await readJsonFile(file);
    if (!validateBackup(backup)) throw new Error("invalid");
    if (!window.confirm("Restore จะเขียนทับข้อมูลทั้งหมดในเครื่องนี้ ต้องการดำเนินการต่อหรือไม่?")) return;
    state = backup.appState;
    saveState();
    showToast("Restore backup สำเร็จ");
  } catch (_) {
    showToast("ไฟล์ Backup ไม่ถูกต้อง ข้อมูลเดิมยังอยู่ครบ");
  } finally {
    event.target.value = "";
  }
});

document.querySelector("#importInBody").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;
  const status = document.querySelector("#inBodyImportStatus");
  try {
    const data = await readJsonFile(file);
    if (!validateInBodyImport(data)) throw new Error("invalid");
    const before = state.inBodyRecords.length;
    state.inBodyRecords = mergeInBodyRecords(state.inBodyRecords, data.records);
    saveState();
    status.textContent = `Import สำเร็จ ${data.records.length} records · รวม ${state.inBodyRecords.length} records`;
    showToast(state.inBodyRecords.length === before ? "ข้อมูล InBody เป็นปัจจุบันแล้ว" : "Import InBody สำเร็จ");
  } catch (_) {
    status.textContent = "ไฟล์ InBody ไม่ถูกต้อง ข้อมูลเดิมไม่ถูกเปลี่ยน";
  } finally {
    event.target.value = "";
  }
});

document.querySelector("#safetyForm").addEventListener("submit", () => {
  state.settings.safetyAcknowledged = true;
  saveState();
});

document.querySelector("#workoutDate").value = localDate();
document.querySelector("#foodDate").value = localDate();
document.querySelector("#weightDate").value = localDate();
renderAll();

if (!state.settings.safetyAcknowledged) document.querySelector("#safetyDialog").showModal();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
