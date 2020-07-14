import { TAG_ROOT, TEXT_ELEMENT, TAG_TEXT, TAG_HOST, PLACEMENT, DELETION, UPDATE, TAG_CLASS, TAG_FUNCTION } from "./constants"
import { setProps } from "./utils"
import { UpdateQueue, Update } from "./updateQueue"

let nextUnitOfWork = null//下个工作单元 
let workInProgressRoot = null //根fiber
let currentRoot = null //当前渲染的根fiber
let deletion = [] //要删除的fiber
let workInProgressFiber = null //当前工作的fiber
let hookIndex = 0
function scheduleRoot (rootFiber) {

    if (currentRoot && currentRoot.alternate) {
        workInProgressRoot = currentRoot.alternate
        workInProgressRoot.alternate = currentRoot
        if (rootFiber) workInProgressRoot.props = rootFiber.props
    } else if (currentRoot) {
        if (rootFiber) {
            rootFiber.alternate = currentRoot
            workInProgressRoot = rootFiber
        } else {
            workInProgressRoot = {
                ...currentRoot,
                alternate: currentRoot
            }
        }

    } else {
        workInProgressRoot = rootFiber
    }
    workInProgressRoot.firstEffect = workInProgressRoot.lastEffect = workInProgressRoot.nextEffect = null
    nextUnitOfWork = workInProgressRoot

}
//执行工作单元
function performUnitOfWork (currentFiber) {
    //创建子fiber
    beginWork(currentFiber)
    if (currentFiber.child) {
        return currentFiber.child
    }
    //没有子fiber就让他完成搜集副作用
    while (currentFiber) {
        completeUnitOfWork(currentFiber)
        if (currentFiber.sibling) {
            return currentFiber.sibling
        }
        currentFiber = currentFiber.return
    }
}

function completeUnitOfWork (currentFiber) {
    let returnFiber = currentFiber.return
    if (returnFiber) {
        const effectTag = currentFiber.effectTag
        if (!returnFiber.firstEffect) {
            returnFiber.firstEffect = currentFiber.firstEffect
        }
        if (!!currentFiber.lastEffect) {
            if (!!returnFiber.lastEffect) {
                returnFiber.lastEffect.nextEffect = currentFiber.firstEffect
            }
            returnFiber.lastEffect = currentFiber.lastEffect
        }
        if (effectTag) {
            if (!!returnFiber.lastEffect) {
                returnFiber.lastEffect.nextEffect = currentFiber
            } else {
                returnFiber.firstEffect = currentFiber
            }
            returnFiber.lastEffect = currentFiber
        }
    }
}
//完成 创建真实的dom元素 和子fiber
function beginWork (currentFiber) {
    if (currentFiber.tag === TAG_ROOT) {
        updateHostRoot(currentFiber)
    } else if (currentFiber.tag === TAG_TEXT) {
        updateHostText(currentFiber)
    } else if (currentFiber.tag === TAG_HOST) {
        updateHost(currentFiber)
    } else if (currentFiber.tag === TAG_CLASS) {
        updateClassComponent(currentFiber)
    } else if (currentFiber.tag === TAG_FUNCTION) {
        updateFunctionComponent(currentFiber)
    }
}

function updateFunctionComponent (currentFiber) {
    workInProgressFiber = currentFiber;
    hookIndex = 0;
    workInProgressFiber.hooks = []
    let newChildren = currentFiber.type(currentFiber.props)

    reconcileChildren(currentFiber, [newChildren])
}
function updateClassComponent (currentFiber) {
    if (!currentFiber.stateNode) { //类组件stateNode时组件的实力
        currentFiber.stateNode = new currentFiber.type(currentFiber.props)
        currentFiber.stateNode.internalFiber = currentFiber
        currentFiber.updateQueue = new UpdateQueue()
    }
    currentFiber.stateNode.state = currentFiber.updateQueue.forceUpdate(currentFiber.stateNode.state)
    let newElement = currentFiber.stateNode.render()
    const newChildren = [newElement]
    reconcileChildren(currentFiber, newChildren)

}
function updateHost (currentFiber) {
    if (!currentFiber.stateNode) {
        currentFiber.stateNode = createDOM(currentFiber)
    }
    const newChildren = currentFiber.props.children
    reconcileChildren(currentFiber, newChildren)
}

function createDOM (currentFiber) {
    if (currentFiber.tag === TAG_TEXT) {
        return document.createTextNode(currentFiber.props.text)
    } else if (currentFiber.tag === TAG_HOST) {
        let stateNode = document.createElement(currentFiber.type)
        updateDOM(stateNode, {}, currentFiber.props)
        return stateNode
    }
}

