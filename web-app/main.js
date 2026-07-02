//import R from "./ramda.js";
import Othello from "./Othello.js";
import Stats from "./stats.js";


const el = function (id) {
    return document.getElementById(id);
};

// set up game state
let gameState = Othello.createInitialState();
const boardSize = gameState.board.length;
let showPossibleMoves = true;
let tiles = [];


// startup
window.onload = function () {
    buildBoardGrid();
    render(gameState);
    wireDialogs();
    el("introDialog").showModal();
};

// dialog boxes
const wireDialogs = function () {
    // settings
    el("settingsButton").onclick = function () {
        el("settingsDialog").showModal();
    };
    el("settingsClose").onclick = function () {
        el("settingsDialog").close();
    };
    el("showPossibleMovesToggle").onchange = function (e) {
        showPossibleMoves = e.target.checked;
        render(gameState);
    };
    // statistics
    el("statsButton").onclick = function () {
        fillStatsDialog();
        el("statsDialog").showModal();
    };
    el("statsClose").onclick = function () {
        el("statsDialog").close();
    };
    // game over
    el("playAgainButton").onclick = function () {
        el("gameOverDialog").close();
        gameState = Othello.createInitialState();
        buildBoardGrid();
        render(gameState);
        tiles[0].focus();
    };
    // intro
    el("introStart").onclick = function () {
        el("introDialog").close();
        tiles[0].focus();
    };
};
// board grid
const makeTileClickHandler = function (r, c) {
    return function () {
        clickTile([r, c]);
    };
};

const makeTileKeydownHandler = function (r, c) {
    return function (event) {
        if (event.key === "Enter" || event.key === " ") {
            clickTile([r, c]);
        }
        if (
            event.key === "ArrowLeft" &&
            tiles[r * boardSize + c - 1]
        ) {
            tiles[r * boardSize + c - 1].focus();
        }
        if (
            event.key === "ArrowRight" &&
            tiles[r * boardSize + c + 1]
        ) {
            tiles[r * boardSize + c + 1].focus();
        }
        if (
            event.key === "ArrowUp" &&
            tiles[r * boardSize + c - boardSize]
        ) {
            tiles[r * boardSize + c - boardSize].focus();
        }
        if (
            event.key === "ArrowDown" &&
            tiles[r * boardSize + c + boardSize]
        ) {
            tiles[r * boardSize + c + boardSize].focus();
        }
    };
};

const buildBoardGrid = function () {
    const boardGrid = el("boardGrid");
    boardGrid.innerHTML = "";
    tiles = [];
    let row = 0;
    while (row < boardSize) {
        let col = 0;
        while (col < boardSize) {
            const tile = document.createElement("div");
            tile.className = "tile";
            tile.setAttribute("role", "button");
            tile.setAttribute("tabindex", "0");
            tile.setAttribute(
                "aria-label",
                "Row " + (row + 1) + ", column " + (col + 1)
            );
            tile.onclick = makeTileClickHandler(row, col);
            tile.onkeydown = makeTileKeydownHandler(row, col);
            tile.appendChild(document.createElement("div"));
            boardGrid.appendChild(tile);
            tiles.push(tile);
            col += 1;
        }
        row += 1;
    }
};

//event handling
const clickTile = function (position) {
    const nextState = Othello.playMove(gameState, position);
    if (nextState === gameState) {
        return;
    }
    gameState = nextState;
    render(gameState);
    if (gameState.gameOver) {
        Stats.recordGame(gameState.winner);
        showGameOverDialog(gameState);
    }
};

//rendering
const render = function (state) {
    // determine valid moves
    const validMoves = (
        (state.gameOver || !showPossibleMoves)
        ? []
        : Othello.getValidMoves(state.board, state.currentPlayer)
    );
    // making a set of all posible positions
    const validMoveSet = new Set(validMoves.map(function ([row, col]) {
        return row * boardSize + col;
    }));
    // render each tile with discs and possible moves
    let row = 0;
    while (row < boardSize) {
        let col = 0;
        while (col < boardSize) {
            renderTile(state, row, col, validMoveSet);
            col += 1;
        }
        row += 1;
    }
    updateScores(state.board);
    updateTurnIndicator(state);
};

const renderTile = function (state, row, col, validMoveSet) {
    const token = tiles[row * boardSize + col].firstChild;
    const value = state.board[row][col];
    //render discs and possible moves for each player
    if (value === Othello.PLAYER_ONE) {
        token.className = "disc disc--player-one";
    } else if (value === Othello.PLAYER_TWO) {
        token.className = "disc disc--player-two";
    } else if (validMoveSet.has(row * boardSize + col)) {
        token.className = "possible-move " + (
            state.currentPlayer === Othello.PLAYER_ONE
            ? "possible-move--player-one"
            : "possible-move--player-two"
        );
    } else {
        token.className = "";
    }
};

//update score
const updateScores = function (board) {
    const {numOfPlayerOne, numOfPlayerTwo} = Othello.getScore(board);
    el("scorePlayerOne").textContent = numOfPlayerOne;
    el("scorePlayerTwo").textContent = numOfPlayerTwo;
};

//update turn indicator
const updateTurnIndicator = function (state) {
    const indicator = el("turnIndicator");
    if (state.gameOver) {
        indicator.textContent = (
            state.winner === Othello.TIE
            ? "It's a Tie!"
            : (
                state.winner === Othello.PLAYER_ONE
                ? "Sun"
                : "Moon"
            ) + " Wins!"
        );
        return;
    }
    indicator.textContent = (
        state.currentPlayer === Othello.PLAYER_ONE
        ? "Sun"
        : "Moon"
    ) + "'s Turn";
};

//endgame textbox
const showGameOverDialog = function (state) {
    const {numOfPlayerOne, numOfPlayerTwo} = Othello.getScore(state.board);
    el("gameOverResult").textContent = (
        state.winner === Othello.TIE
        ? "The twilight is perfectly balanced."
        : (
            state.winner === Othello.PLAYER_ONE
            ? "The Sun has taken control of the night sky!"
            : "The Moon reigns over the twilight!"
        )
    );
    el("gameOverScore").textContent = (
        "Sun: " + numOfPlayerOne + " - Moon: " + numOfPlayerTwo
    );
    el("gameOverDialog").showModal();
};

//statistics
const fillStatsDialog = function () {
    const {playerOne, playerTwo} = Stats.getStatistics();
    el("statP1Wins").textContent = playerOne.wins;
    el("statP1Losses").textContent = playerOne.losses;
    el("statP1Draws").textContent = playerOne.draws;
    el("statP1Streak").textContent = playerOne.currentStreak;
    el("statP1Best").textContent = playerOne.longestStreak;
    el("statP2Wins").textContent = playerTwo.wins;
    el("statP2Losses").textContent = playerTwo.losses;
    el("statP2Draws").textContent = playerTwo.draws;
    el("statP2Streak").textContent = playerTwo.currentStreak;
    el("statP2Best").textContent = playerTwo.longestStreak;
};