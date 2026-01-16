/**
 * UI Инвентаря
 * Управление отображением инвентаря и взаимодействием с пользователем
 */

import { items } from './item-registry.js'
import { recipes, findShapedRecipe, findSingleSlotRecipe } from './crafting-recipes.js'
import { create3DBlockIcon, create3DOreIcon, create3DStoneIcon, create3DDirtIcon, create3DSandIcon, create3DSandstoneIcon, create3DWoodIcon, createIngotIcon, createPlanksIcon, createToolIcon, createAmuletIcon, applyItemIcon } from './item-icon-3d.js'

export class InventoryUI {
    constructor(inventory, noa) {
        this.inventory = inventory
        this.noa = noa
        this.isOpen = false

        // DOM Элементы
        this.hotbarContainer = document.getElementById('hotbar')
        this.modal = document.getElementById('inventory-modal')
        this.mainInventoryGrid = document.getElementById('main-inventory')
        this.hotbarInventoryGrid = document.getElementById('inventory-hotbar')
        this.closeBtn = document.querySelector('.close-inventory')

        // Мини-верстак 2x2
        this.miniCraftingGrid = document.getElementById('mini-crafting-grid')
        this.miniCraftingResult = document.getElementById('mini-crafting-result')
        this.craftingList = document.getElementById('items-list')
        this.craftingSlots = [
            { item: null, count: 0 },
            { item: null, count: 0 },
            { item: null, count: 0 },
            { item: null, count: 0 }
        ]
        this.craftingResultSlot = { item: null, count: 0 }

        // Окно списка предметов (первое окно)
        this.itemsModal = document.getElementById('items-modal')
        this.craftsButton = document.getElementById('crafts-button')
        this.closeItemsButton = document.getElementById('close-items')

        // Окно деталей рецепта (второе окно)
        this.recipeDetailModal = document.getElementById('recipe-detail-modal')
        this.closeRecipeDetailButton = document.getElementById('close-recipe-detail')

        // Элементы для отображения удерживаемого предмета на экране
        this.heldItemDisplayContainer = document.getElementById('held-item-display')
        this.heldItemDisplayIcon = document.getElementById('held-item-icon')
        this.heldItemDisplayCount = document.getElementById('held-item-count')

        // Drag and Drop состояние
        this.draggedSlotIndex = null

        // Удерживаемый предмет (для механики Minecraft)
        this.heldItem = null  // { item: 'iron_ore', count: 5 }
        this.heldSlotIndex = null
        this._lastMouseEvent = null

        // Глобальное отслеживание позиции мыши для корректного позиционирования удерживаемого предмета
        document.addEventListener('mousemove', (e) => {
            this._lastMouseEvent = e
        })

        this.init()
    }

    init() {
        // Начальная отрисовка
        this.renderHotbar()

        // Настройка ввода
        this.setupInputs()

        // Кнопка закрытия
        this.closeBtn.addEventListener('click', () => this.toggleInventory(false))

        // Кнопка Crafts - открывает окно списка предметов
        if (this.craftsButton) {
            this.craftsButton.addEventListener('click', () => this.openItemsModal())
        }

        // Кнопка закрытия списка предметов
        if (this.closeItemsButton) {
            this.closeItemsButton.addEventListener('click', () => this.closeItemsModal())
        }

        // Закрытие списка предметов по клику вне окна
        if (this.itemsModal) {
            this.itemsModal.addEventListener('click', (e) => {
                if (e.target === this.itemsModal) {
                    this.closeItemsModal()
                }
            })
        }

        // Кнопка "Назад" в окне деталей рецепта
        if (this.closeRecipeDetailButton) {
            this.closeRecipeDetailButton.addEventListener('click', () => this.closeRecipeDetailModal())
        }

        // Закрытие деталей рецепта по клику вне окна
        if (this.recipeDetailModal) {
            this.recipeDetailModal.addEventListener('click', (e) => {
                if (e.target === this.recipeDetailModal) {
                    this.closeRecipeDetailModal()
                }
            })
        }

        // БЛОКИРОВКА КЛИКОВ ВНЕ МОДАЛЬНОГО ОКНА
        // Слушаем все клики на модальном окне и останавливаем их распространение к noa canvas
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

        // БЛОКИРОВКА КЛИКОВ ДЛЯ ITEMS MODAL
        if (this.itemsModal) {
            this.itemsModal.addEventListener('mousedown', (e) => {
                e.preventDefault()
                e.stopPropagation()
            })
            this.itemsModal.addEventListener('mouseup', (e) => {
                e.preventDefault()
                e.stopPropagation()
            })
            this.itemsModal.addEventListener('contextmenu', (e) => {
                e.preventDefault()
                e.stopPropagation()
            })
        }

        // БЛОКИРОВКА КЛИКОВ ДЛЯ RECIPE DETAIL MODAL
        if (this.recipeDetailModal) {
            this.recipeDetailModal.addEventListener('mousedown', (e) => {
                e.preventDefault()
                e.stopPropagation()
            })
            this.recipeDetailModal.addEventListener('mouseup', (e) => {
                e.preventDefault()
                e.stopPropagation()
            })
            this.recipeDetailModal.addEventListener('contextmenu', (e) => {
                e.preventDefault()
                e.stopPropagation()
            })
        }
    }

    setupInputs() {
        // Клавиатура
        window.addEventListener('keydown', (e) => {
            // Игнорируем если фокус в поле ввода (чат и т.д.)
            if (document.activeElement.tagName === 'INPUT') return

            // T - Открыть/Закрыть инвентарь (НЕ работает если открыта печка или верстак)
            if (e.code === 'KeyT') {
                // Игнорируем если открыта печка или верстак
                if (window['gameFurnaceUI'] && window['gameFurnaceUI'].isOpen) return
                if (window['gameCraftingTableUI'] && window['gameCraftingTableUI'].isOpen) return

                this.toggleInventory()
            }

            // ESC - Закрыть инвентарь
            if (e.code === 'Escape' && this.isOpen) {
                e.preventDefault()
                this.toggleInventory(false)
            }

            // 1-9 - Выбор слота Hotbar
            if (!this.isOpen && e.key >= '1' && e.key <= '9') {
                const index = parseInt(e.key) - 1
                this.inventory.selectHotbarSlot(index)
                this.renderHotbar()
            }
        })

        // Колесо мыши - Прокрутка Hotbar
        window.addEventListener('wheel', (e) => {
            if (this.isOpen) return

            const direction = Math.sign(e.deltaY)
            let newIndex = this.inventory.selectedHotbarSlot + direction

            if (newIndex > 8) newIndex = 0
            if (newIndex < 0) newIndex = 8

            this.inventory.selectHotbarSlot(newIndex)
            this.renderHotbar()
        })
    }

