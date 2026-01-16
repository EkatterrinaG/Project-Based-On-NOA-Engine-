/**
 * Item Registry
 * Definition of all items in the game
 */

// Item Types
export const ItemType = {
    TOOL: 'tool',       // Tools (pickaxe, axe, shovel)
    WEAPON: 'weapon',   // Weapons (sword)
    BLOCK: 'block',     // Blocks (can be placed)
    RESOURCE: 'resource' // Ресурсы (уголь, слитки и т.д.)
}

// Реестр всех предметов
export const items = {}

// ID счетчик
let nextItemId = 1

/**
 * Регистрация предмета
 */
function registerItem(name, config) {
    const id = nextItemId++

    items[name] = {
        id,
        name,
        displayName: config.displayName || name,
        type: config.type || ItemType.RESOURCE,
        maxStack: config.maxStack || 64,
        durability: config.durability || null,
        blockId: config.blockId || null, // ID блока если это блок
        color: config.color || [0.5, 0.5, 0.5], // Временный цвет для иконки
        ...config
    }

    return items[name]
}

/**
 * Регистрация всех предметов
 * @param {object} blockIDs - Реестр ID блоков из block-registry
 */
export function registerItems(blockIDs) {
    console.log('📦 Registering items...')

    // === БЛОКИ (как предметы) ===

    registerItem('dirt', {
        displayName: 'Dirt',
        type: ItemType.BLOCK,
        blockId: blockIDs.dirtBase,
        color: [0.45, 0.3, 0.2],
        use3DDirtIcon: true,
        hardness: 0.5,
        preferredTool: 'shovel'
    })

    registerItem('stone', {
        displayName: 'Cobblestone',
        type: ItemType.BLOCK,
        blockId: blockIDs.stoneBase, // Используем первую вариацию как ID предмета
        color: [0.5, 0.5, 0.5],
        use3DStoneIcon: true,  // Флаг для использования 3D иконки со сгенерированной текстурой
        hardness: 1.5,
        preferredTool: 'pickaxe',
        drop: 'cobblestone'
    })

    registerItem('grass', {
        displayName: 'Grass',
        type: ItemType.BLOCK,
        blockId: blockIDs.grassBase,
        color: [0.2, 0.6, 0.2],
        hardness: 0.6,
        preferredTool: 'shovel',
        drop: 'dirt'
    })

    registerItem('sand', {
        displayName: 'Sand',
        type: ItemType.BLOCK,
        blockId: blockIDs.sandBase,
        color: [0.9, 0.85, 0.6],
        use3DSandIcon: true,
        hardness: 0.5,
        preferredTool: 'shovel'
    })

    registerItem('sandstone', {
        displayName: 'sandstone',
        type: ItemType.BLOCK,
        blockId: blockIDs.sandstoneBase,
        color: [0.85, 0.75, 0.5],
        use3DSandstoneIcon: true,
        hardness: 0.8,
        preferredTool: 'pickaxe'
    })

    registerItem('snow', {
        displayName: 'Snow',
        type: ItemType.BLOCK,
        blockId: blockIDs.snowBase,
        color: [0.95, 0.95, 0.98],
        hardness: 0.2,
        preferredTool: 'shovel',
        drop: 'dirt'
    })

    // === ДЕРЕВО ===

    // Дуб (Oak) - светлое дерево из лесного биома
    registerItem('oak', {
        displayName: 'oak',
        type: ItemType.BLOCK,
        blockId: blockIDs.oak_woodBase,
        color: [0.5, 0.35, 0.15],
        use3DWoodIcon: true,
        woodType: 'oak',
        hardness: 2.0,
        preferredTool: 'axe'
    })

    // Тёмный дуб (Dark Oak) - тёмное дерево из зимнего биома
    registerItem('dark_oak', {
        displayName: 'dark_oak',
        type: ItemType.BLOCK,
        blockId: blockIDs.pine_woodBase,
        color: [0.3, 0.2, 0.1],
        use3DWoodIcon: true,
        woodType: 'dark_oak'
    })

    // Дубовые доски (Oak Planks) - можно ставить
    registerItem('oak_planks', {
        displayName: 'oak_planks',
        type: ItemType.BLOCK,
        blockId: blockIDs.oak_planks,
        color: [0.6, 0.4, 0.2],
        usePlanksIcon: true,
        planksType: 'oak_planks',
        hardness: 2.0,
        preferredTool: 'axe'
    })

    // Тёмные дубовые доски (Dark Oak Planks) - можно ставить
    registerItem('dark_oak_planks', {
        displayName: 'dark_oak_planks',
        type: ItemType.BLOCK,
        blockId: blockIDs.dark_oak_planks,
        color: [0.3, 0.2, 0.1],
        usePlanksIcon: true,
        planksType: 'dark_oak_planks'
    })

    registerItem('glass', {
        displayName: 'glass',
        type: ItemType.BLOCK,
        blockId: blockIDs.glass,
        use3DIcon: true, // Флаг для использования 3D модели
        textureMaterials: [
            'glass',
            'glass',
            'glass',
            'glass',
            'glass',
            'glass'
        ],
        hardness: 0.3,
    })

    registerItem('leaves', {
        displayName: 'leaves',
        type: ItemType.BLOCK,
        blockId: blockIDs.leaves,
        color: [0.1, 0.5, 0.1],
        hardness: 0.2
    })

    registerItem('furnace', {
        displayName: 'furnace',
        type: ItemType.BLOCK,
        blockId: blockIDs.furnace,
        color: [0.3, 0.3, 0.35],
        use3DIcon: true, // Флаг для использования 3D модели
        textureMaterials: [
            'furnace_top',          // [0] верх
            'furnace_bottom',       // [1] низ
            'furnace_front',        // [2] фронт
            'furnace_side',         // [3] зад
            'furnace_side',         // [4] лево
            'furnace_side'          // [5] право
        ],
        hardness: 3.5,
        preferredTool: 'pickaxe'
    })

    registerItem('crafting_table', {
        displayName: 'crafting_table',
        type: ItemType.BLOCK,
        blockId: blockIDs.crafting_table,
        color: [0.5, 0.35, 0.2],
        use3DIcon: true, // Флаг для использования 3D модели
        textureMaterials: [
            'crafting_table_front',
            'crafting_table_side',
            'crafting_table_side',
            'crafting_table_top',
            'crafting_table_side',
            'crafting_table_side'
        ]
    })

    // === РУДЫ (блоки) - используют сгенерированные текстуры ===

    registerItem('coal_ore', {
        displayName: 'coal_ore',
        type: ItemType.BLOCK,
        blockId: blockIDs.coal_oreBase,
        color: [0.2, 0.2, 0.2],
        use3DOreIcon: true,  // Флаг для использования 3D иконки со сгенерированной текстурой
        oreType: 'coal_ore',  // Тип руды для генератора текстур
        hardness: 3.0,
        preferredTool: 'pickaxe',
        drop: 'coal'
    })

    registerItem('iron_ore', {
        displayName: 'iron_ore',
        type: ItemType.BLOCK,
        blockId: blockIDs.iron_oreBase,
        color: [0.6, 0.4, 0.3],
        use3DOreIcon: true,
        oreType: 'iron_ore',
        hardness: 3.0,
        preferredTool: 'pickaxe'
    })

    registerItem('gold_ore', {
        displayName: 'gold_ore',
        type: ItemType.BLOCK,
        blockId: blockIDs.gold_oreBase,
        color: [1.0, 0.8, 0.0],
        use3DOreIcon: true,
        oreType: 'gold_ore',
        hardness: 3.0,
        preferredTool: 'pickaxe'
    })

    registerItem('diamond_ore', {
        displayName: 'diamond_ore',
        type: ItemType.BLOCK,
        blockId: blockIDs.diamond_oreBase,
        color: [0.0, 0.8, 1.0],
        use3DOreIcon: true,
        oreType: 'diamond_ore',
        hardness: 3.0,
        preferredTool: 'pickaxe',
        drop: 'diamond'
    })

    // === РЕСУРСЫ ===

    registerItem('stick', {
        displayName: 'stick',
        type: ItemType.RESOURCE,
        color: [0.4, 0.25, 0.1],
        useToolIcon: true,
        toolType: 'stick'
    })

    registerItem('coal', {
        displayName: 'coal',
        type: ItemType.RESOURCE,
        color: [0.1, 0.1, 0.1],
        useIngotIcon: true,
        ingotType: 'coal'
    })

    registerItem('iron_ingot', {
        displayName: 'iron_ingot',
        type: ItemType.RESOURCE,
        color: [0.7, 0.7, 0.75],
        useIngotIcon: true,
        ingotType: 'iron_ingot'
    })

    registerItem('gold_ingot', {
        displayName: 'gold_ingot',
        type: ItemType.RESOURCE,
        color: [1.0, 0.85, 0.0],
        useIngotIcon: true,
        ingotType: 'gold_ingot'
    })

    registerItem('diamond', {
        displayName: 'diamond',
        type: ItemType.RESOURCE,
        color: [0.0, 0.9, 1.0],
        useIngotIcon: true,
        ingotType: 'diamond'
    })

    // Материалы для L-System крафтов (алиасы для слитков и алмазов)
    registerItem('iron', {
        displayName: 'iron',
        type: ItemType.RESOURCE,
        color: [0.7, 0.7, 0.75],
        useIngotIcon: true,
        ingotType: 'iron_ingot'
    })

    registerItem('gold', {
        displayName: 'gold',
        type: ItemType.RESOURCE,
        color: [1.0, 0.85, 0.0],
        useIngotIcon: true,
        ingotType: 'gold_ingot'
    })

    registerItem('cobblestone', {
        displayName: 'cobblestone',
        type: ItemType.RESOURCE, // Хотя это и блок в мире, как предмет он часто ресурс
        blockId: blockIDs.stoneBase, // Пока так
        color: [0.5, 0.5, 0.5],
        use3DStoneIcon: true,
        hardness: 2.0,
        preferredTool: 'pickaxe'
    })

    // === ИНСТРУМЕНТЫ ===

    // Деревянные
    registerItem('wooden_pickaxe', {
        displayName: 'wooden_pickaxe',
        type: ItemType.TOOL,
        durability: 60,
        miningSpeed: 2,
        maxStack: 1,
        color: [0.4, 0.25, 0.1],
        useToolIcon: true,
        toolType: 'wooden_pickaxe',
        efficiency: 2
    })

    registerItem('wooden_axe', {
        displayName: 'wooden_axe',
        type: ItemType.TOOL,
        durability: 60,
        miningSpeed: 2,
        maxStack: 1,
        color: [0.4, 0.25, 0.1],
        useToolIcon: true,
        toolType: 'wooden_axe',
        efficiency: 2
    })

    registerItem('wooden_shovel', {
        displayName: 'wooden_shovel',
        type: ItemType.TOOL,
        durability: 60,
        miningSpeed: 2,
        maxStack: 1,
        color: [0.4, 0.25, 0.1],
        useToolIcon: true,
        toolType: 'wooden_shovel',
        efficiency: 2
    })

    // Каменные
    registerItem('stone_pickaxe', {
        displayName: 'stone_pickaxe',
        type: ItemType.TOOL,
        durability: 132,
        miningSpeed: 4,
        maxStack: 1,
        color: [0.5, 0.5, 0.5],
        useToolIcon: true,
        toolType: 'stone_pickaxe',
        efficiency: 4
    })

    registerItem('stone_axe', {
        displayName: 'stone_axe',
        type: ItemType.TOOL,
        durability: 132,
        miningSpeed: 4,
        maxStack: 1,
        color: [0.5, 0.5, 0.5],
        useToolIcon: true,
        toolType: 'stone_axe'
    })

    registerItem('stone_shovel', {
        displayName: 'stone_shovel',
        type: ItemType.TOOL,
        durability: 132,
        miningSpeed: 4,
        maxStack: 1,
        color: [0.5, 0.5, 0.5],
        useToolIcon: true,
        toolType: 'stone_shovel'
    })

    // Железные
    registerItem('iron_pickaxe', {
        displayName: 'iron_pickaxe',
        type: ItemType.TOOL,
        durability: 251,
        miningSpeed: 6,
        maxStack: 1,
        color: [0.7, 0.7, 0.75],
        useToolIcon: true,
        toolType: 'iron_pickaxe'
    })

    registerItem('iron_axe', {
        displayName: 'iron_axe',
        type: ItemType.TOOL,
        durability: 251,
        miningSpeed: 6,
        maxStack: 1,
        color: [0.7, 0.7, 0.75],
        useToolIcon: true,
        toolType: 'iron_axe'
    })

    registerItem('iron_shovel', {
        displayName: 'iron_shovel',
        type: ItemType.TOOL,
        durability: 251,
        miningSpeed: 6,
        maxStack: 1,
        color: [0.7, 0.7, 0.75],
        useToolIcon: true,
        toolType: 'iron_shovel'
    })

    // Золотые (быстрые но хрупкие)
    registerItem('gold_pickaxe', {
        displayName: 'gold_pickaxe',
        type: ItemType.TOOL,
        durability: 33,
        miningSpeed: 12,
        maxStack: 1,
        color: [1.0, 0.85, 0.0],
        useToolIcon: true,
        toolType: 'gold_pickaxe'
    })

    registerItem('gold_axe', {
        displayName: 'gold_axe',
        type: ItemType.TOOL,
        durability: 33,
        miningSpeed: 12,
        maxStack: 1,
        color: [1.0, 0.85, 0.0],
        useToolIcon: true,
        toolType: 'gold_axe'
    })

    registerItem('gold_shovel', {
        displayName: 'gold_shovel',
        type: ItemType.TOOL,
        durability: 33,
        miningSpeed: 12,
        maxStack: 1,
        color: [1.0, 0.85, 0.0],
        useToolIcon: true,
        toolType: 'gold_shovel'
    })

    // Алмазные
    registerItem('diamond_pickaxe', {
        displayName: 'diamond_pickaxe',
        type: ItemType.TOOL,
        durability: 1562,
        miningSpeed: 8,
        maxStack: 1,
        color: [0.0, 0.9, 1.0],
        useToolIcon: true,
        toolType: 'diamond_pickaxe'
    })

    registerItem('diamond_axe', {
        displayName: 'diamond_axe',
        type: ItemType.TOOL,
        durability: 1562,
        miningSpeed: 8,
        maxStack: 1,
        color: [0.0, 0.9, 1.0],
        useToolIcon: true,
        toolType: 'diamond_axe'
    })

    registerItem('diamond_shovel', {
        displayName: 'diamond_shovel',
        type: ItemType.TOOL,
        durability: 1562,
        miningSpeed: 8,
        maxStack: 1,
        color: [0.0, 0.9, 1.0],
        useToolIcon: true,
        toolType: 'diamond_shovel'
    })

    // === ОРУЖИЕ ===

    registerItem('wooden_sword', {
        displayName: 'wooden_sword',
        type: ItemType.WEAPON,
        durability: 60,
        damage: 4,
        maxStack: 1,
        color: [0.4, 0.25, 0.1],
        useToolIcon: true,
        toolType: 'wooden_sword'
    })

    registerItem('stone_sword', {
        displayName: 'stone_sword',
        type: ItemType.WEAPON,
        durability: 132,
        damage: 5,
        maxStack: 1,
        color: [0.5, 0.5, 0.5],
        useToolIcon: true,
        toolType: 'stone_sword'
    })

    registerItem('iron_sword', {
        displayName: 'iron_sword',
        type: ItemType.WEAPON,
        durability: 251,
        damage: 6,
        maxStack: 1,
        color: [0.7, 0.7, 0.75],
        useToolIcon: true,
        toolType: 'iron_sword'
    })

    registerItem('diamond_sword', {
        displayName: 'diamond_sword',
        type: ItemType.WEAPON,
        durability: 1562,
        damage: 7,
        maxStack: 1,
        color: [0.0, 0.9, 1.0],
        useToolIcon: true,
        toolType: 'diamond_sword'
    })

    registerItem('gold_sword', {
        displayName: 'gold_sword',
        type: ItemType.WEAPON,
        durability: 33,
        damage: 4,
        maxStack: 1,
        color: [1.0, 0.85, 0.0],
        useToolIcon: true,
        toolType: 'gold_sword'
    })

    // Рунический амулет
    registerItem('runic_amulet', {
        displayName: 'runic_amulet',
        type: ItemType.RESOURCE,
        color: [0.5, 0.2, 0.8],
        maxStack: 1,
        useAmuletIcon: true,
        amuletType: 'runic_amulet'
    })


    console.log(`✅ Registered ${Object.keys(items).length} items`)

    return items
}

/**
 * Получить предмет по имени
 */
export function getItem(name) {
    return items[name] || null
}

export default {
    ItemType,
    items,
    registerItems,
    getItem
}
