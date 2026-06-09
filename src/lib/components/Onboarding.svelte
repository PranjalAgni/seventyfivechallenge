<script lang="ts">
	import { store } from '$lib/store.svelte';

	interface Props {
		onComplete: () => void;
	}

	let { onComplete }: Props = $props();

	let step = $state(0);
	let name = $state('');
	let startDate = $state(store.today);
	let alcoholPath = $state<'none' | 'biweekly'>('none');

	const rules = [
		{ emoji: '👟', title: '10K Steps', desc: 'Walk ten thousand steps every single day' },
		{ emoji: '💧', title: '3L Water', desc: 'Drink 3 litres of water daily' },
		{ emoji: '💪', title: 'Strength Train', desc: 'Lift weights daily (Sunday rest)' },
		{ emoji: '🚫', title: 'No Alcohol', desc: 'Stay sober (or pick the biweekly path)' },
		{ emoji: '🥗', title: 'No Fried Food', desc: 'Clean eating for 75 days straight' }
	];

	function next() {
		if (step === 0) {
			step = 1;
		} else if (step === 1) {
			if (!name.trim()) return;
			step = 2;
		} else if (step === 2) {
			step = 3;
		} else {
			store.updateSettings({ name: name.trim(), startDate, rules: { alcohol: { path: alcoholPath, lastDrinkDate: null } } });
			onComplete();
		}
	}

	function back() {
		if (step > 0) step--;
	}

	const canProceed = $derived(step === 1 ? name.trim().length > 0 : true);
</script>

<div class="fixed inset-0 z-100 flex flex-col bg-surface">
	<div class="mx-auto flex w-full max-w-md flex-1 flex-col px-6">
		<!-- Progress dots -->
		<div class="flex items-center justify-center gap-2 pt-12 pb-8">
			{#each [0, 1, 2, 3] as i}
				<div class="h-1.5 rounded-full transition-all duration-500
					{i === step ? 'w-8 bg-accent-500' : i < step ? 'w-4 bg-accent-400/50' : 'w-4 bg-surface-3'}">
				</div>
			{/each}
		</div>

		<!-- Step content -->
		<div class="flex flex-1 flex-col">
			{#if step === 0}
				<!-- Welcome -->
				<div class="flex flex-1 flex-col items-center justify-center text-center">
					<div class="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-linear-to-br from-accent-500 to-warm-500 text-5xl font-black text-white shadow-xl shadow-accent-500/25">
						75
					</div>
					<h1 class="mb-2 text-3xl font-black text-text">75 Medium</h1>
					<p class="mb-2 text-lg font-semibold text-accent-400">The Challenge Starts Now</p>
					<p class="max-w-xs text-sm text-text-muted">75 days of discipline. No shortcuts. Track your habits, stay accountable, and prove to yourself what you're made of.</p>

					<div class="mt-10 grid grid-cols-5 gap-3">
						{#each rules as rule}
							<div class="flex flex-col items-center gap-1">
								<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 text-xl">
									{rule.emoji}
								</div>
								<span class="text-[10px] font-semibold text-text-muted">{rule.title}</span>
							</div>
						{/each}
					</div>
				</div>

			{:else if step === 1}
				<!-- Name -->
				<div class="flex flex-1 flex-col justify-center">
					<h2 class="mb-2 text-2xl font-black text-text">What's your name?</h2>
					<p class="mb-8 text-sm text-text-muted">So we can keep it personal</p>
					<input
						type="text"
						bind:value={name}
						placeholder="Your name"
						autofocus
						class="w-full border-b-2 border-surface-3 bg-transparent pb-3 text-2xl font-bold text-text placeholder-text-dim outline-none transition-colors focus:border-accent-500"
						onkeydown={(e) => { if (e.key === 'Enter' && canProceed) next(); }}
					/>
				</div>

			{:else if step === 2}
				<!-- Start date -->
				<div class="flex flex-1 flex-col justify-center">
					<h2 class="mb-2 text-2xl font-black text-text">When do you start?</h2>
					<p class="mb-8 text-sm text-text-muted">Pick your Day 1</p>
					<input
						type="date"
						bind:value={startDate}
						class="w-full rounded-2xl border-2 border-surface-3 bg-surface-2 px-4 py-4 text-lg font-semibold text-text outline-none transition-colors focus:border-accent-500"
					/>
					<p class="mt-3 text-xs text-text-muted">Tip: Choose today if you're ready to lock in right now</p>
				</div>

			{:else}
				<!-- Alcohol path -->
				<div class="flex flex-1 flex-col justify-center">
					<h2 class="mb-2 text-2xl font-black text-text">Alcohol rule?</h2>
					<p class="mb-8 text-sm text-text-muted">Choose your path — both are valid</p>
					<div class="space-y-3">
						<button
							onclick={() => (alcoholPath = 'none')}
							class="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all
								{alcoholPath === 'none' ? 'bg-accent-500/15 ring-2 ring-accent-500/40' : 'bg-surface-2'}"
						>
							<div class="flex h-12 w-12 items-center justify-center rounded-xl text-2xl
								{alcoholPath === 'none' ? 'bg-accent-500/20' : 'bg-surface-3'}">
								🚫
							</div>
							<div>
								<p class="font-bold text-text">Zero Alcohol</p>
								<p class="text-xs text-text-muted">Not a single drop for 75 days</p>
							</div>
							{#if alcoholPath === 'none'}
								<div class="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-accent-500">
									<svg class="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
										<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
									</svg>
								</div>
							{/if}
						</button>
						<button
							onclick={() => (alcoholPath = 'biweekly')}
							class="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all
								{alcoholPath === 'biweekly' ? 'bg-accent-500/15 ring-2 ring-accent-500/40' : 'bg-surface-2'}"
						>
							<div class="flex h-12 w-12 items-center justify-center rounded-xl text-2xl
								{alcoholPath === 'biweekly' ? 'bg-accent-500/20' : 'bg-surface-3'}">
								🍺
							</div>
							<div>
								<p class="font-bold text-text">Once Every 2 Weeks</p>
								<p class="text-xs text-text-muted">One drink allowed every 14 days</p>
							</div>
							{#if alcoholPath === 'biweekly'}
								<div class="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-accent-500">
									<svg class="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
										<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
									</svg>
								</div>
							{/if}
						</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Navigation -->
		<div class="flex gap-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
			{#if step > 0}
				<button
					onclick={back}
					class="rounded-xl bg-surface-2 px-6 py-3.5 font-bold text-text-muted transition-all active:scale-[0.97]"
				>
					Back
				</button>
			{/if}
			<button
				onclick={next}
				disabled={!canProceed}
				class="flex-1 rounded-xl py-3.5 font-bold text-white shadow-lg transition-all active:scale-[0.97] disabled:opacity-40 disabled:shadow-none
					{step === 3 ? 'bg-linear-to-r from-accent-500 to-warm-500 shadow-accent-500/25' : 'bg-accent-500 shadow-accent-500/25'}"
			>
				{step === 0 ? "Let's Go" : step === 3 ? 'Start Challenge' : 'Continue'}
			</button>
		</div>
	</div>
</div>
