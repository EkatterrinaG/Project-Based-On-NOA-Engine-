/**
 * Генератор 3D иконок для предметов
 * Создает canvas с 3D отрисовкой блока
 */

import { TextureGenerator } from '../textures/texture-generator.js'

// ==================== ТЕКСТУРЫ ВЕРСТАКА ====================
import craftingTableTopUrl from '../textures/crafting_table_top.png'
import craftingTableFrontUrl from '../textures/default_crafting_top.png'
import craftingTableSideUrl from '../textures/default_crafting_side.png'

// ==================== ТЕКСТУРЫ ПЕЧКИ ====================
import furnaceTopUrl from '../textures/default_furnace_top.png'
import furnaceSideUrl from '../textures/default_furnace_side.png'
import furnaceFrontUrl from '../textures/default_furnace_front.png'

// ==================== ТЕКСТУРЫ СЛИТКОВ И РЕСУРСОВ ====================
import ironIngotUrl from '../textures/default_steel_ingot.png'
import goldIngotUrl from '../textures/default_gold_ingot.png'
import diamondUrl from '../textures/default_diamond.png'
import coalUrl from '../textures/default_charcoal_lump.png'

// ==================== ТЕКСТУРЫ ДОСОК ====================
import oakPlanksUrl from '../textures/default_wood_birch_stack.png'
import darkOakPlanksUrl from '../textures/default_wood_stack.png'

// ==================== ТЕКСТУРЫ ПАЛКИ ====================
import stickUrl from '../textures/default_stick.png'

// ==================== ТЕКСТУРА СТЕКЛА ====================
import glassUrl from '../textures/doors_glass_b.png'
import amuletUrl from '../textures/minecraft_amulet.png'

// ==================== ТЕКСТУРЫ ИНСТРУМЕНТОВ ====================
// Деревянные
import woodPickUrl from '../textures/default_tool_woodpick.png'
import woodAxeUrl from '../textures/default_tool_woodaxe.png'
import woodShovelUrl from '../textures/default_tool_woodshovel.png'
import woodSwordUrl from '../textures/default_tool_woodsword.png'

// Каменные
import stonePickUrl from '../textures/default_tool_stonepick.png'
import stoneAxeUrl from '../textures/default_tool_stoneaxe.png'
import stoneShovelUrl from '../textures/default_tool_stoneshovel.png'
import stoneSwordUrl from '../textures/default_tool_stonesword.png'

// Железные (steel в текстурах = iron в игре)
import ironPickUrl from '../textures/default_tool_steelpick.png'
import ironAxeUrl from '../textures/default_tool_steelaxe.png'
import ironShovelUrl from '../textures/default_tool_steelshovel.png'
import ironSwordUrl from '../textures/default_tool_steelsword.png'

// Золотые
import goldPickUrl from '../textures/default_tool_goldpick.png'
import goldAxeUrl from '../textures/default_tool_goldaxe.png'
import goldShovelUrl from '../textures/default_tool_goldshovel.png'
import goldSwordUrl from '../textures/default_tool_goldsword.png'

// Алмазные
import diamondPickUrl from '../textures/default_tool_diamondpick.png'
import diamondAxeUrl from '../textures/default_tool_diamondaxe.png'
import diamondShovelUrl from '../textures/default_tool_diamondshovel.png'
import diamondSwordUrl from '../textures/default_tool_diamondsword.png'

// Кэш загруженных изображений
const textureCache = {}

// Генератор текстур для руд
const textureGenerator = new TextureGenerator()

// ==================== МАППИНГ ТЕКСТУР ДЛЯ ВЕРСТАКА ====================
const CRAFTING_TABLE_TEXTURES = {
    'crafting_table_top': craftingTableTopUrl,
    'crafting_table_front': craftingTableFrontUrl,
    'crafting_table_side': craftingTableSideUrl
}

// ==================== МАППИНГ ТЕКСТУР ДЛЯ ПЕЧКИ ====================
const FURNACE_TEXTURES = {
    'furnace_top': furnaceTopUrl,
    'furnace_side': furnaceSideUrl,
    'furnace_front': furnaceFrontUrl
}

