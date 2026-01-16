/**
 * Система выпадающих предметов (loot)
 */

import { noa } from '../engine.js'
import { StandardMaterial, Texture, Vector3, Mesh, CreateBox } from '@babylonjs/core'
import { items } from './item-registry.js'
import { TextureGenerator } from '../textures/texture-generator.js'

// Текстуры для лута (PNG)
import ironIngotUrl from '../textures/default_steel_ingot.png'
import goldIngotUrl from '../textures/default_gold_ingot.png'
import diamondUrl from '../textures/default_diamond.png'
import coalUrl from '../textures/default_charcoal_lump.png'
import stickUrl from '../textures/default_stick.png'
import oakPlanksUrl from '../textures/default_wood_birch_stack.png'
import darkOakPlanksUrl from '../textures/default_wood_stack.png'
import amuletUrl from '../textures/minecraft_amulet.png'


// Текстуры для печки и верстака
import furnaceFrontUrl from '../textures/default_furnace_front.png'
import craftingTableTopUrl from '../textures/crafting_table_top.png'

// Инструменты
import woodPickUrl from '../textures/default_tool_woodpick.png'
import woodAxeUrl from '../textures/default_tool_woodaxe.png'
import woodShovelUrl from '../textures/default_tool_woodshovel.png'
import woodSwordUrl from '../textures/default_tool_woodsword.png'
import stonePickUrl from '../textures/default_tool_stonepick.png'
import stoneAxeUrl from '../textures/default_tool_stoneaxe.png'
import stoneShovelUrl from '../textures/default_tool_stoneshovel.png'
import stoneSwordUrl from '../textures/default_tool_stonesword.png'
import ironPickUrl from '../textures/default_tool_steelpick.png'
import ironAxeUrl from '../textures/default_tool_steelaxe.png'
import ironShovelUrl from '../textures/default_tool_steelshovel.png'
import ironSwordUrl from '../textures/default_tool_steelsword.png'
import goldPickUrl from '../textures/default_tool_goldpick.png'
import goldAxeUrl from '../textures/default_tool_goldaxe.png'
import goldShovelUrl from '../textures/default_tool_goldshovel.png'
import goldSwordUrl from '../textures/default_tool_goldsword.png'
import diamondPickUrl from '../textures/default_tool_diamondpick.png'
import diamondAxeUrl from '../textures/default_tool_diamondaxe.png'
import diamondShovelUrl from '../textures/default_tool_diamondshovel.png'
import diamondSwordUrl from '../textures/default_tool_diamondsword.png'

const RESOURCE_TEXTURES = {
    'iron_ingot': ironIngotUrl,
    'gold_ingot': goldIngotUrl,
    'diamond': diamondUrl,
    'coal': coalUrl,
    'stick': stickUrl,
    'oak_planks': oakPlanksUrl,
    'dark_oak_planks': darkOakPlanksUrl,

    // Печка и верстак
    'furnace': furnaceFrontUrl,
    'crafting_table': craftingTableTopUrl,

    // Инструменты
    'wooden_pickaxe': woodPickUrl,
    'wooden_axe': woodAxeUrl,
    'wooden_shovel': woodShovelUrl,
    'wooden_sword': woodSwordUrl,
    'stone_pickaxe': stonePickUrl,
    'stone_axe': stoneAxeUrl,
    'stone_shovel': stoneShovelUrl,
    'stone_sword': stoneSwordUrl,
    'iron_pickaxe': ironPickUrl,
    'iron_axe': ironAxeUrl,
    'iron_shovel': ironShovelUrl,
    'iron_sword': ironSwordUrl,
    'gold_pickaxe': goldPickUrl,
    'gold_axe': goldAxeUrl,
    'gold_shovel': goldShovelUrl,
    'gold_sword': goldSwordUrl,
    'diamond_pickaxe': diamondPickUrl,
    'diamond_axe': diamondAxeUrl,
    'diamond_shovel': diamondShovelUrl,
    'diamond_sword': diamondSwordUrl,
    'runic_amulet': amuletUrl
}

