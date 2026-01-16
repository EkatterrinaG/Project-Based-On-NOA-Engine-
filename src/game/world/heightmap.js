/**
 * Система генерации карт высот
 * Определяет высоту поверхности для каждой точки мира
 */

import { continentNoise, mountainMask, terrainNoise, detailNoise, erosionNoise } from './noise.js'
import worldConfig from '../config/world-config.js'

/**
 * Генерация ГЛОБАЛЬНОЙ карты высот (БЕЗ биомов!)
 * Биомы влияют только на блоки и декор, НЕ на высоту
 *
 * @param {number} x - Мировая координата X
 * @param {number} z - Мировая координата Z
 * @returns {number} Высота поверхности (Y координата)
 */
export function generateHeightmap(x, z) {
    // ============ ОДНА НЕПРЕРЫВНАЯ ПЛАТФОРМА ============

    // Базовая высота (середина мира)
    const baseHeight = worldConfig.world.height * 0.5

    // 1. Континенты (огромные возвышенности)
    const continent = continentNoise(x, z)

    // 2. Горы (через маску)
    const mountainHeight = mountainMask(x, z) * 40

    // 3. Основной рельеф (холмы)
    const terrain = terrainNoise(x, z)

    // 4. Эрозия (сглаживание)
    const erosion = erosionNoise(x, z)

    // 5. Мелкие детали
    const detail = detailNoise(x, z)

    // ============ ИТОГОВАЯ ВЫСОТА ============
    let height = baseHeight + continent + mountainHeight + terrain + erosion + detail

    // Ограничиваем высоту в пределах мира
    const minHeight = 5
    const maxHeight = worldConfig.world.height - 10

    height = Math.max(minHeight, Math.min(maxHeight, height))

    // Округляем до целого блока
    return Math.floor(height)
}

/**
 * Генерация карты высот для целого чанка
 * Оптимизировано для генерации сразу всех высот в чанке
 *
 * @param {number} chunkX - X координата чанка (в мировых координатах)
 * @param {number} chunkZ - Z координата чанка (в мировых координатах)
 * @param {number} chunkSize - Размер чанка
 * @returns {Array<Array<number>>} 2D массив высот [x][z]
 */
export function generateChunkHeightmap(chunkX, chunkZ, chunkSize) {
    const heightmap = []

    for (let i = 0; i < chunkSize; i++) {
        heightmap[i] = []
        const worldX = chunkX + i

        for (let k = 0; k < chunkSize; k++) {
            const worldZ = chunkZ + k
            heightmap[i][k] = generateHeightmap(worldX, worldZ)
        }
    }

    return heightmap
}

/**
 * Получить высоту поверхности в конкретной точке
 * Удобная функция для быстрого получения одной высоты
 *
 * @param {number} x - Мировая координата X
 * @param {number} z - Мировая координата Z
 * @returns {number} Высота поверхности
 */
export function getSurfaceHeight(x, z) {
    return generateHeightmap(x, z)
}

/**
 * Проверка: находится ли точка над/под поверхностью
 *
 * @param {number} x - Мировая координата X
 * @param {number} y - Мировая координата Y
 * @param {number} z - Мировая координата Z
 * @returns {boolean} true если над поверхностью, false если под
 */
export function isAboveSurface(x, y, z) {
    const surfaceHeight = getSurfaceHeight(x, z)
    return y > surfaceHeight
}

/**
 * Получить глубину под поверхностью
 *
 * @param {number} x - Мировая координата X
 * @param {number} y - Мировая координата Y
 * @param {number} z - Мировая координата Z
 * @returns {number} Глубина (0 = на поверхности, положительное = под землёй)
 */
export function getDepthBelowSurface(x, y, z) {
    const surfaceHeight = getSurfaceHeight(x, z)
    return surfaceHeight - y
}

export default {
    generateHeightmap,
    generateChunkHeightmap,
    getSurfaceHeight,
    isAboveSurface,
    getDepthBelowSurface
}
