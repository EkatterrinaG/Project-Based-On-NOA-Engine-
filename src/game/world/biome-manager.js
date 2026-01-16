/**
 * Менеджер биомов для бесконечной процедурной генерации
 * Определяет биом для любой точки мира на основе seed
 * Использует сетку регионов 512x512 с гарантией разных соседей
 * Поддерживает плавные переходы между биомами
 */

import worldConfig from '../config/world-config.js'
import { worldSeed } from '../engine.js'
import { createNoise2D } from 'simplex-noise'
import seedrandom from 'seedrandom'

// Создаём генератор Simplex Noise для карты биомов
const biomeNoiseRng = seedrandom(worldSeed.toString() + '_biome')
const biomeNoise = createNoise2D(biomeNoiseRng)

/**
 * Кэш биомов для оптимизации
 * Ключ: "regionX,regionZ" -> biomeType
 */
const biomeCache = new Map()

/**
 * Названия биомов
 */
export const BIOME_NAMES = {
    0: 'Forest',
    1: 'Desert',
    2: 'Snow',
    3: 'Field'
}

/**
 * Эмодзи для биомов
 */
export const BIOME_EMOJI = {
    0: '🌲',
    1: '🏜️',
    2: '❄️',
    3: '🌾'
}

/**
 * Простая функция хеширования для детерминированного выбора
 */
function simpleHash(x, z, seed) {
    let h = seed ^ x ^ z
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b)
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
    return ((h ^ (h >>> 16)) >>> 0)
}

/**
 * Генерация перестановки массива [0,1,2,3] на основе seed
 */
function shuffle4(seed) {
    const arr = [0, 1, 2, 3]
    let currentSeed = seed

    // Fisher-Yates shuffle
    for (let i = 3; i > 0; i--) {
        currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff
        const j = currentSeed % (i + 1)
            ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }

    return arr
}

/**
 * Получить координаты региона для мировых координат
 * Регион = квадрат 512x512 блоков
 * 
 * @param {number} worldX - Мировая координата X
 * @param {number} worldZ - Мировая координата Z
 * @returns {object} {regionX, regionZ}
 */
export function getRegionCoords(worldX, worldZ) {
    const regionSize = worldConfig.world.biomeRegionSize

    return {
        regionX: Math.floor(worldX / regionSize),
        regionZ: Math.floor(worldZ / regionSize)
    }
}

/**
 * Определить тип биома для региона
 * Использует паттерн 2×2 с вариациями, гарантирующий разных соседей
 * 
 * @param {number} regionX - Координата региона X
 * @param {number} regionZ - Координата региона Z
 * @returns {number} ID биома (0-3)
 */
function determineBiomeType(regionX, regionZ) {
    // Проверяем кэш
    const cacheKey = `${regionX},${regionZ}`
    if (biomeCache.has(cacheKey)) {
        return biomeCache.get(cacheKey)
    }

    // Определяем мета-регион (каждый мета-регион = 2×2 региона)
    const metaX = Math.floor(regionX / 2)
    const metaZ = Math.floor(regionZ / 2)

    // Генерируем seed для этого мета-региона
    const metaSeed = simpleHash(metaX, metaZ, worldSeed)

    // Получаем перестановку биомов для этого мета-региона
    const biomeOrder = shuffle4(metaSeed)

    // Определяем позицию внутри мета-региона (0-3)
    // Паттерн 2×2:
    //   [0] [1]
    //   [2] [3]
    const localX = ((regionX % 2) + 2) % 2  // Работает корректно для отрицательных
    const localZ = ((regionZ % 2) + 2) % 2
    const position = localZ * 2 + localX

    // Выбираем биом из перестановки
    const biomeType = biomeOrder[position]

    // Сохраняем в кэш
    biomeCache.set(cacheKey, biomeType)

    return biomeType
}

/**
 * Получить тип биома для мировых координат
 * Резкий переход на границах регионов
 *
 * @param {number} x - Мировая координата X
 * @param {number} z - Мировая координата Z
 * @returns {number} ID биома (0-3)
 */
