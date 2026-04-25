<script lang="ts">
	import { store } from '$lib/store.svelte';
	import ProgressRing from '$lib/components/ProgressRing.svelte';
	import WaterTracker from '$lib/components/WaterTracker.svelte';
	import HabitCard from '$lib/components/HabitCard.svelte';
	import AlcoholCard from '$lib/components/AlcoholCard.svelte';
	import StepTracker from '$lib/components/StepTracker.svelte';
	import WorkoutCard from '$lib/components/WorkoutCard.svelte';
	import JournalEntry from '$lib/components/JournalEntry.svelte';

	const log = $derived(store.peekLog(store.today));
	const isSunday = $derived(store.getDayOfWeek(store.today) === 0);

	const completedCount = $derived.by(() => {
		let count = 0;
		if (log.steps) count++;
		if (log.water >= 12) count++;
		if (isSunday || log.workout) count++;
		if (log.noAlcohol) count++;
		if (log.noFriedFood) count++;
		return count;
	});

	const todayPct = $derived(Math.round((completedCount / 5) * 100));
	const overallPct = $derived(Math.round((store.totalComplete / 75) * 100));

	const greeting = $derived.by(() => {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 17) return 'Good afternoon';
		return 'Good evening';
	});

	const motivationalQuotes = [
		"Lock in. No excuses.",
		"Discipline is choosing what you want most over what you want now.",
		"Your only competition is who you were yesterday.",
		"Hard choices, easy life.",
		"75 days. One day at a time.",
		"The grind doesn't stop.",
		"Stay hard, stay focused.",
		"Champions are made when no one is watching.",
		"You didn't come this far to only come this far.",
		"Trust the process. Results will follow."
	];

	const quote = $derived(motivationalQuotes[Math.floor(new Date().getDate() % motivationalQuotes.length)]);
</script>

<div class="space-y-5">
	<!-- Header -->
	<div class="flex items-start justify-between pt-2">
		<div>
			<p class="text-sm text-text-muted">{greeting}</p>
			<h1 class="text-2xl font-black text-text">
				{store.settings.name || 'Challenger'}
			</h1>
		</div>
		<div class="flex flex-col items-end gap-0.5">
			<span class="rounded-full bg-accent-500/15 px-3 py-1 text-xs font-bold text-accent-400">
				Day {store.dayNumber}/75
			</span>
			{#if store.streak > 0}
				<span class="text-xs font-semibold text-warm-400">🔥 {store.streak} streak</span>
			{/if}
		</div>
	</div>

	<!-- Motivational Quote -->
	<div class="rounded-xl bg-linear-to-r from-accent-600/10 to-warm-500/10 px-4 py-3">
		<p class="text-center text-sm font-medium text-text-muted italic">"{quote}"</p>
	</div>

	<!-- Today's Progress Ring -->
	<div class="flex items-center gap-5 rounded-2xl bg-surface-2 p-5">
		<ProgressRing percentage={todayPct} size={100} strokeWidth={7} />
		<div class="flex-1">
			<h2 class="text-lg font-bold text-text">Today's Progress</h2>
			<p class="text-sm text-text-muted">{completedCount}/5 tasks done</p>
			<div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
				<div
					class="h-full rounded-full bg-linear-to-r from-accent-500 to-warm-400 transition-all duration-500"
					style="width: {todayPct}%"
				></div>
			</div>
			<p class="mt-1 text-xs text-text-muted">{overallPct}% overall ({store.totalComplete}/75 days)</p>
		</div>
	</div>

	<!-- Habits -->
	<div class="space-y-3">
		<h2 class="text-xs font-bold uppercase tracking-widest text-text-dim">Daily Checklist</h2>

		<StepTracker />
		<WaterTracker />
		<WorkoutCard />
		<AlcoholCard />

		<HabitCard
			emoji="🥗"
			title="No Fried Food"
			subtitle="Eat clean, feel lean"
			field="noFriedFood"
		/>
	</div>

	<!-- Journal -->
	<div>
		<h2 class="mb-3 text-xs font-bold uppercase tracking-widest text-text-dim">Reflect</h2>
		<JournalEntry />
	</div>

	<!-- Day Complete Banner -->
	{#if todayPct === 100}
		<div class="rounded-2xl bg-linear-to-r from-mint-500/15 to-accent-500/15 p-5 text-center ring-1 ring-mint-500/20">
			<p class="text-3xl">🎉</p>
			<h3 class="mt-1 text-lg font-black text-mint-400">Day Complete!</h3>
			<p class="text-sm text-text-muted">You crushed it. See you tomorrow.</p>
		</div>
	{/if}
</div>
