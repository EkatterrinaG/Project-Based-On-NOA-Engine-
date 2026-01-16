/**
 * ПРОЦЕДУРНЫЙ ГЕНЕРАТОР ДЕРЕВЬЕВ (GROWTH TIP SYSTEM + CONE PINE)
 * 
 * ОБНОВЛЕНИЯ:
 * - Pine использует многоступенчатую систему (X0 -> X1 -> X2) для конической формы
 * - Динамический угол для хвойных
 */

export function randomTreeLSystem(seed, biomeType = null) {
    let rng = seed
    const random = () => {
        rng = (rng * 1103515245 + 12345) >>> 0
        return (rng % 100000) / 100000
    }

    const randInt = (min, max) => Math.floor(random() * (max - min + 1)) + min
    const choice = (arr) => arr[Math.floor(random() * arr.length)]

    // ====== АТОМЫ ======
    const TIPS = {
        branch: [
            '[+FL]', '[-FL]', '[+FFL]', '[-FFL]',
            '[++FL]', '[--FL]', '[+L]', '[-L]'
        ],
        top: ['L', 'FL', 'F[+L][-L]L']
    }

    const assembleXRule = (complexity, growUpProb) => {
        let rule = ''
        const numBranches = randInt(1, complexity)
        for (let i = 0; i < numBranches; i++) {
            rule += choice(TIPS.branch)
        }
        if (random() < growUpProb) {
            rule += 'FX'
        } else {
            rule += choice(TIPS.top)
        }
        return rule
    }

    // Определяем тип дерева на основе биома
    let treeType
    if (biomeType === 'SNOW') {
        // В снежном биоме только ели
        treeType = 'pine'
    } else if (biomeType === 'FOREST') {
        // В лесу только дуб (всегда)
        treeType = 'oak'
    } else {
        // Для остальных биомов используем старую логику
        const treeTypeIndex = seed % 3
        const treeTypes = ['oak', 'pine']
        treeType = treeTypes[treeTypeIndex]
    }

    let axiom = 'FFFFX'
    let rules = {}
    let angle, iterations, step, scale, branchProb, leafType, woodType

    switch (treeType) {
        case 'oak': {
            const oakRulesX = []
            oakRulesX.push(assembleXRule(3, 0.5))
            oakRulesX.push('[+FL][-FL]FX')

            rules = {
                F: ['F'],
                X: oakRulesX
            }

            angle = 25 + (seed % 6)
            iterations = 2
            step = 1.0
            scale = 1.0
            branchProb = 0.8
            leafType = 'oak_leaves'
            woodType = 'oak_log'
            break
        }

        case 'pine': {
            // Ель генерируется аналогично дубу через систему роста X
            const pineRulesX = []

            // Создаём правила для ели: короткие ветки с листвой
            pineRulesX.push(assembleXRule(2, 0.6))  // Компактная ель
            pineRulesX.push('[+L][-L]FX')           // Простая ярусная структура
            pineRulesX.push('[+FL][-FL]FX')         // Ель с короткими ветками

            rules = {
                F: ['F'],
                X: pineRulesX
            }

            // Высокий ствол для ели (6-8 блоков)
            const trunkHeight = 6 + (seed % 3)
            axiom = 'F'.repeat(trunkHeight) + 'X'

            angle = 25 + (seed % 8)  // 25-32 градуса
            iterations = 2
            step = 1.0
            scale = 1.0
            branchProb = 0.9
            leafType = 'pine_leaves'
            woodType = 'log'
            break
        }
    }

    return {
        axiom,
        rules,
        angle,
        step,
        iterations,
        branchProb,
        leafType,
        woodType,
        scale
    }
}

// @ts-ignore
if (typeof window !== 'undefined' && window.__TREE_LSYSTEM_TEST__) {
    const exampleSystem = randomTreeLSystem(123)
    console.log('Tree L-system:', JSON.stringify(exampleSystem, null, 2))
}

export default {
    randomTreeLSystem
}
