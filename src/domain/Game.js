
import { Sudoku } from './Sudoku.js';
export { Game } from '../node_modules/@sudoku/domain/Game.js';
function cloneHint(hint) {
	if (!hint) return null;
	return {
		...hint,
		candidates: hint.candidates ? [...hint.candidates] : [],
	};
}

export class Game {
	constructor(sudoku) {
		this._currentSudoku = sudoku.clone();
		this._past = [];
		this._future = [];

		this._explore = null;
		this._failedExploreStates = new Set();

		this._currentHint = null;
	}

	_getActiveSudokuRef() {
		return this._explore ? this._explore.current : this._currentSudoku;
	}

	_setActiveSudoku(sudoku) {
		if (this._explore) {
			this._explore.current = sudoku;
		} else {
			this._currentSudoku = sudoku;
		}
	}

	_getActivePast() {
		return this._explore ? this._explore.past : this._past;
	}

	_setActivePast(value) {
		if (this._explore) {
			this._explore.past = value;
		} else {
			this._past = value;
		}
	}

	_getActiveFuture() {
		return this._explore ? this._explore.future : this._future;
	}

	_setActiveFuture(value) {
		if (this._explore) {
			this._explore.future = value;
		} else {
			this._future = value;
		}
	}

	_clearHint() {
		this._currentHint = null;
	}

	getSudoku() {
		return this._getActiveSudokuRef().clone();
	}

	guess(move) {
		const active = this._getActiveSudokuRef();
		const before = active.clone();
		const changed = active.guess(move);

		if (!changed) return false;

		const past = this._getActivePast();
		past.push(before);
		this._setActivePast(past);
		this._setActiveFuture([]);

		this._clearHint();
		this._refreshExploreFailure();
		return true;
	}

	undo() {
		const past = this._getActivePast();
		if (past.length === 0) return false;

		const future = this._getActiveFuture();
		future.push(this._getActiveSudokuRef().clone());
		this._setActiveFuture(future);

		this._setActiveSudoku(past.pop());
		this._setActivePast(past);

		this._clearHint();
		this._refreshExploreFailure();
		return true;
	}

	redo() {
		const future = this._getActiveFuture();
		if (future.length === 0) return false;

		const past = this._getActivePast();
		past.push(this._getActiveSudokuRef().clone());
		this._setActivePast(past);

		this._setActiveSudoku(future.pop());
		this._setActiveFuture(future);

		this._clearHint();
		this._refreshExploreFailure();
		return true;
	}

	canUndo() {
		return this._getActivePast().length > 0;
	}

	canRedo() {
		return this._getActiveFuture().length > 0;
	}

	getCellHint(row, col) {
		const candidates = this._getActiveSudokuRef().getCandidates(row, col);
		if (candidates.length === 0) return null;

		this._currentHint = {
			type: 'candidates',
			row,
			col,
			candidates,
		};

		return cloneHint(this._currentHint);
	}

	getNextHint() {
		const hint = this._getActiveSudokuRef().getNextHint();
		this._currentHint = hint ? cloneHint(hint) : null;
		return cloneHint(this._currentHint);
	}

	applyCellHint(row, col) {
		const candidates = this._getActiveSudokuRef().getCandidates(row, col);

		if (candidates.length !== 1) {
			this._currentHint = {
				type: 'candidates',
				row,
				col,
				candidates,
			};
			return false;
		}

		this._currentHint = {
			type: 'next',
			row,
			col,
			candidates,
			value: candidates[0],
		};

		return this.guess({
			row,
			col,
			value: candidates[0],
		});
	}

	applyNextHint() {
		const hint = this._getActiveSudokuRef().getNextHint();
		if (!hint) return false;

		this._currentHint = cloneHint(hint);
		return this.guess({
			row: hint.row,
			col: hint.col,
			value: hint.value,
		});
	}

	enterExplore() {
		if (this._explore) return false;

		this._explore = {
			start: this._currentSudoku.clone(),
			current: this._currentSudoku.clone(),
			past: [],
			future: [],
			failed: false,
		};

		this._clearHint();
		this._refreshExploreFailure();
		return true;
	}

	abortExplore() {
		if (!this._explore) return false;

		this._explore = null;
		this._clearHint();
		return true;
	}

	commitExplore() {
		if (!this._explore) return false;
		if (this._explore.failed) return false;

		this._past.push(this._currentSudoku.clone());
		this._future = [];
		this._currentSudoku = this._explore.current.clone();

		this._explore = null;
		this._clearHint();
		return true;
	}

	isExploring() {
		return !!this._explore;
	}

	isExploreFailed() {
		return this._explore ? this._explore.failed : false;
	}

	_refreshExploreFailure() {
		if (!this._explore) return;

		const active = this._explore.current;
		const serial = active.serializeState();
		const invalid = active.hasConflict();

		if (invalid) {
			this._failedExploreStates.add(serial);
		}

		this._explore.failed = invalid || this._failedExploreStates.has(serial);
	}

	getViewData() {
		const active = this._getActiveSudokuRef();

		return {
			initialGrid: active.getInitialGrid(),
			grid: active.getGrid(),
			invalidCells: active.getInvalidCells(),
			won: active.isWon(),
			canUndo: this.canUndo(),
			canRedo: this.canRedo(),
			currentHint: cloneHint(this._currentHint),
			exploring: this.isExploring(),
			exploreFailed: this.isExploreFailed(),
			canCommitExplore: this.isExploring() && !this.isExploreFailed(),
			canAbortExplore: this.isExploring(),
		};
	}

	toJSON() {
		return {
			currentSudoku: this._currentSudoku.toJSON(),
			past: this._past.map(s => s.toJSON()),
			future: this._future.map(s => s.toJSON()),
			explore: this._explore
				? {
					start: this._explore.start.toJSON(),
					current: this._explore.current.toJSON(),
					past: this._explore.past.map(s => s.toJSON()),
					future: this._explore.future.map(s => s.toJSON()),
					failed: this._explore.failed,
				}
				: null,
			failedExploreStates: Array.from(this._failedExploreStates),
			currentHint: cloneHint(this._currentHint),
		};
	}

	static fromJSON(json) {
		const game = new Game(Sudoku.fromJSON(json.currentSudoku));

		game._past = (json.past ?? []).map(item => Sudoku.fromJSON(item));
		game._future = (json.future ?? []).map(item => Sudoku.fromJSON(item));
		game._failedExploreStates = new Set(json.failedExploreStates ?? []);
		game._currentHint = cloneHint(json.currentHint);

		if (json.explore) {
			game._explore = {
				start: Sudoku.fromJSON(json.explore.start),
				current: Sudoku.fromJSON(json.explore.current),
				past: (json.explore.past ?? []).map(item => Sudoku.fromJSON(item)),
				future: (json.explore.future ?? []).map(item => Sudoku.fromJSON(item)),
				failed: !!json.explore.failed,
			};
		}

		return game;
	}
}
