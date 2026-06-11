const STORAGE_KEY = '75medium_data';
const SETTINGS_KEY = '75medium_settings';

export type WorkoutTag = 'CrossFit' | 'Running' | 'Hyrox' | 'Strength' | 'Cycling' | 'Swim' | 'Sports' | 'Other';

export const WORKOUT_TAGS: WorkoutTag[] = ['CrossFit', 'Running', 'Hyrox', 'Strength', 'Cycling', 'Swim', 'Sports', 'Other'];

export interface DayLog {
	date: string;
	steps: boolean;
	stepCount: number;
	water: number;
	workout: boolean;
	workoutType: WorkoutTag[];
	noAlcohol: boolean;
	noFriedFood: boolean;
	notes: string;
}

export interface Features {
	calendarShowCompletion: boolean;
}

export interface Settings {
	_v: number;
	name: string;
	startDate: string;
	streakThreshold: number;
	rules: {
		alcohol: {
			path: 'none' | 'biweekly';
			lastDrinkDate: string | null;
		};
	};
	features: Features;
}

const CURRENT_SETTINGS_VERSION = 2;

// append-only — one entry per version bump, never edit existing entries
const migrations: Record<number, (data: any) => any> = {
	1: (data) => ({
		_v: 1,
		name: data.name ?? '',
		startDate: data.startDate ?? getToday(),
		rules: {
			alcohol: {
				path: data.alcoholPath ?? 'none',
				lastDrinkDate: data.lastAlcoholDate ?? null
			}
		},
		features: {
			calendarShowCompletion: false
		}
	}),
	2: (data) => ({ ...data, _v: 2, streakThreshold: 100 })
};

function runMigrations(data: any): Settings {
	const fromVersion = data._v ?? 0;

	return Object.keys(migrations)
		.map(Number)
		.filter(v => v > fromVersion && v <= CURRENT_SETTINGS_VERSION)
		.sort((a, b) => a - b)
		.reduce((state, v) => migrations[v](state), data) as Settings;
}

function getToday(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDayOfWeek(dateStr: string): number {
	return new Date(dateStr + 'T12:00:00').getDay();
}

const DEFAULT_LOG: Omit<DayLog, 'date'> = {
	steps: false,
	stepCount: 0,
	water: 0,
	workout: false,
	workoutType: [],
	noAlcohol: true,
	noFriedFood: true,
	notes: ''
};

const TAG_REMAP: Record<string, WorkoutTag> = {
	Push: 'Strength', Pull: 'Strength', Legs: 'Strength', Core: 'Strength',
	HIIT: 'CrossFit', Cardio: 'Running', Yoga: 'Other', Sport: 'Sports'
};

function remapTag(tag: string): WorkoutTag {
	return TAG_REMAP[tag] ?? (WORKOUT_TAGS.includes(tag as WorkoutTag) ? (tag as WorkoutTag) : 'Other');
}

function migrateLog(raw: any): DayLog {
	return {
		date: raw.date ?? '',
		steps: raw.steps ?? false,
		stepCount: raw.stepCount ?? 0,
		water: raw.water ?? 0,
		workout: raw.workout ?? false,
		workoutType: Array.isArray(raw.workoutType)
			? raw.workoutType.map(remapTag)
			: raw.workoutType
				? [remapTag(raw.workoutType)]
				: [],
		noAlcohol: raw.noAlcohol ?? true,
		noFriedFood: raw.noFriedFood ?? true,
		notes: raw.notes ?? ''
	};
}

function loadData(): Record<string, DayLog> {
	if (typeof window === 'undefined') return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return {};
		const parsed = JSON.parse(raw);
		const migrated: Record<string, DayLog> = {};
		for (const [key, val] of Object.entries(parsed)) {
			migrated[key] = migrateLog(val);
		}
		return migrated;
	} catch {
		return {};
	}
}

function loadSettings(): Settings {
	const defaultSettings: Settings = {
		_v: CURRENT_SETTINGS_VERSION,
		name: '',
		startDate: getToday(),
		streakThreshold: 100,
		rules: {
			alcohol: { path: 'none', lastDrinkDate: null }
		},
		features: { calendarShowCompletion: false }
	};

	if (typeof window === 'undefined') return defaultSettings;

	try {
		const raw = localStorage.getItem(SETTINGS_KEY);
		if (!raw) return defaultSettings;
		const parsed = JSON.parse(raw);
		if (parsed && typeof parsed !== 'object') return defaultSettings;
		const migrated = runMigrations(parsed);
		if ((parsed._v ?? 0) < CURRENT_SETTINGS_VERSION) {
			localStorage.setItem(SETTINGS_KEY, JSON.stringify(migrated));
		}
		return migrated;
	} catch {
		return defaultSettings;
	}
}

