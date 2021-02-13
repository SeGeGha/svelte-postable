<script lang="typescript">
	import LoadingMore from './loadingMoreBtn/LoadingMore.svelte';
	import Spinner from './spinner/Spinner.svelte';
	import NotificationWindow from './notification/NotificationWindow.svelte';

	import { MetaStatus } from '../../utils/postable_list';

	export let plist;
	export let hasLoadingMore = false;

	$: isOpenned = $plist.meta.status === MetaStatus.Error;

	function closeNotification() {
		isOpenned = false;
	}

	function load_more() {
		plist.more();
	}
</script>

<style>
	.fixed-container {
		z-index: 3;
		position: fixed;
		top: 0;
		left: 50%;
    	transform: translateX(-50%);
	}

	.error-container {
		background-color: rgb(239, 137, 137);
	}

	.error-container > .btn-close {
		display: block;
		margin: 0 auto 0.2em;
		background-color: transparent;
		font-size: 1rem;
	}

</style>

{#if $plist.meta.status === MetaStatus.Uninitialized || $plist.meta.status === MetaStatus.Getting }
	<Spinner isWaterDrop />
{:else}
	{#if $plist.data && $plist.data.length > 0}
		<slot></slot>

		{#if hasLoadingMore}
			<LoadingMore isDataLoading={$plist.meta.status === MetaStatus.LoadingMore} on:loadMore={load_more} />
		{/if}
	{:else}
		<h2>No items</h2>
	{/if}
{/if}

{#if $plist.meta.status === MetaStatus.Posting}
	<div class="fixed-container">
		<Spinner />
	</div>
{/if}

{#if isOpenned}
	<div class="fixed-container error-container">
		<NotificationWindow messages={[$plist.meta.error]} />

		<button type="button" class="btn-close" on:click|stopPropagation={closeNotification}>✖</button>
	</div>
{/if}
