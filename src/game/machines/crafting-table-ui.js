/**
 * UI Верстака
 * Интерфейс для крафта предметов в верстаке
 */

import { findShapedRecipe, findSingleSlotRecipe } from '../items/crafting-recipes.js'
import { items } from '../items/item-registry.js'
import { applyItemIcon } from '../items/item-icon-3d.js'

export class CraftingTableUI {
    constructor(noa) {
        this.noa = noa
        this.isOpen = false
        this.craftingSlots = [] // 3x3 сетка крафта (9 слотов)
        this.resultSlot = null // Результат крафта

        // DOM Элементы
        this.modal = null
        this.closeBtn = null

        // Drag and Drop состояние
        this.draggedFrom = null // 'crafting' или 'inventory'
        this.draggedSlotIndex = null // Индекс слота

        this.init()
    }

    init() {
        // Инициализация слотов крафта (3x3 + результат)
        for (let i = 0; i < 9; i++) {
            this.craftingSlots.push({ item: null, count: 0 })
        }
        this.resultSlot = { item: null, count: 0 }

        // Создаем модальное окно верстака
        this.createModal()
        this.setupInputs()
    }

    setupInputs() {
        // Обработчик клавиатуры для ESC
        window.addEventListener('keydown', (e) => {
            // ESC - Закрыть верстак
            if (e.code === 'Escape' && this.isOpen) {
                e.preventDefault()
                this.close()
            }
        })
    }

    createModal() {
        // Создаем модальное окно
        const modal = document.createElement('div')
        modal.id = 'crafting-table-modal'
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
        title.innerText = '🔨 Crafting Table'
        modal.appendChild(title)

        // Контейнер сетки крафта и результата
        const craftingContainer = document.createElement('div')
        craftingContainer.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 30px;
            margin-bottom: 20px;
        `

        // Сетка крафта 3x3
        const gridContainer = document.createElement('div')
        gridContainer.className = 'crafting-grid'
        // grid-template использует CSS переменную --slot-size

        // Создаем 9 слотов для сетки крафта
        this.craftingSlotElements = []
        for (let i = 0; i < 9; i++) {
            const slot = this.createCraftingSlot(i)
            gridContainer.appendChild(slot)
            this.craftingSlotElements.push(slot)
        }

        craftingContainer.appendChild(gridContainer)

        // Стрелка
        const arrow = document.createElement('div')
        arrow.style.cssText = `
            font-size: 32px;
            color: #999;
        `
        arrow.innerText = '→'
        craftingContainer.appendChild(arrow)

        // Слот результата
        const resultContainer = document.createElement('div')
        resultContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
        `

        const resultLabel = document.createElement('div')
        resultLabel.style.cssText = `
            font-size: 12px;
            margin-bottom: 5px;
            color: #aaa;
        `
        resultLabel.innerText = 'Result'
        resultContainer.appendChild(resultLabel)

        this.resultSlotElement = this.createResultSlot()
        resultContainer.appendChild(this.resultSlotElement)

        craftingContainer.appendChild(resultContainer)
        modal.appendChild(craftingContainer)

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
    }

    createCraftingSlot(index) {
        const slot = document.createElement('div')
        slot.className = 'crafting-slot'
        slot.dataset.slotIndex = index
        // Размеры берутся из CSS переменной --slot-size (определена в index.html)
        slot.onmouseenter = () => slot.style.borderColor = '#999'
        slot.onmouseleave = () => slot.style.borderColor = '#666'

        // Drag and Drop обработчики
        slot.draggable = true

        slot.addEventListener('dragstart', (e) => {
            this.draggedFrom = 'crafting'
            this.draggedSlotIndex = index
            slot.style.opacity = '0.5'
            e.dataTransfer.effectAllowed = 'move'
        })

        slot.addEventListener('dragend', (e) => {
            slot.style.opacity = '1'
            this.draggedFrom = null
            this.draggedSlotIndex = null
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

            if (this.draggedFrom === 'crafting' && this.draggedSlotIndex !== index) {
                // Перемещение между слотами верстака
                this.swapCraftingSlots(this.draggedSlotIndex, index)
            } else if (this.draggedFrom === 'inventory') {
                // Перемещение из инвентаря в верстак
                this.moveFromInventoryToCrafting(this.draggedSlotIndex, index)
            }
        })

        // Блокируем контекстное меню для слотов
        slot.addEventListener('contextmenu', (e) => {
            e.preventDefault()
            e.stopPropagation()
        })

        // Обработка кликов
        slot.addEventListener('mousedown', (e) => {
            e.preventDefault()
            e.stopPropagation()

            if (e.button === 0) { // ЛКМ
                this.handleCraftingSlotLeftClick(index)
            } else if (e.button === 2) { // ПКМ
                this.handleCraftingSlotRightClick(index)
            }
        })

        return slot
    }

