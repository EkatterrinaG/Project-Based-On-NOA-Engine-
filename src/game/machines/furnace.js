/**
 * Менеджер печек
 * Управление состоянием всех печек в мире
 */

import { findSmeltingRecipe, getFuelValue } from '../items/smelting-recipes.js'
import { blockIDs } from '../blocks/block-registry.js'

export class FurnaceManager {
    constructor(noa) {
        this.noa = noa
        this.furnaces = new Map() // Карта всех печек: "x,y,z" -> furnaceData

        // Запуск обновления
        this.startUpdateLoop()
    }

    /**
     * Получить ключ позиции
     */
    getPosKey(x, y, z) {
        return `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`
    }

    /**
     * Создать новую печку на позиции
     */
    createFurnace(x, y, z) {
        const key = this.getPosKey(x, y, z)

        if (this.furnaces.has(key)) {
            return this.furnaces.get(key)
        }

        const furnace = {
            x: Math.floor(x),
            y: Math.floor(y),
            z: Math.floor(z),

            // Слоты
            inputSlot: { item: null, count: 0 },      // Руда
            fuelSlot: { item: null, count: 0 },       // Топливо
            outputSlot: { item: null, count: 0 },     // Результат

            // Состояние плавки
            isSmelting: false,
            currentRecipe: null,
            smeltTime: 0,           // Прошло времени плавки (секунды)
            smeltTimeTotal: 60,     // Общее время плавки (секунды)

            // Состояние топлива
            isBurning: false,
            fuelRemaining: 0,       // Остаток топлива (операции)
            fuelTimeRemaining: 0,   // Остаток времени горения (секунды)
            fuelTimeTotal: 0        // Общее время горения текущего топлива
        }

        this.furnaces.set(key, furnace)
        return furnace
    }

    /**
     * Получить печку на позиции
     */
    getFurnace(x, y, z) {
        const key = this.getPosKey(x, y, z)
        return this.furnaces.get(key) || null
    }

    /**
     * Удалить печку (когда блок сломан)
     */
    removeFurnace(x, y, z) {
        const key = this.getPosKey(x, y, z)
        this.furnaces.delete(key)
    }

    /**
     * Положить предмет в слот
     */
    putItem(furnace, slotType, itemName, count = 1) {
        const slot = furnace[slotType]

        if (slot.item === null) {
            slot.item = itemName
            slot.count = count
        } else if (slot.item === itemName) {
            slot.count += count
        } else {
            // Слот занят другим предметом
            return false
        }

        // Обновить состояние печки
        this.updateFurnaceState(furnace)
        return true
    }

    /**
     * Взять предмет из слота
     */
    takeItem(furnace, slotType, count = 1) {
        const slot = furnace[slotType]

        if (slot.item === null || slot.count === 0) {
            return null
        }

        const taken = Math.min(count, slot.count)
        slot.count -= taken

        const result = {
            item: slot.item,
            count: taken
        }

        if (slot.count === 0) {
            slot.item = null
        }

        // Обновить состояние печки
        this.updateFurnaceState(furnace)

        return result
    }

    /**
     * Обновить состояние печки (проверка рецептов, топлива и т.д.)
     */
    updateFurnaceState(furnace) {
        // Проверяем наличие рецепта
        if (furnace.inputSlot.item) {
            const recipe = findSmeltingRecipe(furnace.inputSlot.item)
            furnace.currentRecipe = recipe
        } else {
            furnace.currentRecipe = null
            furnace.isSmelting = false
        }

        // Если есть рецепт и топливо - начинаем плавку
        if (furnace.currentRecipe && !furnace.isSmelting) {
            // Проверяем что выходной слот не переполнен
            if (!this.canAcceptOutput(furnace, furnace.currentRecipe.output)) {
                furnace.isSmelting = false
                return
            }

            // Проверяем топливо
            if (furnace.isBurning || this.tryConsumeFuel(furnace)) {
                furnace.isSmelting = true
                furnace.smeltTime = 0
                furnace.smeltTimeTotal = furnace.currentRecipe.smeltTime
            }
        }
    }

    /**
     * Проверить может ли выходной слот принять результат
     */
    canAcceptOutput(furnace, outputItem) {
        const outputSlot = furnace.outputSlot

        // Если слот пустой - можем принять
        if (!outputSlot.item || outputSlot.count === 0) {
            return true
        }

        // Если тот же предмет и есть место (макс 64)
        if (outputSlot.item === outputItem && outputSlot.count < 64) {
            return true
        }

        // Иначе слот заполнен или занят другим предметом
        return false
    }

