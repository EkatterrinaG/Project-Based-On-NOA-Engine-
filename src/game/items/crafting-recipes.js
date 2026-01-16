/**
 * Рецепты крафта
 * Определение всех рецептов в игре
 * Поддерживает два типа рецептов:
 * 1. Фиксированные (базовые ресурсы)
 * 2. L-System процедурные (инструменты)
 */

import { generateLSystemRecipes } from './recipe-generator.js'

/**
 * Типы рецептов
 */
export const RecipeType = {
    SHAPELESS: 'shapeless',   // Неважен порядок (просто набор ингредиентов)
    SHAPED: 'shaped',         // Важен порядок (сетка)
    SINGLE_SLOT: 'single_slot' // Только один предмет в одном слоте (дерево -> доски)
}

// Реестр рецептов
export const recipes = []

// Отдельные массивы для организации
export const fixedRecipes = []      // Фиксированные рецепты (без L-System)
export const lSystemRecipes = []    // L-System процедурные рецепты

/**
 * Регистрация рецепта
 * @param {string} result - ID результата
 * @param {number} count - Количество результата
 * @param {Array} ingredients - Ингредиенты для shapeless
 * @param {string} type - Тип рецепта
 * @param {Array} shape - Форма для shaped
 * @param {boolean} isLSystem - Флаг L-System рецепта
 */
function registerRecipe(result, count, ingredients, type = RecipeType.SHAPELESS, shape = null, isLSystem = false) {
    const recipe = {
        result,       // ID/Имя результата
        count,        // Количество результата
        ingredients,  // Список ингредиентов {item: 'name', count: 1} (для shapeless)
        type,         // Тип рецепта
        shape,        // Форма (для shaped рецептов) - массив массивов ['item'/''] или [[],[],[]]
        gridSize: shape ? (shape.length === 2 ? 2 : 3) : null,  // Размер сетки (2 или 3)
        isLSystem     // Флаг для идентификации L-System рецептов
    }

    // Добавляем в общий массив
    recipes.push(recipe)

    // Добавляем в соответствующий категорийный массив
    if (isLSystem) {
        lSystemRecipes.push(recipe)
    } else {
        fixedRecipes.push(recipe)
    }
}

/**
 * Регистрация всех рецептов
 * @param {number} seed - Глобальный seed мира для генерации L-System рецептов
 */
export function registerRecipes(seed = 0) {
    console.log('📜 Registering recipes...')
    console.log(`🌱 Using seed: ${seed}`)

    // Очищаем предыдущие рецепты
    recipes.length = 0
    fixedRecipes.length = 0
    lSystemRecipes.length = 0

    // ========================================
    // ЧАСТЬ 1: ФИКСИРОВАННЫЕ РЕЦЕПТЫ
    // ========================================

    console.log('📌 Registering fixed recipes...')

    // === ДЕРЕВО -> ДОСКИ ===
    // SINGLE_SLOT: только 1 предмет в одном слоте, остальные слоты пустые

    // Дуб -> 4 Дубовые доски
    registerRecipe('oak_planks', 4, [
        { item: 'oak', count: 1 }
    ], RecipeType.SINGLE_SLOT, null, false)

    // Тёмный дуб -> 4 Тёмные дубовые доски
    registerRecipe('dark_oak_planks', 4, [
        { item: 'dark_oak', count: 1 }
    ], RecipeType.SINGLE_SLOT, null, false)

    // === БАЗОВЫЕ РЕСУРСЫ ===

    /** @type {any} */
    const anyPlank = ['oak_planks', 'dark_oak_planks']

    // === ПАЛКИ (2x2 сетка) ===
    registerRecipe('stick', 4, [], RecipeType.SHAPED, [
        [anyPlank, ''],
        [anyPlank, '']
    ], false)
    registerRecipe('stick', 4, [], RecipeType.SHAPED, [
        ['', anyPlank],
        ['', anyPlank]
    ], false)

    // === ПАЛКИ (3x3 сетка) ===
    // Колонки 0, 1, 2
    for (let col = 0; col < 3; col++) {
        /** @type {any[]} */
        const row1 = ['', '', '']; /** @type {any[]} */ const row2 = ['', '', '']; /** @type {any[]} */ const row3 = ['', '', '']
        row1[col] = anyPlank; row2[col] = anyPlank
        registerRecipe('stick', 4, [], RecipeType.SHAPED, [row1, row2, row3], false)

        /** @type {any[]} */
        const row1b = ['', '', '']; /** @type {any[]} */ const row2b = ['', '', '']; /** @type {any[]} */ const row3b = ['', '', '']
        row2b[col] = anyPlank; row3b[col] = anyPlank
        registerRecipe('stick', 4, [], RecipeType.SHAPED, [row1b, row2b, row3b], false)
    }

    // === ВЕРСТАК (2x2 сетка) ===
    registerRecipe('crafting_table', 1, [], RecipeType.SHAPED, [
        [anyPlank, anyPlank],
        [anyPlank, anyPlank]
    ], false)

    // === ВЕРСТАК (3x3 сетка) ===
    // 4 варианта положения квадрата 2x2
    registerRecipe('crafting_table', 1, [], RecipeType.SHAPED, [
        [anyPlank, anyPlank, ''],
        [anyPlank, anyPlank, ''],
        ['', '', '']
    ], false)
    registerRecipe('crafting_table', 1, [], RecipeType.SHAPED, [
        ['', anyPlank, anyPlank],
        ['', anyPlank, anyPlank],
        ['', '', '']
    ], false)
    registerRecipe('crafting_table', 1, [], RecipeType.SHAPED, [
        ['', '', ''],
        [anyPlank, anyPlank, ''],
        [anyPlank, anyPlank, '']
    ], false)
    registerRecipe('crafting_table', 1, [], RecipeType.SHAPED, [
        ['', '', ''],
        ['', anyPlank, anyPlank],
        ['', anyPlank, anyPlank]
    ], false)

    // === ИНСТРУМЕНТЫ (теперь все через L-System) ===
    // Деревянные, каменные, железные, золотые, алмазные инструменты
    // генерируются процедурно ниже

    // === БЛОКИ ===

    // Печка: 8 камней по краям
    registerRecipe('furnace', 1, [], RecipeType.SHAPED, [
        ['stone', 'stone', 'stone'],
        ['stone', '', 'stone'],
        ['stone', 'stone', 'stone']
    ], false)

    console.log(`✅ Registered ${fixedRecipes.length} fixed recipes`)

    // ========================================
    // ЧАСТЬ 2: L-SYSTEM ПРОЦЕДУРНЫЕ РЕЦЕПТЫ
    // ========================================

    console.log('🌿 Generating L-System recipes...')

    const generatedRecipes = generateLSystemRecipes(seed)

    for (const recipe of generatedRecipes) {
        registerRecipe(
            recipe.result,
            recipe.count,
            [],
            RecipeType.SHAPED,
            recipe.shape,
            true  // isLSystem = true
        )
    }

    console.log(`✅ Generated ${lSystemRecipes.length} L-System recipes`)
    console.log(`📦 Total recipes: ${recipes.length}`)
}

