/*
 * Copyright (c) Marco van Meegen 2018.
 * This file is protected under MIT License.
 * Use without mention of the original author is not allowed.
 */

import * as React from "react";
import {FallingBlocksModel, Piece} from "./FallingBlocksModel";
import {observer} from "mobx-react";
import Timer = NodeJS.Timer;

// noinspection JSUnusedLocalSymbols
function log(msg: string): void {
    // console.log(msg);
}

// render size in pixel
const SIZE = 20;

interface IBlockProps {
    totalHeightPixel: number;
    color: string;
    x: number;
    y: number;
}

class BlockComponent extends React.PureComponent<IBlockProps> {
    constructor(props: IBlockProps) {
        super(props);
    }

    public render(): JSX.Element | null {
        log("rendering block with color " + this.props.color + " at (" + this.props.x + "," + this.props.y + ")");
        const transform = `translate(${this.props.x * SIZE},${this.props.totalHeightPixel - this.props.y * SIZE})`;
        return <rect transform={transform} width={SIZE} height={SIZE} fill={this.props.color}/>;
    }

}

interface IPieceProps {
    totalHeightPixel: number;
    widthInBlocks: number;
    model: typeof Piece.Type;
}


@observer
export class PieceComponent extends React.Component<IPieceProps> {
    constructor(props: IPieceProps) {
        super(props);
    }

    public render(): JSX.Element {
        log("rendering piece " + this.props.model);
        const model = this.props.model;

        return <g>
            {model.children.map(
                b => <BlockComponent key={b.dx + this.props.widthInBlocks * b.dy} x={model.x + b.dx} y={model.y + b.dy}
                                     color={model.color} totalHeightPixel={this.props.totalHeightPixel}/>)}
        </g>;
    }
}

interface IFallingBlocksGameProps {
    model: typeof FallingBlocksModel.Type;
}

@observer
export class FallingBlockGame extends React.Component<IFallingBlocksGameProps> {
    private timeout: Timer;
    private mainDiv: HTMLDivElement | null;

    constructor(props: IFallingBlocksGameProps) {
        super(props);
        this.newGame = this.newGame.bind(this);
        this.next = this.next.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
    }

    public render(): JSX.Element {
        log("rendering game");
        const result: JSX.Element[] = [];
        // use coordinates as index, this should work for quite big falling blocks games ;-)
        const model = this.props.model;
        model.pieces.forEach(p => {
            result.push(<PieceComponent key={p.id} model={p} widthInBlocks={this.props.model.width}
                                        totalHeightPixel={(model.height - 1) * SIZE}/>);
        });
        const a = model.activePiece;
        if (a) {
            result.push(<PieceComponent key={a.id} model={a} widthInBlocks={this.props.model.width}
                                        totalHeightPixel={(model.height - 1) * SIZE}/>);
        }
        return <div style={{margin: "10px"}}>
            <div>
                <button onClick={this.newGame} title="New Game">New Game</button>
                <button onClick={this.next} title="Next">Next</button>
                <p>Score: {model.score}</p>
                {model.finished ? <h2>You filled blocks up to the top, Game Finished</h2> : null}
            </div>
            <div onKeyDown={this.onKeyDown} tabIndex={1} ref={(c) => {
                this.mainDiv = c;
            }} style={{outline: "none", width: "min-content", margin: "auto"}}>
                <svg width={model.width * SIZE} height={model.height * SIZE}
                     viewBox={`0 0 ${model.width * SIZE} ${model.height * SIZE}`}>
                    <rect width={SIZE * model.width} height={SIZE * model.height} fill="lightcyan"/>
                    {result}
                </svg>
            </div>
        </div>;
    }

    private newGame(): void {
        this.props.model.start();
        this.forceUpdate();
        if (this.mainDiv !== null) {
            this.mainDiv.focus();
        }
        this.timeout = setInterval(() => {
            const finished = this.props.model.next();
            if (finished) {
                log("Game finished");
                clearInterval(this.timeout);
            }
        }, 300);
    }

    private onKeyDown(evt: React.KeyboardEvent<HTMLElement>): void {
        switch (evt.keyCode) {
            case 38:
                // arrow up
                this.props.model.rotate();
                break;
            case 40:
                // arrow down
                this.props.model.drop();
                break;
            case 37:
                // arrow left
                this.props.model.left();
                break;
            case 39:
                // arrow right
                this.props.model.right();
                break;
        }
    }

    private next(): void {
        this.props.model.next();
    }
}