// ==================== МАППИНГ ТЕКСТУР ДЛЯ СТЕКЛА ====================
const GLASS_TEXTURES = {
    'glass': glassUrl
}

// ==================== МАППИНГ ТЕКСТУР ДЛЯ АМУЛЕТА ====================
const AMULET_TEXTURES = {
    'runic_amulet': amuletUrl
}

// ==================== МАППИНГ ТЕКСТУР ДЛЯ СЛИТКОВ И РЕСУРСОВ ====================
const INGOT_TEXTURES = {
    'iron_ingot': ironIngotUrl,
    'gold_ingot': goldIngotUrl,
    'diamond': diamondUrl,
    'coal': coalUrl
}

// ==================== МАППИНГ ТЕКСТУР ДЛЯ ДОСОК ====================
const PLANKS_TEXTURES = {
    'oak_planks': oakPlanksUrl,
    'dark_oak_planks': darkOakPlanksUrl
}

// ==================== МАППИНГ ТЕКСТУР ДЛЯ ИНСТРУМЕНТОВ ====================
const TOOL_TEXTURES = {
    // Палка
    'stick': stickUrl,

    // Деревянные инструменты
    'wooden_pickaxe': woodPickUrl,
    'wooden_axe': woodAxeUrl,
    'wooden_shovel': woodShovelUrl,
    'wooden_sword': woodSwordUrl,

    // Каменные инструменты
    'stone_pickaxe': stonePickUrl,
    'stone_axe': stoneAxeUrl,
    'stone_shovel': stoneShovelUrl,
    'stone_sword': stoneSwordUrl,

    // Железные инструменты
    'iron_pickaxe': ironPickUrl,
    'iron_axe': ironAxeUrl,
    'iron_shovel': ironShovelUrl,
    'iron_sword': ironSwordUrl,

    // Золотые инструменты
    'gold_pickaxe': goldPickUrl,
    'gold_axe': goldAxeUrl,
    'gold_shovel': goldShovelUrl,
    'gold_sword': goldSwordUrl,

    // Алмазные инструменты
    'diamond_pickaxe': diamondPickUrl,
    'diamond_axe': diamondAxeUrl,
    'diamond_shovel': diamondShovelUrl,
    'diamond_sword': diamondSwordUrl
}

// Объединённый маппинг всех текстур (PNG файлы)
const ALL_TEXTURES = {
    ...CRAFTING_TABLE_TEXTURES,
    ...FURNACE_TEXTURES,
    ...GLASS_TEXTURES,
    ...AMULET_TEXTURES
}

// ==================== КЭШИРОВАННЫЕ СГЕНЕРИРОВАННЫЕ ТЕКСТУРЫ ====================
const generatedTextures = {}

/**
 * Получить или сгенерировать текстуру руды
 * @param {string} oreType - Тип руды ('coal_ore', 'iron_ore', 'gold_ore', 'diamond_ore')
 * @returns {HTMLCanvasElement} Canvas с текстурой
 */
function getOreTexture(oreType) {
    if (!generatedTextures[oreType]) {
        // Генерируем текстуру руды с фиксированным seed для консистентности
        const seed = {
            'coal_ore': 12345,
            'iron_ore': 23456,
            'gold_ore': 34567,
            'diamond_ore': 45678
        }[oreType] || 12345

        generatedTextures[oreType] = textureGenerator.generateOreTexture(seed, oreType, 32)
    }
    return generatedTextures[oreType]
}

/**
 * Получить или сгенерировать текстуру камня
 * @returns {HTMLCanvasElement} Canvas с текстурой
 */
function getStoneTexture() {
    if (!generatedTextures['stone']) {
        generatedTextures['stone'] = textureGenerator.generateStoneTexture(12345, 32)
    }
    return generatedTextures['stone']
}

/**
 * Получить или сгенерировать текстуру земли
 * @returns {HTMLCanvasElement} Canvas с текстурой
 */
function getDirtTexture() {
    if (!generatedTextures['dirt']) {
        generatedTextures['dirt'] = textureGenerator.generateDirtTexture(12345, 32)
    }
    return generatedTextures['dirt']
}