    /**
     * Попытка использовать топливо
     */
    tryConsumeFuel(furnace) {
        if (furnace.fuelSlot.item === null || furnace.fuelSlot.count === 0) {
            return false
        }

        const fuelValue = getFuelValue(furnace.fuelSlot.item)

        if (fuelValue === 0) {
            return false // Не является топливом
        }

        // Расходуем 1 единицу топлива
        furnace.fuelSlot.count -= 1
        if (furnace.fuelSlot.count === 0) {
            furnace.fuelSlot.item = null
        }

        // Запускаем горение
        furnace.isBurning = true
        furnace.fuelRemaining = fuelValue
        furnace.fuelTimeRemaining = fuelValue * 10 // 10 секунд на операцию
        furnace.fuelTimeTotal = furnace.fuelTimeRemaining

        return true
    }

    /**
     * Обновление всех печек (вызывается каждый тик)
     */
    update(dt) {
        this.furnaces.forEach((furnace) => {
            this.updateFurnace(furnace, dt)
        })
    }

    /**
     * Обновление одной печки
     */
    updateFurnace(furnace, dt) {
        // Обновление топлива
        if (furnace.isBurning) {
            furnace.fuelTimeRemaining -= dt

            if (furnace.fuelTimeRemaining <= 0) {
                furnace.isBurning = false
                furnace.fuelRemaining = 0
                furnace.fuelTimeTotal = 0

                // Обновляем визуал (тушим печку)
                this.updateFurnaceBlock(furnace, false)
            } else {
                // Печка горит
                this.updateFurnaceBlock(furnace, true)
            }
        }

        // Обновление плавки
        if (furnace.isSmelting) {
            // Если топливо закончилось - пауза
            if (!furnace.isBurning && !this.tryConsumeFuel(furnace)) {
                furnace.isSmelting = false
                return
            }

            // Проверяем что выходной слот не переполнен
            if (furnace.currentRecipe && !this.canAcceptOutput(furnace, furnace.currentRecipe.output)) {
                furnace.isSmelting = false
                return
            }

            furnace.smeltTime += dt

            // DEBUG: Логируем прогресс каждые 60 тиков (~1 секунда)
            if (!furnace._debugCounter) furnace._debugCounter = 0
            furnace._debugCounter++
            if (furnace._debugCounter >= 60) {
                console.log(`🔥 Smelting: ${furnace.smeltTime.toFixed(1)}/${furnace.smeltTimeTotal}s (dt=${dt.toFixed(4)})`)
                furnace._debugCounter = 0
            }

            // Прогресс плавки
            furnace.smeltProgress = Math.min(furnace.smeltTime / furnace.smeltTimeTotal, 1)

            // Плавка завершена
            if (furnace.smeltTime >= furnace.smeltTimeTotal) {
                console.log(`✅ Smelting completed in ${furnace.smeltTime.toFixed(1)} seconds`)
                this.completeSmelting(furnace)
            }
        }

        // Прогресс топлива для UI
        if (furnace.isBurning && furnace.fuelTimeTotal > 0) {
            furnace.fuelProgress = furnace.fuelTimeRemaining / furnace.fuelTimeTotal
        } else {
            furnace.fuelProgress = 0
        }
    }

    /**
     * Завершение плавки
     */
    completeSmelting(furnace) {
        if (!furnace.currentRecipe) return

        // Проверяем есть ли место в выходном слоте
        const outputItem = furnace.currentRecipe.output

        // Используем canAcceptOutput для проверки
        if (!this.canAcceptOutput(furnace, outputItem)) {
            // Нет места - останавливаем плавку
            furnace.isSmelting = false
            return
        }

        // Добавляем результат в выходной слот
        if (furnace.outputSlot.item === null || furnace.outputSlot.count === 0) {
            furnace.outputSlot.item = outputItem
            furnace.outputSlot.count = 1
        } else if (furnace.outputSlot.item === outputItem) {
            furnace.outputSlot.count += 1
        }

        // Расходуем входной материал
        furnace.inputSlot.count -= 1
        if (furnace.inputSlot.count === 0) {
            furnace.inputSlot.item = null
        }

        // Сбрасываем прогресс и проверяем возможность продолжения
        furnace.smeltTime = 0
        furnace.smeltProgress = 0
        furnace.isSmelting = false

        this.updateFurnaceState(furnace)
    }

    /**
     * Обновить блок печки (визуально)
     */
    updateFurnaceBlock(furnace, isLit) {
        const { x, y, z } = furnace
        const currentBlock = this.noa.getBlock(x, y, z)

        // Используем правильные ID блоков из реестра
        const furnaceID = blockIDs.furnace
        const furnaceLitID = blockIDs.furnace_lit

        if (isLit && currentBlock === furnaceID) {
            console.log('🔥 Switching furnace to LIT state')
            this.noa.setBlock(furnaceLitID, x, y, z)
        } else if (!isLit && currentBlock === furnaceLitID) {
            console.log('⬛ Switching furnace to OFF state')
            this.noa.setBlock(furnaceID, x, y, z)
        }
    }

    /**
     * Запуск цикла обновления
     */
    startUpdateLoop() {
        this.noa.on('tick', (dt) => {
            // dt приходит в миллисекундах, конвертируем в секунды
            this.update(dt / 1000)
        })
    }
}
