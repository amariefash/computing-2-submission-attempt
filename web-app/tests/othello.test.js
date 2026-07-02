import Othello from "../Othello.js";
//import R from "../ramda.js";

//utility functions
// return cell representation
const formatCell = function (cell) {
    if (cell === Othello.PLAYER_ONE) {
        return "1";
    }
    if (cell === Othello.PLAYER_TWO) {
        return "2";
    }
    return ".";
};

// converts a board to a readable string
const displayBoard = function (board) {
    const size = board.length;
    const rows = [];
    let row = size - 1;
    while (row >= 0) {
        rows.push(board[row].map(formatCell).join(" "));
        row -= 1;
    }
    return "\n" + rows.join("\n");
};

// sum of all discs
const totalDiscs = function (board) {
    return [].concat.apply([], board).filter(function (cell) {
        return cell !== Othello.EMPTY;
    }).length;
};

/**
 * Tests whether a board is in a valid structural state.
 * A board is valid if:
 * - It is a square 2D array.
 * - Each cell contains only EMPTY, PLAYER_ONE, or PLAYER_TWO.
 * - Its size is even
 * - It contains at least 4 discs.
 * @memberof Othello.test
 * @function
 * @param {Othello.Board} board The board to validate.
 * @throws if the board fails any of the above conditions.
 */
const throwIfInvalidBoard = function (board) {
    if (!Array.isArray(board) || !Array.isArray(board[0])) {
        throw new Error(
            "The board is not a 2D array: " + JSON.stringify(board)
        );
    }
    const size = board.length;
    const isSquare = board.every(function (col) {
        return col.length === size;
    });
    if (!isSquare) {
        throw new Error("The board is not square: " + displayBoard(board));
    }
    if (size % 2 !== 0) {
        throw new Error(
            "The board size " + size + " is odd " +
            displayBoard(board)
        );
    }
    const validTokens = [Othello.EMPTY, Othello.PLAYER_ONE, Othello.PLAYER_TWO];
    const allValid = [].concat.apply([], board).every(function (cell) {
        return validTokens.includes(cell);
    });
    if (!allValid) {
        throw new Error(
            "The board contains a value other than EMPTY, PLAYER_ONE, " +
            "or PLAYER_TWO: " + displayBoard(board)
        );
    }
    if (totalDiscs(board) < 4) {
        throw new Error(
            "The board has less than 4 discs: " + displayBoard(board)
        );
    }
};

/**
 * For every legal move available to `player` on `board`, this test places the
 * disc and checks that the resulting board satisfies all of the following:
 * - The resulting board is structurally valid.
 * - The placed disc appears at the chosen position.
 * - At least one opponent disc was bracketed and flipped.
 * - Every bracketed disc now belongs to `player`.
 * @memberof Othello.test
 * @function
 * @param {Othello.Board} board The board to find moves on.
 * @param {Othello.Player} player The player whose legal moves to check.
 * @throws if any legal move produces an invalid result.
 */
const throwIfInvalidMove = function (board, player) {
    const validMoves = Othello.getValidMoves(board, player);
    validMoves.forEach(function (move) {
        const row = move[0];
        const col = move[1];
        const disksToFlip = Othello.getDisksToFlip(board, player, [row, col]);
        const next = Othello.applyMove(board, player, [row, col]);
        // test board
        throwIfInvalidBoard(next);
        // test if disc is on board
        if (next[row][col] !== player) {
            throw new Error(
                "After placing at [" + row + "," + col +
                "] for player " + player +
                ", that square should belong to " + player +
                " but is " + next[row][col] + ": " +
                displayBoard(next)
            );
        }
        // at least one disc is able to beflipped
        if (disksToFlip.length === 0) {
            throw new Error(
                "getValidMoves included [" + row + "," + col +
                "] for player " + player +
                " but no discs were able to be flipped: " +
                displayBoard(board)
            );
        }
        // each disc that was able to be flipped is now the player's disc
        disksToFlip.forEach(function (disc) {
            const fr = disc[0];
            const fc = disc[1];
            if (next[fr][fc] !== player) {
                throw new Error(
                    "Disc at [" + fr + "," + fc +
                    "] was bracketed by move [" + row + "," + col +
                    "] but was not flipped" +
                    next[fr][fc] + ": " + displayBoard(next)
                );
            }
        });
    });
};

