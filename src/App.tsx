import * as React from "react";
import "./App.css";
import {FallingBlockGame} from "./FallingBlocksGame";
import {FallingBlocksModel} from "./FallingBlocksModel";

class App extends React.Component {
    public render(): JSX.Element {
        return (
            <div className="App">
                <header className="App-header">
                    <svg width="70" height="89" id="svg2440">
                        <rect transform="translate(10,10)" width={10} height={10} fill="red"/>
                        <rect transform="translate(21,10)" width={10} height={10} fill="red"/>
                        <rect transform="translate(21,21)" width={10} height={10} fill="red"/>
                        <rect transform="translate(10,21)" width={10} height={10} fill="red"/>
                    </svg>
                    <h1 className="App-title">Welcome to Falling Blocks</h1>
                    <p> by Marco van Meegen 2018-05-18</p>
                </header>
                <FallingBlockGame model={FallingBlocksModel.create()}/>
            </div>
        );
    }
}

export default App;
