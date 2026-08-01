const POKEMONS = [
    { id: 1, name: 'Bulbasaur', type: 'Трава / Яд', reqTasks: 0, desc: 'Бульбазавр — стартовый покемон первого поколения. На спине у него растёт луковица, которая обеспечивает его энергией.', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png' },
    { id: 2, name: 'Ivysaur', type: 'Трава / Яд', reqTasks: 10, desc: 'Ивизавр — эволюция Бульбазавра. Бутон на его спине начинает распускаться, поэтому он больше не может стоять на задних лапах.', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/2.png' },
    { id: 3, name: 'Venusaur', type: 'Трава / Яд', reqTasks: 25, desc: 'Венузавр — финальная эволюция Бульбазавра. Цветок на его спине распустился и привлекает покемонов своим ароматом.', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png' },
    
    { id: 4, name: 'Charmander', type: 'Огонь', reqTasks: 0, desc: 'Чармандер — стартовый огненный покемон. Пламя на кончике его хвоста показывает его жизненную силу и эмоции.', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png' },
    { id: 5, name: 'Charmeleon', type: 'Огонь', reqTasks: 10, desc: 'Чармелеон — эволюция Чармандера. Обладает крайне агрессивным характером и постоянно ищет сильных противников.', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/5.png' },
    { id: 6, name: 'Charizard', type: 'Огонь / Летающий', reqTasks: 25, desc: 'Чаризард — финальная эволюция Чармандера. Его огненное дыхание способно расплавить камни. Он летает в поисках сильных битв.', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png' },
    
    { id: 7, name: 'Squirtle', type: 'Вода', reqTasks: 0, desc: 'Сквиртл — стартовый водный покемон. Его панцирь используется не только для защиты, но и для снижения сопротивления воды при плавании.', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png' },
    { id: 8, name: 'Wartortle', type: 'Вода', reqTasks: 10, desc: 'Вартортл — эволюция Сквиртла. Его пушистый хвост является символом долголетия, поэтому он популярен среди пожилых людей.', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/8.png' },
    { id: 9, name: 'Blastoise', type: 'Вода', reqTasks: 25, desc: 'Бластойз — финальная эволюция Сквиртла. Водяные пушки на его панцире могут пробить даже толстую стальную броню.', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png' },
    
    { id: 25, name: 'Pikachu', type: 'Электрический', reqTasks: 0, desc: 'Пикачу — мышь-покемон. В его щеках хранятся запасы электричества, которые он высвобождает в случае опасности.', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png' },
    { id: 26, name: 'Raichu', type: 'Электрический', reqTasks: 15, desc: 'Райчу — эволюция Пикачу. Его электрические атаки могут достигать 100 000 вольт, чего достаточно, чтобы вырубить индийского слона.', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/26.png' },
    
    { id: 143, name: 'Snorlax', type: 'Обычный', reqTasks: 50, desc: 'Снорлакс — один из самых тяжелых покемонов. Он спит целыми днями и просыпается только чтобы съесть 400 килограммов еды.', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png' }
];

// Pokedex UI Logic
document.addEventListener('DOMContentLoaded', () => {
    const modalPokedex = document.getElementById('modal-pokedex');
    const btnOpenPokedex = document.getElementById('btn-open-pokedex');
    const btnClosePokedex = document.getElementById('btn-close-pokedex');
    
    const tabUnlocked = document.getElementById('tab-unlocked');
    const tabLocked = document.getElementById('tab-locked');
    const pokedexGrid = document.getElementById('pokedex-grid');
    
    const dexName = document.getElementById('dex-name');
    const dexImage = document.getElementById('dex-image');
    const dexTypes = document.getElementById('dex-types');
    const dexDesc = document.getElementById('dex-desc');
    const dexReq = document.getElementById('dex-req');
    const btnTrainPokemon = document.getElementById('btn-train-pokemon');
    
    let currentTab = 'unlocked';
    let selectedPokemonId = null;
    
    // Default active pokemon (Pikachu)
    if (!localStorage.getItem('activePokemonId')) {
        localStorage.setItem('activePokemonId', 25);
    }
    
    if (btnOpenPokedex) {
        btnOpenPokedex.addEventListener('click', () => {
            modalPokedex.classList.add('active');
            renderGrid();
        });
    }
    
    if (btnClosePokedex) {
        btnClosePokedex.addEventListener('click', () => {
            modalPokedex.classList.remove('active');
        });
    }
    
    tabUnlocked.addEventListener('click', () => {
        currentTab = 'unlocked';
        tabUnlocked.style.background = '#ff4757';
        tabUnlocked.style.color = 'white';
        tabLocked.style.background = '#232c33';
        tabLocked.style.color = 'var(--text-muted)';
        renderGrid();
    });
    
    tabLocked.addEventListener('click', () => {
        currentTab = 'locked';
        tabLocked.style.background = '#ff4757';
        tabLocked.style.color = 'white';
        tabUnlocked.style.background = '#232c33';
        tabUnlocked.style.color = 'var(--text-muted)';
        renderGrid();
    });
    
    function getCompletedTasksCount() {
        return window.completedTasksGlobalCount || 0;
    }
    
    window.updatePokedexState = function(completedCount) {
        window.completedTasksGlobalCount = completedCount;
        const activeId = parseInt(localStorage.getItem('activePokemonId'));
        const activePokemon = POKEMONS.find(p => p.id === activeId);
        
        // Update footer active sprite
        const activeSpriteEl = document.getElementById('footer-active-pokemon');
        if (activePokemon && activeSpriteEl) {
            activeSpriteEl.src = activePokemon.sprite;
        }
        
        // Update progress bar
        if (activePokemon) {
            const nextEvolution = POKEMONS.find(p => p.reqTasks > activePokemon.reqTasks && (p.id === activeId+1 || (activeId===25 && p.id===26)));
            
            let req = activePokemon.reqTasks || 10; 
            let target = nextEvolution ? nextEvolution.reqTasks : req + 10; // If max, just set an arbitrary goal
            if(nextEvolution) target = nextEvolution.reqTasks;
            else target = activePokemon.reqTasks; // Maxed out
            
            const fill = document.getElementById('progress-fill');
            const textVal = document.getElementById('progress-text-val');
            
            if (fill && textVal) {
                if (activePokemon.reqTasks === target) {
                    // Max level
                    fill.style.width = '100%';
                    textVal.innerHTML = `<span style="color:#f1c40f">МАКСИМУМ!</span> (${completedCount} задач)`;
                } else {
                    let currentExp = completedCount;
                    let neededExp = target;
                    let percentage = Math.min(100, Math.round((currentExp / neededExp) * 100));
                    fill.style.width = percentage + '%';
                    textVal.textContent = `EXP: ${currentExp} / ${neededExp}`;
                }
            }
        }
    };
    
    function renderGrid() {
        pokedexGrid.innerHTML = '';
        const completedCount = getCompletedTasksCount();
        
        POKEMONS.forEach(pokemon => {
            const isUnlocked = completedCount >= pokemon.reqTasks;
            
            if ((currentTab === 'unlocked' && isUnlocked) || (currentTab === 'locked' && !isUnlocked)) {
                const icon = document.createElement('div');
                icon.style.cssText = `
                    width: 80px; height: 80px; 
                    background: ${isUnlocked ? 'rgba(46, 213, 115, 0.15)' : 'rgba(255,255,255,0.02)'}; 
                    border: 2px solid ${isUnlocked ? '#2ed573' : '#232c33'}; 
                    border-radius: 0.5rem; 
                    display: flex; align-items: center; justify-content: center; 
                    cursor: pointer; transition: transform 0.2s;
                `;
                icon.onmouseover = () => icon.style.transform = 'scale(1.1)';
                icon.onmouseout = () => icon.style.transform = 'scale(1)';
                
                const img = document.createElement('img');
                img.src = pokemon.sprite;
                img.style.cssText = `width: 100%; height: 100%; image-rendering: pixelated; ${!isUnlocked ? 'filter: brightness(0); opacity: 0.5;' : ''}`;
                
                icon.appendChild(img);
                
                icon.addEventListener('click', () => selectPokemon(pokemon, isUnlocked));
                
                pokedexGrid.appendChild(icon);
            }
        });
    }
    
    function selectPokemon(pokemon, isUnlocked) {
        selectedPokemonId = pokemon.id;
        dexName.textContent = pokemon.name;
        dexImage.src = pokemon.sprite;
        dexImage.style.filter = !isUnlocked ? 'brightness(0)' : 'drop-shadow(0 10px 10px rgba(0,0,0,0.2))';
        
        dexTypes.innerHTML = '';
        const types = pokemon.type.split(' / ');
        types.forEach(t => {
            const span = document.createElement('span');
            span.textContent = t;
            span.style.cssText = `background: #ff4757; color: white; padding: 0.2rem 0.6rem; border-radius: 1rem; font-size: 0.8rem; font-weight: bold; border: 2px solid #232c33;`;
            dexTypes.appendChild(span);
        });
        
        dexDesc.textContent = pokemon.desc;
        
        if (isUnlocked) {
            dexReq.textContent = `Разблокирован! (Открыто на ${pokemon.reqTasks} задачах)`;
            dexReq.style.color = '#2ed573';
            dexReq.style.borderColor = '#2ed573';
            dexReq.style.background = 'rgba(46,213,115,0.1)';
            
            btnTrainPokemon.style.display = 'flex';
            const activeId = parseInt(localStorage.getItem('activePokemonId'));
            if (activeId === pokemon.id) {
                btnTrainPokemon.textContent = 'УЖЕ В КОМАНДЕ';
                btnTrainPokemon.disabled = true;
                btnTrainPokemon.style.background = '#232c33';
                btnTrainPokemon.style.color = 'var(--text-muted)';
                btnTrainPokemon.style.borderColor = '#232c33';
            } else {
                btnTrainPokemon.textContent = 'ТРЕНИРОВАТЬ ЕГО';
                btnTrainPokemon.disabled = false;
                btnTrainPokemon.style.background = '#ff4757';
                btnTrainPokemon.style.color = 'white';
                btnTrainPokemon.style.borderColor = '#ff4757';
            }
        } else {
            dexReq.textContent = `Требования: выполнить ${pokemon.reqTasks} задач (Текущий прогресс: ${getCompletedTasksCount()})`;
            dexReq.style.color = '#ff4757';
            dexReq.style.borderColor = '#ff4757';
            dexReq.style.background = 'rgba(255,71,87,0.1)';
            btnTrainPokemon.style.display = 'none';
        }
    }
    
    if (btnTrainPokemon) {
        btnTrainPokemon.addEventListener('click', () => {
            if (selectedPokemonId) {
                localStorage.setItem('activePokemonId', selectedPokemonId);
                window.updatePokedexState(getCompletedTasksCount());
                selectPokemon(POKEMONS.find(p => p.id === selectedPokemonId), true);
            }
        });
    }
});
