/**
 * Генератор чанков
 * Основная логика создания мира
 */

import { noa } from '../engine.js'
import { blockIDs } from '../blocks/block-registry.js'
import { generateHeightmap } from '../world/heightmap.js'
import { getBiomeAt, getDominantBiome, getBiomeWeights } from '../world/biome-manager.js'
import worldConfig from '../config/world-config.js'
import { generateOresInChunk } from './ore-generator.js'
import { carveCavesInChunk } from './cave-generator.js'
import { generateLakesInChunk } from './lake-generator.js'
import { placeStructuresInChunk } from './structure-placer.js'

/**
 * Выбор биома на основе весов (для плавного смешивания блоков)
 * Использует детерминированную случайность на основе координат
 */
function selectBiomeFromWeights(x, z) {
    // РЕЗКАЯ ГРАНИЦА: просто возвращаем доминирующий биом
    // Никаких переходов, никакого смешивания блоков
    return getDominantBiome(x, z)
}

/**
 * Инициализация генератора мира
 */
export function initWorldGen() {
    //console.log('🌍 Initializing world generator...')

    // Регистрация обработчика генерации чанков
    noa.world.on('worldDataNeeded', (id, data, x, y, z) => {
        //console.log(`📦 Requested chunk: ${id} at ${x},${y},${z}`)
        generateChunk(id, data, x, y, z)
    })
}

/**
 * Генерация одного чанка
 */
function generateChunk(id, data, x, y, z) {
    try {
        //console.log(`🔍 Generating chunk ${id} at X:${x} Y:${y} Z:${z}`)

        // Если чанк полностью под бедроком, не генерируем ничего
        if (y + data.shape[1] <= 0) {
            //console.log(`⏭️ Chunk below bedrock, skipping`)
            noa.world.setChunkData(id, data)
            return
        }

        // Генерируем ГЛОБАЛЬНЫЙ heightmap (без биомов!)
        const heightmap = []
        for (let i = 0; i < data.shape[0]; i++) {
            heightmap[i] = []
            for (let k = 0; k < data.shape[2]; k++) {
                const worldX = x + i
                const worldZ = z + k
                // Высота НЕ зависит от биома!
                heightmap[i][k] = generateHeightmap(worldX, worldZ)
            }
        }

        let blockCount = 0

        // Проходим по всем блокам чанка
        for (let i = 0; i < data.shape[0]; i++) {
            const worldX = x + i
            for (let k = 0; k < data.shape[2]; k++) {
                const worldZ = z + k
                // Выбираем биом на основе весов (узкая зона перехода 10 блоков для блоков)
                const biomeType = selectBiomeFromWeights(worldX, worldZ)
                const height = heightmap[i][k]

                for (let j = 0; j < data.shape[1]; j++) {
                    const worldY = y + j
                    const blockID = decideBlock(worldY, height, biomeType, worldX, worldZ)

                    if (blockID !== 0) {
                        data.set(i, j, k, blockID)
                        blockCount++
                    }
                }
            }
        }

       // console.log(`📊 Chunk ${id}: Generated ${blockCount} blocks`)

        // Генерация пещер, озёр и руд
        carveCavesInChunk(data, x, y, z)
        generateLakesInChunk(data, x, y, z)
        generateOresInChunk(data, x, y, z)

        // Отправляем данные обратно в движок
        noa.world.setChunkData(id, data)

        // Генерация структур
        setTimeout(() => {
            placeStructuresInChunk(noa, x, y, z)
        }, 100)

        // Логируем первый успешный чанк
        if (!window.firstChunkGenerated) {
            //console.log(`✅ First chunk generated! Blocks: ${blockCount}`)
            window.firstChunkGenerated = true
        }

    } catch (e) {
       // console.error(`❌ Error in chunk ${id}:`, e)
    }
}

/**
 * Выбор блока для позиции
 */
function decideBlock(y, surfaceHeight, biomeType, x, z) {
    if (y < 0) return 0
    if (y > surfaceHeight) return 0
    if (y === 0) return blockIDs.bedrock
    if (y === surfaceHeight) return getTopBlock(biomeType, x, y, z)
    if (y > surfaceHeight - 4) return getFillerBlock(biomeType, x, y, z)

    // Выбираем случайную вариацию камня на основе координат
    const hash = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791)
    const stoneIndex = Math.abs(hash) % blockIDs.stone.length
    return blockIDs.stone[stoneIndex]
}

function getTopBlock(biomeType, x, y, z) {
    const biomes = worldConfig.biomes

    // Для биомов с травой - выбираем случайную вариацию на основе координат
    const needsGrassVariation = biomeType === biomes.FOREST ||
                                 biomeType === biomes.FIELD

    if (needsGrassVariation && blockIDs.grass && Array.isArray(blockIDs.grass)) {
        const hash = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791)
        const grassIndex = Math.abs(hash) % blockIDs.grass.length
        return blockIDs.grass[grassIndex]
    }

    // Для пустыни - выбираем случайную вариацию песка
    if (biomeType === biomes.DESERT && blockIDs.sand && Array.isArray(blockIDs.sand)) {
        const hash = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791)
        const sandIndex = Math.abs(hash) % blockIDs.sand.length
        return blockIDs.sand[sandIndex]
    }

    // Для снежного биома - выбираем случайную вариацию снега
    if (biomeType === biomes.SNOW && blockIDs.snow && Array.isArray(blockIDs.snow)) {
        const hash = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791)
        const snowIndex = Math.abs(hash) % blockIDs.snow.length
        return blockIDs.snow[snowIndex]
    }

    switch (biomeType) {
        case biomes.FOREST: return blockIDs.grassBase
        case biomes.DESERT: return blockIDs.sandBase
        case biomes.SNOW: return blockIDs.snowBase
        case biomes.FIELD: return blockIDs.grassBase
        default: return blockIDs.grassBase
    }
}

function getFillerBlock(biomeType, x, y, z) {
    const biomes = worldConfig.biomes

    // Для биомов с землей - выбираем случайную вариацию на основе координат
    const needsDirtVariation = biomeType === biomes.FOREST ||
                                biomeType === biomes.SNOW ||
                                biomeType === biomes.FIELD

    if (needsDirtVariation && blockIDs.dirt && Array.isArray(blockIDs.dirt)) {
        const hash = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791)
        const dirtIndex = Math.abs(hash) % blockIDs.dirt.length
        return blockIDs.dirt[dirtIndex]
    }

    // Для пустыни - выбираем случайную вариацию песчаника
    if (biomeType === biomes.DESERT && blockIDs.sandstone && Array.isArray(blockIDs.sandstone)) {
        const hash = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791)
        const sandstoneIndex = Math.abs(hash) % blockIDs.sandstone.length
        return blockIDs.sandstone[sandstoneIndex]
    }

    switch (biomeType) {
        case biomes.FOREST: return blockIDs.dirtBase
        case biomes.DESERT: return blockIDs.sandstoneBase
        case biomes.SNOW: return blockIDs.dirtBase
        case biomes.FIELD: return blockIDs.dirtBase
        default: return blockIDs.dirtBase
    }
}

export default {
    initWorldGen
}
