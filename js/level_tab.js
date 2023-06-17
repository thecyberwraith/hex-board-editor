import { phaseColors, HexCanvas } from "./canvas.js";
import { HexSpace, HexType, GameBoard } from "./data.js";
import { getCurrentGame, modificationNotification } from "./game_data_tab.js";
import { GenericTab } from "./tab.js";

export class LevelTab extends GenericTab {
    displayLabel = 'Level Design'
    internalLabel = 'leveldesign'
    #canvas = null;

    #hexSizeInput = 'levelDesignHexSize'
    #hexTypesList = 'levelDesignHexTypes'
    #applicatorInput = 'levelDesignApplicator'

    async setup() {
        console.debug('Setting up the level design tab events.');

        this.#canvas = new HexCanvas(document.getElementById('leveldesigncanvas'));

        $(`#${this.#hexSizeInput}`).on("change", async (e) => {
            (await getCurrentGame()).radius = parseInt(e.target.value)
            await this.#canvas.render()
        })
        
        this.#canvas.onClick = () => {
            this.setHexType(this.#canvas.cursor)
        }

        this.#canvas.onMove = () => {
            if (this.#canvas.mouseDown)
                this.setHexType(this.#canvas.cursor);
        }
    }

    async activate() {
        await this.refresh()
    }

    get innerDiv () {
        return $.parseHTML($.trim(`
        <div>
            <canvas id="leveldesigncanvas"></canvas>
            <h2>Edit Hex Types</h2>
            <div class="grid-x" id="${this.#hexTypesList}">
            </div>
            <h2>Paint Hex</h2>
            <select id="${this.#applicatorInput}"></select>
            <h2>Edit Display</h2>
            <div>
                <label>Hex Size: </label>
                <input id="${this.#hexSizeInput}" type="range" min="20" max="100" value="30"></input>
            </div>
        </div>`))[0];        
    }

    async refresh(only_canvas=false) {
        let updates = null

        if (only_canvas) {
            updates = [this.#canvas.render()]
        }
        else {
            updates = [
                this.populateHexTypes(),
                this.populateApplicator(),
                (async () => {$(`#${this.#hexSizeInput}`).value = (await getCurrentGame()).radius})(),
                this.#canvas.render()
            ]
        }
        return Promise.all(updates)
    }

    async populateHexTypes() {
        const game = await getCurrentGame()
        let $div = $(`#${this.#hexTypesList}`)
        $div.empty()
        game.types.forEach( hexType => {
            let $subdiv = $('<div class="cell">')
                .append($('<p>')).text(hexType.name)
                .append($(`<input type="color" value="${hexType.color}">`)
                    .on("change", async (e) => {
                        hexType.color = e.target.value
                        modificationNotification()
                        this.refresh()
                    })
                )
            if (game.types.size > 1) {
                $subdiv.append($(`<button class="button alert">Delete</button>`)
                    .on("click", async (e) => {
                        const game = (await getCurrentGame())
                        game.removePhase()
                        modificationNotification()
                        this.refresh()
                    })
                )
            }

            $div.append($subdiv)
        })
        $div.append($('<button class="button">New</button>')
            .on("click", async (e) => {
                const name = prompt("Name the new hex type.")
                if (!name) {
                    return
                }
                const game = await getCurrentGame()
                if (game.types.has(name)) {
                    alert("Name is already taken.")
                    return
                }
                
                game.addType(name, '#FFFFFF')
                modificationNotification()
                this.refresh()
            }))
    }

    async populateApplicator() {
        const $select = $(`#${this.#applicatorInput}`)

        $select.empty()

        const game = await getCurrentGame()
        let types = game.typesList

        for(let i in types) {
            $select.append($(`<option value="${i}">${types[i].name}</option>`))
        }

        $select.append($('<option value="-1">Clear</option>'))
    }

    async setHexType(location) {
        const game = await getCurrentGame();
    
        let value = parseInt(document.getElementById(this.#applicatorInput).value);
        let key = HexSpace.keyFromLocation(location);
    
        if (value === "-1") {
            game.hexes.delete(key);
            this.refresh(true)
            modificationNotification()
        }
        else if (!game.hexes.has(key) || game.hexes.get(key).phase !== value) {
            game.setHexType(location, value)
            this.refresh(true)
            modificationNotification()
        }
    }
}