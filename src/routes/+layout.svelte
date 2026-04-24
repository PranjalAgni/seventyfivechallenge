<script lang="ts">
	import '../app.css';
	import Nav from '$lib/components/Nav.svelte';
	import InstallPrompt from '$lib/components/InstallPrompt.svelte';
	import Onboarding from '$lib/components/Onboarding.svelte';
	import { store } from '$lib/store.svelte';

	let { children } = $props();
	let showOnboarding = $state(false);

	$effect(() => {
		if (typeof window !== 'undefined' && !store.settings.name) {
			showOnboarding = true;
		}
	});

	function completeOnboarding() {
		showOnboarding = false;
	}
</script>

<svelte:head>
	<title>75 Medium</title>
</svelte:head>

{#if showOnboarding}
	<Onboarding onComplete={completeOnboarding} />
{:else}
	<div class="mx-auto flex min-h-dvh max-w-md flex-col bg-surface">
		<main class="flex-1 overflow-y-auto px-4 pt-4 pb-24">
			{@render children()}
		</main>
		<Nav />
	</div>
	<InstallPrompt />
{/if}