export function getBiomeAt(x, z) {
    const biomeInfo = getBiomeWithTransition(x, z)
    return biomeInfo.biome
}

/**
 * НИЗКОЧАСТОТНЫЙ ШУМ для определения биома
 * Очень медленный шум для больших областей биомов
 */
function getBiomeNoiseValue(x, z) {
    const BIOME_FREQUENCY = 0.001 // Низкая частота = большие биомы (увеличено для меньших биомов)
    return biomeNoise(x * BIOME_FREQUENCY, z * BIOME_FREQUENCY)
}

/**
 * Получить биом для точки (x, z) с зонами перехода
 * Возвращает объект с информацией о биоме и переходе
 *
 * @param {number} x - Мировая координата X
 * @param {number} z - Мировая координата Z
 * @returns {Object} { biome: biomeId, transition: { toBiome: id, weight: 0-1 } | null }
 */
export function getBiomeWithTransition(x, z) {
    const noiseValue = getBiomeNoiseValue(x, z) // от -1 до 1

    // РЕЗКИЕ ГРАНИЦЫ: убираем все переходы
    // Просто определяем биом по порогу

    let biome
    if (noiseValue < -0.5) biome = worldConfig.biomes.DESERT
    else if (noiseValue < 0.0) biome = worldConfig.biomes.FIELD
    else if (noiseValue < 0.5) biome = worldConfig.biomes.FOREST
    else biome = worldConfig.biomes.SNOW

    return {
        biome,
        transition: null // НЕТ переходов!
    }
}

/**
 * Получить "веса" всех биомов для данной точки
 * РЕЗКИЕ ГРАНИЦЫ: всегда возвращает только один биом
 *
 * @param {number} x - Мировая координата X
 * @param {number} z - Мировая координата Z
 * @returns {Object} {biomeId: weight, ...}
 */
export function getBiomeWeights(x, z) {
    const biomeInfo = getBiomeWithTransition(x, z)

    // ВСЕГДА только один биом с весом 1.0
    return { [biomeInfo.biome]: 1.0 }
}

/**
 * Получить доминирующий биом (с наибольшим весом)
 *
 * @param {number} x - Мировая координата X
 * @param {number} z - Мировая координата Z
 * @returns {number} ID доминирующего биома
 */
export function getDominantBiome(x, z) {
    const weights = getBiomeWeights(x, z)

    let maxWeight = 0
    let dominantBiome = 0

    for (const [biomeId, weight] of Object.entries(weights)) {
        if (weight > maxWeight) {
            maxWeight = weight
            dominantBiome = parseInt(biomeId)
        }
    }

    return dominantBiome
}

/**
 * Проверить, находится ли точка в зоне перехода между биомами
 *
 * @param {number} x - Мировая координата X
 * @param {number} z - Мировая координата Z
 * @returns {boolean} true если в зоне перехода
 */
export function isInTransitionZone(x, z) {
    // РЕЗКИЕ ГРАНИЦЫ: переходов нет, всегда возвращаем false
    return false
}

/**
 * Получить параметры конкретного биома из конфига
 *
 * @param {number} biomeType - ID биома (0-3)
 * @returns {object} Параметры биома
 */
function getBiomeParamsById(biomeType) {
    switch (biomeType) {
        case worldConfig.biomes.FOREST:
            return worldConfig.noise.forest
        case worldConfig.biomes.DESERT:
            return worldConfig.noise.desert
        case worldConfig.biomes.SNOW:
            return worldConfig.noise.snow
        case worldConfig.biomes.FIELD:
            return worldConfig.noise.field
        default:
            return worldConfig.noise.forest
    }
}

/**
 * Получить параметры биома для мировых координат с плавной интерполяцией
 * Интерполирует параметры между биомами в зоне перехода
 *
 * @param {number} x - Мировая координата X
 * @param {number} z - Мировая координата Z
 * @returns {object} Параметры биома {base, amplitude, frequency, roughness, octaves}
 */
