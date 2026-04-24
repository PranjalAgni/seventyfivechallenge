const STORAGE_KEY = '75medium_data';
const SETTINGS_KEY = '75medium_settings';

export interface DayLog {
	date: string;
	steps: boolean;
	water: number;
	workout: boolean;
	noAlcohol: boolean;
	noFriedFood: boolean;
}

export interface Settings {
	name: string;
	startDate: string;
	alcoholPath: 'none' | 'biweekly';
	lastAlcoholDate: string | null;
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
	water: 0,
	workout: false,
	noAlcohol: true,
	noFriedFood: true
};

function loadData(): Record<string, DayLog> {
	if (typeof window === 'undefined') return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}

function loadSettings(): Settings {
	const fallback: Settings = { name: '', startDate: getToday(), alcoholPath: 'none', lastAlcoholDate: null };
	if (typeof window === 'undefined') return fallback;
	try {
		const raw = localStorage.getItem(SETTINGS_KEY);
		return raw ? JSON.parse(raw) : fallback;
	} catch {
		return fallback;
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
		if (settings.alcoholPath === 'none') return false;
		if (!settings.lastAlcoholDate) return true;
		const last = new Date(settings.lastAlcoholDate + 'T12:00:00');
		const current = new Date(date + 'T12:00:00');
		const diff = (current.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
		return diff >= 14;
	}

	function markAlcoholDrunk(date: string) {
		settings.lastAlcoholDate = date;
		const log = ensureLog(date);
		log.noAlcohol = true;
		save();
		saveSettings();
	}

	function getStreak(): number {
		let streak = 0;
		const today = new Date();
		for (let i = 0; i < 75; i++) {
			const d = new Date(today);
			d.setDate(d.getDate() - i);
			const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
			if (i === 0) {
				if (data[dateStr] && isDayComplete(dateStr)) streak++;
				else if (!data[dateStr]) continue;
				else break;
			} else {
				if (data[dateStr] && isDayComplete(dateStr)) streak++;
				else break;
			}
		}
		return streak;
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

	function updateSettings(updates: Partial<Settings>) {
		Object.assign(settings, updates);
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
		get totalComplete() {
			return getTotalCompleteDays();
		},
		get dayNumber() {
			return getDayNumber();
		},
		peekLog,
		ensureLog,
		updateLog,
		addWater,
		removeWater,
		isDayComplete,
		canDrinkAlcohol,
		markAlcoholDrunk,
		updateSettings,
		getAllLogs,
		getDayOfWeek
	};
}

export const store = createStore();