/**
 * Получить или сгенерировать текстуру песка
 * @returns {HTMLCanvasElement} Canvas с текстурой
 */
function getSandTexture() {
    if (!generatedTextures['sand']) {
        generatedTextures['sand'] = textureGenerator.generateSandTexture(12345, 32)
    }
    return generatedTextures['sand']
}

/**
 * Получить или сгенерировать текстуру песчаника
 * @returns {HTMLCanvasElement} Canvas с текстурой
 */
function getSandstoneTexture() {
    if (!generatedTextures['sandstone']) {
        generatedTextures['sandstone'] = textureGenerator.generateSandstoneTexture(12345, 32)
    }
    return generatedTextures['sandstone']
}

/**
 * Создать 3D иконку блока с текстурами (из PNG файлов)
 * @param {object} noa - Экземпляр noa engine
 * @param {Array<string>} textureMaterials - Массив имен материалов [top, bottom, front, back, left, right]
 * @param {number} size - Размер canvas (по умолчанию 64px)
 * @returns {Promise<HTMLCanvasElement>} - Canvas с отрисованной 3D иконкой
 */
export async function create3DBlockIcon(noa, textureMaterials, size = 64) {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    // Рисуем изометрический куб с текстурами
    const cubeSize = size * 1 // Размер куба
    const offsetX = size * 0.5
    const offsetY = size * 0.0 // Начинаем с самого верха canvas

    // Загружаем текстуры по именам материалов
    // textureMaterials: [top, bottom, front, back, left, right]
    const topTexture = await loadTexture(ALL_TEXTURES[textureMaterials[0]])    // верх
    const frontTexture = await loadTexture(ALL_TEXTURES[textureMaterials[2]])  // фронт (левая грань в изометрии)
    const sideTexture = await loadTexture(ALL_TEXTURES[textureMaterials[5]])   // право (правая грань в изометрии)

    // Рисуем изометрический куб с текстурами
    // Верхняя грань (ромб)
    if (topTexture) {
        drawIsometricTop(ctx, topTexture, offsetX, offsetY, cubeSize)
    }

    // Левая грань (показывает фронт блока)
    if (frontTexture) {
        drawIsometricLeft(ctx, frontTexture, offsetX, offsetY, cubeSize)
    }

    // Правая грань (показывает бок блока)
    if (sideTexture) {
        drawIsometricRight(ctx, sideTexture, offsetX, offsetY, cubeSize)
    }

    return canvas
}

/**
 * Создать 3D иконку руды со сгенерированной текстурой
 * @param {string} oreType - Тип руды ('coal_ore', 'iron_ore', 'gold_ore', 'diamond_ore')
 * @param {number} size - Размер canvas (по умолчанию 64px)
 * @returns {HTMLCanvasElement} - Canvas с отрисованной 3D иконкой
 */
export function create3DOreIcon(oreType, size = 64) {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    // Рисуем изометрический куб с текстурами
    const cubeSize = size * 1 // Размер куба
    const offsetX = size * 0.5
    const offsetY = size * 0.0 // Начинаем с самого верха canvas

    // Получаем сгенерированную текстуру руды
    const oreTexture = getOreTexture(oreType)

    // Рисуем изометрический куб - все грани одинаковые (руда)
    // Верхняя грань (ромб)
    drawIsometricTop(ctx, oreTexture, offsetX, offsetY, cubeSize)

    // Левая грань
    drawIsometricLeft(ctx, oreTexture, offsetX, offsetY, cubeSize)

    // Правая грань
    drawIsometricRight(ctx, oreTexture, offsetX, offsetY, cubeSize)

    return canvas
}

/**
 * Создать 3D иконку камня со сгенерированной текстурой
 * @param {number} size - Размер canvas (по умолчанию 64px)
 * @returns {HTMLCanvasElement} - Canvas с отрисованной 3D иконкой
 */
