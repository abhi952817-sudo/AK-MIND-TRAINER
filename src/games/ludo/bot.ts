// src/games/ludo/bot.ts
// Rule-based bot. Deterministic priority order.
// Not "AI" — just a smart-enough opponent.

import { MoveOption, GameState } from './types';
import {
  WIN_POSITION,
  isSafeTrackIndex,
  toTrackIndex,
} from './board';
import { getLegalMoves } from './rules';
import { TeamMode, isTeammate } from './teamRules';

/**
 * Choose a move for the current player.
 * Returns null if no legal move exists.
 */
export function getBotMove(
  state: GameState,
  teamMode: TeamMode = 'individual'
): MoveOption | null {
  const moves = getLegalMoves(state, teamMode);
  if (moves.length === 0) return null;

  // Score each move and pick the highest.
  let best = moves[0];
  let bestScore = scoreMove(best, state, teamMode);

  for (let i = 1; i < moves.length; i++) {
    const s = scoreMove(moves[i], state, teamMode);
    if (s > bestScore) {
      best = moves[i];
      bestScore = s;
    }
  }
  return best;
}

/**
 * Priority scoring (higher = better):
 *   1000 per capture
 *    500 for reaching home (finish a token)
 *    300 for entering home column
 *    250 if the destination is a safe cell
 *    200 for exiting base (into the main track)
 *    150 if the move lands ahead of all opponents (leading)
 *      2 per cell of progress (tie-break: advance the front token)
 */
function scoreMove(
  move: MoveOption,
  state: GameState,
  teamMode: TeamMode = 'individual'
): number {
  let score = 0;

  // 1. Captures are king
  score += move.captures.length * 1000;

  // 2. Reaching home = permanent win progress
  if (move.reachesHome) score += 500;

  // 3. Entering home column = protected from captures
  if (move.entersHomeColumn) score += 300;

  // 4. Landing on a safe cell or teammate's cell (guard block)
  const token = state.tokens.find((t) => t.id === move.tokenId);
  if (token) {
    // Partner assist bonus
    if (token.playerIndex !== state.activePlayerIndex) {
      score += 350;
    }

    const trackIdx = toTrackIndex(token.playerIndex, move.to);
    if (trackIdx !== null) {
      if (isSafeTrackIndex(trackIdx)) {
        score += 250;
      }
      // Forming team guard block with partner
      if (teamMode !== 'individual') {
        const partnerTokenAtTarget = state.tokens.some((other) => {
          if (other.id === token.id) return false;
          if (other.position < 0 || other.position > 50) return false;
          if (!isTeammate(token.playerIndex, other.playerIndex, teamMode, state.players.length)) return false;
          return toTrackIndex(other.playerIndex, other.position) === trackIdx;
        });
        if (partnerTokenAtTarget) {
          score += 300; // Friendly blockade fortress!
        }
      }
    }
  }

  // 5. Exit base early to have active tokens on the board (boosted if >=3 remain in base)
  if (move.exitsBase) {
    const inBaseCount = state.tokens.filter(
      (t) => t.playerIndex === token?.playerIndex && t.position === -1
    ).length;
    score += inBaseCount >= 3 ? 350 : 200;
  }

  // 6. Avoid landing directly in front of an opponent (rough heuristic)
  if (isRiskyLanding(move, state, teamMode)) score -= 100;

  // 7. Prefer advancing the furthest token (tie-break)
  score += move.to * 2;

  return score;
}

/**
 * Rough risk check: is the destination within 6 cells behind any opponent
 * on the main track, and not a safe cell? If so, this landing is risky.
 */
function isRiskyLanding(
  move: MoveOption,
  state: GameState,
  teamMode: TeamMode = 'individual'
): boolean {
  if (move.to < 0 || move.to > 50) return false;

  const token = state.tokens.find((t) => t.id === move.tokenId);
  if (!token) return false;

  const myTrackIdx = toTrackIndex(token.playerIndex, move.to);
  if (myTrackIdx === null) return false;
  if (isSafeTrackIndex(myTrackIdx)) return false;

  for (const other of state.tokens) {
    if (other.playerIndex === token.playerIndex) continue;
    // Teammates are not threatening
    if (isTeammate(token.playerIndex, other.playerIndex, teamMode, state.players.length)) continue;
    if (other.position < 0 || other.position > 50) continue;

    const otherTrackIdx = toTrackIndex(other.playerIndex, other.position);
    if (otherTrackIdx === null) continue;

    // Distance forward from opponent to my landing cell
    const dist = (myTrackIdx - otherTrackIdx + 52) % 52;
    if (dist >= 1 && dist <= 6) return true;
  }
  return false;
}

/**
 * Convenience: does the bot want to exit base if it can?
 * (Kept for future heuristics; not used in scoring directly.)
 */
export function shouldExitBase(state: GameState): boolean {
  const tokensInBase = state.tokens.filter(
    (t) => t.playerIndex === state.activePlayerIndex && t.position === -1
  ).length;
  const tokensOnBoard = state.tokens.filter(
    (t) =>
      t.playerIndex === state.activePlayerIndex &&
      t.position >= 0 &&
      t.position < WIN_POSITION
  ).length;

  // Exit base if we have 2+ in base and 0-1 on board
  return tokensInBase >= 2 && tokensOnBoard <= 1;
}