export class LootManager {
    constructor(noa) {
        this.noa = noa
        this.loots = []

        // Регистрируем компонент для лута
        noa.entities.createComponent({
            name: 'loot',
            state: {
                itemName: '',
                creationTime: 0
            }
        })

        // Создаем accessor для доступа к данным лута (быстрее чем getState)
        this.getLootData = noa.entities.getStateAccessor('loot')

        // Добавляем систему для подбора лута через событие tick
        noa.on('tick', (dt) => {
            if (!noa.playerEntity) return
            const playerPos = noa.entities.getPosition(noa.playerEntity)

            for (let i = this.loots.length - 1; i >= 0; i--) {
                const eid = this.loots[i]
                const state = this.getLootData(eid)

                if (!state) {
                    this.loots.splice(i, 1)
                    continue
                }

                const lootPos = noa.entities.getPosition(eid)
                if (!lootPos) continue

                // Проверка дистанции для подбора (1.5 блока)
                const dist = this.getDistance(playerPos, lootPos)
                if (dist < 1.5) {
                    this.pickupLoot(eid, state.itemName)
                    // Не удаляем из loots здесь, это сделает следующая итерация или проверка state
                    continue
                }

                // Анимация вращения
                const meshData = noa.entities.getMeshData(eid)
                if (meshData && meshData.mesh) {
                    const mesh = meshData.mesh
                    mesh.rotation.y += 0.02
                    // Плавное парение вверх-вниз
                    mesh.position.y += Math.sin(Date.now() / 500) * 0.001
                }
            }
        })
    }

    getDistance(p1, p2) {
        const dx = p1[0] - p2[0]
        const dy = p1[1] - p2[1]
        const dz = p1[2] - p2[2]
        return Math.sqrt(dx * dx + dy * dy + dz * dz)
    }

    /**
     * Создать выпадающий предмет
     */
    spawnLoot(itemName, x, y, z) {
        console.log(`[LOOT] Spawning loot: ${itemName} at ${x}, ${y}, ${z}`)
        const mesh = this.createLootMesh(itemName)

        // Смещение в центр блока + небольшой разброс
        const px = x + 0.5 + (Math.random() - 0.5) * 0.3
        const py = y + 0.5
        const pz = z + 0.5 + (Math.random() - 0.5) * 0.3

        const eid = noa.entities.add(
            [px, py, pz],
            0.3, 0.3, // ширина, высота hitbox
            mesh,
            [0, 0, 0],
            true // shadow
        )

        // Физика добавляется автоматически в noa.entities.add, 
        // но нам нужно настроить параметры тела
        const phys = noa.entities.getPhysics(eid)
        if (phys && phys.body) {
            phys.body.friction = 10
            phys.body.restitution = 0.3
            // Небольшой импульс вверх
            phys.body.applyImpulse([
                (Math.random() - 0.5) * 0.1,
                0.15,
                (Math.random() - 0.5) * 0.1
            ])
        }

        // Добавляем компонент лута
        noa.entities.addComponent(eid, 'loot', {
            itemName: itemName,
            creationTime: Date.now()
        })

        // Добавляем в список отслеживания
        this.loots.push(eid)

        return eid
    }

    pickupLoot(eid, itemName) {
        if (window.gameInventory) {
            console.log(`[LOOT] Picking up: ${itemName}`)
            const remaining = window.gameInventory.addItem(itemName, 1, {
                getItem: (n) => items[n]
            })

            console.log(`[LOOT] Added to inventory. Remaining: ${remaining}`)

            if (remaining === 0) {
                if (window.gameInventoryUI) {
                    window.gameInventoryUI.refresh()
                }
                noa.entities.deleteEntity(eid)
                console.log(`[LOOT] Entity ${eid} deleted`)
            }
        }
    }

