import { TAG_ROOT, TEXT_ELEMENT, TAG_TEXT, TAG_HOST, PLACEMENT, DELETION, UPDATE } from "./constants"
import { setProps } from "./utils"

let nextUnitOfWork = null//下个工作单元 
let workInProgressRoot = null //根fiber
let currentRoot = null //当前渲染的根fiber
let deletion = [] //要删除的fiber
function scheduleRoot (rootFiber) {
    if(currentRoot && currentRoot.alternate){
        workInProgressRoot = currentRoot.alternate
        workInProgressRoot.props = rootFiber.props
        workInProgressRoot.alternate = currentRoot
    }else if(!!currentRoot){
        rootFiber.alternate = currentRoot
        workInProgressRoot = rootFiber
    }else {
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
    }
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
    let oldFiber = currentFiber.alternate &&  currentFiber.alternate.child
    while (newChildIndex < newChildren.length || oldFiber) {
        let newChild = newChildren[newChildIndex]
        let newFiber, tag
        const sameType = oldFiber && newChild && newChild.type === oldFiber.type
        if (newChild && newChild.type === TEXT_ELEMENT) {
            tag = TAG_TEXT
        } else if ( newChild && typeof newChild.type === "string") {
            tag = TAG_HOST
        }
        //老大新的dom一样
        if(sameType){
            newFiber = {
                tag:oldFiber.tag,
                type: oldFiber.type,
                props: newChild.props,
                stateNode: oldFiber.stateNode,
                return: currentFiber,
                alternate:oldFiber, //让心的alternate 指向老的fiber节点
                effectTag: UPDATE, //副作用标识
                nextEffect: null //effect list 副作用链表 
            }
        }else {
            if(newChild){
                newFiber = {
                    tag,
                    type: newChild.type,
                    props: newChild.props,
                    stateNode: null,
                    return: currentFiber,
                    effectTag: PLACEMENT, //副作用标识
                    nextEffect: null //effect list 副作用链表 
                }
            }
            if(oldFiber){
                oldFiber.effectTag = DELETION
                deletion.push(oldFiber)
            }
           
        }
        if(oldFiber){
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
    let fiberReturn = currentFiber.return
    let stateNode = currentFiber.stateNode
    if (currentFiber.effectTag === PLACEMENT) {
        fiberReturn.stateNode.appendChild(stateNode)
    } else if(currentFiber.effectTag === DELETION){
     
        fiberReturn.stateNode.removeChild(currentFiber.stateNode)
    } else if(currentFiber.effectTag === UPDATE){
        if(currentFiber.type === TEXT_ELEMENT){
            if(currentFiber.props.text !==currentFiber.alternate.props.text){
                currentFiber.stateNode.textContent = currentFiber.props.text
            }
        }else {
            //更新属性
            updateDOM(currentFiber.stateNode,currentFiber.alternate.props,currentFiber.props)
        }
    }
    currentFiber.effectTag = null
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

requestIdleCallback(workLoop, { timeout: 500 })
export {
    scheduleRoot
} 