export function create3DStoneIcon(size = 64) {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    const cubeSize = size * 1
    const offsetX = size * 0.5
    const offsetY = size * 0.0

    const stoneTexture = getStoneTexture()

    drawIsometricTop(ctx, stoneTexture, offsetX, offsetY, cubeSize)
    drawIsometricLeft(ctx, stoneTexture, offsetX, offsetY, cubeSize)
    drawIsometricRight(ctx, stoneTexture, offsetX, offsetY, cubeSize)

    return canvas
}

/**
 * Создать 3D иконку земли со сгенерированной текстурой
 * @param {number} size - Размер canvas (по умолчанию 64px)
 * @returns {HTMLCanvasElement} - Canvas с отрисованной 3D иконкой
 */
export function create3DDirtIcon(size = 64) {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    const cubeSize = size * 1
    const offsetX = size * 0.5
    const offsetY = size * 0.0

    const dirtTexture = getDirtTexture()

    drawIsometricTop(ctx, dirtTexture, offsetX, offsetY, cubeSize)
    drawIsometricLeft(ctx, dirtTexture, offsetX, offsetY, cubeSize)
    drawIsometricRight(ctx, dirtTexture, offsetX, offsetY, cubeSize)

    return canvas
}

/**
 * Создать 3D иконку песка со сгенерированной текстурой
 * @param {number} size - Размер canvas (по умолчанию 64px)
 * @returns {HTMLCanvasElement} - Canvas с отрисованной 3D иконкой
 */
export function create3DSandIcon(size = 64) {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    const cubeSize = size * 1
    const offsetX = size * 0.5
    const offsetY = size * 0.0

    const sandTexture = getSandTexture()

    drawIsometricTop(ctx, sandTexture, offsetX, offsetY, cubeSize)
    drawIsometricLeft(ctx, sandTexture, offsetX, offsetY, cubeSize)
    drawIsometricRight(ctx, sandTexture, offsetX, offsetY, cubeSize)

    return canvas
}

/**
 * Создать 3D иконку песчаника со сгенерированной текстурой
 * @param {number} size - Размер canvas (по умолчанию 64px)
 * @returns {HTMLCanvasElement} - Canvas с отрисованной 3D иконкой
 */
export function create3DSandstoneIcon(size = 64) {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    const cubeSize = size * 1
    const offsetX = size * 0.5
    const offsetY = size * 0.0

    const sandstoneTexture = getSandstoneTexture()

    drawIsometricTop(ctx, sandstoneTexture, offsetX, offsetY, cubeSize)
    drawIsometricLeft(ctx, sandstoneTexture, offsetX, offsetY, cubeSize)
    drawIsometricRight(ctx, sandstoneTexture, offsetX, offsetY, cubeSize)

    return canvas
}

/**
 * Создать иконку слитка из PNG текстуры
 * @param {string} ingotType - Тип слитка ('iron_ingot', 'gold_ingot')
 * @param {number} size - Размер canvas (по умолчанию 64px)
 * @returns {Promise<HTMLCanvasElement>} - Canvas с иконкой слитка
 */
export async function createIngotIcon(ingotType, size = 64) {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    const textureUrl = INGOT_TEXTURES[ingotType]
    if (!textureUrl) {
        // Если текстура не найдена, рисуем цветной квадрат
        ctx.fillStyle = ingotType === 'gold_ingot' ? '#FFD700' : '#C0C0C0'
        ctx.fillRect(size * 0.1, size * 0.1, size * 0.8, size * 0.8)
        return canvas
    }

    const texture = await loadTexture(textureUrl)
    if (texture) {
        // Рисуем текстуру слитка по центру
        ctx.drawImage(texture, 0, 0, size, size)
    }

    return canvas
}

/**
 * Создать иконку инструмента из PNG текстуры
 * @param {string} toolType - Тип инструмента ('wooden_pickaxe', 'iron_sword', etc.)
 * @param {number} size - Размер canvas (по умолчанию 64px)
 * @returns {Promise<HTMLCanvasElement>} - Canvas с иконкой инструмента
 */
