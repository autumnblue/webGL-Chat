class SessionStorage {
    constructor() {
        this.sessions = new Map();
        this.names_to_ids = new Map();
    }

    addSession(user) {
        this.sessions.set(user.id, user);
        this.names_to_ids.set(user.name, user.id);
    }

    getSessionById(id) {
        return this.sessions.get(id);
    }

    getSessionByName(name) {
        if (this.names_to_ids.has(name)) {
            return this.sessions.get(this.names_to_ids.get(name));
        }
        return null;
    }

    serialize() {
        for (let [key, user] of this.sessions) {
            user.serialize();
        }
    }
}

module.exports = SessionStorage;