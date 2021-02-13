<script lang="ts">
	export let name: string;
	export let schemaItem: any;
	export let required: boolean = false;
	export let formStore: any;
	export let errors: any[] | null = null;

	import Input from './fields/Input.svelte'

	const fields = {
		'string' : Input
	}

	const props = {
		type    : schemaItem.format || schemaItem.type,
		id      : 'pff_' + name,
		name    : name,
		required: required,
		autofocus: schemaItem.autofocus,
		placeholder: schemaItem.placeholder || schemaItem.title || '',
	};
	const field = fields[schemaItem.type] || 'unknown field type ' + schemaItem.type;
</script>

{#if schemaItem}
	{#if schemaItem.type == 'object' || schemaItem.type == 'array'}
		<fieldset>
			<legend>{schemaItem.title}</legend>

			{#if schemaItem.description}
				<div class="pform__item__description">{schemaItem.description}</div>
			{/if}

			<slot>A field is not implemented</slot>

			{#if errors && errors.length}
				{#each errors as error}
					<div class="profm__item__error">{error.message}</div>
				{/each}
			{/if}
		</fieldset>
	{:else if schemaItem.format === 'hidden' }
		<svelte:component this={field} {...props} {formStore} />
	{:else}
		<div class="pform__field">
			{#if schemaItem.title}
				<label for={props.id} class="pform__field__label">{schemaItem.title}</label>
			{/if}

			<svelte:component this={field} {...props} {formStore} />

			{#if errors && errors.length}
				{#each errors as error}
					<div class="pform__item__error">
						{#if error.constraints }
							{#each Object.entries(error.constraints) as [type,message]}
								<div>{message}</div>
							{/each}
						{:else}
							{ error.message || "Error" }
						{/if}
					</div>
				{/each}
			{/if}

			{#if schemaItem.description}
				<div class="pform__item__description">{schemaItem.description}</div>
			{/if}
		</div>
	{/if}
{/if}




