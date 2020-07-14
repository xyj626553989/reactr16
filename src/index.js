
import React from './react';
import ReactDOM from './react-dom';

class ClassCounter extends React.Component {
    constructor(props) {
        super(props)
        this.state = { number: 0 }
    }
    onClick = () => {
        this.setState(state => ({ number: state.number + 1 }))
    }
    render () {
        return (
            <div>
                <div>{this.state.number}</div>
                <button onClick={this.onClick}>加1</button>
            </div>
        )
    }
}
const ADD = "ADD"
function reducer (state, action) {
    switch (action.type) {
        case ADD:
            return { count: state.count + 1 }
        default:
            return state
    }
}
function FunctionCounter (props) {
    const [counterState, dispatch] = React.useReducer(reducer, { count: 0 })
    const [state, setState] = React.useState( { count: 0 })
    return (
        <div>
            <div>{counterState.count}</div>
            <button onClick={() => dispatch({ type: ADD })}>加1</button>
            <div>{state.count}</div>
            <button onClick={() => setState({count:state.count+1})}>加1</button>
        </div>
    )
}
ReactDOM.render(<FunctionCounter />, document.getElementById("root"))