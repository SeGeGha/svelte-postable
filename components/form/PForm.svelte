<script type="ts">
	import { writable } from "svelte/store";
	import { createEventDispatcher, onDestroy } from "svelte";

	import type { PostableListStore } from "../../utils/postable_list";
	import { MetaStatus, LOADING_STATUSES } from "../../utils/postable_list";
	import PField from "./PField.svelte";

	export let id: null; // if editing -- specify id, it will be appended to the post body as well as fields extracted from the plist by this id; if not set -- will mean a new object
	export let plist: PostableListStore;
	export let errorOutput: Boolean = true;
	export let schema: any;
	export let action: string = null; // if differs from the plist default url
	export let className: string = "";

	const dispatch = createEventDispatcher();

	const FORM_BTN = ["submit", "cancel", "reset"];

	let formObj = {};
	let formStore;
	let success_message = null;

	function id_condition() {
		return (!id || !$plist.meta.subj_ids ||	$plist.meta.subj_ids.indexOf(id) !== -1);
	}

	function deep_copy(obj) {
		return JSON.parse(JSON.stringify(obj));
	}

	if (id) {
		formObj.id = id;
		const by_id = $plist.data.length && $plist.data.find((d) => d.id == id);

		if (by_id) {
			formObj = deep_copy(by_id) || { id: id };
		}
	}

	if ("properties" in schema) {
		for (const n in schema.properties) {
			if (!(n in formObj) && FORM_BTN.indexOf(n) === -1) {
				formObj[n] = schema.properties[n].default || undefined;
			}
		}
		formStore = writable(deep_copy(formObj));
	} else {
		throw Error('Form schema error, no first-level "properties" object');
	}

	function submit() {
		success_message = null;
		plist.post($formStore, action);
		// event dispatches on post finish, see below
	}

	function cancel() {
		success_message = null;
		plist.to_stable();
		dispatch("cancel");
	}

	function _reset_internal() {
		success_message = null;
		formStore.set(deep_copy(formObj));
	}

	function reset() {
		plist.to_stable();
		_reset_internal();
	}

	const submit_dispatch_unsubscribe = plist.subscribe((pl) => {
		if (
			pl.meta.status === MetaStatus.Loaded &&
			pl.meta.prev_status() === MetaStatus.Posting
		) {
			// -- if notification to form has been catched

			if (pl.extra && pl.extra.form_reset) {
				_reset_internal();
			}

			if (pl.extra && pl.extra.form_success_message) {
				success_message = pl.extra.form_success_message;
			}

			dispatch("submit");
		}
	});

	onDestroy(submit_dispatch_unsubscribe);
</script>

<form
	method="post"
	action={action || plist.get_default_url()}
	class={`pform ${className}`}
	on:submit|preventDefault={submit}
	on:reset|preventDefault={reset}
>
	{#if schema.title}
		<h2 class="pform__title">{schema.title}</h2>
	{/if}

	{#if id_condition() && errorOutput && $plist.meta.error}
		<div class="pform__error">
			{$plist.meta.error}
		</div>
	{/if}

	{#if id_condition() && success_message}
		<div class="pform__success">
			{success_message}
		</div>
	{/if}

	{#each Object.entries(schema.properties).filter((en) => FORM_BTN.indexOf(en[0]) === -1) as [name, schemaItem]}
		<PField
			{name}
			{schemaItem}
			{formStore}
			required={schema.required && schema.required.indexOf(name) !== -1}
			errors={(id_condition() &&
				$plist.meta.status === MetaStatus.ValidationError &&
				$plist.meta.error_validation.filter((ev) => ev.property === name)) || null}
		/>
	{/each}
	<div class="pform__buttons">
		<button
			type="submit"
			class="pform__buttons--submit"
			name="submit"
			disabled={LOADING_STATUSES.indexOf($plist.meta.status) !== -1}
		>
			{("submit" in schema.properties &&
				schema.properties.submit.title) ||
				"Submit"}
		</button>

		{#if "cancel" in schema.properties}
			<button
				type="button"
				class="pform__buttons--cancel"
				name="cancel"
				disabled={LOADING_STATUSES.indexOf($plist.meta.status) !== -1}
				on:click={cancel}
			>
				{schema.properties.cancel.title || "Cancel"}
			</button>
		{/if}
	</div>
</form>
