/*
 * Copyright (c) Marco van Meegen 2018.
 * This file is protected under MIT License.
 * Use without mention of the original author is not allowed.
 */

import {detach, types} from "mobx-state-tree";

// noinspection JSUnusedLocalSymbols
function log(msg: string): void {
    // console.log(msg);
}

/**
 * point relative to shape position
 */
type RelativePoint = {
    dx: number;
    dy: number;
};

interface ShapeDefinition {
    children: RelativePoint[];
    color: string;
    center?: RelativePoint;
}

// X
// X
// XX
export const L_SHAPE = {
    children: [{dx: 0, dy: 0}, {dx: 0, dy: 1}, {dx: 0, dy: 2}, {dx: 1, dy: 0}],
    color: "orange",
    center: {dx: 0, dy: 1}
};


//  X
//  X
// XX
export const FLIP_L_SHAPE = {
    children: [{dx: 0, dy: 0}, {dx: 1, dy: 0}, {dx: 1, dy: 1}, {dx: 1, dy: 2}],
    color: "dark-blue",
    center: {dx: 1, dy: 1}
};

// X
// XX
// X
export const NOSE_SHAPE = {
    children: [{dx: 0, dy: 0}, {dx: 0, dy: 1}, {dx: 0, dy: 2}, {dx: 1, dy: 1}],
    color: "purple",
    center: {dx: 0, dy: 1}
};

// XX
//  XX
export const Z_SHAPE = {
    children: [{dx: 0, dy: 1}, {dx: 1, dy: 0}, {dx: 1, dy: 1}, {dx: 2, dy: 0}],
    color: "red",
    center: {dx: 1, dy: 1}
};

//  XX
// XX
export const S_SHAPE = {
    children: [{dx: 0, dy: 0}, {dx: 1, dy: 0}, {dx: 1, dy: 1}, {dx: 2, dy: 1}],
    color: "green",
    center: {dx: 1, dy: 1}
};

// XX
// XX
export const BLOCK_SHAPE = {
    children: [{dx: 0, dy: 0}, {dx: 1, dy: 0}, {dx: 0, dy: 1}, {dx: 1, dy: 1}],
    color: "yellow"
};

// X
// X
// X
// X
export const LINE_SHAPE = {
    children: [{dx: 0, dy: 0}, {dx: 0, dy: 1}, {dx: 0, dy: 2}, {dx: 0, dy: 3}],
    color: "light-blue",
    center: {dx: 0, dy: 1}
};

const SHAPES: ShapeDefinition[] = [L_SHAPE, FLIP_L_SHAPE, NOSE_SHAPE, Z_SHAPE, S_SHAPE, BLOCK_SHAPE, LINE_SHAPE];

type Point = {
    x: number;
    y: number;
};

export const Block = types.model("Block", {
    dx: types.number,
    dy: types.number
});

function IdGenerator(): () => number {
    let idCounter = 1;
    return () => {
        idCounter = idCounter + 1;
        return idCounter;
    };
}

export const generateId = IdGenerator();
export const Piece = types.model("Piece", {
    id: types.optional(types.identifier(types.number), generateId),
    x: types.number,
    y: types.number,
    color: types.string,
    /** center of rotation; if undefined, no rotation is done */
    center: types.maybe(Block),
    children: types.optional(types.array(Block), [])
});

export function points(...pieces: typeof Piece.Type[]): Point[] {
    const result: Point[] = [];
    pieces.forEach(p => result.push(...p.children.map(b => ({x: p.x + b.dx, y: p.y + b.dy}))));
    return result;
}


function collides(activePiece: typeof Piece.Type, pieces: typeof Piece.Type[], widthOfField: number): boolean {
    return collidesWithBorder(activePiece, widthOfField) || collidesWithPiece(activePiece, pieces);
}

/**
 * check collision with other pieces
 * @param {typeof Piece.Type} activePiece
 * @param {typeof Piece.Type[]} pieces
 * @returns {boolean} true if any block of this piece collides with any point of the other piece
 */
export function collidesWithPiece(activePiece: typeof Piece.Type, pieces: typeof Piece.Type[]): boolean {
    const targetPoints = points(...pieces);
    return points(activePiece).reduce((acc, testPoint) => acc + targetPoints.filter(p => p.y === testPoint.y && p.x === testPoint.x).length, 0) !== 0;
}

/**
 * check collision with field border
 * @param {typeof Piece.Type} activePiece
 * @param {number} widthOfField
 * @returns {boolean} true if any block of this piece has x or y coordinates out of bounds; y height is not checked since pieces always fall down
 */
export function collidesWithBorder(activePiece: typeof Piece.Type, widthOfField: number): boolean {
    return points(activePiece).reduce((acc, testPoint) => acc || (testPoint.x < 0 || testPoint.y < 0 || testPoint.x >= widthOfField), false);
}

