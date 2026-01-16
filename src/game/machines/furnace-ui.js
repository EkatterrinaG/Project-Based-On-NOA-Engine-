/**
 * UI Печки
 * Интерфейс для взаимодействия с печкой
 */

import { items } from '../items/item-registry.js'
import { findSmeltingRecipe, getFuelValue } from '../items/smelting-recipes.js'
import { applyItemIcon } from '../items/item-icon-3d.js'

export class FurnaceUI {
    constructor(noa) {
        this.noa = noa
        this.isOpen = false
        this.currentFurnace = null // Данные текущей печки

        // DOM Элементы
        this.modal = null
        this.inputSlot = null
        this.fuelSlot = null
        this.outputSlot = null
        this.smeltProgress = null
        this.fuelProgress = null
        this.closeBtn = null

        // Drag and Drop состояние
        this.draggedFrom = null // 'furnace' или 'inventory'
        this.draggedSlotType = null // 'inputSlot', 'fuelSlot', 'outputSlot' или индекс инвентаря

        this.init()
    }

    init() {
        // Создаем модальное окно печки
        this.createModal()
        this.setupInputs()
    }

    setupInputs() {
        // Обработчик клавиатуры для ESC
        window.addEventListener('keydown', (e) => {
            // ESC - Закрыть печку
            if (e.code === 'Escape' && this.isOpen) {
                e.preventDefault()
                this.close()
            }
        })
    }

