<script lang="ts">
	import { onMount } from 'svelte';

	let visible = $state(false);
	let platform = $state<'ios' | 'android' | 'desktop'>('desktop');
	let deferredPrompt = $state<any>(null);
	let step = $state(0);
	let closing = $state(false);

	const DISMISSED_KEY = '75m_install_dismissed';

	const iosSteps = [
		{ text: 'Tap the Share button', sub: 'at the bottom of Safari' },
		{ text: 'Tap "Add to Home Screen"', sub: 'scroll down in the share menu' },
		{ text: 'Tap "Add" to confirm', sub: "you'll find the app on your home screen" }
	];

	const androidSteps = [
		{ text: 'Tap the menu icon', sub: 'three dots at the top right' },
		{ text: 'Tap "Install app"', sub: 'or "Add to Home Screen"' },
		{ text: 'Confirm the install', sub: "you're all set!" }
	];

	function isStandalone(): boolean {
		return (
			window.matchMedia('(display-mode: standalone)').matches ||
			(window.navigator as any).standalone === true
		);
	}

	function detectPlatform(): 'ios' | 'android' | 'desktop' {
		const ua = navigator.userAgent.toLowerCase();
		if (/iphone|ipad|ipod/.test(ua)) return 'ios';
		if (/android/.test(ua)) return 'android';
		return 'desktop';
	}

	function dismiss() {
		closing = true;
		setTimeout(() => {
			visible = false;
			closing = false;
			localStorage.setItem(DISMISSED_KEY, 'true');
		}, 400);
	}

	async function installNative() {
		if (!deferredPrompt) return;
		deferredPrompt.prompt();
		const result = await deferredPrompt.userChoice;
		if (result.outcome === 'accepted') dismiss();
		deferredPrompt = null;
	}

	onMount(() => {
		if (isStandalone()) return;
		if (localStorage.getItem(DISMISSED_KEY)) return;

		platform = detectPlatform();

		if (platform !== 'desktop') {
			visible = true;
		}

		window.addEventListener('beforeinstallprompt', (e: Event) => {
			e.preventDefault();
			deferredPrompt = e;
			visible = true;
		});
	});
</script>

{#if visible}
	<button
		class="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm transition-opacity duration-400
			{closing ? 'opacity-0' : 'opacity-100'}"
		onclick={dismiss}
		aria-label="Dismiss"
	></button>

	<div
		class="fixed inset-x-0 bottom-0 z-101 mx-auto max-w-md transform transition-all duration-400 ease-out
			{closing ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}"
	>
		<div class="rounded-t-3xl bg-surface-2 px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
			<div class="mx-auto mb-5 h-1 w-10 rounded-full bg-surface-4"></div>

			<div class="mb-5 text-center">
				<div class="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-accent-500 to-warm-500 text-3xl font-black text-white shadow-lg shadow-accent-500/25">
					75
				</div>
				<h2 class="text-xl font-black text-text">Install 75 Medium</h2>
				<p class="mt-1 text-sm text-text-muted">Add to your home screen for the full experience</p>
			</div>

			<div class="mb-5 flex justify-center gap-6 text-center">
				<div>
					<div class="text-lg">&#9889;</div>
					<p class="text-[11px] font-semibold text-text-muted">Instant<br/>Launch</p>
				</div>
				<div>
					<div class="text-lg">&#128247;</div>
					<p class="text-[11px] font-semibold text-text-muted">Works<br/>Offline</p>
				</div>
				<div>
					<div class="text-lg">&#128241;</div>
					<p class="text-[11px] font-semibold text-text-muted">Native<br/>Feel</p>
				</div>
				<div>
					<div class="text-lg">&#128276;</div>
					<p class="text-[11px] font-semibold text-text-muted">No App<br/>Store</p>
				</div>
			</div>

			{#if deferredPrompt}
				<button
					onclick={installNative}
					class="mb-3 w-full rounded-xl bg-accent-500 py-3.5 font-bold text-white shadow-lg shadow-accent-500/25 transition-all active:scale-[0.98]"
				>
					Install App
				</button>
				<button onclick={dismiss} class="w-full py-2 text-sm text-text-muted">
					Maybe later
				</button>
			{:else}
				{@const steps = platform === 'ios' ? iosSteps : androidSteps}

				<div class="mb-4 space-y-3">
					{#each steps as s, i}
						<button
							class="flex w-full items-center gap-4 rounded-xl p-3 text-left transition-all duration-300
								{i <= step ? 'bg-accent-500/10 ring-1 ring-accent-500/20' : 'bg-surface-3/50'}"
							onclick={() => { if (step <= i) step = i; }}
						>
							<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black transition-all duration-300
								{i < step ? 'bg-mint-500 text-white' : i === step ? 'bg-accent-500 text-white' : 'bg-surface-3 text-text-dim'}">
								{#if i < step}
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
										<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
									</svg>
								{:else}
									{i + 1}
								{/if}
							</div>
							<div class="min-w-0">
								<p class="text-sm font-bold {i <= step ? 'text-text' : 'text-text-muted'}">{s.text}</p>
								<p class="text-xs text-text-muted">{s.sub}</p>
							</div>

							{#if i === 0 && platform === 'ios'}
								<svg class="ml-auto h-5 w-5 shrink-0 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
								</svg>
							{/if}
						</button>
					{/each}
				</div>

				<button
					onclick={() => { if (step < steps.length - 1) step++; else dismiss(); }}
					class="mb-2 w-full rounded-xl bg-accent-500 py-3.5 font-bold text-white shadow-lg shadow-accent-500/25 transition-all active:scale-[0.98]"
				>
					{step < steps.length - 1 ? 'Next' : 'Got it!'}
				</button>
				<button onclick={dismiss} class="w-full py-2 text-sm text-text-muted">
					Skip for now
				</button>
			{/if}
		</div>
	</div>
{/if}
