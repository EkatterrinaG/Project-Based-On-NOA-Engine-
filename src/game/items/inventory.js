/**
 * Система инвентаря
 * Управление слотами инвентаря игрока
 */

/**
 * Слот инвентаря
 */
class InventorySlot {
    constructor() {
        this.item = null      // Название предмета (из item-registry)
        this.count = 0        // Количество
        this.durability = null // Прочность (для инструментов)
    }

    /**
     * Пустой ли слот
     */
    isEmpty() {
        return this.item === null || this.count === 0
    }

    /**
     * Очистить слот
     */
    clear() {
        this.item = null
        this.count = 0
        this.durability = null
    }

    /**
     * Установить значения слота
     */
    set(item, count = 1, durability = null) {
        this.item = item
        this.count = count
        this.durability = durability
    }
}

/**
 * Инвентарь игрока
 */
export class Inventory {
    constructor() {
        // 9 слотов hotbar + 27 слотов основного инвентаря = 36 слотов (как в Minecraft)
        this.slots = []
        for (let i = 0; i < 36; i++) {
            this.slots.push(new InventorySlot())
        }

        this.selectedHotbarSlot = 0 // Выбранный слот в hotbar (0-8)
    }

    /**
     * Получить слот hotbar (0-8)
     */
    getHotbarSlot(index) {
        if (index < 0 || index > 8) return null
        return this.slots[index]
    }

    /**
     * Получить слот основного инвентаря (9-35)
     */
    getMainSlot(index) {
        if (index < 0 || index > 26) return null
        return this.slots[index + 9]
    }

    /**
     * Получить все слоты hotbar
     */
    getHotbarSlots() {
        return this.slots.slice(0, 9)
    }

    /**
     * Получить все слоты основного инвентаря
     */
    getMainSlots() {
        return this.slots.slice(9, 36)
    }

    /**
     * Выбрать слот hotbar
     */
    selectHotbarSlot(index) {
        if (index >= 0 && index <= 8) {
            this.selectedHotbarSlot = index
        }
    }

    /**
     * Получить текущий выбранный слот
     */
    getSelectedSlot() {
        return this.getHotbarSlot(this.selectedHotbarSlot)
    }

    /**
     * Добавить предмет в инвентарь
     * @param {string} itemName - Название предмета
     * @param {number} count - Количество
     * @param {object} itemRegistry - Реестр предметов
     * @returns {number} Количество предметов, которые не удалось добавить
     */
    addItem(itemName, count, itemRegistry) {
        const itemData = itemRegistry.getItem(itemName)
        if (!itemData) {
            console.error(`[INVENTORY] Item data NOT FOUND for: ${itemName}`)
            return count
        }

        console.log(`[INVENTORY] Adding ${count} of ${itemName} (id: ${itemData.id})`)

        let remaining = count

        // 1. Попытка добавить в существующие стаки
        for (let slot of this.slots) {
            if (slot.item === itemName && slot.count < itemData.maxStack) {
                const canAdd = Math.min(remaining, itemData.maxStack - slot.count)
                slot.count += canAdd
                remaining -= canAdd

                if (remaining === 0) break
            }
        }

        // 2. Попытка добавить в пустые слоты
        if (remaining > 0) {
            for (let slot of this.slots) {
                if (slot.isEmpty()) {
                    const canAdd = Math.min(remaining, itemData.maxStack)
                    slot.set(itemName, canAdd, itemData.durability)
                    remaining -= canAdd

                    if (remaining === 0) break
                }
            }
        }

        return remaining // Возвращаем количество, которое не удалось добавить
    }

    /**
     * Удалить предмет из инвентаря
     * @param {string} itemName - Название предмета
     * @param {number} count - Количество
     * @returns {number} Количество предметов, которые удалось удалить
     */
    removeItem(itemName, count) {
        let toRemove = count
        let removed = 0

        for (let slot of this.slots) {
            if (slot.item === itemName) {
                const canRemove = Math.min(toRemove, slot.count)
                slot.count -= canRemove
                removed += canRemove
                toRemove -= canRemove

                if (slot.count === 0) {
                    slot.clear()
                }

                if (toRemove === 0) break
            }
        }

        return removed
    }

    /**
     * Удалить предмет из конкретного слота по индексу
     * @param {number} index - Индекс слота
     * @param {number} count - Количество
     * @returns {number} Количество удаленных предметов
     */
    removeItemByIndex(index, count = 1) {
        if (index < 0 || index >= this.slots.length) return 0
        const slot = this.slots[index]
        if (slot.isEmpty()) return 0

        const canRemove = Math.min(count, slot.count)
        slot.count -= canRemove
        if (slot.count === 0) slot.clear()
        return canRemove
    }

    /**
     * Проверить наличие предмета
     * @param {string} itemName - Название предмета
     * @param {number} count - Минимальное количество
     * @returns {boolean}
     */
    hasItem(itemName, count = 1) {
        let total = 0

        for (let slot of this.slots) {
            if (slot.item === itemName) {
                total += slot.count
            }
        }

        return total >= count
    }

    /**
     * Подсчитать количество предмета
     * @param {string} itemName - Название предмета
     * @returns {number}
     */
    countItem(itemName) {
        let total = 0

        for (let slot of this.slots) {
            if (slot.item === itemName) {
                total += slot.count
            }
        }

        return total
    }

    /**
     * Найти первый слот с предметом
     * @param {string} itemName - Название предмета
     * @returns {number} Индекс слота или -1
     */
    findSlot(itemName) {
        for (let i = 0; i < this.slots.length; i++) {
            if (this.slots[i].item === itemName) {
                return i
            }
        }
        return -1
    }

    /**
     * Обменять слоты местами
     */
    swapSlots(index1, index2) {
        if (index1 < 0 || index1 >= this.slots.length) return
        if (index2 < 0 || index2 >= this.slots.length) return

        const temp = { ...this.slots[index1] }
        this.slots[index1].set(
            this.slots[index2].item,
            this.slots[index2].count,
            this.slots[index2].durability
        )
        this.slots[index2].set(temp.item, temp.count, temp.durability)
    }

    /**
     * Сериализация для сохранения
     */
    serialize() {
        return {
            slots: this.slots.map(slot => ({
                item: slot.item,
                count: slot.count,
                durability: slot.durability
            })),
            selectedHotbarSlot: this.selectedHotbarSlot
        }
    }

    /**
     * Десериализация при загрузке
     */
    deserialize(data) {
        if (!data || !data.slots) return

        for (let i = 0; i < Math.min(data.slots.length, this.slots.length); i++) {
            const slotData = data.slots[i]
            this.slots[i].set(slotData.item, slotData.count, slotData.durability)
        }

        this.selectedHotbarSlot = data.selectedHotbarSlot || 0
    }
}

export default {
    Inventory
}