export async function createToolIcon(toolType, size = 64) {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    const textureUrl = TOOL_TEXTURES[toolType]
    if (!textureUrl) {
        // Если текстура не найдена, рисуем цветной квадрат
        ctx.fillStyle = '#888888'
        ctx.fillRect(size * 0.1, size * 0.1, size * 0.8, size * 0.8)
        return canvas
    }

    const texture = await loadTexture(textureUrl)
    if (texture) {
        // Рисуем текстуру инструмента по центру
        ctx.drawImage(texture, 0, 0, size, size)
    }

    return canvas
}

/**
 * Создать иконку амулета из PNG текстуры
 * @param {string} amuletType - Тип амулета ('runic_amulet')
 * @param {number} size - Размер canvas (по умолчанию 64px)
 * @returns {Promise<HTMLCanvasElement>} - Canvas с иконкой амулета
 */
export async function createAmuletIcon(amuletType, size = 64) {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    const textureUrl = AMULET_TEXTURES[amuletType]
    if (!textureUrl) {
        // Если текстура не найдена, рисуем цветной квадрат
        ctx.fillStyle = '#888888'
        ctx.fillRect(size * 0.1, size * 0.1, size * 0.8, size * 0.8)
        return canvas
    }

    const texture = await loadTexture(textureUrl)
    if (texture) {
        // Рисуем текстуру амулета по центру
        ctx.drawImage(texture, 0, 0, size, size)
    } else {
        // Fallback if texture loading fails
        ctx.fillStyle = '#888888'
        ctx.fillRect(size * 0.1, size * 0.1, size * 0.8, size * 0.8)
    }

    return canvas
}

/**
 * Создать 3D иконку досок (блок) из PNG текстуры
 * @param {string} planksType - Тип досок ('oak_planks', 'dark_oak_planks')
 * @param {number} size - Размер иконки
 * @returns {Promise<HTMLCanvasElement>} - Canvas с 3D иконкой досок
 */
export async function createPlanksIcon(planksType, size = 64) {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    const textureUrl = PLANKS_TEXTURES[planksType]
    if (!textureUrl) {
        // Если текстура не найдена, рисуем цветной квадрат
        ctx.fillStyle = planksType === 'dark_oak_planks' ? '#3D2817' : '#8B7355'
        ctx.fillRect(size * 0.1, size * 0.1, size * 0.8, size * 0.8)
        return canvas
    }

    const texture = await loadTexture(textureUrl)
    if (texture) {
        // Рисуем изометрический 3D блок с текстурой досок
        const cubeSize = size * 0.85
        const offsetX = size / 2
        const offsetY = size * 0.15

        // Рисуем верхнюю грань
        drawIsometricTop(ctx, texture, offsetX, offsetY, cubeSize)

        // Рисуем левую грань (затемнённая)
        drawIsometricLeft(ctx, texture, offsetX, offsetY, cubeSize)

        // Рисуем правую грань (ещё более затемнённая)
        drawIsometricRight(ctx, texture, offsetX, offsetY, cubeSize)
    }

    return canvas
}

/**
 * Получить или сгенерировать текстуру торца дерева
 * @param {string} woodType - Тип дерева ('oak', 'dark_oak')
 * @returns {HTMLCanvasElement} Canvas с текстурой
 */
function getWoodTopTexture(woodType) {
    const cacheKey = `wood_top_${woodType}`
    if (!generatedTextures[cacheKey]) {
        if (woodType === 'oak') {
            generatedTextures[cacheKey] = textureGenerator.generateLightWoodTopTexture(12345, 32)
        } else {
            generatedTextures[cacheKey] = textureGenerator.generateWoodTopTexture(23456, 32)
        }
    }
    return generatedTextures[cacheKey]
}

/**
 * Получить или сгенерировать текстуру коры дерева
 * @param {string} woodType - Тип дерева ('oak', 'dark_oak')
 * @returns {HTMLCanvasElement} Canvas с текстурой
 */
function getWoodSideTexture(woodType) {
    const cacheKey = `wood_side_${woodType}`
    if (!generatedTextures[cacheKey]) {
        if (woodType === 'oak') {
            generatedTextures[cacheKey] = textureGenerator.generateWoodTexture(12345, 'oak_wood', 32)
        } else {
            generatedTextures[cacheKey] = textureGenerator.generateWoodTexture(23456, 'pine_wood', 32)
        }
    }
    return generatedTextures[cacheKey]
}

