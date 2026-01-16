/**
 * CactusSpawner - спавн кактусов через L-system
 */

import { LSystem } from './lsystem/core.js'
import { CactusRandomizer } from './lsystem/cactusRandomizer.js'
import { CactusGeometryBuilder } from './lsystem/cactusGeometry.js'

export class CactusSpawner {
    constructor(noa, options = {}) {
        this.noa = noa
        this.options = {
            density: options.density ?? 0.015, // 1.5% - кактусы реже цветов
            sandBlockIds: options.sandBlockIds ?? [4], // ID блоков песка
            airBlockId: options.airBlockId ?? 0,
            worldSeed: options.worldSeed ?? 54321,
            enabled: options.enabled ?? true
        }

        this.randomizer = new CactusRandomizer(this.options.worldSeed)
        this.geometryBuilder = new CactusGeometryBuilder(noa.rendering.getScene())
        this.cactusByChunk = new Map()

        this._onChunkAdded = this._onChunkAdded.bind(this)
        this._onChunkRemoved = this._onChunkRemoved.bind(this)

        noa.world.on('chunkAdded', this._onChunkAdded)
        noa.world.on('chunkBeingRemoved', this._onChunkRemoved)

        console.log('🌵 CactusSpawner initialized with options:', this.options)
    }

    _onChunkAdded(chunk) {
        if (!this.options.enabled) return

        const positions = this._findCactusPositions(chunk)
        console.log(`🌵 Chunk ${chunk.i},${chunk.j},${chunk.k}: found ${positions.length} cactus positions`)
        if (positions.length === 0) return

        const entityIds = []

        for (const pos of positions) {
            try {
                const eid = this._spawnCactus(pos.x, pos.y, pos.z)
                if (eid !== null) {
                    entityIds.push(eid)
                }
            } catch (e) {
                console.warn('Failed to spawn cactus at', pos, e)
            }
        }

        if (entityIds.length > 0) {
            const key = this._chunkKey(chunk.i, chunk.j, chunk.k)
            this.cactusByChunk.set(key, entityIds)
        }
    }

    _onChunkRemoved(requestId) {
        const parts = requestId.split('|')
        if (parts.length < 3) return

        const [i, j, k] = parts.slice(0, 3).map(Number)
        const key = this._chunkKey(i, j, k)

        const entityIds = this.cactusByChunk.get(key)
        if (entityIds) {
            for (const eid of entityIds) {
                try {
                    this.noa.entities.deleteEntity(eid)
                } catch (e) {}
            }
            this.cactusByChunk.delete(key)
        }
    }

    _findCactusPositions(chunk) {
        const positions = []
        const voxels = chunk.voxels
        const size = chunk.size

        const chunkX = chunk.i * size
        const chunkY = chunk.j * size
        const chunkZ = chunk.k * size

        // Debug: собираем уникальные blockId
        const uniqueBlockIds = new Set()

        for (let i = 0; i < size; i++) {
            for (let k = 0; k < size; k++) {
                const worldX = chunkX + i
                const worldZ = chunkZ + k

                if (!this.randomizer.shouldSpawn(worldX, worldZ, this.options.density)) {
                    continue
                }

                for (let j = size - 2; j >= 0; j--) {
                    const blockId = voxels.get(i, j, k)
                    const aboveId = voxels.get(i, j + 1, k)

                    uniqueBlockIds.add(blockId)

                    if (this.options.sandBlockIds.includes(blockId) &&
                        aboveId === this.options.airBlockId) {
                        positions.push({
                            x: worldX,
                            y: chunkY + j + 1,
                            z: worldZ
                        })
                        break
                    }

                    if (blockId !== this.options.airBlockId) {
                        break
                    }
                }
            }
        }

        // Debug: логируем чанки где есть блоки (не только воздух)
        const nonAirBlocks = Array.from(uniqueBlockIds).filter(id => id !== 0)
        if (nonAirBlocks.length > 0) {
            const hasSand = nonAirBlocks.some(id => this.options.sandBlockIds.includes(id))
            console.log(`🌵 Debug chunk ${chunk.i},${chunk.j},${chunk.k}: sandBlockIds[0-4]=${this.options.sandBlockIds.slice(0, 5)}, found blocks:`, nonAirBlocks.slice(0, 10), hasSand ? '✅ HAS SAND' : '❌ no sand')
        }

        return positions
    }

    _spawnCactus(x, y, z) {
        const params = this.randomizer.generateParams(x, z)
        const lsystem = new LSystem(params.axiom, params.rules, params.iterations)
        const lstring = lsystem.generate()
        const mesh = this.geometryBuilder.buildFromLString(lstring, params)

        const eid = this.noa.entities.add(
            [x + 0.5, y, z + 0.5],
            0.5, 1.5,
            mesh,
            [0, 0, 0],
            false,
            false
        )

        return eid
    }

    _chunkKey(i, j, k) {
        return `${i}|${j}|${k}`
    }

    setEnabled(enabled) {
        this.options.enabled = enabled
    }

    setDensity(density) {
        this.options.density = Math.max(0, Math.min(1, density))
    }

    clearAll() {
        for (const [key, entityIds] of this.cactusByChunk) {
            for (const eid of entityIds) {
                try {
                    this.noa.entities.deleteEntity(eid)
                } catch (e) {}
            }
        }
        this.cactusByChunk.clear()
    }

    dispose() {
        this.clearAll()
        this.noa.world.off('chunkAdded', this._onChunkAdded)
        this.noa.world.off('chunkBeingRemoved', this._onChunkRemoved)
    }
}

export default CactusSpawner
