/**
 * FlowerGeometryBuilder - строит Babylon.js mesh из L-system строки
 */

import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import vec3 from 'gl-vec3'

// Матричные операции для 3D трансформаций
const tempVec = vec3.create()
const tempVec2 = vec3.create()

/**
 * Поворот вектора вокруг оси
 * @param {number[]} out - результат
 * @param {number[]} v - вектор
 * @param {number[]} axis - ось
 * @param {number} angle - угол в радианах
 */
function rotateAroundAxis(out, v, axis, angle) {
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    const t = 1 - c
    const x = axis[0], y = axis[1], z = axis[2]
    const vx = v[0], vy = v[1], vz = v[2]

    out[0] = (t * x * x + c) * vx + (t * x * y - s * z) * vy + (t * x * z + s * y) * vz
    out[1] = (t * x * y + s * z) * vx + (t * y * y + c) * vy + (t * y * z - s * x) * vz
    out[2] = (t * x * z - s * y) * vx + (t * y * z + s * x) * vy + (t * z * z + c) * vz
    return out
}

/**
 * Состояние черепашки
 */
class TurtleState {
    constructor() {
        this.pos = [0, 0, 0]
        this.dir = [0, 1, 0]     // вверх
        this.right = [1, 0, 0]   // вправо
        this.up = [0, 0, -1]     // назад (для правой системы координат)
    }

    clone() {
        const s = new TurtleState()
        vec3.copy(s.pos, this.pos)
        vec3.copy(s.dir, this.dir)
        vec3.copy(s.right, this.right)
        vec3.copy(s.up, this.up)
        return s
    }

    forward(length) {
        vec3.scaleAndAdd(this.pos, this.pos, this.dir, length)
    }

    yaw(angle) {
        // Поворот вокруг dir (up в локальных координатах)
        rotateAroundAxis(tempVec, this.right, this.dir, angle)
        vec3.copy(this.right, tempVec)
        rotateAroundAxis(tempVec, this.up, this.dir, angle)
        vec3.copy(this.up, tempVec)
    }

    pitch(angle) {
        // Поворот вокруг right
        rotateAroundAxis(tempVec, this.dir, this.right, angle)
        vec3.copy(this.dir, tempVec)
        rotateAroundAxis(tempVec, this.up, this.right, angle)
        vec3.copy(this.up, tempVec)
    }

    roll(angle) {
        // Поворот вокруг up
        rotateAroundAxis(tempVec, this.dir, this.up, angle)
        vec3.copy(this.dir, tempVec)
        rotateAroundAxis(tempVec, this.right, this.up, angle)
        vec3.copy(this.right, tempVec)
    }
}

export class FlowerGeometryBuilder {
    /**
     * @param {import('@babylonjs/core').Scene} scene
     */
    constructor(scene) {
        this.scene = scene
    }

    /**
     * Строит mesh из L-string и параметров
     * @param {string} lstring - сгенерированная L-system строка
     * @param {import('./randomizer').FlowerParams} params
     * @returns {import('@babylonjs/core').Mesh}
     */
    buildFromLString(lstring, params) {
        const positions = []
        const indices = []
        const colors = []
        const normals = []

        const state = new TurtleState()
        const stack = []

        const angleRad = (params.angle * Math.PI) / 180
        const pitchRad = (params.pitchAngle * Math.PI) / 180

        for (const char of lstring) {
            switch (char) {
                case 'F': // Длинный сегмент стебля
                    this.drawStem(state, positions, indices, colors, normals, params, params.stemLength)
                    state.forward(params.stemLength)
                    break

                case 'f': // Короткий сегмент
                    this.drawStem(state, positions, indices, colors, normals, params, params.stemLength * 0.5)
                    state.forward(params.stemLength * 0.5)
                    break

                case '+': // Поворот вправо (yaw)
                    state.yaw(angleRad)
                    break

                case '-': // Поворот влево
                    state.yaw(-angleRad)
                    break

                case '^': // Наклон вверх (pitch up)
                    state.pitch(pitchRad)
                    break

                case '&': // Наклон вниз
                    state.pitch(-pitchRad)
                    break

                case '\\': // Крен вправо (roll)
                    state.roll(angleRad)
                    break

                case '/': // Крен влево
                    state.roll(-angleRad)
                    break

                case '|': // Разворот на 180
                    state.yaw(Math.PI)
                    break

                case '[': // Push
                    stack.push(state.clone())
                    break

                case ']': // Pop
                    if (stack.length > 0) {
                        const restored = stack.pop()
                        vec3.copy(state.pos, restored.pos)
                        vec3.copy(state.dir, restored.dir)
                        vec3.copy(state.right, restored.right)
                        vec3.copy(state.up, restored.up)
                    }
                    break

                case 'P': // Лепесток
                    this.drawPetal(state, positions, indices, colors, normals, params)
                    break

                case 'L': // Лист
                    this.drawLeaf(state, positions, indices, colors, normals, params)
                    break

                case 'C': // Центр цветка
                    this.drawCenter(state, positions, indices, colors, normals, params)
                    break

                case 'A': // Placeholder для правил (игнорируем)
                case 'B':
                case 'X':
                    break
            }
        }

        return this.createMesh(positions, indices, colors, normals, params)
    }