    /**
     * Открыть/Закрыть инвентарь
     */
    toggleInventory(forceState) {
        this.isOpen = forceState !== undefined ? forceState : !this.isOpen

        if (this.isOpen) {
            this.modal.classList.add('open')
            this.renderModal()
            this.renderMiniCrafting() // Отрисовка мини-крафта
            // Разблокируем курсор
            this.noa.container.setPointerLock(false)
        } else {
            this.modal.classList.remove('open')

            // Если закрываем инвентарь с удерживаемым предметом - возвращаем его обратно
            if (this.heldItem) {
                const slot = this.inventory.slots[this.heldSlotIndex]
                if (slot && slot.isEmpty()) {
                    slot.item = this.heldItem.item
                    slot.count = this.heldItem.count
                } else {
                    // Если слот занят - ищем первый пустой
                    const emptySlot = this.inventory.slots.find(s => s.isEmpty())
                    if (emptySlot) {
                        emptySlot.item = this.heldItem.item
                        emptySlot.count = this.heldItem.count
                    }
                }
                this.heldItem = null
                this.heldSlotIndex = null
            }

            // Удаляем визуализацию удерживаемого предмета
            const heldEl = document.getElementById('held-item-cursor')
            if (heldEl) {
                heldEl.remove()
            }

            // Блокируем курсор обратно (если игра активна)
            this.noa.container.setPointerLock(true)
        }
    }

    /**
     * Отрисовка Hotbar (внизу экрана)
     */
    renderHotbar() {
        this.hotbarContainer.innerHTML = ''
        const slots = this.inventory.getHotbarSlots()

        slots.forEach((slot, index) => {
            const el = this.createSlotElement(slot, index, true)
            if (index === this.inventory.selectedHotbarSlot) {
                el.classList.add('selected')
            }
            this.hotbarContainer.appendChild(el)
        })
        this._updateHeldItemDisplay() // Update the display when hotbar changes
    }

    /**
     * Обновление отображения удерживаемого предмета (справа внизу)
     */
    _updateHeldItemDisplay() {
        const selectedSlot = this.inventory.getSelectedSlot()
        const heldItemContainer = this.heldItemDisplayContainer
        const heldItemIcon = this.heldItemDisplayIcon
        const heldItemCount = this.heldItemDisplayCount

        // Очищаем предыдущее состояние
        heldItemIcon.innerHTML = ''
        heldItemCount.innerHTML = ''

        if (selectedSlot && !selectedSlot.isEmpty()) {
            const itemDef = items[selectedSlot.item]
            if (!itemDef) {
                heldItemContainer.classList.remove('visible')
                return
            }

            // Получаем размеры для большой иконки
            const largeIconSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--slot-icon-size')) * 2.5 || 80 // x2.5 original size

            // Применяем текстуру к иконке
            applyItemIcon(heldItemIcon, itemDef, largeIconSize)

            // Количество
            if (selectedSlot.count > 1) {
                heldItemCount.innerText = selectedSlot.count.toString()
            } else {
                heldItemCount.innerText = ''
            }

            heldItemContainer.classList.add('visible')
        } else {
            heldItemContainer.classList.remove('visible')
        }
    }

    /**
     * Отрисовка полного инвентаря (в модальном окне)
     */
    renderModal() {
        // Основной инвентарь (верхняя часть)
        this.mainInventoryGrid.innerHTML = ''
        const mainSlots = this.inventory.getMainSlots()
        mainSlots.forEach((slot, index) => {
            // Индекс смещен на 9, так как основные слоты начинаются с 9
            const el = this.createSlotElement(slot, index + 9, false)
            this.mainInventoryGrid.appendChild(el)
        })

        // Hotbar (нижняя часть модального окна)
        this.hotbarInventoryGrid.innerHTML = ''
        const hotbarSlots = this.inventory.getHotbarSlots()
        hotbarSlots.forEach((slot, index) => {
            const el = this.createSlotElement(slot, index, false)
            this.hotbarInventoryGrid.appendChild(el)
        })

        // Отображаем удерживаемый предмет
        this.renderHeldItem()
    }

