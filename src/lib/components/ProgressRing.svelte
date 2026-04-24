<script lang="ts">
	interface Props {
		percentage: number;
		size?: number;
		strokeWidth?: number;
	}

	let { percentage, size = 120, strokeWidth = 8 }: Props = $props();

	const radius = $derived((size - strokeWidth) / 2);
	const circumference = $derived(2 * Math.PI * radius);
	const offset = $derived(circumference - (percentage / 100) * circumference);
	const uniqueId = $derived(`pg-${size}-${strokeWidth}`);
</script>

<div class="relative inline-flex items-center justify-center" style="width: {size}px; height: {size}px;">
	<svg class="-rotate-90" width={size} height={size}>
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke="var(--color-surface-3)"
			stroke-width={strokeWidth}
		/>
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke="url(#{uniqueId})"
			stroke-width={strokeWidth}
			stroke-linecap="round"
			stroke-dasharray={circumference}
			stroke-dashoffset={offset}
			class="transition-all duration-700 ease-out"
		/>
		<defs>
			<linearGradient id={uniqueId} x1="0%" y1="0%" x2="100%" y2="0%">
				<stop offset="0%" stop-color="var(--color-accent-500)" />
				<stop offset="100%" stop-color="var(--color-warm-400)" />
			</linearGradient>
		</defs>
	</svg>
	<div class="absolute flex flex-col items-center">
		<span class="text-2xl font-black text-text">{Math.round(percentage)}%</span>
	</div>
</div>
