<script lang="ts">
	import { store } from '$lib/store.svelte';
	import ProgressRing from '$lib/components/ProgressRing.svelte';

	const overallPct = $derived(Math.round((store.totalComplete / 75) * 100));
	const allLogs = $derived(store.getAllLogs());

	interface CalendarDay {
		date: string;
		dayNum: number;
		status: 'complete' | 'incomplete' | 'future' | 'today';
	}

	const calendarDays = $derived.by((): CalendarDay[] => {
		const start = store.settings.startDate;
		if (!start) return [];

		const startDate = new Date(start + 'T12:00:00');
		const today = store.today;
		const days: CalendarDay[] = [];

		for (let i = 0; i < 75; i++) {
			const d = new Date(startDate);
			d.setDate(d.getDate() + i);
			const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

			let status: CalendarDay['status'] = 'future';
			if (dateStr === today) {
				status = 'today';
			} else if (dateStr < today) {
				status = store.isDayComplete(dateStr) ? 'complete' : 'incomplete';
			}

			days.push({ date: dateStr, dayNum: i + 1, status });
		}
		return days;
	});

	const stats = $derived.by(() => {
		const logs = Object.values(allLogs);
		let totalSteps = 0;
		let totalWater = 0;
		let totalWorkouts = 0;

		for (const log of logs) {
			if (log.steps) totalSteps++;
			totalWater += log.water;
			if (log.workout) totalWorkouts++;
		}

		return {
			totalSteps,
			totalWater: (totalWater * 0.25).toFixed(1),
			totalWorkouts,
			daysTracked: logs.length
		};
	});
</script>

<div class="space-y-6 pt-2">
	<div class="text-center">
		<h1 class="text-2xl font-black text-text">Your Journey</h1>
		<p class="text-sm text-text-muted">75 Medium Challenge Progress</p>
	</div>

	<!-- Big Progress Ring -->
	<div class="flex flex-col items-center gap-3 rounded-2xl bg-surface-2 p-6">
		<ProgressRing percentage={overallPct} size={140} strokeWidth={10} />
		<div class="text-center">
			<p class="text-lg font-bold text-text">{store.totalComplete} / 75 days</p>
			<p class="text-sm text-text-muted">{75 - store.totalComplete} days remaining</p>
		</div>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-2 gap-3">
		<div class="rounded-xl bg-surface-2 p-4 text-center">
			<p class="text-2xl font-black text-warm-400">🔥 {store.streak}</p>
			<p class="text-xs text-text-muted">Day Streak</p>
		</div>
		<div class="rounded-xl bg-surface-2 p-4 text-center">
			<p class="text-2xl font-black text-accent-400">👟 {stats.totalSteps}</p>
			<p class="text-xs text-text-muted">10K Step Days</p>
		</div>
		<div class="rounded-xl bg-surface-2 p-4 text-center">
			<p class="text-2xl font-black text-sky-400">💧 {stats.totalWater}L</p>
			<p class="text-xs text-text-muted">Water Consumed</p>
		</div>
		<div class="rounded-xl bg-surface-2 p-4 text-center">
			<p class="text-2xl font-black text-mint-400">💪 {stats.totalWorkouts}</p>
			<p class="text-xs text-text-muted">Workouts Done</p>
		</div>
	</div>

	<!-- 75-Day Calendar Grid -->
	<div>
		<h2 class="mb-3 text-xs font-bold uppercase tracking-widest text-text-dim">75-Day Map</h2>
		<div class="grid grid-cols-10 gap-1.5">
			{#each calendarDays as day}
				<div
					class="relative flex aspect-square items-center justify-center rounded-lg text-[10px] font-bold transition-all
					{day.status === 'complete'
						? 'bg-mint-500 text-white shadow-sm shadow-mint-500/20'
						: day.status === 'incomplete'
							? 'bg-rose-500/50 text-white'
							: day.status === 'today'
								? 'bg-accent-500 text-white ring-2 ring-accent-300 shadow-lg shadow-accent-500/30'
								: 'bg-surface-3 text-text-dim'}"
					title="Day {day.dayNum} - {day.date}"
				>
					{day.dayNum}
				</div>
			{/each}
		</div>
		<div class="mt-3 flex items-center justify-center gap-4 text-xs text-text-muted">
			<span class="flex items-center gap-1.5">
				<span class="inline-block h-2.5 w-2.5 rounded-sm bg-mint-500"></span> Done
			</span>
			<span class="flex items-center gap-1.5">
				<span class="inline-block h-2.5 w-2.5 rounded-sm bg-rose-500/50"></span> Missed
			</span>
			<span class="flex items-center gap-1.5">
				<span class="inline-block h-2.5 w-2.5 rounded-sm bg-accent-500"></span> Today
			</span>
			<span class="flex items-center gap-1.5">
				<span class="inline-block h-2.5 w-2.5 rounded-sm bg-surface-3"></span> Future
			</span>
		</div>
	</div>
</div>
