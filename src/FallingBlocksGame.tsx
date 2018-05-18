import * as React from "react";
import {FallingBlocksModel, Piece} from "./FallingBlocksModel";
import {observer} from "mobx-react";
import Timer = NodeJS.Timer;

interface IFieldProps {
    color: string;
    x: number;
    y: number;
}

@observer
export class FieldComponent extends React.Component<IFieldProps> {
    constructor(props: IFieldProps) {
        super(props);
    }

    public render(): JSX.Element | null {
        const transform = `translate(${this.props.x * 10},${300 - this.props.y * 10})`;
        return <rect transform={transform} width={10} height={10} fill={this.props.color}/>;
    }

}

interface IPieceProps {
    model: typeof Piece.Type;
}


@observer
export class PieceComponent extends React.Component<IPieceProps> {
    constructor(props: IPieceProps) {
        super(props);
    }

    public render(): JSX.Element {
        const model = this.props.model;
        // use relative coordinates as index
        return <g>
            {model.children.map(
                b => <FieldComponent key={b.dx + 10 * b.dy} x={model.x + b.dx} y={model.y + b.dy}
                                     color={model.color}/>)}
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
    }

    private newGame(): void {
        this.props.model.start();
        if (this.mainDiv !== null) {
            this.mainDiv.focus();
        }
        this.timeout = setInterval(() => {
            const finished = this.props.model.next();
            if (finished) {
                clearTimeout(this.timeout);
            }
        }, 100);
    }

    public render(): JSX.Element {
        const result: JSX.Element[] = [];
        // use coordinates as index, this should work for quite big falling blocks games ;-)
        this.props.model.pieces.forEach((p, idx) => {
            result.push(<PieceComponent key={p.x + 1000 * p.y} model={p}/>);
        });

        return <div style={{margin: "10px"}}>
            <div>
                <button onClick={this.newGame} title="New Game">New Game</button>
                <p>Score: {this.props.model.score}</p>
                {this.props.model.finished ? <h2>You filled blocks up to the top, Game Finished</h2> : null}
            </div>
            <div onKeyDown={this.onKeyDown} tabIndex={1} ref={(c) => {
                this.mainDiv = c;
            }} style={{outline: "none"}}>
                <svg width="600" height="600" viewBox="0 0 600 600">
                    {result}
                </svg>
            </div>
        </div>;
    }

    private onKeyDown = (evt: React.KeyboardEvent<HTMLElement>) => {
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
}