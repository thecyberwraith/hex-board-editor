import { BoardHex, HexLabel } from './data.js';
import { getCurrentGame } from './game_data_tab.js';
import { HexCanvas } from './canvas.js';
import { GenericTab } from './tab.js';

export class ActionsTab extends GenericTab {
    displayLabel = 'Specify Actions'
    internalLabel = 'specify'

    #canvas = null;
    #listOfActionSelects = []

    #buttonRandomFill = document.getElementById("select-random-fill");
    #buttonRandomOverwrite = document.getElementById("select-random-overwrite");

    #divActionListArea = document.getElementById("select-action-list-item-lists");
    #divSpecifyArea = document.getElementById("select-specify-div");

    #selectPhase = document.getElementById('select-phase');
    #selectSpecifyLabel = document.getElementById('select-specify-label');
    #selectSpecifyAction = document.getElementById('select-specify-action');

    #buttonSpecifySet = document.getElementById('select-specify-set-button');
    #buttonSpecifyClear = document.getElementById('select-specify-clear-button');

    setup() {
        console.debug('Setting up the action selection tab events.');
        this.#canvas = new HexCanvas(document.getElementById("labelhexcanvas"));

        this.#canvas.onClick = () => {
            if (!get_map().has(Hex.key(this.#canvas.cursor)))
                return

            if (String(this.#canvas.focus) == String(this.#canvas.cursor)) {
                this.#canvas.focus = null;
                this.#divSpecifyArea.style.display = "none";
            }
            else {
                this.#canvas.setFocusHexToCursor()
                this.#divSpecifyArea.style.display = "block";
            }
        }

        this.#buttonRandomFill = document.getElementById("select-random-fill");
        this.#buttonRandomOverwrite = document.getElementById("select-random-overwrite");

        this.#divActionListArea = document.getElementById("select-action-list-item-lists");
        this.#divSpecifyArea = document.getElementById("select-specify-div");

        this.#selectPhase = document.getElementById('select-phase');
        this.#selectSpecifyLabel = document.getElementById('select-specify-label');
        this.#selectSpecifyAction = document.getElementById('select-specify-action');

        this.#buttonSpecifySet = document.getElementById('select-specify-set-button');
        this.#buttonSpecifyClear = document.getElementById('select-specify-clear-button');

        // this.build_all_action_lists();
        // this.build_specify_section();
        // this.#buttonRandomFill.onclick = (e) => { this.randomize_actions(false); };
        // this.#buttonRandomOverwrite.onclick = (e) => { this.randomize_actions(true); };
    }

    get innerDiv() {
        return $.parseHTML($.trim(`
        <div>
            <canvas id="labelhexcanvas"></canvas>
            <div style="display: none;" id="select-specify-div">
                <h3>Update Selected Hex</h3>
                <select id="select-specify-label"></select>
                <select id="select-specify-action"></select>
                <button id="select-specify-set-button">Specify Action</select>
                <button id="select-specify-clear-button">Clear Action</button>
            </div>
            <div>
                <h3>Randomize Hexes</h3>
                <select id="select-phase"></select>
                <button id="select-random-fill">
                    Random Fill Missing
                </button>
                <button id="select-random-overwrite">
                    Random Overwrite
                </button>
            </div>
            <div>
                <h4>Customize Randomization</h4>
                <div id="select-action-list-item-lists"></div>
            </div>
        </div>`))[0]
    }

    activate() {
        this.update_phase_selector();
        this.#canvas.render()
    }

    deactivate() {
        this.#divSpecifyArea.style.display = "none";
    }

    build_all_action_lists() {
        this.#listOfActionSelects = []

        for (let actionList of ALL_ACTION_OPTIONS) {
            let element = document.createElement('div');
            element.id = `select-list-div-${actionList.label}`
            let message = document.createElement('p');
            message.innerHTML = `Options for ${actionList.label} actions`;

            let list = this.build_action_list(actionList.options);

            let clear = document.createElement('button');
            clear.innerHTML = 'Clear';
            clear.onclick = () => {
                list.childNodes.forEach(option => option.selected = false);
            };

            let all = document.createElement('button');
            all.innerHTML = 'All';
            all.onclick = () => {
                list.childNodes.forEach(option => option.selected = true);
            };

            element.appendChild(message);
            element.appendChild(list);
            element.appendChild(all);
            element.appendChild(clear);

            this.#divActionListArea.appendChild(element);

            this.#listOfActionSelects.push(list);
        }
    }

    build_specify_section() {
        this.#selectSpecifyLabel.onchange = (e) => {this.update_specify_actions(e)};
        this.#buttonSpecifyClear.onclick = (e) => {
            get_map().get(Hex.key(this.#canvas.focus)).action = null;
            this.#canvas.render();
        }
        this.#buttonSpecifySet.onclick = (e) => {
            let groupIndex = parseInt(this.#selectSpecifyLabel.value);
            let actionIndex = parseInt(this.#selectSpecifyAction.value);
            let action = ALL_ACTION_OPTIONS[groupIndex].options[actionIndex];
            get_map().get(Hex.key(this.#canvas.focus)).action = action;
            this.#canvas.render();
        }
        for (let i = 0; i < ALL_ACTION_OPTIONS.length; i++) {
            let label = ALL_ACTION_OPTIONS[i].label;
            let option = document.createElement('option');
            option.innerHTML = label;
            option.value = i;
            this.#selectSpecifyLabel.appendChild(option);
        }

        this.update_specify_actions();
    }

    build_action_list(listOfActions) {
        let select = document.createElement('select');
        select.multiple = true;

        for (var i = 0; i < listOfActions.length; i++) {
            let action = listOfActions[i]
            let option = document.createElement('option');
            option.innerHTML = '(' + action.abbreviation + ') ' + action.description;
            option.selected = true;
            option.value = i;
            select.appendChild(option);
        }

        return select;
    }


    update_specify_actions(e) {
        let labelIndex = parseInt(this.#selectSpecifyLabel.value);
        let options = ALL_ACTION_OPTIONS[labelIndex].options;

        while (this.#selectSpecifyAction.childElementCount > 0) {
            this.#selectSpecifyAction.removeChild(this.#selectSpecifyAction.children[0]);
        }

        for (let i = 0; i < options.length; i++) {
            let option = document.createElement('option');
            option.value = i;
            option.innerHTML = `(${options[i].abbreviation}) ${options[i].description}`
            this.#selectSpecifyAction.appendChild(option);
        }
    }

    update_phase_selector() {
        if (getMaxPhase() === this.#selectPhase.childElementCount) {
            return;
        }
        while (this.#selectPhase.childElementCount > 0)
            this.#selectPhase.removeChild(this.#selectPhase.children[0]);

        for (let i = 0; i < getMaxPhase(); i++) {
            let option = document.createElement('option');
            option.innerHTML = `Randomize Phase ${i + 1}`;
            option.value = i;
            this.#selectPhase.appendChild(option);
        }
    }

    randomize_actions(overwrite) {
        console.debug("Assigning random actions");
        let all_options = this.getChosenOptions();
        let phase = parseInt(this.#selectPhase.value);

        get_map().forEach(hex => {
            if (hex.phase !== phase || (hex.action !== null && !overwrite) || all_options.length === 0)
                return;

            let index = Math.floor(Math.random() * all_options.length);
            hex.action = all_options[index];
        });
        this.#canvas.render();
    }

    getChosenOptions() {
        let options = []
        for (let i = 0; i < this.#listOfActionSelects.length; i++) {
            let chosen = this.#listOfActionSelects[i].selectedOptions;
            for (let j = 0; j < chosen.length; j++) {
                let option_index = chosen.item(j).value;
                let action = ALL_ACTION_OPTIONS[i].options[option_index];
                options.push(action);
            }
        }

        return options
    }
}