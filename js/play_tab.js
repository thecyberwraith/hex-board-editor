import { GenericTab } from "./tab.js";
import { HexCanvas } from "./canvas.js";
import { getCurrentGame } from "./game_data_tab.js";

export class PlayTab extends GenericTab {
    displayLabel = 'Play';
    internalLabel = 'play';

    #canvas = null;
    #labelHeading = null;
    #actionParagraph = null;
    
    get innerDiv() {
        return $.parseHTML($.trim(`
        <div>
            <canvas id="playcanvas"></canvas>
            <h2 id="play-abbreviation"></h2>
            <p id="play-description"></p>
        </div>`))[0]
    }

    setup() {
        this.#labelHeading = document.getElementById('play-abbreviation');
        this.#actionParagraph = document.getElementById('play-description');
        this.#canvas = new HexCanvas(document.getElementById('playcanvas'));

        this.#canvas.onClick = () => {
            this.#canvas.setFocusHexToCursor();

            if (get_map().has(Hex.key(this.#canvas.focus))) {

                let action = get_map().get(Hex.key(this.#canvas.focus)).action;
                if (action !== null) {
                    this.#labelHeading.innerHTML = action.abbreviation;
                    this.#actionParagraph.innerHTML = action.description;
                }
                else {
                    this.#labelHeading.innerHTML = '';
                    this.#actionParagraph.innerHTML = '';
                }
            }
        }
    }

    activate() {
        this.#canvas.render()
    }
}