export function getBiomeParams(x, z) {
    const weights = getBiomeWeights(x, z)

    // Если только один биом - возвращаем его параметры напрямую
    const biomeIds = Object.keys(weights).filter(key => weights[key] > 0.01)
    if (biomeIds.length === 1) {
        return getBiomeParamsById(parseInt(biomeIds[0]))
    }

    // КРИТИЧНО: amplitude и frequency от доминирующего биома
    const dominantBiome = getDominantBiome(x, z)
    const dominantParams = getBiomeParamsById(dominantBiome)

    // Интерполируем base и roughness для плавных переходов
    let interpolatedBase = 0
    let interpolatedRoughness = 0

    for (const [biomeIdStr, weight] of Object.entries(weights)) {
        if (weight < 0.01) continue
        const biomeId = parseInt(biomeIdStr)
        const params = getBiomeParamsById(biomeId)
        interpolatedBase += params.base * weight
        interpolatedRoughness += params.roughness * weight
    }

    // Возвращаем параметры
    return {
        base: interpolatedBase,              // Интерполируем для плавных переходов высоты
        amplitude: dominantParams.amplitude, // НЕ интерполируем!
        frequency: dominantParams.frequency, // НЕ интерполируем!
        roughness: interpolatedRoughness,    // Интерполируем
        octaves: dominantParams.octaves
    }
}

/**
 * Получить название биома
 * 
 * @param {number} x - Мировая координата X
 * @param {number} z - Мировая координата Z
 * @returns {string} Название биома
 */
export function getBiomeName(x, z) {
    const biomeType = getBiomeAt(x, z)
    return BIOME_NAMES[biomeType] || 'Unknown'
}

/**
 * Получить эмодзи биома
 * 
 * @param {number} x - Мировая координата X
 * @param {number} z - Мировая координата Z
 * @returns {string} Эмодзи биома
 */
export function getBiomeEmoji(x, z) {
    const biomeType = getBiomeAt(x, z)
    return BIOME_EMOJI[biomeType] || '❓'
}

/**
 * Проверить, находятся ли координаты на границе биома
 * Полезно для особой обработки границ
 * 
 * @param {number} x - Мировая координата X
 * @param {number} z - Мировая координата Z
 * @param {number} threshold - Порог расстояния от границы (в блоках)
 * @returns {boolean} true если на границе
 */
export function isOnBiomeBorder(x, z, threshold = 2) {
    const regionSize = worldConfig.world.biomeRegionSize
    const localX = x % regionSize
    const localZ = z % regionSize

    // Проверяем расстояние до границ региона
    const distToLeft = Math.abs(localX)
    const distToRight = regionSize - Math.abs(localX)
    const distToTop = Math.abs(localZ)
    const distToBottom = regionSize - Math.abs(localZ)

    const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom)

    return minDist < threshold
}

/**
 * Получить информацию о текущем регионе
 * Полезно для отладки и UI
 * 
 * @param {number} x - Мировая координата X
 * @param {number} z - Мировая координата Z
 * @returns {object} Информация о регионе
 */
export function getRegionInfo(x, z) {
    const { regionX, regionZ } = getRegionCoords(x, z)
    const biomeType = getBiomeAt(x, z)
    const biomeName = getBiomeName(x, z)
    const biomeEmoji = getBiomeEmoji(x, z)
    const params = getBiomeParams(x, z)

    return {
        regionX,
        regionZ,
        biomeType,
        biomeName,
        biomeEmoji,
        params,
        cacheSize: biomeCache.size
    }
}

/**
 * Очистка кэша биомов
 * Можно вызвать для освобождения памяти
 */
export function clearBiomeCache() {
    biomeCache.clear()
    console.log('🗑️ Biome cache cleared')
}

/**
 * Получить размер кэша
 * @returns {number} Количество закэшированных регионов
 */
export function getBiomeCacheSize() {
    return biomeCache.size
}

export default {
    getRegionCoords,
    getBiomeAt,
    getBiomeWeights,
    getDominantBiome,
    isInTransitionZone,
    getBiomeParams,
    getBiomeName,
    getBiomeEmoji,
    isOnBiomeBorder,
    getRegionInfo,
    clearBiomeCache,
    getBiomeCacheSize,
    BIOME_NAMES,
    BIOME_EMOJI
}
