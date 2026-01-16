/**
 * Точка входа в игру
 */

import { noa, worldSeed, rng } from './engine.js'
import { registerBlocks } from './blocks/block-registry.js'
import { initWorldGen } from './world/chunk-generator.js'
import { getBiomeParams } from './world/biome-manager.js'
import { getSurfaceHeight } from './world/heightmap.js'
import { setupPlayer } from './player.js'
import { setupInteractions } from './interaction.js'
import { registerItems } from './items/item-registry.js'
import { registerRecipes } from './items/crafting-recipes.js'
import { registerSmeltingRecipes } from './items/smelting-recipes.js'
import { Inventory } from './items/inventory.js'
import { InventoryUI } from './items/inventory-ui.js'
import { FurnaceManager } from './machines/furnace.js'
import { FurnaceUI } from './machines/furnace-ui.js'
import { CraftingTableUI } from './machines/crafting-table-ui.js'
import { initFlowers, initCactus } from './Plants'

let tickCount = 0

// Регистрируем генератор мира СРАЗУ, до любых задержек!
const blockIDs = registerBlocks()
initWorldGen()

// Инициализация главного меню
window.addEventListener('DOMContentLoaded', () => {
    const mainMenu = document.getElementById('main-menu')
    const singleplayerBtn = document.getElementById('singleplayer-btn')
    const settingsBtn = document.getElementById('settings-btn')
    const quitBtn = document.getElementById('quit-btn')

    // Получаем имя мира из URL
    const urlParams = new URLSearchParams(window.location.search)
    const worldName = urlParams.get('name')

    // Если есть имя мира (мы пришли из нового меню), сразу запускаем игру
    if (worldName) {
        // Menu is hidden by default, so we don't need to hide it

        // Обновляем дисплей имени мира
        const nameDisplay = document.getElementById('world-name-display')
        if (nameDisplay) nameDisplay.textContent = worldName
        startGame()
    } else {
        // Если имени мира нет (прямой заход), показываем меню
        if (mainMenu) mainMenu.classList.add('show')
    }

    // Старая логика меню (оставляем как fallback или для прямой отладки)
    if (singleplayerBtn) {
        singleplayerBtn.addEventListener('click', () => {
            if (mainMenu) mainMenu.classList.remove('show')
            startGame()
        })
    }

    // Кнопка "Настройки" - пока заглушка
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            alert('Настройки пока не реализованы')
        })
    }

    // Кнопка "Выход"
    quitBtn.addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите выйти?')) {
            window.close()
        }
    })
})

// Функция запуска игры
async function startGame() {
    console.log('🚀 Game starting...')

    // Показываем экран загрузки
    const loadingScreen = document.getElementById('loading-screen')
    if (loadingScreen) {
        loadingScreen.classList.add('show')
    }

    try {
        updateLoading(0, 'Inializing...')
        await wait(100)

        updateLoading(40, 'Loading items and recipes...')
        const itemRegistry = registerItems(blockIDs) // Передаём blockIDs

        // Генерируем случайный seed для рецептов при каждом запуске
        const recipeSeed = Math.floor(Math.random() * 1000000)
        console.log(`🎲 Recipe seed: ${recipeSeed}`)
        registerRecipes(recipeSeed) // Каждый запуск = новые рецепты!

        registerSmeltingRecipes()
        window.items = itemRegistry // Сохраняем для доступа из UI
        await wait(100)

        updateLoading(70, 'Creating inventory...')
        const inventory = new Inventory()
        const inventoryUI = new InventoryUI(inventory, noa)

        // Добавляем стартовые предметы для тестирования
        inventory.addItem('diamond_pickaxe', 1, { getItem: (n) => itemRegistry[n] })
        inventory.addItem('diamond', 10, { getItem: (n) => itemRegistry[n] })
        inventory.addItem('oak', 10, { getItem: (n) => itemRegistry[n] })
        inventory.addItem('dark_oak', 10, { getItem: (n) => itemRegistry[n] })
        inventory.addItem('coal', 16, { getItem: (n) => itemRegistry[n] })
        inventory.addItem('runic_amulet', 1, { getItem: (n) => itemRegistry[n] })
        inventory.addItem('gold_ore', 5, { getItem: (n) => itemRegistry[n] })
        inventory.addItem('crafting_table', 1, { getItem: (n) => itemRegistry[n] })
        inventory.addItem('furnace', 1, { getItem: (n) => itemRegistry[n] })
        inventoryUI.refresh()

        window.gameInventory = inventory
        window.gameInventoryUI = inventoryUI
        await wait(100)

        updateLoading(80, 'Initializing furnace and crafting table...')
        const furnaceManager = new FurnaceManager(noa)
        const furnaceUI = new FurnaceUI(noa)
        const craftingTableUI = new CraftingTableUI(noa)

        window.gameFurnaceManager = furnaceManager
        window.gameFurnaceUI = furnaceUI
        window.gameCraftingTableUI = craftingTableUI
        await wait(100)

        updateLoading(90, 'Setting up UI...')
        initializeGameUI(blockIDs)
        await wait(200)

        updateLoading(100, 'Done!')
        await wait(200)

        hideLoadingScreen()

        setTimeout(() => {
            const pos = noa.entities.getPosition(noa.playerEntity)
            if (!pos || pos[1] < -10) {
                setSafeSpawn()
            }
        }, 2000)

    } catch (e) {
        console.error('❌ Error:', e)
    }
}