    /**
     * Отрисовка списка рецептов (Recipe Book)
     */
    renderRecipeBookList() {
        if (!this.craftingList) return

        this.craftingList.innerHTML = ''

        // Собираем все доступные предметы из инвентаря для проверки рецептов
        const allSlots = this.inventory.slots
        const availableItems = {}

        for (const slot of allSlots) {
            if (!slot.isEmpty()) {
                if (!availableItems[slot.item]) availableItems[slot.item] = 0
                availableItems[slot.item] += slot.count
            }
        }

        // Фильтруем рецепты, которые можно скрафтить
        const craftableRecipes = recipes.filter(recipe => {
            for (const req of recipe.ingredients) {
                if (!availableItems[req.item] || availableItems[req.item] < req.count) {
                    return false
                }
            }
            return true
        })

        if (craftableRecipes.length === 0) {
            this.craftingList.innerHTML = '<div style="color: #888; text-align: center; margin-top: 50px;">Нет доступных рецептов</div>'
            return
        }

        // Отрисовываем доступные рецепты
        craftableRecipes.forEach(recipe => {
            const resultItem = items[recipe.result]
            if (!resultItem) return

            const el = document.createElement('div')
            el.className = 'crafting-recipe'
            el.style.cssText = `
        display: flex; 
        align-items: center; 
        padding: 10px; 
        background: rgba(0,0,0,0.3); 
        margin-bottom: 5px; 
        border-radius: 4px; 
        cursor: pointer;
        border: 1px solid transparent;
      `

            // Иконка результата
            const icon = document.createElement('div')
            const color = resultItem.color || [1, 1, 1]
            icon.style.cssText = `
        width: 32px; 
        height: 32px; 
        background-color: rgb(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255});
        margin-right: 10px;
        border-radius: 2px;
      `

            // Название и количество
            const info = document.createElement('div')
            info.innerHTML = `
        <div style="font-weight: bold;">${resultItem.displayName} x${recipe.count}</div>
        <div style="font-size: 10px; color: #aaa;">
          ${recipe.ingredients.map(i => `${(items[i.item] && items[i.item].displayName) || i.item} x${i.count}`).join(', ')}
        </div>
      `

            el.appendChild(icon)
            el.appendChild(info)

            // Hover эффект
            el.onmouseenter = () => el.style.background = 'rgba(255,255,255,0.1)'
            el.onmouseleave = () => el.style.background = 'rgba(0,0,0,0.3)'

            // Клик - крафт
            el.onclick = () => this.craftItem(recipe)

            this.craftingList.appendChild(el)
        })
    }

    /**
     * Скрафтить предмет
     */
    craftItem(recipe) {
        // 1. Удаляем ингредиенты
        for (const req of recipe.ingredients) {
            this.inventory.removeItem(req.item, req.count)
        }

        // 2. Добавляем результат
        // Используем простой объект-заглушку для itemRegistry, так как нам нужен только getItem
        const itemRegistryStub = { getItem: (n) => items[n] }
        this.inventory.addItem(recipe.result, recipe.count, itemRegistryStub)

        // 3. Обновляем UI
        this.refresh()
    }