// creating testing boards for different stages of a game
const notEndedBoards = [
    // starting position
    Othello.createInitialBoard(),
    //after a first move
    (function () {
        let board = Othello.createInitialBoard();
        board = Othello.applyMove(board, Othello.PLAYER_ONE, [2, 3]);
        return board;
    }()),
    // after 3 moves
    (function () {
        let board = Othello.createInitialBoard();
        board = Othello.applyMove(board, Othello.PLAYER_ONE, [2, 3]);
        board = Othello.applyMove(board, Othello.PLAYER_TWO, [2, 4]);
        board = Othello.applyMove(board, Othello.PLAYER_ONE, [2, 5]);
        return board;
    }()),
    // testing a 10x10 board
    (function () {
        let board = Othello.createInitialBoard(10);
        const firstMove = Othello.getValidMoves(board, Othello.PLAYER_ONE)[0];
        board = Othello.applyMove(board, Othello.PLAYER_ONE, firstMove);
        return board;
    }())
];

// testing a 4x4 board one move from ending. player one plays [3,3], flips the
// disc at [2,2]. The board is filled  with player one's discs and
// neither player can move.
const P1 = Othello.PLAYER_ONE;
const P2 = Othello.PLAYER_TWO;
const gameEndingBoard = [
    [P1, P1, P1, P1],
    [P1, P1, P1, P1],
    [P1, P1, P2, P1],
    [P1, P1, P1, Othello.EMPTY]
];
const gameEndingMove = [3, 3];


// starting position
describe("Starting position", function () {
    // checks the four centre squares match the expected starting arrangement
    it(
        "The starting board has the valid Othello starting position: " +
        "two discs of each colour arranged diagonally in the centre",
        function () {
            const board = Othello.createInitialBoard();
            const mid = board.length / 2;
            const expected = [
                {pos: [mid - 1, mid - 1], player: Othello.PLAYER_TWO},
                {pos: [mid - 1, mid], player: Othello.PLAYER_ONE},
                {pos: [mid, mid - 1], player: Othello.PLAYER_ONE},
                {pos: [mid, mid], player: Othello.PLAYER_TWO}
            ];
            expected.forEach(function (entry) {
                const r = entry.pos[0];
                const c = entry.pos[1];
                if (board[r][c] !== entry.player) {
                    throw new Error(
                        "Expected player " + entry.player +
                        " at [" + r + "," + c + "], " +
                        "got " + board[r][c] + ": " +
                        displayBoard(board)
                    );
                }
            });
        }
    );
    // a new game must not already have a winner or be over
    it(
        "At the beginning of the game there is no winner and " +
        "the game has not ended",
        function () {
            const state = Othello.createInitialState();
            if (state.winner !== null) {
                throw new Error(
                    "winner should be null at the start of a game, " +
                    "got " + state.winner + ": " +
                    displayBoard(state.board)
                );
            }
            if (state.gameOver) {
                throw new Error(
                    "A new game should not be over: " +
                    displayBoard(state.board)
                );
            }
        }
    );

    // odd board sizes are invalid as the starting discs need a centre square
    it(
        "The starting board is even; if an odd size is requested " +
        "it falls back to the default size (8x8)",
        function () {
            // the defeault board must be even
            const defaultBoard = Othello.createInitialBoard();
            if (defaultBoard.length % 2 !== 0) {
                throw new Error(
                    "The default board size (" + defaultBoard.length +
                    ") is odd" + displayBoard(defaultBoard)
                );
            }
            // an attempted odd size must be corrccted to the default size
            [3, 5, 7, 9].forEach(function (size) {
                const board = Othello.createInitialBoard(size);
                throwIfInvalidBoard(board);
                if (board.length === size) {
                    throw new Error(
                        "An odd size (" + size + ") cannot be used. Expected" +
                        "this to be corrected to " + Othello.DEFAULT_BOARD_SIZE
                        + ", but produced a " + board.length +
                        "x" + board.length + " board"
                    );
                }
            });
        }
    );
});
// disc flipping
describe("Disc flipping", function () {
    // tests  placing a disc must bracket
    // and flip opponents
    it(
        "Placing a disc brackets opponent discs in a straight line, " +
        "which are then flipped to the placing player's colour",
        function () {
            notEndedBoards.forEach(function (board) {
                [Othello.PLAYER_ONE, Othello.PLAYER_TWO].forEach(
                    function (player) {
                        if (Othello.hasValidMove(board, player)) {
                            throwIfInvalidMove(board, player);
                        }
                    }
                );
            });
        }
    );
});


