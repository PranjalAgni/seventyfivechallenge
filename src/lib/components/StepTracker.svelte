<script lang="ts">
	import { store } from '$lib/store.svelte';

	interface Props {
		date: string;
	}

	let { date }: Props = $props();

	const log = $derived(store.peekLog(date));
	const checked = $derived(log.steps);
	const pct = $derived(Math.min(100, Math.round((log.stepCount / 10000) * 100)));

	let editing = $state(false);
	let inputValue = $state('');

	function startEditing() {
		inputValue = log.stepCount > 0 ? String(log.stepCount) : '';
		editing = true;
	}

	function commitSteps() {
		const val = parseInt(inputValue.replace(/\D/g, ''), 10) || 0;
		store.updateLog(date, { stepCount: val });
		editing = false;
	}

	function formatSteps(n: number): string {
		if (n === 0) return '0';
		return n.toLocaleString();
	}

	function quickAdd(amount: number) {
		const current = log.stepCount || 0;
		store.updateLog(date, { stepCount: current + amount });
	}
</script>

<div
	class="rounded-2xl p-4 transition-all duration-300
		{checked ? 'bg-mint-500/10 ring-1 ring-mint-500/20' : 'bg-surface-2'}"
>
	<div class="flex items-center gap-4">
		<div class="flex h-12 w-12 items-center justify-center rounded-xl text-2xl
			{checked ? 'bg-mint-500/15' : 'bg-surface-3'}">
			👟
		</div>
		<div class="flex-1">
			<div class="flex items-center gap-2">
				<h3 class="font-bold {checked ? 'text-mint-400' : 'text-text'}">10K Steps</h3>
				{#if checked}
					<span class="rounded-full bg-mint-500/20 px-2 py-0.5 text-[10px] font-bold text-mint-400">DONE</span>
				{/if}
			</div>
			<p class="text-xs text-text-muted">
				{#if log.stepCount > 0}
					{formatSteps(log.stepCount)} / 10,000 steps
				{:else}
					Tap to log your steps
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
	</div>

	{#if log.stepCount > 0 || editing}
		<div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
			<div
				class="h-full rounded-full transition-all duration-500
					{checked ? 'bg-mint-500' : 'bg-accent-500/60'}"
				style="width: {pct}%"
			></div>
		</div>
	{/if}

	{#if editing}
		<div class="mt-3 flex items-center gap-2">
			<input
				type="text"
				inputmode="numeric"
				pattern="[0-9]*"
				bind:value={inputValue}
				placeholder="Enter steps..."
				autofocus
				class="flex-1 rounded-lg border-2 border-surface-3 bg-surface-3 px-3 py-2 text-sm font-semibold text-text outline-none transition-colors focus:border-accent-500"
				onkeydown={(e) => { if (e.key === 'Enter') commitSteps(); }}
			/>
			<button
				onclick={commitSteps}
				class="rounded-lg bg-accent-500 px-4 py-2 text-sm font-bold text-white transition-all active:scale-95"
			>
				Save
			</button>
		</div>
	{:else}
		<div class="mt-3 flex items-center gap-2">
			<button
				onclick={startEditing}
				class="flex-1 rounded-lg bg-surface-3 py-2 text-center text-sm font-semibold text-text-muted transition-all active:scale-[0.97]"
			>
				{log.stepCount > 0 ? formatSteps(log.stepCount) + ' steps — edit' : 'Enter step count'}
			</button>
			<button
				onclick={() => quickAdd(1000)}
				class="rounded-lg bg-surface-3 px-3 py-2 text-xs font-bold text-text-muted transition-all active:scale-95"
			>
				+1K
			</button>
			<button
				onclick={() => quickAdd(5000)}
				class="rounded-lg bg-surface-3 px-3 py-2 text-xs font-bold text-text-muted transition-all active:scale-95"
			>
				+5K
			</button>
		</div>
	{/if}
</div>