function updateDOM (stateNode, oldProps, newProps) {
    setProps(stateNode, oldProps, newProps)
}
function updateHostText (currentFiber) {
    if (!currentFiber.stateNode) {
        currentFiber.stateNode = document.createTextNode(currentFiber.props.text)
    }
}
function updateHostRoot (currentFiber) {
    //先处理自己  如果是原生节点  创建真实dom 
    const newChildren = currentFiber.props.children
    reconcileChildren(currentFiber, newChildren)
}
//创建子fiber
function reconcileChildren (currentFiber, newChildren) {
    let newChildIndex = 0
    let prevSibling = null //上一个兄弟fiber

    let oldFiber = currentFiber.alternate && currentFiber.alternate.child
    if (oldFiber) oldFiber.firstEffect = oldFiber.lastEffect = oldFiber.nextEffect = null
    while (newChildIndex < newChildren.length || oldFiber) {
        let newChild = newChildren[newChildIndex]
        let newFiber, tag
        const sameType = oldFiber && newChild && newChild.type === oldFiber.type
        if (newChild && typeof newChild.type === "function" && newChild.type.prototype.isReactComponent) {
            tag = TAG_CLASS
        } else if (newChild && typeof newChild.type === "function") {
            tag = TAG_FUNCTION
        }
        else if (newChild && newChild.type === TEXT_ELEMENT) {
            tag = TAG_TEXT
        } else if (newChild && typeof newChild.type === "string") {
            tag = TAG_HOST
        }
        //老大新的dom一样
        if (sameType) {
            if (oldFiber.alternate) { //说明至少渲染过一次了
                newFiber = oldFiber.alternate
                newFiber.props = newChild.props
                newFiber.alternate = oldFiber
                newFiber.effectTag = UPDATE
                newFiber.nextEffect = null
                newFiber.updateQueue = oldFiber.updateQueue || new UpdateQueue()
            } else {
                newFiber = {
                    tag: oldFiber.tag,
                    type: oldFiber.type,
                    props: newChild.props,
                    stateNode: oldFiber.stateNode,
                    updateQueue: oldFiber.updateQueue || new UpdateQueue(),
                    return: currentFiber,
                    alternate: oldFiber, //让心的alternate 指向老的fiber节点
                    effectTag: UPDATE, //副作用标识
                    nextEffect: null //effect list 副作用链表 
                }
            }

        } else {
            if (newChild) {
                newFiber = {
                    tag,
                    type: newChild.type,
                    props: newChild.props,
                    stateNode: null,
                    updateQueue: new UpdateQueue(),
                    return: currentFiber,
                    effectTag: PLACEMENT, //副作用标识
                    nextEffect: null //effect list 副作用链表 
                }
            }
            if (oldFiber) {
                oldFiber.effectTag = DELETION
                deletion.push(oldFiber)
            }

        }
        if (oldFiber) {
            oldFiber = oldFiber.sibling
        }
        if (newFiber) {
            if (newChildIndex === 0) {
                currentFiber.child = newFiber
            } else {
                prevSibling.sibling = newFiber
            }
        }
        prevSibling = newFiber
        newChildIndex++
    }

}
//提交root 挂载页面
function commitRoot () {
    deletion.forEach(commitWork) //先删除
    let currentFiber = workInProgressRoot.firstEffect
    while (currentFiber) {
        commitWork(currentFiber)
        currentFiber = currentFiber.nextEffect
    }
    deletion.length = 0
    currentRoot = workInProgressRoot
    workInProgressRoot = null
}
//挂载
function commitWork (currentFiber) {
    if (!currentFiber) return
    let returnFiber = currentFiber.return
    while (returnFiber.tag !== TAG_ROOT && returnFiber.tag !== TAG_TEXT && returnFiber.tag !== TAG_HOST) {
        returnFiber = returnFiber.return
    }
    let domReturn = returnFiber.stateNode
    if (currentFiber.effectTag === PLACEMENT) {
        let nextFiber = currentFiber
        console.log(nextFiber)
        if (nextFiber.tag === TAG_CLASS || nextFiber.tag === TAG_FUNCTION) {
            return
        }
        //如果要挂载的节点不时dom节点
        while (nextFiber.tag !== TAG_ROOT && nextFiber.tag !== TAG_TEXT && nextFiber.tag !== TAG_HOST) {
            nextFiber = nextFiber.child
        }
        domReturn.appendChild(nextFiber.stateNode)
    } else if (currentFiber.effectTag === DELETION) {
        commitDeletion(currentFiber, domReturn)
        // domReturn.stateNode.removeChild(currentFiber.stateNode)
    } else if (currentFiber.effectTag === UPDATE) {
        if (currentFiber.type === TEXT_ELEMENT) {
            if (currentFiber.props.text !== currentFiber.alternate.props.text) {
                currentFiber.stateNode.textContent = currentFiber.props.text
            }
        } else {
            //更新属性
            updateDOM(currentFiber.stateNode, currentFiber.alternate.props, currentFiber.props)
        }
    }
    currentFiber.effectTag = null
}

function commitDeletion (currentFiber, domReturn) {
    if (currentFiber.tag === TAG_ROOT || currentFiber.tag === TAG_TEXT) {
        domReturn.removeChild(currentFiber.stateNode)
    } else {
        commitDeletion(currentFiber.child, domReturn)
    }
}
function workLoop (deadline) {
    let shouldYield = false
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
        shouldYield = deadline.timeRemaining() < 1
    }

    if (!nextUnitOfWork && workInProgressRoot) {
        commitRoot()
    }
    requestIdleCallback(workLoop, { timeout: 500 })
}

// workInProgressFiber = currentFiber;
//     hookIndex = 0;
//     workInProgressFiber.hooks = []
export function useReducer (reducer, initialValue) {
    let newHook = workInProgressFiber.alternate && workInProgressFiber.alternate.hooks
        && workInProgressFiber.alternate.hooks[hookIndex];
    if (newHook) {
        newHook.state = newHook.updateQueue.forceUpdate(newHook.state)
    } else {
        newHook = {
            state: initialValue,
            updateQueue: new UpdateQueue()
        }
    }
    const dispatch = action => {
        newHook.updateQueue.enqueueUpdate(
            new Update(reducer ? reducer(newHook.state, action) : action)
        );
        scheduleRoot()
    }
    workInProgressFiber.hooks[hookIndex++] = newHook
    return [newHook.state, dispatch]
}

export function useState(initialValue) {
    return useReducer(null,initialValue)
}
requestIdleCallback(workLoop, { timeout: 500 })
export {
    scheduleRoot
} 