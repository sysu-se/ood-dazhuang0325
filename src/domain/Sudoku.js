
import { printSudoku, solveSudoku } from '../node_modules/@sudoku/sudoku.js';

function deepCopy(grid) {
	return grid.map(row => [...row]);
}

export class Sudoku {
	constructor(initialGrid, currentGrid = null, solution = null) {
		this._initialGrid = deepCopy(initialGrid);
		this._grid = currentGrid ? deepCopy(currentGrid) : deepCopy(initialGrid);
		this._fixed = this._initialGrid.map(row => row.map(cell => cell !== 0));
		this._solution = solution ? deepCopy(solution) : solveSudoku(this._initialGrid);
	}

	getGrid() {
		return deepCopy(this._grid);
	}

	getInitialGrid() {
		return deepCopy(this._initialGrid);
	}

	getSolution() {
		return deepCopy(this._solution);
	}

	clone() {
		return new Sudoku(this._initialGrid, this._grid, this._solution);
	}

	isFixed(row, col) {
		return this._fixed[row][col];
	}

	_isValidPosition(row, col) {
		return Number.isInteger(row) && Number.isInteger(col)
			&& row >= 0 && row < 9
			&& col >= 0 && col < 9;
	}

	_isValidValue(value) {
		return Number.isInteger(value) && value >= 0 && value <= 9;
	}

	guess({ row, col, value }) {
		const nextValue = value ?? 0;

		if (!this._isValidPosition(row, col)) return false;
		if (!this._isValidValue(nextValue)) return false;
		if (this.isFixed(row, col)) return false;
		if (this._grid[row][col] === nextValue) return false;

		this._grid[row][col] = nextValue;
		return true;
	}

	_hasRowConflict(row, col, value) {
		for (let c = 0; c < 9; c++) {
			if (c !== col && this._grid[row][c] === value) return true;
		}
		return false;
	}

	_hasColConflict(row, col, value) {
		for (let r = 0; r < 9; r++) {
			if (r !== row && this._grid[r][col] === value) return true;
		}
		return false;
	}

	_hasBoxConflict(row, col, value) {
		const boxRow = Math.floor(row / 3) * 3;
		const boxCol = Math.floor(col / 3) * 3;

		for (let r = boxRow; r < boxRow + 3; r++) {
			for (let c = boxCol; c < boxCol + 3; c++) {
				if ((r !== row || c !== col) && this._grid[r][c] === value) return true;
			}
		}

		return false;
	}

	isInvalidCell(row, col) {
		const value = this._grid[row][col];
		if (value === 0) return false;

		return this._hasRowConflict(row, col, value)
			|| this._hasColConflict(row, col, value)
			|| this._hasBoxConflict(row, col, value);
	}

	getInvalidCells() {
		const invalid = [];

		for (let row = 0; row < 9; row++) {
			for (let col = 0; col < 9; col++) {
				if (this.isInvalidCell(row, col)) {
					invalid.push(`${col},${row}`);
				}
			}
		}

		return invalid;
	}

	hasConflict() {
		return this.getInvalidCells().length > 0;
	}

	isComplete() {
		for (let row = 0; row < 9; row++) {
			for (let col = 0; col < 9; col++) {
				if (this._grid[row][col] === 0) return false;
			}
		}
		return true;
	}

	isWon() {
		return this.isComplete() && !this.hasConflict();
	}

	getCandidates(row, col) {
		if (!this._isValidPosition(row, col)) return [];
		if (this._grid[row][col] !== 0) return [];
		if (this.isFixed(row, col)) return [];

		const candidates = [];

		for (let value = 1; value <= 9; value++) {
			if (
				!this._hasRowConflict(row, col, value) &&
				!this._hasColConflict(row, col, value) &&
				!this._hasBoxConflict(row, col, value)
			) {
				candidates.push(value);
			}
		}

		return candidates;
	}

	getNextHint() {
		for (let row = 0; row < 9; row++) {
			for (let col = 0; col < 9; col++) {
				if (this._grid[row][col] !== 0) continue;

				const candidates = this.getCandidates(row, col);
				if (candidates.length === 1) {
					return {
						type: 'next',
						row,
						col,
						candidates,
						value: candidates[0],
					};
				}
			}
		}

		return null;
	}

	getSolutionValue(row, col) {
		return this._solution[row][col];
	}

	serializeState() {
		return JSON.stringify(this._grid);
	}

	toJSON() {
		return {
			initialGrid: this.getInitialGrid(),
			grid: this.getGrid(),
		};
	}

	toString() {
		return printSudoku(this._grid);
	}

	static fromJSON(json) {
		const initialGrid = json.initialGrid ?? json.grid;
		return new Sudoku(initialGrid, json.grid);
	}
}
