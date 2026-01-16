import { noa } from './engine.js'
import { items, ItemType } from './items/item-registry.js'
import { blockIDToItemName } from './blocks/block-registry.js'
import { LootManager } from './items/loot.js'
import { TextureGenerator } from './textures/texture-generator.js'
import { CreateBox, StandardMaterial, Texture } from '@babylonjs/core'
import { createBlockParticles } from './effects/particles.js'
import { miningSpeeds } from './config/mining-speeds.js'

/**
 * Настройка взаимодействий
 * @param {import('noa-engine').Engine} noa
 * @param {object} blockIDs - Реестр ID блоков
 */
export function setupInteractions(noa, blockIDs) {
    console.log('🖱️ Setting up interactions...')
    console.log('🔥 Furnace IDs:', blockIDs.furnace, blockIDs.furnace_lit)

    const lootManager = new LootManager(noa)
    window['gameLootManager'] = lootManager

    const textureGen = new TextureGenerator()
    const crackingTextures = []
    const scene = noa.rendering.getScene()

    // Генерируем 10 стадий трещин
    for (let i = 0; i < 10; i++) {
        const url = textureGen.generateCrackingTexture(i).toDataURL()
        const tex = new Texture(url, scene)
        tex.hasAlpha = true
        crackingTextures.push(tex)
    }

    let miningProgress = 0
    let miningTarget = null

    // Создаем меш для трещин
    const crackingMesh = CreateBox('cracking-mesh', { size: 1.005 }, scene)
    const crackingMat = new StandardMaterial('cracking-mat', scene)
    crackingMat.diffuseTexture = crackingTextures[0]
    crackingMat.useAlphaFromDiffuseTexture = true
    crackingMesh.material = crackingMat
    crackingMesh.isVisible = false

    // Отключаем стандартный обработчик огня
    // noa.inputs.down.on('fire', ...) - переносим логику в tick

    noa.on('tick', () => {
        // Проверяем, зажата ли кнопка "ломать" (ЛКМ)
        const isFiring = noa.inputs.state.fire

        // Игнорируем если открыто UI
        const isUIOpen = (window['gameFurnaceUI'] && window['gameFurnaceUI'].isOpen) ||
            (window['gameCraftingTableUI'] && window['gameCraftingTableUI'].isOpen) ||
            (window['gameInventoryUI'] && window['gameInventoryUI'].isOpen)

        if (!isFiring || isUIOpen) {
            resetMining()
            return
        }

        const targeted = noa.targetedBlock
        if (!targeted) {
            resetMining()
            return
        }

        const pos = targeted.position

        // Если сменили блок - сбрасываем прогресс
        if (!miningTarget || !posEqual(pos, miningTarget)) {
            miningProgress = 0
            miningTarget = [...pos]
        }

        const blockID = noa.getBlock(pos[0], pos[1], pos[2])
        if (blockID === 0 || blockID === 1) { // Воздух или бедрок
            resetMining()
            return
        }

        // Параметры блока
        const itemName = blockIDToItemName[blockID]
        const itemDef = items[itemName]

        // Расчет скорости
        let speedMultiplier = 1
        const selectedSlot = window['gameInventory'] ? window['gameInventory'].getSelectedSlot() : null
        const heldItem = selectedSlot ? items[selectedSlot.item] : null

        if (itemDef) {
            if (heldItem && heldItem.type === ItemType.TOOL) {
                const toolSpeed = miningSpeeds[heldItem.name]?.[itemName]
                if (toolSpeed) {
                    speedMultiplier = toolSpeed
                }
            }

            const hardness = itemDef.hardness || 1.0
            // 60 тиков в секунду. Если твердость 1.0 и множитель 1, сломается за 1.5 сек (как в МС)
            miningProgress += (speedMultiplier / (hardness * 90))
        } else {
            miningProgress += 0.05 // Fallback для неизвестных блоков
        }

        // Визуализация
        updateCracking(miningTarget, miningProgress)

        if (miningProgress >= 1) {
            // Ломаем!
            const blockID = noa.getBlock(pos[0], pos[1], pos[2]) // Get ID before destroying
            const scene = noa.rendering.getScene()
            const particles = createBlockParticles(scene, blockID)
            particles.emitter.set(pos[0] + 0.5, pos[1] + 0.5, pos[2] + 0.5)
            particles.start()

            noa.setBlock(0, pos[0], pos[1], pos[2])

            // Уменьшаем прочность инструмента
            if (selectedSlot && selectedSlot.durability !== null) {
                selectedSlot.durability -= 1
                if (selectedSlot.durability <= 0) {
                    // Инструмент сломался
                    const inv = window['gameInventory']
                    if (inv) {
                        inv.removeItemByIndex(inv.selectedHotbarSlot, 1)
                    }
                }
                if (window['gameInventoryUI']) {
                    window['gameInventoryUI'].refresh()
                }
            }

            // Спавним лут
            if (itemName) {
                // Если у предмета есть спец. дроп (например, уголь из руды), спавним его
                const dropItem = (itemDef && itemDef.drop) ? itemDef.drop : itemName
                lootManager.spawnLoot(dropItem, pos[0], pos[1], pos[2])
            }

            resetMining()
        }
    })

    function posEqual(a, b) {
        return a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
    }

    function resetMining() {
        miningProgress = 0
        miningTarget = null
        crackingMesh.isVisible = false
        crackingMat.alpha = 0
    }

    function updateCracking(pos, progress) {
        crackingMesh.isVisible = true
        crackingMesh.position.set(pos[0] + 0.5, pos[1] + 0.5, pos[2] + 0.5)

        // Выбираем текстуру в зависимости от прогресса (0-9)
        const stage = Math.min(9, Math.floor(progress * 10))
        crackingMat.diffuseTexture = crackingTextures[stage]
        crackingMat.alpha = 1.0 // Сама текстура имеет альфу
    }

    // ПКМ - Ставить блок или открыть печку
    noa.inputs.down.on('alt-fire', () => {
        // Игнорируем клики если открыто любое UI
        const isUIOpen = (window['gameFurnaceUI'] && window['gameFurnaceUI'].isOpen) ||
            (window['gameCraftingTableUI'] && window['gameCraftingTableUI'].isOpen) ||
            (window['gameInventoryUI'] && window['gameInventoryUI'].isOpen)

        if (isUIOpen) return

        console.log('[INTERACTION] ПКМ нажата')
        if (noa.targetedBlock) {
            // Проверяем, не печка ли это (ПЕРВЫМ ДЕЛОМ, до проверки инвентаря!)
            const targetPos = noa.targetedBlock.position
            const targetBlockID = noa.getBlock(targetPos[0], targetPos[1], targetPos[2])

            console.log(`[INTERACTION] Целевой блок: ID = ${targetBlockID}, pos = (${targetPos[0]}, ${targetPos[1]}, ${targetPos[2]})`)
            console.log(`[INTERACTION] Проверка печки: furnace = ${blockIDs.furnace}, furnace_lit = ${blockIDs.furnace_lit} `)

            // Проверяем ID печки из blockIDs (а не жестко заданные 25/26)
            if (targetBlockID === blockIDs.furnace || targetBlockID === blockIDs.furnace_lit) {
                console.log('[INTERACTION] Это печка! Пытаемся открыть...')
                // ...
                console.log('[INTERACTION] gameFurnaceManager:', window['gameFurnaceManager'])
                console.log('[INTERACTION] gameFurnaceUI:', window['gameFurnaceUI'])

                // Открываем UI печки
                if (window['gameFurnaceManager'] && window['gameFurnaceUI']) {
                    let furnace = window['gameFurnaceManager'].getFurnace(
                        targetPos[0], targetPos[1], targetPos[2]
                    )

                    console.log('[INTERACTION] Найдена печка:', furnace)

                    // Если печки нет - создаем
                    if (!furnace) {
                        console.log('[INTERACTION] Печка не найдена, создаём новую')
                        furnace = window['gameFurnaceManager'].createFurnace(
                            targetPos[0], targetPos[1], targetPos[2]
                        )
                        console.log('[INTERACTION] Создана печка:', furnace)
                    }

                    console.log('[INTERACTION] Открываем UI печки')
                    window['gameFurnaceUI'].open(furnace)
                    console.log('[INTERACTION] UI печки открыт')
                } else {
                    console.error('[INTERACTION] gameFurnaceManager или gameFurnaceUI не определены!')
                }
                return
            }

            // Проверяем ID верстака
            if (targetBlockID === blockIDs.crafting_table) {
                console.log('[INTERACTION] Это верстак! Открываем...')

                // Открываем UI верстака
                if (window['gameCraftingTableUI']) {
                    window['gameCraftingTableUI'].open()
                    console.log('[INTERACTION] UI верстака открыт')
                } else {
                    console.error('[INTERACTION] gameCraftingTableUI не определен!')
                }
                return
            }


            const pos = noa.targetedBlock.adjacent

            // Простая проверка, чтобы не застрять в блоке
            const playerPos = noa.entities.getPosition(noa.playerEntity)
            const dx = Math.abs(playerPos[0] - (pos[0] + 0.5))
            const dy = Math.abs(playerPos[1] - (pos[1] + 0.5))
            const dz = Math.abs(playerPos[2] - (pos[2] + 0.5))

            // Если игрок слишком близко к центру блока (простая эвристика)
            if (dx < 0.8 && dz < 0.8 && dy < 1.8) {
                // console.log('🚫 Cannot place block inside player')
                // return
            }

            // Получаем выбранный предмет из инвентаря
            if (window.gameInventory) {
                const slot = window.gameInventory.getSelectedSlot()

                if (slot && !slot.isEmpty()) {
                    const item = items[slot.item]
                    console.log(`🔍 Placing block: slot.item = "${slot.item}", item = `, item)

                    // Если это блок - ставим его
                    if (item && item.type === 'block' && item.blockId) {
                        let blockToPlace = item.blockId
                        console.log(`📦 Block to place: item.blockId = ${item.blockId} `)

                        // Если это камень - выбираем случайную вариацию на основе координат
                        if (slot.item === 'stone' && blockIDs.stone && Array.isArray(blockIDs.stone)) {
                            // Хеш-функция на основе координат (такая же как в chunk-generator)
                            const hash = (pos[0] * 73856093) ^ (pos[1] * 19349663) ^ (pos[2] * 83492791)
                            const stoneIndex = Math.abs(hash) % blockIDs.stone.length
                            blockToPlace = blockIDs.stone[stoneIndex]
                            console.log(`🪨 Placing stone at(${pos[0]}, ${pos[1]}, ${pos[2]}): variation ${stoneIndex}/${blockIDs.stone.length}, blockID=${blockToPlace}`)
                        }

                        // Если это земля - выбираем случайную вариацию на основе координат
                        if (slot.item === 'dirt' && blockIDs.dirt && Array.isArray(blockIDs.dirt)) {
                            const hash = (pos[0] * 73856093) ^ (pos[1] * 19349663) ^ (pos[2] * 83492791)
                            const dirtIndex = Math.abs(hash) % blockIDs.dirt.length
                            blockToPlace = blockIDs.dirt[dirtIndex]
                            console.log(`🟫 Placing dirt at (${pos[0]}, ${pos[1]}, ${pos[2]}): variation ${dirtIndex}/${blockIDs.dirt.length}, blockID=${blockToPlace}`)
                        }

                        // Если это трава - выбираем случайную вариацию на основе координат
                        if (slot.item === 'grass' && blockIDs.grass && Array.isArray(blockIDs.grass)) {
                            const hash = (pos[0] * 73856093) ^ (pos[1] * 19349663) ^ (pos[2] * 83492791)
                            const grassIndex = Math.abs(hash) % blockIDs.grass.length
                            blockToPlace = blockIDs.grass[grassIndex]
                            console.log(`🌱 Placing grass at (${pos[0]}, ${pos[1]}, ${pos[2]}): variation ${grassIndex}/${blockIDs.grass.length}, blockID=${blockToPlace}`)
                        }

                        // Если это песок - выбираем случайную вариацию на основе координат
                        if (slot.item === 'sand' && blockIDs.sand && Array.isArray(blockIDs.sand)) {
                            const hash = (pos[0] * 73856093) ^ (pos[1] * 19349663) ^ (pos[2] * 83492791)
                            const sandIndex = Math.abs(hash) % blockIDs.sand.length
                            blockToPlace = blockIDs.sand[sandIndex]
                            console.log(`🏖️ Placing sand at (${pos[0]}, ${pos[1]}, ${pos[2]}): variation ${sandIndex}/${blockIDs.sand.length}, blockID=${blockToPlace}`)
                        }

                        // Если это угольная руда - выбираем случайную вариацию на основе координат
                        if (slot.item === 'coal_ore' && blockIDs.coal_ore && Array.isArray(blockIDs.coal_ore)) {
                            const hash = (pos[0] * 73856093) ^ (pos[1] * 19349663) ^ (pos[2] * 83492791)
                            const oreIndex = Math.abs(hash) % blockIDs.coal_ore.length
                            blockToPlace = blockIDs.coal_ore[oreIndex]
                            console.log(`⚫ Placing coal ore at (${pos[0]}, ${pos[1]}, ${pos[2]}): variation ${oreIndex}/${blockIDs.coal_ore.length}, blockID=${blockToPlace}`)
                        }

                        // Если это железная руда - выбираем случайную вариацию на основе координат
                        if (slot.item === 'iron_ore' && blockIDs.iron_ore && Array.isArray(blockIDs.iron_ore)) {
                            const hash = (pos[0] * 73856093) ^ (pos[1] * 19349663) ^ (pos[2] * 83492791)
                            const oreIndex = Math.abs(hash) % blockIDs.iron_ore.length
                            blockToPlace = blockIDs.iron_ore[oreIndex]
                            console.log(`🟠 Placing iron ore at (${pos[0]}, ${pos[1]}, ${pos[2]}): variation ${oreIndex}/${blockIDs.iron_ore.length}, blockID=${blockToPlace}`)
                        }

                        // Если это золотая руда - выбираем случайную вариацию на основе координат
                        if (slot.item === 'gold_ore' && blockIDs.gold_ore && Array.isArray(blockIDs.gold_ore)) {
                            const hash = (pos[0] * 73856093) ^ (pos[1] * 19349663) ^ (pos[2] * 83492791)
                            const oreIndex = Math.abs(hash) % blockIDs.gold_ore.length
                            blockToPlace = blockIDs.gold_ore[oreIndex]
                            console.log(`🟡 Placing gold ore at (${pos[0]}, ${pos[1]}, ${pos[2]}): variation ${oreIndex}/${blockIDs.gold_ore.length}, blockID=${blockToPlace}`)
                        }

                        // Если это алмазная руда - выбираем случайную вариацию на основе координат
                        if (slot.item === 'diamond_ore' && blockIDs.diamond_ore && Array.isArray(blockIDs.diamond_ore)) {
                            const hash = (pos[0] * 73856093) ^ (pos[1] * 19349663) ^ (pos[2] * 83492791)
                            const oreIndex = Math.abs(hash) % blockIDs.diamond_ore.length
                            blockToPlace = blockIDs.diamond_ore[oreIndex]
                            console.log(`💎 Placing diamond ore at (${pos[0]}, ${pos[1]}, ${pos[2]}): variation ${oreIndex}/${blockIDs.diamond_ore.length}, blockID=${blockToPlace}`)
                        }

                        console.log(`✅ Final blockToPlace=${blockToPlace}`)
                        noa.setBlock(blockToPlace, pos[0], pos[1], pos[2])

                        // Уменьшаем количество в ВЫБРАННОМ слоте (не из всего инвентаря!)
                        slot.count -= 1
                        if (slot.count === 0) {
                            slot.clear()
                        }

                        // Обновляем UI
                        const ui = window.gameInventoryUI
                        if (ui) ui.refresh()
                    }
                }
            } else {
                // Fallback если инвентаря нет (для тестов) - используем первую вариацию камня
                noa.setBlock(blockIDs.stoneBase, pos[0], pos[1], pos[2])
            }
        }
    })

    console.log('✅ Interactions setup complete')
}
