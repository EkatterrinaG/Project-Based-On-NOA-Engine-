/**
 * Plants module - exports flower and cactus spawner initializers
 */

import { FlowerSpawner } from './spawner.js'
import { CactusSpawner } from './cactusSpawner.js'

/**
 * Initialize flower spawner
 * @param {import('noa-engine').Engine} noa
 * @param {Object} options
 * @returns {FlowerSpawner}
 */
export function initFlowers(noa, options = {}) {
    return new FlowerSpawner(noa, options)
}

/**
 * Initialize cactus spawner
 * @param {import('noa-engine').Engine} noa
 * @param {Object} options
 * @returns {CactusSpawner}
 */
export function initCactus(noa, options = {}) {
    return new CactusSpawner(noa, options)
}

export { FlowerSpawner, CactusSpawner }
