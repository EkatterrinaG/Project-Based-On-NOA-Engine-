# Voxel Mining Game

A Minecraft-like voxel-based 3D game with procedurally generated infinite worlds, crafting, and mining.

## Features

- Infinite procedurally generated worlds with unique seeds
- 4 biomes: Forest, Desert, Snow, Field
- Cave systems and ore deposits
- L-System generated trees and plants
- Crafting system with procedural recipes
- Furnace smelting
- Tool durability and mining speeds

## Technologies

- **noa-engine** - Voxel world engine
- **Babylon.js** - 3D rendering
- **Simplex-noise** - Procedural terrain generation
- **Vite** - Build tool

## Installation

```bash
# Install dependencies
npm install
```

## Running the Game

### Development Mode

```bash
npm test
```

Opens development server at `http://localhost:8080`

### Production Build

```bash
npm run build
```

Outputs to `docs/` folder.

## Controls

| Key       | Action              |
|-----------|---------------------|
| W A S D   | Move                |
| Space     | Jump                |
| Shift     | Sprint              |
| Left Click| Mine block          |
| Right Click| Place block        |
| E         | Open inventory      |
| 1-9       | Select hotbar slot  |
| Mouse     | Look around         |

## Project Structure

```
src/
├── index.html          # Main menu
├── menu.js             # World selection
└── game/
    ├── index.html      # Game UI
    ├── index.js        # Entry point
    ├── engine.js       # NOA engine setup
    ├── player.js       # Player controller
    ├── blocks/         # Block definitions
    ├── items/          # Inventory & crafting
    ├── machines/       # Furnace & crafting table
    ├── world/          # World generation
    ├── Plants/         # Plant spawning
    └── textures/       # Procedural textures
```

## Configuration

Key settings in [world-config.js](src/game/config/world-config.js):

- Chunk size: 32 blocks
- World height: 128 blocks
- Biome region size: 512 blocks

## Creating a World

1. Launch the game
2. Enter a world name
3. Optionally provide a seed (or leave blank for random)
4. Click "Create World"

Worlds are saved in localStorage and can be resumed later.

## License

Based on [noa-examples](https://github.com/fenomas/noa-examples) by fenomas.
