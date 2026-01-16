
import { noa } from '../engine'
import { ParticleSystem, Texture, Vector3, Color4 } from '@babylonjs/core'

/**
 * Creates a particle system for block-breaking effects.
 * @param {import('@babylonjs/core').Scene} scene The Babylon.js scene.
 * @param {number} blockID The ID of the block being broken.
 * @returns {import('@babylonjs/core').ParticleSystem} The created particle system.
 */
export function createBlockParticles(scene, blockID) {
    const particleSystem = new ParticleSystem('particles', 200, scene)

    // Get material info from the engine
    const matName = noa.registry.getBlockFaceMaterial(blockID, 0) // face 0
    console.log('[Particles] blockID:', blockID, 'matName:', matName)
    const matData = noa.registry.getMaterialData(matName)
    console.log('[Particles] matData:', matData)
    const url = matData ? (matData.texture || matData.textureURL) : null
    console.log('[Particles] url:', url)

    if (url) {
        const tex = new Texture(url, scene)
        particleSystem.particleTexture = tex

        if (matData.atlasIndex !== undefined) {
            // Assuming a vertical atlas
            const variationCount = 64 // This seems to be a common value in the project
            tex.vScale = 1 / variationCount
            tex.vOffset = matData.atlasIndex / variationCount
        }
    }

    // Particle settings
    particleSystem.emitter = new Vector3(0, 0, 0)
    particleSystem.minEmitBox = new Vector3(-0.5, -0.5, -0.5)
    particleSystem.maxEmitBox = new Vector3(0.5, 0.5, 0.5)

    particleSystem.color1 = new Color4(1, 1, 1, 1)
    particleSystem.color2 = new Color4(1, 1, 1, 1)
    particleSystem.colorDead = new Color4(1, 1, 1, 0)

    particleSystem.minSize = 0.1
    particleSystem.maxSize = 0.2

    particleSystem.minLifeTime = 0.2
    particleSystem.maxLifeTime = 1

    particleSystem.emitRate = 200

    particleSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD

    particleSystem.gravity = new Vector3(0, -9.81, 0)

    particleSystem.direction1 = new Vector3(-2, 2, -2)
    particleSystem.direction2 = new Vector3(2, 2, 2)

    particleSystem.minAngularSpeed = -5
    particleSystem.maxAngularSpeed = 5

    particleSystem.targetStopDuration = 0.2
    particleSystem.disposeOnStop = true

    return particleSystem
}
