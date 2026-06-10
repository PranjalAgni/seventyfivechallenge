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
		if (newVal && log.workoutType.length === 0) {
			showTags = true;
		}
		if (!newVal) {
			store.updateLog(date, { workoutType: [] });
			showTags = false;
		}
	}

	function toggleTag(tag: WorkoutTag) {
		const current = log.workoutType;
		const next = current.includes(tag)
			? current.filter((t) => t !== tag)
			: [...current, tag];
		store.updateLog(date, { workoutType: next, workout: true });
		if (next.length > 0) showTags = false;
	}

	const tagEmojis: Record<WorkoutTag, string> = {
		CrossFit: '🏋️',
		Running: '🏃',
		Hyrox: '🏅',
		Strength: '💪',
		Cycling: '🚴',
		Swim: '🏊',
		Sports: '🏸',
		Other: '🔥'
	};

	const selectedLabel = $derived.by(() => {
		const tags = log.workoutType;
		if (tags.length === 0) return '';
		if (tags.length <= 2) return tags.map((t) => `${tagEmojis[t]} ${t}`).join(' · ');
		return `${tagEmojis[tags[0]]} ${tags[0]} · ${tagEmojis[tags[1]]} ${tags[1]} +${tags.length - 2}`;
	});
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
				{#if log.workoutType.length > 0}
					<span class="rounded-full bg-accent-500/15 px-2 py-0.5 text-[10px] font-bold text-accent-400">
						{log.workoutType.length === 1
							? log.workoutType[0]
							: log.workoutType.length === 2
								? log.workoutType.join(' · ')
								: `${log.workoutType[0]} +${log.workoutType.length - 1}`}
					</span>
				{/if}
			</div>
			<p class="text-xs text-text-muted">
				{#if isSunday}
					Rest day — you've earned it!
				{:else if checked && log.workoutType.length > 0}
					{selectedLabel} — crushed it
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

	{#if (showTags || (checked && log.workoutType.length === 0)) && !isSunday}
		<div class="border-t border-surface-3/50 px-4 pb-4 pt-3">
			<p class="mb-2 text-xs font-semibold text-text-dim">What did you do?</p>
			<div class="flex flex-wrap gap-2">
				{#each WORKOUT_TAGS as tag}
					<button
						onclick={() => toggleTag(tag)}
						class="rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-95
							{log.workoutType.includes(tag)
								? 'bg-accent-500 text-white shadow-sm shadow-accent-500/25'
								: 'bg-surface-3 text-text-muted'}"
					>
						{tagEmojis[tag]} {tag}
					</button>
				{/each}
			</div>
			{#if log.workoutType.length > 0}
				<button
					onclick={() => { showTags = false; }}
					class="mt-3 text-xs text-text-dim underline underline-offset-2"
				>
					Done
				</button>
			{/if}
		</div>
	{:else if checked && log.workoutType.length > 0 && !isSunday}
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
