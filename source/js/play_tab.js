import { GenericTab } from "./tab.js";
import { HexCanvas } from "./canvas.js";
import { getCurrentGame } from "./game_data_tab.js";

export class PlayTab extends GenericTab {
    displayLabel = 'Play';
    internalLabel = 'play';

    #canvas = null;
    #shortLabelId = 'play-short-desc';
    #longLabelId = 'play-long-desc';
    
    get innerDiv() {
        return $.parseHTML($.trim(`
        <div>
            <div>
                <button id="${this.#rollButton}">Roll</Button>
            </div>
            <canvas id="playcanvas"></canvas>
            <h2 id="${this.#shortLabelId}"></h2>
            <p id="${this.#longLabelId}"></p>
        </div>`))[0]
    }

    setup() {
        this.#canvas = new HexCanvas(document.getElementById('playcanvas'));

        this.#canvas.onClick = async () => {
            const details = (await getCurrentGame()).detailsAt(this.#canvas.cursor)
            let $short = this.my(this.#shortLabelId)
            let $long = this.my(this.#longLabelId)

            if (details) {
                this.#canvas.setFocusHexToCursor();

                if (details.label) {
                    $short.text(details.label.shortLabel)
                    $long.text(details.label.longLabel)
                }
                else {
                    $short.text('')
                    $long.text('')
                }
            }
        }
    }

    activate() {
        this.#canvas.render()
    }
}