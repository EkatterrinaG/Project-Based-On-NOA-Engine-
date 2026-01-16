/**
 * FlowerRandomizer - генератор уникальных параметров цветов
 * Использует seeded RNG для детерминизма
 */

import { FLOWER_PRESETS } from './core.js'

/**
 * Mulberry32 - быстрый seeded PRNG
 * @param {number} seed
 * @returns {function(): number}
 */
function mulberry32(seed) {
    return function() {
        seed |= 0
        seed = seed + 0x6D2B79F5 | 0
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
        return ((t ^ t >>> 14) >>> 0) / 4294967296
    }
}

/**
 * Хеш позиции для seed
 * @param {number} x
 * @param {number} z
 * @returns {number}
 */
function hashPosition(x, z) {
    // Простой spatial hash
    return ((Math.floor(x) * 73856093) ^ (Math.floor(z) * 19349663)) >>> 0
}

/**
 * HSL to RGB конвертер
 * @param {number} h - hue (0-360)
 * @param {number} s - saturation (0-1)
 * @param {number} l - lightness (0-1)
 * @returns {[number, number, number]} RGB (0-1)
 */
function hslToRgb(h, s, l) {
    h = h / 360
    let r, g, b

    if (s === 0) {
        r = g = b = l
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1
            if (t > 1) t -= 1
            if (t < 1/6) return p + (q - p) * 6 * t
            if (t < 1/2) return q
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
            return p
        }
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s
        const p = 2 * l - q
        r = hue2rgb(p, q, h + 1/3)
        g = hue2rgb(p, q, h)
        b = hue2rgb(p, q, h - 1/3)
    }
    return [r, g, b]
}

export class FlowerRandomizer {
    /**
     * @param {number} worldSeed - глобальный seed мира
     */
    constructor(worldSeed = 12345) {
        this.worldSeed = worldSeed
        this.presetNames = Object.keys(FLOWER_PRESETS)
    }

    /**
     * Генерирует уникальные параметры цветка для позиции
     * @param {number} x
     * @param {number} z
     * @returns {FlowerParams}
     */
    generateParams(x, z) {
        const localSeed = hashPosition(x, z) ^ this.worldSeed
        const rng = mulberry32(localSeed)

        // Выбираем preset
        const presetIndex = Math.floor(rng() * this.presetNames.length)
        const presetName = this.presetNames[presetIndex]
        const preset = FLOWER_PRESETS[presetName]

        // Цвет лепестков - яркие цветочные цвета
        const flowerHues = [0, 30, 45, 280, 320, 340, 200, 60] // красный, оранж, желтый, фиолет, розовый, малин, голубой, желтый
        const petalHue = flowerHues[Math.floor(rng() * flowerHues.length)] + (rng() - 0.5) * 20
        const petalSaturation = 0.7 + rng() * 0.3 // Ярче!
        const petalLightness = 0.55 + rng() * 0.2 // Светлее!
        const petalColor = hslToRgb(petalHue, petalSaturation, petalLightness)

        // Цвет центра - яркий желтый/оранжевый
        const centerHue = 40 + rng() * 20 // 40-60 (желтый)
        const centerSaturation = 0.9
        const centerLightness = 0.5 + rng() * 0.2
        const centerColor = hslToRgb(centerHue, centerSaturation, centerLightness)

        // Цвет стебля - зеленый
        const stemHue = 100 + rng() * 30 // Зеленый
        const stemSaturation = 0.5 + rng() * 0.3
        const stemLightness = 0.3 + rng() * 0.15
        const stemColor = hslToRgb(stemHue, stemSaturation, stemLightness)

        return {
            // L-System параметры
            axiom: preset.axiom,
            rules: preset.rules,
            iterations: preset.iterations,
            presetName: presetName,

            // Углы (в градусах)
            angle: 40 + rng() * 20, // 40-60 градусов - шире разброс лепестков
            pitchAngle: 20 + rng() * 30, // 20-50 градусов

            // Геометрия стебля - тоньше и короче
            stemLength: 0.06 + rng() * 0.08, // 0.06-0.14
            stemWidth: 0.008 + rng() * 0.008, // 0.008-0.016 (тоньше!)

            // Геометрия лепестков - больше
            petalLength: 0.08 + rng() * 0.06, // 0.08-0.14
            petalWidth: 0.05 + rng() * 0.04, // 0.05-0.09
            petalCurvature: rng() * 0.2,

            // Центр цветка - больше и заметнее
            centerRadius: 0.03 + rng() * 0.03, // 0.03-0.06

            // Цвета (RGB 0-1)
            petalColor: petalColor,
            centerColor: centerColor,
            stemColor: stemColor,

            // Общий масштаб - как в Minecraft (примерно 0.8-1 блока в высоту)
            scale: 1.5 + rng() * 0.8, // 1.5-2.3

            // Случайный поворот вокруг Y
            rotationY: rng() * Math.PI * 2
        }
    }

    /**
     * Проверяет, должен ли быть цветок в этой позиции
     * @param {number} x
     * @param {number} z
     * @param {number} density - вероятность спавна (0-1)
     * @returns {boolean}
     */
    shouldSpawn(x, z, density = 0.02) {
        const seed = hashPosition(x, z) ^ (this.worldSeed * 31)
        const rng = mulberry32(seed)
        return rng() < density
    }
}

/**
 * @typedef {Object} FlowerParams
 * @property {string} axiom
 * @property {Object<string, string>} rules
 * @property {number} iterations
 * @property {string} presetName
 * @property {number} angle
 * @property {number} pitchAngle
 * @property {number} stemLength
 * @property {number} stemWidth
 * @property {number} petalLength
 * @property {number} petalWidth
 * @property {number} petalCurvature
 * @property {number} centerRadius
 * @property {[number, number, number]} petalColor
 * @property {[number, number, number]} centerColor
 * @property {[number, number, number]} stemColor
 * @property {number} scale
 * @property {number} rotationY
 */

export default FlowerRandomizer
