/**
 * Генератор структур (деревья, кактусы, цветы)
 * Отвечает за размещение процедурных структур на поверхности
 * Использует L-System для процедурной генерации растений
 */

import { blockIDs, flowerIDs } from '../blocks/block-registry.js'
import worldConfig from '../config/world-config.js'
import { getBiomeAt, isInTransitionZone } from './biome-manager.js'
import { rng } from '../engine.js'
import { LSystem, LSystemInterpreter } from './lsystem.js'
import { randomTreeLSystem } from './tree-lsystem-generator.js'

/**
 * Попытка разместить структуры в чанке
 */
/**
 * Попытка разместить структуры в чанке
 * @param {object} noa - Экземпляр noa engine
 * @param {number} chunkX - Мировая координата X начала чанка
 * @param {number} chunkY - Мировая координата Y начала чанка
 * @param {number} chunkZ - Мировая координата Z начала чанка
 */
export function placeStructuresInChunk(noa, chunkX, chunkY, chunkZ) {
    const chunkSize = worldConfig.world.chunkSize

    // Определяем количество попыток для этого чанка в зависимости от биома
    const attempts = getAttemptsForChunk(chunkX, chunkZ)

    for (let i = 0; i < attempts; i++) {
        // Случайная позиция внутри чанка
        const localX = Math.floor(rng() * chunkSize)
        const localZ = Math.floor(rng() * chunkSize)

        const worldX = chunkX + localX
        const worldZ = chunkZ + localZ

        // Получаем биом для этой позиции
        const biomeType = getBiomeAt(worldX, worldZ)

        // Ищем поверхность (уже с проверкой открытого неба)
        const surfaceY = findSurface(noa, worldX, worldZ)
        if (surfaceY === null) continue

        // Размещаем структуру на найденной поверхности
        placeStructure(noa, worldX, surfaceY, worldZ, biomeType)
    }
}


function getAttemptsForChunk(chunkX, chunkZ) {
    const biomes = worldConfig.biomes
    const chunkSize = worldConfig.world.chunkSize
    const centerX = chunkX + Math.floor(chunkSize / 2)
    const centerZ = chunkZ + Math.floor(chunkSize / 2)
    const dominantBiome = getBiomeAt(centerX, centerZ)

    switch (dominantBiome) {
        case biomes.FOREST: return 14
        case biomes.DESERT: return 8
        case biomes.SNOW: return 1
        case biomes.FIELD: return 5
        default: return 3
    }
}

function findSurface(noa, x, z) {
    for (let y = 100; y > 10; y--) {
        const block = noa.getBlock(x, y, z)
        const blockBelow = noa.getBlock(x, y - 1, z)
        if (block === 0 && blockBelow !== 0 && blockBelow !== blockIDs.water) {
            let hasOpenSky = true
            for (let checkY = y + 1; checkY < y + 10 && checkY < 120; checkY++) {
                if (noa.getBlock(x, checkY, z) !== 0) {
                    hasOpenSky = false
                    break
                }
            }
            if (hasOpenSky) return y
        }
    }
    return null
}

function placeStructure(noa, x, y, z, biomeType) {
    const biomes = worldConfig.biomes

    if (biomeType === biomes.DESERT) {
        placeCactus(noa, x, y, z)
        return
    }


    let treeType
    if (biomeType === biomes.FOREST) treeType = 'FOREST'
    else if (biomeType === biomes.SNOW) treeType = 'SNOW'
    else return

    const seed = (x * 73856093) ^ (z * 19349663) ^ (y * 83492791)
    const lsystemConfig = randomTreeLSystem(seed, treeType)
    generateProceduralTree(noa, x, y, z, lsystemConfig, biomeType)
}

