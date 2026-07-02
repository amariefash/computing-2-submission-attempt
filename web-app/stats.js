import Othello from "./Othello.js";

/**
 * Stats.js is a module for tracking and managing game statistics. This
 * includes wins, losses, draws, and winning streaks for both players!
 * @namespace Stats
 */


const Stats = Object.create(null);


/**
 * The win/loss/draw record for a player (as well as their current and longest
 * win streaks!).
 * @memberof Stats
 * @typedef {object} Statistics
 * @property {number} wins Number of games won by this player.
 * @property {number} losses Number of games lost by this player.
 * @property {number} draws Number of games drawn by this player.
 * @property {number} currentStreak Current win streak.
 * @property {number} longestStreak The longest win streak ever reached by this
 * player.
 */

/**
 * Creates an initialised statistics record.
 * @memberof Stats
 * @function
 * @returns {Statistics} An initialised statistics record with all values at
 * zero.
 */
const newStatistics = function () {
    return {
        wins: 0,
        losses: 0,
        draws: 0,
        currentStreak: 0,
        longestStreak: 0
    };
};

// A disctionary of player statistics with each player as a key
const playerStatistics = {};
playerStatistics[Othello.PLAYER_ONE] = newStatistics();
playerStatistics[Othello.PLAYER_TWO] = newStatistics();

/**
 * Returns the current statistics for both players.
 * @memberof Stats
 * @function
 * @returns {{playerOne: Statistics, playerTwo: Statistics}} Statistics for
 * both players.
 */

Stats.getStatistics = function () {
    return {
        playerOne: Object.assign({}, playerStatistics[Othello.PLAYER_ONE]),
        playerTwo: Object.assign({}, playerStatistics[Othello.PLAYER_TWO])
    };
};

// updates current streak and longest streak for a player after a game
// based on if they've won or not.
const updateStreak = function (stats, won) {
    if (won) {
        stats.currentStreak += 1;
        if (stats.currentStreak > stats.longestStreak) {
            stats.longestStreak = stats.currentStreak;
        }
    } else {
        stats.currentStreak = 0;
    }
};

/**
 * Records the result of a finished game and returns the updated statistics.
 * @memberof Stats
 * @function
 * @param {(1|2|string)} winner The game's outcome: PLAYER_ONE, PLAYER_TWO,
 *   or TIE, determined by {@link Othello.GameState}'s `winner` field.
 * @returns {{playerOne: Statistics, playerTwo: Statistics}} Updated stats
 * records.
 */
Stats.recordGame = function (winner) {
    const p1 = playerStatistics[Othello.PLAYER_ONE];
    const p2 = playerStatistics[Othello.PLAYER_TWO];
    if (winner === Othello.TIE) {
        p1.draws += 1;
        p2.draws += 1;
        updateStreak(p1, false);
        updateStreak(p2, false);
    } else if (winner === Othello.PLAYER_ONE) {
        p1.wins += 1;
        p2.losses += 1;
        updateStreak(p1, true);
        updateStreak(p2, false);
    } else if (winner === Othello.PLAYER_TWO) {
        p1.losses += 1;
        p2.wins += 1;
        updateStreak(p1, false);
        updateStreak(p2, true);
    }
    return Stats.getStatistics();
};

/**
 * Resets both players' stats records back to all zero
 * @memberof Stats
 * @function
 * @returns {void}
 */
Stats.resetAllStatistics = function () {
    playerStatistics[Othello.PLAYER_ONE] = newStatistics();
    playerStatistics[Othello.PLAYER_TWO] = newStatistics();
};

export default Object.freeze(Stats);