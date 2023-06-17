const DB_NAME = 'hexeldatabase'
const DB_VERSION = 1

const GAMESTORE = 'HEXGAMESTORE'
const GAMESTORE_KEY = { keyPath: 'name' }

let db = null


export class HexType {
    constructor(id, name, color) {
        this.id = id
        this.name = name;
        this.color = color;
    }
}

export class HexLabel {
    constructor(id, category, shortLabel, longLabel) {
        this.id = id
        this.category = category
        this.shortLabel = shortLabel
        this.longLabel = longLabel
    }
}

export class HexSpace {
    constructor(location, labelID, typeID) {
        this.location = location
        this.labelID = labelID
        this.typeID = typeID
    }

    get key() {
        return HexSpace.keyFromLocation(this.location)
    }

    static keyFromLocation(location) {
        return `${location[0]},${location[1]}`
    }

}

export class GameBoard {
    constructor(name) {
        this.name = name
        this.types = new Map();
        this.hexes = new Map();
        this.labels = new Map();
        this.radius = 30;
    }

    get typesList() {
        // Return an array of the types existing
        return Array.from(this.types.values())
    }

    getTypeById(id) {
        let type = this.types.get(id)
        if (type == undefined) {
            throw new Error(`Tried to get type id ${id}, but does not exist: `, this.types)
        }

        return type
    }

    loadFrom(storedObj) {
        this.types = storedObj.types
        this.hexes = storedObj.hexes
        this.labels = storedObj.labels
        this.radius = storedObj.radius
        this.name = storedObj.name
    }

    details(hex) {
        // Return the details (actual HexType and Label properies) or null if the
        // hex does not exist in the board.
        return {
            type: this.getTypeById(hex.typeID),
            label: this.labels.get(hex.labelID)
        }
    }

    detailsAt(location) {
        // Return the details (actual HexType and Label properties at location) given
        // the coordinates of the hex.
        const key = HexSpace.keyFromLocation(location)
        if (this.hexes.has(key)) {
            const hex = this.hexes.get(key)
            return this.details(hex)
        }
        return null
    }

    addType(name, color) {
        let ids = new Set(this.types.keys())

        let newId = 0
        while (ids.has(newId)) {
            newId += 1
        }

        this.types.set(newId, new HexType(newId, name, color))
        console.debug(`Added type ${name} with id ${newId}`)
    }

    removeType(id) {
        let activeHexes = []
        for (let hex in this.hexes.values()) {
            if (hex.typeID == id) {
                activeHexes.push(hex);
            }
        }

        for (let hex in activeHexes) {
            this.hexes.delete(hex.key);
        }
        this.types.delete(id)
    }

    setHexType(location, newHexTypeID) {
        if (newHexTypeID === undefined || newHexTypeID === null) {
            throw new Error('Cannot set a hex type to undefined or null');
        }
        else if (!this.types.has(newHexTypeID)) {
            throw new Error(`Unknown hex type id ${newHexTypeID}. Known: `, this.types)
        }

        let oldHex = this.hexes.get(HexSpace.keyFromLocation(location));
        let label = null

        if (oldHex !== undefined) {
            label = oldHex.labelID
        }

        let newHex = new HexSpace(location, label, newHexTypeID);
        this.hexes.set(newHex.key, newHex);
    }

    clearHex(location) {
        const key = HexSpace.keyFromLocation(location)
        if (this.hexes.has(key)) {
            console.debug(`Removing hex ${location} from the game.`)
        }
        this.hexes.delete(HexSpace.keyFromLocation(location))
    }
}

export async function initialize_db() {
    // If the db is not initialized, a connection is created.
    console.debug('Initializing database')
    if (db == null) {
        return new Promise((resolve, reject) => {
            const request = window.indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = (e) => {
                reject(`Failed to initialize IndexedDB: ${e}`)
            }
            request.onupgradeneeded = (e) => {
                console.debug('Updating datastore')
                const db = e.target.result;

                if (e.oldVersion < 1) {
                    setupVersion1(db);
                }
            }
            request.onsuccess = (e) => {
                console.debug('Datastore successfully established')
                db = e.target.result;
                db.onerror = (e) => { console.error(`Uncaught data error: ${e}`) }
                resolve()
            }
        })
    }
}

function setupVersion1(db) {
    console.debug('IndexedDB updating to version 1');
    const gameStore = db.createObjectStore(GAMESTORE, GAMESTORE_KEY);

    gameStore.transaction.oncomplete = (e) => {
        console.debug('Adding default game board');
        const gameStore = db.transaction([GAMESTORE], "readwrite").objectStore(GAMESTORE);

        let game = new GameBoard('Default');

        game.addType('Default', '#FFFFFF')

        gameStore.add(game);
    }
}

export async function getGameNames() {
    return new Promise((resolve, reject) => {
        const result = db.transaction([GAMESTORE], "readonly")
            .objectStore(GAMESTORE)
            .getAllKeys();
        result.onsuccess = (event) => { resolve(event.target.result) }
        result.onerror = (event) => { reject(event) }
    });
}

export async function getGameByName(name) {
    return new Promise((resolve, reject) => {
        const result = db.transaction([GAMESTORE], "readonly")
            .objectStore(GAMESTORE)
            .get(name);
        result.onsuccess = (event) => { 
            let loadedGame = new GameBoard(event.target.result)
            loadedGame.loadFrom(event.target.result)
            resolve(loadedGame) }
        result.onerror = (event) => { reject(event) }
    });
}

export async function storeGame(game) {
    return new Promise((resolve, reject) => {
        const result = db.transaction([GAMESTORE], "readwrite")
            .objectStore(GAMESTORE)
            .put(game)
        result.onsuccess = (event) => { resolve() }
        result.onerror = (event) => { reject(event) }
    })
}

export async function deleteGameByName(name) {
    return new Promise((resolve, reject) => {
        const result = db.transaction([GAMESTORE], "readwrite")
            .objectStore(GAMESTORE)
            .delete(name)
        result.onsuccess = (event) => { resolve() }
        result.onerror = (event) => { reject(event) }
    })
}