/**
 * Конфигурация мира для Minecraft-like игры
 * Все параметры определяются на основе seed
 */

export default {
    // Seed мира (0 = случайный при каждом запуске)
    seed: 0,

    // Параметры мира
    world: {
        biomeRegionSize: 512,   // Размер региона биома (512×512 блоков)
        chunkSize: 32,          // Размер чанка (32×32×32 блоков)
        height: 128,            // Высота мира (Y: 0..127)
        infiniteWorld: true,    // Бесконечная генерация
    },

    // Параметры шума для каждого биома
    noise: {
        // Лес: холмистый ландшафт
        forest: {
            base: 0.5,
            amplitude: 18,
            frequency: 0.003,
            roughness: 0.35,
            octaves: 3
        },

        // Пустыня: плоский ландшафт с дюнами
        desert: {
            base: 0.5,
            amplitude: 4,
            frequency: 0.002,
            roughness: 0.1,
            octaves: 2
        },

        // Снежный: горный ландшафт
        snow: {
            base: 0.55,
            amplitude: 24,
            frequency: 0.0035,
            roughness: 0.45,
            octaves: 4
        },

        // Поле: пологие холмы
        field: {
            base: 0.48,
            amplitude: 12,
            frequency: 0.0025,
            roughness: 0.2,
            octaves: 3
        }
    },

    // Параметры генерации руд
    ores: {
        coal: {
            minY: 20,
            maxY: 127,
            vein: [4, 16],      // [минимум, максимум] блоков в жиле
            spawnChance: 0.8    // Вероятность спавна
        },
        iron: {
            minY: 0,
            maxY: 64,
            vein: [5, 8],
            spawnChance: 0.7
        },
        gold: {
            minY: 0,
            maxY: 32,
            vein: [4, 6],
            spawnChance: 0.5
        },
        diamond: {
            minY: 1,
            maxY: 16,
            vein: [4, 6],
            spawnChance: 0.9
        }
    },

    // Параметры деревьев
    trees: {
        min_spacing: 5,       // Минимальное расстояние между деревьями
        height: [4, 8],       // [мин, макс] высота ствола
        density: 0.1         // Плотность размещения (2%)
    },

    // Параметры пещер
    caves: {
        density: 0.02,        // Плотность пещер
        avg_radius: [1, 4],   // [мин, макс] радиус туннеля
        branch_chance: 0.04   // Шанс ветвления (4%)
    },

    // Параметры текстур
    textures: {
        size: 16,             // Размер текстур (16×16 пикселей)
        cacheEnabled: true    // Кэширование текстур по seed
    },

    // Параметры игрока
    player: {
        randomSpawn: true,    // Случайный биом при спавне
        spawnHeight: 64,      // Начальная высота поиска поверхности
        safeSpawn: true       // Проверка безопасности места спавна
    },

    // ID биомов
    biomes: {
        FOREST: 0,
        DESERT: 1,
        SNOW: 2,
        FIELD: 3
    }
}
