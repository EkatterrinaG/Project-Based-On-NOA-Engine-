/**
 * Рецепты плавки для печки
 * Определяет что можно переплавить и во что
 */

// Реестр рецептов плавки
export const smeltingRecipes = []

/**
 * Регистрация рецепта плавки
 */
function registerSmeltingRecipe(input, output, smeltTime = 60) {
    smeltingRecipes.push({
        input,      // Название входного предмета
        output,     // Название выходного предмета
        smeltTime   // Время плавки в секундах
    })
}

/**
 * Регистрация всех рецептов плавки
 */
export function registerSmeltingRecipes() {
    console.log('🔥 Registering smelting recipes...')

    // Руды -> Слитки
    registerSmeltingRecipe('iron_ore', 'iron_ingot', 15)
    registerSmeltingRecipe('gold_ore', 'gold_ingot', 15)

    // Песок -> Стекло (опционально)
    registerSmeltingRecipe('sand', 'glass', 5)

    console.log(`✅ Registered ${smeltingRecipes.length} smelting recipes`)
}

/**
 * Найти рецепт плавки по входному предмету
 */
export function findSmeltingRecipe(inputItem) {
    return smeltingRecipes.find(recipe => recipe.input === inputItem) || null
}

/**
 * Данные о топливе
 * Значение = количество операций плавки
 */
export const fuelData = {
    'coal': 8,              // Уголь: 8 операций
    'oak_planks': 1.5,      // Дубовые доски: 1.5 операции
    'dark_oak_planks': 1.5, // Тёмные дубовые доски: 1.5 операции
    'stick': 0.5,           // Палка: 0.5 операции
    'oak': 3,               // Дуб: 3 операции
    'dark_oak': 3           // Тёмный дуб: 3 операции
}

/**
 * Получить значение топлива
 */
export function getFuelValue(itemName) {
    return fuelData[itemName] || 0
}

export default {
    smeltingRecipes,
    registerSmeltingRecipes,
    findSmeltingRecipe,
    fuelData,
    getFuelValue
}
