<script lang='typescript'>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let isDataLoading; 

	function handleClick() {
		dispatch('loadMore');
	}
</script>

<style>
	.spinner-container {
		display: block;
		text-align: center;
	}

	.spinner {
		box-sizing: content-box;
		display: inline-block;
		width: 2rem;
		height: 2rem;
		border-width: 0.2rem;
		border-color: #000 transparent #000 transparent;
		border-radius: 50%;
		border-style: solid;
		animation: lds-dual-ring 1.2s linear infinite;
	}

	.btn-more {
		margin: 0 auto;
		display: block;
		padding: 0.75rem 1.25rem;
		font-size: 0.875rem;
		line-height: 125%;
	}

	@keyframes lds-dual-ring {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>

{#if isDataLoading }
	<div class="spinner-container">
		<div class="spinner"></div>
	</div>
{:else}
	<button class="btn-more btn-confirm" type="button" on:click={handleClick}>More</button>
{/if}

