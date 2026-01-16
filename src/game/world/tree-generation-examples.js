/**
 * ПРИМЕР ИСПОЛЬЗОВАНИЯ: Процедурная Генерация Деревьев
 * 
 * Этот файл показывает как использовать randomTreeLSystem
 * для генерации уникальных деревьев в вашем коде
 */

import { randomTreeLSystem } from './tree-lsystem-generator.js'
import { LSystem, LSystemInterpreter } from './lsystem.js'
import { blockIDs } from '../blocks/block-registry.js'

/**
 * ПРИМЕР 1: Простая генерация дерева в конкретной позиции
 */
function example1_SimpleTree(noa, x, y, z) {
    // 1. Создаём seed из позиции
    const seed = (x * 73856093) ^ (z * 19349663)

    // 2. Генерируем конфигурацию L-системы
    const config = randomTreeLSystem(seed)

    // 3. Создаём L-систему и генерируем строку
    const lsystem = new LSystem(config.axiom, config.rules, config.iterations)
    const lsystemString = lsystem.generate()

    // 4. Интерпретируем в воксели
    const interpreter = new LSystemInterpreter(noa, x, y, z, {
        angle: config.angle,
        stepLength: config.step * config.scale,
        trunkBlock: blockIDs.wood,
        leavesBlock: blockIDs.leaves
    })

    interpreter.interpret(lsystemString)

    console.log(`Generated ${config.woodType} tree at (${x}, ${y}, ${z})`)
}

/**
 * ПРИМЕР 2: Генерация дерева конкретного типа
 */
function example2_SpecificTreeType(noa, x, y, z, desiredType = 'oak') {
    // Пробуем разные seeds пока не получим нужный тип
    let seed = (x * 73856093) ^ (z * 19349663)
    let config
    let attempts = 0

    do {
        config = randomTreeLSystem(seed)
        seed++
        attempts++

        // Проверяем тип дерева
        const isPine = config.leafType.includes('pine')
        const isBirch = config.leafType.includes('birch')
        const isOak = config.leafType.includes('oak')

        if (desiredType === 'pine' && isPine) break
        if (desiredType === 'birch' && isBirch) break
        if (desiredType === 'oak' && isOak) break

    } while (attempts < 100) // Максимум 100 попыток

    // Создаём дерево (код аналогичен примеру 1)
    const lsystem = new LSystem(config.axiom, config.rules, config.iterations)
    const lsystemString = lsystem.generate()

    const interpreter = new LSystemInterpreter(noa, x, y, z, {
        angle: config.angle,
        stepLength: config.step * config.scale,
        trunkBlock: blockIDs.wood,
        leavesBlock: config.leafType.includes('pine') ? blockIDs.pine_leaves : blockIDs.leaves
    })

    interpreter.interpret(lsystemString)
}

/**
 * ПРИМЕР 3: Генерация группы деревьев (роща)
 */
function example3_TreeGrove(noa, centerX, centerY, centerZ, radius = 5, count = 10) {
    for (let i = 0; i < count; i++) {
        // Случайная позиция в радиусе
        const angle = Math.random() * Math.PI * 2
        const dist = Math.random() * radius

        const x = Math.floor(centerX + Math.cos(angle) * dist)
        const z = Math.floor(centerZ + Math.sin(angle) * dist)

        // Находим поверхность
        let y = centerY
        while (y < 128 && noa.getBlock(x, y, z) === 0) y++
        while (y > 0 && noa.getBlock(x, y, z) !== 0) y--

        // Генерируем дерево
        if (noa.getBlock(x, y - 1, z) !== 0) { // Есть земля под ногами
            const seed = (x * 73856093) ^ (z * 19349663) ^ i
            const config = randomTreeLSystem(seed)

            const lsystem = new LSystem(config.axiom, config.rules, config.iterations)
            const lsystemString = lsystem.generate()

            const interpreter = new LSystemInterpreter(noa, x, y, z, {
                angle: config.angle,
                stepLength: config.step * config.scale,
                trunkBlock: blockIDs.wood,
                leavesBlock: config.leafType.includes('pine') ? blockIDs.pine_leaves : blockIDs.leaves
            })

            interpreter.interpret(lsystemString)
        }
    }
}

/**
 * ПРИМЕР 4: Кастомизация дерева (увеличение размера)
 */
function example4_GiantTree(noa, x, y, z) {
    const seed = (x * 73856093) ^ (z * 19349663)
    const config = randomTreeLSystem(seed)

    // Увеличиваем размер дерева
    config.scale *= 2.0  // Удвоенный размер
    config.iterations += 1  // Больше итераций = больше веток

    const lsystem = new LSystem(config.axiom, config.rules, config.iterations)
    const lsystemString = lsystem.generate()

    const interpreter = new LSystemInterpreter(noa, x, y, z, {
        angle: config.angle,
        stepLength: config.step * config.scale,
        trunkBlock: blockIDs.wood,
        leavesBlock: config.leafType.includes('pine') ? blockIDs.pine_leaves : blockIDs.leaves
    })

    interpreter.interpret(lsystemString)
}

/**
 * ПРИМЕР 5: Детерминированная генерация (одинаковые деревья)
 */
function example5_DeterministicTrees(noa) {
    const fixedSeed = 12345

    // Эти три дерева будут абсолютно идентичными
    const positions = [
        [100, 64, 100],
        [200, 64, 200],
        [300, 64, 300]
    ]

    positions.forEach(([x, y, z]) => {
        // Используем ОДИНАКОВЫЙ seed для всех
        const config = randomTreeLSystem(fixedSeed)

        const lsystem = new LSystem(config.axiom, config.rules, config.iterations)
        const lsystemString = lsystem.generate()

        const interpreter = new LSystemInterpreter(noa, x, y, z, {
            angle: config.angle,
            stepLength: config.step * config.scale,
            trunkBlock: blockIDs.wood,
            leavesBlock: config.leafType.includes('pine') ? blockIDs.pine_leaves : blockIDs.leaves
        })

        interpreter.interpret(lsystemString)
    })
}

/**
 * ПРИМЕР 6: Получение информации о дереве без генерации
 */
function example6_TreeInfo(x, z) {
    const seed = (x * 73856093) ^ (z * 19349663)
    const config = randomTreeLSystem(seed)

    // Получаем информацию о дереве
    console.log('Tree Information:')
    console.log('  Wood Type:', config.woodType)
    console.log('  Leaf Type:', config.leafType)
    console.log('  Height (approx):', config.iterations * config.step * config.scale)
    console.log('  Width (approx):', Math.tan(config.angle * Math.PI / 180) * config.iterations * config.step * 2)
    console.log('  Complexity:', config.iterations)

    // Можно использовать эту информацию для проверки
    // например, достаточно ли места для дерева

    return config
}

// Экспортируем примеры
export {
    example1_SimpleTree,
    example2_SpecificTreeType,
    example3_TreeGrove,
    example4_GiantTree,
    example5_DeterministicTrees,
    example6_TreeInfo
}
