/**
 * Процедурная генерация рецептов крафта через L-System
 * Использует грамматические правила для создания уникальных, но логичных рецептов
 */

import { LSystem } from '../world/lsystem.js'
import seedrandom from 'seedrandom'

/**
 * Генератор рецептов на основе L-System
 */
export class RecipeGenerator {
    /**
     * @param {number} seed - Глобальный seed мира
     */
    constructor(seed) {
        this.seed = seed
        this.rng = seedrandom(String(seed))

        // Базовые паттерны инструментов (вертикальная ориентация: сверху вниз)
        // M = материал, S = палка, . = пусто
        this.basePatterns = {
            // Кирка: 3 материала сверху + 2 палки вниз (только связанные варианты)
            pickaxe: [
                ['M M M', '. S .', '. S .'],  // 1 - классика центр (палки связаны с материалом)
                ['M M M', 'S . .', 'S . .'],  // 2 - классика лево (палки связаны слева)
                ['M M M', '. . S', '. . S']   // 3 - классика право (палки связаны справа)
            ],

            // Топор: только классические L-формы (будут поворачиваться)
            axe: [
                ['M M .', 'M S .', '. S .'],  // 1 - классическая левая L
                ['. M M', '. S M', '. S .']   // 2 - классическая правая L (зеркало)
            ],

            // Лопата: 1 материал + 2 палки (7 вариантов)
            shovel: [
                ['. M .', '. S .', '. S .'],  // 1 - центр классика
                ['M . .', 'S . .', 'S . .'],  // 2 - лево классика
                ['. . M', '. . S', '. . S'],  // 3 - право классика
                ['. M .', 'S . .', 'S . .'],  // 4 - центр-лево
                ['. M .', '. . S', '. . S'],  // 5 - центр-право
                ['M . .', '. S .', '. S .'],  // 6 - лево-центр
                ['. . M', '. S .', '. S .']   // 7 - право-центр
            ],

            // Меч: 2 материала + 1 палка (8 вариантов)
            sword: [
                ['. M .', '. M .', '. S .'],  // 1 - центр классика
                ['M . .', 'M . .', 'S . .'],  // 2 - лево классика
                ['. . M', '. . M', '. . S'],  // 3 - право классика
                ['. M .', 'M . .', 'S . .'],  // 4 - изогнутый лево
                ['. M .', '. . M', '. . S'],  // 5 - изогнутый право
                ['M . .', '. M .', '. S .'],  // 6 - зигзаг лево
                ['. . M', '. M .', '. S .'],  // 7 - зигзаг право
                ['M . .', '. M .', 'S . .']   // 8 - диагональ лево
            ],

            // Рунический амулет: D=алмаз, G=золото, I=железо (6 вариантов)
            runic_amulet: [
                ['G D G', 'I G I', 'G . .'],  // 1 - алмаз сверху центр
                ['I G D', 'G . G', 'I G .'],  // 2 - алмаз справа
                ['G I G', 'G D G', '. I .'],  // 3 - алмаз центр
                ['D G I', 'G . G', '. G I'],  // 4 - алмаз слева сверху
                ['G G G', 'I D I', 'G . .'],  // 5 - алмаз центр посередине
                ['I G I', 'G D G', '. G .']   // 6 - симметричный крест
            ],

        }

        // Ориентации: 0 = UP (вверх), 1 = DOWN (вниз), 2 = LEFT (влево), 3 = RIGHT (вправо)
        this.rotations = ['UP', 'DOWN', 'LEFT', 'RIGHT']
    }

    /**
     * Поворачивает паттерн 3×3 на 90 градусов по часовой стрелке
     * @param {Array<string>} pattern - Массив из 3 строк (например: ['M M M', '. S .', '. S .'])
     * @returns {Array<string>} - Повёрнутый паттерн
     */
    rotatePattern90(pattern) {
        // Преобразуем строки в 2D массив
        const grid = pattern.map(row => row.split(' '))

        // Поворот на 90° по часовой стрелке: новая[row][col] = старая[2-col][row]
        const rotated = [
            [grid[2][0], grid[1][0], grid[0][0]],
            [grid[2][1], grid[1][1], grid[0][1]],
            [grid[2][2], grid[1][2], grid[0][2]]
        ]

        // Преобразуем обратно в строки
        return rotated.map(row => row.join(' '))
    }

    /**
     * Применяет ориентацию к паттерну
     * @param {Array<string>} pattern - Базовый паттерн
     * @param {string} orientation - Ориентация: 'UP', 'DOWN', 'LEFT', 'RIGHT'
     * @returns {Array<string>} - Паттерн с применённой ориентацией
     */
    applyOrientation(pattern, orientation) {
        let result = [...pattern]

        switch (orientation) {
            case 'UP':
                // Базовая ориентация (материал сверху, палки снизу)
                break

            case 'DOWN':
                // Переворот на 180° (палки сверху, материал снизу) - как в реальном Minecraft
                result = this.rotatePattern90(result)
                result = this.rotatePattern90(result)
                break

            case 'LEFT':
                // Поворот на 90° против часовой (материал слева, палки справа)
                result = this.rotatePattern90(result)
                result = this.rotatePattern90(result)
                result = this.rotatePattern90(result)
                break

            case 'RIGHT':
                // Поворот на 90° по часовой (материал справа, палки слева)
                result = this.rotatePattern90(result)
                break
        }

        return result
    }

