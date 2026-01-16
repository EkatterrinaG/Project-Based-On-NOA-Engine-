/**
 * L-System (Lindenmayer System)
 * Система для процедурной генерации растений через правила переписывания
 */

import { rng } from '../engine.js'

/**
 * Базовый класс L-System
 */
export class LSystem {
    constructor(axiom, rules, iterations = 3) {
        this.axiom = axiom
        this.rules = rules
        this.iterations = iterations
        this.current = axiom
    }

    generate() {
        this.current = this.axiom
        for (let i = 0; i < this.iterations; i++) {
            this.current = this.applyRules(this.current)
        }
        return this.current
    }

    applyRules(input) {
        let output = ''
        for (let i = 0; i < input.length; i++) {
            const char = input[i]
            if (this.rules[char]) {
                const rule = this.rules[char]
                if (Array.isArray(rule)) {
                    if (rule.length > 0 && typeof rule[0] === 'object' && rule[0].w !== undefined) {
                        const r = rng()
                        let sum = 0
                        let selected = rule[0].rule
                        for (const option of rule) {
                            sum += option.w
                            if (r < sum) {
                                selected = option.rule
                                break
                            }
                        }
                        output += selected
                    } else {
                        const randomRule = rule[Math.floor(rng() * rule.length)]
                        output += randomRule
                    }
                } else {
                    output += rule
                }
            } else {
                output += char
            }
        }
        return output
    }

    reset() {
        this.current = this.axiom
    }
}

/**
 * Интерпретатор L-System для 3D пространства
 */
export class LSystemInterpreter {
    constructor(noa, startX, startY, startZ, options = {}) {
        this.noa = noa
        this.x = startX
        this.y = startY
        this.z = startZ
        this.direction = { x: 0, y: 1, z: 0 }
        this.stack = []

        this.stepLength = options.stepLength || 1
        this.angle = options.angle || 25
        this.trunkBlock = options.trunkBlock || 1
        this.leavesBlock = options.leavesBlock || 2
        this.flowerBlock = options.flowerBlock || 3
        this.stemBlock = options.stemBlock || null // Тонкий стебель для цветов
        this.thickness = options.thickness || 1
    }

    interpret(lsystemString) {
        for (let i = 0; i < lsystemString.length; i++) {
            const command = lsystemString[i]
            switch (command) {
                case 'F': this.drawForward(); break
                case 'S': this.drawStem(); break       // Новый код для тонкого стебля
                case 'G': this.moveForward(); break
                case 'L': this.drawLeaves(); break
                case 'W': this.drawFlower(); break
                case '+': this.turnRight(); break
                case '-': this.turnLeft(); break
                case '&': this.pitchDown(); break
                case '^': this.pitchUp(); break
                case '\\': this.rollRight(); break
                case '/': this.rollLeft(); break
                case '[': this.pushState(); break
                case ']': this.popState(); break
            }
        }
    }

    drawForward() {
        const blockX = Math.round(this.x)
        const blockY = Math.round(this.y)
        const blockZ = Math.round(this.z)
        const existing = this.noa.getBlock(blockX, blockY, blockZ)
        if (existing === 0) this.noa.setBlock(this.trunkBlock, blockX, blockY, blockZ)
        this.moveForward()
    }

    drawStem() { // Новый метод для тонкого стебля
        const blockX = Math.round(this.x)
        const blockY = Math.round(this.y)
        const blockZ = Math.round(this.z)
        const existing = this.noa.getBlock(blockX, blockY, blockZ)
        if (existing === 0 && this.stemBlock) this.noa.setBlock(this.stemBlock, blockX, blockY, blockZ)
        this.moveForward()
    }

    moveForward() {
        this.x += this.direction.x * this.stepLength
        this.y += this.direction.y * this.stepLength
        this.z += this.direction.z * this.stepLength
    }

    drawLeaves() {
        const radius = 1 + Math.floor(rng() * 2)
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dz = -radius; dz <= radius; dz++) {
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
                    if (dist <= radius + rng() * 0.5) {
                        const leafX = Math.round(this.x + dx)
                        const leafY = Math.round(this.y + dy)
                        const leafZ = Math.round(this.z + dz)
                        if (this.noa.getBlock(leafX, leafY, leafZ) === 0) {
                            this.noa.setBlock(this.leavesBlock, leafX, leafY, leafZ)
                        }
                    }
                }
            }
        }
    }

    drawFlower() {
        const blockX = Math.round(this.x)
        const blockY = Math.round(this.y)
        const blockZ = Math.round(this.z)
        if (this.noa.getBlock(blockX, blockY, blockZ) === 0) {
            this.noa.setBlock(this.flowerBlock, blockX, blockY, blockZ)
        }
    }

    // === Повороты ===
    turnRight() { this.rotateY(this.angle) }
    turnLeft() { this.rotateY(-this.angle) }
    pitchDown() { this.rotateX(this.angle) }
    pitchUp() { this.rotateX(-this.angle) }
    rollRight() { this.rotateZ(this.angle) }
    rollLeft() { this.rotateZ(-this.angle) }

    rotateY(angleDeg) {
        const angleRad = (angleDeg * Math.PI) / 180
        const cos = Math.cos(angleRad)
        const sin = Math.sin(angleRad)
        const newX = this.direction.x * cos - this.direction.z * sin
        const newZ = this.direction.x * sin + this.direction.z * cos
        this.direction.x = newX
        this.direction.z = newZ
        this.normalizeDirection()
    }

    rotateX(angleDeg) {
        const angleRad = (angleDeg * Math.PI) / 180
        const cos = Math.cos(angleRad)
        const sin = Math.sin(angleRad)
        const newY = this.direction.y * cos - this.direction.z * sin
        const newZ = this.direction.y * sin + this.direction.z * cos
        this.direction.y = newY
        this.direction.z = newZ
        this.normalizeDirection()
    }

    rotateZ(angleDeg) {
        const angleRad = (angleDeg * Math.PI) / 180
        const cos = Math.cos(angleRad)
        const sin = Math.sin(angleRad)
        const newX = this.direction.x * cos - this.direction.y * sin
        const newY = this.direction.x * sin + this.direction.y * cos
        this.direction.x = newX
        this.direction.y = newY
        this.normalizeDirection()
    }

    normalizeDirection() {
        const length = Math.sqrt(this.direction.x ** 2 + this.direction.y ** 2 + this.direction.z ** 2)
        if (length > 0) {
            this.direction.x /= length
            this.direction.y /= length
            this.direction.z /= length
        }
    }

    pushState() {
        this.stack.push({ x: this.x, y: this.y, z: this.z, direction: { ...this.direction } })
    }

    popState() {
        if (this.stack.length > 0) {
            const state = this.stack.pop()
            this.x = state.x
            this.y = state.y
            this.z = state.z
            this.direction = state.direction
        }
    }
}