    /**
     * Создание DOM элемента слота
     */
    createSlotElement(slot, index, isHud) {
        const div = document.createElement('div')
        div.className = isHud ? 'hotbar-slot' : 'inventory-slot'

        // Номер слота (только для HUD)
        if (isHud) {
            const num = document.createElement('div')
            num.className = 'slot-number'
            num.innerText = index + 1
            div.appendChild(num)
        }

        // Содержимое слота
        if (!slot.isEmpty()) {
            const itemDef = items[slot.item]

            if (itemDef) {
                // Иконка - 3D модель или цветной квадрат
                const icon = document.createElement('div')
                icon.className = 'slot-icon'

                if (itemDef.useIngotIcon && itemDef.ingotType) {
                    // Создаем иконку слитка из PNG текстуры (асинхронно)
                    createIngotIcon(itemDef.ingotType, 48).then(canvas => {
                        icon.style.backgroundColor = 'transparent'
                        icon.style.backgroundImage = `url(${canvas.toDataURL()})`
                        icon.style.backgroundSize = 'contain'
                        icon.style.backgroundRepeat = 'no-repeat'
                        icon.style.backgroundPosition = 'center'
                    })
                    // Пока загружается, показываем цвет
                    const color = itemDef.color || [1, 1, 1]
                    icon.style.backgroundColor = `rgb(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255})`
                } else if (itemDef.use3DStoneIcon) {
                    // Создаем 3D иконку камня со сгенерированной текстурой (синхронно)
                    const canvas = create3DStoneIcon(48)
                    icon.style.backgroundColor = 'transparent'
                    icon.style.backgroundImage = `url(${canvas.toDataURL()})`
                    icon.style.backgroundSize = 'contain'
                    icon.style.backgroundRepeat = 'no-repeat'
                    icon.style.backgroundPosition = 'center'
                } else if (itemDef.use3DDirtIcon) {
                    // Создаем 3D иконку земли
                    const canvas = create3DDirtIcon(48)
                    icon.style.backgroundColor = 'transparent'
                    icon.style.backgroundImage = `url(${canvas.toDataURL()})`
                    icon.style.backgroundSize = 'contain'
                    icon.style.backgroundRepeat = 'no-repeat'
                    icon.style.backgroundPosition = 'center'
                } else if (itemDef.use3DSandIcon) {
                    // Создаем 3D иконку песка
                    const canvas = create3DSandIcon(48)
                    icon.style.backgroundColor = 'transparent'
                    icon.style.backgroundImage = `url(${canvas.toDataURL()})`
                    icon.style.backgroundSize = 'contain'
                    icon.style.backgroundRepeat = 'no-repeat'
                    icon.style.backgroundPosition = 'center'
                } else if (itemDef.use3DSandstoneIcon) {
                    // Создаем 3D иконку песчаника
                    const canvas = create3DSandstoneIcon(48)
                    icon.style.backgroundColor = 'transparent'
                    icon.style.backgroundImage = `url(${canvas.toDataURL()})`
                    icon.style.backgroundSize = 'contain'
                    icon.style.backgroundRepeat = 'no-repeat'
                    icon.style.backgroundPosition = 'center'
                } else if (itemDef.use3DOreIcon && itemDef.oreType) {
                    // Создаем 3D иконку руды со сгенерированной текстурой (синхронно)
                    const canvas = create3DOreIcon(itemDef.oreType, 48)
                    icon.style.backgroundColor = 'transparent'
                    icon.style.backgroundImage = `url(${canvas.toDataURL()})`
                    icon.style.backgroundSize = 'contain'
                    icon.style.backgroundRepeat = 'no-repeat'
                    icon.style.backgroundPosition = 'center'
                } else if (itemDef.use3DIcon && itemDef.textureMaterials) {
                    // Создаем 3D миниатюру блока из PNG текстур (асинхронно)
                    create3DBlockIcon(this.noa, itemDef.textureMaterials, 48).then(canvas => {
                        icon.style.backgroundColor = 'transparent'
                        icon.style.backgroundImage = `url(${canvas.toDataURL()})`
                        icon.style.backgroundSize = 'contain'
                        icon.style.backgroundRepeat = 'no-repeat'
                        icon.style.backgroundPosition = 'center'
                    })
                    // Пока загружается, показываем цвет
                    const color = itemDef.color || [1, 1, 1]
                    icon.style.backgroundColor = `rgb(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255})`
                } else if (itemDef.use3DWoodIcon && itemDef.woodType) {
                    // Создаем 3D иконку дерева (oak, dark_oak)
                    const canvas = create3DWoodIcon(itemDef.woodType, 48)
                    icon.style.backgroundColor = 'transparent'
                    icon.style.backgroundImage = `url(${canvas.toDataURL()})`
                    icon.style.backgroundSize = 'contain'
                    icon.style.backgroundRepeat = 'no-repeat'
                    icon.style.backgroundPosition = 'center'
                } else if (itemDef.usePlanksIcon && itemDef.planksType) {
                    // Создаем 3D иконку досок из PNG текстуры (асинхронно)
                    createPlanksIcon(itemDef.planksType, 48).then(canvas => {
                        icon.style.backgroundColor = 'transparent'
                        icon.style.backgroundImage = `url(${canvas.toDataURL()})`
                        icon.style.backgroundSize = 'contain'
                        icon.style.backgroundRepeat = 'no-repeat'
                        icon.style.backgroundPosition = 'center'
                    })
                    // Пока загружается, показываем цвет
                    const color = itemDef.color || [1, 1, 1]
                    icon.style.backgroundColor = `rgb(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255})`
                } else if (itemDef.useToolIcon && itemDef.toolType) {
                    // Создаем иконку инструмента/оружия из PNG текстуры (асинхронно)
                    createToolIcon(itemDef.toolType, 48).then(canvas => {
                        icon.style.backgroundColor = 'transparent'
                        icon.style.backgroundImage = `url(${canvas.toDataURL()})`
                        icon.style.backgroundSize = 'contain'
                        icon.style.backgroundRepeat = 'no-repeat'
                        icon.style.backgroundPosition = 'center'
                    })
                    // Пока загружается, показываем цвет
                    const color = itemDef.color || [1, 1, 1]
                    icon.style.backgroundColor = `rgb(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255})`
                } else if (itemDef.useAmuletIcon && itemDef.amuletType) {
                    // Создаем иконку амулета из PNG текстуры (асинхронно)
                    createAmuletIcon(itemDef.amuletType, 48).then(canvas => {
                        icon.style.backgroundColor = 'transparent'
                        icon.style.backgroundImage = `url(${canvas.toDataURL()})`
                        icon.style.backgroundSize = 'contain'
                        icon.style.backgroundRepeat = 'no-repeat'
                        icon.style.backgroundPosition = 'center'
                    })
                    // Пока загружается, показываем цвет
                    const color = itemDef.color || [1, 1, 1]
                    icon.style.backgroundColor = `rgb(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255})`
                } else {
                    // Обычный цветной квадрат
                    const color = itemDef.color || [1, 1, 1]
                    icon.style.backgroundColor = `rgb(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255})`
                }

                div.appendChild(icon)

                // Количество
                if (slot.count > 1) {
                    const count = document.createElement('div')
                    count.className = 'slot-count'
                    count.innerText = slot.count.toString()
                    div.appendChild(count)
                }

                // Полоска прочности
                if (slot.durability !== null && itemDef.durability) {
                    const barContainer = document.createElement('div')
                    barContainer.className = 'slot-durability'
                    const bar = document.createElement('div')
                    bar.className = 'durability-bar'
                    const pct = (slot.durability / itemDef.durability) * 100
                    bar.style.width = `${pct}%`
                    barContainer.appendChild(bar)
                    div.appendChild(barContainer)
                }
            }
        }

        // Обработчики кликов и Drag and Drop (только для модального окна)
        if (!isHud) {
            div.draggable = true
            div.dataset.slotIndex = index

            // Флаг для отслеживания начала drag
            let isDragging = false

            div.addEventListener('dragstart', (e) => {
                isDragging = true
                this.draggedSlotIndex = index
                div.style.opacity = '0.5'
                e.dataTransfer.effectAllowed = 'move'

                // Сообщаем печке что начато перетаскивание из инвентаря
                if (window.gameFurnaceUI) {
                    window.gameFurnaceUI.draggedFrom = 'inventory'
                    window.gameFurnaceUI.draggedSlotType = index
                }
            })

            // ЛКМ/ПКМ - взять/положить предметы (только если не было drag)
            div.addEventListener('click', (e) => {
                // Игнорируем клик если был drag
                if (isDragging) {
                    isDragging = false
                    return
                }

                if (e.button === 0) { // ЛКМ
                    e.preventDefault()
                    this.handleLeftClick(index)
                }
            })

            div.addEventListener('contextmenu', (e) => {
                // ПКМ через contextmenu (более надежно)
                e.preventDefault()
                e.stopPropagation()
                if (!isDragging) {
                    this.handleRightClick(index)
                }
            })

            div.addEventListener('dragend', (e) => {
                div.style.opacity = '1'
                this.draggedSlotIndex = null

                // Очищаем состояние в печке
                if (window.gameFurnaceUI) {
                    window.gameFurnaceUI.draggedFrom = null
                    window.gameFurnaceUI.draggedSlotType = null
                }
            })

            div.addEventListener('dragover', (e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                div.style.background = 'rgba(255,255,255,0.1)'
            })

            div.addEventListener('dragleave', (e) => {
                div.style.background = ''
            })

            div.addEventListener('drop', (e) => {
                e.preventDefault()
                div.style.background = ''

                // Проверяем откуда идет перетаскивание
                if (window.gameFurnaceUI && window.gameFurnaceUI.draggedFrom === 'furnace') {
                    // Перетаскивание из печки в инвентарь
                    this.moveFromFurnaceToInventory(window.gameFurnaceUI.draggedSlotType, index)
                } else if (this.draggedSlotIndex !== null && this.draggedSlotIndex !== index) {
                    // Перетаскивание внутри инвентаря
                    this.swapSlots(this.draggedSlotIndex, index)
                }
            })
        }

        return div
    }