    createResultSlot() {
        const slot = document.createElement('div')
        slot.className = 'result-slot crafting-slot'
        // Размеры берутся из CSS переменной --slot-size (определена в index.html)
        slot.onmouseenter = () => slot.style.borderColor = '#ccc'
        slot.onmouseleave = () => slot.style.borderColor = '#999'

        // Блокируем контекстное меню для слота результата
        slot.addEventListener('contextmenu', (e) => {
            e.preventDefault()
            e.stopPropagation()
        })

        // Результат можно только забирать, не класть
        slot.addEventListener('mousedown', (e) => {
            e.preventDefault()
            e.stopPropagation()

            if (e.button === 0) { // ЛКМ - забрать результат
                this.handleResultSlotClick()
            }
        })

        return slot
    }

    /**
     * Открыть UI верстака
     */
    open() {
        this.isOpen = true
        this.modal.style.display = 'block'

        // Разблокировать курсор
        this.noa.container.setPointerLock(false)

        // Открываем инвентарь вместе с верстаком
        if (window.gameInventoryUI && !window.gameInventoryUI.isOpen) {
            window.gameInventoryUI.toggleInventory(true)
        }

        // Добавляем класс для изменения позиции инвентаря
        const inventoryModal = document.getElementById('inventory-modal')
        if (inventoryModal) {
            inventoryModal.classList.add('with-crafting-table')
        }

        // Отрисовать текущее состояние
        this.render()
    }

    /**
     * Закрыть UI верстака
     */
    close() {
        this.isOpen = false
        this.modal.style.display = 'none'

        // Вернуть предметы из сетки крафта обратно в инвентарь
        this.returnCraftingItemsToInventory()

        // Убираем класс для возврата инвентаря в центр
        const inventoryModal = document.getElementById('inventory-modal')
        if (inventoryModal) {
            inventoryModal.classList.remove('with-crafting-table')
        }

        // Закрываем инвентарь вместе с верстаком
        if (window.gameInventoryUI && window.gameInventoryUI.isOpen) {
            window.gameInventoryUI.toggleInventory(false)
        }

        // Заблокировать курсор
        this.noa.container.setPointerLock(true)
    }

    /**
     * Вернуть предметы из сетки крафта в инвентарь при закрытии
     */
    returnCraftingItemsToInventory() {
        if (!window.gameInventory) return

        for (let i = 0; i < 9; i++) {
            const slot = this.craftingSlots[i]
            if (slot.item && slot.count > 0) {
                window['gameInventory'].addItem(slot.item, slot.count, {
                    getItem: (n) => window['items'] ? window['items'][n] : null
                })
                slot.item = null
                slot.count = 0
            }
        }

        // Обновляем UI инвентаря
        if (window.gameInventoryUI) {
            window.gameInventoryUI.refresh()
        }
    }

