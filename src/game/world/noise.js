/**
 * Система генерации шума для ландшафта
 * Использует Simplex Noise для процедурной генерации
 */

import { createNoise2D, createNoise3D } from 'simplex-noise'
import { rng } from '../engine.js'

/**
 * Создаём генераторы шума на основе seed
 */
const noise2D = createNoise2D(rng)
const noise3D = createNoise3D(rng)

/**
 * Получить 2D шум (для биомов и базового ландшафта)
 * @param {number} x - Координата X
 * @param {number} z - Координата Z
 * @param {number} frequency - Частота шума (масштаб)
 * @returns {number} Значение шума от -1 до 1
 */
export function getNoise2D(x, z, frequency = 1.0) {
    return noise2D(x * frequency, z * frequency)
}

/**
 * Получить 3D шум (для пещер)
 * @param {number} x - Координата X
 * @param {number} y - Координата Y
 * @param {number} z - Координата Z
 * @param {number} frequency - Частота шума
 * @returns {number} Значение шума от -1 до 1
 */
export function getNoise3D(x, y, z, frequency = 1.0) {
    return noise3D(x * frequency, y * frequency, z * frequency)
}

/**
 * Получить multi-octave шум (для ландшафта)
 * Комбинирует несколько слоёв шума с разными частотами
 * 
 * @param {number} x - Координата X
 * @param {number} z - Координата Z
 * @param {number} frequency - Базовая частота
 * @param {number} amplitude - Амплитуда (высота)
 * @param {number} octaves - Количество октав (слоёв)
 * @param {number} persistence - Уменьшение амплитуды для каждой октавы (обычно 0.5)
 * @param {number} lacunarity - Увеличение частоты для каждой октавы (обычно 2.0)
 * @returns {number} Итоговое значение шума
 */
export function getOctaveNoise(x, z, frequency, amplitude, octaves, persistence = 0.5, lacunarity = 2.0) {
    let total = 0
    let maxValue = 0
    let currentAmplitude = amplitude
    let currentFrequency = frequency

    for (let i = 0; i < octaves; i++) {
        total += getNoise2D(x, z, currentFrequency) * currentAmplitude
        maxValue += currentAmplitude

        currentAmplitude *= persistence
        currentFrequency *= lacunarity
    }

    // Нормализация к диапазону амплитуды
    return total / maxValue * amplitude
}

/**
 * Генератор continent noise (высота континентов)
 * Очень низкая частота для огромных возвышенностей
 */
export function continentNoise(x, z) {
    const frequency = 0.0005
    const amplitude = 20
    return getOctaveNoise(x, z, frequency, amplitude, 3)
}

/**
 * Генератор mountain mask (где будут горы)
 * Возвращает 0..1, где 1 = высокие горы
 */
export function mountainMask(x, z) {
    const value = getNoise2D(x, z, 0.0008)
    // Нормализуем от [-1, 1] к [0, 1]
    const normalized = (value + 1) / 2
    // Применяем smoothstep для четких границ гор
    if (normalized < 0.6) return 0
    if (normalized > 0.9) return 1
    // Smoothstep между 0.6 и 0.9
    const t = (normalized - 0.6) / 0.3
    return t * t * (3 - 2 * t)
}

/**
 * Генератор ГЛОБАЛЬНОГО terrain noise (основная высота ландшафта)
 * НЕ зависит от биома! Биом только декор
 */
export function terrainNoise(x, z) {
    // ФИКСИРОВАННЫЕ параметры для всего мира
    const frequency = 0.004
    const amplitude = 12
    return getOctaveNoise(x, z, frequency, amplitude, 4)
}

/**
 * Генератор roughness noise (скалистость/детали)
 * @param {number} x - Мировая координата X
 * @param {number} z - Мировая координата Z
 * @param {object} biomeParams - Параметры биома из конфига
 * @returns {number} Добавочная высота для шероховатости
 */
export function roughnessNoise(x, z, biomeParams) {
    const { frequency, roughness } = biomeParams
    // Используем более высокую частоту для деталей
    const detailFrequency = frequency * 3
    const detailAmplitude = roughness * 10

    return getOctaveNoise(x, z, detailFrequency, detailAmplitude, 2)
}

/**
 * Генератор detail noise (мелкие вариации)
 * @param {number} x - Мировая координата X
 * @param {number} z - Мировая координата Z
 * @returns {number} Мелкие детали высоты
 */
export function detailNoise(x, z) {
    // Высокая частота, малая амплитуда
    return getOctaveNoise(x, z, 0.05, 2, 2)
}

/**
 * Генератор erosion noise (эрозия на границах биомов)
 * Создаёт плавные переходы высот без резких срезов
 * @param {number} x - Мировая координата X
 * @param {number} z - Мировая координата Z
 * @returns {number} Значение эрозии (±8 блоков)
 */
export function erosionNoise(x, z) {
    // Средняя частота, малая амплитуда
    const frequency = 0.002
    const amplitude = 8
    return getOctaveNoise(x, z, frequency, amplitude, 3)
}

/**
 * Генератор шума для биомов (распределение биомов по карте)
 * @param {number} regionX - Координата региона X
 * @param {number} regionZ - Координата региона Z
 * @returns {number} Значение от 0 до 1 для определения биома
 */
export function biomeNoise(regionX, regionZ) {
    // Используем низкую частоту для плавных больших регионов биомов
    const value = getNoise2D(regionX, regionZ, 0.1)
    // Нормализуем от [-1, 1] к [0, 1]
    return (value + 1) / 2
}

/**
 * Генератор шума для пещер (3D)
 * @param {number} x - Мировая координата X
 * @param {number} y - Мировая координата Y
 * @param {number} z - Мировая координата Z
 * @returns {number} Значение от -1 до 1 (положительные = воздух/пещера)
 */
export function caveNoise(x, y, z) {
    // Комбинируем несколько слоёв 3D шума
    const frequency1 = 0.02
    const frequency2 = 0.04

    const noise1 = getNoise3D(x, y, z, frequency1)
    const noise2 = getNoise3D(x + 100, y + 100, z + 100, frequency2) * 0.5

    return noise1 + noise2
}

export default {
    getNoise2D,
    getNoise3D,
    getOctaveNoise,
    continentNoise,
    mountainMask,
    terrainNoise,
    roughnessNoise,
    detailNoise,
    erosionNoise,
    biomeNoise,
    caveNoise
}
