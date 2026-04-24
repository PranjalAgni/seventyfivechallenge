<script lang="ts">
	import { store } from '$lib/store.svelte';

	interface Props {
		emoji: string;
		title: string;
		subtitle: string;
		field: 'steps' | 'workout' | 'noAlcohol' | 'noFriedFood';
		disabled?: boolean;
	}

	let { emoji, title, subtitle, field, disabled = false }: Props = $props();

	const log = $derived(store.peekLog(store.today));
	const checked = $derived(log[field] as boolean);

	function toggle() {
		if (disabled) return;
		store.updateLog(store.today, { [field]: !checked });
	}
</script>

<button
	onclick={toggle}
	class="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all duration-300 active:scale-[0.97]
		{checked
			? 'bg-mint-500/10 ring-1 ring-mint-500/20'
			: 'bg-surface-2'}
		{disabled ? 'opacity-40' : ''}"
	{disabled}
>
	<div class="flex h-12 w-12 items-center justify-center rounded-xl text-2xl
		{checked ? 'bg-mint-500/15' : 'bg-surface-3'}">
		{emoji}
	</div>
	<div class="flex-1">
		<h3 class="font-bold {checked ? 'text-mint-400' : 'text-text'}">{title}</h3>
		<p class="text-xs text-text-muted">{subtitle}</p>
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