    /**
     * Обработка ЛКМ по слоту крафта
     */
    handleCraftingSlotLeftClick(index) {
        const inventoryUI = window['gameInventoryUI']
        if (!inventoryUI) return

        const craftingSlot = this.craftingSlots[index]
        const heldItem = inventoryUI.heldItem

        // Если ничего не держим
        if (!heldItem) {
            // Берем весь стек из верстака
            if (craftingSlot.item && craftingSlot.count > 0) {
                inventoryUI.heldItem = {
                    item: craftingSlot.item,
                    count: craftingSlot.count
                }
                craftingSlot.item = null
                craftingSlot.count = 0

                inventoryUI.renderHeldItem()
                this.render()
            }
        } else {
            // Держим предмет - кладем в верстак
            if (!craftingSlot.item || craftingSlot.count === 0) {
                // Слот пустой - кладем весь стек
                craftingSlot.item = heldItem.item
                craftingSlot.count = heldItem.count
                inventoryUI.heldItem = null
                inventoryUI.heldSlotIndex = null
            } else if (craftingSlot.item === heldItem.item) {
                // Тот же предмет - объединяем стеки (макс 64)
                const canAdd = Math.min(heldItem.count, 64 - craftingSlot.count)
                if (canAdd > 0) {
                    craftingSlot.count += canAdd
                    heldItem.count -= canAdd

                    if (heldItem.count === 0) {
                        inventoryUI.heldItem = null
                        inventoryUI.heldSlotIndex = null
                    }
                }
            } else {
                // Разные предметы - меняем местами
                const tempItem = craftingSlot.item
                const tempCount = craftingSlot.count

                craftingSlot.item = heldItem.item
                craftingSlot.count = heldItem.count

                inventoryUI.heldItem.item = tempItem
                inventoryUI.heldItem.count = tempCount
            }

            inventoryUI.renderHeldItem()
            this.render()
        }
    }

    /**
     * Обработка ПКМ по слоту крафта (по одному предмету)
     */
    handleCraftingSlotRightClick(index) {
        const inventoryUI = window['gameInventoryUI']
        if (!inventoryUI) return

        const craftingSlot = this.craftingSlots[index]
        const heldItem = inventoryUI.heldItem

        // Если ничего не держим
        if (!heldItem) {
            // Берем половину стека из верстака
            if (craftingSlot.item && craftingSlot.count > 0) {
                const takeCount = Math.ceil(craftingSlot.count / 2)
                inventoryUI.heldItem = {
                    item: craftingSlot.item,
                    count: takeCount
                }
                craftingSlot.count -= takeCount

                if (craftingSlot.count === 0) {
                    craftingSlot.item = null
                }

                inventoryUI.renderHeldItem()
                this.render()
            }
        } else {
            // Держим предмет - кладем 1 штуку
            if (!craftingSlot.item || craftingSlot.count === 0) {
                // Слот пустой - кладем 1 предмет
                craftingSlot.item = heldItem.item
                craftingSlot.count = 1
                heldItem.count -= 1

                if (heldItem.count === 0) {
                    inventoryUI.heldItem = null
                    inventoryUI.heldSlotIndex = null
                }
            } else if (craftingSlot.item === heldItem.item) {
                // Тот же предмет - добавляем 1 штуку (макс 64)
                if (craftingSlot.count < 64 && heldItem.count > 0) {
                    craftingSlot.count += 1
                    heldItem.count -= 1

                    if (heldItem.count === 0) {
                        inventoryUI.heldItem = null
                        inventoryUI.heldSlotIndex = null
                    }
                }
            }
            // Если разные предметы - ничего не делаем при ПКМ

            inventoryUI.renderHeldItem()
            this.render()
        }
    }

    /**
     * Обработка клика по результату (забрать скрафченный предмет)
     */
    handleResultSlotClick() {
        if (!this.resultSlot.item || this.resultSlot.count === 0) return
        if (!window.gameInventory) return

        // Добавляем результат в инвентарь
        window.gameInventory.addItem(this.resultSlot.item, this.resultSlot.count, {
            getItem: (n) => items[n]
        })

        // Уменьшаем ингредиенты на 1 в каждом слоте
        for (let i = 0; i < 9; i++) {
            if (this.craftingSlots[i].item && this.craftingSlots[i].count > 0) {
                this.craftingSlots[i].count -= 1
                if (this.craftingSlots[i].count === 0) {
                    this.craftingSlots[i].item = null
                }
            }
        }

        // Обновляем UI
        if (window.gameInventoryUI) {
            window.gameInventoryUI.refresh()
        }
        this.render()
        this.checkCraftingRecipe()
    }