    /**
     * Генерирует рецепт для конкретного инструмента и материала
     * @param {string} toolType - Тип инструмента (pickaxe, axe, shovel, sword)
     * @param {string} material - Материал (planks, cobblestone, iron, gold, diamond)
     * @returns {Array<Array<string>>} - Сетка 3×3 с именами предметов
     */
    generateRecipe(toolType, material) {
        const patterns = this.basePatterns[toolType]
        if (!patterns) {
            throw new Error(`Unknown tool type: ${toolType}`)
        }

        // Используем простое хеширование для большего разнообразия
        const combinedSeed = this.hashSeed(`${this.seed}_${toolType}_${material}`)
        const localRng = seedrandom(String(combinedSeed))

        // Выбираем случайный вариант паттерна (A, B, или C)
        const patternIndex = Math.floor(localRng() * patterns.length)
        const basePattern = patterns[patternIndex]

        // Выбираем случайную ориентацию (UP, DOWN, LEFT, RIGHT)
        const orientationIndex = Math.floor(localRng() * this.rotations.length)
        const orientation = this.rotations[orientationIndex]

        // Применяем ориентацию к паттерну
        const rotatedPattern = this.applyOrientation(basePattern, orientation)

        // Конвертируем паттерн в сетку 3×3 с заменой символов на предметы
        const grid = this.patternToGrid(rotatedPattern, material)

        return grid
    }

    /**
     * Простое хеширование для создания разнообразных seed'ов
     * @param {string} str - Строка для хеширования
     * @returns {number} - Хеш-значение
     */
    hashSeed(str) {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash // Конвертируем в 32-битное целое
        }
        return Math.abs(hash)
    }

    /**
     * Преобразует паттерн (массив строк с символами) в сетку 3×3 с именами предметов
     * @param {Array<string>} pattern - Паттерн (например: ['M M M', '. S .', '. S .'])
     * @param {string} material - Материал для замены 'M' (planks, iron, gold, diamond, cobblestone) или null
     * @returns {Array<Array<string>>} - Сетка 3×3 с именами предметов
     */
    patternToGrid(pattern, material = null) {
        const grid = [
            ['', '', ''],
            ['', '', ''],
            ['', '', '']
        ]

        for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
            const rowString = pattern[rowIndex]
            const cells = rowString.split(' ')

            for (let colIndex = 0; colIndex < 3; colIndex++) {
                const symbol = cells[colIndex]

                // Базовые символы
                if (symbol === 'M' && material) {
                    grid[rowIndex][colIndex] = material
                } else if (symbol === 'S') {
                    grid[rowIndex][colIndex] = 'stick'
                }
                // Новые символы для специальных предметов
                else if (symbol === 'I') {
                    grid[rowIndex][colIndex] = 'iron'
                } else if (symbol === 'G') {
                    grid[rowIndex][colIndex] = 'gold'
                } else if (symbol === 'D') {
                    grid[rowIndex][colIndex] = 'diamond'
                } else if (symbol === 'C') {
                    grid[rowIndex][colIndex] = 'coal'
                } else if (symbol === 'T') {
                    grid[rowIndex][colIndex] = 'torch'
                }
                // '.' означает пустая ячейка
            }
        }

        return grid
    }

    /**
     * Генерирует все рецепты для всех инструментов и материалов
     * @returns {Array} - Массив объектов рецептов
     */
    generateAllRecipes() {
        const recipes = []

        // === 1. ОБЫЧНЫЕ ИНСТРУМЕНТЫ ===
        const tools = ['pickaxe', 'axe', 'shovel', 'sword']
        const materials = [
            { name: 'oak_planks', prefix: 'wooden' },
            { name: 'dark_oak_planks', prefix: 'wooden' },  // Альтернативный рецепт для тёмных досок
            { name: 'cobblestone', prefix: 'stone' },
            { name: 'iron', prefix: 'iron' },
            { name: 'gold', prefix: 'gold' },
            { name: 'diamond', prefix: 'diamond' }
        ]

        for (const tool of tools) {
            for (const materialInfo of materials) {
                const grid = this.generateRecipe(tool, materialInfo.name)
                recipes.push({
                    result: `${materialInfo.prefix}_${tool}`,
                    count: 1,
                    type: 'shaped',
                    shape: grid,
                    gridSize: 3,
                    isLSystem: true
                })
            }
        }

        // === 3. РУНИЧЕСКИЙ АМУЛЕТ ===
        const amuletGrid = this.generateRecipe('runic_amulet', null)
        recipes.push({
            result: 'runic_amulet',
            count: 1,
            type: 'shaped',
            shape: amuletGrid,
            gridSize: 3,
            isLSystem: true
        })

        return recipes
    }
}

/**
 * Вспомогательная функция для генерации всех L-System рецептов
 * @param {number} seed - Глобальный seed мира
 * @returns {Array} - Массив рецептов
 */
export function generateLSystemRecipes(seed) {
    const generator = new RecipeGenerator(seed)
    return generator.generateAllRecipes()
}