/**
 * Создать 3D иконку дерева (бревна) с процедурной текстурой
 * @param {string} woodType - Тип дерева ('oak', 'dark_oak')
 * @param {number} size - Размер иконки
 * @returns {HTMLCanvasElement} - Canvas с 3D иконкой дерева
 */
export function create3DWoodIcon(woodType, size = 64) {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    // Рисуем изометрический куб с текстурами
    const cubeSize = size * 1 // Размер куба
    const offsetX = size * 0.5
    const offsetY = size * 0.0 // Начинаем с самого верха canvas

    try {
        // Получаем сгенерированные текстуры дерева
        const topTexture = getWoodTopTexture(woodType)
        const sideTexture = getWoodSideTexture(woodType)

        console.log('🪵 Wood textures:', woodType, 'top:', topTexture, 'side:', sideTexture)

        if (topTexture && sideTexture) {
            // Рисуем изометрический куб
            // Верхняя грань (торец бревна - верхняя текстура)
            drawIsometricTop(ctx, topTexture, offsetX, offsetY, cubeSize)

            // Левая грань (кора - боковая текстура)
            drawIsometricLeft(ctx, sideTexture, offsetX, offsetY, cubeSize)

            // Правая грань (кора - боковая текстура)
            drawIsometricRight(ctx, sideTexture, offsetX, offsetY, cubeSize)
        }
    } catch (e) {
        console.error('Error creating wood icon:', e)
    }

    return canvas
}

/**
 * Загрузить текстуру из URL
 */
async function loadTexture(url) {
    if (!url) return null

    if (textureCache[url]) {
        return textureCache[url]
    }

    return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
            textureCache[url] = img
            resolve(img)
        }
        img.onerror = () => resolve(null)
        img.src = url
    })
}

/**
 * Нарисовать верхнюю грань (ромб) с текстурой
 */
function drawIsometricTop(ctx, texture, offsetX, offsetY, cubeSize) {
    ctx.save()

    // Создаем ромб как clipping path
    ctx.beginPath()
    ctx.moveTo(offsetX, offsetY)
    ctx.lineTo(offsetX + cubeSize * 0.5, offsetY + cubeSize * 0.25)
    ctx.lineTo(offsetX, offsetY + cubeSize * 0.5)
    ctx.lineTo(offsetX - cubeSize * 0.5, offsetY + cubeSize * 0.25)
    ctx.closePath()
    ctx.clip()

    // Рисуем текстуру в ромбе
    ctx.save()
    ctx.translate(offsetX, offsetY + cubeSize * 0.25)
    ctx.scale(1, 0.5) // Сжимаем по Y для изометрии
    ctx.rotate(45 * Math.PI / 180) // Поворачиваем на 45°
    ctx.drawImage(texture, -cubeSize * 0.35, -cubeSize * 0.35, cubeSize * 0.7, cubeSize * 0.7)
    ctx.restore()

    // Обводка
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.restore()
}

/**
 * Нарисовать левую грань с текстурой
 */
function drawIsometricLeft(ctx, texture, offsetX, offsetY, cubeSize) {
    ctx.save()

    // Высота боковой грани (правильная изометрия)
    const sideHeight = cubeSize * 0.58

    // Создаем параллелограмм
    ctx.beginPath()
    ctx.moveTo(offsetX - cubeSize * 0.5, offsetY + cubeSize * 0.25) // Верх лево
    ctx.lineTo(offsetX, offsetY + cubeSize * 0.5) // Верх право
    ctx.lineTo(offsetX, offsetY + cubeSize * 0.5 + sideHeight) // Низ право
    ctx.lineTo(offsetX - cubeSize * 0.5, offsetY + cubeSize * 0.25 + sideHeight) // Низ лево
    ctx.closePath()
    ctx.clip()

    // Рисуем текстуру (с перспективой)
    ctx.save()
    ctx.translate(offsetX - cubeSize * 0.5, offsetY + cubeSize * 0.25)
    ctx.transform(1, 0.5, 0, 1.16, 0, 0) // Трансформация для изометрии (правильные пропорции)
    ctx.drawImage(texture, 0, 0, cubeSize * 0.5, cubeSize * 0.5)
    ctx.restore()

    // Затемнение
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.fill()

    // Обводка
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.restore()
}

