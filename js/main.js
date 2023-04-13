import { LevelTab } from './level_tab.js'
import { ActionsTab } from './action_tab.js';
import { PlayTab } from './play_tab.js';
import { LabelTab } from './label_tab.js';
import { GameDataTab } from './game_data_tab.js';
import { initialize_db } from './data.js';

const ALL_TABS = [new LevelTab(), new ActionsTab(), new PlayTab(), new GameDataTab()]

var current_tab = null;
var highlight = null;
var mouseDown = false;

const tabContainer = document.getElementById("tabs-container");
const tabContentContainer = document.getElementById("main-content");

function render() {
    canvasRender(highlight);
}

export async function setup() {
    console.debug("Starting hex game setup");

    await initialize_db();

    setup_tabs();

    $(document).foundation();

    $('#tabs-container').on('change.zf.tabs', function () {
            ALL_TABS.forEach(tab => {
                tab.updateVisibility($(`#${tab.internalLabel}:visible`).length !== 0);
                if (tab.visible) {
                    current_tab = tab;
                }
            });
        });

    ALL_TABS.forEach(tab => tab.setup(render));
    ALL_TABS[0].activate();
    current_tab = ALL_TABS[0];

    console.log('Setup complete.');
}

function setup_tabs() {
    for (let tab of ALL_TABS) {
        tabContainer.appendChild(createTab(tab))
        tabContentContainer.appendChild(tab.createDiv())
    }

    tabContainer.children[0].classList.add('is-active')
    tabContentContainer.children[0].classList.add('is-active')

    new Foundation.Tabs($('#tabs-container'))
}

function createTab(tab) {
    return $(`<li class="tabs-title"><a href="#${tab.internalLabel}">${tab.displayLabel}</a></li>`)[0];
}