function initializeGameUI(blockIDs) {
    console.log('🎮 Initializing game UI...')

    setupPlayer(noa)
    setupInteractions(noa, blockIDs)

    // Инициализируем спавнеры растений
    updateLoading(95, 'Initializing plants...')
    const flowers = initFlowers(noa, {
        density: 0.03, // 3% of grass blocks will have flowers
        grassBlockIds: blockIDs.grass, // Массив всех вариаций травы (используется в биомах Forest и Field)
        worldSeed: worldSeed
    })
    const cacti = initCactus(noa, {
        density: 0.015, // 1.5% - кактусы реже цветов
        sandBlockIds: blockIDs.sand, // Массив всех вариаций песка
        worldSeed: worldSeed
    })
    window.flowers = flowers // Для дебага
    window.cacti = cacti   // Для дебага

    setSafeSpawn()
    updateSeedDisplay(worldSeed)

    noa.on('tick', (dt) => {
        tickCount++
        updatePlayerPosition()

        // Обновляем UI печки для обновления прогресс-баров
        if (window.gameFurnaceUI) {
            window.gameFurnaceUI.update()
        }

        // Обновляем UI верстака
        if (window.gameCraftingTableUI) {
            window.gameCraftingTableUI.update()
        }
    })

    console.log('✅ Game initialized!')
}

function setSafeSpawn() {
    const spawnX = Math.floor((rng() - 0.5) * 1000)
    const spawnZ = Math.floor((rng() - 0.5) * 1000)
    const biomeParams = getBiomeParams(spawnX, spawnZ)
    const surfaceY = getSurfaceHeight(spawnX, spawnZ, biomeParams)
    const spawnY = surfaceY + 2

    console.log(`📍 Spawn: ${spawnX}, ${spawnY}, ${spawnZ}`)

    if (noa.playerEntity) {
        noa.entities.setPosition(noa.playerEntity, [spawnX, spawnY, spawnZ])
    }
}

function updateLoading(percent, text) {
    const loadingText = document.getElementById('loading-text')
    const loadingBar = document.getElementById('loading-bar')
    if (loadingText) loadingText.textContent = text
    if (loadingBar) loadingBar.style.width = `${percent}%`
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen')
    const gameContainer = document.getElementById('game-container')
    if (loadingScreen && gameContainer) {
        loadingScreen.classList.remove('show')
        gameContainer.style.display = 'block'
    }
    // Скрываем главное меню, если оно еще видно
    const mainMenu = document.getElementById('main-menu')
    if (mainMenu) {
        mainMenu.classList.add('hidden')
    }
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function updateSeedDisplay(seed) {
    const seedDisplay = document.getElementById('seed-display')
    if (seedDisplay) seedDisplay.textContent = seed
}

function updatePlayerPosition() {
    const pos = noa.entities.getPosition(noa.playerEntity)
    const posDisplay = document.getElementById('pos-display')

    if (pos) {
        const x = Math.floor(pos[0])
        const y = Math.floor(pos[1])
        const z = Math.floor(pos[2])

        if (posDisplay) posDisplay.textContent = `${x}, ${y}, ${z}`

        if (y < -20) {
            console.warn('⚠️ Void! Respawning...')
            setSafeSpawn()
        }
    }
}

window.noa = noa
window.worldSeed = worldSeed
console.log('📝 Debug: window.noa, window.worldSeed')
