document.addEventListener('DOMContentLoaded', () => {

    let selectedTags = [];
    let currentUser = null;
    let isOwnerLoggedIn = false;
    window.isOwnerLoggedIn = false;

    function getSessionToken() {
        return localStorage.getItem('session_token') || '';
    }

    async function authFetch(url, options = {}) {
        options.headers = options.headers || {};
        options.credentials = 'include';
        const token = getSessionToken();
        if (token) {
            if (options.headers instanceof Headers) {
                options.headers.set('x-session-token', token);
            } else {
                options.headers['x-session-token'] = token;
            }
        }
        const response = await fetch(url, options);
        if (response.status === 401) {
            updateUserUI(null);
        }
        return response;
    }

    const modalOAuthOverlay = document.getElementById('modal-oauth');
    const btnLoginModal = document.getElementById('btn-login-modal');
    const btnCloseOAuth = document.getElementById('btn-close-oauth');
    const userProfileWidget = document.getElementById('user-profile-widget');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const btnLogout = document.getElementById('btn-logout');

    function openOAuthModal() {
        if (modalOAuthOverlay) modalOAuthOverlay.classList.add('active');
    }

    function closeOAuthModal() {
        if (modalOAuthOverlay) modalOAuthOverlay.classList.remove('active');
    }

    if (btnLoginModal) btnLoginModal.addEventListener('click', openOAuthModal);
    if (btnCloseOAuth) btnCloseOAuth.addEventListener('click', closeOAuthModal);

    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            try {
                await authFetch('/api/auth/logout', { method: 'POST' });
            } catch(e) {}
            localStorage.removeItem('session_token');
            updateUserUI(null);
            fetchTasks();
        });
    }

    async function checkOwnerStatus() {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionToken = urlParams.get('session');
        if (sessionToken) {
            localStorage.setItem('session_token', sessionToken);
            history.replaceState(null, '', window.location.pathname);
        }

        try {
            const res = await authFetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                updateUserUI(data.user);
            } else {
                updateUserUI(null);
            }
        } catch(e) {
            updateUserUI(null);
        }
    }

    function updateUserUI(user) {
        currentUser = user;
        const isLoggedIn = !!user;
        isOwnerLoggedIn = isLoggedIn;
        window.isOwnerLoggedIn = isLoggedIn;
        document.body.classList.toggle('is-owner', isLoggedIn);

        if (userProfileWidget) userProfileWidget.style.display = isLoggedIn ? 'flex' : 'none';
        if (btnLoginModal) btnLoginModal.style.display = isLoggedIn ? 'none' : 'inline-flex';

        if (isLoggedIn && user) {
            if (userAvatar) userAvatar.src = user.avatar_url || 'images/disposal_log_logo.png';
            if (userName) userName.textContent = user.name || user.email || 'Пользователь';
            const userProviderText = document.getElementById('user-provider-text');
            if (userProviderText) {
                userProviderText.textContent = user.provider === 'github' ? '🐙 GitHub' : '🌐 Google';
            }
        }

        document.querySelectorAll('.owner-only').forEach(el => {
            el.style.display = isLoggedIn ? '' : 'none';
        });

        if (currentTasks && currentTasks.length > 0) {
            renderTasks(currentTasks);
        }
    }

    const btnAddModal = document.getElementById('btn-add-task');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancel = document.getElementById('btn-cancel');
    const modalOverlay = document.getElementById('modal-add');
    const formAddTask = document.getElementById('form-add-task');
    const modalTitle = document.getElementById('modal-title');
    const taskIdInput = document.getElementById('task-id');
    const existingImagesGroup = document.getElementById('existing-images-group');
    const existingImagesContainer = document.getElementById('existing-images-container');

    // View Modal
    const modalViewOverlay = document.getElementById('modal-view');
    const btnCloseView = document.getElementById('btn-close-view');
    const viewTitle = document.getElementById('view-title');
    const viewDesc = document.getElementById('view-desc');
    const viewTags = document.getElementById('view-tags');
    const viewMediaContainer = document.getElementById('view-media-container');
    const viewSubtasksList = document.getElementById('view-subtasks-list');
    const btnAddSubtask = document.getElementById('btn-add-subtask');

    // Settings Modal
    const btnSettings = document.getElementById('btn-settings');
    const modalSettingsOverlay = document.getElementById('modal-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const btnCancelSettings = document.getElementById('btn-cancel-settings');
    const formSettings = document.getElementById('form-settings');
    const settingsBotToken = document.getElementById('settings-bot-token');
    const settingsChannelId = document.getElementById('settings-channel-id');
    const settingsTemplate = document.getElementById('settings-template');

    if (btnSettings) {
        btnSettings.addEventListener('click', async () => {
            try {
                const res = await fetch('/api/settings');
                const settings = await res.json();
                settingsBotToken.value = settings.botToken;
                settingsChannelId.value = settings.channelId;
                settingsTemplate.value = settings.telegramTemplate || '';
                modalSettingsOverlay.classList.add('active');
            } catch(e) {
                console.error('Error fetching settings:', e);
                alert('Не удалось загрузить настройки');
            }
        });
    }

    const closeSettingsModal = () => {
        modalSettingsOverlay.classList.remove('active');
    };

    if (btnCloseSettings) btnCloseSettings.addEventListener('click', closeSettingsModal);
    if (btnCancelSettings) btnCancelSettings.addEventListener('click', closeSettingsModal);

    if (formSettings) {
        formSettings.addEventListener('submit', async (e) => {
            e.preventDefault();
            const botToken = settingsBotToken.value.trim();
            const channelId = settingsChannelId.value.trim();
            const telegramTemplate = settingsTemplate.value;
            
            try {
                const btnSubmit = formSettings.querySelector('button[type="submit"]');
                btnSubmit.disabled = true;
                btnSubmit.textContent = 'Сохранение...';

                const res = await authFetch('/api/settings', { method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ botToken, channelId, telegramTemplate })
                });

                if (res.ok) {
                    closeSettingsModal();
                    alert('Настройки успешно сохранены!');
                } else {
                    alert('Ошибка при сохранении настроек');
                }
            } catch(err) {
                console.error(err);
                alert('Ошибка сети при сохранении настроек');
            } finally {
                const btnSubmit = formSettings.querySelector('button[type="submit"]');
                btnSubmit.disabled = false;
                btnSubmit.textContent = 'Сохранить';
            }
        });
    }

    btnCloseView.addEventListener('click', () => {
        modalViewOverlay.classList.remove('active');
    });

    const listTodo = document.getElementById('list-todo');
    const listInProgress = document.getElementById('list-in-progress');
    const listDone = document.getElementById('list-done');
    const countTodo = document.getElementById('count-todo');
    const countInProgress = document.getElementById('count-in-progress');
    const countDone = document.getElementById('count-done');

    // Tags UI
    const tagsContainer = document.getElementById('tags-container');
    const selectedTagsJsonInput = document.getElementById('selected-tags-json');
    const btnShowNewTag = document.getElementById('btn-show-new-tag');
    const newTagForm = document.getElementById('new-tag-form');
    const btnSaveNewTag = document.getElementById('btn-save-new-tag');
    const newTagNameInput = document.getElementById('new-tag-name');
    const newTagColorInput = document.getElementById('new-tag-color');

    // View Mode Toggle
    const btnViews = document.querySelectorAll('.btn-view');
    const board = document.querySelector('.board');
    
    // Load saved view mode
    const savedView = localStorage.getItem('kanban_view_mode') || '1';
    board.dataset.view = savedView;
    btnViews.forEach(btn => {
        if (btn.dataset.view === savedView) btn.classList.add('active');
        else btn.classList.remove('active');
        
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            board.dataset.view = view;
            localStorage.setItem('kanban_view_mode', view);
            btnViews.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTasks(currentTasks);
        });
    });

    let currentTasks = [];
    let currentExistingImages = [];
    let allTags = [];

    // Native Drag & Drop State
    window.draggedTaskEl = null;
    let hoverTimer = null;
    let hoverTarget = null;
    let hoverZone = null; // 'center' or 'edge'

    // Make task lists valid drop targets
    [listTodo, listInProgress, listDone].forEach(list => {
        list.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necessary to allow dropping
            // Add a visual indicator if empty column
            if (!list.querySelector('.task-card') || e.target === list || e.target.classList.contains('task-list-column')) {
                list.classList.add('drag-over-list');
            }
        });
        
        list.addEventListener('dragleave', (e) => {
            if (e.target === list || e.target.classList.contains('task-list-column')) {
                list.classList.remove('drag-over-list');
            }
        });

        list.addEventListener('drop', async (e) => {
            e.preventDefault();
            list.classList.remove('drag-over-list');
            
            if (window.draggedTaskEl && (e.target === list || e.target.classList.contains('task-list-column') || !e.target.closest('.task-card'))) {
                const draggedEl = window.draggedTaskEl;
                const sourceList = window.draggedSourceList;
                const dragMode = window.dragMode;
                const isTodoColumn = list.dataset.status === 'todo';
                
                const sourceStack = (dragMode === 'single' && draggedEl.parentNode && draggedEl.parentNode.classList.contains('stack-container')) 
                    ? draggedEl.parentNode 
                    : null;

                // Find the shortest column in the list to append to
                const cols = Array.from(list.querySelectorAll('.task-list-column'));
                let targetCol = list;
                if (cols.length > 0) {
                    targetCol = cols.reduce((shortest, current) => {
                        const sCount = shortest.querySelectorAll('.task-card').length;
                        const cCount = current.querySelectorAll('.task-card').length;
                        return cCount < sCount ? current : shortest;
                    }, cols[0]);
                }

                if (dragMode === 'group' && !isTodoColumn) {
                    // Dissolve stack container in DOM since stacks are only for TODO
                    const cards = Array.from(draggedEl.children);
                    cards.forEach(card => {
                        targetCol.appendChild(card);
                        clearStackStyles(card);
                    });
                } else {
                    targetCol.appendChild(draggedEl);
                    if (dragMode === 'single') {
                        clearStackStyles(draggedEl);
                    }
                }
                
                if (dragMode === 'single' && sourceStack) {
                    const draggedId = draggedEl.dataset.id;
                    restyleStack(sourceStack);
                    await authFetch(`/api/tasks/${draggedId}/unlink`, { method: 'PUT' });
                }
                
                await updatePositions(list);
                if (sourceList && sourceList !== list) {
                    await updatePositions(sourceList);
                }
                checkOwnerStatus();
    fetchTasks();
            }
            clearHoverState();
        });
    });

    async function updatePositions(listEl) {
        if (!listEl) return;
        if (listEl.classList.contains('task-list-column')) {
            listEl = listEl.closest('.task-list');
        }
        const newStatus = listEl.dataset.status;
        const updates = [];
        let position = 0;
        
        const columns = Array.from(listEl.children).filter(c => c.classList.contains('task-list-column'));
        
        if (columns.length > 0) {
            let hasMore = true;
            let rowIndex = 0;
            while (hasMore) {
                hasMore = false;
                columns.forEach(col => {
                    const children = Array.from(col.children);
                    if (rowIndex < children.length) {
                        const child = children[rowIndex];
                        if (child.classList.contains('task-card')) {
                            updates.push({
                                id: child.dataset.id,
                                status: newStatus,
                                position: position++
                            });
                        } else if (child.classList.contains('stack-container')) {
                            const stackCards = Array.from(child.children).reverse();
                            stackCards.forEach(card => {
                                updates.push({
                                    id: card.dataset.id,
                                    status: newStatus,
                                    position: position++
                                });
                            });
                        }
                        hasMore = true;
                    }
                });
                rowIndex++;
            }
        } else {
            Array.from(listEl.children).forEach(child => {
                if (child.classList.contains('task-card')) {
                    updates.push({
                        id: child.dataset.id,
                        status: newStatus,
                        position: position++
                    });
                } else if (child.classList.contains('stack-container')) {
                    const stackCards = Array.from(child.children).reverse();
                    stackCards.forEach(card => {
                        updates.push({
                            id: card.dataset.id,
                            status: newStatus,
                            position: position++
                        });
                    });
                }
            });
        }

        updateCounters();

        try {
            await authFetch('/api/tasks/positions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates })
            });
        } catch (error) {
            console.error('Error updating task positions:', error);
        }
    }

    function clearHoverState() {
        if (hoverTimer) clearTimeout(hoverTimer);
        hoverTimer = null;
        if (hoverTarget) {
            hoverTarget.classList.remove('hover-center', 'hover-top', 'hover-bottom');
            const parent = hoverTarget.parentNode;
            if (parent && parent.classList.contains('stack-container')) {
                parent.classList.remove('hover-top', 'hover-bottom');
            }
        }
        hoverTarget = null;
        hoverZone = null;
    }

    function clearStackStyles(card) {
        card.style.position = '';
        card.style.top = '';
        card.style.left = '';
        card.style.width = '';
        card.style.height = '';
        card.style.zIndex = '';
        card.style.transform = '';
        card.style.display = '';
    }

    function restyleStack(stackContainer) {
        if (!stackContainer) return;
        const cards = Array.from(stackContainer.children);
        if (cards.length === 0) {
            stackContainer.remove();
            return;
        }
        if (cards.length === 1) {
            const singleCard = cards[0];
            clearStackStyles(singleCard);
            stackContainer.parentNode.replaceChild(singleCard, stackContainer);
            return;
        }
        
        const total = cards.length;
        let startVisibleIndex = Math.max(0, total - 3);
        
        cards.forEach((card, index) => {
            const isVisible = (index >= startVisibleIndex);
            if (!isVisible) {
                card.style.display = 'none';
                card.style.position = 'absolute';
                card.style.width = '';
                card.style.height = '';
                card.style.top = '';
                card.style.left = '';
            } else {
                card.style.display = '';
                const offsetIndex = index - startVisibleIndex;
                const offsetPx = offsetIndex * 6;
                
                card.style.position = 'absolute';
                card.style.top = `${offsetPx}px`;
                card.style.left = `${offsetPx}px`;
                card.style.width = '100%';
                card.style.height = '100%';
            }
            card.style.zIndex = index + 1;
        });

        const visibleCount = total - startVisibleIndex;
        const maxOffsetPx = (visibleCount - 1) * 6;
        stackContainer.style.marginBottom = `calc(1.5rem + ${maxOffsetPx}px)`;
        stackContainer.style.marginRight = `${maxOffsetPx}px`;
        
        adjustStackSize(stackContainer);
    }

    function adjustStackSize(stackContainer) {
        if (!stackContainer) return;
        const cards = Array.from(stackContainer.children);
        if (cards.length <= 1) {
            stackContainer.style.width = '';
            stackContainer.style.height = '';
            return;
        }

        const originalStyles = cards.map(card => {
            const style = {
                position: card.style.position,
                width: card.style.width,
                height: card.style.height,
                display: card.style.display
            };
            
            card.style.position = 'relative';
            card.style.width = '';
            card.style.height = '';
            card.style.display = '';
            
            return style;
        });

        const originalContainerWidth = stackContainer.style.width;
        const originalContainerHeight = stackContainer.style.height;
        stackContainer.style.width = '';
        stackContainer.style.height = '';

        let maxWidth = 0;
        let maxHeight = 0;
        
        cards.forEach(card => {
            const w = card.offsetWidth;
            const h = card.offsetHeight;
            if (w > maxWidth) maxWidth = w;
            if (h > maxHeight) maxHeight = h;
        });

        cards.forEach((card, i) => {
            card.style.position = originalStyles[i].position;
            card.style.width = originalStyles[i].width;
            card.style.height = originalStyles[i].height;
            card.style.display = originalStyles[i].display;
        });

        if (maxWidth > 0) {
            stackContainer.style.width = `${maxWidth}px`;
        } else {
            stackContainer.style.width = originalContainerWidth;
        }
        
        if (maxHeight > 0) {
            stackContainer.style.height = `${maxHeight}px`;
        } else {
            stackContainer.style.height = originalContainerHeight;
        }
    }

    // Initial fetch
    fetchTags();
    fetchTasks();

    // Modal Events
    btnAddModal.addEventListener('click', () => {
        modalTitle.textContent = 'Новая Механика';
        formAddTask.reset();
        taskIdInput.value = '';
        document.getElementById('task-parent-id').value = '';
        currentExistingImages = [];
        selectedTags = [];
        existingImagesGroup.style.display = 'none';
        existingImagesContainer.innerHTML = '';
        renderTagsUI();
        formAddTask.querySelector('button[type="submit"]').textContent = 'Создать задачу';
        modalOverlay.classList.add('active');
    });

    const closeModal = () => {
        modalOverlay.classList.remove('active');
        formAddTask.reset();
        taskIdInput.value = '';
        document.getElementById('task-parent-id').value = '';
        currentExistingImages = [];
        selectedTags = [];
        newTagForm.style.display = 'none';
        btnShowNewTag.style.display = 'inline-block';
    };

    // btnCloseModal.addEventListener('click', closeModal); // Убрано, так как кнопки закрытия больше нет
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);
    
    // Tag Creation Logic
    btnShowNewTag.addEventListener('click', () => {
        newTagForm.style.display = 'flex';
        btnShowNewTag.style.display = 'none';
    });

    btnSaveNewTag.addEventListener('click', async () => {
        const name = newTagNameInput.value.trim();
        const color = newTagColorInput.value;
        if (!name) return;

        try {
            const res = await authFetch('/api/tags', { method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color })
            });
            const newTag = await res.json();
            allTags.push(newTag);
            selectedTags.push(newTag); // Auto-select new tag
            newTagNameInput.value = '';
            newTagForm.style.display = 'none';
            btnShowNewTag.style.display = 'inline-block';
            renderTagsUI();
        } catch (error) {
            console.error('Error creating tag:', error);
        }
    });

    function toggleTagSelection(tag) {
        const index = selectedTags.findIndex(t => t.id === tag.id);
        if (index > -1) {
            selectedTags.splice(index, 1);
        } else {
            selectedTags.push(tag);
        }
        renderTagsUI();
    }

    function renderTagsUI() {
        tagsContainer.innerHTML = '';
        allTags.forEach(tag => {
            const isSelected = selectedTags.some(t => t.id === tag.id);
            const tagEl = document.createElement('span');
            tagEl.className = `tag-badge tag-selectable ${isSelected ? 'selected' : ''}`;
            tagEl.style.backgroundColor = tag.color;
            tagEl.textContent = tag.name;
            tagEl.addEventListener('click', () => toggleTagSelection(tag));
            tagsContainer.appendChild(tagEl);
        });
        selectedTagsJsonInput.value = JSON.stringify(selectedTags);
    }

    // Form Submit (Create or Edit)
    formAddTask.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(formAddTask);
        
        // Append existing images
        currentExistingImages.forEach(img => {
            formData.append('existing_images', img);
        });

        const taskId = taskIdInput.value;
        const isEdit = !!taskId;
        const method = isEdit ? 'PUT' : 'POST';
        const url = isEdit ? `/api/tasks/${taskId}` : '/api/tasks';
        
        try {
            const btnSubmit = formAddTask.querySelector('button[type="submit"]');
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Сохранение...';

            const response = await authFetch(url, { method, body: formData });

            if (response.ok) {
                closeModal();
                fetchTasks();
            } else {
                alert('Ошибка при сохранении задачи');
            }
        } catch (error) {
            console.error('Error saving task:', error);
            alert('Ошибка сети');
        } finally {
            const btnSubmit = formAddTask.querySelector('button[type="submit"]');
            btnSubmit.disabled = false;
        }
    });

    async function fetchTags() {
        try {
            const res = await fetch('/api/tags');
            allTags = await res.json();
        } catch (error) { console.error('Error fetching tags:', error); }
    }

    async function fetchTasks() {
        try {
            const res = await fetch('/api/tasks?t=' + Date.now());
            currentTasks = await res.json();
            renderTasks(currentTasks);
        } catch (error) { console.error('Error fetching tasks:', error); }
    }

    function updateCounters() {
        const cTodo = listTodo.querySelectorAll('.task-card').length;
        const cInProg = listInProgress.querySelectorAll('.task-card').length;
        const cDone = listDone.querySelectorAll('.task-card').length;
        
        if (countTodo) countTodo.textContent = cTodo;
        if (countInProgress) countInProgress.textContent = cInProg;
        if (countDone) countDone.textContent = cDone;
        
        // Update Mobile counters
        const setElText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setElText('tab-count-todo', cTodo);
        setElText('tab-count-in-progress', cInProg);
        setElText('tab-count-done', cDone);
        setElText('mob-count-todo', cTodo);
        setElText('mob-count-in-progress', cInProg);
        setElText('mob-count-done', cDone);
        
        if (window.updatePokedexState) {
            window.updatePokedexState(cDone);
        }
    }

    // Mobile Navigation & Sidebar Controls
    const btnMobileMenu = document.getElementById('btn-mobile-menu');
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const mobileSidebarOverlay = document.getElementById('mobile-sidebar-overlay');
    const btnCloseSidebar = document.getElementById('btn-close-sidebar');
    const btnMobAddTask = document.getElementById('btn-mob-add-task');
    const btnMobSettings = document.getElementById('btn-mob-settings');

    function openMobileSidebar() {
        if (mobileSidebar) mobileSidebar.classList.add('active');
        if (mobileSidebarOverlay) mobileSidebarOverlay.classList.add('active');
    }

    function closeMobileSidebar() {
        if (mobileSidebar) mobileSidebar.classList.remove('active');
        if (mobileSidebarOverlay) mobileSidebarOverlay.classList.remove('active');
    }

    if (btnMobileMenu) btnMobileMenu.addEventListener('click', openMobileSidebar);
    if (btnCloseSidebar) btnCloseSidebar.addEventListener('click', closeMobileSidebar);
    if (mobileSidebarOverlay) mobileSidebarOverlay.addEventListener('click', closeMobileSidebar);

    if (btnMobAddTask) {
        btnMobAddTask.addEventListener('click', () => {
            closeMobileSidebar();
            if (btnAddModal) btnAddModal.click();
        });
    }

    if (btnMobSettings) {
        btnMobSettings.addEventListener('click', () => {
            closeMobileSidebar();
            if (btnSettings) btnSettings.click();
        });
    }

    // Mobile Column Tabs Filtering / Switching
    const colTodo = document.getElementById('column-todo');
    const colInProgress = document.getElementById('column-in-progress');
    const colDone = document.getElementById('column-done');

    function selectMobileColumn(targetCol) {
        document.querySelectorAll('.tab-item, .mobile-tab-btn').forEach(btn => {
            if (btn.dataset.col === targetCol) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        if (window.innerWidth <= 768) {
            if (targetCol === 'all') {
                if (colTodo) colTodo.style.display = '';
                if (colInProgress) colInProgress.style.display = '';
                if (colDone) colDone.style.display = '';
            } else {
                if (colTodo) colTodo.style.display = targetCol === 'todo' ? '' : 'none';
                if (colInProgress) colInProgress.style.display = targetCol === 'in_progress' ? '' : 'none';
                if (colDone) colDone.style.display = targetCol === 'done' ? '' : 'none';
            }
        } else {
            let targetEl = null;
            if (targetCol === 'todo') targetEl = colTodo;
            if (targetCol === 'in_progress') targetEl = colInProgress;
            if (targetCol === 'done') targetEl = colDone;
            if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }

    document.querySelectorAll('.tab-item, .mobile-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const col = btn.dataset.col;
            if (col) {
                selectMobileColumn(col);
                closeMobileSidebar();
            }
        });
    });

    function estimateCardHeight(task, groupTasks = null) {
        if (groupTasks && groupTasks.length > 1) {
            let maxHeight = 0;
            groupTasks.forEach(t => {
                const h = estimateCardHeight(t);
                if (h > maxHeight) maxHeight = h;
            });
            const total = groupTasks.length;
            const startVisibleIndex = Math.max(0, total - 3);
            const visibleCount = total - startVisibleIndex;
            const maxOffsetPx = (visibleCount - 1) * 6;
            return maxHeight + maxOffsetPx + 24;
        }

        let height = 110; // Base card elements + padding + headers
        if (task.images && task.images.length > 0) {
            height += 180; // banner height
        }
        if (task.tags && task.tags.length > 0) {
            height += 30; // tags row
        }
        if (task.description) {
            const lines = Math.ceil(task.description.length / 30);
            height += Math.min(120, lines * 18);
        }
        return height;
    }

    function renderTasks(tasks) {
        const viewMode = parseInt(board.dataset.view) || 1;

        const createColumns = (listEl) => {
            listEl.innerHTML = '';
            const cols = [];
            for (let i = 0; i < viewMode; i++) {
                const col = document.createElement('div');
                col.className = 'task-list-column';
                listEl.appendChild(col);
                cols.push(col);
            }
            return cols;
        };

        const todoCols = createColumns(listTodo);
        const inProgressCols = createColumns(listInProgress);
        const doneCols = createColumns(listDone);

        // Track accumulated heights in each sub-column
        const todoHeights = new Array(viewMode).fill(0);
        const inProgressHeights = new Array(viewMode).fill(0);
        const doneHeights = new Array(viewMode).fill(0);

        const findShortestColIdx = (heightsArray) => {
            let minIdx = 0;
            let minVal = heightsArray[0];
            for (let i = 1; i < heightsArray.length; i++) {
                if (heightsArray[i] < minVal) {
                    minVal = heightsArray[i];
                    minIdx = i;
                }
            }
            return minIdx;
        };

        const groups = {};
        tasks.forEach(task => {
            if (task.group_id) {
                if (!groups[task.group_id]) groups[task.group_id] = [];
                groups[task.group_id].push(task);
            }
        });

        const renderedGroups = new Set();

        tasks.forEach(task => {
            if (task.group_id && task.status === 'todo') {
                if (!renderedGroups.has(task.group_id)) {
                    const groupTasks = groups[task.group_id].filter(t => t.status === 'todo');
                    if (groupTasks.length > 1) {
                        const stackEl = createTaskCard(groupTasks[0], groupTasks);
                        const estHeight = estimateCardHeight(null, groupTasks);
                        
                        const colIdx = findShortestColIdx(todoHeights);
                        todoCols[colIdx].appendChild(stackEl);
                        todoHeights[colIdx] += estHeight + 16;
                        
                        renderedGroups.add(task.group_id);
                    } else if (groupTasks.length === 1) {
                        const cardEl = createTaskCard(groupTasks[0]);
                        const estHeight = estimateCardHeight(groupTasks[0]);
                        
                        const colIdx = findShortestColIdx(todoHeights);
                        todoCols[colIdx].appendChild(cardEl);
                        todoHeights[colIdx] += estHeight + 16;
                        
                        renderedGroups.add(task.group_id);
                    }
                }
            } else {
                const cardEl = createTaskCard(task);
                const estHeight = estimateCardHeight(task);
                
                if (task.status === 'todo') {
                    const colIdx = findShortestColIdx(todoHeights);
                    todoCols[colIdx].appendChild(cardEl);
                    todoHeights[colIdx] += estHeight + 16;
                } else if (task.status === 'in_progress') {
                    const colIdx = findShortestColIdx(inProgressHeights);
                    inProgressCols[colIdx].appendChild(cardEl);
                    inProgressHeights[colIdx] += estHeight + 16;
                } else {
                    const colIdx = findShortestColIdx(doneHeights);
                    doneCols[colIdx].appendChild(cardEl);
                    doneHeights[colIdx] += estHeight + 16;
                }
            }
        });

        updateCounters();

        document.querySelectorAll('.stack-container').forEach(stack => {
            adjustStackSize(stack);
        });
    }

    function isVideo(url) {
        return url.match(/\.(mp4|webm|mov|mkv)$/i);
    }

    function stackCardsInDOM(draggedCard, targetCard) {
        const targetContainer = targetCard.parentNode;
        if (targetContainer && targetContainer.classList.contains('stack-container')) {
            targetContainer.appendChild(draggedCard);
            restyleStack(targetContainer);
        } else {
            const newContainer = document.createElement('div');
            newContainer.className = 'stack-container';
            newContainer.dataset.groupId = 'temp_' + Date.now();
            
            targetCard.parentNode.insertBefore(newContainer, targetCard);
            newContainer.appendChild(targetCard);
            newContainer.appendChild(draggedCard);
            restyleStack(newContainer);
        }
    }

    function createSingleCardDOM(task, groupTasks = null) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.dataset.id = task.id;
        card.dataset.diff = task.difficulty;

        let stars = '★'.repeat(task.difficulty) + '☆'.repeat(3 - task.difficulty);
        let dateStr = new Date(task.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

        let imageHtml = '';
        if (task.images && task.images.length > 0) {
            const firstMedia = task.images[0];
            const mediaTag = isVideo(firstMedia) 
                ? `<video src="${firstMedia}" class="card-banner" style="object-fit: cover;" muted loop autoplay draggable="false"></video>`
                : `<img src="${firstMedia}" class="card-banner" alt="Banner" draggable="false">`;

            imageHtml = `
                <div style="position: relative;">
                    ${mediaTag}
                    ${task.images.length > 1 ? `<div class="images-indicator">🖼️ ${task.images.length}</div>` : ''}
                </div>
            `;
        }

        let tagsHtml = '';
        const hasTags = task.tags && task.tags.length > 0;
        if (hasTags) {
            tagsHtml = '<div class="card-tags">';
            task.tags.forEach(tag => {
                tagsHtml += `<span class="tag-badge" style="background-color: ${tag.color}">${tag.name}</span>`;
            });
            tagsHtml += '</div>';
        }

        card.innerHTML = `
            ${isOwnerLoggedIn ? `<div class="card-actions">
                <button class="btn-icon edit" data-id="${task.id}" title="Редактировать">✏️</button>
                <button class="btn-icon delete" data-id="${task.id}" title="Удалить">🗑️</button>
            </div>` : ''}
            ${imageHtml}
            <div class="card-content">
                ${tagsHtml}
                <div class="card-header">
                    <div class="card-title">${task.title}</div>
                    <div class="card-stars">${stars}</div>
                </div>
                <div class="card-desc">${task.description || ''}</div>
                <div class="card-footer">
                    <span>📅 ${dateStr}</span>
                </div>
            </div>
        `;

        card.setAttribute('draggable', isOwnerLoggedIn ? 'true' : 'false');

        // Drag start
        card.addEventListener('dragstart', (e) => {
            if (!isOwnerLoggedIn) {
                e.preventDefault();
                openAuthModal('Перемещение карточек доступно только владельцу.');
                return false;
            }
            const container = card.parentNode;
            const isStack = container && container.classList.contains('stack-container');
            
            if (isStack && card !== container.lastElementChild) {
                // Dragging a card underneath -> drag the entire stack
                window.draggedTaskEl = container;
                window.dragMode = 'group';
            } else {
                // Dragging a single card or the top card
                window.draggedTaskEl = card;
                window.dragMode = 'single';
            }
            
            window.draggedSourceList = window.draggedTaskEl.closest('.task-list');
            
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', task.id);
            
            const img = new Image();
            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            e.dataTransfer.setDragImage(img, 0, 0);

            if (window.customDragGhost) window.customDragGhost.remove();
            window.customDragGhost = window.draggedTaskEl.cloneNode(true);
            
            // Clear stack inline styling on the ghost itself (or its card children if stack)
            if (window.dragMode === 'single') {
                clearStackStyles(window.customDragGhost);
            }
            
            window.customDragGhost.style.position = 'fixed';
            window.customDragGhost.style.pointerEvents = 'none';
            window.customDragGhost.style.zIndex = '9999';
            window.customDragGhost.style.width = window.draggedTaskEl.offsetWidth + 'px';
            window.customDragGhost.style.height = window.draggedTaskEl.offsetHeight + 'px';
            window.customDragGhost.style.opacity = '0.85';
            window.customDragGhost.style.transform = 'rotate(2deg)';
            document.body.appendChild(window.customDragGhost);

            const rect = window.draggedTaskEl.getBoundingClientRect();
            window.dragOffsetX = e.clientX - rect.left;
            window.dragOffsetY = e.clientY - rect.top;

            setTimeout(() => {
                window.draggedTaskEl.classList.add('sortable-ghost');
                document.body.classList.add('is-dragging');
            }, 0);
        });

        // Drag
        card.addEventListener('drag', (e) => {
            if (window.customDragGhost && e.clientX !== 0 && e.clientY !== 0) {
                window.customDragGhost.style.left = (e.clientX - window.dragOffsetX) + 'px';
                window.customDragGhost.style.top = (e.clientY - window.dragOffsetY) + 'px';
            }
        });

        // Drag end
        card.addEventListener('dragend', () => {
            if (window.draggedTaskEl) {
                window.draggedTaskEl.classList.remove('sortable-ghost');
            }
            window.draggedTaskEl = null;
            if (window.customDragGhost) {
                window.customDragGhost.remove();
                window.customDragGhost = null;
            }
            document.body.classList.remove('is-dragging');
            clearHoverState();
        });

        // Drag over
        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (!window.draggedTaskEl || window.draggedTaskEl === card || window.draggedTaskEl.contains(card)) return;

            const rect = card.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const h = rect.height;
            
            const targetList = card.closest('.task-list');
            const isTodoColumn = targetList && targetList.dataset.status === 'todo';
            
            const isCenter = (y >= h * 0.25 && y <= h * 0.75);
            const currentZone = isCenter ? 'center' : (y < h / 2 ? 'top' : 'bottom');

            const canStack = (window.dragMode === 'single' && isTodoColumn && !card.closest('.sortable-ghost'));

            const targetIsStack = card.parentNode.classList.contains('stack-container');
            const targetEl = targetIsStack ? card.parentNode : card;

            if (hoverTarget !== card || hoverZone !== currentZone) {
                clearHoverState();
                hoverTarget = card;
                hoverZone = currentZone;
                
                if (currentZone === 'center' && canStack) {
                    card.classList.add('hover-center');
                } else if (currentZone === 'top') {
                    targetEl.classList.add('hover-top');
                } else if (currentZone === 'bottom') {
                    targetEl.classList.add('hover-bottom');
                }
            }
        });

        // Drag leave
        card.addEventListener('dragleave', (e) => {
            if (!card.contains(e.relatedTarget)) {
                clearHoverState();
            }
        });

        // Drop
        card.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!window.draggedTaskEl || window.draggedTaskEl === card || window.draggedTaskEl.contains(card)) return;
            
            const targetIsStack = card.parentNode.classList.contains('stack-container');
            const targetEl = targetIsStack ? card.parentNode : card;
            const list = targetEl.parentNode;
            const mainList = list.closest('.task-list');
            const isTodoColumn = mainList && mainList.dataset.status === 'todo';
            
            const isCenterDrop = card.classList.contains('hover-center');
            const isTopDrop = targetEl.classList.contains('hover-top');
            const isBottomDrop = targetEl.classList.contains('hover-bottom');

            clearHoverState();

            const sourceList = window.draggedSourceList;
            const draggedEl = window.draggedTaskEl;
            const dragMode = window.dragMode;
            
            const sourceStack = (dragMode === 'single' && draggedEl.parentNode && draggedEl.parentNode.classList.contains('stack-container')) 
                ? draggedEl.parentNode 
                : null;

            if (isCenterDrop && dragMode === 'single' && isTodoColumn) {
                const draggedId = draggedEl.dataset.id;
                const targetId = card.dataset.id;
                
                // Visual confirmation: stack B on A in the DOM instantly
                stackCardsInDOM(draggedEl, card);
                
                if (window.customDragGhost) {
                    window.customDragGhost.remove();
                    window.customDragGhost = null;
                }

                // If B was in a source stack, clean it up in DOM
                if (sourceStack) {
                    restyleStack(sourceStack);
                }

                try {
                    // Update positions first so that they are saved correctly
                    await updatePositions(list);
                    if (sourceList && sourceList !== list) {
                        await updatePositions(sourceList);
                    }

                    // Link B to A in the DB
                    await fetch(`/api/tasks/${draggedId}/link`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ parent_id: targetId })
                    });
                } catch(err) {
                    console.error(err);
                }
                fetchTasks();
                return;
            }

            // Otherwise, it's an edge drop: insert in DOM now
            if (dragMode === 'group' && !isTodoColumn) {
                // Dissolve stack container in DOM since stacks are only for TODO
                const cards = Array.from(draggedEl.children);
                if (isTopDrop) {
                    cards.forEach(c => {
                        list.insertBefore(c, targetEl);
                        clearStackStyles(c);
                    });
                } else if (isBottomDrop) {
                    let nextEl = targetEl.nextSibling;
                    cards.forEach(c => {
                        list.insertBefore(c, nextEl);
                        clearStackStyles(c);
                    });
                }
            } else {
                if (isTopDrop) {
                    list.insertBefore(draggedEl, targetEl);
                } else if (isBottomDrop) {
                    list.insertBefore(draggedEl, targetEl.nextSibling);
                }
                if (dragMode === 'single') {
                    clearStackStyles(draggedEl);
                }
            }

            if (dragMode === 'single' && sourceStack) {
                const draggedId = draggedEl.dataset.id;
                draggedEl.classList.remove('sortable-ghost');
                restyleStack(sourceStack);
                await authFetch(`/api/tasks/${draggedId}/unlink`, { method: 'PUT' });
            }

            await updatePositions(list);
            if (sourceList && sourceList !== list) {
                await updatePositions(sourceList);
            }
            fetchTasks();
        });

        // Edit button click
        const btnEdit = card.querySelector('.edit');
        if (btnEdit) {
            btnEdit.addEventListener('click', (e) => {
                e.stopPropagation();
                modalTitle.textContent = 'Редактировать Механику';
                taskIdInput.value = task.id;
                document.getElementById('task-title').value = task.title;
                document.getElementById('task-desc').value = task.description || '';
                const diffRadios = document.getElementsByName('difficulty');
                for(let radio of diffRadios) {
                    if(radio.value == task.difficulty) radio.checked = true;
                }
                
                selectedTags = task.tags ? [...task.tags] : [];
                renderTagsUI();

                currentExistingImages = task.images ? [...task.images] : [];
                renderExistingImages();

                formAddTask.querySelector('button[type="submit"]').textContent = 'Сохранить изменения';
                modalOverlay.classList.add('active');
            });
        }

        // Delete button click
        const btnDelete = card.querySelector('.delete');
        if (btnDelete) {
            btnDelete.addEventListener('click', async (e) => {
                e.stopPropagation();
                if(confirm('Вы уверены, что хотите удалить эту задачу?')) {
                    try {
                        const res = await authFetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
                        if (res.ok) fetchTasks();
                        else alert('Не удалось удалить задачу');
                    } catch (e) { console.error(e); alert('Ошибка сети при удалении'); }
                }
            });
        }

        // Click on card opens details
        card.addEventListener('click', () => {
            if (groupTasks && groupTasks.length > 1) {
                openTaskView(null, groupTasks);
            } else {
                openTaskView(task);
            }
        });

        return card;
    }

    function createTaskCard(task, groupTasks = null) {
        if (groupTasks && groupTasks.length > 1) {
            const container = document.createElement('div');
            container.className = 'stack-container';
            container.dataset.groupId = task.group_id;
            
            const reversedTasks = [...groupTasks].reverse();
            const total = reversedTasks.length;

            let startVisibleIndex = Math.max(0, total - 3);
            reversedTasks.forEach((t, index) => {
                const card = createSingleCardDOM(t, groupTasks);
                
                // Show max 3 cards visually to keep clutter down, hide the rest but keep in DOM for tracking
                const isVisible = (index >= startVisibleIndex);
                if (!isVisible) {
                    card.style.display = 'none';
                    card.style.position = 'absolute';
                } else {
                    const offsetIndex = index - startVisibleIndex;
                    const offsetPx = offsetIndex * 6; // 6px diagonal offset
                    
                    card.style.position = 'absolute';
                    card.style.top = `${offsetPx}px`;
                    card.style.left = `${offsetPx}px`;
                    card.style.width = '100%';
                    card.style.height = '100%';
                }
                card.style.zIndex = index + 1;
                
                container.appendChild(card);
            });

            // Allocate visual space for the offset
            const visibleCount = total - startVisibleIndex;
            const maxOffsetPx = (visibleCount - 1) * 6;
            container.style.marginBottom = `calc(1.5rem + ${maxOffsetPx}px)`;
            container.style.marginRight = `${maxOffsetPx}px`;
            
            return container;
        } else {
            return createSingleCardDOM(task);
        }
    }

    function openTaskView(task, groupTasks = null) {
        if (groupTasks) {
            viewTitle.textContent = "Стопка карт";
            viewDesc.textContent = "В этой стопке сгруппировано несколько независимых карточек.";
            viewTags.innerHTML = '';
            viewMediaContainer.innerHTML = '';
        } else {
            viewTitle.textContent = task.title;
            viewDesc.textContent = task.description || 'Нет описания.';
            
            viewTags.innerHTML = '';
            if (task.tags && task.tags.length > 0) {
                task.tags.forEach(tag => {
                    viewTags.innerHTML += `<span class="tag-badge" style="background-color: ${tag.color}">${tag.name}</span>`;
                });
            }

            viewMediaContainer.innerHTML = '';
            if (task.images && task.images.length > 0) {
                task.images.forEach(imgUrl => {
                    if (isVideo(imgUrl)) {
                        viewMediaContainer.innerHTML += `<video src="${imgUrl}" controls style="max-height: 400px; border-radius: 0.5rem;"></video>`;
                    } else {
                        viewMediaContainer.innerHTML += `<img src="${imgUrl}" style="max-height: 400px; border-radius: 0.5rem; object-fit: contain;">`;
                    }
                });
            }
        }
        
        viewSubtasksList.innerHTML = '';
        const items = groupTasks ? groupTasks : [];
        if (items.length > 0) {
            items.forEach(st => {
                const stEl = document.createElement('div');
                stEl.style.cssText = "background: rgba(255,255,255,0.1); padding: 0.5rem 1rem; border-radius: 0.5rem; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #3498db; margin-bottom: 0.5rem;";
                stEl.innerHTML = `
                    <div>
                        <div style="font-weight: bold; color: white;">${st.title}</div>
                        <div style="font-size: 0.8rem; color: #bdc3c7;">Статус: ${st.status === 'todo' ? 'Предстоящая' : (st.status === 'in_progress' ? 'В работе' : 'Готово')}</div>
                    </div>
                    <div style="display:flex; gap:0.5rem;">
                        <button class="btn-icon btn-unlink" style="width:30px; height:30px; font-size:1rem;" title="Вытащить из стопки">⬆️</button>
                        <button class="btn-icon view-sub" style="width:30px; height:30px; font-size:1rem;" title="Посмотреть карточку">👁️</button>
                    </div>
                `;
                stEl.querySelector('.view-sub').addEventListener('click', (e) => {
                    e.stopPropagation();
                    openTaskView(st);
                });
                stEl.querySelector('.btn-unlink').addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if(confirm('Вытащить карточку из стопки на доску?')) {
                        try {
                            const res = await fetch(`/api/tasks/${st.id}/unlink`, { method: 'PUT' });
                            if (res.ok) {
                                document.getElementById('modal-view').classList.remove('active');
                                fetchTasks();
                            }
                        } catch (err) { console.error(err); }
                    }
                });
                viewSubtasksList.appendChild(stEl);
            });
        }

        btnAddSubtask.style.display = 'none'; // Hide add subtask button completely
        modalViewOverlay.classList.add('active');
    }

    function renderExistingImages() {
        if (currentExistingImages.length === 0) {
            existingImagesGroup.style.display = 'none';
            existingImagesContainer.innerHTML = '';
            return;
        }
        existingImagesGroup.style.display = 'block';
        existingImagesContainer.innerHTML = '';

        currentExistingImages.forEach((imgUrl, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'image-preview-item';
            
            const mediaTag = isVideo(imgUrl)
                ? `<video src="${imgUrl}" style="width:100%; height:100%; object-fit:cover;" muted></video>`
                : `<img src="${imgUrl}" alt="Preview">`;

            wrapper.innerHTML = `
                ${mediaTag}
                <button type="button" class="btn-remove-image" title="Удалить" data-index="${index}">❌</button>
            `;
            
            wrapper.querySelector('.btn-remove-image').addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                currentExistingImages.splice(idx, 1);
                renderExistingImages();
            });
            existingImagesContainer.appendChild(wrapper);
        });
    }

    window.addEventListener('resize', () => {
        document.querySelectorAll('.stack-container').forEach(stack => {
            adjustStackSize(stack);
        });
    });
});
