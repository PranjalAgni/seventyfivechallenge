<script lang="ts">
	import { store } from '$lib/store.svelte';
	import ProgressRing from '$lib/components/ProgressRing.svelte';
	import { goto } from '$app/navigation';

	const overallPct = $derived(Math.round((store.totalComplete / 75) * 100));
	const allLogs = $derived(store.getAllLogs());

	interface CalendarDay {
		date: string;
		dayNum: number;
		status: 'complete' | 'incomplete' | 'future' | 'today';
		completionPct: number;
	}

	function getDayCompletionPct(dateStr: string): number {
		const log = store.peekLog(dateStr);
		const isSunday = store.getDayOfWeek(dateStr) === 0;
		let count = 0;
		if (log.steps) count++;
		if (log.water >= 12) count++;
		if (isSunday || log.workout) count++;
		if (log.noAlcohol) count++;
		if (log.noFriedFood) count++;
		return Math.round((count / 5) * 100);
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
			if (dateStr === today) status = 'today';
			else if (dateStr < today) status = store.isDayComplete(dateStr) ? 'complete' : 'incomplete';
			const completionPct = status === 'future' ? 0 : getDayCompletionPct(dateStr);
			days.push({ date: dateStr, dayNum: i + 1, status, completionPct });
		}
		return days;
	});

	const calendarShowCompletion = $derived(
		store.settings.features?.calendarShowCompletion ?? false
	);

	function getHeatmapClass(day: CalendarDay): string {
		if (day.status === 'future') return 'bg-surface-3 text-text-dim';
		if (day.status === 'today') return 'bg-accent-500 text-white ring-2 ring-accent-300 shadow-lg shadow-accent-500/30';
		if (day.completionPct === 100) return 'bg-mint-500 text-white shadow-sm shadow-mint-500/20';
		if (day.completionPct >= 60) return 'bg-warm-400 text-white';
		if (day.completionPct >= 20) return 'bg-warm-500/60 text-white';
		if (day.completionPct > 0) return 'bg-rose-500/40 text-white';
		return 'bg-rose-500/20 text-text-muted';
	}

	function handleTileClick(day: CalendarDay) {
		if (day.status === 'future') return;
		goto(`/?date=${day.date}`);
	}

	const weeklyData = $derived(store.getWeeklyCompletion());
	const habitStats = $derived(store.getHabitStats());
	const workoutBreakdown = $derived(store.getWorkoutBreakdown());

	const totalSteps = $derived(store.totalStepCount);
	const avgSteps = $derived.by(() => {
		const logs = Object.values(allLogs).filter(l => l.stepCount > 0);
		if (logs.length === 0) return 0;
		return Math.round(logs.reduce((s, l) => s + l.stepCount, 0) / logs.length);
	});

	const stats = $derived.by(() => {
		const logs = Object.values(allLogs);
		let totalWater = 0;
		let totalWorkouts = 0;
		for (const log of logs) {
			totalWater += log.water;
			if (log.workout) totalWorkouts++;
		}
		return { totalWater: (totalWater * 0.25).toFixed(1), totalWorkouts, daysTracked: logs.length };
	});

	function formatNum(n: number): string {
		if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
		if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K';
		return String(n);
	}
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
			<p class="text-xs text-text-muted">Current Streak</p>
		</div>
		<div class="rounded-xl bg-surface-2 p-4 text-center">
			<p class="text-2xl font-black text-accent-400">⚡ {store.bestStreak}</p>
			<p class="text-xs text-text-muted">Best Streak</p>
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

	<!-- Step Stats -->
	{#if totalSteps > 0}
		<div class="rounded-2xl bg-surface-2 p-4">
			<h2 class="mb-3 text-xs font-bold uppercase tracking-widest text-text-dim">Steps</h2>
			<div class="flex items-center justify-around">
				<div class="text-center">
					<p class="text-xl font-black text-accent-400">👟 {formatNum(totalSteps)}</p>
					<p class="text-[10px] text-text-muted">Total Steps</p>
				</div>
				<div class="h-8 w-px bg-surface-3"></div>
				<div class="text-center">
					<p class="text-xl font-black text-accent-300">{formatNum(avgSteps)}</p>
					<p class="text-[10px] text-text-muted">Avg / Day</p>
				</div>
				<div class="h-8 w-px bg-surface-3"></div>
				<div class="text-center">
					<p class="text-xl font-black text-warm-400">{formatNum(Math.round(totalSteps * 0.0008))}</p>
					<p class="text-[10px] text-text-muted">km walked</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Weekly Chart -->
	{#if weeklyData.length > 0}
		<div>
			<h2 class="mb-3 text-xs font-bold uppercase tracking-widest text-text-dim">Weekly Progress</h2>
			<div class="flex items-end gap-1.5" style="height: 120px;">
				{#each weeklyData as week}
					{@const pct = week.total > 0 ? (week.completed / week.total) * 100 : 0}
					<div class="flex flex-1 flex-col items-center gap-1">
						<span class="text-[9px] font-bold text-text-muted">{Math.round(pct)}%</span>
						<div class="w-full rounded-t-md bg-surface-3" style="height: 90px;">
							<div class="flex h-full flex-col justify-end">
								<div
									class="w-full rounded-t-md transition-all duration-500
										{pct === 100 ? 'bg-mint-500' : pct >= 70 ? 'bg-accent-500' : pct >= 40 ? 'bg-warm-400' : 'bg-rose-400'}"
									style="height: {pct}%;"
								></div>
							</div>
						</div>
						<span class="text-[9px] text-text-dim">W{week.week}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Habit Breakdown -->
	{#if habitStats.length > 0}
		<div>
			<h2 class="mb-3 text-xs font-bold uppercase tracking-widest text-text-dim">Habit Breakdown</h2>
			<div class="space-y-3">
				{#each habitStats as habit}
					{@const pct = habit.total > 0 ? Math.round((habit.completed / habit.total) * 100) : 0}
					<div>
						<div class="mb-1 flex items-center justify-between">
							<span class="text-sm font-semibold text-text">
								{habit.emoji} {habit.name}
							</span>
							<span class="text-xs font-bold {pct >= 80 ? 'text-mint-400' : pct >= 50 ? 'text-warm-400' : 'text-rose-400'}">
								{pct}%
							</span>
						</div>
						<div class="h-2 w-full overflow-hidden rounded-full bg-surface-3">
							<div
								class="h-full rounded-full transition-all duration-500
									{pct >= 80 ? 'bg-mint-500' : pct >= 50 ? 'bg-warm-400' : 'bg-rose-400'}"
								style="width: {pct}%"
							></div>
						</div>
						<p class="mt-0.5 text-[10px] text-text-dim">{habit.completed}/{habit.total} days</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Workout Split -->
	{#if workoutBreakdown.length > 0}
		<div>
			<h2 class="mb-3 text-xs font-bold uppercase tracking-widest text-text-dim">Workout Split</h2>
			<div class="flex flex-wrap gap-2">
				{#each workoutBreakdown as item}
					<div class="rounded-xl bg-surface-2 px-3 py-2 text-center">
						<p class="text-lg font-black text-accent-400">{item.count}</p>
						<p class="text-[10px] text-text-muted">{item.tag}</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- 75-Day Calendar Grid -->
	<div>
		<h2 class="mb-3 text-xs font-bold uppercase tracking-widest text-text-dim">75-Day Map</h2>
		<div class="grid grid-cols-10 gap-1.5">
			{#each calendarDays as day}
				<div
					class="relative flex aspect-square items-center justify-center rounded-lg text-[10px] font-bold transition-all
					{day.status !== 'future' ? 'cursor-pointer hover:scale-110 hover:brightness-110' : ''}
					{calendarShowCompletion
						? getHeatmapClass(day)
						: day.status === 'complete'
							? 'bg-mint-500 text-white shadow-sm shadow-mint-500/20'
							: day.status === 'incomplete'
								? 'bg-rose-500/50 text-white'
								: day.status === 'today'
									? 'bg-accent-500 text-white ring-2 ring-accent-300 shadow-lg shadow-accent-500/30'
									: 'bg-surface-3 text-text-dim'}"
					title="Day {day.dayNum} - {day.date}"
					role={day.status !== 'future' ? 'button' : undefined}
					tabindex={day.status !== 'future' ? 0 : undefined}
					onclick={() => handleTileClick(day)}
					onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTileClick(day); }}
				>
					{#if calendarShowCompletion}
						{day.status === 'future' ? '' : day.completionPct + '%'}
					{:else}
						{day.dayNum}
					{/if}
				</div>
			{/each}
		</div>
		<div class="mt-3 flex items-center justify-center gap-4 text-xs text-text-muted">
			{#if calendarShowCompletion}
				<span class="flex items-center gap-1.5">
					<span class="inline-block h-2.5 w-2.5 rounded-sm bg-mint-500"></span> 100%
				</span>
				<span class="flex items-center gap-1.5">
					<span class="inline-block h-2.5 w-2.5 rounded-sm bg-warm-400"></span> 60–99%
				</span>
				<span class="flex items-center gap-1.5">
					<span class="inline-block h-2.5 w-2.5 rounded-sm bg-rose-500/40"></span> &lt;60%
				</span>
				<span class="flex items-center gap-1.5">
					<span class="inline-block h-2.5 w-2.5 rounded-sm bg-accent-500"></span> Today
				</span>
			{:else}
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
			{/if}
		</div>
	</div>
</div>
