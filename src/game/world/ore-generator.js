/**
 * Генератор руд
 * Отвечает за размещение рудных жил в мире
 */

import { blockIDs } from '../blocks/block-registry.js'
import worldConfig from '../config/world-config.js'
import { rng } from '../engine.js'

/**
 * Генерация руд в чанке
 * @param {object} data - ndarray с данными чанка
 * @param {number} chunkX - Мировая координата X начала чанка
 * @param {number} chunkY - Мировая координата Y начала чанка
 * @param {number} chunkZ - Мировая координата Z начала чанка
 */
export function generateOresInChunk(data, chunkX, chunkY, chunkZ) {
    // Проходим по всем типам руд
    generateOreType(data, chunkX, chunkY, chunkZ, 'coal', blockIDs.coal_ore, 20)
    generateOreType(data, chunkX, chunkY, chunkZ, 'iron', blockIDs.iron_ore, 20)
    generateOreType(data, chunkX, chunkY, chunkZ, 'gold', blockIDs.gold_ore, 2)
    generateOreType(data, chunkX, chunkY, chunkZ, 'diamond', blockIDs.diamond_ore, 8)
}

/**
 * Выбирает случайную вариацию руды на основе координат
 */
function getOreVariation(oreBlockIDs, x, y, z) {
    if (!Array.isArray(oreBlockIDs)) {
        return oreBlockIDs // Fallback для старого формата
    }
    const hash = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791)
    const oreIndex = Math.abs(hash) % oreBlockIDs.length
    return oreBlockIDs[oreIndex]
}

/**
 * Генерация конкретного типа руды
 */
function generateOreType(data, chunkX, chunkY, chunkZ, oreName, blockID, attemptsPerChunk) {
    const config = worldConfig.ores[oreName]
    if (!config) return

    // Корректируем количество попыток на основе шанса из конфига
    const attempts = Math.round(attemptsPerChunk * config.spawnChance)

    for (let i = 0; i < attempts; i++) {
        // Выбираем случайную точку внутри чанка
        const lx = Math.floor(rng() * data.shape[0])
        const ly = Math.floor(rng() * data.shape[1])
        const lz = Math.floor(rng() * data.shape[2])

        const worldY = chunkY + ly

        // Не генерируем под бедроком
        if (worldY < 0) continue

        // Проверка высоты
        if (worldY < config.minY || worldY > config.maxY) continue

        // Пытаемся создать жилу
        generateVein(data, lx, ly, lz, blockID, config.vein, chunkX, chunkY, chunkZ)
    }
}

/**
 * Генерация жилы (кластера блоков)
 * Простая реализация: случайное блуждание или сфера
 */
function generateVein(data, x, y, z, blockID, veinSizeRange, chunkX, chunkY, chunkZ) {
    const size = Math.floor(rng() * (veinSizeRange[1] - veinSizeRange[0] + 1)) + veinSizeRange[0]

    let cx = x
    let cy = y
    let cz = z

    for (let i = 0; i < size; i++) {
        // Проверяем границы чанка
        if (cx >= 0 && cx < data.shape[0] &&
            cy >= 0 && cy < data.shape[1] &&
            cz >= 0 && cz < data.shape[2]) {

            // Заменяем только камень или землю (любые вариации)
            const currentBlock = data.get(cx, cy, cz)
            const isStone = blockIDs.stone.includes(currentBlock)
            const isDirt = blockIDs.dirt && Array.isArray(blockIDs.dirt) && blockIDs.dirt.includes(currentBlock)
            if (isStone || isDirt) {
                // Выбираем уникальную вариацию руды для каждого блока на основе мировых координат
                const worldX = chunkX + cx
                const worldY = chunkY + cy
                const worldZ = chunkZ + cz
                const oreVariation = getOreVariation(blockID, worldX, worldY, worldZ)
                data.set(cx, cy, cz, oreVariation)
            }
        }

        // Случайный шаг в соседнюю клетку
        const dir = Math.floor(rng() * 6)
        switch (dir) {
            case 0: cx++; break
            case 1: cx--; break
            case 2: cy++; break
            case 3: cy--; break
            case 4: cz++; break
            case 5: cz--; break
        }
    }
}

export default {
    generateOresInChunk
}