    createModal() {
        // Создаем модальное окно
        const modal = document.createElement('div')
        modal.id = 'furnace-modal'
        modal.className = 'modal'
        modal.style.cssText = `
            display: none;
            position: fixed;
            z-index: 1001;
            left: 50%;
            top: 5%;
            transform: translate(-50%, 0);
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #666;
            border-radius: 8px;
            padding: 20px;
            min-width: 400px;
            color: white;
            font-family: Arial, sans-serif;
        `

        // Заголовок
        const title = document.createElement('div')
        title.style.cssText = `
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            text-align: center;
        `
        title.innerText = '🔥 Furnace'
        modal.appendChild(title)

        // Контейнер слотов
        const slotsContainer = document.createElement('div')
        slotsContainer.style.cssText = `
            display: flex;
            justify-content: space-around;
            align-items: center;
            margin-bottom: 20px;
            position: relative;
        `

        // Левая колонка (Input и Fuel)
        const leftColumn = document.createElement('div')
        leftColumn.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
        `

        // Input слот (верхний)
        this.inputSlot = this.createSlot('Ore', 'inputSlot')
        leftColumn.appendChild(this.inputSlot)

        // Fuel слот (нижний)
        this.fuelSlot = this.createSlot('Fuel', 'fuelSlot')
        leftColumn.appendChild(this.fuelSlot)

        slotsContainer.appendChild(leftColumn)

        // Прогресс-бары (центр)
        const progressContainer = document.createElement('div')
        progressContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin: 0 20px;
        `

        // Прогресс плавки
        const smeltBarContainer = document.createElement('div')
        smeltBarContainer.innerHTML = '<div style="font-size: 12px; margin-bottom: 5px;">Melting</div>'
        this.smeltProgress = document.createElement('div')
        this.smeltProgress.style.cssText = `
            width: 100px;
            height: 20px;
            background: rgba(255,255,255,0.1);
            border: 1px solid #666;
            border-radius: 4px;
            overflow: hidden;
        `
        const smeltBar = document.createElement('div')
        smeltBar.className = 'smelt-bar'
        smeltBar.style.cssText = `
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #ff6600, #ff9900);
            transition: width 0.3s;
        `
        this.smeltProgress.appendChild(smeltBar)
        smeltBarContainer.appendChild(this.smeltProgress)
        progressContainer.appendChild(smeltBarContainer)

        // Прогресс топлива
        const fuelBarContainer = document.createElement('div')
        fuelBarContainer.innerHTML = '<div style="font-size: 12px; margin-bottom: 5px;">Fuel</div>'
        this.fuelProgress = document.createElement('div')
        this.fuelProgress.style.cssText = `
            width: 100px;
            height: 20px;
            background: rgba(255,255,255,0.1);
            border: 1px solid #666;
            border-radius: 4px;
            overflow: hidden;
        `
        const fuelBar = document.createElement('div')
        fuelBar.className = 'fuel-bar'
        fuelBar.style.cssText = `
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #ff3300, #ffaa00);
            transition: width 0.3s;
        `
        this.fuelProgress.appendChild(fuelBar)
        fuelBarContainer.appendChild(this.fuelProgress)
        progressContainer.appendChild(fuelBarContainer)

        slotsContainer.appendChild(progressContainer)

        // Output слот (справа)
        this.outputSlot = this.createSlot('Result', 'outputSlot')
        slotsContainer.appendChild(this.outputSlot)

        modal.appendChild(slotsContainer)

        // Кнопка закрытия
        this.closeBtn = document.createElement('button')
        this.closeBtn.innerText = 'Close (ESC)'
        this.closeBtn.style.cssText = `
            width: 100%;
            padding: 10px;
            background: #444;
            color: white;
            border: 1px solid #666;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        `
        this.closeBtn.onmouseenter = () => this.closeBtn.style.background = '#555'
        this.closeBtn.onmouseleave = () => this.closeBtn.style.background = '#444'
        this.closeBtn.onclick = () => this.close()
        modal.appendChild(this.closeBtn)

        document.body.appendChild(modal)
        this.modal = modal

        // БЛОКИРОВКА КЛИКОВ ВНЕ МОДАЛЬНОГО ОКНА
        // Останавливаем распространение событий мыши к noa canvas
        this.modal.addEventListener('mousedown', (e) => {
            e.preventDefault() // Предотвращаем действие по умолчанию
            e.stopPropagation() // Останавливаем распространение к игровому canvas
        })
        this.modal.addEventListener('mouseup', (e) => {
            e.preventDefault()
            e.stopPropagation()
        })
        this.modal.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
        })
        this.modal.addEventListener('contextmenu', (e) => {
            e.preventDefault() // Блокируем контекстное меню браузера
            e.stopPropagation()
        })

        // Обработка ESC
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && this.isOpen) {
                e.preventDefault()
                this.close()
            }
        })
    }

    createSlot(label, slotType) {
        const container = document.createElement('div')
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
        `

        // Метка
        const labelEl = document.createElement('div')
        labelEl.style.cssText = `
            font-size: 12px;
            margin-bottom: 5px;
            color: #aaa;
        `
        labelEl.innerText = label
        container.appendChild(labelEl)

        // Слот
        const slot = document.createElement('div')
        slot.className = 'furnace-slot'
        slot.dataset.slotType = slotType
        // Используем CSS классы для адаптивных размеров (определены в index.html)
        // width и height берутся из CSS переменной --slot-size
        slot.onmouseenter = () => slot.style.borderColor = '#999'
        slot.onmouseleave = () => slot.style.borderColor = '#666'

        // Drag and Drop обработчики
        slot.draggable = true

        slot.addEventListener('dragstart', (e) => {
            this.draggedFrom = 'furnace'
            this.draggedSlotType = slotType
            slot.style.opacity = '0.5'
            e.dataTransfer.effectAllowed = 'move'
        })

        slot.addEventListener('dragend', (e) => {
            slot.style.opacity = '1'
            this.draggedFrom = null
            this.draggedSlotType = null
        })

        slot.addEventListener('dragover', (e) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
            slot.style.borderColor = '#0f0'
        })

        slot.addEventListener('dragleave', (e) => {
            slot.style.borderColor = '#666'
        })

        slot.addEventListener('drop', (e) => {
            e.preventDefault()
            slot.style.borderColor = '#666'

            if (this.draggedFrom === 'furnace' && this.draggedSlotType !== slotType) {
                // Перемещение между слотами печки
                this.swapFurnaceSlots(this.draggedSlotType, slotType)
            } else if (this.draggedFrom === 'inventory') {
                // Перемещение из инвентаря в печку
                this.moveFromInventoryToFurnace(this.draggedSlotType, slotType)
            }
        })

        // Блокируем контекстное меню для слотов
        slot.addEventListener('contextmenu', (e) => {
            e.preventDefault()
            e.stopPropagation()
        })

        // Обработка кликов для работы с удерживаемым предметом из инвентаря
        slot.addEventListener('mousedown', (e) => {
            e.preventDefault()
            e.stopPropagation()

            if (e.button === 0) { // ЛКМ
                this.handleFurnaceSlotLeftClick(slotType)
            } else if (e.button === 2) { // ПКМ
                this.handleFurnaceSlotRightClick(slotType)
            }
        })

        container.appendChild(slot)
        // @ts-ignore - добавляем кастомное свойство для удобства
        container.slotElement = slot
        return container
    }

    /**
     * Открыть UI печки
     */
    open(furnaceData) {
        this.isOpen = true
        this.currentFurnace = furnaceData
        this.modal.style.display = 'block'

        // Разблокировать курсор
        this.noa.container.setPointerLock(false)

        // Открываем инвентарь вместе с печкой
        if (window.gameInventoryUI && !window.gameInventoryUI.isOpen) {
            window.gameInventoryUI.toggleInventory(true)
        }

        // Добавляем класс для изменения позиции инвентаря
        const inventoryModal = document.getElementById('inventory-modal')
        if (inventoryModal) {
            inventoryModal.classList.add('with-furnace')
        }

        // Привязать обработчики кликов к слотам
        this.setupSlotHandlers()

        // Отрисовать текущее состояние
        this.render()
    }

    /**
     * Настройка обработчиков кликов для слотов
     * Примечание: обработчики уже настроены в createSlot() через mousedown
     * Этот метод оставлен пустым для обратной совместимости
     */
    setupSlotHandlers() {
        // Обработчики кликов настроены в createSlot() через mousedown событие
        // handleFurnaceSlotLeftClick и handleFurnaceSlotRightClick обрабатывают все клики
    }

    /**
     * Обработка ЛКМ по слоту печки (работа с удерживаемым предметом)
     */
    handleFurnaceSlotLeftClick(slotType) {
        if (!this.currentFurnace) return

        const inventoryUI = window['gameInventoryUI']
        if (!inventoryUI) return

        const furnaceSlot = this.currentFurnace[slotType]
        const heldItem = inventoryUI.heldItem

        // Если ничего не держим
        if (!heldItem) {
            // Берем весь стек из печки
            if (furnaceSlot.item && furnaceSlot.count > 0) {
                inventoryUI.heldItem = {
                    item: furnaceSlot.item,
                    count: furnaceSlot.count
                }
                furnaceSlot.item = null
                furnaceSlot.count = 0

                if (window.gameFurnaceManager) {
                    window.gameFurnaceManager.updateFurnaceState(this.currentFurnace)
                }

                inventoryUI.renderHeldItem()
                this.render()
            }
        } else {
            // Держим предмет - кладем в печку
            // Проверяем можно ли положить в этот слот
            if (slotType === 'outputSlot') return // В output нельзя класть

            if (!this.canPlaceInSlot(slotType, heldItem.item)) return

            if (!furnaceSlot.item || furnaceSlot.count === 0) {
                // Слот пустой - кладем весь стек
                furnaceSlot.item = heldItem.item
                furnaceSlot.count = heldItem.count
                inventoryUI.heldItem = null
                inventoryUI.heldSlotIndex = null
            } else if (furnaceSlot.item === heldItem.item) {
                // Тот же предмет - объединяем стеки (макс 64)
                const canAdd = Math.min(heldItem.count, 64 - furnaceSlot.count)
                if (canAdd > 0) {
                    furnaceSlot.count += canAdd
                    heldItem.count -= canAdd

                    if (heldItem.count === 0) {
                        inventoryUI.heldItem = null
                        inventoryUI.heldSlotIndex = null
                    }
                }
            } else {
                // Разные предметы - меняем местами
                const tempItem = furnaceSlot.item
                const tempCount = furnaceSlot.count

                furnaceSlot.item = heldItem.item
                furnaceSlot.count = heldItem.count

                inventoryUI.heldItem.item = tempItem
                inventoryUI.heldItem.count = tempCount
            }

            if (window.gameFurnaceManager) {
                window.gameFurnaceManager.updateFurnaceState(this.currentFurnace)
            }

            inventoryUI.renderHeldItem()
            this.render()
        }
    }

    /**
     * Обработка ПКМ по слоту печки (по одному предмету)
     */
    handleFurnaceSlotRightClick(slotType) {
        if (!this.currentFurnace) return

        const inventoryUI = window['gameInventoryUI']
        if (!inventoryUI) return

        const furnaceSlot = this.currentFurnace[slotType]
        const heldItem = inventoryUI.heldItem

        // Если ничего не держим
        if (!heldItem) {
            // Берем половину стека из печки
            if (furnaceSlot.item && furnaceSlot.count > 0) {
                const takeCount = Math.ceil(furnaceSlot.count / 2)
                inventoryUI.heldItem = {
                    item: furnaceSlot.item,
                    count: takeCount
                }
                furnaceSlot.count -= takeCount

                if (furnaceSlot.count === 0) {
                    furnaceSlot.item = null
                }

                if (window.gameFurnaceManager) {
                    window.gameFurnaceManager.updateFurnaceState(this.currentFurnace)
                }

                inventoryUI.renderHeldItem()
                this.render()
            }
        } else {
            // Держим предмет - кладем 1 штуку
            // Проверяем можно ли положить в этот слот
            if (slotType === 'outputSlot') return // В output нельзя класть

            if (!this.canPlaceInSlot(slotType, heldItem.item)) return

            if (!furnaceSlot.item || furnaceSlot.count === 0) {
                // Слот пустой - кладем 1 предмет
                furnaceSlot.item = heldItem.item
                furnaceSlot.count = 1
                heldItem.count -= 1

                if (heldItem.count === 0) {
                    inventoryUI.heldItem = null
                    inventoryUI.heldSlotIndex = null
                }
            } else if (furnaceSlot.item === heldItem.item) {
                // Тот же предмет - добавляем 1 штуку (макс 64)
                if (furnaceSlot.count < 64 && heldItem.count > 0) {
                    furnaceSlot.count += 1
                    heldItem.count -= 1

                    if (heldItem.count === 0) {
                        inventoryUI.heldItem = null
                        inventoryUI.heldSlotIndex = null
                    }
                }
            }
            // Если разные предметы - ничего не делаем при ПКМ

            if (window.gameFurnaceManager) {
                window.gameFurnaceManager.updateFurnaceState(this.currentFurnace)
            }

            inventoryUI.renderHeldItem()
            this.render()
        }
    }

    /**
     * Проверка возможности положить предмет в слот
     */
    canPlaceInSlot(slotType, itemName) {
        if (slotType === 'inputSlot') {
            // В input можно класть только плавимые предметы
            return findSmeltingRecipe(itemName) !== null
        } else if (slotType === 'fuelSlot') {
            // В fuel только топливо
            return getFuelValue(itemName) > 0
        } else if (slotType === 'outputSlot') {
            // В output ничего класть нельзя
            return false
        }
        return false
    }

    /**
     * Закрыть UI печки
     */
    close() {
        this.isOpen = false
        this.modal.style.display = 'none'
        this.currentFurnace = null

        // Убираем класс для возврата инвентаря в центр
        const inventoryModal = document.getElementById('inventory-modal')
        if (inventoryModal) {
            inventoryModal.classList.remove('with-furnace')
        }

        // Закрываем инвентарь вместе с печкой
        if (window.gameInventoryUI && window.gameInventoryUI.isOpen) {
            window.gameInventoryUI.toggleInventory(false)
        }

        // Заблокировать курсор
        this.noa.container.setPointerLock(true)
    }

    /**
     * Отрисовка UI
     */
    render() {
        if (!this.currentFurnace) return

        // Отрисовать слоты
        this.renderSlot(this.inputSlot, this.currentFurnace.inputSlot)
        this.renderSlot(this.fuelSlot, this.currentFurnace.fuelSlot)
        this.renderSlot(this.outputSlot, this.currentFurnace.outputSlot)

        // Обновить прогресс-бары
        const smeltBar = /** @type {HTMLElement} */ (this.smeltProgress.querySelector('.smelt-bar'))
        const fuelBar = /** @type {HTMLElement} */ (this.fuelProgress.querySelector('.fuel-bar'))

        const smeltPct = this.currentFurnace.smeltProgress || 0
        const fuelPct = this.currentFurnace.fuelProgress || 0

        if (smeltBar) smeltBar.style.width = `${smeltPct * 100}%`
        if (fuelBar) fuelBar.style.width = `${fuelPct * 100}%`
    }

    /**
     * Отрисовка одного слота
     */
    renderSlot(slotContainer, slotData) {
        const slotEl = slotContainer.querySelector('.furnace-slot')
        if (!slotEl) return

        // Очистить содержимое
        slotEl.innerHTML = ''

        if (slotData.item && slotData.count > 0) {
            const itemDef = items[slotData.item]

            if (itemDef) {
                // Иконка предмета - размер берётся из CSS переменной
                const icon = document.createElement('div')
                icon.className = 'slot-icon'
                // width и height берутся из CSS переменной --slot-icon-size
                slotEl.appendChild(icon)

                // Получаем реальный размер иконки из CSS переменной
                const iconSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--slot-icon-size')) || 32

                // Применяем текстуру (универсальная функция)
                applyItemIcon(icon, itemDef, iconSize)

                // Количество
                if (slotData.count > 1) {
                    const count = document.createElement('div')
                    count.className = 'slot-count'
                    count.innerText = slotData.count.toString()
                    slotEl.appendChild(count)
                }
            }
        }
    }

    /**
     * Поменять местами слоты в печке
     */
    swapFurnaceSlots(fromSlot, toSlot) {
        if (!this.currentFurnace) return

        const from = this.currentFurnace[fromSlot]
        const to = this.currentFurnace[toSlot]

        // Сохраняем данные
        const tempItem = from.item
        const tempCount = from.count

        // Меняем местами
        from.item = to.item
        from.count = to.count

        to.item = tempItem
        to.count = tempCount

        this.render()
    }

    /**
     * Переместить предмет из инвентаря в печку
     */
    moveFromInventoryToFurnace(inventorySlotIndex, furnaceSlotType) {
        if (!this.currentFurnace || !window.gameInventory) return

        const inventorySlot = window.gameInventory.slots[inventorySlotIndex]
        const furnaceSlot = this.currentFurnace[furnaceSlotType]

        if (inventorySlot.isEmpty()) return

        // Проверка что можно положить в этот слот
        if (!this.canPlaceInSlot(furnaceSlotType, inventorySlot.item)) return

        // Если слот печки пустой - перемещаем весь стек
        if (!furnaceSlot.item || furnaceSlot.count === 0) {
            furnaceSlot.item = inventorySlot.item
            furnaceSlot.count = inventorySlot.count

            inventorySlot.item = null
            inventorySlot.count = 0
        } else if (furnaceSlot.item === inventorySlot.item) {
            // Если тот же предмет - объединяем стеки
            furnaceSlot.count += inventorySlot.count
            inventorySlot.item = null
            inventorySlot.count = 0
        } else {
            // Если разные предметы - меняем местами
            const tempItem = furnaceSlot.item
            const tempCount = furnaceSlot.count

            furnaceSlot.item = inventorySlot.item
            furnaceSlot.count = inventorySlot.count

            inventorySlot.item = tempItem
            inventorySlot.count = tempCount
        }

        // Обновляем состояние печки (важно для возобновления плавки)
        if (window.gameFurnaceManager) {
            window.gameFurnaceManager.updateFurnaceState(this.currentFurnace)
        }

        // Обновляем UI
        if (window.gameInventoryUI) {
            window.gameInventoryUI.refresh()
        }
        this.render()
    }

    /**
     * Обновить UI (вызывается каждый тик если открыта)
     */
    update() {
        if (this.isOpen && this.currentFurnace) {
            this.render()
        }
    }
}
