import React from './react';
import ReactDOM from './react-dom';
const style ={
    border:"1px solid red",
    margin:"20px"
}
const element = (
    <div style={style}>
        A1
        <div id="A2" style={style}>A2</div>
        <div id="A3" style={style}>
            <div id="B1" style={style}>B1</div>
            <div id="B2" style={style}>B2</div>
        </div>
    </div>
)
ReactDOM.render(
    element,
  document.getElementById('root')
);

let render2 = document.getElementById("render2")
let render3 = document.getElementById("render3")


render2.onclick = ()=> {
    const element = (
        <div style={style}>
            A1-new
            <div id="A2-new" style={style}>A2-new</div>
            <div id="A3-new" style={style}>
                <div id="B1-new" style={style}>B1-new</div>
                <div id="B2-new" style={style}>B2-new</div>
                <div id="B3" style={style}>B3</div>
            </div>
        </div>
    )
    ReactDOM.render(
        element,
      document.getElementById('root')
    );
}

render3.onclick = ()=> {
    const element = (
        <div style={style}>
            A1-new
            <div id="A2-new" style={style}>A2-new</div>
            <div id="A3-new" style={style}>
                <div id="B1-new" style={style}>B1-new</div>
                <div id="B2-new" style={style}>B2-new</div>
            </div>
        </div>
    )
    ReactDOM.render(
        element,
      document.getElementById('root')
    );
}

