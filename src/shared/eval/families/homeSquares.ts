import { COLORS, type Color, type Role, ROLES } from "chessops/types";

const BACK_RANK_FILES: Partial<Record<Role, number[]>> = {
	rook: [0, 7],
	knight: [1, 6],
	bishop: [2, 5],
	queen: [3],
	king: [4],
};

// Where a side's pieces stand in the *opponent's* opening position — the squares
// `reverseStarting` walks towards. Built once at module load rather than per piece per node.
export const HOME_SQUARES = Object.fromEntries(
	COLORS.map((color) => [
		color,
		Object.fromEntries(
			ROLES.map((role) => {
				const backRank = color === "white" ? 7 : 6;
				if (role === "pawn")
					return [role, Array.from({ length: 8 }, (_, file) => backRank * 8 + file)];

				const rank = color === "white" ? 7 : 0;
				return [role, (BACK_RANK_FILES[role] ?? []).map((file) => rank * 8 + file)];
			})
		) as Record<Role, number[]>,
	])
) as Record<Color, Record<Role, number[]>>;
