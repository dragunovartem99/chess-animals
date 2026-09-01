// Dense Gauss–Jordan with partial pivoting. The matrices here are (players + 2) square and
// solved once per fit, so an O(n³) inverse costs nothing and keeps the Newton step and the
// covariance extraction to one primitive.
export function invert(matrix: readonly number[][]): number[][] {
	const n = matrix.length;
	const work = matrix.map((row, i) => [
		...row,
		...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
	]);

	for (let col = 0; col < n; col += 1) {
		let pivot = col;
		for (let row = col + 1; row < n; row += 1) {
			if (Math.abs(work[row][col]) > Math.abs(work[pivot][col])) pivot = row;
		}
		if (Math.abs(work[pivot][col]) < 1e-14) throw new Error("singular matrix");
		[work[col], work[pivot]] = [work[pivot], work[col]];

		const diag = work[col][col];
		for (let j = 0; j < 2 * n; j += 1) work[col][j] /= diag;

		for (let row = 0; row < n; row += 1) {
			if (row === col) continue;
			const factor = work[row][col];
			if (factor === 0) continue;
			for (let j = 0; j < 2 * n; j += 1) work[row][j] -= factor * work[col][j];
		}
	}

	return work.map((row) => row.slice(n));
}

// Solves `matrix · x = rhs` by inversion — same size regime, same reasoning.
export function solve(matrix: readonly number[][], rhs: readonly number[]): number[] {
	const inverse = invert(matrix);
	return inverse.map((row) => row.reduce((sum, value, j) => sum + value * rhs[j], 0));
}
