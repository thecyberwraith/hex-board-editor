export class GenericTab {
    displayLabel = 'Generic Tab';
    internalLabel = 'generic';
    visibile = false;

    setup() {}
    createDiv() {
        // Creates the div that houses the given innerDiv
        const elem = document.createElement('div');
        elem.classList.add("tabs-panel");
        elem.id = this.internalLabel;
        elem.appendChild(this.innerDiv);
        return elem;
    }
    get innerDiv() {
        const p = document.createElement('p');
        p.innerHTML = this.displayLabel;
        return p
    }

    activate() {console.warn('Activate method of Tab was not overridden.')}
    deactivate() {}

    updateVisibility(visibility) {
        if (visibility != this.visibile) {
            this.visibile = visibility;
            if (this.visibile) {
                console.debug(`Activating ${this.displayLabel} tab`);
                this.activate();
            }
            else {
                console.debug(`Deactivating ${this.displayLabel} tab`);
                this.deactivate();
            }
        }
    }

    my(tag) {
        return $(`#${tag}`)
    }
}