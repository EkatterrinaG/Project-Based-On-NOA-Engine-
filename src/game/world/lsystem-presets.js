/**
 * Предустановки L-System для различных растений
 * Содержит правила генерации деревьев, травы и цветов
 */

/**
 * Обычное дерево (лиственное)
 * Создает ветвящуюся структуру с листвой на концах ветвей
 */
export const TREE_DECIDUOUS = {
    axiom: 'FFFF',
    rules: {
        'F': [
            'F[+FL][-FL]L',
            'F[+FL][-FL][FL]L',
            'FF[+L][-L]L'
        ]
    },
    iterations: 2,
    options: { angle: 30, stepLength: 1 }
}

/**
 * Ель (хвойное дерево)
 * Создает коническую структуру с ярусами веток
 */
export const TREE_PINE = {
    axiom: 'FFFFFFL',
    rules: { 'F': 'F[+L][-L]' },
    iterations: 1,
    options: { angle: 35, stepLength: 0.6 }
}

/**
 * Большое старое дерево
 */
export const TREE_OLD = {
    axiom: 'FFFFF',
    rules: { 'F': 'F[+FL][-FL]' },
    iterations: 2,
    options: { angle: 25, stepLength: 1 }
}

/**
 * Ива (плакучая)
 */
export const TREE_WILLOW = {
    axiom: 'F',
    rules: { 'F': 'FF[&FL][&FL]F[&FL][&FL]F' },
    iterations: 3,
    options: { angle: 35, stepLength: 1 }
}

/**
 * Кустарник
 */
export const BUSH = {
    axiom: 'F',
    rules: { 'F': 'F[+FL][-FL]F[+FL]FL' },
    iterations: 2,
    options: { angle: 30, stepLength: 0.5 }
}

/**
 * Простая трава
 */
export const GRASS_SIMPLE = {
    axiom: 'F',
    rules: ['F', 'F[+F]', 'F[-F]'],
    iterations: 1,
    options: { angle: 20, stepLength: 0.5 }
}

/**
 * Высокая трава
 */
export const GRASS_TALL = {
    axiom: 'FF',
    rules: { 'F': 'F[+F][-F]' },
    iterations: 1,
    options: { angle: 20, stepLength: 0.6 }
}

/**
 * Папоротник
 */
export const FERN = {
    axiom: 'X',
    rules: { 'X': 'F[+X]F[-X]+X', 'F': 'FF' },
    iterations: 4,
    options: { angle: 25, stepLength: 0.5 }
}

/**
 * Лиана
 */
export const VINE = {
    axiom: 'F',
    rules: { 'F': 'F[+F]F[-F][F]' },
    iterations: 4,
    options: { angle: 20, stepLength: 0.4 }
}


/**
 * Массив всех пресетов цветов
 */
/**
 * Случайный пресет цветка (генерирует комбинацию стебля и коронки)
 */

/**
 * Получить случайную предустановку для биома
 */
export function getRandomPresetForBiome(biomeType, biomes) {
    switch (biomeType) {
        case biomes.FOREST:
            return Math.random() < 0.8 ? TREE_DECIDUOUS : TREE_OLD
        case biomes.SNOW:
            return TREE_PINE
        case biomes.DESERT:
            return null
        case biomes.FIELD: {
            return GRASS_SIMPLE
        }
        default:
            return GRASS_SIMPLE
    }
}

/**
 * Все доступные предустановки
 */
export const ALL_PRESETS = {
    TREE_DECIDUOUS, TREE_PINE, TREE_OLD, TREE_WILLOW, BUSH,
    GRASS_SIMPLE, GRASS_TALL, FERN, VINE
}