/**
 * Нарисовать правую грань с текстурой
 */
function drawIsometricRight(ctx, texture, offsetX, offsetY, cubeSize) {
    ctx.save()

    // Высота боковой грани (правильная изометрия)
    const sideHeight = cubeSize * 0.58

    // Создаем параллелограмм
    ctx.beginPath()
    ctx.moveTo(offsetX + cubeSize * 0.5, offsetY + cubeSize * 0.25) // Верх право
    ctx.lineTo(offsetX, offsetY + cubeSize * 0.5) // Верх лево
    ctx.lineTo(offsetX, offsetY + cubeSize * 0.5 + sideHeight) // Низ лево
    ctx.lineTo(offsetX + cubeSize * 0.5, offsetY + cubeSize * 0.25 + sideHeight) // Низ право
    ctx.closePath()
    ctx.clip()

    // Рисуем текстуру (отзеркалено для правой стороны)
    ctx.save()
    ctx.translate(offsetX + cubeSize * 0.5, offsetY + cubeSize * 0.25)
    ctx.transform(-1, 0.5, 0, 1.16, 0, 0) // Отрицательный scale по X для отражения
    ctx.drawImage(texture, 0, 0, cubeSize * 0.5, cubeSize * 0.5)
    ctx.restore()

    // Затемнение (сильнее)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
    ctx.fill()

    // Обводка
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.restore()
}

/**
 * Универсальная функция для применения текстуры к иконке предмета
 * Используется во всех UI (инвентарь, печка, верстак, удерживаемый предмет)
 * @param {HTMLElement} iconElement - DOM элемент иконки
 * @param {object} itemDef - Определение предмета из item-registry
 * @param {number} size - Размер иконки (по умолчанию 48)
 */
