describe('The Home Page', () => {
    it('successfully loads', () => {
        cy.visit('/')
    })
})
describe('My First Test', () => {
    it('does basic testing', () => {
        cy.visit('/debug')
        cy.contains('This is for testing cypress')
    })
})

describe('Test player creation', () => {
    it('creates creates and deletes players', () => {
        createPlayers()
    })
})

function createPlayers() {
    cy.visit('/')
    cy.wait(200)
    cy.get('#start-button').click()
    cy.get('input#player').type('Player to delete')
    cy.get('#add-player-btn').click()
    cy.get('input#player').type('Erster Spieler')
    cy.get('#add-player-btn').click()
    cy.get('input#player').type('Zweiter Spieler')
    cy.get('#add-player-btn').click()
    cy.get('input#player').type('Dritter Spieler')
    cy.get('#add-player-btn').click()
    cy.get('#list-of-created-players .player-name').should('have.length', 4)
    // delete player
    cy.get('#list-of-created-players .player-name').contains('Player to delete').find('.delete-player-btn').click()
    cy.get('#list-of-created-players .player-name').should('have.length', 3)
    // finish player creation
    cy.get('#finish-player-creation-btn').click()
    cy.wait(200)
    // test result of player creation
    cy.get('#tournament-round .player-name').should('have.length', 4)
    cy.get('#tournament-round .player-name').contains('Erster Spieler')
    cy.get('#tournament-round .player-name').contains('Zweiter Spieler')
    cy.get('#tournament-round .player-name').contains('Dritter Spieler')
    cy.get('#tournament-round .player-name').contains('BYE')
}

describe('Test initial BYE', () => {
    it('checks if first BYE is set correctly', () => {
        // setup
        createPlayers()

        // set scores
        const players = {}
        cy.get('#tournament-round .is-non-buy-match-scores .player-section').each(($el, index, $list) => {
            const playerName = $el.find('.player-name')
            const playerScore = $el.find('.player-score')
            expect(playerScore.text()).equals('0')
            players[playerName.text()] = playerScore.text()
        })

        cy.get('#tournament-round .is-buy-match-scores .player-section').each(($el, index, $list) => {
            const playerName = $el.find('.player-name')
            const playerScore = $el.find('.player-score')
            if (index === 0) {
                expect(playerScore.text()).equals('9')
            } else {
                expect(playerScore.text()).equals('0')
                expect(playerName.text()).equals('BYE')
            }
        })
    })
})
