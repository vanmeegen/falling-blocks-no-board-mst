import * as React from "react";
import {FallingBlocksModel, Piece} from "./FallingBlocksModel";
import {observer} from "mobx-react";
import Timer = NodeJS.Timer;

function log(msg: string): void {
    // console.log(msg);
}

// render size in pixel
const size = 10;

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
        const transform = `translate(${this.props.x * size},${this.props.totalHeightPixel - this.props.y * size})`;
        return <rect transform={transform} width={size} height={size} fill={this.props.color}/>;
    }

}

interface IPieceProps {
    totalHeightPixel: number;
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
                b => <BlockComponent key={b.dx + 10 * b.dy} x={model.x + b.dx} y={model.y + b.dy}
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
            result.push(<PieceComponent key={p.id} model={p} totalHeightPixel={model.height * size}/>);
        });
        const a = model.activePiece;
        if (a) {
            result.push(<PieceComponent key={a.x + 1000 * a.y} model={a} totalHeightPixel={model.height * size}/>);
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
                <svg width={model.width * 10} height={model.height * 10}
                     viewBox={`0 0 ${model.width * size} ${model.height * size}`}>
                    <rect width={size * model.width} height={size * model.height} fill="lightcyan"/>
                    {result}
                </svg>
            </div>
        </div>;
    }

    private newGame(): void {
        this.props.model.start();
        if (this.mainDiv !== null) {
            this.mainDiv.focus();
        }
        this.timeout = setInterval(() => {
            const finished = this.props.model.next();
            if (finished) {
                log("Game finished");
                clearInterval(this.timeout);
            }
        }, 1000);
    }

    private onKeyDown(evt: React.KeyboardEvent<HTMLElement>): void {
        switch (evt.keyCode) {
            case 38:
                // arrow up
                // TODO: this.props.model.rotate();
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
