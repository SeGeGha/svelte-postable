<script>
	import { LOADING_STATUSES } from '../../utils/postable_list';

	export let plist;
	export let data;
	export let uri = null;
	export let operation = 'post';
	export let confirmBtnTitle = '';
	export let className = '';

	function run_action() {
		plist[operation]( data, uri );
	}
</script>

<button 
	type="button" 
	title={confirmBtnTitle} 
	class={`pbtn ${className}`} 
	disabled={LOADING_STATUSES.indexOf($plist.meta.status)!==-1} 
	on:click={run_action}
>
	<slot>X</slot>
</button>
