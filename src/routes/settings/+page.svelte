<script lang="ts">
	import { store } from '$lib/store.svelte';
	import type { Features } from '$lib/store.svelte';

	let name = $state(store.settings.name);
	let startDate = $state(store.settings.startDate);
	let alcoholPath = $state<'none' | 'biweekly'>(store.settings.rules.alcohol.path);
	let streakThreshold = $state(store.settings.streakThreshold);
	let features = $state<Features>({ ...store.settings.features });
	let saved = $state(false);
	let showReset = $state(false);
	let featureLabOpen = $state(false);

	function save() {
		store.updateSettings({
			name,
			startDate,
			streakThreshold,
			rules: {
				alcohol: {
					path: alcoholPath,
					lastDrinkDate: store.settings.rules.alcohol.lastDrinkDate
				}
			},
			features
		});
		saved = true;
		setTimeout(() => (saved = false), 2000);
	}

	function resetAll() {
		if (typeof window !== 'undefined') {
			localStorage.clear();
			window.location.reload();
		}
	}
</script>

<div class="space-y-6 pt-2">
	<div>
		<h1 class="text-2xl font-black text-text">Settings</h1>
		<p class="text-sm text-text-muted">Configure your challenge</p>
	</div>

	<div class="space-y-4">
		<!-- Name -->
		<div class="rounded-2xl bg-surface-2 p-4">
			<label for="name" class="mb-2 block text-xs font-bold uppercase tracking-wider text-text-dim">Your Name</label>
			<input
				id="name"
				type="text"
				bind:value={name}
				placeholder="Enter your name"
				class="w-full rounded-xl border-2 border-surface-3 bg-surface-3 px-4 py-3 text-text placeholder-text-dim outline-none transition-all focus:border-accent-500"
			/>
		</div>

		<!-- Start Date -->
		<div class="rounded-2xl bg-surface-2 p-4">
			<label for="start-date" class="mb-2 block text-xs font-bold uppercase tracking-wider text-text-dim">Challenge Start Date</label>
			<input
				id="start-date"
				type="date"
				bind:value={startDate}
				class="box-border w-full max-w-full rounded-xl border-2 border-surface-3 bg-surface-3 px-4 py-3 text-text outline-none transition-all focus:border-accent-500"
			/>
		</div>

		<!-- Alcohol Path -->
		<div class="rounded-2xl bg-surface-2 p-4">
			<p class="mb-3 text-xs font-bold uppercase tracking-wider text-text-dim">Alcohol Rule</p>
			<div class="space-y-2">
				<button
					onclick={() => (alcoholPath = 'none')}
					class="flex w-full items-center gap-3 rounded-xl p-3 transition-all
						{alcoholPath === 'none' ? 'bg-accent-500/15 ring-1 ring-accent-500/30' : 'bg-surface-3'}"
				>
					<div class="flex h-5 w-5 items-center justify-center rounded-full
						{alcoholPath === 'none' ? 'bg-accent-500' : 'border-2 border-surface-4'}">
						{#if alcoholPath === 'none'}
							<div class="h-2 w-2 rounded-full bg-white"></div>
						{/if}
					</div>
					<div class="text-left">
						<p class="text-sm font-bold text-text">No Alcohol</p>
						<p class="text-xs text-text-muted">Zero alcohol for 75 days</p>
					</div>
				</button>
				<button
					onclick={() => (alcoholPath = 'biweekly')}
					class="flex w-full items-center gap-3 rounded-xl p-3 transition-all
						{alcoholPath === 'biweekly' ? 'bg-accent-500/15 ring-1 ring-accent-500/30' : 'bg-surface-3'}"
				>
					<div class="flex h-5 w-5 items-center justify-center rounded-full
						{alcoholPath === 'biweekly' ? 'bg-accent-500' : 'border-2 border-surface-4'}">
						{#if alcoholPath === 'biweekly'}
							<div class="h-2 w-2 rounded-full bg-white"></div>
						{/if}
					</div>
					<div class="text-left">
						<p class="text-sm font-bold text-text">Once Every 2 Weeks</p>
						<p class="text-xs text-text-muted">One drink allowed every 14 days</p>
					</div>
				</button>
			</div>
		</div>

		<!-- Streak Threshold -->
		<div class="rounded-2xl bg-surface-2 p-4">
			<div class="mb-2 flex items-center justify-between">
				<p class="text-xs font-bold uppercase tracking-wider text-text-dim">Streak Threshold</p>
				<span class="text-sm font-bold text-accent-400">{streakThreshold}%</span>
			</div>
			<p class="mb-3 text-[11px] text-text-muted">
				Count a day toward your streak if completion is at or above this percentage. Leave at 100% for strict mode.
			</p>
			<input
				type="range"
				min="50"
				max="100"
				step="1"
				bind:value={streakThreshold}
				class="w-full accent-accent-500"
			/>
		</div>

		<!-- Feature Lab -->
		<div class="rounded-2xl bg-surface-2">
			<button
				onclick={() => (featureLabOpen = !featureLabOpen)}
				class="flex w-full items-center justify-between p-4"
			>
				<div>
					<p class="text-xs font-bold uppercase tracking-wider text-text-dim">Feature Lab</p>
					<p class="text-[11px] text-text-muted">Experimental features</p>
				</div>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 text-text-dim transition-transform duration-200 {featureLabOpen ? 'rotate-180' : ''}"
					fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{#if featureLabOpen}
				<div class="space-y-2 border-t border-surface-3/50 px-4 pb-4 pt-3">
					<button
						onclick={() => (features.calendarShowCompletion = !features.calendarShowCompletion)}
						class="flex w-full items-center justify-between rounded-xl p-3 transition-all
							{features.calendarShowCompletion ? 'bg-accent-500/15 ring-1 ring-accent-500/30' : 'bg-surface-3'}"
					>
						<div class="text-left">
							<p class="text-sm font-bold text-text">Show Percentage</p>
							<p class="text-xs text-text-muted">Replace day numbers with completion % on the 75-day map</p>
						</div>
						<div
							class="relative ml-3 h-6 w-11 shrink-0 rounded-full transition-colors
								{features.calendarShowCompletion ? 'bg-accent-500' : 'bg-surface-4'}"
						>
							<div
								class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform
									{features.calendarShowCompletion ? 'translate-x-5' : 'translate-x-0.5'}"
							></div>
						</div>
					</button>
				</div>
			{/if}
		</div>

		<!-- Save Button -->
		<button
			onclick={save}
			class="w-full rounded-xl bg-accent-500 py-3.5 font-bold text-white shadow-lg shadow-accent-500/25 transition-all active:scale-[0.98]"
		>
			{saved ? '✓ Saved!' : 'Save Settings'}
		</button>

		<!-- Rules Section -->
		<div class="rounded-2xl bg-surface-2 p-4">
			<h3 class="mb-3 text-xs font-bold uppercase tracking-wider text-text-dim">The 75 Medium Rules</h3>
			<ul class="space-y-2.5 text-sm text-text">
				<li class="flex items-start gap-2.5">
					<span class="mt-0.5">👟</span>
					<span>Walk 10,000 steps every day</span>
				</li>
				<li class="flex items-start gap-2.5">
					<span class="mt-0.5">💧</span>
					<span>Drink 3L of water every day</span>
				</li>
				<li class="flex items-start gap-2.5">
					<span class="mt-0.5">💪</span>
					<span>Strength train daily (Sunday rest)</span>
				</li>
				<li class="flex items-start gap-2.5">
					<span class="mt-0.5">🚫</span>
					<span>No alcohol (or once every 2 weeks)</span>
				</li>
				<li class="flex items-start gap-2.5">
					<span class="mt-0.5">🥗</span>
					<span>No fried food for 75 days</span>
				</li>
			</ul>
		</div>

		<!-- Danger Zone -->
		<div class="rounded-2xl border border-rose-500/15 bg-rose-500/5 p-4">
			<h3 class="mb-2 text-xs font-bold uppercase tracking-wider text-rose-400">Danger Zone</h3>
			{#if !showReset}
				<button
					onclick={() => (showReset = true)}
					class="text-sm text-rose-400 underline underline-offset-2"
				>
					Reset all data
				</button>
			{:else}
				<p class="mb-3 text-xs text-text-muted">This will permanently delete all your progress. Are you sure?</p>
				<div class="flex gap-2">
					<button
						onclick={resetAll}
						class="rounded-lg bg-rose-500 px-4 py-2 text-sm font-bold text-white"
					>
						Yes, Reset
					</button>
					<button
						onclick={() => (showReset = false)}
						class="rounded-lg bg-surface-3 px-4 py-2 text-sm text-text-muted"
					>
						Cancel
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
