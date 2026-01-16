/**
 * Main Menu Logic
 */

// State
let worlds = []
let selectedWorldIndex = -1

// DOM Elements
const views = {
    main: document.getElementById('main-menu-view'),
    worldSelection: document.getElementById('world-selection-view'),
    loading: document.getElementById('loading-view')
}

// Buttons
const btns = {
    singleplayer: document.getElementById('btn-singleplayer'),
    settings: document.getElementById('btn-settings'),
    quit: document.getElementById('btn-quit'),
    playWorld: document.getElementById('btn-play-world'),
    deleteWorld: document.getElementById('btn-delete-world'),
    backMenu: document.getElementById('btn-back-menu')
}

// World List & Form
const worldList = document.getElementById('world-list')
const createForm = document.getElementById('create-world-form')
const nameInput = document.getElementById('new-world-name')
const seedInput = document.getElementById('new-world-seed')

// Initialization
function init() {
    loadWorlds()
    setupEventListeners()
}

// Load worlds from localStorage
function loadWorlds() {
    const storedWorlds = localStorage.getItem('mine_worlds')
    if (storedWorlds) {
        try {
            worlds = JSON.parse(storedWorlds)
            // Sort by last played (newest first)
            worlds.sort((a, b) => b.lastPlayed - a.lastPlayed)
        } catch (e) {
            console.error('Failed to parse worlds:', e)
            worlds = []
        }
    }
    renderWorldList()
}

// Save worlds to localStorage
function saveWorlds() {
    localStorage.setItem('mine_worlds', JSON.stringify(worlds))
}

// Render the list of worlds
function renderWorldList() {
    worldList.innerHTML = ''

    if (worlds.length === 0) {
        worldList.innerHTML = '<div class="no-worlds-message">Нет созданных миров</div>'
        return
    }

    worlds.forEach((world, index) => {
        const item = document.createElement('div')
        item.className = 'world-item'
        if (index === selectedWorldIndex) {
            item.classList.add('selected')
        }

        const date = new Date(world.lastPlayed).toLocaleString()

        item.innerHTML = `
            <div class="world-name">${escapeHtml(world.name)}</div>
            <div class="world-details">Seed: ${world.seed} • Last Played: ${date}</div>
        `

        item.addEventListener('click', () => selectWorld(index))
        item.addEventListener('dblclick', () => {
            selectWorld(index)
            playWorld()
        })

        worldList.appendChild(item)
    })

    updateControls()
}

// Select a world
function selectWorld(index) {
    selectedWorldIndex = index
    renderWorldList() // Re-render to show selection
}

// Update button states
function updateControls() {
    const hasSelection = selectedWorldIndex !== -1
    btns.playWorld.disabled = !hasSelection
    btns.deleteWorld.disabled = !hasSelection
}

// Switch menu views
function switchView(viewName) {
    Object.values(views).forEach(view => view.classList.remove('active'))
    views[viewName].classList.add('active')
}

// Create a new world
function createWorld(e) {
    e.preventDefault()

    const name = nameInput.value.trim()
    if (!name) return

    let seed = seedInput.value.trim()
    if (!seed) {
        // Generate random numeric seed
        seed = Math.floor(Math.random() * 1000000000).toString()
    }

    const newWorld = {
        name: name,
        seed: seed,
        created: Date.now(),
        lastPlayed: Date.now()
    }

    worlds.unshift(newWorld) // Add to beginning
    saveWorlds()

    // Reset form
    nameInput.value = ''
    seedInput.value = ''

    // Select the new world
    selectedWorldIndex = 0
    renderWorldList()
}

// Delete selected world
function deleteWorld() {
    if (selectedWorldIndex === -1) return

    const worldName = worlds[selectedWorldIndex].name
    if (confirm(`You sure you want to delete world "${worldName}"?`)) {
        worlds.splice(selectedWorldIndex, 1)
        selectedWorldIndex = -1
        saveWorlds()
        renderWorldList()
    }
}

// Launch the game
function playWorld() {
    if (selectedWorldIndex === -1) return

    const world = worlds[selectedWorldIndex]

    // Update last played time
    world.lastPlayed = Date.now()
    saveWorlds()

    // Show loading view
    const loadingText = document.getElementById('loading-text')
    if (loadingText) loadingText.textContent = `Loading world "${world.name}"...`
    switchView('loading')

    // Launch game with parameters after a short delay to allow UI to update
    setTimeout(() => {
        const url = `game/?seed=${encodeURIComponent(world.seed)}&name=${encodeURIComponent(world.name)}`
        window.location.href = url
    }, 100)
}

// Helper to escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}

// Event Listeners
function setupEventListeners() {
    // Nav
    if (btns.singleplayer) btns.singleplayer.addEventListener('click', () => switchView('worldSelection'))
    if (btns.settings) btns.settings.addEventListener('click', () => alert('Settings not implemented yet'))
    if (btns.quit) btns.quit.addEventListener('click', () => {
        if (confirm('Exit game?')) window.close()
    })

    if (btns.backMenu) btns.backMenu.addEventListener('click', () => switchView('main'))

    // World Actions
    if (createForm) createForm.addEventListener('submit', createWorld)
    if (btns.playWorld) btns.playWorld.addEventListener('click', playWorld)
    if (btns.deleteWorld) btns.deleteWorld.addEventListener('click', deleteWorld)
}

// Start
init()
