// ===================
// CONFIGURACIÓN
// ===================
const API_BASE_URL = "https://pokeapi.co/api/v2";
let allPokemon = [];
let filteredPokemon = [];

let searchTerm = "";
let selectedTypes = [];
let selectedGeneration = "";
let sortCriteria = "id";

// ===================
// REFERENCIAS AL DOM
// ===================
const pokemonGrid = document.getElementById("pokemonGrid");
const loading = document.getElementById("loading");
const emptyMessage = document.getElementById("emptyMessage");
const resultsCount = document.getElementById("resultsCount");

const searchInput = document.getElementById("search");
const typeFiltersContainer = document.getElementById("typeFilters");
const generationSelect = document.getElementById("generation");
const sortSelect = document.getElementById("sort");
const clearFiltersBtn = document.getElementById("clearFilters");

// Modal
const pokemonModal = document.getElementById("pokemonModal");
const modalTitle = document.getElementById("modalTitle");
const modalContent = document.getElementById("modalContent");
const closeModal = document.getElementById("closeModal");

// ===================
// ARRANQUE
// ===================
document.addEventListener("DOMContentLoaded", async () => {
    showLoading(true);
    await loadAllPokemon();
    createTypeFilters();
    applyFilters();
    showLoading(false);
});

// ===================
// CARGA DE DATOS
// ===================
async function loadAllPokemon() {
    try {
        const limit = 151; // Limitar a la primera generación
        const response = await fetch(`${API_BASE_URL}/pokemon?limit=${limit}`);
        
        // 📌 VALIDACIÓN DE RESPUESTA
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();

        const promises = data.results.map(async (p) => {
            const res = await fetch(p.url);
            
            // 📌 VALIDACIÓN DE RESPUESTA INDIVIDUAL
            if (!res.ok) {
                throw new Error(`Error al cargar datos de ${p.name}: ${res.status}`);
            }
            
            return res.json();
        });
        allPokemon = await Promise.all(promises);
    } catch (error) {
        console.error("Error cargando Pokémon:", error);
    }
}

// ===================
// FILTROS
// ===================
function applyFilters() {
    filteredPokemon = allPokemon
        .filter(p => filterByName(p))
        .filter(p => filterByType(p))
        .filter(p => filterByGeneration(p));

    sortPokemon();
    renderPokemonGrid();
}

function filterByName(pokemon) {
    return pokemon.name.toLowerCase().includes(searchTerm.toLowerCase());
}

function filterByType(pokemon) {
    if (selectedTypes.length === 0) return true;
    return pokemon.types.some(t => selectedTypes.includes(t.type.name));
}

function filterByGeneration(pokemon) {
    if (!selectedGeneration) return true;
    const generationRanges = {
        "1": [1, 151],
        "2": [152, 251],
        "3": [252, 386],
        "4": [387, 493],
        "5": [494, 649],
        "6": [650, 721],
        "7": [722, 809],
    };
    const [start, end] = generationRanges[selectedGeneration];
    return pokemon.id >= start && pokemon.id <= end;
}

function sortPokemon() {
    switch (sortCriteria) {
        case "name":
            filteredPokemon.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case "height":
            filteredPokemon.sort((a, b) => a.height - b.height);
            break;
        case "weight":
            filteredPokemon.sort((a, b) => a.weight - b.weight);
            break;
        default:
            filteredPokemon.sort((a, b) => a.id - b.id);
    }
}

// ===================
// RENDER
// ===================
function renderPokemonGrid() {
    pokemonGrid.innerHTML = "";
    resultsCount.textContent = filteredPokemon.length;

    if (filteredPokemon.length === 0) {
        emptyMessage.classList.remove("hidden");
        return;
    } else {
        emptyMessage.classList.add("hidden");
    }

    filteredPokemon.forEach(pokemon => {
        const card = document.createElement("div");
        card.className = "bg-white p-4 rounded shadow hover:shadow-lg transition cursor-pointer";

        card.innerHTML = `
            <img src="${pokemon.sprites.front_default}" 
                 alt="${pokemon.name}" 
                 class="mx-auto w-20 h-20">
            <h3 class="text-center capitalize font-semibold mt-2">#${pokemon.id} ${pokemon.name}</h3>
            <div class="flex justify-center flex-wrap mt-2">
                ${createTypeBadges(pokemon.types)}
            </div>
        `;

        card.addEventListener("click", () => {
            showPokemonDetails(pokemon.id);
        });

        pokemonGrid.appendChild(card);
    });
}

