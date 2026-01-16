/**
 * Инициализация noa engine
 * Базовая настройка движка для Minecraft-like игры
 */

import { Engine } from 'noa-engine'
import worldConfig from './config/world-config.js'
import seedrandom from 'seedrandom'

/**
 * Генерация или загрузка seed мира
 */
function getWorldSeed() {
    // 1. Проверяем URL параметры (от нового меню)
    const urlParams = new URLSearchParams(window.location.search)
    const urlSeed = urlParams.get('seed')
    if (urlSeed) {
        // Если seed числовой, конвертируем
        const numSeed = parseInt(urlSeed)
        if (!isNaN(numSeed)) return numSeed
        // Иначе возвращаем хэш строки (или просто строку если seedrandom поддерживает это)
        // Но noa engine ожидаем скорее число или строку, seedrandom умеет работать со строками.
        // Для простоты вернем строку или конвертируем в число хэшем
        return urlSeed
    }

    // 2. Если seed = 0 в конфиге, генерируем случайный
    if (worldConfig.seed === 0) {
        return Math.floor(Math.random() * 1000000000)
    }
    return worldConfig.seed
}

// Получаем seed для мира
const worldSeed = getWorldSeed()
console.log(`🌍 World Seed: ${worldSeed}`)

// Инициализируем RNG с seed
const rng = seedrandom(worldSeed.toString())

/**
 * Настройки noa engine
 */
const noaOptions = {
    // Отладка
    debug: true,
    showFPS: true,

    // Управление
    inverseY: false,
    inverseX: false,

    // Чанки
    chunkSize: worldConfig.world.chunkSize,
    chunkAddDistance: [4, 3],
    chunkRemoveDistance: [5, 4],

    // Игрок
    playerStart: [0, 100, 0],
    playerHeight: 1.4,
    playerWidth: 0.6,
    playerAutoStep: true,
    playerShadowComponent: false,

    // Дальность взаимодействия
    blockTestDistance: 10,

    // Рендеринг
    useAO: true,
    AOmultipliers: [0.92, 0.8, 0.5],
    reverseAOmultiplier: 1.0,

    // Освещение
    lightVector: [0.6, -1, -0.4],

    // Оптимизация
    manuallyControlChunkLoading: false,
    originRebaseDistance: 25,
}

/**
 * Создаём экземпляр noa engine
 */
export const noa = new Engine(noaOptions)

/**
 * Экспортируем конфигурацию и seed
 */
export { worldConfig, worldSeed, rng }

/**
 * Переназначение клавиш управления
 * Убираем E из alt-fire, чтобы он использовался только для инвентаря
 */
noa.inputs.unbind('E')

/**
 * Настройка камеры
 */
noa.camera.zoomDistance = 0
noa.camera.pitch = 0.5
noa.camera.heading = 0

/**
 * Вывод информации о мире в консоль
 */
console.log('🎮 Noa Engine initialized')
console.log(`📦 Chunk size: ${worldConfig.world.chunkSize}`)
console.log(`🗺️ Infinite world: ${worldConfig.world.infiniteWorld}`)
console.log(`⛰️ World height: ${worldConfig.world.height}`)
console.log(`🌲 Biome region size: ${worldConfig.world.biomeRegionSize}`)
