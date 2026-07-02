import R from "./ramda.js";


/**
 * Othello.js is a  module modelling an Othello (also known as Reversi!) style
 * game on a square board of any even size.
 * https://en.wikipedia.org/wiki/Reversi
 * @namespace Othello
 */

const Othello = Object.create(null);

/**
 * A Board is a square-shaped grid of cells. A board is stored as an array of
 * rows, each row consists of an array of cells.
 * @memberof Othello
 * @typedef {Token[][]} Board
 */

/**
 * A [row, col] coordinate on a board.
 * @memberof Othello
 * @typedef {number[]} Position
 */

/**
 * Which player a disc belongs to.
 * @memberof Othello
 * @typedef {(1 | 2)} Player
 */

/**
 * Represents a cell on the board which may contain either a disc from either
 * player, or an empty cell.
 * @memberof Othello
 * @typedef {(Player | 0)} Token
 */

/**
 * The state of a game in progress: the board, the player whose turn it is,
 * and if the game has ended or not.
 * @memberof Othello
 * @typedef {object} GameState
 * @property {Board} board The current board.
 * @property {Player} currentPlayer The player who is about to move.
 * @property {boolean} gameOver Whether the game has ended or not.
 * @property {(Player|string|null)} winner The winning player( including "TIE"
 *  if the game ended in a draw. This variable is null if the game is still
 * going.
 */

/**
 * The token which represents an empty cell.
 * @memberof Othello
 * @constant {number}
 */
Othello.EMPTY = 0;

/**
 * The token which represents one of player one's discs.
 * @memberof Othello
 * @constant {number}
 */
Othello.PLAYER_ONE = 1;

/**
 * The token which represents one of player two's discs.
 * @memberof Othello
 * @constant {number}
 */
Othello.PLAYER_TWO = 2;

/**
 * Returned when the game ends in a draw.
 * @memberof Othello
 * @constant {string}
 */
Othello.TIE = "tie";


/**
 * A standard game of Othello uses an 8 by 8 grid. This board size is used when
 * none is specified, or when an invalid size is provided.
 * @memberof Othello
 * @constant {number}
 */
Othello.DEFAULT_BOARD_SIZE = 8;


// The 8 directions that a line of possible flips can run in as [deltaRow,
// deltaCol] pairs.
const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]
];

// variable returning the player who is not currently taking their turn, this
// is used to check who plays next
const otherPlayer = (player) => (
    player === Othello.PLAYER_ONE
    ? Othello.PLAYER_TWO
    : Othello.PLAYER_ONE
);

// size of the board, used to calculate valid moves and render the board
const sizeOfBoard = (board) => board.length;

// a board's size must be even as the four starting discs are placed
// symmetrically at the centre
const isValidBoardSize = (size) => (
    Number.isInteger(size) && size > 0 && size % 2 === 0
);
//placing the four starting discs on the board
function startingDiscs(size) {
    const mid = size / 2;
    return [
        {position: [mid - 1, mid - 1], player: Othello.PLAYER_TWO},
        {position: [mid - 1, mid], player: Othello.PLAYER_ONE},
        {position: [mid, mid - 1], player: Othello.PLAYER_ONE},
        {position: [mid, mid], player: Othello.PLAYER_TWO}
    ];
}


/**
 * Creates a new empty square board of a given size, the four starting discs
 * are then placed in its centre.
 * @memberof Othello
 * @function
 * @param {number} [size=8] The width (and therefore height) of the board. This
 * needs to be a positive even number as the starting discs need to be in the
 * centre. An invalid size (odd, zero, or negative) creates a board of the
 * default size
 *   {@link Othello.DEFAULT_BOARD_SIZE} .
 * @returns {Board} A board with the correct starting configuration.
 */
Othello.createInitialBoard = function (size = Othello.DEFAULT_BOARD_SIZE) {
    const correctedSize = (
        isValidBoardSize(size)
        ? size
        : Othello.DEFAULT_BOARD_SIZE
    );
    // builds an empty board
    const board = [];
    let row = 0;
    while (row < correctedSize) {
        board.push(R.repeat(Othello.EMPTY, correctedSize));
        row += 1;
    }
    // places the four starting discs into it
    startingDiscs(correctedSize).forEach(function (disc) {
        board[disc.position[0]][disc.position[1]] = disc.player;
    });
    return board;
};

