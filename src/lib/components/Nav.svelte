<script lang="ts">
	import { page } from '$app/state';
</script>

<nav class="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-surface-3/50 bg-surface/80 backdrop-blur-xl">
	<div class="flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
		<a
			href="/"
			class="flex flex-col items-center gap-0.5 px-4 py-1 transition-colors {page.url.pathname === '/' ? 'text-accent-400' : 'text-text-dim'}"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
			</svg>
			<span class="text-[10px] font-semibold">Today</span>
		</a>
		<a
			href="/progress"
			class="flex flex-col items-center gap-0.5 px-4 py-1 transition-colors {page.url.pathname === '/progress' ? 'text-accent-400' : 'text-text-dim'}"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
			</svg>
			<span class="text-[10px] font-semibold">Progress</span>
		</a>
		<a
			href="/settings"
			class="flex flex-col items-center gap-0.5 px-4 py-1 transition-colors {page.url.pathname === '/settings' ? 'text-accent-400' : 'text-text-dim'}"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
			</svg>
			<span class="text-[10px] font-semibold">Settings</span>
		</a>
	</div>
</nav>
