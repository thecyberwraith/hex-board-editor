import { GenericTab } from "./tab.js";

export class LabelTab extends GenericTab {
    displayLabel = 'Edit Labels';
    internalLabel = 'editlabels';

    get innerDiv () {
        return $.parseHTML($.trim(`
        <div>
            <h2>Edit Labels</h2>
            <select id="label-editor-select-set"></select>
            <button id="label-editor-add-category">Add Category</button>
            <button id="label-editor-delete-category">Delete Category</button>
            <select id="label-editor-select-category"></select>
            <select id="label-editor-select-label"></select>
            <input id="label-editor-short-label"/>
            <textarea id="label-editor-long-label"></textarea>
        </div>`))[0]
    }
}