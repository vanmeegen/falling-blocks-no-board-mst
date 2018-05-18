import {types, detach} from "mobx-state-tree";

function log(msg: string):void {
    console.log(msg);
}

// X
// X
// XX
export const L_SHAPE = {
    children: [{dx: 0, dy: 0}, {dx: 0, dy: 1}, {dx: 0, dy: 2}, {dx: 1, dy: 0}],
    color: "orange"
};


//  X
//  X
// XX
export const FLIP_L_SHAPE = {
    children: [{dx: 0, dy: 0}, {dx: 1, dy: 0}, {dx: 1, dy: 1}, {dx: 1, dy: 2}],
    color: "dark-blue"
};

// X
// XX
// X
export const NOSE_SHAPE = {
    children: [{dx: 0, dy: 0}, {dx: 0, dy: 1}, {dx: 0, dy: 2}, {dx: 1, dy: 1}],
    color: "purple"
};

// XX
//  XX
export const Z_SHAPE = {
    children: [{dx: 0, dy: 1}, {dx: 1, dy: 0}, {dx: 1, dy: 1}, {dx: 2, dy: 0}],
    color: "red"
};

//  XX
// XX
export const S_SHAPE = {
    children: [{dx: 0, dy: 0}, {dx: 1, dy: 0}, {dx: 1, dy: 1}, {dx: 2, dy: 1}],
    color: "green"
};

// XX
// XX
export const BLOCK_SHAPE = {
    children: [{dx: 0, dy: 0}, {dx: 1, dy: 0}, {dx: 1, dy: 0}, {dx: 1, dy: 1}],
    color: "yellow"
};

// X
// X
// X
// X
export const LINE_SHAPE = {
    children: [{dx: 0, dy: 0}, {dx: 0, dy: 1}, {dx: 0, dy: 2}, {dx: 0, dy: 3}],
    color: "light-blue"
};

const SHAPES = [L_SHAPE, FLIP_L_SHAPE, NOSE_SHAPE, Z_SHAPE, S_SHAPE, BLOCK_SHAPE, LINE_SHAPE];

export const Block = types.model("Block", {
    dx: types.number,
    dy: types.number
});

export const Piece = types.model("Piece", {
    x: types.number,
    y: types.number,
    color: types.string,
    children: types.optional(types.array(Block), [])
});


export const FallingBlocksModel = types.model("FallingBlocksModel", {
    finished: types.optional(types.boolean, false),
    score: types.optional(types.number, 0),
    width: types.optional(types.number, 10),
    height: types.optional(types.number, 20),
    /** array of indices which snake occupies; head is last entry */
    pieces: types.optional(types.array(Piece), []),
    activePiece: types.maybe(Piece)
}).actions((self) => ({
    start: () => {
        // for easier testing it always starts with a L shape
        self.finished = false;
        self.score = 0;
        self.width = 10;
        self.height = 27;
        self.pieces.clear();
        self.activePiece = Piece.create({x: 5, y: 23, ...L_SHAPE});
    },
    next: () => {
        log("calculating next state");
        const nextY = self.activePiece.y - 1;
        // border reached or collision with other piece --> push it to list of static pieces and create new active piece
        if (nextY > 0 && self.pieces.filter(p => p.y === nextY && p.x === self.activePiece.x).length === 0) {
            log("falling down, y = " + nextY);
            self.activePiece.y -= 1;
        } else {
            log(nextY === 0 ? "reached ground": "collision detected");
            self.pieces.unshift(detach(self.activePiece));
            const newPiece = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            self.activePiece = Piece.create({x: 5, y: 23, ...newPiece});
            log("created new piece at " + self.activePiece.x + ", " + self.activePiece.y);
            log("now there are " + self.pieces.length + " inactive pieces");
            // if newly created piece collides, game is finished
            self.finished = self.pieces.filter(p => p.y === self.activePiece.y && p.x === self.activePiece.x).length !== 0;
            self.finished && log("Game is finished");
        }
        return self.finished;
    },
    left: () => {
        log("moving left");
        self.activePiece.x = Math.max(0, self.activePiece.x - 1);
    },
    right: () => {
        log("moving right");
        self.activePiece.x = Math.min(9, self.activePiece.x + 1);
    },
    drop: () => {
        log("dropping");
        const maxOccupiedY = Math.max(0,...self.pieces.filter(p => p.x === self.activePiece.x).map(p => p.y));
        self.activePiece.y = maxOccupiedY + 1;
    },
    setActivePieceTo: (x: number, y: number) => {
        self.activePiece.x = x;
        self.activePiece.y = y;
    },
    addPiece: (p: typeof Piece.Type) => {
        self.pieces.push(p);
    }
}));