    /**
     * Обработка ЛКМ по слоту (взять/положить весь стек)
     */
    handleLeftClick(slotIndex) {
        const slot = this.inventory.slots[slotIndex]

        // Если ничего не держим
        if (!this.heldItem) {
            // Берем предмет из слота
            if (!slot.isEmpty()) {
                this.heldItem = {
                    item: slot.item,
                    count: slot.count
                }
                this.heldSlotIndex = slotIndex
                slot.clear()
                this.refresh()
            }
        } else {
            // Держим предмет - кладем в слот
            if (slot.isEmpty()) {
                // Слот пустой - кладем весь стек
                slot.item = this.heldItem.item
                slot.count = this.heldItem.count
                this.heldItem = null
                this.heldSlotIndex = null
                this.refresh()
            } else if (slot.item === this.heldItem.item) {
                // Тот же предмет - объединяем стеки
                const itemDef = items[slot.item]
                const maxStack = itemDef ? itemDef.maxStack : 64
                const canAdd = Math.min(this.heldItem.count, maxStack - slot.count)

                if (canAdd > 0) {
                    slot.count += canAdd
                    this.heldItem.count -= canAdd

                    if (this.heldItem.count === 0) {
                        this.heldItem = null
                        this.heldSlotIndex = null
                    }
                }
                this.refresh()
            } else {
                // Разные предметы - меняем местами
                const tempItem = slot.item
                const tempCount = slot.count

                slot.item = this.heldItem.item
                slot.count = this.heldItem.count

                this.heldItem.item = tempItem
                this.heldItem.count = tempCount
                this.heldSlotIndex = slotIndex
                this.refresh()
            }
        }
    }

    /**
     * Обработка ПКМ по слоту (распределить по одному)
     */
    handleRightClick(slotIndex) {
        const slot = this.inventory.slots[slotIndex]

        // Если ничего не держим
        if (!this.heldItem) {
            // Берем половину стека из слота
            if (!slot.isEmpty() && slot.count > 0) {
                const takeCount = Math.ceil(slot.count / 2)
                this.heldItem = {
                    item: slot.item,
                    count: takeCount
                }
                this.heldSlotIndex = slotIndex
                slot.count -= takeCount

                if (slot.count === 0) {
                    slot.clear()
                }
                this.refresh()
            }
        } else {
            // Держим предмет - кладем 1 штуку
            if (slot.isEmpty()) {
                // Слот пустой - кладем 1 предмет
                slot.item = this.heldItem.item
                slot.count = 1
                this.heldItem.count -= 1

                if (this.heldItem.count === 0) {
                    this.heldItem = null
                    this.heldSlotIndex = null
                }
                this.refresh()
            } else if (slot.item === this.heldItem.item) {
                // Тот же предмет - добавляем 1 штуку
                const itemDef = items[slot.item]
                const maxStack = itemDef ? itemDef.maxStack : 64

                if (slot.count < maxStack && this.heldItem.count > 0) {
                    slot.count += 1
                    this.heldItem.count -= 1

                    if (this.heldItem.count === 0) {
                        this.heldItem = null
                        this.heldSlotIndex = null
                    }
                    this.refresh()
                }
            }
            // Если разные предметы - ничего не делаем при ПКМ
        }
    }

    /**
     * Поменять местами два слота
     */
    swapSlots(fromIndex, toIndex) {
        const fromSlot = this.inventory.slots[fromIndex]
        const toSlot = this.inventory.slots[toIndex]

        // Сохраняем данные первого слота
        const tempItem = fromSlot.item
        const tempCount = fromSlot.count
        const tempDurability = fromSlot.durability

        // Копируем данные из второго в первый
        fromSlot.item = toSlot.item
        fromSlot.count = toSlot.count
        fromSlot.durability = toSlot.durability

        // Копируем сохраненные данные во второй
        toSlot.item = tempItem
        toSlot.count = tempCount
        toSlot.durability = tempDurability

        // Обновляем UI
        this.refresh()
    }

    /**
     * Переместить предмет из печки в инвентарь
     */
    moveFromFurnaceToInventory(furnaceSlotType, inventorySlotIndex) {
        if (!window.gameFurnaceUI || !window.gameFurnaceUI.currentFurnace) return

        const furnace = window.gameFurnaceUI.currentFurnace
        const furnaceSlot = furnace[furnaceSlotType]
        const inventorySlot = this.inventory.slots[inventorySlotIndex]

        if (!furnaceSlot.item || furnaceSlot.count === 0) return

        // Если слот инвентаря пустой - перемещаем весь стек
        if (!inventorySlot.item || inventorySlot.count === 0) {
            inventorySlot.item = furnaceSlot.item
            inventorySlot.count = furnaceSlot.count

            furnaceSlot.item = null
            furnaceSlot.count = 0
        } else if (inventorySlot.item === furnaceSlot.item) {
            // Если тот же предмет - объединяем стеки
            inventorySlot.count += furnaceSlot.count
            furnaceSlot.item = null
            furnaceSlot.count = 0
        } else {
            // Если разные предметы - меняем местами
            const tempItem = inventorySlot.item
            const tempCount = inventorySlot.count

            inventorySlot.item = furnaceSlot.item
            inventorySlot.count = furnaceSlot.count

            furnaceSlot.item = tempItem
            furnaceSlot.count = tempCount
        }

        // Обновляем UI
        this.refresh()
        if (window.gameFurnaceUI) {
            window.gameFurnaceUI.render()
        }
    }