function createTypeBadges(types) {
    const colors = {
        normal: 'bg-gray-400',
        fire: 'bg-red-500',
        water: 'bg-blue-500',
        electric: 'bg-yellow-400',
        grass: 'bg-green-500',
        ice: 'bg-blue-300',
        fighting: 'bg-red-700',
        poison: 'bg-purple-500',
        ground: 'bg-yellow-600',
        flying: 'bg-indigo-400',
        psychic: 'bg-pink-500',
        bug: 'bg-green-400',
        rock: 'bg-yellow-800',
        ghost: 'bg-purple-700',
        dragon: 'bg-indigo-700',
        dark: 'bg-gray-800',
        steel: 'bg-gray-500',
        fairy: 'bg-pink-300'
    };

    return types.map(t =>
        `<span class="px-2 py-1 m-1 text-xs text-white rounded ${colors[t.type.name] || 'bg-gray-400'}">
            ${t.type.name}
        </span>`
    ).join('');
}

// ===================
// MODAL
// ===================
function showPokemonDetails(pokemonId) {
    showLoading(true);

    const pokemon = allPokemon.find(p => p.id === pokemonId);

    if (!pokemon) {
        console.error("Pokémon no encontrado en los datos locales:", pokemonId);
        showLoading(false);
        return;
    }

    modalTitle.textContent = `#${pokemon.id} ${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}`;

    modalContent.innerHTML = `
        <div class="text-center mb-4">
            <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" class="w-32 h-32 mx-auto">
        </div>
        <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
                <h3 class="font-semibold text-gray-700">Altura:</h3>
                <p>${pokemon.height / 10} m</p>
            </div>
            <div>
                <h3 class="font-semibold text-gray-700">Peso:</h3>
                <p>${pokemon.weight / 10} kg</p>
            </div>
        </div>
        <div class="mb-4">
            <h3 class="font-semibold text-gray-700 mb-2">Tipos:</h3>
            ${createTypeBadges(pokemon.types)}
        </div>
        <div class="mb-4">
            <h3 class="font-semibold text-gray-700 mb-2">Habilidades:</h3>
            <ul class="list-disc list-inside">
                ${pokemon.abilities.map(a => `<li class="capitalize">${a.ability.name.replace('-', ' ')}</li>`).join('')}
            </ul>
        </div>
        <div>
            <h3 class="font-semibold text-gray-700 mb-2">Estadísticas Base:</h3>
            ${createStatsDisplay(pokemon.stats)}
        </div>
    `;

    pokemonModal.classList.remove("hidden");
    pokemonModal.classList.add("flex");
    showLoading(false);
}

function createStatsDisplay(stats) {
    return stats.map(stat => {
        const statName = stat.stat.name.replace('-', ' ');
        const statValue = stat.base_stat;
        const percentage = Math.min((statValue / 200) * 100, 100);
        return `
            <div class="mb-2">
                <div class="flex justify-between text-sm">
                    <span class="capitalize">${statName}</span>
                    <span>${statValue}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-blue-500 h-2 rounded-full" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

// ===================
// EVENTOS
// ===================
let searchTimeout;
searchInput.addEventListener("input", e => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        searchTerm = e.target.value;
        applyFilters();
    }, 300);
});

function createTypeFilters() {
    const types = [
        "normal", "fire", "water", "electric", "grass", "ice",
        "fighting", "poison", "ground", "flying", "psychic",
        "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"
    ];

    types.forEach(type => {
        const btn = document.createElement("button");
        btn.textContent = type;
        btn.className = "px-2 py-1 rounded text-white bg-gray-400 hover:opacity-80 text-xs";
        
        btn.addEventListener("click", () => {
            if (selectedTypes.includes(type)) {
                selectedTypes = selectedTypes.filter(t => t !== type);
                btn.classList.remove("ring", "ring-offset-2", "ring-blue-500");
            } else {
                selectedTypes.push(type);
                btn.classList.add("ring", "ring-offset-2", "ring-blue-500");
            }
            applyFilters();
        });

        typeFiltersContainer.appendChild(btn);
    });
}

generationSelect.addEventListener("change", e => {
    selectedGeneration = e.target.value;
    applyFilters();
});

sortSelect.addEventListener("change", e => {
    sortCriteria = e.target.value;
    applyFilters();
});

clearFiltersBtn.addEventListener("click", () => {
    searchTerm = "";
    selectedTypes = [];
    selectedGeneration = "";
    sortCriteria = "id";

    searchInput.value = "";
    generationSelect.value = "";
    sortSelect.value = "id";

    Array.from(typeFiltersContainer.children).forEach(btn => {
        btn.classList.remove("ring", "ring-offset-2", "ring-blue-500");
    });

    applyFilters();
});

closeModal.addEventListener("click", () => {
    pokemonModal.classList.add("hidden");
    pokemonModal.classList.remove("flex");
});

pokemonModal.addEventListener("click", (e) => {
    if (e.target.id === "pokemonModal") {
        pokemonModal.classList.add("hidden");
        pokemonModal.classList.remove("flex");
    }
});

// ===================
// UTILS
// ===================
function showLoading(show) {
    if (show) {
        loading.classList.remove("hidden");
    } else {
        loading.classList.add("hidden");
    }
}