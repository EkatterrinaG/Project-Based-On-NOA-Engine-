/**
 * FlowerSpawner - управляет спавном и lifecycle цветов
 */

import { LSystem } from './lsystem/core.js'
import { FlowerRandomizer } from './lsystem/randomizer.js'
import { FlowerGeometryBuilder } from './lsystem/geometry.js'

export class FlowerSpawner {
    /**
     * @param {import('../index').Engine} noa
     * @param {FlowerSpawnerOptions} options
     */
    constructor(noa, options = {}) {
        this.noa = noa
        this.options = {
            density: options.density ?? 0.03, // 3% блоков
            grassBlockIds: options.grassBlockIds ?? [2], // ID блоков травы
            airBlockId: options.airBlockId ?? 0,
            worldSeed: options.worldSeed ?? 12345,
            enabled: options.enabled ?? true
        }

        this.randomizer = new FlowerRandomizer(this.options.worldSeed)
        this.geometryBuilder = new FlowerGeometryBuilder(noa.rendering.getScene())

        // Map: chunkKey -> [entityIds]
        this.flowersByChunk = new Map()

        // Подписываемся на события чанков
        this._onChunkAdded = this._onChunkAdded.bind(this)
        this._onChunkRemoved = this._onChunkRemoved.bind(this)

        noa.world.on('chunkAdded', this._onChunkAdded)
        noa.world.on('chunkBeingRemoved', this._onChunkRemoved)

        console.log('🌸 FlowerSpawner initialized with options:', this.options)
    }

    /**
     * Обработчик добавления чанка
     * @param {import('../lib/chunk').Chunk} chunk
     */
    _onChunkAdded(chunk) {
        if (!this.options.enabled) return

        const positions = this._findFlowerPositions(chunk)
        console.log(`🌸 Chunk ${chunk.i},${chunk.j},${chunk.k}: found ${positions.length} flower positions`)
        if (positions.length === 0) return

        const entityIds = []

        for (const pos of positions) {
            try {
                const eid = this._spawnFlower(pos.x, pos.y, pos.z)
                if (eid !== null) {
                    entityIds.push(eid)
                }
            } catch (e) {
                console.warn('Failed to spawn flower at', pos, e)
            }
        }

        if (entityIds.length > 0) {
            const key = this._chunkKey(chunk.i, chunk.j, chunk.k)
            this.flowersByChunk.set(key, entityIds)
        }
    }

    /**
     * Обработчик удаления чанка
     * @param {string} requestId - формат "i|j|k|worldName"
     */
    _onChunkRemoved(requestId) {
        // Парсим ключ чанка из requestId
        const parts = requestId.split('|')
        if (parts.length < 3) return

        const [i, j, k] = parts.slice(0, 3).map(Number)
        const key = this._chunkKey(i, j, k)

        const entityIds = this.flowersByChunk.get(key)
        if (entityIds) {
            for (const eid of entityIds) {
                try {
                    this.noa.entities.deleteEntity(eid)
                } catch (e) {
                    // Entity уже удалена
                }
            }
            this.flowersByChunk.delete(key)
        }
    }

    /**
     * Находит позиции для цветов в чанке
     * @param {import('../lib/chunk').Chunk} chunk
     * @returns {Array<{x: number, y: number, z: number}>}
     */
    _findFlowerPositions(chunk) {
        const positions = []
        const voxels = chunk.voxels
        const size = chunk.size

        // Координаты чанка в мировых вокселях
        const chunkX = chunk.i * size
        const chunkY = chunk.j * size
        const chunkZ = chunk.k * size

        // Debug: собираем уникальные blockId в чанке
        const uniqueBlockIds = new Set()

        // Сканируем каждый столбец
        for (let i = 0; i < size; i++) {
            for (let k = 0; k < size; k++) {
                // Мировые координаты
                const worldX = chunkX + i
                const worldZ = chunkZ + k

                // Проверяем должен ли быть цветок
                if (!this.randomizer.shouldSpawn(worldX, worldZ, this.options.density)) {
                    continue
                }

                // Ищем поверхность (сверху вниз)
                for (let j = size - 2; j >= 0; j--) {
                    const blockId = voxels.get(i, j, k)
                    const aboveId = voxels.get(i, j + 1, k)

                    uniqueBlockIds.add(blockId)

                    // Трава + воздух сверху
                    if (this.options.grassBlockIds.includes(blockId) &&
                        aboveId === this.options.airBlockId) {

                        positions.push({
                            x: worldX,
                            y: chunkY + j + 1, // На один выше травы
                            z: worldZ
                        })
                        break // Нашли поверхность, идем к следующему столбцу
                    }

                    // Если встретили непустой блок, прекращаем поиск
                    if (blockId !== this.options.airBlockId) {
                        break
                    }
                }
            }
        }

        // Debug: логируем чанки где есть блоки (не только воздух)
        const nonAirBlocks = Array.from(uniqueBlockIds).filter(id => id !== 0)
        if (nonAirBlocks.length > 0) {
            console.log(`🌸 Debug chunk ${chunk.i},${chunk.j},${chunk.k}: looking for grassBlockIds=${JSON.stringify(this.options.grassBlockIds)}, found blocks:`, nonAirBlocks.slice(0, 10))
        }

        return positions
    }

    /**
     * Спавнит цветок в указанной позиции
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {number|null} entity id или null
     */
    _spawnFlower(x, y, z) {
        // Генерируем уникальные параметры
        const params = this.randomizer.generateParams(x, z)

        // Генерируем L-string
        const lsystem = new LSystem(params.axiom, params.rules, params.iterations)
        const lstring = lsystem.generate()

        // Строим mesh
        const mesh = this.geometryBuilder.buildFromLString(lstring, params)

        // Создаем entity (центр блока)
        const eid = this.noa.entities.add(
            [x + 0.5, y, z + 0.5], // Позиция (центр блока)
            0.3, // width (для коллизий, если понадобятся)
            0.5, // height
            mesh,
            [0, 0, 0], // mesh offset
            false, // doPhysics
            false  // shadow
        )

        return eid
    }

    /**
     * Формирует ключ чанка
     */
    _chunkKey(i, j, k) {
        return `${i}|${j}|${k}`
    }

    /**
     * Включает/выключает спавн цветов
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.options.enabled = enabled
    }

    /**
     * Устанавливает плотность цветов
     * @param {number} density - 0 to 1
     */
    setDensity(density) {
        this.options.density = Math.max(0, Math.min(1, density))
    }

    /**
     * Очищает все цветы
     */
    clearAll() {
        for (const [key, entityIds] of this.flowersByChunk) {
            for (const eid of entityIds) {
                try {
                    this.noa.entities.deleteEntity(eid)
                } catch (e) {
                    // Entity уже удалена
                }
            }
        }
        this.flowersByChunk.clear()
    }

    /**
     * Отписывается от событий и очищает ресурсы
     */
    dispose() {
        this.clearAll()
        this.noa.world.off('chunkAdded', this._onChunkAdded)
        this.noa.world.off('chunkBeingRemoved', this._onChunkRemoved)
    }
}

/**
 * @typedef {Object} FlowerSpawnerOptions
 * @property {number} [density=0.03] - вероятность спавна цветка (0-1)
 * @property {number[]} [grassBlockIds=[2]] - ID блоков на которых спавнятся цветы
 * @property {number} [airBlockId=0] - ID воздуха
 * @property {number} [worldSeed=12345] - seed для рандомизации
 * @property {boolean} [enabled=true] - включен ли спавн
 */

export default FlowerSpawner