function createStore() {
	let data = $state<Record<string, DayLog>>(loadData());
	let settings = $state<Settings>(loadSettings());

	function save() {
		if (typeof window === 'undefined') return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	}

	function saveSettings() {
		if (typeof window === 'undefined') return;
		localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
	}

	function peekLog(date: string): DayLog {
		return data[date] ?? { ...DEFAULT_LOG, date };
	}

	function ensureLog(date: string): DayLog {
		if (!data[date]) {
			data[date] = { ...DEFAULT_LOG, date };
		}
		return data[date];
	}

	function updateLog(date: string, updates: Partial<DayLog>) {
		const log = ensureLog(date);
		Object.assign(log, updates);

		if (updates.stepCount !== undefined) {
			log.steps = updates.stepCount >= 10000;
		}

		save();
	}

	function addWater(date: string) {
		const log = ensureLog(date);
		if (log.water < 12) {
			log.water += 1;
			save();
		}
	}

	function removeWater(date: string) {
		const log = ensureLog(date);
		if (log.water > 0) {
			log.water -= 1;
			save();
		}
	}

	function getDayCompletionPct(date: string): number {
		const log = peekLog(date);
		const isSunday = getDayOfWeek(date) === 0;
		const stepProgress = Math.min(1, (log.stepCount || 0) / 10000);
		const count =
			stepProgress +
			(log.water >= 12 ? 1 : 0) +
			(isSunday || log.workout ? 1 : 0) +
			(log.noAlcohol ? 1 : 0) +
			(log.noFriedFood ? 1 : 0);
		const pct = Math.round((count / 5) * 100);
		// Never report 100 unless the day is actually complete — rounding can
		// push ~9750 steps + all other habits to 100 while isDayComplete is false.
		return isDayComplete(date) ? pct : Math.min(99, pct);
	}

	function isDayComplete(date: string): boolean {
		const log = peekLog(date);
		const isSunday = getDayOfWeek(date) === 0;
		return (
			log.steps &&
			log.water >= 12 &&
			(isSunday || log.workout) &&
			log.noAlcohol &&
			log.noFriedFood
		);
	}

	function canDrinkAlcohol(date: string): boolean {
		if (settings.rules.alcohol.path === 'none') return false;
		if (!settings.rules.alcohol.lastDrinkDate) return true;
		const last = new Date(settings.rules.alcohol.lastDrinkDate + 'T12:00:00');
		const current = new Date(date + 'T12:00:00');
		const diff = (current.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
		return diff >= 14;
	}

	function markAlcoholDrunk(date: string) {
		settings.rules.alcohol.lastDrinkDate = date;
		const log = ensureLog(date);
		// biweekly path: a planned drink doesn't break the streak
		log.noAlcohol = true;
		save();
		saveSettings();
	}

	function qualifiesForStreak(date: string): boolean {
		const threshold = settings.streakThreshold ?? 100;
		if (threshold >= 100) return isDayComplete(date);
		const log = peekLog(date);
		const isSunday = getDayOfWeek(date) === 0;
		const stepProgress = Math.min(1, (log.stepCount || 0) / 10000);
		const count =
			stepProgress +
			(log.water >= 12 ? 1 : 0) +
			(isSunday || log.workout ? 1 : 0) +
			(log.noAlcohol ? 1 : 0) +
			(log.noFriedFood ? 1 : 0);
		const pct = (count / 5) * 100;
		return pct >= threshold;
	}

	function getStreak(): number {
		let streak = 0;
		const today = new Date();
		for (let i = 1; i <= 75; i++) {
			const d = new Date(today);
			d.setDate(d.getDate() - i);
			const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
			if (data[dateStr] && qualifiesForStreak(dateStr)) streak++;
			else break;
		}
		return streak;
	}

	function getBestStreak(): number {
		const start = settings.startDate;
		if (!start) return 0;
		const startDate = new Date(start + 'T12:00:00');
		const todayDate = new Date(getToday() + 'T12:00:00');
		let best = 0;
		let current = 0;
		const d = new Date(startDate);
		while (d < todayDate) {
			const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
			if (data[dateStr] && qualifiesForStreak(dateStr)) {
				current++;
				if (current > best) best = current;
			} else {
				current = 0;
			}
			d.setDate(d.getDate() + 1);
		}
		return best;
	}

	function getTotalCompleteDays(): number {
		return Object.keys(data).filter((d) => isDayComplete(d)).length;
	}

	function getDayNumber(): number {
		if (!settings.startDate) return 1;
		const start = new Date(settings.startDate + 'T12:00:00');
		const today = new Date(getToday() + 'T12:00:00');
		const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
		return Math.max(1, diff + 1);
	}

	function getHabitStats(): { name: string; emoji: string; completed: number; total: number }[] {
		const start = settings.startDate;
		if (!start) return [];
		const startDate = new Date(start + 'T12:00:00');
		const todayDate = new Date(getToday() + 'T12:00:00');

		let totalDays = 0;
		let stepsDone = 0;
		let waterDone = 0;
		let workoutDone = 0;
		let alcoholDone = 0;
		let foodDone = 0;

		const d = new Date(startDate);
		while (d <= todayDate) {
			const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
			totalDays++;
			const log = peekLog(dateStr);
			const isSunday = getDayOfWeek(dateStr) === 0;
			if (log.steps) stepsDone++;
			if (log.water >= 12) waterDone++;
			if (isSunday || log.workout) workoutDone++;
			if (log.noAlcohol) alcoholDone++;
			if (log.noFriedFood) foodDone++;
			d.setDate(d.getDate() + 1);
		}

		return [
			{ name: 'Steps', emoji: '👟', completed: stepsDone, total: totalDays },
			{ name: 'Water', emoji: '💧', completed: waterDone, total: totalDays },
			{ name: 'Workout', emoji: '💪', completed: workoutDone, total: totalDays },
			{ name: 'No Alcohol', emoji: '🚫', completed: alcoholDone, total: totalDays },
			{ name: 'Clean Eating', emoji: '🥗', completed: foodDone, total: totalDays }
		];
	}

	function getWeeklyCompletion(): { week: number; completed: number; total: number }[] {
		const start = settings.startDate;
		if (!start) return [];
		const startDate = new Date(start + 'T12:00:00');
		const todayDate = new Date(getToday() + 'T12:00:00');
		const weeks: { week: number; completed: number; total: number }[] = [];
		let weekNum = 1;
		let completed = 0;
		let total = 0;

		const d = new Date(startDate);
		while (d <= todayDate && weekNum <= 11) {
			const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
			total++;
			if (data[dateStr] && isDayComplete(dateStr)) completed++;

			if (total === 7) {
				weeks.push({ week: weekNum, completed, total });
				weekNum++;
				completed = 0;
				total = 0;
			}
			d.setDate(d.getDate() + 1);
		}
		if (total > 0) {
			weeks.push({ week: weekNum, completed, total });
		}
		return weeks;
	}

	function getTotalStepCount(): number {
		return Object.values(data).reduce((sum, log) => sum + (log.stepCount || 0), 0);
	}

	function getWorkoutBreakdown(): { tag: WorkoutTag; count: number }[] {
		const counts: Record<string, number> = {};
		for (const log of Object.values(data)) {
			if (log.workout && log.workoutType && log.workoutType.length > 0) {
				for (const tag of log.workoutType) {
					counts[tag] = (counts[tag] || 0) + 1;
				}
			}
		}
		return Object.entries(counts)
			.map(([tag, count]) => ({ tag: tag as WorkoutTag, count }))
			.sort((a, b) => b.count - a.count);
	}

	function updateSettings(updates: Partial<Settings>) {
		const { rules, features, ...rest } = updates;
		Object.assign(settings, rest);
		if (rules?.alcohol) {
			Object.assign(settings.rules.alcohol, rules.alcohol);
		}
		if (features) {
			Object.assign(settings.features, features);
		}
		saveSettings();
	}

	function getAllLogs(): Record<string, DayLog> {
		return data;
	}

	return {
		get today() {
			return getToday();
		},
		get settings() {
			return settings;
		},
		get streak() {
			return getStreak();
		},
		get bestStreak() {
			return getBestStreak();
		},
		get totalComplete() {
			return getTotalCompleteDays();
		},
		get dayNumber() {
			return getDayNumber();
		},
		get totalStepCount() {
			return getTotalStepCount();
		},
		peekLog,
		ensureLog,
		updateLog,
		addWater,
		removeWater,
		getDayCompletionPct,
		isDayComplete,
		canDrinkAlcohol,
		markAlcoholDrunk,
		updateSettings,
		getAllLogs,
		getDayOfWeek,
		getHabitStats,
		getWeeklyCompletion,
		getWorkoutBreakdown
	};
}

export const store = createStore();
