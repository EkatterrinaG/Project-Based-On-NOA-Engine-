/**
 * Генератор озёр на поверхности
 * Использует 2D шум для создания небольших углублений и заполнения их водой.
 */

import { getNoise2D, caveNoise } from './noise.js'
import { blockIDs } from '../blocks/block-registry.js'
import { generateHeightmap } from './heightmap.js'
import { getDominantBiome } from './biome-manager.js'
import worldConfig from '../config/world-config.js'

const CAVE_CHECK_RADIUS = 8
const CAVE_NOISE_THRESHOLD = 0.6

/**
 * Шум для определения позиций озёр
 */
function lakeNoise(x, z) {
    const offsetX = 5000
    const offsetZ = 7000
    const frequency = 0.015
    return getNoise2D(x + offsetX, z + offsetZ, frequency)
}

/**
 * Проверяет наличие пещер в заданном радиусе вокруг точки.
 * @param {number} centerX - Мировая координата X центра проверки
 * @param {number} centerZ - Мировая координата Z центра проверки
 * @param {number} surfaceY - Высота поверхности для проверки
 * @returns {boolean} - true, если пещера найдена поблизости
 */
function isCaveNearby(centerX, centerZ, surfaceY) {
    // Проверяем на несколько блоков ниже поверхности, где могут быть входы в пещеры
    const checkY = surfaceY - 4

    for (let x = -CAVE_CHECK_RADIUS; x <= CAVE_CHECK_RADIUS; x++) {
        for (let z = -CAVE_CHECK_RADIUS; z <= CAVE_CHECK_RADIUS; z++) {
            const noise = caveNoise(centerX + x, checkY, centerZ + z)
            if (noise > CAVE_NOISE_THRESHOLD) {
                return true // Найдена пещера
            }
        }
    }
    return false // Пещер поблизости нет
}

/**
 * Генерация озёр в чанке
 */
export function generateLakesInChunk(data, chunkX, chunkY, chunkZ) {
    const biomes = worldConfig.biomes

    for (let i = 0; i < data.shape[0]; i++) {
        const worldX = chunkX + i
        for (let k = 0; k < data.shape[2]; k++) {
            const worldZ = chunkZ + k

            const biomeType = getDominantBiome(worldX, worldZ)
            if (biomeType !== biomes.FOREST && biomeType !== biomes.FIELD) {
                continue
            }

            const noise = lakeNoise(worldX, worldZ)
            if (noise < 0.65) continue // Немного увеличим порог для более редких озер

            const surfaceHeight = generateHeightmap(worldX, worldZ)

            // Озера не должны быть слишком высоко или слишком низко
            if (surfaceHeight > 80 || surfaceHeight < 40) {
                continue
            }

            // Проверяем на наличие пещер поблизоosti
            if (isCaveNearby(worldX, worldZ, surfaceHeight)) {
                continue // Пропускаем создание озера, если рядом пещера
            }

            // Глубина озера зависит от шума (1-4 блока)
            const depth = Math.floor((noise - 0.65) * 10) + 1

            // Создаем углубление и заполняем водой
            for (let d = 0; d < depth; d++) {
                const worldY = surfaceHeight - d
                const localY = worldY - chunkY

                if (localY < 0 || localY >= data.shape[1]) continue

                const currentBlock = data.get(i, localY, k)

                // Пропускаем, если это бедрок или уже воздух
                // Это гарантирует, что мы заменяем только твердую землю
                if (currentBlock === blockIDs.bedrock || currentBlock === 0) continue

                // Заменяем землю водой
                data.set(i, localY, k, blockIDs.water)
            }
        }
    }
}

export default {
    generateLakesInChunk
}