function generateProceduralTree(noa, x, y, z, lsystemConfig, biomeType) {
    const biomes = worldConfig.biomes
    const blockBelow = noa.getBlock(x, y - 1, z)
    const isGrass = Array.isArray(blockIDs.grass) ? blockIDs.grass.includes(blockBelow) : blockBelow === blockIDs.grass
    const isSnow = Array.isArray(blockIDs.snow) ? blockIDs.snow.includes(blockBelow) : blockBelow === blockIDs.snow
    const isFieldGrass = Array.isArray(blockIDs.field_grass) ? blockIDs.field_grass.includes(blockBelow) : blockBelow === blockIDs.field_grass

    if (biomeType === biomes.FOREST && !isGrass) return
    if (biomeType === biomes.SNOW && !isSnow) return
    if (biomeType === biomes.FIELD && !isFieldGrass && !isGrass) return

    const getWoodVariation = (x, y, z, biomeType) => {
        let woodArray = biomeType === biomes.SNOW ? blockIDs.pine_wood : blockIDs.oak_wood
        if (!Array.isArray(woodArray)) return woodArray
        const hash = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791)
        return woodArray[Math.abs(hash) % woodArray.length]
    }

    const getLeavesVariation = (x, y, z, leafType) => {
        const leavesArray = leafType === 'pine_leaves' ? blockIDs.pine_leaves : blockIDs.leaves
        if (!Array.isArray(leavesArray)) return leavesArray
        const hash = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791)
        return leavesArray[Math.abs(hash) % leavesArray.length]
    }

    let trunkBlock = getWoodVariation(x, y, z, biomeType)
    let leavesBlock = getLeavesVariation(x, y, z, lsystemConfig.leafType)

    const lsystem = new LSystem(lsystemConfig.axiom, lsystemConfig.rules, lsystemConfig.iterations)
    const lsystemString = lsystem.generate()

    const interpreter = new LSystemInterpreter(noa, x, y, z, {
        angle: lsystemConfig.angle,
        stepLength: lsystemConfig.step * lsystemConfig.scale,
        trunkBlock,
        leavesBlock,
        flowerBlock: null
    })
    interpreter.interpret(lsystemString)
}

/**
 * === СТАРЫЕ ФУНКЦИИ ===
 * placeTree, placePine, placeCrown, placeConeCrown, placeCactus
 * оставлены без изменений
 */

function placeTree(noa, x, y, z, leavesType) {
    const blockBelow = noa.getBlock(x, y - 1, z)
    if (blockBelow !== blockIDs.grass) return
    const treeConfig = worldConfig.trees
    const trunkHeight = Math.floor(rng() * (treeConfig.height[1] - treeConfig.height[0] + 1) + treeConfig.height[0])
    for (let i = 0; i < trunkHeight; i++) noa.setBlock(blockIDs.wood, x, y + i, z)
    placeCrown(noa, x, y + trunkHeight, z, leavesType)
}

function placePine(noa, x, y, z) {
    const blockBelow = noa.getBlock(x, y - 1, z)
    if (blockBelow !== blockIDs.snow) return
    const treeConfig = worldConfig.trees
    const trunkHeight = Math.floor(rng() * (treeConfig.height[1] + 2 - treeConfig.height[0]) + treeConfig.height[0])
    for (let i = 0; i < trunkHeight; i++) noa.setBlock(blockIDs.wood, x, y + i, z)
    placeConeCrown(noa, x, y + trunkHeight, z)
}

function placeCrown(noa, centerX, centerY, centerZ, leavesType) {
    const radius = 2 + Math.floor(rng() * 2)
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dz = -radius; dz <= radius; dz++) {
                if (dx === 0 && dy <= 0 && dz === 0) continue
                if (Math.sqrt(dx * dx + dy * dy + dz * dz) <= radius + rng() * 0.5) {
                    const leafX = centerX + dx
                    const leafY = centerY + dy
                    const leafZ = centerZ + dz
                    if (noa.getBlock(leafX, leafY, leafZ) === 0) noa.setBlock(leavesType, leafX, leafY, leafZ)
                }
            }
        }
    }
}

function placeConeCrown(noa, centerX, centerY, centerZ) {
    const height = 5 + Math.floor(rng() * 3)
    for (let dy = 0; dy < height; dy++) {
        const radius = Math.max(0, Math.floor((height - dy) * 0.6))
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dz = -radius; dz <= radius; dz++) {
                if (dx === 0 && dy === 0 && dz === 0) continue
                if (Math.sqrt(dx * dx + dz * dz) <= radius) {
                    const leafX = centerX + dx
                    const leafY = centerY + dy
                    const leafZ = centerZ + dz
                    if (noa.getBlock(leafX, leafY, leafZ) === 0) noa.setBlock(blockIDs.pine_leaves, leafX, leafY, leafZ)
                }
            }
        }
    }
}

function placeCactus(noa, x, y, z) {
    const blockBelow = noa.getBlock(x, y - 1, z)
    if (blockBelow !== blockIDs.sand) return
    const height = 2 + Math.floor(rng() * 4)
    for (let i = 0; i < height; i++) noa.setBlock(blockIDs.cactus, x, y + i, z)
}


export default { placeStructuresInChunk }
