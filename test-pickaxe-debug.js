/**
 * Отладка генерации кирки
 */

import { RecipeGenerator } from './src/game/items/recipe-generator.js'

const seed = 123456 // Тестовый seed
const generator = new RecipeGenerator(seed)

console.log('=== ТЕСТ ГЕНЕРАЦИИ АЛМАЗНОЙ КИРКИ ===\n')

const grid = generator.generateRecipe('pickaxe', 'diamond')

console.log('Результат (сетка 3×3):')
for (let row = 0; row < 3; row++) {
    const rowDisplay = grid[row].map(cell => {
        if (cell === 'diamond') return 'D'
        if (cell === 'stick') return 'S'
        if (cell === '') return '.'
        return cell
    }).join(' ')
    console.log(`  ${rowDisplay}`)
}

console.log('\nСырой результат:')
console.log(grid)

// Проверка количества предметов
let diamondCount = 0
let stickCount = 0

for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
        if (grid[row][col] === 'diamond') diamondCount++
        if (grid[row][col] === 'stick') stickCount++
    }
}

console.log(`\nКоличество:`)
console.log(`  Алмазы: ${diamondCount} (должно быть 3)`)
console.log(`  Палки: ${stickCount} (должно быть 2)`)

if (diamondCount !== 3 || stickCount !== 2) {
    console.log('\n❌ ОШИБКА: Неправильное количество предметов!')
} else {
    console.log('\n✅ Количество правильное')
}