    /**
     * Поменять местами слоты в верстаке
     */
    swapCraftingSlots(fromIndex, toIndex) {
        const from = this.craftingSlots[fromIndex]
        const to = this.craftingSlots[toIndex]

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
     * Переместить предмет из инвентаря в верстак
     */
    moveFromInventoryToCrafting(inventorySlotIndex, craftingSlotIndex) {
        if (!window.gameInventory) return

        const inventorySlot = window.gameInventory.slots[inventorySlotIndex]
        const craftingSlot = this.craftingSlots[craftingSlotIndex]

        if (inventorySlot.isEmpty()) return

        // Если слот верстака пустой - перемещаем весь стек
        if (!craftingSlot.item || craftingSlot.count === 0) {
            craftingSlot.item = inventorySlot.item
            craftingSlot.count = inventorySlot.count

            inventorySlot.item = null
            inventorySlot.count = 0
        } else if (craftingSlot.item === inventorySlot.item) {
            // Если тот же предмет - объединяем стеки
            craftingSlot.count += inventorySlot.count
            inventorySlot.item = null
            inventorySlot.count = 0
        } else {
            // Если разные предметы - меняем местами
            const tempItem = craftingSlot.item
            const tempCount = craftingSlot.count

            craftingSlot.item = inventorySlot.item
            craftingSlot.count = inventorySlot.count

            inventorySlot.item = tempItem
            inventorySlot.count = tempCount
        }

        // Обновляем UI
        if (window.gameInventoryUI) {
            window.gameInventoryUI.refresh()
        }
        this.render()
    }

    /**
     * Проверка рецепта в верстаке 3×3
     */
    checkCraftingRecipe() {
        // Сначала проверяем SINGLE_SLOT рецепты (дерево -> доски)
        const singleSlotRecipe = findSingleSlotRecipe(this.craftingSlots)

        if (singleSlotRecipe) {
            this.resultSlot.item = singleSlotRecipe.result
            this.resultSlot.count = singleSlotRecipe.count
            return
        }

        // Затем проверяем SHAPED рецепты (сетка 3×3)
        const grid = [
            [this.craftingSlots[0].item || '', this.craftingSlots[1].item || '', this.craftingSlots[2].item || ''],
            [this.craftingSlots[3].item || '', this.craftingSlots[4].item || '', this.craftingSlots[5].item || ''],
            [this.craftingSlots[6].item || '', this.craftingSlots[7].item || '', this.craftingSlots[8].item || '']
        ]

        const recipe = findShapedRecipe(grid)

        if (recipe) {
            this.resultSlot.item = recipe.result
            this.resultSlot.count = recipe.count
        } else {
            this.resultSlot.item = null
            this.resultSlot.count = 0
        }
    }

    /**
     * Отрисовка UI
     */
    render() {
        // Отрисовать все слоты крафта
        for (let i = 0; i < 9; i++) {
            this.renderSlot(this.craftingSlotElements[i], this.craftingSlots[i])
        }

        // Проверяем рецепт и отрисовываем результат
        this.checkCraftingRecipe()
        this.renderSlot(this.resultSlotElement, this.resultSlot)
    }

    /**
     * Отрисовка одного слота
     */
    renderSlot(slotEl, slotData) {
        if (!slotEl) return

        // Очистить содержимое
        slotEl.innerHTML = ''

        if (slotData.item && slotData.count > 0) {
            // Получаем предмет из глобального items или локального
            const itemsRegistry = window['items'] || items
            if (!itemsRegistry) return

            const itemDef = itemsRegistry[slotData.item]

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
     * Обновить UI (вызывается каждый тик если открыта)
     */
    update() {
        if (this.isOpen) {
            this.render()
        }
    }
}
