/**
 * Генератор пещер
 * Использует 3D шум для создания туннелей под землей
 */

import { caveNoise } from './noise.js'
import { blockIDs } from '../blocks/block-registry.js'
import worldConfig from '../config/world-config.js'

/**
 * Вырезание пещер в чанке
 * @param {object} data - ndarray с данными чанка
 * @param {number} chunkX - Мировая координата X начала чанка
 * @param {number} chunkY - Мировая координата Y начала чанка
 * @param {number} chunkZ - Мировая координата Z начала чанка
 */
export function carveCavesInChunk(data, chunkX, chunkY, chunkZ) {
    const config = worldConfig.caves
    const threshold = 0.6 // Порог шума для создания пещеры (чем выше, тем уже пещеры)

    // Проходим по всем блокам чанка
    for (let i = 0; i < data.shape[0]; i++) {
        const worldX = chunkX + i

        for (let k = 0; k < data.shape[2]; k++) {
            const worldZ = chunkZ + k

            for (let j = 0; j < data.shape[1]; j++) {
                const worldY = chunkY + j

                // Не трогаем бедрок и ничего под ним
                if (worldY <= 0) continue

                // Не создаем пещеры слишком высоко (оставляем поверхность целой)
                // Но иногда пещеры могут выходить наружу
                if (worldY > 100) continue

                // Получаем текущий блок
                const currentBlock = data.get(i, j, k)

                // Если это воздух или вода, пропускаем
                if (currentBlock === 0 || currentBlock === blockIDs.water) continue

                // Вычисляем 3D шум для этой точки
                const noiseVal = caveNoise(worldX, worldY, worldZ)

                // Если шум превышает порог - это пещера
                if (noiseVal > threshold) {
                    // Удаляем блок (ставим воздух)
                    data.set(i, j, k, 0)
                }
            }
        }
    }
}

export default {
    carveCavesInChunk
}
