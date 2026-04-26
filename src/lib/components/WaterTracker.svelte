<script lang="ts">
	import { store } from '$lib/store.svelte';

	interface Props {
		date: string;
	}

	let { date }: Props = $props();

	const log = $derived(store.peekLog(date));
	const percentage = $derived(Math.min(100, Math.round((log.water / 12) * 100)));
	const liters = $derived((log.water * 0.25).toFixed(2));

	function add() {
		store.addWater(date);
	}

	function remove() {
		store.removeWater(date);
	}
</script>

<div class="relative overflow-hidden rounded-2xl bg-surface-2 p-5">
	<div
		class="pointer-events-none absolute inset-0 bg-linear-to-t from-sky-500/15 to-transparent transition-all duration-500 ease-out"
		style="height: {percentage}%; bottom: 0; top: auto;"
	></div>

	<div class="relative z-10">
		<div class="mb-3 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<span class="text-2xl">💧</span>
				<h3 class="font-bold text-text">Water</h3>
			</div>
			<span class="rounded-full bg-sky-500/15 px-3 py-0.5 text-xs font-bold text-sky-400">
				{liters}L / 3L
			</span>
		</div>

		<div class="mb-3 flex items-center gap-1.5">
			{#each Array(12) as _, i}
				<div
					class="h-6 flex-1 rounded-full transition-all duration-300 {i < log.water
						? 'bg-sky-400 shadow-sm shadow-sky-400/20'
						: 'bg-surface-3'}"
				></div>
			{/each}
		</div>

		<div class="flex items-center justify-between">
			<span class="text-sm text-text-muted">{log.water}/12 glasses</span>
			<div class="flex gap-2">
				<button
					onclick={remove}
					class="flex h-9 w-9 items-center justify-center rounded-full bg-surface-3 text-lg font-bold text-text-muted transition-all active:scale-90"
				>
					-
				</button>
				<button
					onclick={add}
					class="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-lg font-bold text-white shadow-lg shadow-sky-500/25 transition-all active:scale-90"
				>
					+
				</button>
			</div>
		</div>
	</div>
</div>