    /**
     * Рисует сегмент стебля (тонкая линия из двух пересекающихся плоскостей)
     */
    drawStem(state, positions, indices, colors, normals, params, length) {
        const baseIndex = positions.length / 3
        const w = params.stemWidth * 0.5 // Тоньше
        const color = params.stemColor

        // Крестообразный стебель (две плоскости) - как в Minecraft
        // Плоскость 1 (вдоль X)
        const verts = [
            [-w, 0, 0], [w, 0, 0], [w, length, 0], [-w, length, 0],
            // Плоскость 2 (вдоль Z)
            [0, 0, -w], [0, 0, w], [0, length, w], [0, length, -w]
        ]

        for (const offset of verts) {
            const worldPos = [
                state.pos[0] + state.right[0] * offset[0] + state.dir[0] * offset[1] + state.up[0] * offset[2],
                state.pos[1] + state.right[1] * offset[0] + state.dir[1] * offset[1] + state.up[1] * offset[2],
                state.pos[2] + state.right[2] * offset[0] + state.dir[2] * offset[1] + state.up[2] * offset[2]
            ]
            positions.push(...worldPos)
            colors.push(color[0], color[1], color[2], 1)
            normals.push(0, 0, 1) // Простая нормаль
        }

        // Два квада
        const faceIndices = [
            0, 1, 2, 0, 2, 3,  // Плоскость 1
            4, 5, 6, 4, 6, 7   // Плоскость 2
        ]

        for (const i of faceIndices) {
            indices.push(baseIndex + i)
        }
    }

    /**
     * Рисует лепесток (овальная форма как в Minecraft)
     */
    drawPetal(state, positions, indices, colors, normals, params) {
        const baseIndex = positions.length / 3
        const length = params.petalLength * 1.5 // Длиннее
        const width = params.petalWidth * 1.2 // Шире
        const color = params.petalColor

        // Овальный лепесток из 5 вершин (более округлая форма)
        // Основание (узкое)
        const p0 = [...state.pos]

        // Левая середина (широкая часть)
        const p1 = [
            state.pos[0] + state.right[0] * (-width) + state.dir[0] * (length * 0.5),
            state.pos[1] + state.right[1] * (-width) + state.dir[1] * (length * 0.5),
            state.pos[2] + state.right[2] * (-width) + state.dir[2] * (length * 0.5)
        ]

        // Правая середина (широкая часть)
        const p2 = [
            state.pos[0] + state.right[0] * width + state.dir[0] * (length * 0.5),
            state.pos[1] + state.right[1] * width + state.dir[1] * (length * 0.5),
            state.pos[2] + state.right[2] * width + state.dir[2] * (length * 0.5)
        ]

        // Кончик (округлый)
        const p3 = [
            state.pos[0] + state.dir[0] * length,
            state.pos[1] + state.dir[1] * length,
            state.pos[2] + state.dir[2] * length
        ]

        // Левый кончик
        const p4 = [
            state.pos[0] + state.right[0] * (-width * 0.5) + state.dir[0] * (length * 0.8),
            state.pos[1] + state.right[1] * (-width * 0.5) + state.dir[1] * (length * 0.8),
            state.pos[2] + state.right[2] * (-width * 0.5) + state.dir[2] * (length * 0.8)
        ]

        // Правый кончик
        const p5 = [
            state.pos[0] + state.right[0] * (width * 0.5) + state.dir[0] * (length * 0.8),
            state.pos[1] + state.right[1] * (width * 0.5) + state.dir[1] * (length * 0.8),
            state.pos[2] + state.right[2] * (width * 0.5) + state.dir[2] * (length * 0.8)
        ]

        positions.push(...p0, ...p1, ...p2, ...p3, ...p4, ...p5)

        for (let i = 0; i < 6; i++) {
            colors.push(color[0], color[1], color[2], 1)
        }

        // Треугольники для овала
        indices.push(
            baseIndex, baseIndex + 1, baseIndex + 4,      // Левая нижняя часть
            baseIndex, baseIndex + 4, baseIndex + 3,      // Центр к кончику
            baseIndex, baseIndex + 3, baseIndex + 5,      // Центр к правому кончику
            baseIndex, baseIndex + 5, baseIndex + 2,      // Правая нижняя часть
            baseIndex + 1, baseIndex + 4, baseIndex + 3,  // Левая верхняя
            baseIndex + 2, baseIndex + 5, baseIndex + 3   // Правая верхняя - исправлено
        )

        const normal = [state.up[0], state.up[1], state.up[2]]
        for (let i = 0; i < 6; i++) {
            normals.push(...normal)
        }
    }

