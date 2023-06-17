import { getGameNames, getGameByName, storeGame, deleteGameByName } from "./data.js";
import { GenericTab } from "./tab.js";

let currentGame = null;

export async function getCurrentGame() {
    if (currentGame === null) {
        const gameList = await getGameNames();
        if ( gameList.length === 0 ) {
            console.error("No game exists!");
        }

        currentGame = await getGameByName(gameList[0]);
    }

    return currentGame
}

let isDirty = false

export function modificationNotification() {
    isDirty = true
}

export class GameDataTab extends GenericTab {
    displayLabel = "Save / Load"
    internalLabel = "dataTab"
    #gameListDiv = "gameDataTabList"
    #currentGameNameSpan = "gameDataTabCurrentGameName"
    #gameListItemTemplate = "gameListRowTemplate"
    setup() {
        
    }

    activate() {
        this.refreshCurrentGame();
        this.refreshGameList();
    }

    get innerDiv() {
        const elem = $('<div>')
            .append($('<h2>').text('Select A Game Below'))
            .append($('<div>')
                .append($('<p>')
                    .attr('id', this.#currentGameNameSpan)
                )
                .append($('<button>')
                    .addClass('button')
                    .addClass('success')
                    .text('Save')
                    .click((e) => this.saveCurrentGame())
                )
                .append($('<button>')
                    .addClass('button')
                    .text('Save As')
                    .click((e) => this.saveGameAs()))
            )
            .append($('<div>')
                .attr('id', this.#gameListDiv)
                .addClass('grid-x')
            )
            .append($(`<template id="${this.#gameListItemTemplate}">
            <div class="cell large-3 medium-6">
            <div class="grid-x">
                <div class="cell auto"><p></p></div>
                <div class="cell shrink">
                    <button class="button loadbutton">Load</button>
                    <button class="button saveasbutton">Save As</button>
                    <button class="button alert deletebutton">Delete</button>
                </div>
                </template>`))
        return elem.get(0);
    }

    async refreshGameList() {
        const gameList = await getGameNames();
        const currentGameName = (await getCurrentGame()).name;

        let $div = $(`#${this.#gameListDiv}`).empty();

        const template = $(`#${this.#gameListItemTemplate}`).get(0)

        gameList.forEach((game) => {
            if (game == currentGameName) {
                return
            }

            let $row = $(template.content.cloneNode(true))

            $row.find('p').text(game)
            $row.find('.loadbutton').on("click", (e) => {this.editGameByName(game)})
            $row.find('.saveasbutton').on("click", (e) => {this.saveGameAs(game)})
            $row.find('.deletebutton').on("click", (e) => {this.deleteGameByName(game)})

            $div.append($row)
        })
    }

    async refreshCurrentGame() {
        const game = await getCurrentGame()
        $(`#${this.#currentGameNameSpan}`).text(`Currently editing game "${game.name}"`)
    }

    async editGameByName(name) {
        if (isDirty && !confirm(`The current game "${getCurrentGame().name}" isn't saved. Are you sure you want to lose the changes?`)) {
            return
        }
        console.log('Editing game', name)
        currentGame = getGameByName(name)
        isDirty = false
        await this.refreshCurrentGame()
        await this.refreshGameList()
    }
    
    async deleteGameByName(name) {
        if (confirm(`Are you sure you want to permanently delete "${name}"?`)) {
            console.log('Deleting game', name)
            await deleteGameByName(name)
            await this.refreshGameList()
        }
    }
    
    async saveCurrentGame() {
        console.log('Saving current game')
        await storeGame(await getCurrentGame())
        isDirty = false
        await this.refreshGameList()
    }
    
    async saveGameAs(original = null) {
        const currentGameName = (await getCurrentGame()).name
        if (original === null) {
            original = currentGameName
            console.log('Saving current game as new name.')
        }
    
        let newName = prompt(`What do you wish to save game "${original}" as?`)
    
        if (!newName) {
            console.warn('Aborted saving new name: ', newName);
        }
    
        if (newName == original) {
            console.log('Instructed to save game as itself... weird')
            if (newName == currentGameName) {
                alert('Please use the "Save" button instead.');
            }
        }
        else if(newName == currentGameName) {
            alert(`Cannot overwrite the currently edited game. Instead, edit the "${original}" game first and then click "Save As".`)
        }
    
        let originalGame = await getGameByName(original)
        originalGame.name = newName
        await storeGame(originalGame)
        await this.refreshGameList()
    }
}

