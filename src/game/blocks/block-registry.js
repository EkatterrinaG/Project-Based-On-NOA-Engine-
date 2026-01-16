/**
 * Реестр блоков
 * Регистрация всех типов блоков и их материалов
 */

import { noa } from '../engine.js'
import { TextureGenerator } from '../textures/texture-generator.js'
import { Texture, Matrix, Mesh, CreatePlane } from '@babylonjs/core'
import craftingTableTopUrl from '../textures/crafting_table_top.png'
import craftingTableFrontUrl from '../textures/default_crafting_top.png'
import craftingTableSideUrl from '../textures/default_crafting_side.png'
import furnaceTopUrl from '../textures/default_furnace_top.png'
import furnaceBottomUrl from '../textures/default_furnace_bottom.png'
import furnaceSideUrl from '../textures/default_furnace_side.png'
import furnaceFrontUrl from '../textures/default_furnace_front.png'
import furnaceFrontActiveUrl from '../textures/default_furnace_front_active.png'

// Текстуры для досок (планок)
import oakPlanksUrl from '../textures/default_wood_birch_stack.png'
import darkOakPlanksUrl from '../textures/default_wood_stack.png'
import glassUrl from '../textures/doors_glass_b.png'

// Объект для хранения ID блоков
export const blockIDs = {}

// Массив ID цветков (будет заполнен при регистрации)
export const flowerIDs = []

// Объект для маппинга blockID -> itemName (для поиска свойств блока)
export const blockIDToItemName = {}

/**
 * Регистрация блоков
 */