// ensures a given position checked is on the board
const isOnBoard = function (board, position) {
    const size = sizeOfBoard(board);
    return (
        position[0] >= 0 && position[0] < size &&
        position[1] >= 0 && position[1] < size
    );
};
// determines the value of a given position on the board
const valueAtPosition = function (board, position) {
    return board[position[0]][position[1]];
};

// function which moves one step away from a given position in the grid in a
// given direction
const addDelta = function (position, direction) {
    return [position[0] + direction[0], position[1] + direction[1]];
};


// scanning putwards from a position in a given direction and returning
// the positions of any opponent discs that would be flipped if the player
// placed a disc at that given position.
// if the a position beyond the boundaries of the board or an empty square are
// reached the function is stopped and returns an empty array.
// if a disc belonging to the player is reached the function returns an array
// of all the opponent discs that would be flipped
const scanDirection = function (board, player, position, direction) {
    const flippableDiscs = [];
    let current = addDelta(position, direction);
    while (isOnBoard(board, current)) {
        const value = valueAtPosition(board, current);
        if (value === Othello.EMPTY) {
            return []; // nothing to flip
        }
        if (value === player) {
            return flippableDiscs; // line is closed off, flip it
        }
        flippableDiscs.push(current); // opponent disc, keep walking
        current = addDelta(current, direction);
    }
    return []; // ran off the board before closing the line
};


/**
 * The squares that would be flipped if a `player` placed a disc at `position`.
 * @memberof Othello
 * @function
 * @param {Board} board The board to check.
 * @param {Player} player The player who is about to move.
 * @param {Position} position The square the player has selected.
 * @returns {Position[]} Every square that would flip if selected. Empty array
 * if none would.
 */
Othello.getDisksToFlip = function (board, player, position) {
    if (!isOnBoard(board, position)) {
        return [];
    }
    if (valueAtPosition(board, position) !== Othello.EMPTY) {
        return [];
    }
    // checking every direction and combining whatever each finds
    let allFlips = [];
    DIRECTIONS.forEach(function (direction) {
        allFlips = allFlips.concat(
            scanDirection(board, player, position, direction)
        );
    });
    return allFlips;
};


/**
 * Determines whether placing a disc for `player` at `position` is a valid move.
 * @memberof Othello
 * @function
 * @param {Board} board The board to check.
 * @param {Player} player The player who is about to move.
 * @param {Position} position The square the player has selected.
 * @returns {boolean} Only True if the square is empty and the move flips at
 * least one disc.
 */
Othello.isValidMove = function (board, player, position) {
  // a move is valid only if the square is empty and it flips something
    return isOnBoard(board, position) &&
    valueAtPosition(board, position) === Othello.EMPTY &&
    Othello.getDisksToFlip(board, player, position).length > 0;
};
// an array of every single coordinate on the board to be used for getValidMoves
const allPositionsOn = function (board) {
    const size = sizeOfBoard(board);
    const positions = [];
    let row = 0;
    while (row < size) {
        let col = 0;
        while (col < size) {
            positions.push([row, col]);
            col += 1;
        }
        row += 1;
    }
    return positions;
};


/**
 * Every square on the board where `player` can currently play a valid move.
 * @memberof Othello
 * @function
 * @param {Board} board The board to check.
 * @param {Player} player The player to find possible moves for.
 * @returns {Position[]} All valid move positions for `player`.
 */
Othello.getValidMoves = function (board, player) {
    return R.filter(
        function (position) {
            return Othello.isValidMove(board, player, position);
        },
        allPositionsOn(board)
    );
};


/**
 * Whether `player` has at least one valid move available.
 * @memberof Othello
 * @function
 * @param {Board} board The board to check.
 * @param {Player} player The player to check.
 * @returns {boolean} True only if `player` has at least one valid move.
 */
Othello.hasValidMove = function (board, player) {
    return Othello.getValidMoves(board, player).length > 0;
};


/**
 * Places a disc for `player` at `position` and flip every disc that move
 * captures. A new board is returned.
 * @memberof Othello
 * @function
 * @param {Board} board The board to play on.
 * @param {Player} player The player making the move.
 * @param {Position} position The square to place a disc on.
 * @returns {Board} A new board containing the newmove and all of its resulting
 * flips.
 */
//applies a move to the board
Othello.applyMove = function (board, player, position) {
    // get every disc that would be flipped if the player placed a disc at the
    // given position
    const flips = Othello.getDisksToFlip(board, player, position);
    // new array with new disc added to the front of the array
    const changedPositions = R.prepend(position, flips);
    //return a new board with the new disc and all of its resulting flips
    return R.reduce( //R.reduce to apply a function to each element of
    //changedpositions and return new board
        (nextBoard, pos) => R.assocPath(pos, player, nextBoard), //add player
        //tokento position at board
        board,
        changedPositions
    );
};


