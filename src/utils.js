

export function setProps (dom, oldProps, newProps) {
    for (const key in oldProps) {
        if (key !== "children") {
            if (newProps.hasOwnProperty(key)) {
                setProp(dom, key, newProps[key])
            } else {
                dom.removeAttribute(key)
            }
        }
    }
    for (const key in newProps) {
        if (key !== "children") {
            if (!oldProps.hasOwnProperty(key)) {
                setProp(dom, key, newProps[key])
            }
        }
        
    }
}

function setProp (dom, key, value) {
    if (/^on/.test(key)) {
        dom[key.toLowerCase()] = value
    } else if (key === "style") {
        if (value) {
            for (const styleName in value) {
                if (value.hasOwnProperty(styleName)) {
                    dom.style[styleName] = value[styleName];

                }
            }
        }
    } else {
        dom.setAttribute(key, value)
    }
}