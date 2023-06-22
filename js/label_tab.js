import { getCurrentGame, modificationNotification } from "./game_data_tab.js"
import { GenericTab } from "./tab.js"

export class LabelTab extends GenericTab {
    displayLabel = 'Manage Labels'
    internalLabel = 'editlabels'

    #editor = "label-editor-editor"
    #editorId = "label-editor-editor-id"
    #editorCategory = "label-editor-editor-category"
    #editorCategoryData = "label-editor-editor-category-data"
    #editorShort = "label-editor-editor-short"
    #editorLong = "label-editor-editor-long"
    #editorSubmit = "label-editor-editor-submit"
    
    #categoryDiv = "label-editor-categories"
    #newLabel = "label-editor-new-label"

    get innerDiv () {
        return $.parseHTML($.trim(`
        <div>
            <h2>Edit Labels</h2>
            <dialog id="${this.#editor}">
                <form>
                    <input type="hidden" id="${this.#editorId}" />
                    <label>Category:
                        <input type="text" id="${this.#editorCategory}" list="${this.#editorCategoryData}" />
                        <datalist id="${this.#editorCategoryData}"></datalist>
                    </label>
                    <label>Short Description:
                        <input type="text" id="${this.#editorShort}" />
                    </label>
                    <label>Long Description:
                        <input type="text" id="${this.#editorLong}" />
                    </label>
                    <button class="button" id="${this.#editorSubmit}">Save</button>
                    <button class="button alert" formmethod="dialog">Cancel</button>
                </form>
            </dialog>
            <button class="button" id="${this.#newLabel}">New Label</button>
            <div id="${this.#categoryDiv}"></div>
        </div>`))[0]
    }

    async setup() {
        this.prepareEditor()
        this.my(this.#newLabel).on("click", e => {this.openEditor()})
    }

    activate() {
        this.populateCategories()
    }

    prepareEditor() {
        let $editor = this.my(this.#editor)

        $editor.on("close", e => {
            if (e.target.returnValue == 'Save') {
                this.saveLabel()
            }
        })

        this.my(this.#editorSubmit).on("click", e => {
            e.preventDefault()
            $editor[0].close('Save')
        })
    }

    async openEditor(labelId) {
        let category = ''
        let short = ''
        let long = ''

        console.debug('Editing label ', labelId)
        if (labelId == undefined) {
            labelId = -1
        }
        else {
            const game = await getCurrentGame()
            const label = game.getLabelById(labelId)
            category = label.category
            short = label.shortLabel
            long = label.longLabel
        }

        this.my(this.#editorId).val(labelId)
        this.my(this.#editorCategory).val(category)
        this.my(this.#editorShort).val(short)
        this.my(this.#editorLong).val(long)

        let editor = this.my(this.#editor)[0]

        editor.returnValue = ''
        this.my(this.#editor)[0].showModal()
    }

    async saveLabel() {
        console.debug('Saving label')

        const id = parseInt(this.my(this.#editorId).val())
        const category = this.my(this.#editorCategory).val()
        const short = this.my(this.#editorShort).val()
        const long = this.my(this.#editorLong).val()

        let game = await getCurrentGame()

        if (id == -1) {
            console.debug('Saving new label')
            game.createLabel(category, short, long)
        }
        else {
            game.updateLabel(id, category, short, long)
        }
        modificationNotification()
        await this.populateCategories()
    }

    async populateCategories() {
        let game = await getCurrentGame()
        let labelMap = game.categoryLabelMap
        let $cats = this.my(this.#categoryDiv)

        $cats.empty()

        for(let [category, labels] of labelMap) {
            let $catDiv = $('<div class="cell">')
            let $labelTable = $('<tbody>')

            $catDiv.append($('<h3>').text(category))
                .append($('<table class="hover">').append($labelTable))
            
            labels.forEach( label => {
                $labelTable.append($('<tr>')
                    .append($('<td>').text(label.shortLabel))
                    .append($('<td>').text(label.longLabel))
                    .append($('<td>').append(
                        $('<button class="button alert">')
                            .text('Delete')
                            .on('click', async e => {
                                let game = await getCurrentGame()
                                game.deleteLabelById(label.id)
                                modificationNotification()
                                this.populateCategories()
                            })
                        )
                    )
                )
                .on('dblclick', e => {
                    this.openEditor(label.id)
                })
            })
            $cats.append($catDiv)
        }
        $cats.foundation()
    }
}