    createLootMesh(itemName) {
        const scene = noa.rendering.getScene()
        const itemDef = items[itemName]
        const size = 0.25
        const mesh = CreateBox('loot-' + itemName, { size: size }, scene)

        const mat = new StandardMaterial('loot-mat-' + itemName, scene)

        if (itemDef) {
            let textureApplied = false
            const textureGen = new TextureGenerator()

            if (itemDef.use3DStoneIcon) {
                const canvas = textureGen.generateStoneTexture(Math.random() * 1000)
                mat.diffuseTexture = new Texture(canvas.toDataURL(), scene)
                textureApplied = true
            } else if (itemDef.use3DDirtIcon) {
                const canvas = textureGen.generateDirtTexture(Math.random() * 1000)
                mat.diffuseTexture = new Texture(canvas.toDataURL(), scene)
                textureApplied = true
            } else if (itemDef.use3DSandIcon) {
                const canvas = textureGen.generateSandTexture(Math.random() * 1000)
                mat.diffuseTexture = new Texture(canvas.toDataURL(), scene)
                textureApplied = true
            } else if (itemDef.use3DSandstoneIcon) {
                const canvas = textureGen.generateSandstoneTexture(Math.random() * 1000)
                mat.diffuseTexture = new Texture(canvas.toDataURL(), scene)
                textureApplied = true
            } else if (itemDef.use3DOreIcon && itemDef.oreType) {
                const canvas = textureGen.generateOreTexture(Math.random() * 1000, itemDef.oreType)
                mat.diffuseTexture = new Texture(canvas.toDataURL(), scene)
                textureApplied = true
            } else if (itemDef.use3DWoodIcon && itemDef.woodType) {
                const woodType = itemDef.woodType === 'oak' ? 'oak_wood' : 'pine_wood'
                const canvas = textureGen.generateWoodTexture(Math.random() * 1000, woodType)
                mat.diffuseTexture = new Texture(canvas.toDataURL(), scene)
                textureApplied = true
            } else if (itemDef.use3DIcon) {
                // Печка и верстак - используем PNG текстуры
                const texUrl = RESOURCE_TEXTURES[itemName]
                if (texUrl) {
                    mat.diffuseTexture = new Texture(texUrl, scene)
                    textureApplied = true
                }
            } else if ((itemDef.useIngotIcon || itemDef.useToolIcon) && (itemDef.ingotType || itemDef.toolType)) {
                const texType = itemDef.ingotType || itemDef.toolType
                const texUrl = RESOURCE_TEXTURES[texType]
                if (texUrl) {
                    mat.diffuseTexture = new Texture(texUrl, scene)
                    mat.diffuseTexture.hasAlpha = true
                    textureApplied = true
                }
            } else if (itemDef.usePlanksIcon && itemDef.planksType) {
                const texUrl = RESOURCE_TEXTURES[itemDef.planksType]
                if (texUrl) {
                    mat.diffuseTexture = new Texture(texUrl, scene)
                    textureApplied = true
                }
            } else if (itemDef.useAmuletIcon && itemDef.amuletType) {
                const texUrl = RESOURCE_TEXTURES[itemDef.amuletType]
                if (texUrl) {
                    mat.diffuseTexture = new Texture(texUrl, scene)
                    mat.diffuseTexture.hasAlpha = true
                    textureApplied = true
                }
            } else if (itemDef.blockId) {
                // Пытаемся получить материалы блока из регистра
                const blockId = itemDef.blockId
                // Получаем материал верхней грани
                const matName = noa.registry.getBlockFaceMaterial(blockId, 2)

                if (matName) {
                    const matData = noa.registry.getMaterialData(matName)
                    if (matData && (matData.texture || matData['textureURL'])) {
                        const texURL = matData.texture || matData['textureURL']
                        const tex = new Texture(texURL, scene)

                        // Если это атлас, нужно настроить UV
                        if (matData.atlasIndex !== undefined) {
                            // Все наши атласы имеют 64 вариации по вертикали
                            const variationCount = 64
                            tex.vScale = 1 / variationCount
                            tex.vOffset = matData.atlasIndex / variationCount
                        }

                        mat.diffuseTexture = tex
                        textureApplied = true
                    }
                }
            }

            if (!textureApplied && itemDef.color) {
                mat.diffuseColor.set(itemDef.color[0], itemDef.color[1], itemDef.color[2])
            }
        }

        mesh.material = mat
        return mesh
    }
}
