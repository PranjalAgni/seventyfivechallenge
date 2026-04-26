<script lang="ts">
	import { store } from '$lib/store.svelte';

	interface Props {
		selectedDate: string;
		onchange: (date: string) => void;
	}

	let { selectedDate, onchange }: Props = $props();

	const isToday = $derived(selectedDate === store.today);

	const canGoBack = $derived.by(() => {
		const start = store.settings.startDate;
		if (!start) return false;
		return selectedDate > start;
	});

	const canGoForward = $derived(!isToday);

	function shiftDay(offset: number) {
		const d = new Date(selectedDate + 'T12:00:00');
		d.setDate(d.getDate() + offset);
		const newDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

		if (offset < 0 && store.settings.startDate && newDate < store.settings.startDate) return;
		if (offset > 0 && newDate > store.today) return;

		onchange(newDate);
	}

	function resetToToday() {
		onchange(store.today);
	}

	const label = $derived.by(() => {
		if (isToday) {
			const d = new Date(selectedDate + 'T12:00:00');
			const month = d.toLocaleString('en', { month: 'short' });
			return `Today (${month} ${d.getDate()})`;
		}

		const today = new Date(store.today + 'T12:00:00');
		const sel = new Date(selectedDate + 'T12:00:00');
		const diffMs = today.getTime() - sel.getTime();
		const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 1) {
			const month = sel.toLocaleString('en', { month: 'short' });
			return `Yesterday (${month} ${sel.getDate()})`;
		}

		const weekday = sel.toLocaleString('en', { weekday: 'short' });
		const month = sel.toLocaleString('en', { month: 'short' });
		return `${weekday}, ${month} ${sel.getDate()}`;
	});
</script>

<div class="flex items-center justify-between rounded-xl bg-surface-2 px-2 py-1.5">
	<button
		onclick={() => shiftDay(-1)}
		disabled={!canGoBack}
		aria-label="Previous day"
		class="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-all active:scale-90 disabled:opacity-20"
	>
		<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
			<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
		</svg>
	</button>

	<button
		onclick={resetToToday}
		class="flex items-center gap-1.5 rounded-lg px-3 py-1 transition-all active:scale-95
			{isToday ? 'text-text' : 'bg-accent-500/10 text-accent-400'}"
	>
		{#if !isToday}
			<span class="inline-block h-1.5 w-1.5 rounded-full bg-accent-400"></span>
		{/if}
		<span class="text-sm font-bold">{label}</span>
	</button>

	<button
		onclick={() => shiftDay(1)}
		disabled={!canGoForward}
		aria-label="Next day"
		class="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-all active:scale-90 disabled:opacity-20"
	>
		<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
			<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
		</svg>
	</button>
</div>
