// Plies nothing is said after any remark, so an attack — the piece it wins, the checks around it,
// the rest of the exchange — is not a remark every move.
export const COOLDOWN = 4;

// Whether `ply` is still inside the cooldown of the last remark, made at `lastPly`.
export function isQuiet({ ply, lastPly }: { ply: number; lastPly: number | undefined }): boolean {
	return lastPly !== undefined && ply - lastPly < COOLDOWN;
}
