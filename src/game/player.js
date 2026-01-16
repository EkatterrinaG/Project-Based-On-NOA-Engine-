/**
 * Управление игроком
 * Настройка физики, меша и событий игрока
 */

import { noa } from './engine.js'
import { items } from './items/item-registry.js'

/**
 * Настройка сущности игрока
 * @param {import('noa-engine').Engine} noa
 */
export function setupPlayer(noa) {
    console.log('👤 Setting up player...')

    const player = noa.playerEntity // This is the player entity ID

    // Get the player's movement component
    const playerMovement = noa.entities.getMovement(player)
    if (!playerMovement) {
        console.warn('Player movement component not found!')
        return // Exit if movement component is not available
    }

    // Ensure Noa's default 'jump' input is bound to space
    // This is typically handled by Noa's internal setup, but we ensure 'space' is associated with 'jump' action.
    // Noa will automatically handle the jump action when space is pressed.
    noa.inputs.bind('jump', 'space');

    // Dynamic control of jump behavior based on amulet
    noa.on('tick', function () {
        // Check if player is holding the runic_amulet
        let hasAmulet = false
        if (window.gameInventory) {
            const selectedSlot = window.gameInventory.getSelectedSlot()
            const heldItemName = selectedSlot && !selectedSlot.isEmpty() ? selectedSlot.item : null
            hasAmulet = (heldItemName === 'runic_amulet')
        }

        if (hasAmulet) {
            // When amulet is held: enable flying (continuous ascent by repeated space presses)
            // Noa's default 'jump' action, when airJumps > 0, allows for this.
            // We'll set a higher jump impulse for flying, as the base jump is likely too small.
            playerMovement.airJumps = 1000 // Allow many air jumps for continuous flight
            playerMovement.jumpImpulse = 10 // A stronger impulse for flying (tune this for desired flight speed)
        } else {
            // Without amulet: single jump from ground only
            playerMovement.airJumps = 0 // Restrict to single jump from ground
            playerMovement.jumpImpulse = 6.5 // Default impulse for a "one-block" jump (tune this value)
        }
    })

    console.log('✅ Player setup complete')
}