    /**
     * Рисует лист (похож на лепесток, но зеленый и другая форма)
     */
    drawLeaf(state, positions, indices, colors, normals, params) {
        const baseIndex = positions.length / 3
        const length = params.petalLength * 1.2
        const width = params.petalWidth * 0.6
        const color = params.stemColor // Зеленый как стебель

        const p0 = [...state.pos]
        const p1 = [
            state.pos[0] + state.right[0] * (-width) + state.dir[0] * (length * 0.5),
            state.pos[1] + state.right[1] * (-width) + state.dir[1] * (length * 0.5),
            state.pos[2] + state.right[2] * (-width) + state.dir[2] * (length * 0.5)
        ]
        const p2 = [
            state.pos[0] + state.right[0] * width + state.dir[0] * (length * 0.5),
            state.pos[1] + state.right[1] * width + state.dir[1] * (length * 0.5),
            state.pos[2] + state.right[2] * width + state.dir[2] * (length * 0.5)
        ]
        const p3 = [
            state.pos[0] + state.dir[0] * length,
            state.pos[1] + state.dir[1] * length,
            state.pos[2] + state.dir[2] * length
        ]

        positions.push(...p0, ...p1, ...p2, ...p3)

        for (let i = 0; i < 4; i++) {
            colors.push(color[0], color[1], color[2], 1)
        }

        indices.push(
            baseIndex, baseIndex + 1, baseIndex + 3,
            baseIndex, baseIndex + 3, baseIndex + 2
        )

        const normal = [state.up[0], state.up[1], state.up[2]]
        for (let i = 0; i < 4; i++) {
            normals.push(...normal)
        }
    }

    /**
     * Рисует центр цветка (выпуклый диск)
     */
    drawCenter(state, positions, indices, colors, normals, params) {
        const baseIndex = positions.length / 3
        const radius = params.centerRadius * 1.5 // Больше
        const color = params.centerColor
        const segments = 8

        // Центральная вершина - немного выдвинута вперед для объема
        const centerPos = [
            state.pos[0] + state.dir[0] * radius * 0.3,
            state.pos[1] + state.dir[1] * radius * 0.3,
            state.pos[2] + state.dir[2] * radius * 0.3
        ]
        positions.push(...centerPos)
        colors.push(color[0], color[1], color[2], 1)
        normals.push(state.dir[0], state.dir[1], state.dir[2])

        // Вершины по кругу
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2
            const cos = Math.cos(angle)
            const sin = Math.sin(angle)

            const p = [
                state.pos[0] + state.right[0] * cos * radius + state.up[0] * sin * radius,
                state.pos[1] + state.right[1] * cos * radius + state.up[1] * sin * radius,
                state.pos[2] + state.right[2] * cos * radius + state.up[2] * sin * radius
            ]

            positions.push(...p)
            colors.push(color[0], color[1], color[2], 1)
            normals.push(state.dir[0], state.dir[1], state.dir[2])
        }

        // Треугольники веером
        for (let i = 0; i < segments; i++) {
            const next = (i + 1) % segments
            indices.push(baseIndex, baseIndex + 1 + i, baseIndex + 1 + next)
        }
    }

    /**
     * Создает Babylon mesh из собранных данных
     */
    createMesh(positions, indices, colors, normals, params) {
        const mesh = new Mesh('flower', this.scene)

        const vertexData = new VertexData()
        vertexData.positions = new Float32Array(positions)
        vertexData.indices = new Uint16Array(indices)
        vertexData.colors = new Float32Array(colors)
        vertexData.normals = new Float32Array(normals)

        vertexData.applyToMesh(mesh)

        // Материал с vertex colors
        const mat = new StandardMaterial('flowerMat', this.scene)
        mat.specularColor = new Color3(0.1, 0.1, 0.1)
        mat.emissiveColor = new Color3(0.1, 0.1, 0.1)
        mat.backFaceCulling = false // Видно с обеих сторон

        mesh.material = mat

        // Масштаб и поворот
        mesh.scaling.setAll(params.scale)
        mesh.rotation.y = params.rotationY

        return mesh
    }
}

export default FlowerGeometryBuilder
