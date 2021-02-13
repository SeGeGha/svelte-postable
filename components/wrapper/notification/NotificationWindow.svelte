<script>
  import { slide } from 'svelte/transition';

  export let messages = [];
</script>

<style>
  .notification {
    width: 100%;
    max-width: 400px;
    background-color: rgb(239, 137, 137);
    font-weight: 600;
    text-align: justify;
  }

  .notification p{
    padding: 0.5rem;
  }
</style>

{#if messages.length > 0}
  <div class="notification" transition:slide|local>
    {#each messages as message, id (id)}
      <p>{message}</p>
    {/each}
  </div>
{/if}
