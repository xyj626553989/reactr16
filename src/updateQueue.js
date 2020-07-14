export class Update {
    constructor(payload) {
        this.payload = payload
    }
}

//数据结构时一个单链表
export class UpdateQueue {
    constructor() {
        this.firstUpdate = null;
        this.lastUpdate = null
    }
    enqueueUpdate (update) {
        console.log(update)
        if (this.lastUpdate === null) {
            this.lastUpdate = this.firstUpdate = update
        } else {
            this.lastUpdate.nextUpdate =update 
            this.lastUpdate = update
        }
    }
    forceUpdate(state){
        let currentUpdate = this.firstUpdate
        while (currentUpdate) {
            let nextState = typeof currentUpdate.payload ==="function"?
            currentUpdate.payload(state):currentUpdate.payload
            state = {
                ...state,
                ...nextState,
            }
            currentUpdate=currentUpdate.nextUpdate
        }
        this.lastUpdate = this.firstUpdate = null
        return state
    }
}