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
    const React = {
        createElement
    }
    export {
        createElement
    }
    export default React