export async function applyItemIcon(iconElement, itemDef, size = 48) {
    if (!itemDef) return

    const color = itemDef.color || [1, 1, 1]

    // Устанавливаем базовый цвет пока загружается текстура
    iconElement.style.backgroundColor = `rgb(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255})`

    if (itemDef.useIngotIcon && itemDef.ingotType) {
        // Иконка слитка из PNG текстуры
        const canvas = await createIngotIcon(itemDef.ingotType, size)
        iconElement.style.backgroundColor = 'transparent'
        iconElement.style.backgroundImage = `url(${canvas.toDataURL()})`
        iconElement.style.backgroundSize = 'contain'
        iconElement.style.backgroundRepeat = 'no-repeat'
        iconElement.style.backgroundPosition = 'center'
    } else if (itemDef.use3DStoneIcon) {
        // 3D иконка камня
        const canvas = create3DStoneIcon(size)
        iconElement.style.backgroundColor = 'transparent'
        iconElement.style.backgroundImage = `url(${canvas.toDataURL()})`
        iconElement.style.backgroundSize = 'contain'
        iconElement.style.backgroundRepeat = 'no-repeat'
        iconElement.style.backgroundPosition = 'center'
    } else if (itemDef.use3DDirtIcon) {
        // 3D иконка земли
        const canvas = create3DDirtIcon(size)
        iconElement.style.backgroundColor = 'transparent'
        iconElement.style.backgroundImage = `url(${canvas.toDataURL()})`
        iconElement.style.backgroundSize = 'contain'
        iconElement.style.backgroundRepeat = 'no-repeat'
        iconElement.style.backgroundPosition = 'center'
    } else if (itemDef.use3DSandIcon) {
        // 3D иконка песка
        const canvas = create3DSandIcon(size)
        iconElement.style.backgroundColor = 'transparent'
        iconElement.style.backgroundImage = `url(${canvas.toDataURL()})`
        iconElement.style.backgroundSize = 'contain'
        iconElement.style.backgroundRepeat = 'no-repeat'
        iconElement.style.backgroundPosition = 'center'
    } else if (itemDef.use3DSandstoneIcon) {
        // 3D иконка песчаника
        const canvas = create3DSandstoneIcon(size)
        iconElement.style.backgroundColor = 'transparent'
        iconElement.style.backgroundImage = `url(${canvas.toDataURL()})`
        iconElement.style.backgroundSize = 'contain'
        iconElement.style.backgroundRepeat = 'no-repeat'
        iconElement.style.backgroundPosition = 'center'
    } else if (itemDef.use3DOreIcon && itemDef.oreType) {
        // 3D иконка руды
        const canvas = create3DOreIcon(itemDef.oreType, size)
        iconElement.style.backgroundColor = 'transparent'
        iconElement.style.backgroundImage = `url(${canvas.toDataURL()})`
        iconElement.style.backgroundSize = 'contain'
        iconElement.style.backgroundRepeat = 'no-repeat'
        iconElement.style.backgroundPosition = 'center'
    } else if (itemDef.use3DIcon && itemDef.textureMaterials) {
        // 3D иконка блока (верстак, печка)
        // Для этого нужен noa, но мы можем использовать без него
        const canvas = await create3DBlockIcon(null, itemDef.textureMaterials, size)
        iconElement.style.backgroundColor = 'transparent'
        iconElement.style.backgroundImage = `url(${canvas.toDataURL()})`
        iconElement.style.backgroundSize = 'contain'
        iconElement.style.backgroundRepeat = 'no-repeat'
        iconElement.style.backgroundPosition = 'center'
    } else if (itemDef.usePlanksIcon && itemDef.planksType) {
        // Иконка досок из PNG текстуры (3D блок)
        const canvas = await createPlanksIcon(itemDef.planksType, size)
        iconElement.style.backgroundColor = 'transparent'
        iconElement.style.backgroundImage = `url(${canvas.toDataURL()})`
        iconElement.style.backgroundSize = 'contain'
        iconElement.style.backgroundRepeat = 'no-repeat'
        iconElement.style.backgroundPosition = 'center'
    } else if (itemDef.use3DWoodIcon && itemDef.woodType) {
        // 3D иконка дерева (oak, dark_oak)
        const canvas = create3DWoodIcon(itemDef.woodType, size)
        iconElement.style.backgroundColor = 'transparent'
        iconElement.style.backgroundImage = `url(${canvas.toDataURL()})`
        iconElement.style.backgroundSize = 'contain'
        iconElement.style.backgroundRepeat = 'no-repeat'
        iconElement.style.backgroundPosition = 'center'
    } else if (itemDef.useToolIcon && itemDef.toolType) {
        // Иконка инструмента/оружия из PNG текстуры
        const canvas = await createToolIcon(itemDef.toolType, size)
        iconElement.style.backgroundColor = 'transparent'
        iconElement.style.backgroundImage = `url(${canvas.toDataURL()})`
        iconElement.style.backgroundSize = 'contain'
        iconElement.style.backgroundRepeat = 'no-repeat'
        iconElement.style.backgroundPosition = 'center'
    } else if (itemDef.useAmuletIcon && itemDef.amuletType) {
        // Иконка амулета из PNG текстуры
        const canvas = await createAmuletIcon(itemDef.amuletType, size)
        iconElement.style.backgroundColor = 'transparent'
        iconElement.style.backgroundImage = `url(${canvas.toDataURL()})`
        iconElement.style.backgroundSize = 'contain'
        iconElement.style.backgroundRepeat = 'no-repeat'
        iconElement.style.backgroundPosition = 'center'
    }
    // Если ни один флаг не установлен - оставляем базовый цвет
}

export default {
    create3DBlockIcon,
    create3DOreIcon,
    create3DStoneIcon,
    create3DDirtIcon,
    create3DSandIcon,
    create3DSandstoneIcon,
    create3DWoodIcon,
    createIngotIcon,
    createPlanksIcon,
    createToolIcon,
    createAmuletIcon, // ADD THIS
    applyItemIcon
}