/**
 * Найти рецепт по ингредиентам (shapeless)
 * @param {Array} inputItems - Массив предметов [{item: 'name', count: 1}, ...]
 */
export function findRecipe(inputItems) {
    // Упрощенный поиск: ищем рецепт, который можно создать из данных предметов
    // Пока поддерживаем только точное совпадение или наличие ингредиентов

    for (const recipe of recipes) {
        if (canCraft(recipe, inputItems)) {
            return recipe
        }
    }
    return null
}

/**
 * Найти рецепт по сетке крафта (shaped)
 * @param {Array<Array<string>>} grid - Сетка 2x2 или 3x3 с именами предметов (или '' для пустых)
 */
export function findShapedRecipe(grid) {
    const gridSize = grid.length

    for (const recipe of recipes) {
        if (recipe.type !== RecipeType.SHAPED) continue
        if (!recipe.shape || recipe.gridSize !== gridSize) continue

        // Проверяем точное совпадение паттерна
        if (matchesPattern(grid, recipe.shape)) {
            return recipe
        }
    }
    return null
}

/**
 * Проверка возможности крафта (shapeless)
 */
function canCraft(recipe, inputItems) {
    // Только для shapeless рецептов
    if (recipe.type !== RecipeType.SHAPELESS) return false

    // Создаем копию инпута для проверки
    const available = {}
    for (const i of inputItems) {
        if (!available[i.item]) available[i.item] = 0
        available[i.item] += i.count
    }

    // Проверяем требования рецепта
    for (const req of recipe.ingredients) {
        if (!available[req.item] || available[req.item] < req.count) {
            return false
        }
    }

    return true
}

/**
 * Проверка возможности SINGLE_SLOT крафта
 * Условие: ровно один тип предмета в одном слоте, остальные слоты пустые
 * @param {object} recipe - Рецепт с типом SINGLE_SLOT
 * @param {Array} slots - Массив слотов [{item: 'name', count: N}, null, null, ...]
 */
function canCraftSingleSlot(recipe, slots) {
    if (recipe.type !== RecipeType.SINGLE_SLOT) return false

    // Считаем занятые слоты
    let occupiedSlots = 0
    let foundItem = null
    let foundCount = 0

    for (const slot of slots) {
        if (slot && slot.item && slot.count > 0) {
            occupiedSlots++
            foundItem = slot.item
            foundCount = slot.count
        }
    }

    // Должен быть ровно 1 занятый слот
    if (occupiedSlots !== 1) return false

    // Проверяем что предмет соответствует рецепту
    const requiredItem = recipe.ingredients[0]
    if (foundItem !== requiredItem.item) return false

    // Проверяем что количества достаточно
    if (foundCount < requiredItem.count) return false

    return true
}

/**
 * Найти SINGLE_SLOT рецепт по слотам
 * @param {Array} slots - Массив слотов [{item: 'name', count: N}, null, null, ...]
 */
export function findSingleSlotRecipe(slots) {
    for (const recipe of recipes) {
        if (recipe.type !== RecipeType.SINGLE_SLOT) continue
        if (canCraftSingleSlot(recipe, slots)) {
            return recipe
        }
    }
    return null
}

/**
 * Проверка совпадения паттерна сетки с рецептом
 */
function matchesPattern(grid, pattern) {
    if (grid.length !== pattern.length) return false

    for (let row = 0; row < grid.length; row++) {
        if (grid[row].length !== pattern[row].length) return false

        for (let col = 0; col < grid[row].length; col++) {
            const gridItem = grid[row][col] || ''
            const patternItem = pattern[row][col] || ''

            // Если в паттерне массив - проверяем наличие
            if (Array.isArray(patternItem)) {
                if (!patternItem.includes(gridItem)) return false
            }
            // Иначе - строгое сравнение
            else if (gridItem !== patternItem) {
                return false
            }
        }
    }

    return true
}

export default {
    recipes,
    registerRecipes,
    findRecipe,
    findShapedRecipe,
    findSingleSlotRecipe,
    RecipeType
}
