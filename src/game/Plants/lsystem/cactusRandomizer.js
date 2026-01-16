/**
 * CactusRandomizer - генератор уникальных параметров кактусов
 */

import { CACTUS_PRESETS } from './core.js'

/**
 * Mulberry32 - быстрый seeded PRNG
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

function hashPosition(x, z) {
    return ((Math.floor(x) * 73856093) ^ (Math.floor(z) * 19349663)) >>> 0
}

export class CactusRandomizer {
    constructor(worldSeed = 12345) {
        this.worldSeed = worldSeed
        this.presetNames = Object.keys(CACTUS_PRESETS)
    }

    generateParams(x, z) {
        const localSeed = hashPosition(x, z) ^ this.worldSeed
        const rng = mulberry32(localSeed)

        // Выбираем preset
        const presetIndex = Math.floor(rng() * this.presetNames.length)
        const presetName = this.presetNames[presetIndex]
        const preset = CACTUS_PRESETS[presetName]

        // Цвет кактуса - разные оттенки зеленого
        const cactusHue = 100 + rng() * 40 // 100-140 (зелёный)
        const cactusSaturation = 0.4 + rng() * 0.3
        const cactusLightness = 0.25 + rng() * 0.15
        const cactusColor = this.hslToRgb(cactusHue, cactusSaturation, cactusLightness)

        // Более светлый оттенок для рёбер
        const ribColor = this.hslToRgb(cactusHue + 10, cactusSaturation - 0.1, cactusLightness + 0.1)

        return {
            axiom: preset.axiom,
            rules: preset.rules,
            iterations: preset.iterations,
            presetName: presetName,

            // Углы веток (90 градусов как в Minecraft)
            angle: 90,
            pitchAngle: 0, // Ветки горизонтальные

            // Размеры сегментов
            segmentHeight: 0.3 + rng() * 0.2, // Высота одного сегмента
            segmentWidth: 0.15 + rng() * 0.1, // Ширина кактуса

            // Цвета
            cactusColor: cactusColor,
            ribColor: ribColor,

            // Общий масштаб
            scale: 0.8 + rng() * 0.5, // 0.8-1.3

            // Поворот
            rotationY: rng() * Math.PI * 2
        }
    }

    shouldSpawn(x, z, density = 0.01) {
        const seed = hashPosition(x, z) ^ (this.worldSeed * 31)
        const rng = mulberry32(seed)
        return rng() < density
    }

    hslToRgb(h, s, l) {
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
}

export default CactusRandomizer