export function registerBlocks() {
    console.log('🧱 Registering blocks...')

    const registry = noa.registry
    let id = 1

    // Генератор процедурных текстур
    const textureGen = new TextureGenerator()

    // --- Материалы ---

    // Общие
    registry.registerMaterial('bedrock', { color: [0.1, 0.1, 0.1] })

    // Камень с процедурной текстурой - ОДИН вертикальный atlas
    console.log('🎨 Generating stone texture atlas...')

    const stoneVariationCount = 64 // Количество вариаций
    const textureSize = 64 // Размер одной текстуры

    // Генерируем ОДИН вертикальный atlas (32x2048 для 64 текстур)
    const stoneAtlas = textureGen.generateStoneAtlas(stoneVariationCount, textureSize)
    const stoneAtlasURL = stoneAtlas.toDataURL('image/png')

    console.log(`📦 Generated vertical atlas: ${stoneAtlas.width}x${stoneAtlas.height} (${stoneVariationCount} textures)`)

    // Регистрируем материалы - все используют ОДИН atlas с разными atlasIndex
    for (let i = 0; i < stoneVariationCount; i++) {
        registry.registerMaterial(`stone_var${i}`, {
            textureURL: stoneAtlasURL, // ОДИН atlas для всех
            atlasIndex: i             // Разные индексы
        })
    }

    // Основной материал
    registry.registerMaterial('stone', {
        textureURL: stoneAtlasURL,
        atlasIndex: 0
    })

    console.log(`✅ Registered ${stoneVariationCount} stone materials using ONE atlas`)

    // Земля с процедурной текстурой - ОДИН вертикальный atlas
    console.log('🎨 Generating dirt texture atlas...')

    const dirtVariationCount = 64 // Количество вариаций земли
    const dirtAtlas = textureGen.generateDirtAtlas(dirtVariationCount, textureSize)
    const dirtAtlasURL = dirtAtlas.toDataURL('image/png')

    console.log(`📦 Generated dirt atlas: ${dirtAtlas.width}x${dirtAtlas.height} (${dirtVariationCount} textures)`)

    // Регистрируем материалы земли - все используют ОДИН atlas с разными atlasIndex
    for (let i = 0; i < dirtVariationCount; i++) {
        registry.registerMaterial(`dirt_var${i}`, {
            textureURL: dirtAtlasURL,
            atlasIndex: i
        })
    }

    // Основной материал земли
    registry.registerMaterial('dirt', {
        textureURL: dirtAtlasURL,
        atlasIndex: 0
    })

    console.log(`✅ Registered ${dirtVariationCount} dirt materials using ONE atlas`)

    // Трава с процедурной текстурой - ДВА вертикальных атласа (верх и бок)
    console.log('🎨 Generating grass texture atlases...')

    const grassVariationCount = 64 // Количество вариаций травы
    const grassTopAtlas = textureGen.generateGrassTopAtlas(grassVariationCount, textureSize)
    const grassTopAtlasURL = grassTopAtlas.toDataURL('image/png')

    const grassSideAtlas = textureGen.generateGrassSideAtlas(grassVariationCount, textureSize)
    const grassSideAtlasURL = grassSideAtlas.toDataURL('image/png')

    console.log(`📦 Generated grass top atlas: ${grassTopAtlas.width}x${grassTopAtlas.height}`)
    console.log(`📦 Generated grass side atlas: ${grassSideAtlas.width}x${grassSideAtlas.height}`)

    // Регистрируем материалы для верха травы
    for (let i = 0; i < grassVariationCount; i++) {
        registry.registerMaterial(`grass_top_var${i}`, {
            textureURL: grassTopAtlasURL,
            atlasIndex: i
        })
    }

    // Регистрируем материалы для боковых сторон травы
    for (let i = 0; i < grassVariationCount; i++) {
        registry.registerMaterial(`grass_side_var${i}`, {
            textureURL: grassSideAtlasURL,
            atlasIndex: i
        })
    }

    // Основные материалы
    registry.registerMaterial('grass_top', {
        textureURL: grassTopAtlasURL,
        atlasIndex: 0
    })

    registry.registerMaterial('grass_side', {
        textureURL: grassSideAtlasURL,
        atlasIndex: 0
    })

    console.log(`✅ Registered ${grassVariationCount} grass materials using TWO atlases`)

    // Песок с процедурной текстурой - ОДИН вертикальный atlas
    console.log('🎨 Generating sand texture atlas...')

    const sandVariationCount = 64 // Количество вариаций песка
    const sandAtlas = textureGen.generateSandAtlas(sandVariationCount, textureSize)
    const sandAtlasURL = sandAtlas.toDataURL('image/png')

    console.log(`📦 Generated sand atlas: ${sandAtlas.width}x${sandAtlas.height} (${sandVariationCount} textures)`)

    // Регистрируем материалы песка - все используют ОДИН atlas с разными atlasIndex
    for (let i = 0; i < sandVariationCount; i++) {
        registry.registerMaterial(`sand_var${i}`, {
            textureURL: sandAtlasURL,
            atlasIndex: i
        })
    }

    // Основной материал песка
    registry.registerMaterial('sand', {
        textureURL: sandAtlasURL,
        atlasIndex: 0
    })

    console.log(`✅ Registered ${sandVariationCount} sand materials using ONE atlas`)

    // Песчаник с процедурной текстурой - ОДИН вертикальный atlas
    console.log('🎨 Generating sandstone texture atlas...')

    const sandstoneVariationCount = 64 // Количество вариаций песчаника
    const sandstoneAtlas = textureGen.generateSandstoneAtlas(sandstoneVariationCount, textureSize)
    const sandstoneAtlasURL = sandstoneAtlas.toDataURL('image/png')

    console.log(`📦 Generated sandstone atlas: ${sandstoneAtlas.width}x${sandstoneAtlas.height} (${sandstoneVariationCount} textures)`)

    // Регистрируем материалы песчаника
    for (let i = 0; i < sandstoneVariationCount; i++) {
        registry.registerMaterial(`sandstone_var${i}`, {
            textureURL: sandstoneAtlasURL,
            atlasIndex: i
        })
    }

    // Основной материал песчаника
    registry.registerMaterial('sandstone', {
        textureURL: sandstoneAtlasURL,
        atlasIndex: 0
    })

    console.log(`✅ Registered ${sandstoneVariationCount} sandstone materials using ONE atlas`)

    // Снег с процедурной текстурой - ДВА вертикальных атласа (верх и бок)
    console.log('🎨 Generating snow texture atlases...')

    const snowVariationCount = 64 // Количество вариаций снега
    const snowTopAtlas = textureGen.generateSnowTopAtlas(snowVariationCount, textureSize)
    const snowTopAtlasURL = snowTopAtlas.toDataURL('image/png')

    const snowSideAtlas = textureGen.generateSnowSideAtlas(snowVariationCount, textureSize)
    const snowSideAtlasURL = snowSideAtlas.toDataURL('image/png')

    console.log(`📦 Generated snow top atlas: ${snowTopAtlas.width}x${snowTopAtlas.height}`)
    console.log(`📦 Generated snow side atlas: ${snowSideAtlas.width}x${snowSideAtlas.height}`)

    // Регистрируем материалы для верха снега
    for (let i = 0; i < snowVariationCount; i++) {
        registry.registerMaterial(`snow_top_var${i}`, {
            textureURL: snowTopAtlasURL,
            atlasIndex: i
        })
    }

    // Регистрируем материалы для боковых сторон снега
    for (let i = 0; i < snowVariationCount; i++) {
        registry.registerMaterial(`snow_side_var${i}`, {
            textureURL: snowSideAtlasURL,
            atlasIndex: i
        })
    }

    // Основные материалы
    registry.registerMaterial('snow_top', {
        textureURL: snowTopAtlasURL,
        atlasIndex: 0
    })

    registry.registerMaterial('snow_side', {
        textureURL: snowSideAtlasURL,
        atlasIndex: 0
    })

    console.log(`✅ Registered ${snowVariationCount} snow materials using TWO atlases`)
    registry.registerMaterial('water', { color: [0.2, 0.4, 0.8, 0.6] }) // Прозрачный

    // Снежный
    registry.registerMaterial('ice', { color: [0.6, 0.8, 1.0, 0.8] }) // Прозрачный

    // Поле
    registry.registerMaterial('field_grass', { color: [0.5, 0.6, 0.2] }) // Более желтая трава

    // Руды с процедурными текстурами (камень + цветные вкрапления)
    console.log('🎨 Generating ore texture atlases...')

    const oreVariationCount = 64 // Количество вариаций каждой руды
    const oreTypes = ['coal_ore', 'iron_ore', 'gold_ore', 'diamond_ore']

    const oreAtlases = {}
    oreTypes.forEach(oreType => {
        const oreAtlas = textureGen.generateOreAtlas(oreType, oreVariationCount, textureSize)
        const oreAtlasURL = oreAtlas.toDataURL('image/png')
        oreAtlases[oreType] = oreAtlasURL

        console.log(`📦 Generated ${oreType} atlas: ${oreAtlas.width}x${oreAtlas.height}`)

        // Регистрируем материалы для каждой вариации руды
        for (let i = 0; i < oreVariationCount; i++) {
            registry.registerMaterial(`${oreType}_var${i}`, {
                textureURL: oreAtlasURL,
                atlasIndex: i
            })
        }

        // Основной материал руды
        registry.registerMaterial(oreType, {
            textureURL: oreAtlasURL,
            atlasIndex: 0
        })
    })

    console.log(`✅ Registered ore materials with procedural textures`)

    // Генерация атласов текстур дерева (64 вариации)
    const woodVariationCount = 64

    // Боковая текстура дуба (светлая кора с кольцами)
    const oakWoodAtlas = textureGen.generateOakWoodAtlas(woodVariationCount, textureSize)
    const oakWoodAtlasURL = oakWoodAtlas.toDataURL('image/png')

    // Боковая текстура ели (тёмная кора с кольцами)
    const pineWoodAtlas = textureGen.generatePineWoodAtlas(woodVariationCount, textureSize)
    const pineWoodAtlasURL = pineWoodAtlas.toDataURL('image/png')

    // Светлая текстура торцов (для дуба в лесу)
    const oakTopAtlas = textureGen.generateLightWoodTopAtlas(woodVariationCount, textureSize)
    const oakTopAtlasURL = oakTopAtlas.toDataURL('image/png')

    // Тёмная текстура торцов (для ели в снежном биоме)
    const pineTopAtlas = textureGen.generateWoodTopAtlas(woodVariationCount, textureSize)
    const pineTopAtlasURL = pineTopAtlas.toDataURL('image/png')

    // Регистрируем материалы для светлого дерева (дуб)
    for (let i = 0; i < woodVariationCount; i++) {
        registry.registerMaterial(`oak_side_var${i}`, {
            textureURL: oakWoodAtlasURL,  // Светлая кора
            atlasIndex: i
        })
        registry.registerMaterial(`oak_top_var${i}`, {
            textureURL: oakTopAtlasURL,  // Светлая текстура торцов
            atlasIndex: i
        })
    }

    // Регистрируем материалы для тёмного дерева (ель)
    for (let i = 0; i < woodVariationCount; i++) {
        registry.registerMaterial(`pine_side_var${i}`, {
            textureURL: pineWoodAtlasURL,  // Тёмная кора
            atlasIndex: i
        })
        registry.registerMaterial(`pine_top_var${i}`, {
            textureURL: pineTopAtlasURL,  // Тёмная текстура торцов
            atlasIndex: i
        })
    }

    console.log(`✅ Registered ${woodVariationCount} oak and pine wood texture variations`)

    // Генерация атласов текстур листвы (64 вариации)
    const leavesVariationCount = 64

    // Обычная листва (дуб, береза)
    const leavesAtlas = textureGen.generateLeavesAtlas('leaves', leavesVariationCount, textureSize)
    const leavesAtlasURL = leavesAtlas.toDataURL('image/png')

    for (let i = 0; i < leavesVariationCount; i++) {
        registry.registerMaterial(`leaves_var${i}`, {
            textureURL: leavesAtlasURL,
            atlasIndex: i
        })
    }

    // Хвоя ели
    const pineLeavesAtlas = textureGen.generateLeavesAtlas('pine_leaves', leavesVariationCount, textureSize)
    const pineLeavesAtlasURL = pineLeavesAtlas.toDataURL('image/png')

    for (let i = 0; i < leavesVariationCount; i++) {
        registry.registerMaterial(`pine_leaves_var${i}`, {
            textureURL: pineLeavesAtlasURL,
            atlasIndex: i
        })
    }

    console.log(`✅ Registered ${leavesVariationCount} leaves texture variations`)

    // Структуры
    registry.registerMaterial('cactus', { color: [0.2, 0.7, 0.2] })          // Кактус

    // Цветы разных цветов (6 вариантов)
    registry.registerMaterial('flower_red', { color: [0.9, 0.2, 0.2] })      // Красный
    registry.registerMaterial('flower_yellow', { color: [0.95, 0.9, 0.2] })  // Желтый
    registry.registerMaterial('flower_blue', { color: [0.2, 0.4, 0.9] })     // Синий
    registry.registerMaterial('flower_pink', { color: [0.95, 0.5, 0.7] })    // Розовый
    registry.registerMaterial('flower_orange', { color: [0.95, 0.6, 0.2] })  // Оранжевый
    registry.registerMaterial('flower_purple', { color: [0.7, 0.3, 0.9] })   // Фиолетовый

    // Печка - материалы с текстурами
    registry.registerMaterial('furnace_top', {
        textureURL: furnaceTopUrl
    })
    registry.registerMaterial('furnace_bottom', {
        textureURL: furnaceBottomUrl
    })
    registry.registerMaterial('furnace_side', {
        textureURL: furnaceSideUrl
    })
    registry.registerMaterial('furnace_front', {
        textureURL: furnaceFrontUrl
    })
    registry.registerMaterial('furnace_front_active', {
        textureURL: furnaceFrontActiveUrl
    })

    // Верстак - три разные текстуры (верх, фронт, бока)
    registry.registerMaterial('crafting_table_top', {
        textureURL: craftingTableTopUrl
    })
    registry.registerMaterial('crafting_table_front', {
        textureURL: craftingTableFrontUrl
    })
    registry.registerMaterial('crafting_table_side', {
        textureURL: craftingTableSideUrl
    })

    // Доски (Planks) - текстуры из PNG файлов
    registry.registerMaterial('oak_planks', {
        textureURL: oakPlanksUrl
    })
    registry.registerMaterial('dark_oak_planks', {
        textureURL: darkOakPlanksUrl
    })

    // --- Блоки ---

    // 1. Бедрок (неразрушимый)
    blockIDs.bedrock = registry.registerBlock(id++, {
        material: 'bedrock'
    })

    // 2. Камень - регистрируем множество вариаций с разными текстурами
    blockIDs.stone = []
    for (let i = 0; i < stoneVariationCount; i++) {
        const stoneID = registry.registerBlock(id++, {
            material: `stone_var${i}`
        })
        blockIDs.stone.push(stoneID)
        blockIDToItemName[stoneID] = 'stone'
    }
    // Для обратной совместимости, blockIDs.stone[0] - это основной камень
    blockIDs.stoneBase = blockIDs.stone[0]

    // 3. Земля - регистрируем множество вариаций с разными текстурами
    blockIDs.dirt = []
    for (let i = 0; i < dirtVariationCount; i++) {
        const dirtID = registry.registerBlock(id++, {
            material: `dirt_var${i}`
        })
        blockIDs.dirt.push(dirtID)
        blockIDToItemName[dirtID] = 'dirt'
    }
    // Для обратной совместимости
    blockIDs.dirtBase = blockIDs.dirt[0]

    // 4. Трава (Лес) - регистрируем множество вариаций с разными текстурами
    // Формат: [Top, Bottom, Sides] - верх зелёный, низ земля, бока переходные
    blockIDs.grass = []
    for (let i = 0; i < grassVariationCount; i++) {
        const grassID = registry.registerBlock(id++, {
            material: [
                `grass_top_var${i}`,   // Верх - зелёная текстура
                `dirt_var${i}`,        // Низ - текстура земли
                `grass_side_var${i}`   // Бока - переходная текстура
            ]
        })
        blockIDs.grass.push(grassID)
        blockIDToItemName[grassID] = 'grass'
    }
    // Для обратной совместимости
    blockIDs.grassBase = blockIDs.grass[0]

    // 5. Песок - регистрируем множество вариаций с разными текстурами
    blockIDs.sand = []
    for (let i = 0; i < sandVariationCount; i++) {
        const sandID = registry.registerBlock(id++, {
            material: `sand_var${i}`
        })
        blockIDs.sand.push(sandID)
        blockIDToItemName[sandID] = 'sand'
    }
    // Для обратной совместимости
    blockIDs.sandBase = blockIDs.sand[0]

    // 6. Песчаник - регистрируем множество вариаций с разными текстурами
    blockIDs.sandstone = []
    for (let i = 0; i < sandstoneVariationCount; i++) {
        const sandstoneID = registry.registerBlock(id++, {
            material: `sandstone_var${i}`
        })
        blockIDs.sandstone.push(sandstoneID)
        blockIDToItemName[sandstoneID] = 'sandstone'
    }
    // Для обратной совместимости
    blockIDs.sandstoneBase = blockIDs.sandstone[0]

    // 7. Снег - регистрируем множество вариаций с разными текстурами
    // Формат: [Top, Bottom, Sides] - верх белый, низ земля, бока переходные
    blockIDs.snow = []
    for (let i = 0; i < snowVariationCount; i++) {
        const snowID = registry.registerBlock(id++, {
            material: [
                `snow_top_var${i}`,   // Верх - белая текстура
                `dirt_var${i}`,        // Низ - текстура земли
                `snow_side_var${i}`   // Бока - переходная текстура
            ]
        })
        blockIDs.snow.push(snowID)
        blockIDToItemName[snowID] = 'snow'
    }
    // Для обратной совместимости
    blockIDs.snowBase = blockIDs.snow[0]

    // 8. Лёд
    blockIDs.ice = registry.registerBlock(id++, {
        material: 'ice',
        opaque: false // Прозрачный
    })

    // 9. Степная трава (Поле)
    blockIDs.field_grass = registry.registerBlock(id++, {
        material: ['field_grass', 'dirt', 'grass_side']
    })

    // 10. Вода
    blockIDs.water = registry.registerBlock(id++, {
        material: 'water',
        fluid: true,
        opaque: false
    })

    // --- Руды ---

    // 11. Угольная руда - регистрируем множество вариаций
    blockIDs.coal_ore = []
    for (let i = 0; i < oreVariationCount; i++) {
        const coalID = registry.registerBlock(id++, {
            material: `coal_ore_var${i}`
        })
        blockIDs.coal_ore.push(coalID)
        blockIDToItemName[coalID] = 'coal_ore'
    }
    blockIDs.coal_oreBase = blockIDs.coal_ore[0]

    // 12. Железная руда - регистрируем множество вариаций
    blockIDs.iron_ore = []
    for (let i = 0; i < oreVariationCount; i++) {
        const ironID = registry.registerBlock(id++, {
            material: `iron_ore_var${i}`
        })
        blockIDs.iron_ore.push(ironID)
        blockIDToItemName[ironID] = 'iron_ore'
    }
    blockIDs.iron_oreBase = blockIDs.iron_ore[0]

    // 13. Золотая руда - регистрируем множество вариаций
    blockIDs.gold_ore = []
    for (let i = 0; i < oreVariationCount; i++) {
        const goldID = registry.registerBlock(id++, {
            material: `gold_ore_var${i}`
        })
        blockIDs.gold_ore.push(goldID)
        blockIDToItemName[goldID] = 'gold_ore'
    }
    blockIDs.gold_oreBase = blockIDs.gold_ore[0]

    // 14. Алмазная руда - регистрируем множество вариаций
    blockIDs.diamond_ore = []
    for (let i = 0; i < oreVariationCount; i++) {
        const diamondID = registry.registerBlock(id++, {
            material: `diamond_ore_var${i}`
        })
        blockIDs.diamond_ore.push(diamondID)
        blockIDToItemName[diamondID] = 'diamond_ore'
    }
    blockIDs.diamond_oreBase = blockIDs.diamond_ore[0]

    // --- Структуры ---

    // 15. Древесина дуба (для леса) - 64 вариации со светлой текстурой
    blockIDs.oak_wood = []
    for (let i = 0; i < woodVariationCount; i++) {
        const oakID = registry.registerBlock(id++, {
            material: [
                `oak_top_var${i}`,  // [0] - светлая (верх)
                `oak_top_var${i}`,  // [1] - светлая (низ)
                `oak_side_var${i}`, // [2] - кора (бок)
                `oak_side_var${i}`, // [3] - кора (бок)
                `oak_top_var${i}`, // [4] - кора (бок)
                `oak_top_var${i}`  // [5] - кора (бок)
            ]
        })
        blockIDs.oak_wood.push(oakID)
        blockIDToItemName[oakID] = 'oak'
    }
    blockIDs.oak_woodBase = blockIDs.oak_wood[0]

    // 15b. Древесина ели (для снежного биома) - 64 вариации с тёмной текстурой
    blockIDs.pine_wood = []
    for (let i = 0; i < woodVariationCount; i++) {
        const pineID = registry.registerBlock(id++, {
            material: [
                `pine_top_var${i}`,  // [0] - тёмная (верх)
                `pine_top_var${i}`,  // [1] - тёмная (низ)
                `pine_side_var${i}`, // [2] - кора (бок)
                `pine_side_var${i}`, // [3] - кора (бок)
                `pine_top_var${i}`, // [4] - кора (бок)
                `pine_top_var${i}`  // [5] - кора (бок)
            ]
        })
        blockIDs.pine_wood.push(pineID)
        blockIDToItemName[pineID] = 'dark_oak'
    }
    blockIDs.pine_woodBase = blockIDs.pine_wood[0]

    // Алиас для совместимости (используется в инвентаре)
    blockIDs.wood = blockIDs.oak_wood
    blockIDs.woodBase = blockIDs.oak_woodBase

    // 16. Листья (обычные) - 64 вариации
    blockIDs.leaves = []
    for (let i = 0; i < leavesVariationCount; i++) {
        const leavesID = registry.registerBlock(id++, {
            material: `leaves_var${i}`,
            opaque: false  // Полупрозрачные
        })
        blockIDs.leaves.push(leavesID)
        blockIDToItemName[leavesID] = 'leaves'
    }
    blockIDs.leavesBase = blockIDs.leaves[0]  // Базовый ID

    // 17. Хвоя ели (темно-зеленая) - 64 вариации
    blockIDs.pine_leaves = []
    for (let i = 0; i < leavesVariationCount; i++) {
        const pineLeavesID = registry.registerBlock(id++, {
            material: `pine_leaves_var${i}`,
            opaque: false  // Полупрозрачные
        })
        blockIDs.pine_leaves.push(pineLeavesID)
    }
    blockIDs.pine_leavesBase = blockIDs.pine_leaves[0]  // Базовый ID

    // 18. Кактус
    blockIDs.cactus = registry.registerBlock(id++, {
        material: 'cactus'
    })
    blockIDToItemName[blockIDs.cactus] = 'cactus'

    // 19. Стебель цветка (тонкий crossed quad - не полный куб)
    const scene = noa.rendering.getScene()

    // Создаем тонкий стебель как crossed quads
    const createStemMesh = () => {
        const stemMat = noa.rendering.makeStandardMaterial('flower_stem_mat')
        stemMat.diffuseColor.set(0.2, 0.5, 0.15)
        stemMat.emissiveColor.set(0.1, 0.2, 0.05)

        // Тонкий вертикальный плейн для стебля
        const plane = CreatePlane('flower_stem_plane', {
            width: 0.15,
            height: 1.0,
            sideOrientation: Mesh.DOUBLESIDE
        }, scene)
        plane.material = stemMat

        plane.rotation.y = Math.PI / 4
        plane.bakeTransformIntoVertices(Matrix.Translation(0, 0.5, 0))

        const clone = plane.clone()
        clone.rotation.y += Math.PI / 2

        return Mesh.MergeMeshes([plane, clone], true)
    }

    const stemMesh = createStemMesh()
    blockIDs.flower_stem = registry.registerBlock(id++, {
        blockMesh: stemMesh,
        opaque: false,
        solid: false
    })

    // 20-25. Короны цветов (6 разных цветов) - crossed quads для L-System
    const flowerColors = ['red', 'yellow', 'blue', 'pink', 'orange', 'purple']

    /**
     * Создает 3D модель короны цветка: crossed quads с процедурной текстурой лепестков
     * @param {string} color - Цвет цветка
     * @returns {Mesh} Babylon.js меш
     */
    const createFlowerCrownMesh = (color) => {
        // Генерируем процедурную текстуру только лепестков (без стебля)
        const flowerTextureURL = textureGen.generateFlowerCrownTextureURL(color, Math.floor(Math.random() * 1000), 32)

        // Создаем материал для короны
        const flowerMat = noa.rendering.makeStandardMaterial(`flower_crown_${color}_mat`)
        flowerMat.diffuseTexture = new Texture(flowerTextureURL, scene)
        flowerMat.diffuseTexture.hasAlpha = true
        flowerMat.emissiveColor.set(0.2, 0.2, 0.2)

        // Создаем crossed quads (размер 0.7 блока)
        const plane = CreatePlane(`flower_crown_${color}_plane`, {
            size: 0.7,
            sideOrientation: Mesh.DOUBLESIDE
        }, scene)
        plane.material = flowerMat

        plane.rotation.y = Math.PI / 4
        plane.bakeTransformIntoVertices(Matrix.Translation(0, 0.5, 0))

        const clone = plane.clone()
        clone.rotation.y += Math.PI / 2

        const combinedMesh = Mesh.MergeMeshes([plane, clone], true)
        return combinedMesh
    }

    // Регистрируем короны цветов
    console.log('🌸 Creating flower crown meshes...')
    flowerColors.forEach(color => {
        try {
            const crownMesh = createFlowerCrownMesh(color)

            const flowerId = registry.registerBlock(id++, {
                blockMesh: crownMesh,
                opaque: false,
                solid: false,
                onCustomMeshCreate: (mesh, x, y, z) => {
                    mesh.rotation.y = ((x * 73856093) ^ (z * 19349663)) % 628 / 100
                }
            })
            flowerIDs.push(flowerId)
            blockIDs[`flower_${color}`] = flowerId
            console.log(`  ✅ flower_${color} crown registered with ID: ${flowerId}`)
        } catch (err) {
            console.error(`  ❌ Error creating flower_${color}:`, err)
        }
    })
    console.log(`🌸 Total flower crowns registered: ${flowerIDs.length}`)

    // 25. Печка (выключенная) - разные текстуры для разных сторон
    // Формат массива: [top, bottom, front, back, left, right]
    blockIDs.furnace = registry.registerBlock(id++, {
        material: [
            'furnace_side',          // [0] верх
            'furnace_side',       // [1] низ
            'furnace_top',        // [2] фронт (НЕ активная)
            'furnace_bottom',         // [3] зад
            'furnace_side',         // [4] лево
            'furnace_front'          // [5] право
        ]
    })

    // 26. Печка (горящая/активная) - фронт меняется на активную текстуру
    blockIDs.furnace_lit = registry.registerBlock(id++, {
        material: [
            'furnace_side',          // [0] верх
            'furnace_side',       // [1] низ
            'furnace_top', // [2] фронт (АКТИВНАЯ - с огнём)
            'furnace_bottom',         // [3] зад
            'furnace_side',         // [4] лево
            'furnace_front_active'          // [5] право
        ]
    })
    blockIDToItemName[blockIDs.furnace] = 'furnace'
    blockIDToItemName[blockIDs.furnace_lit] = 'furnace'

    // 27. Верстак - разные текстуры для разных сторон
    // Формат массива: [top, bottom, front, back, left, right]
    blockIDs.crafting_table = registry.registerBlock(id++, {
        material: [
            'crafting_table_side',
            'crafting_table_side',
            'crafting_table_front',
            'crafting_table_top',
            'crafting_table_side',
            'crafting_table_side'
        ]
    })
    blockIDToItemName[blockIDs.crafting_table] = 'crafting_table'

    // 28. Дубовые доски (Oak Planks) - светлые доски
    blockIDs.oak_planks = registry.registerBlock(id++, {
        material: 'oak_planks'
    })
    blockIDToItemName[blockIDs.oak_planks] = 'oak_planks'

    // 29. Тёмные дубовые доски (Dark Oak Planks) - тёмные доски
    blockIDs.dark_oak_planks = registry.registerBlock(id++, {
        material: 'dark_oak_planks'
    })
    blockIDToItemName[blockIDs.dark_oak_planks] = 'dark_oak_planks'

    // Стекло
    registry.registerMaterial('glass', {
        textureURL: glassUrl
    })
    blockIDs.glass = registry.registerBlock(id++, {
        material: 'glass',
        opaque: false // Прозрачный
    })
    blockIDToItemName[blockIDs.glass] = 'glass'

    console.log(`✅ Registered ${id - 1} blocks`)
    console.log(`🌸 ${flowerIDs.length} flower variants`)

    return blockIDs
}

export default {
    blockIDs,
    flowerIDs,
    registerBlocks
}