// end of game
describe("End of game", function () {
    // a game is only over when neither player has any remaining moves
    it(
        "A game ends when no valid moves are left for either player",
        function () {
            // not ended while moves remain.
            notEndedBoards.forEach(function (board) {
                if (Othello.isGameOver(board)) {
                    throw new Error(
                        "isGameOver returned true for a board where " +
                        "at least one player still has a legal move: " +
                        displayBoard(board)
                    );
                }
            });
            // tests if ended when no moves remain
            // a board filled with one player's
            // discs gives neither player any legal move.
            [4, 6, 8].forEach(function (size) {
                const fullBoard = [];
                let i = 0;
                while (i < size) {
                    fullBoard.push(
                        new Array(size).fill(Othello.PLAYER_ONE)
                    );
                    i += 1;
                }
                if (!Othello.isGameOver(fullBoard)) {
                    throw new Error(
                        "A " + size + "x" + size +
                        " board with no legal moves for either " +
                        "player should be ended: " +
                        displayBoard(fullBoard)
                    );
                }
            });
        }
    );
    // winner is determined by disc count
    it(
        "The player with more discs on the board at the end wins",
        function () {
            const cases = [
                {
                    board: [
                        [Othello.PLAYER_ONE, Othello.PLAYER_ONE],
                        [Othello.PLAYER_ONE, Othello.PLAYER_TWO]
                    ],
                    expected: Othello.PLAYER_ONE,
                    desc: "3 discs to 1"
                },
                {
                    board: [
                        [Othello.PLAYER_TWO, Othello.PLAYER_TWO],
                        [Othello.PLAYER_TWO, Othello.PLAYER_ONE]
                    ],
                    expected: Othello.PLAYER_TWO,
                    desc: "1 disc to 3"
                },
                {
                    board: [
                        [Othello.PLAYER_ONE, Othello.PLAYER_TWO],
                        [Othello.PLAYER_TWO, Othello.PLAYER_ONE]
                    ],
                    expected: Othello.TIE,
                    desc: "2 discs each — tie"
                }
            ];
            cases.forEach(function (testCase) {
                const winner = Othello.getWinner(testCase.board);
                if (winner !== testCase.expected) {
                    throw new Error(
                        testCase.desc + ": expected " +
                        testCase.expected + " but got " +
                        winner + ": " +
                        displayBoard(testCase.board)
                    );
                }
            });
        }
    );
    //if a player has no legal moves,
    // they forfeit their turn and the opponent plays again
    it(
        "A player with no legal move forfeits their turn, " +
        "the opponent plays again",
        function () {
            // player two just moved.
            // player one is completely surrounded and has no legal move
            // Player two should therefore play again
            // col: 0   1   2
            // row 2: 2   2   2
            // row 1: 2   1   2
            // row 0: 2   2   .
            // The one empty square [0,2] cannot be reached by player one.
            const E = Othello.EMPTY;
            const board = [
                [P2, P2, E],
                [P2, P1, P2],
                [P2, P2, P2]
            ];
            if (Othello.hasValidMove(board, P1)) {
                throw new Error(
                    "Test setup error: player one should have no " +
                    "valid moves on this board: " +
                    displayBoard(board)
                );
            }
            if (!Othello.hasValidMove(board, P2)) {
                throw new Error(
                    "Test setup error: player two should have a " +
                    "valid move on this board: " +
                    displayBoard(board)
                );
            }
            const next = Othello.getNextPlayer(board, Othello.PLAYER_TWO);
            if (next !== Othello.PLAYER_TWO) {
                throw new Error(
                    "Player one has no legal move so should " +
                    "forfeit their turn. " +
                    "Player two should play again, but getNextPlayer " +
                    "returned " + next + ": " + displayBoard(board)
                );
            }
        }
    );
    // illegal moves must return the same state object unchanged
    it(
        "An illegal move leaves the game state unchanged",
        function () {
            const state = Othello.createInitialState();
            // an already occupied square is not a valid move
            const mid = Math.floor(state.board.length / 2);
            const occupied = [mid - 1, mid - 1];
            const afterOccupied = Othello.playMove(state, occupied);
            if (afterOccupied !== state) {
                throw new Error(
                    "Playing on an occupied square at [" +
                    occupied + "] should " +
                    "return the original state object unchanged, " +
                    "but returned a different object"
                );
            }
            // an empty square that brackets no opponent discs is not a
            // valid move.
            const corner = [0, 0];
            const afterCorner = Othello.playMove(state, corner);
            if (afterCorner !== state) {
                throw new Error(
                    "Playing at a non-bracketing square [" +
                    corner + "] should " +
                    "return the original state object unchanged, " +
                    "but returned a different object"
                );
            }
        }
    );
    // checks that playMove correctly sets gameOver and winner in the state
    it(
        "After a valid move, gameOver and winner correctly reflect " +
        "whether the game has ended",
        function () {
            // a valid move that does not end the game the
            // winner stays null and gameOver stays false.
            const inProgress = Othello.createInitialState();
            const afterOpeningMove = Othello.playMove(inProgress, [2, 3]);
            if (afterOpeningMove.gameOver) {
                throw new Error(
                    "gameOver should be false after an opening move, " +
                    "but was true: " +
                    displayBoard(afterOpeningMove.board)
                );
            }
            if (afterOpeningMove.winner !== null) {
                throw new Error(
                    "winner should be null while the game is in " +
                    "progress, but was " +
                    afterOpeningMove.winner + ": " +
                    displayBoard(afterOpeningMove.board)
                );
            }
            // A valid move that ends the game:
            // gameOver becomes true and winner is set correctly.
            if (!Othello.isValidMove(
                gameEndingBoard,
                P1,
                gameEndingMove
            )) {
                throw new Error(
                    "Test setup error: [3,3] should be a valid move " +
                    "for player one on this board: " +
                    displayBoard(gameEndingBoard)
                );
            }
            const endingState = {
                board: gameEndingBoard,
                currentPlayer: Othello.PLAYER_ONE,
                gameOver: false,
                winner: null
            };
            const afterFinalMove = Othello.playMove(
                endingState,
                gameEndingMove
            );
            if (!afterFinalMove.gameOver) {
                throw new Error(
                    "gameOver should be true after the final move, " +
                    "but was false: " +
                    displayBoard(afterFinalMove.board)
                );
            }
            if (afterFinalMove.winner !== Othello.PLAYER_ONE) {
                throw new Error(
                    "winner should be PLAYER_ONE after player one " +
                    "takes all squares, but was " +
                    afterFinalMove.winner + ": " +
                    displayBoard(afterFinalMove.board)
                );
            }
        }
    );
});