import { Update } from "./updateQueue"
import { scheduleRoot,useReducer,useState } from "./scheduler"


const { TEXT_ELEMENT } = require("./constants")



function createElement (type, config, ...children) {
    delete config.__self
    delete config.__source
    return {
        type,
        props: {
            ...config,
            children: children.map(child => {
                return typeof child === "object" ? child : {
                    type: TEXT_ELEMENT,
                    props: {
                        children: [],
                        text: child
                    }

                }
            })
        }
    }
}

class Component {
    constructor(props){
        this.props = props
    }
    setState(payload){
        let update = new Update(payload)
        this.internalFiber.updateQueue.enqueueUpdate(update)
        scheduleRoot()
    }
}
Component.prototype.isReactComponent = {}
const React = {
    createElement,
    Component,
    useReducer,
    useState
}
export {
    createElement,
    Component,
    useReducer,
    useState
}
export default React