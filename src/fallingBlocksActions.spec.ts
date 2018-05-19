/*
 * Copyright (c) Marco van Meegen 2018.
 * This file is protected under MIT License.
 * Use without mention of the original author is not allowed.
 */

import {Block, collidesWithPiece, FallingBlocksModel, generateId, L_SHAPE, lineFull, Piece} from "./FallingBlocksModel";

const PIXEL = {
    children: [{dx: 0, dy: 0}],
    color: "aqua"
};
const HORIZONTAL_LINE = {
    children: [{dx: 0, dy: 0}, {dx: 1, dy: 0}, {dx: 2, dy: 0}, {dx: 3, dy: 0}],
    color: "aqua",
    center: {dx: 1, dy: 1}
};

// X
// X
// XX
export const TEST_L = {
    children: [{dx: 0, dy: 0}, {dx: 0, dy: 1}, {dx: 0, dy: 2}, {dx: 1, dy: 0}],
    color: "orange",
    center: {dx: 0, dy: 1}
};

// XX
// XX
export const TEST_BLOCK = {
    children: [{dx: 0, dy: 0}, {dx: 1, dy: 0}, {dx: 0, dy: 1}, {dx: 1, dy: 1}],
    color: "yellow"
};

describe("The Falling Blocks Game consist of components:", () => {
    let game: typeof FallingBlocksModel.Type;
    beforeEach(() => {
        game = FallingBlocksModel.create();
        game.start();
    });


    describe("The Id Generator", () => {
        it("generates a number one higher than the last one with every call", () => {
            const id = generateId();
            const idplus1 = generateId();
            expect(idplus1).toEqual(id + 1);
            const idplus2 = generateId();
            expect(idplus2).toEqual(id + 2);
        });

        it("will give two created pieces a different id", () => {
            const piece1 = Piece.create({x: 10, y: 10, ...TEST_L});
            const piece2 = Piece.create({x: 9, y: 10, ...TEST_L});
            expect(piece1.id).not.toEqual(piece2.id);
        });
    });

    describe("The collide function", () => {
        it("detects if two pieces have one point in common", () => {
            const piece = Piece.create({x: 10, y: 10, ...TEST_L});
            const other = Piece.create({x: 10, y: 8, ...TEST_L});
            expect(collidesWithPiece(piece, [other])).toEqual(true);
        });
        it("detects collision of piece with a single point", () => {
            const piece = Piece.create({x: 5, y: 5, ...PIXEL});
            const other = Piece.create({x: 4, y: 5, ...TEST_L});
            expect(collidesWithPiece(piece, [other])).toEqual(true);
        });
        it("does not detect collision if pieces are only adjacent", () => {
            const piece = Piece.create({x: 10, y: 10, ...TEST_L});
            const other = Piece.create({x: 10, y: 7, ...TEST_L});
            expect(collidesWithPiece(piece, [other])).toEqual(false);
        });
    });

    describe("The full line manager", () => {
        it("detects if a line is not filled", () => {
            const piece1 = Piece.create({x: 0, y: 7, ...HORIZONTAL_LINE});
            expect(lineFull(7, [piece1], 10)).toEqual(false);
            const piece2 = Piece.create({x: 6, y: 7, ...HORIZONTAL_LINE});
            const piece3 = Piece.create({x: 4, y: 7, ...PIXEL});
            expect(lineFull(7, [piece1, piece2], 10)).toEqual(false);
            // should not detect wrong line
            const piece5 = Piece.create({x: 5, y: 6, ...PIXEL});
            expect(lineFull(7, [piece1, piece2, piece3, piece5], 10)).toEqual(false);
        });

        it("detects if a line is fully filled", () => {
            const piece1 = Piece.create({x: 0, y: 7, ...HORIZONTAL_LINE});
            const piece2 = Piece.create({x: 6, y: 7, ...HORIZONTAL_LINE});
            const piece3 = Piece.create({x: 4, y: 7, ...PIXEL});
            const piece4 = Piece.create({x: 5, y: 7, ...PIXEL});
            expect(lineFull(7, [piece1, piece2, piece3, piece4], 10)).toEqual(true);
        });

        it("deletes all blocks of a line", () => {
            // two Ls
            //   x
            // x x         x
            // x xx  --> x x
            // xx        xx
            const piece1 = Piece.create({x: 0, y: 0, ...TEST_L});
            const piece2 = Piece.create({x: 2, y: 1, ...TEST_L});
            const model = FallingBlocksModel.create({pieces: [piece1, piece2]});
            model.deleteLine(1);

            expect(piece1.children.length).toEqual(3);
            expect(piece1.children[0].dy).toEqual(0);
            expect(piece1.children[1].dy).toEqual(1);
            expect(piece1.children[2].dy).toEqual(0);

            expect(piece2.children.length).toEqual(2);
            expect(piece2.children[0].dy).toEqual(0);
            expect(piece2.children[1].dy).toEqual(1);

        });
    });


    describe("The rotate function", () => {
        /**
         * embed piece in model to rotate it
         * @param piece
         * @return rotated piece
         */
        function rotate(piece: typeof Piece.Type): typeof Piece.Type {
            const model = FallingBlocksModel.create({activePiece: piece});
            model.rotate();
            return model.activePiece;
        }

        it("rotates a line by 90 degree using the second point as center", () => {
            const rotated = rotate(Piece.create({x: 5, y: 5, ...HORIZONTAL_LINE}));
            expect(rotated.children.toJSON()).toEqual([{"dx": 0, "dy": 2}, {"dx": 0, "dy": 1}, {
                "dx": 0,
                "dy": 0
            }, {"dx": 0, "dy": -1}]);
        });

        it("does not rotate a piece with no center specified", () => {
            const rotated = rotate(Piece.create({x: 0, y: 0, ...TEST_BLOCK}));
            expect(rotated.children.toJSON()).toEqual(TEST_BLOCK.children);
        });
    });

    describe("The Falling Blocks Model", () => {
        it("can create a block", () => {
            const block = Block.create({dx: 10, dy: 5});
            expect(block.dx).toEqual(10);
            expect(block.dy).toEqual(5);
        });

        it("can create an L piece", () => {
            const piece = Piece.create({x: 10, y: 10, ...TEST_L});
            expect(piece.children.length).toEqual(4);
        });

        it("places an active piece on the top row on start", () => {
            expect(game.activePiece.x).toEqual(4);
            expect(game.activePiece.y).toEqual(23);
        });
        it("places a new piece on the board if the active piece reaches the bottom line", () => {
            game.setActivePieceTo(game.activePiece.x, 0);
            game.next();
            expect(game.activePiece.y).toEqual(23);
            expect(game.pieces.length).toEqual(1);
        });

        it("piece drops down at each turn", () => {
            game.next();
            expect(game.activePiece.x).toEqual(4);
            expect(game.activePiece.y).toEqual(22);
            game.next();
            expect(game.activePiece.x).toEqual(4);
            expect(game.activePiece.y).toEqual(21);
            expect(game.pieces.length).toEqual(0);
        });

        it("moves the piece left", () => {
            game.left();
            expect(game.activePiece.x).toEqual(3);
            expect(game.activePiece.y).toEqual(23);
        });

        it("moves the piece left if border is a pixel away", () => {
            game.setActivePieceTo(1, game.activePiece.y);
            game.left();
            expect(game.activePiece.x).toEqual(0);
            expect(game.activePiece.y).toEqual(23);
        });

        it("does not move the piece left if border is reached", () => {
            game.setActivePieceTo(0, game.activePiece.y);
            game.left();
            expect(game.activePiece.x).toEqual(0);
            expect(game.activePiece.y).toEqual(23);
        });

        it("moves the piece right", () => {
            game.right();
            expect(game.activePiece.x).toEqual(5);
            expect(game.activePiece.y).toEqual(23);
        });

        it("does not move the piece right if border is reached", () => {
            game.setActivePieceTo(9, game.activePiece.y);
            game.right();
            expect(game.activePiece.x).toEqual(9);
            expect(game.activePiece.y).toEqual(23);
        });

        it("does not move the piece right if border is reached by a block", () => {
            game.setActivePieceTo(8, game.activePiece.y);
            game.right();
            expect(game.activePiece.x).toEqual(8);
            expect(game.activePiece.y).toEqual(23);
        });

        it("creates a new piece if the falling piece collidesWithPiece with another one", () => {
            game.setActivePieceTo(game.activePiece.x, 6);
            game.addPiece(Piece.create({x: 5, y: 5, ...PIXEL}));
            game.next();
            expect(game.activePiece.x).toEqual(5);
            expect(game.activePiece.y).toEqual(23);
            expect(game.pieces.length).toEqual(2);
        });
        it("drops down just before the bottom and at the next step it will stop", () => {
            game.drop();
            expect(game.activePiece.x).toEqual(4);
            expect(game.activePiece.y).toEqual(0);
            game.next();
            expect(game.activePiece.y).toEqual(23);
        });

        it("drops only to the uppermost occupied field beneath it", () => {
            game.addPiece(Piece.create({x: 5, y: 5, ...PIXEL}));
            game.drop();
            expect(game.activePiece.x).toEqual(4);
            expect(game.activePiece.y).toEqual(6);
            // active piece should stop after next move
            game.next();
            expect(game.activePiece.y).toEqual(23);
            expect(game.pieces.length).toEqual(2);
        });

        it("drops only to the uppermost occupied field beneath it, this works for all pixels", () => {
            game.addPiece(Piece.create({x: 5, y: 5, ...PIXEL}));
            game.drop();
            expect(game.activePiece.x).toEqual(4);
            expect(game.activePiece.y).toEqual(6);
            // active piece should stop after next move
            game.next();
            expect(game.activePiece.y).toEqual(23);
            expect(game.pieces.length).toEqual(2);
        });

        it("removes a line if it gets full by landed piece", () => {
            game.addPiece(Piece.create({x: 0, y: 0, ...HORIZONTAL_LINE}));
            game.addPiece(Piece.create({x: 6, y: 0, ...HORIZONTAL_LINE}));
            // L should be over x-pos 4,5
            game.drop();
            expect(game.activePiece.x).toEqual(4);
            expect(game.activePiece.y).toEqual(0);
            // active piece should stop after next move and line should be killed
            game.next();
            expect(game.pieces.length).toEqual(1);
        });

        it("only rotates piece if rotated piece would not collide with another piece", () => {
            // game starts with L at 4,23, thus
            game.addPiece(Piece.create({x: 5, y: 24, ...PIXEL}));
            game.rotate();
            // should not have rotated
            expect(game.activePiece.children.toJSON()).toEqual(L_SHAPE.children);
        });

        it("only rotates piece if rotated piece would not collide with border", () => {
            // game starts with L at 5,23, thus
            game.setActivePieceTo(0, 23);
            game.rotate();
            // should not have rotated
            expect(game.activePiece.children.toJSON()).toEqual(L_SHAPE.children);

        });

    });
});