/**
 * Count the sum of discs currently on the board for each player.
 * @memberof Othello
 * @function
 * @param {Board} board The board.
 * @returns {{numOfPlayerOne: number, numOfPlayerTwo: number}} Number of discs
 * for each player.
 */
Othello.getScore = function (board) {
    const allTokens = R.flatten(board);
    const playerOneTokens = R.filter(R.equals(Othello.PLAYER_ONE), allTokens);
    const playerTwoTokens = R.filter(R.equals(Othello.PLAYER_TWO), allTokens);
    return {
        numOfPlayerOne: playerOneTokens.length,
        numOfPlayerTwo: playerTwoTokens.length
    };
};



/**
 * Determines whether the game has ended. A game can only end when neither
 * player has a valid move remaining.
 * @memberof Othello
 * @function
 * @param {Board} board The board to check.
 * @returns {boolean} True only if neither player has a valid move.
 */
Othello.isGameOver = function (board) {
    return (
        !Othello.hasValidMove(board, Othello.PLAYER_ONE) &&
        !Othello.hasValidMove(board, Othello.PLAYER_TWO)
    );
};


/**
 * The result of a finished game.
 * @memberof Othello
 * @function
 * @param {Board} board A board in which the game has ended, therefore
 * {@link Othello.isGameOver} is true.
 * @returns {(Player|string)} PLAYER_ONE or PLAYER_TWO if that player has
 *   more discs, or the TIE constant in the case of a draw.
 */
Othello.getWinner = function (board) {
    const {numOfPlayerOne, numOfPlayerTwo} = Othello.getScore(board);
    if (numOfPlayerOne === numOfPlayerTwo) {
        return Othello.TIE;
    }
    return (
        numOfPlayerOne > numOfPlayerTwo
        ? Othello.PLAYER_ONE
        : Othello.PLAYER_TWO
    );
};


/**
 * Determines the next player. If a player has no valid moves, then they
 * forfeit their turn and the other player plays again.
 * @memberof Othello
 * @function
 * @param {Board} board The board after a move.
 * @param {Player} playerWhoMoved The player who just played.
 * @returns {Player} The player who will play next.
 */
Othello.getNextPlayer = function (board, playerWhoMoved) {
    const opponent = otherPlayer(playerWhoMoved);
    if (Othello.hasValidMove(board, opponent)) {
        return opponent;
    }
    return playerWhoMoved;
};


/**
 * Plays one full turn. A move is checked to determine whether it is valid or
 * not,it is applied, and the next player is determined. If the move was
 * invalid, or the game has already ended, the same state is returned unchanged.
 * @memberof Othello
 * @function
 * @param {GameState} state The game state before the move.
 * @param {Position} position The square whichthe current player is attempting
 * to place their disc on.
 * @returns {GameState} The resulting game state. If the move was invalid,
 * or the game had already ended, then `state` is returned without any
 * changes.
 */
Othello.playMove = function (state, position) {
  // returns the same state (no change) is the game is over or the move is
  // invalid)
    if (state.gameOver) {
        return state;
    }
    if (!Othello.isValidMove(state.board, state.currentPlayer, position)) {
        return state;
    }
    const board = Othello.applyMove(state.board, state.currentPlayer, position);
    const gameHasEnded = Othello.isGameOver(board);
    return {
        board,
        currentPlayer: (
            gameHasEnded
            ? state.currentPlayer
            : Othello.getNextPlayer(board, state.currentPlayer)
        ),
        gameOver: gameHasEnded,
        winner: (
            gameHasEnded
            ? Othello.getWinner(board)
            : null
        )
    };
};


/**
 * Creates a new board of the given size, or the default size if none is
 * provided. Player one is assigned to move first.
 * @memberof Othello
 * @function
 * @param {number} [boardSize=8] The width, and also height, of the board.
 * @returns {GameState} A new game state.
 */
Othello.createInitialState = function (boardSize = Othello.DEFAULT_BOARD_SIZE) {
    return {
        board: Othello.createInitialBoard(boardSize),
        currentPlayer: Othello.PLAYER_ONE,
        gameOver: false,
        winner: null
    };
};
export default Object.freeze(Othello);