    /**
     * Отрисовка удерживаемого предмета возле курсора
     */
    renderHeldItem() {
        // Удаляем старый элемент если есть
        const oldHeldEl = document.getElementById('held-item-cursor')
        if (oldHeldEl) {
            // Удаляем старый обработчик события
            if (oldHeldEl['_updatePosition']) {
                document.removeEventListener('mousemove', oldHeldEl['_updatePosition'])
            }
            oldHeldEl.remove()
        }

        // Если держим предмет - создаем новый элемент
        if (this.heldItem && this.isOpen) {
            const itemDef = items[this.heldItem.item]
            if (!itemDef) return

            // Получаем размеры из CSS переменных
            const slotSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--slot-size')) || 50
            const iconSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--slot-icon-size')) || 32

            const heldEl = document.createElement('div')
            heldEl.id = 'held-item-cursor'
            heldEl.style.cssText = `
                position: fixed;
                pointer-events: none;
                z-index: 10000;
                width: ${slotSize}px;
                height: ${slotSize}px;
                display: flex;
                align-items: center;
                justify-content: center;
                transform: translate(-50%, -50%);
            `

            // Иконка
            const icon = document.createElement('div')
            icon.style.cssText = `
                width: ${iconSize}px;
                height: ${iconSize}px;
                border-radius: 4px;
                border: 2px solid rgba(255,255,255,0.5);
            `
            heldEl.appendChild(icon)

            // Применяем текстуру (универсальная функция)
            applyItemIcon(icon, itemDef, iconSize)

            // Количество
            if (this.heldItem.count > 1) {
                const count = document.createElement('div')
                count.style.cssText = `
                    position: absolute;
                    bottom: 2px;
                    right: 2px;
                    font-size: 14px;
                    font-weight: bold;
                    color: white;
                    text-shadow: 1px 1px 2px black;
                `
                count.innerText = this.heldItem.count
                heldEl.appendChild(count)
            }

            document.body.appendChild(heldEl)

            // Обновляем позицию при движении мыши
            const updatePosition = (e) => {
                if (heldEl && document.body.contains(heldEl)) {
                    heldEl.style.left = `${e.clientX}px`
                    heldEl.style.top = `${e.clientY}px`
                }
            }

            // Получаем текущую позицию мыши и устанавливаем начальное положение
            const currentMouseEvent = this._lastMouseEvent
            if (currentMouseEvent) {
                heldEl.style.left = `${currentMouseEvent.clientX}px`
                heldEl.style.top = `${currentMouseEvent.clientY}px`
            }

            document.addEventListener('mousemove', updatePosition)

            // Сохраняем функцию для очистки
            heldEl['_updatePosition'] = updatePosition
        }
    }

    /**
     * Отрисовка мини-верстака 2x2
     */
    renderMiniCrafting() {
        if (!this.miniCraftingGrid) return

        // Очищаем сетку
        this.miniCraftingGrid.innerHTML = ''

        // Создаем 4 слота (2x2)
        for (let i = 0; i < 4; i++) {
            const slot = this.createCraftingSlot(i)
            this.miniCraftingGrid.appendChild(slot)
        }

        // Отрисовываем результат
        this.renderCraftingResult()

        // Проверяем рецепт
        this.checkMiniCraftingRecipe()
    }

    /**
     * Создать слот мини-верстака
     */
    createCraftingSlot(index) {
        const div = document.createElement('div')
        div.className = 'inventory-slot crafting-slot'
        div.dataset.craftingIndex = index

        const slot = this.craftingSlots[index]

        // Если есть предмет - отрисовать
        if (slot.item && slot.count > 0) {
            const itemDef = items[slot.item]
            if (itemDef) {
                const icon = document.createElement('div')
                icon.className = 'slot-icon'
                div.appendChild(icon)

                // Получаем реальный размер иконки из CSS переменной
                const iconSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--slot-icon-size')) || 32

                // Применяем текстуру (универсальная функция)
                applyItemIcon(icon, itemDef, iconSize)

                if (slot.count > 1) {
                    const count = document.createElement('div')
                    count.className = 'slot-count'
                    count.innerText = slot.count.toString()
                    div.appendChild(count)
                }
            }
        }

        // Обработчики для drag and drop и кликов
        div.draggable = true

        div.addEventListener('dragstart', (e) => {
            if (!slot.item) return
            this.draggedSlotIndex = `crafting_${index}`
            div.style.opacity = '0.5'
            e.dataTransfer.effectAllowed = 'move'
        })

        div.addEventListener('dragend', () => {
            div.style.opacity = '1'
            this.draggedSlotIndex = null
        })

        div.addEventListener('dragover', (e) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
        })

        div.addEventListener('drop', (e) => {
            e.preventDefault()
            if (this.draggedSlotIndex && this.draggedSlotIndex !== `crafting_${index}`) {
                this.handleCraftingDrop(index, this.draggedSlotIndex)
            }
        })

        div.addEventListener('click', (e) => {
            if (e.button === 0) {
                this.handleCraftingSlotLeftClick(index)
            }
        })

        div.addEventListener('contextmenu', (e) => {
            e.preventDefault()
            e.stopPropagation()
            this.handleCraftingSlotRightClick(index)
        })

