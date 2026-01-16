/**
 * CactusGeometryBuilder - строит Babylon.js mesh для кактуса
 * Кактус = столбик с рёбрами, ветки под 90 градусов
 */

import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import vec3 from 'gl-vec3'

class TurtleState {
    constructor() {
        this.pos = [0, 0, 0]
        this.dir = [0, 1, 0]
        this.right = [1, 0, 0]
        this.up = [0, 0, -1]
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
        const c = Math.cos(angle), s = Math.sin(angle)
        const newRight = [
            this.right[0] * c + this.up[0] * s,
            this.right[1] * c + this.up[1] * s,
            this.right[2] * c + this.up[2] * s
        ]
        const newUp = [
            -this.right[0] * s + this.up[0] * c,
            -this.right[1] * s + this.up[1] * c,
            -this.right[2] * s + this.up[2] * c
        ]
        vec3.copy(this.right, newRight)
        vec3.copy(this.up, newUp)
    }

    // Поворот на 90 градусов - ветка идёт горизонтально
    turnBranch(angle) {
        // Сохраняем старые оси
        const oldDir = [...this.dir]
        const oldRight = [...this.right]
        const oldUp = [...this.up]

        // Новое направление = старый right (повёрнутый)
        const c = Math.cos(angle), s = Math.sin(angle)
        this.dir = [
            oldRight[0] * c + oldUp[0] * s,
            oldRight[1] * c + oldUp[1] * s,
            oldRight[2] * c + oldUp[2] * s
        ]
        vec3.normalize(this.dir, this.dir)

        // Новый up = старый dir (ветка растёт вбок, но "верх" теперь вдоль ствола)
        this.up = oldDir

        // Новый right = cross(dir, up)
        vec3.cross(this.right, this.up, this.dir)
        vec3.normalize(this.right, this.right)
    }

    // Поворот вверх - ветка начинает расти вертикально (как в Minecraft)
    turnUp() {
        // Новое направление = вверх (0, 1, 0)
        this.dir = [0, 1, 0]
        // Right остаётся тем же (горизонтальным)
        // Up пересчитываем
        vec3.cross(this.up, this.dir, this.right)
        vec3.normalize(this.up, this.up)
    }
}

export class CactusGeometryBuilder {
    constructor(scene) {
        this.scene = scene
    }

    buildFromLString(lstring, params) {
        const positions = []
        const indices = []
        const colors = []
        const normals = []

        const state = new TurtleState()
        const stack = []
        const angleRad = (params.angle * Math.PI) / 180

        for (const char of lstring) {
            switch (char) {
                case 'F':
                    this.drawCactusSegment(state, positions, indices, colors, normals, params)
                    state.forward(params.segmentHeight)
                    break

                case '+':
                    // Ветка вправо (горизонтально)
                    state.turnBranch(angleRad)
                    break

                case '-':
                    // Ветка влево (горизонтально)
                    state.turnBranch(-angleRad)
                    break

                case '^':
                    // Поворот вверх - ветка начинает расти вверх
                    state.turnUp()
                    break

                case '[':
                    stack.push(state.clone())
                    break

                case ']':
                    if (stack.length > 0) {
                        const restored = stack.pop()
                        vec3.copy(state.pos, restored.pos)
                        vec3.copy(state.dir, restored.dir)
                        vec3.copy(state.right, restored.right)
                        vec3.copy(state.up, restored.up)
                    }
                    break

                case 'A':
                case 'B':
                case 'C':
                    // Placeholders
                    break
            }
        }

        return this.createMesh(positions, indices, colors, normals, params)
    }

    drawCactusSegment(state, positions, indices, colors, normals, params) {
        const baseIndex = positions.length / 3
        const w = params.segmentWidth / 2
        const h = params.segmentHeight
        const color = params.cactusColor

        // Простой куб - 8 вершин
        // Локальные координаты: x=right, y=dir (вперёд), z=up
        const localVerts = [
            // Нижняя грань (y=0)
            [-w, 0, -w], [w, 0, -w], [w, 0, w], [-w, 0, w],
            // Верхняя грань (y=h)
            [-w, h, -w], [w, h, -w], [w, h, w], [-w, h, w]
        ]

        // Трансформируем в мировые координаты
        for (const local of localVerts) {
            const worldPos = [
                state.pos[0] + state.right[0] * local[0] + state.dir[0] * local[1] + state.up[0] * local[2],
                state.pos[1] + state.right[1] * local[0] + state.dir[1] * local[1] + state.up[1] * local[2],
                state.pos[2] + state.right[2] * local[0] + state.dir[2] * local[1] + state.up[2] * local[2]
            ]
            positions.push(...worldPos)
            colors.push(color[0], color[1], color[2], 1)
            normals.push(0, 1, 0)
        }

        // 6 граней куба (каждая из 2 треугольников)
        const faceIndices = [
            // Передняя (z+)
            3, 2, 6, 3, 6, 7,
            // Задняя (z-)
            1, 0, 4, 1, 4, 5,
            // Правая (x+)
            2, 1, 5, 2, 5, 6,
            // Левая (x-)
            0, 3, 7, 0, 7, 4,
            // Верхняя (y+)
            4, 7, 6, 4, 6, 5,
            // Нижняя (y-) - обычно не видна
            0, 1, 2, 0, 2, 3
        ]

        for (const i of faceIndices) {
            indices.push(baseIndex + i)
        }
    }

    createMesh(positions, indices, colors, normals, params) {
        const mesh = new Mesh('cactus', this.scene)

        const vertexData = new VertexData()
        vertexData.positions = new Float32Array(positions)
        vertexData.indices = new Uint16Array(indices)
        vertexData.colors = new Float32Array(colors)
        vertexData.normals = new Float32Array(normals)

        vertexData.applyToMesh(mesh)

        const mat = new StandardMaterial('cactusMat', this.scene)
        mat.specularColor = new Color3(0.1, 0.1, 0.1)
        mat.backFaceCulling = false

        mesh.material = mat
        mesh.scaling.setAll(params.scale)
        mesh.rotation.y = params.rotationY

        return mesh
    }
}

export default CactusGeometryBuilder
