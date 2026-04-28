<script>
	import game from '@sudoku/game';
	import { gameStore } from '@sudoku/stores/gameStore';
	import { hints } from '@sudoku/stores/hints';
	import { notes } from '@sudoku/stores/notes';
	import { settings } from '@sudoku/stores/settings';
	import { keyboardDisabled } from '@sudoku/stores/keyboard';
	import { cursor } from '@sudoku/stores/cursor';
	import { userGrid } from '@sudoku/stores/grid';
	import { gamePaused } from '@sudoku/stores/game';

	$: hintsAvailable = $hints > 0;
	$: hasCursor = $cursor.x !== null && $cursor.y !== null;
	$: cursorEmpty = hasCursor && $userGrid[$cursor.y][$cursor.x] === 0;

	function handleUndo() {
		if ($gamePaused) return;
		game.undo();
	}

	function handleRedo() {
		if ($gamePaused) return;
		game.redo();
	}

	function handleCandidatesHint() {
		if ($gamePaused || !hintsAvailable || !hasCursor || !cursorEmpty) return;

		const hint = gameStore.requestCellHint($cursor.y, $cursor.x);
		if (hint) {
			hints.useHint();
		}
	}

	function handleNextHint() {
		if ($gamePaused || !hintsAvailable) return;

		const hint = gameStore.requestNextHint();
		if (hint) {
			hints.useHint();
		}
	}

	function handleEnterExplore() {
		if ($gamePaused) return;
		game.enterExplore();
	}

	function handleCommitExplore() {
		if ($gamePaused) return;
		game.commitExplore();
	}

	function handleAbortExplore() {
		if ($gamePaused) return;
		game.abortExplore();
	}
</script>

<div class="action-buttons space-x-3">
	<button
		class="btn btn-round"
		disabled={$gamePaused || !$gameStore.canUndo}
		title="Undo"
		on:click={handleUndo}
	>
		<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
		</svg>
	</button>

	<button
		class="btn btn-round"
		disabled={$gamePaused || !$gameStore.canRedo}
		title="Redo"
		on:click={handleRedo}
	>
		<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 90 00-8 8v2M21 10l-6 6m6-6l-6-6" />
		</svg>
	</button>

	<button
		class="btn btn-round btn-badge"
		disabled={$keyboardDisabled || !hintsAvailable || !cursorEmpty}
		title="Candidates Hint"
		on:click={handleCandidatesHint}
	>
		C
		{#if $settings.hintsLimited}
			<span class="badge" class:badge-primary={hintsAvailable}>{$hints}</span>
		{/if}
	</button>

	<button
		class="btn btn-round btn-badge"
		disabled={$gamePaused || !hintsAvailable}
		title="Next Hint"
		on:click={handleNextHint}
	>
		H
		{#if $settings.hintsLimited}
			<span class="badge" class:badge-primary={hintsAvailable}>{$hints}</span>
		{/if}
	</button>

	{#if !$gameStore.exploring}
		<button
			class="btn btn-round"
			disabled={$gamePaused}
			title="Enter Explore"
			on:click={handleEnterExplore}
		>
			E
		</button>
	{:else}
		<button
			class="btn btn-round"
			disabled={$gamePaused || !$gameStore.canCommitExplore}
			title="Commit Explore"
			on:click={handleCommitExplore}
		>
			OK
		</button>

		<button
			class="btn btn-round"
			disabled={$gamePaused || !$gameStore.canAbortExplore}
			title="Abort Explore"
			on:click={handleAbortExplore}
		>
			X
		</button>
	{/if}

	<button class="btn btn-round btn-badge" on:click={notes.toggle} title="Notes ({$notes ? 'ON' : 'OFF'})">
		<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
		</svg>

		<span class="badge tracking-tighter" class:badge-primary={$notes}>{$notes ? 'ON' : 'OFF'}</span>
	</button>
</div>

{#if $gameStore.exploring}
	<div class="explore-banner" class:explore-failed={$gameStore.exploreFailed}>
		{#if $gameStore.exploreFailed}
			Explore failed: current explore path has conflict or matches a known failed state.
		{:else}
			Explore mode is active.
		{/if}
	</div>
{/if}

<style>
	.action-buttons {
		@apply flex flex-wrap justify-evenly self-end;
	}

	.btn-badge {
		@apply relative;
	}

	.badge {
		min-height: 20px;
		min-width: 20px;
		@apply p-1 rounded-full leading-none text-center text-xs text-white bg-gray-600 inline-block absolute top-0 left-0;
	}

	.badge-primary {
		@apply bg-primary;
	}

	.explore-banner {
		@apply mt-3 text-xs text-center text-primary;
	}

	.explore-failed {
		@apply text-red-600 font-semibold;
	}
</style>