        return div
    }

    /**
     * Обработка ЛКМ по слоту крафта
     */
    handleCraftingSlotLeftClick(index) {
        const slot = this.craftingSlots[index]

        if (!this.heldItem) {
            // Берем весь стек
            if (slot.item && slot.count > 0) {
                this.heldItem = { item: slot.item, count: slot.count }
                slot.item = null
                slot.count = 0
                this.renderHeldItem()
                this.renderMiniCrafting()
            }
        } else {
            // Кладем предмет
            if (!slot.item || slot.count === 0) {
                slot.item = this.heldItem.item
                slot.count = this.heldItem.count
                this.heldItem = null
                this.heldSlotIndex = null
            } else if (slot.item === this.heldItem.item) {
                const canAdd = Math.min(this.heldItem.count, 64 - slot.count)
                slot.count += canAdd
                this.heldItem.count -= canAdd
                if (this.heldItem.count === 0) {
                    this.heldItem = null
                    this.heldSlotIndex = null
                }
            } else {
                // Swap
                const temp = { item: slot.item, count: slot.count }
                slot.item = this.heldItem.item
                slot.count = this.heldItem.count
                this.heldItem = temp
            }
            this.renderHeldItem()
            this.renderMiniCrafting()
        }
    }

    /**
     * Обработка ПКМ по слоту крафта
     */
    handleCraftingSlotRightClick(index) {
        const slot = this.craftingSlots[index]

        if (!this.heldItem) {
            // Берем половину
            if (slot.item && slot.count > 0) {
                const takeCount = Math.ceil(slot.count / 2)
                this.heldItem = { item: slot.item, count: takeCount }
                slot.count -= takeCount
                if (slot.count === 0) slot.item = null
                this.renderHeldItem()
                this.renderMiniCrafting()
            }
        } else {
            // Кладем 1 штуку
            if (!slot.item || slot.count === 0) {
                slot.item = this.heldItem.item
                slot.count = 1
                this.heldItem.count -= 1
                if (this.heldItem.count === 0) {
                    this.heldItem = null
                    this.heldSlotIndex = null
                }
            } else if (slot.item === this.heldItem.item && slot.count < 64) {
                slot.count += 1
                this.heldItem.count -= 1
                if (this.heldItem.count === 0) {
                    this.heldItem = null
                    this.heldSlotIndex = null
                }
            }
            this.renderHeldItem()
            this.renderMiniCrafting()
        }
    }

    /**
     * Обработка drop на слот крафта
     */
    handleCraftingDrop(toIndex, fromIndex) {
        // Если перетаскиваем из инвентаря
        if (typeof fromIndex === 'number') {
            const inventorySlot = this.inventory.slots[fromIndex]
            const craftingSlot = this.craftingSlots[toIndex]

            if (!inventorySlot.isEmpty()) {
                // Swap или перемещение
                const tempItem = craftingSlot.item
                const tempCount = craftingSlot.count

                craftingSlot.item = inventorySlot.item
                craftingSlot.count = inventorySlot.count

                inventorySlot.item = tempItem
                inventorySlot.count = tempCount

                this.renderMiniCrafting()
                this.renderModal()
            }
        } else if (fromIndex.startsWith('crafting_')) {
            // Перемещение между слотами крафта
            const fromCraftingIndex = parseInt(fromIndex.split('_')[1])
            const fromSlot = this.craftingSlots[fromCraftingIndex]
            const toSlot = this.craftingSlots[toIndex]

            // Swap
            const temp = { item: fromSlot.item, count: fromSlot.count }
            fromSlot.item = toSlot.item
            fromSlot.count = toSlot.count
            toSlot.item = temp.item
            toSlot.count = temp.count

            this.renderMiniCrafting()
        }
    }

    /**
     * Проверка рецепта в мини-верстаке
     */
    checkMiniCraftingRecipe() {
        // Сначала проверяем SINGLE_SLOT рецепты (дерево -> доски)
        const singleSlotRecipe = findSingleSlotRecipe(this.craftingSlots)

        if (singleSlotRecipe) {
            this.craftingResultSlot.item = singleSlotRecipe.result
            this.craftingResultSlot.count = singleSlotRecipe.count
            this.renderCraftingResult()
            return
        }

        // Затем проверяем SHAPED рецепты (сетка 2x2)
        const grid = [
            [this.craftingSlots[0].item || '', this.craftingSlots[1].item || ''],
            [this.craftingSlots[2].item || '', this.craftingSlots[3].item || '']
        ]

        const recipe = findShapedRecipe(grid)

        if (recipe) {
            this.craftingResultSlot.item = recipe.result
            this.craftingResultSlot.count = recipe.count
        } else {
            this.craftingResultSlot.item = null
            this.craftingResultSlot.count = 0
        }

        this.renderCraftingResult()
    }

    /**
     * Отрисовка результата крафта
     */
    renderCraftingResult() {
        if (!this.miniCraftingResult) return

        this.miniCraftingResult.innerHTML = ''

        if (this.craftingResultSlot.item && this.craftingResultSlot.count > 0) {
            const itemDef = items[this.craftingResultSlot.item]
            if (itemDef) {
                const icon = document.createElement('div')
                icon.className = 'slot-icon'
                this.miniCraftingResult.appendChild(icon)

                // Получаем реальный размер иконки из CSS переменной
                const iconSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--slot-icon-size')) || 32

                // Применяем текстуру (универсальная функция)
                applyItemIcon(icon, itemDef, iconSize)

                if (this.craftingResultSlot.count > 1) {
                    const count = document.createElement('div')
                    count.className = 'slot-count'
                    count.innerText = this.craftingResultSlot.count.toString()
                    this.miniCraftingResult.appendChild(count)
                }
            }
        }

        // Обработка клика по результату
        this.miniCraftingResult.onclick = (e) => {
            if (this.craftingResultSlot.item && this.craftingResultSlot.count > 0) {
                this.handleCraftingResultClick()
            }
        }
    }

    /**
     * Обработка клика по результату крафта
     */
    handleCraftingResultClick() {
        if (!this.craftingResultSlot.item) return

        // Добавляем в инвентарь
        this.inventory.addItem(this.craftingResultSlot.item, this.craftingResultSlot.count, { getItem: (n) => items[n] })

        // Уменьшаем ингредиенты
        for (let i = 0; i < 4; i++) {
            if (this.craftingSlots[i].item) {
                this.craftingSlots[i].count -= 1
                if (this.craftingSlots[i].count === 0) {
                    this.craftingSlots[i].item = null
                }
            }
        }

        // Обновляем
        this.renderMiniCrafting()
        this.renderModal()
    }

    /**
     * Открыть окно списка предметов (первое окно)
     */
    openItemsModal() {
        if (this.itemsModal) {
            this.itemsModal.classList.add('open')
            this.renderItemsList()
        }
    }

    /**
     * Закрыть окно списка предметов
     */
    closeItemsModal() {
        if (this.itemsModal) {
            this.itemsModal.classList.remove('open')
        }
    }

    /**
     * Открыть окно деталей рецепта (второе окно)
     */
    openRecipeDetailModal(itemName) {
        if (this.recipeDetailModal) {
            this.recipeDetailModal.classList.add('open')
            this.renderRecipeDetail(itemName)
        }
    }

    /**
     * Закрыть окно деталей рецепта и вернуться к списку предметов
     */
    closeRecipeDetailModal() {
        if (this.recipeDetailModal) {
            this.recipeDetailModal.classList.remove('open')
        }
    }

    /**
     * Отрисовка списка всех предметов
     */
    renderItemsList() {
        const itemsList = document.getElementById('items-list')
        if (!itemsList) return

        itemsList.innerHTML = ''

        // Получаем все уникальные предметы из рецептов
        const craftableItems = new Set()
        for (const recipe of recipes) {
            craftableItems.add(recipe.result)
        }

        // Показываем все крафтящиеся предметы
        craftableItems.forEach(itemName => {
            const itemDef = items[itemName]
            if (!itemDef) return

            const itemIcon = document.createElement('div')
            itemIcon.className = 'item-icon'

            // Иконка предмета с текстурой
            const iconImage = document.createElement('div')
            iconImage.className = 'item-icon-image'
            const color = itemDef.color || [1, 1, 1]
            iconImage.style.backgroundColor = `rgb(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255})`

            // Применяем текстуру к иконке
            applyItemIcon(iconImage, itemDef, 40)

            itemIcon.appendChild(iconImage)

            // Название предмета
            const itemNameDiv = document.createElement('div')
            itemNameDiv.className = 'item-icon-name'
            itemNameDiv.innerText = itemDef.displayName || itemName
            itemIcon.appendChild(itemNameDiv)

            // Клик по предмету открывает окно с рецептом
            itemIcon.addEventListener('click', () => {
                this.openRecipeDetailModal(itemName)
            })

            itemsList.appendChild(itemIcon)
        })
    }

    /**
     * Получить статичный рецепт для отображения в книге рецептов
     * Некоторые рецепты показываются в стандартной позиции независимо от L-System
     */
    getStaticRecipeShape(itemName, recipe) {
        // Статичные рецепты для отображения в книге
        const staticRecipes = {
            // Палки - вертикально по центру (ряды 0-1)
            'stick': [
                ['', 'oak_planks', ''],
                ['', 'oak_planks', ''],
                ['', '', '']
            ],
            // Дубовые доски - один дуб по центру
            'oak_planks': [
                ['', '', ''],
                ['', 'oak', ''],
                ['', '', '']
            ],
            // Тёмные дубовые доски - один тёмный дуб по центру
            'dark_oak_planks': [
                ['', '', ''],
                ['', 'dark_oak', ''],
                ['', '', '']
            ],
            // Верстак - квадрат 2x2 в левом верхнем углу
            'crafting_table': [
                ['oak_planks', 'oak_planks', ''],
                ['oak_planks', 'oak_planks', ''],
                ['', '', '']
            ]
        }

        if (staticRecipes[itemName]) {
            return staticRecipes[itemName]
        }

        // Для остальных рецептов используем оригинальную форму
        return recipe.shape
    }

    /**
     * Отрисовка деталей рецепта для конкретного предмета
     */
    renderRecipeDetail(itemName) {
        const content = document.getElementById('recipe-detail-content')
        if (!content) return

        content.innerHTML = ''

        // Находим рецепт для этого предмета
        const recipe = recipes.find(r => r.result === itemName)
        if (!recipe) {
            return
        }

        const itemDef = items[itemName]

        // Название предмета
        const title = document.createElement('h3')
        title.style.margin = '0 0 20px 0'
        title.innerText = (itemDef && itemDef.displayName) || itemName
        content.appendChild(title)

        // Получаем форму рецепта (статичную или оригинальную)
        const recipeShape = this.getStaticRecipeShape(itemName, recipe)

        // Сетка 3×3 (всегда показываем 3×3, даже для 2×2 рецептов)
        const grid = document.createElement('div')
        grid.className = 'recipe-grid-3x3'

        // Создаем 9 слотов
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const slot = document.createElement('div')
                slot.className = 'recipe-slot'

                // Подготовка списка предметов для отрисовки
                let slotItemName = ''

                if ((recipe.type === 'shaped' || recipe.type === 'single_slot') && recipeShape) {
                    slotItemName = recipeShape[row]?.[col] || ''
                } else if (recipe.type === 'shapeless') {
                    // Для бесформенных рецептов просто заполняем слоты по порядку
                    const ingredientIndex = row * 3 + col
                    let currentIdx = 0
                    for (const ing of recipe.ingredients) {
                        if (ingredientIndex >= currentIdx && ingredientIndex < currentIdx + ing.count) {
                            slotItemName = ing.item
                            break
                        }
                        currentIdx += ing.count
                    }
                }

                // Если имя предмета - массив (выбор из нескольких), берем первый для отображения
                if (Array.isArray(slotItemName)) {
                    slotItemName = slotItemName[0]
                }

                if (slotItemName) {
                    const slotItemDef = items[slotItemName]
                    if (slotItemDef) {
                        const icon = document.createElement('div')
                        icon.className = 'slot-icon'
                        // Применяем текстуру к иконке
                        applyItemIcon(icon, slotItemDef, 40)
                        slot.appendChild(icon)
                    }
                }

                grid.appendChild(slot)
            }
        }

        content.appendChild(grid)

        // Результат
        const resultDisplay = document.createElement('div')
        resultDisplay.className = 'recipe-result-display'

        const arrow = document.createElement('div')
        arrow.className = 'recipe-arrow'
        arrow.innerText = '↓'
        resultDisplay.appendChild(arrow)

        const resultSlot = document.createElement('div')
        resultSlot.className = 'recipe-slot'

        const resultIcon = document.createElement('div')
        resultIcon.className = 'slot-icon'
        // Применяем текстуру к результату
        applyItemIcon(resultIcon, itemDef, 40)
        resultSlot.appendChild(resultIcon)

        resultDisplay.appendChild(resultSlot)

        const resultLabel = document.createElement('div')
        resultLabel.style.fontSize = '18px'
        resultLabel.innerText = `x${recipe.count}`
        resultDisplay.appendChild(resultLabel)

        content.appendChild(resultDisplay)
    }

    /**
     * Обновить отображение
     */
    refresh() {
        this.renderHotbar()
        if (this.isOpen) {
            this.renderModal()
            this.renderMiniCrafting()
        }
        this._updateHeldItemDisplay()
    }
}
