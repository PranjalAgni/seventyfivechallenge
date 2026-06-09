<script lang="ts">
	import { store } from '$lib/store.svelte';

	interface Props {
		date: string;
	}

	let { date }: Props = $props();

	const log = $derived(store.peekLog(date));
	const settings = $derived(store.settings);
	const canDrink = $derived(store.canDrinkAlcohol(date));
	const isBiweekly = $derived(settings.rules.alcohol.path === 'biweekly');

	function markDrunk() {
		store.markAlcoholDrunk(date);
	}

	function toggleNoAlcohol() {
		store.updateLog(date, { noAlcohol: !log.noAlcohol });
	}

	function getDaysSinceLastDrink(): string {
		if (!settings.rules.alcohol.lastDrinkDate) return 'Never';
		const last = new Date(settings.rules.alcohol.lastDrinkDate + 'T12:00:00');
		const sel = new Date(date + 'T12:00:00');
		const days = Math.floor((sel.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
		return `${days}d ago`;
	}
</script>

{#if isBiweekly}
	<div class="rounded-2xl bg-surface-2 p-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-3 text-2xl">
					🍺
				</div>
				<div>
					<h3 class="font-bold text-text">Alcohol</h3>
					<p class="text-xs text-text-muted">
						{#if canDrink}
							Free pass available!
						{:else}
							Last drink: {getDaysSinceLastDrink()}
						{/if}
					</p>
				</div>
			</div>
			{#if canDrink}
				<button
					onclick={markDrunk}
					class="rounded-full bg-warm-500/15 px-3 py-1.5 text-xs font-bold text-warm-400 transition-all active:scale-95"
				>
					Use Pass
				</button>
			{:else}
				<div class="flex h-7 w-7 items-center justify-center rounded-full bg-mint-500 shadow-lg shadow-mint-500/30">
					<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<button
		onclick={toggleNoAlcohol}
		class="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all duration-300 active:scale-[0.97]
			{log.noAlcohol
				? 'bg-mint-500/10 ring-1 ring-mint-500/20'
				: 'bg-surface-2'}"
	>
		<div class="flex h-12 w-12 items-center justify-center rounded-xl text-2xl
			{log.noAlcohol ? 'bg-mint-500/15' : 'bg-surface-3'}">
			🚫
		</div>
		<div class="flex-1">
			<h3 class="font-bold {log.noAlcohol ? 'text-mint-400' : 'text-text'}">No Alcohol</h3>
			<p class="text-xs text-text-muted">Stay clean today</p>
		</div>
		<div class="flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300
			{log.noAlcohol ? 'bg-mint-500 shadow-lg shadow-mint-500/30' : 'border-2 border-surface-4'}">
			{#if log.noAlcohol}
				<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
					<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
				</svg>
			{/if}
		</div>
	</button>
{/if}
