import {detach, getSnapshot, types} from "mobx-state-tree";

function log(msg: string): void {
    // console.log(msg);
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
    children: [{dx: 0, dy: 0}, {dx: 1, dy: 0}, {dx: 0, dy: 1}, {dx: 1, dy: 1}],
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
    children: types.optional(types.array(Block), [])
});

export function points(...pieces: typeof Piece.Type[]): Point[] {
    const result: Point[] = [];
    pieces.forEach(p => result.push(...p.children.map(b => ({x: p.x + b.dx, y: p.y + b.dy}))));
    return result;
}

export function collides(activePiece: typeof Piece.Type, pieces: typeof Piece.Type[]): boolean {
    const targetPoints = points(...pieces);
    return points(activePiece).reduce((acc, testPoint) => acc + targetPoints.filter(p => p.y === testPoint.y && p.x === testPoint.x).length, 0) !== 0;
}

export function lineFull(y: number, pieces: typeof Piece.Type[]): boolean {
    const points1 = points(...pieces);
    const targetPoints = points1.filter(p => p.y === y).map(p => p.x);
    const setOfX = new Set(targetPoints);
    return setOfX.size === 10;
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
    piece.children.forEach(c => {
        const rotated = multiplyMatrices(Degree90Matrix, [[c.dx], [c.dy]]);
        c.dx = rotated[0][0];
        c.dy = rotated[1][0];
    });
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
        self.activePiece = Piece.create({x: 5, y: 23, ...L_SHAPE});
    },
    next: () => {
        log("calculating next state");
        const nextY = self.activePiece.y - 1;
        // guess there is a more elegant solution to create a modified piece ?
        const nextPiecePosition = Piece.create({...getSnapshot(self.activePiece), y: nextY});

        // border reached or collision with other piece --> push it to list of static pieces and create new active piece
        const collision = collides(nextPiecePosition, self.pieces);
        if (nextY > 0 && !collision) {
            log("falling down, y = " + nextY);
            self.activePiece.y -= 1;
        } else {
            if (!collision) {
                self.activePiece.y -= 1;
            }
            log(nextY === 0 ? "reached ground" : "collision detected");
            const oldPiece = detach(self.activePiece);
            self.pieces.unshift(oldPiece);
            const newPiece = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            self.activePiece = Piece.create({x: 5, y: 23, ...newPiece});
            self.score += 10;
            log("created new piece at " + self.activePiece.x + ", " + self.activePiece.y);
            log("now there are " + self.pieces.length + " inactive pieces");
            // if newly created piece collides, game is finished
            self.finished = collides(self.activePiece, self.pieces);
            if (!self.finished) {
                const lines = new Set(oldPiece.children.map(b => oldPiece.y + b.dy));
                lines.forEach(y => {
                    if (lineFull(y, self.pieces)) {
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
        if (Math.min(...points(self.activePiece).map(p => p.x)) > 0) {
            self.activePiece.x -= 1;
        }
    },
    right: () => {
        log("moving right");
        if (Math.max(...points(self.activePiece).map(p => p.x)) < 9) {
            self.activePiece.x += 1;
        }
    },
    drop: () => {
        log("dropping");
        const pointsToCheck: Point[] = points(...self.pieces);
        const reducer = (acc: number[], ap: Point) => pointsToCheck.filter(p => p.x === ap.x).map(p => p.y).concat(acc);
        const yCoordinates = points(self.activePiece).reduce(reducer, [] as number[]);
        const maxOccupiedY = Math.max(0, ...yCoordinates);
        self.activePiece.y = maxOccupiedY + 1;
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
     * @param {typeof Piece.Type[]} pieces will be adjusted inplace, side effects !!!, pieces might be removed
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
    },
    rotate: () => {
        rotate(self.activePiece);
    }
})).views((self) => ({
    /** return all block in absolute coordinates */
}));