/**
 *
 * @param {number} y
 * @param {typeof Piece.Type[]} pieces
 * @param {number} widthOfField width of game fields in blocks
 * @returns {boolean} true if the given line is fully occupied with pieces
 */
export function lineFull(y: number, pieces: typeof Piece.Type[], widthOfField: number): boolean {
    const points1 = points(...pieces);
    const targetPoints = points1.filter(p => p.y === y).map(p => p.x);
    const setOfX = new Set(targetPoints);
    return setOfX.size === widthOfField;
}

function multiplyMatrices(m1: number[][], m2: number[][]): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < m1.length; i++) {
        result[i] = [];
        for (let j = 0; j < m2[0].length; j++) {
            let sum = 0;
            for (let k = 0; k < m1[0].length; k++) {
                sum += m1[i][k] * m2[k][j];
            }
            result[i][j] = sum;
        }
    }
    return result;
}

const Degree90Matrix = [[0, 1], [-1, 0]];

export function rotate(piece: typeof Piece.Type): void {
    // only rotate if center is specified, special case needed for blocks having a fractional center
    if (piece.center) {
        // translate center to (0,0), rotate, and then translate back
        piece.children.forEach(c => {
            const rotated = multiplyMatrices(Degree90Matrix, [[c.dx - piece.center.dx], [c.dy - piece.center.dy]]);
            c.dx = rotated[0][0] + piece.center.dx;
            c.dy = rotated[1][0] + piece.center.dy;
        });
    }
}

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
        self.height = 30;
        self.pieces.clear();
        self.activePiece = Piece.create({x: 4, y: 23, ...L_SHAPE});
    },
    next: () => {
        log("calculating next state");
        self.activePiece.y -= 1;
        // border reached or collision with other piece --> push it to list of static pieces and create new active piece
        const collision = collides(self.activePiece, self.pieces, self.width);
        if (collision) {
            // undo move
            self.activePiece.y += 1;

            // put active piece on inactive pieces list
            const oldPiece = detach(self.activePiece);
            self.pieces.unshift(oldPiece);
            // create new random piece
            const newPiece: ShapeDefinition = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            const midX = self.width / 2 - (newPiece.center ? newPiece.center.dx : 0);
            self.activePiece = Piece.create({x: midX, y: 23, ...newPiece});
            self.score += 10;
            log("created new piece at " + self.activePiece.x + ", " + self.activePiece.y);
            log("now there are " + self.pieces.length + " inactive pieces");

            // if newly created piece collides, game is finished
            self.finished = collides(self.activePiece, self.pieces, self.width);
            if (!self.finished) {
                // if not finished, remove full lines
                const lines = new Set(oldPiece.children.map(b => oldPiece.y + b.dy));
                lines.forEach(y => {
                    log("Checking if Line " + y + " full");
                    if (lineFull(y, self.pieces, self.width)) {
                        log("Line " + y + " will be deleted");
                        (self as any).deleteLine(y);
                    }
                });
            } else {
                log("Game is finished");
            }
        }
        return self.finished;
    },
    left: () => {
        log("moving left");
        self.activePiece.x -= 1;
        if (collides(self.activePiece, self.pieces, self.width)) {
            self.activePiece.x += 1;
        }
    },
    right: () => {
        log("moving right");
        self.activePiece.x += 1;
        if (collides(self.activePiece, self.pieces, self.width)) {
            self.activePiece.x -= 1;
        }
    },
    rotate: () => {
        rotate(self.activePiece);
        if (collides(self.activePiece, self.pieces, self.width)) {
            // take rotation back by rotating 3 times
            [1, 2, 3].forEach(() => rotate(self.activePiece));
        }
    },
    drop: () => {
        // border reached or collision with other piece --> push it to list of static pieces and create new active piece
        let dropped = false;
        while (!collides(self.activePiece, self.pieces, self.width)) {
            self.activePiece.y -= 1;
            dropped = true;
        }
        // undo move which led to collision
        if (dropped) {
            self.activePiece.y += 1;
        }
    },
    setActivePieceTo: (x: number, y: number) => {
        self.activePiece.x = x;
        self.activePiece.y = y;
    },
    addPiece: (p: typeof Piece.Type) => {
        self.pieces.push(p);
    },
    /**
     * adjusts all pieces that blocks on the line are removed and blocks above fall down 1 line
     * pieces without blocks will be removed too.
     * @param {number} y
     */
    deleteLine: (y: number) => {
        const pieces = self.pieces;
        let i = 0;
        while (i < pieces.length) {
            let j = 0;
            const p = pieces[i];
            while (j < p.children.length) {
                const c = p.children[j];
                if (p.y + c.dy === y) {
                    // remove piece if on line
                    p.children.splice(j, 1);
                } else {
                    if (p.y + c.dy > y) {
                        // fall down
                        c.dy -= 1;
                    }
                    j++;
                }
            }
            // if piece has no blocks left, remove it
            if (pieces[i].children.length === 0) {
                pieces.splice(i, 1);
            } else {
                i++;
            }
        }
    }
}));

