<script>
	export let type = 'text';
	export let id = '';
	export let name = '';
	export let autofocus = false;
	export let placeholder = '';
	export let required = false;

	export let formStore;

	/* Attribute 'autofocus' doesn't work in Google Chrome (maybe a reason is input wrapper)
	   https://github.com/vuetifyjs/vuetify/issues/10102
	   Need to use onMount or use:action with nodeElem.focus() 
	*/
	function on_focus(node) {
		if (autofocus) {
			node.focus();
		}
	}
</script>

{#if type == 'date-time'}
	<input type="datetime" {id} {name} {placeholder} {required} use:on_focus bind:value={$formStore[name]} />
{:else if type == 'date'}
	<input type="date" {id} {name} {placeholder} {required} use:on_focus bind:value={$formStore[name]} />
{:else if type == 'time'}
	<input type="time" {id} {name} {placeholder} {required} use:on_focus bind:value={$formStore[name]} />
{:else if type == 'email'}
	<input type="email" {id} {name} {placeholder} {required} use:on_focus bind:value={$formStore[name]} />
{:else if type == 'password'}
	<input type="password" {id} {name} {placeholder} {required} use:on_focus bind:value={$formStore[name]} />
{:else if type == 'hidden'}
	<input type="hidden" {id} {name} {placeholder} {required} use:on_focus bind:value={$formStore[name]} />
{:else}
	<input type="text" {id} {name} {placeholder} {required} use:on_focus bind:value={$formStore[name]} />
{/if}
