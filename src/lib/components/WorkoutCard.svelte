<script lang="ts">
	import { store, WORKOUT_TAGS, type WorkoutTag } from '$lib/store.svelte';

	interface Props {
		date: string;
	}

	let { date }: Props = $props();

	const log = $derived(store.peekLog(date));
	const isSunday = $derived(store.getDayOfWeek(date) === 0);
	const checked = $derived(log.workout);
	let showTags = $state(false);

	function toggle() {
		if (isSunday) return;
		const newVal = !checked;
		store.updateLog(date, { workout: newVal });
		if (newVal && !log.workoutType) {
			showTags = true;
		}
		if (!newVal) {
			store.updateLog(date, { workoutType: '' });
			showTags = false;
		}
	}

	function selectTag(tag: WorkoutTag) {
		store.updateLog(date, { workoutType: tag, workout: true });
		showTags = false;
	}

	const tagEmojis: Record<WorkoutTag, string> = {
		Push: '🏋️', Pull: '🤸', Legs: '🦵', Cardio: '🏃',
		Yoga: '🧘', HIIT: '⚡', Core: '🎯', Sport: '⚽', Other: '🔥'
	};
</script>

<div class="rounded-2xl transition-all duration-300
	{isSunday ? 'opacity-40' : ''}
	{checked ? 'bg-mint-500/10 ring-1 ring-mint-500/20' : 'bg-surface-2'}">

	<button
		onclick={toggle}
		class="flex w-full items-center gap-4 p-4 text-left transition-all active:scale-[0.97]"
		disabled={isSunday}
	>
		<div class="flex h-12 w-12 items-center justify-center rounded-xl text-2xl
			{checked ? 'bg-mint-500/15' : 'bg-surface-3'}">
			💪
		</div>
		<div class="flex-1">
			<div class="flex items-center gap-2">
				<h3 class="font-bold {checked ? 'text-mint-400' : 'text-text'}">Strength Training</h3>
				{#if log.workoutType}
					<span class="rounded-full bg-accent-500/15 px-2 py-0.5 text-[10px] font-bold text-accent-400">
						{log.workoutType}
					</span>
				{/if}
			</div>
			<p class="text-xs text-text-muted">
				{#if isSunday}
					Rest day — you've earned it!
				{:else if checked && log.workoutType}
					{tagEmojis[log.workoutType]} {log.workoutType} day — crushed it
				{:else if checked}
					Tap below to tag your workout
				{:else}
					Push yourself today
				{/if}
			</p>
		</div>
		<div class="flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300
			{checked ? 'bg-mint-500 shadow-lg shadow-mint-500/30' : 'border-2 border-surface-4'}">
			{#if checked}
				<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
					<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
				</svg>
			{/if}
		</div>
	</button>

	{#if (showTags || (checked && !log.workoutType)) && !isSunday}
		<div class="border-t border-surface-3/50 px-4 pb-4 pt-3">
			<p class="mb-2 text-xs font-semibold text-text-dim">What did you do?</p>
			<div class="flex flex-wrap gap-2">
				{#each WORKOUT_TAGS as tag}
					<button
						onclick={() => selectTag(tag)}
						class="rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-95
							{log.workoutType === tag
								? 'bg-accent-500 text-white shadow-sm shadow-accent-500/25'
								: 'bg-surface-3 text-text-muted'}"
					>
						{tagEmojis[tag]} {tag}
					</button>
				{/each}
			</div>
		</div>
	{:else if checked && log.workoutType && !isSunday}
		<div class="border-t border-surface-3/50 px-4 pb-3 pt-2">
			<button
				onclick={() => { showTags = true; }}
				class="text-xs text-text-dim underline underline-offset-2"
			>
				Change workout type
			</button>
		</div>
	{/if}
</div>
