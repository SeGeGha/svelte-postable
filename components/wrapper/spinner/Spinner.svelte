<script>
	export let color = '#000';
	export let size = '2rem';
	export let weight = '0.2rem';

	// SPINNER VIEWS
	export let isRotatingSquare = false;
	export let isDoubleBounce = false;
	export let isStretchDelay = false;
	export let isWaterDrop = false;
</script>

<style>
	.spinner-container {
		position: relative;
	}

	/* SPINNER ROTATING SQUARE */
	.spinner-rotating-square {
		animation: sk-rotateplane 1.2s infinite ease-in-out;
	}

	/* SPINNER DOUBLE BOUNCE */
	.spinner-dbounce > .spinner-item {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		opacity: 0.6;
		animation: sk-bounce 2.0s infinite ease-in-out;
	}

	.spinner-dbounce > .spinner-item:last-child {
		animation-delay: -1.0s;
	}

	/* SPINNER STRETCH DELAY */
	.spinner-stretch-delay {
		text-align: center;
		font-size: 0.625rem;
	}

	.spinner-stretch-delay > div {
		display: inline-block;
		height: 100%;
		width: 15%;
		animation: sk-stretchdelay 1.2s infinite ease-in-out;
	}

	.spinner-stretch-delay .spinner-item:nth-child(2) {
		animation-delay: -1.1s;
	}

	.spinner-stretch-delay .spinner-item:nth-child(3) {
		animation-delay: -1.0s;
	}

	.spinner-stretch-delay .spinner-item:nth-child(4) {
		animation-delay: -0.9s;
	}

	.spinner-stretch-delay .spinner-item:nth-child(5) {
		animation-delay: -0.8s;
	}

	/* SPINNER DOUBLE BOUNCE */
	.spinner-water-drop {
		border-radius: 100%;  
		animation: sk-scaleout 1.0s infinite ease-in-out;
	}

	@keyframes sk-rotateplane {
		0% { 
			transform: perspective(120px) rotateX(0deg) rotateY(0deg);
		} 50% { 
			transform: perspective(120px) rotateX(-180.1deg) rotateY(0deg);
		} 100% { 
			transform: perspective(120px) rotateX(-180deg) rotateY(-179.9deg);
		}
	}

	/* SPINNER CIRCLE */
	.spinner-circle {
		display: block;
		text-align: center;
	}

	.spinner-circle > .spinner-item {
		box-sizing: content-box;
		display: inline-block;
		border-radius: 50%;
		border-style: solid;
		animation: lds-dual-ring 1.2s linear infinite;
	}

	@keyframes sk-bounce {
		0%, 100% { 
			transform: scale(0.0);
		} 50% { 
			transform: scale(1.0);
		}
	}

	@keyframes sk-stretchdelay {
		0%, 
		40%, 
		100% { 
			transform: scaleY(0.4);
		}  20% { 
			transform: scaleY(1.0);
		}
	}

	@keyframes sk-scaleout {
		0% { 
			transform: scale(0);
		} 
		100% {
			transform: scale(1.0);
			opacity: 0;
		}
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

{#if isRotatingSquare}
	<div class="spinner-container spinner-rotating-square" style={`width: ${size}; height: ${size}; background-color: ${color};`}></div>
{:else if isDoubleBounce}
	<div class="spinner-container spinner-dbounce" style={`width: ${size}; height: ${size};`}>
		<div class="spinner-item" style={`background-color: ${color};`}></div>
		<div class="spinner-item" style={`background-color: ${color};`}></div>
	</div>
{:else if isStretchDelay}
	<div class="spinner-container spinner-stretch-delay" style={`width: calc(1.25 * ${size}); height: ${size};`}>
		<div class="spinner-item" style={`background-color: ${color};`}></div>
		<div class="spinner-item" style={`background-color: ${color};`}></div>
		<div class="spinner-item" style={`background-color: ${color};`}></div>
		<div class="spinner-item" style={`background-color: ${color};`}></div>
		<div class="spinner-item" style={`background-color: ${color};`}></div>
	</div>
{:else if isWaterDrop}
	<div class="spinner-container spinner-water-drop" style={`width: ${size}; height: ${size}; background-color: ${color};`}></div>
{:else}
	<div class="spinner-container spinner-circle">
		<div class="spinner-item" style={`width: ${size}; height: ${size}; border-width: ${weight}; border-color: ${color} transparent ${color} transparent;`}></div>
	</div>
{/if}
