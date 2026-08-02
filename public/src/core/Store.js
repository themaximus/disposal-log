class Store {
    constructor() {
        this.state = {
            currentUser: null,
            currentBoardId: null,
            boards: [],
            columns: [],
            tasks: [],
            tags: [],
            sidebarCollapsed: localStorage.getItem('sidebar_collapsed') === 'true'
        };
        this.listeners = [];
    }

    getState() {
        return this.state;
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }
}

window.appStore = new Store();
if (typeof module !== 'undefined') module.exports = Store;
