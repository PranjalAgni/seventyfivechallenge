<script lang="ts">
	import { store } from '$lib/store.svelte';

	const log = $derived(store.peekLog(store.today));
	let expanded = $state(false);
	let text = $state('');
	let saveTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		text = log.notes || '';
	});

	function onInput() {
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			store.updateLog(store.today, { notes: text });
		}, 600);
	}

	function toggle() {
		expanded = !expanded;
		if (!expanded && text !== (log.notes || '')) {
			store.updateLog(store.today, { notes: text });
		}
	}
</script>

<div class="rounded-2xl bg-surface-2 transition-all duration-300">
	<button
		onclick={toggle}
		class="flex w-full items-center gap-4 p-4 text-left transition-all active:scale-[0.97]"
	>
		<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-3 text-2xl">
			📝
		</div>
		<div class="flex-1">
			<h3 class="font-bold text-text">Journal</h3>
			<p class="text-xs text-text-muted">
				{#if log.notes}
					{log.notes.length > 40 ? log.notes.slice(0, 40) + '...' : log.notes}
				{:else}
					How was your day? (optional)
				{/if}
			</p>
		</div>
		<svg
			class="h-5 w-5 text-text-dim transition-transform duration-300 {expanded ? 'rotate-180' : ''}"
			fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if expanded}
		<div class="border-t border-surface-3/50 px-4 pb-4 pt-3">
			<textarea
				bind:value={text}
				oninput={onInput}
				placeholder="How are you feeling? What went well? Any wins today?"
				rows={3}
				class="w-full resize-none rounded-xl border-2 border-surface-3 bg-surface-3 px-3 py-2.5 text-sm text-text placeholder-text-dim outline-none transition-colors focus:border-accent-500"
			></textarea>
			<p class="mt-1.5 text-right text-[10px] text-text-dim">Auto-saves as you type</p>
		</div>
	{/if}
</div>
