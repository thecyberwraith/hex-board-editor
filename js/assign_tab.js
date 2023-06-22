import { HexCanvas } from "./canvas.js";
import { getCurrentGame, modificationNotification } from "./game_data_tab.js";
import { GenericTab } from "./tab.js";

export class AssignLabelTab extends GenericTab {
    displayLabel = 'Assign Labels'
    internalLabel = 'assignlabels'

    #canvas = null;
    #canvasId = 'assign-label-canvas'

    #assignSingleMenuDiv = 'assign-label-single-assign-div'
    #assignSingleMenu = 'assign-label-single-assign'
    #assignSingleSelection = 'assign-label-single-selection'

    #currentlySelected = undefined

    #randomEmptyButton = 'assign-label-random-empty'
    #randomAllButton = 'assign-label-random-all'
    #randomType = 'assign-label-random-type-choice'
    #randomOptions = 'assign-label-random-options'

    get innerDiv() {
        return $.parseHTML($.trim(`
        <div>
            <canvas id="${this.#canvasId}"></canvas>
            <h3>Assign Specific</h3>
            <p id="${this.#assignSingleSelection}"></p>
            <div id="${this.#assignSingleMenuDiv}"></div>
            <h3>Randomize</h3>
            <div class="grid-x">
                <button id="${this.#randomEmptyButton}" class="button cell medium-2">Randomize Empty</button>
                <button id="${this.#randomAllButton}" class="button cell medium-2">Randomize All</button>
                <select id="${this.#randomType}" class="cell medium-4">
                </select>
            </div>
            <div id="${this.#randomOptions}"></div>
        </div>
        `))[0]
    }

    async setup() {
        this.#canvas = new HexCanvas(this.my(this.#canvasId)[0])
        this.#canvas.onClick = () => { this.applySelectedLabel() }
        this.my(this.#randomEmptyButton).on('click', e => { this.randomFill(false) })
        this.my(this.#randomAllButton).on('click', e => { this.randomFill(true) })
    }

    activate() {
        this.#canvas.render()
        this.populateAssignOptions()
        this.populateRandomizeOptions()
    }

    async populateAssignOptions() {
        const game = await getCurrentGame()
        const idPrefix = 'assign-label-assign-single-category-'
        
        this.my(this.#assignSingleMenuDiv).empty()

        let $menu = $(`<ul class="vertical menu" data-drilldown id="${this.#assignSingleMenu}">`)
        
        for(let [category, labels] of game.categoryLabelMap) {
            let $category = $('<li>')
            $category.append($('<a href="#0">').text(category))
            
            const id = idPrefix + category
            let $items = $(`<ul class="vertical menu" id="${id}">`)
            for(let label of labels) {
                const text = `${label.shortLabel}: ${label.longLabel}`
                $items.append($('<li>').append($('<a href="#0">')
                    .text(text)
                    .on('click', e => {
                        this.updateSelectedSingleAssignment(label)
                    })))
            }
            $category.append($items)
            $menu.append($category)
        }
        this.my(this.#assignSingleMenuDiv).append($menu)
        $menu.foundation()

        this.updateSelectedSingleAssignment()
    }

    updateSelectedSingleAssignment(label) {
        this.#currentlySelected = label

        let text = 'Not applying any label.'

        if (this.#currentlySelected != undefined) {
            text = `Applying label ${label.shortLabel}: ${label.longLabel}`
        }

        let $p = this.my(this.#assignSingleSelection)
        $p.empty()
        $p.text(text)

        if (this.#currentlySelected != undefined) {
            $p.append(
                $('<button class="button">')
                .text('Clear Selection')
                .on('click', e => {
                    this.updateSelectedSingleAssignment()
                }))
        }
    }

    async applySelectedLabel() {
        console.debug(`Applying label ${this.#currentlySelected} to ${this.#canvas.cursor}`)
        let game = await getCurrentGame()

        let labelId = null

        if (this.#currentlySelected != undefined) {
            labelId = this.#currentlySelected.id
        }
        game.setHexLabel(this.#canvas.cursor, labelId)
        this.#canvas.render()
        modificationNotification()
    }

    async populateRandomizeOptions() {
        const game = await getCurrentGame()

        let $types = this.my(this.#randomType)
        $types.empty()

        game.typesList.forEach( type => {
            $types.append($('<option>').val(type.id).text(type.name))
        } )

        let $div = this.my(this.#randomOptions)
        $div.empty()

        let createCheckbox = (base, id, text) => {
            let $box = $(`<input type="checkbox" id="${id}">`)
            
            base.append($box).append($(`<label for="${id}">`).text(text))

            return $box
        }

        for(let [category, labels] of game.categoryLabelMap) {
            const catLabel = `assign-random-checkbox-${category}`
            const allLabel = `${catLabel}-all`
            let $set = $(`<fieldset id="${catLabel}">`)
            $set.append($('<legend>').text(`Category ${category}`))
            createCheckbox($set, allLabel, 'Toggle All').change( e => {
                let elements = $(`#${catLabel} input[type='checkbox']:not(#${allLabel})`)
                elements.prop('checked', e.target.checked)
            })
            labels.forEach( label => {
                createCheckbox(
                    $set,
                    `${catLabel}-${label.id}`,
                    `${label.shortLabel}: ${label.longLabel}`
                ).val(label.id)
            })
            $div.append($set)
        }
    }

    async randomFill(overwrite) {
        let game = await getCurrentGame()
        
        let hexes = game.queryHexesByTypeId(parseInt(this.my(this.#randomType).val()))

        if (!overwrite)
            hexes = hexes.filter( hex => { 
                const label = game.detailsById(hex).label
                return label == undefined || label == null
            } )

        const labelIds = $(`#${this.#randomOptions} input[type='checkbox']`)
            .filter( (index, elem) => elem.checked && !elem.id.endsWith('all') )
            .map( (index, elem) => parseInt(elem.value) )
            .get()

        if (labelIds.length == 0 || hexes.length == 0) {
            console.warn('Cannot assign labels randomly. Not enough hexes or options.')
            return
        }

        for(const hexId of hexes) {
            const rand = Math.floor(Math.random() * labelIds.length)
            game.setHexLabelByIds(hexId, labelIds[rand])
        }

        modificationNotification()
        this.#canvas.render()
    }
}