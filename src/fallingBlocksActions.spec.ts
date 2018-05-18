import {Block, FallingBlocksModel, generateId, L_SHAPE, Piece} from "./FallingBlocksModel";

const PIXEL = {
    children: [{dx: 0, dy: 0}],
    color: "aqua"
};

describe("The Id Generator", () => {
    it("generates a number one higher than the last one with every call", () => {
        const id = generateId();
        const idplus1 = generateId();
        expect(idplus1).toEqual(id + 1);
    });
});

describe("The Falling Blocks Game", () => {
    let game: typeof FallingBlocksModel.Type;
    beforeEach(() => {
        game = FallingBlocksModel.create();
        game.start();
    });

    it("can create a block", () => {
        const block = Block.create({dx: 10, dy: 5});
        expect(block.dx).toEqual(10);
        expect(block.dy).toEqual(5);
    });

    it("can create an L piece", () => {
        const piece = Piece.create({x: 10, y: 10, ...L_SHAPE});
        expect(piece.children.length).toEqual(4);
    });

    it("places an active piece on the top row on start", () => {
        expect(game.activePiece.x).toEqual(5);
        expect(game.activePiece.y).toEqual(23);
    });
    it("places a new piece on the board if the active piece reaches the bottom line", () => {
        game.setActivePieceTo(game.activePiece.x, 1);
        game.next();
        expect(game.activePiece.x).toEqual(5);
        expect(game.activePiece.y).toEqual(23);
        expect(game.pieces.length).toEqual(1);
    });

    it("piece drops down at each turn", () => {
        game.next();
        expect(game.activePiece.x).toEqual( 5);
        expect(game.activePiece.y).toEqual( 22);
        game.next();
        expect(game.activePiece.x).toEqual( 5);
        expect(game.activePiece.y).toEqual(21);
        expect(game.pieces.length).toEqual(0);
    });

    it("moves the piece left", () => {
        game.left();
        expect(game.activePiece.x).toEqual( 4);
        expect(game.activePiece.y).toEqual( 23);
    });

    it("moves the piece right", () => {
        game.right();
        expect(game.activePiece.x).toEqual( 6);
        expect(game.activePiece.y).toEqual( 23);
    });
    it("does not move the piece right if border is reached", () => {
        game.setActivePieceTo(9,game.activePiece.y);
        game.right();
        expect(game.activePiece.x).toEqual( 9);
        expect(game.activePiece.y).toEqual( 23);
    });
    it("does not move the piece left if border is reached", () => {
        game.setActivePieceTo(0,game.activePiece.y);
        game.left();
        expect(game.activePiece.x).toEqual( 0);
        expect(game.activePiece.y).toEqual( 23);
    });
    it("creates a new piece if the falling piece collides with another one", () => {
        game.setActivePieceTo(game.activePiece.x,6);
        game.addPiece(Piece.create({x: 5, y: 5, ...PIXEL}));
        game.next();
        expect(game.activePiece.x).toEqual( 5);
        expect(game.activePiece.y).toEqual( 23);
        expect(game.pieces.length).toEqual(2);
    });
    it("drops down just before the bottom and at the next step it will stop", () => {
        game.drop();
        expect(game.activePiece.x).toEqual( 5);
        expect(game.activePiece.y).toEqual( 1);
        game.next();
        expect(game.activePiece.x).toEqual( 5);
        expect(game.activePiece.y).toEqual( 23);
    });
    it("drops only to the uppermost occupied field beneath it", () => {
        game.addPiece(Piece.create({x: 5, y: 5, ...PIXEL}));
        game.drop();
        expect(game.activePiece.x).toEqual(5);
        expect(game.activePiece.y).toEqual(6);
        // active piece should stop after next move
        game.next();
        expect(game.activePiece.x).toEqual(5);
        expect(game.activePiece.y).toEqual(23);
        expect(game.pieces.length).toEqual(2);
    });
});