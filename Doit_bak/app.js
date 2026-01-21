// 数据存储
let lists = [];
let currentEditingTask = null;
let currentEditingList = null;

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderBoard();
    initEventListeners();
    checkDeadlines();
    // 每分钟检查一次截止日期
    setInterval(checkDeadlines, 60000);
});

// 初始化事件监听器
function initEventListeners() {
    // 添加列表按钮
    document.getElementById('addListBtn').addEventListener('click', () => {
        openListModal();
    });

    // 清空所有数据按钮
    document.getElementById('clearAllBtn').addEventListener('click', () => {
        if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
            lists = [];
            saveData();
            renderBoard();
        }
    });

    // 导出数据按钮
    document.getElementById('exportBtn').addEventListener('click', () => {
        exportData();
    });

    // 导入数据按钮
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });

    // 文件选择
    document.getElementById('importFile').addEventListener('change', (e) => {
        importData(e.target.files[0]);
    });

    // 列表表单提交
    document.getElementById('listForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('listTitle').value.trim();
        if (title) {
            addList(title);
            closeListModal();
        }
    });

    // 任务表单提交
    document.getElementById('taskForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveTask();
    });

    // 进度滑块
    document.getElementById('taskProgress').addEventListener('input', (e) => {
        document.getElementById('progressValue').textContent = e.target.value + '%';
    });

    // 模态框关闭按钮
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', () => {
            closeTaskModal();
            closeListModal();
        });
    });

    document.getElementById('cancelBtn').addEventListener('click', closeTaskModal);
    document.getElementById('cancelListBtn').addEventListener('click', closeListModal);

    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeTaskModal();
            closeListModal();
        }
    });
}

// 添加列表
function addList(title) {
    const list = {
        id: Date.now().toString(),
        title: title,
        cards: []
    };
    lists.push(list);
    saveData();
    renderBoard();
}

// 删除列表
function deleteList(listId) {
    if (confirm('确定要删除这个列表吗？')) {
        lists = lists.filter(list => list.id !== listId);
        saveData();
        renderBoard();
    }
}

// 添加/编辑任务
function openTaskModal(listId, cardId = null) {
    currentEditingList = listId;
    currentEditingTask = cardId;

    const modal = document.getElementById('taskModal');
    const modalTitle = document.getElementById('modalTitle');
    
    if (cardId) {
        // 编辑模式
        modalTitle.textContent = '编辑任务';
        const list = lists.find(l => l.id === listId);
        const card = list.cards.find(c => c.id === cardId);
        
        document.getElementById('taskTitle').value = card.title;
        document.getElementById('taskDescription').value = card.description || '';
        document.getElementById('taskDeadline').value = card.deadline || '';
        document.getElementById('taskPriority').value = card.priority || 'medium';
        document.getElementById('taskProgress').value = card.progress || 0;
        document.getElementById('progressValue').textContent = (card.progress || 0) + '%';
    } else {
        // 新建模式
        modalTitle.textContent = '添加任务';
        document.getElementById('taskForm').reset();
        document.getElementById('progressValue').textContent = '0%';
    }
    
    modal.classList.add('show');
}

// 保存任务
function saveTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const deadline = document.getElementById('taskDeadline').value;
    const priority = document.getElementById('taskPriority').value;
    const progress = parseInt(document.getElementById('taskProgress').value);

    if (!title) return;

    const list = lists.find(l => l.id === currentEditingList);
    
    if (currentEditingTask) {
        // 编辑现有任务
        const card = list.cards.find(c => c.id === currentEditingTask);
        card.title = title;
        card.description = description;
        card.deadline = deadline;
        card.priority = priority;
        card.progress = progress;
    } else {
        // 创建新任务
        const card = {
            id: Date.now().toString(),
            title: title,
            description: description,
            deadline: deadline,
            priority: priority,
            progress: progress,
            createdAt: new Date().toISOString()
        };
        list.cards.push(card);
    }

    saveData();
    renderBoard();
    closeTaskModal();
}

// 删除任务
function deleteCard(listId, cardId) {
    if (confirm('确定要删除这个任务吗？')) {
        const list = lists.find(l => l.id === listId);
        list.cards = list.cards.filter(c => c.id !== cardId);
        saveData();
        renderBoard();
    }
}

// 关闭模态框
function closeTaskModal() {
    document.getElementById('taskModal').classList.remove('show');
    currentEditingTask = null;
    currentEditingList = null;
}

function closeListModal() {
    document.getElementById('listModal').classList.remove('show');
    document.getElementById('listForm').reset();
}

function openListModal() {
    document.getElementById('listModal').classList.add('show');
}

// 渲染看板
function renderBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';

    lists.forEach(list => {
        const listElement = createListElement(list);
        board.appendChild(listElement);
    });
}

// 创建列表元素
function createListElement(list) {
    const listDiv = document.createElement('div');
    listDiv.className = 'list';
    listDiv.dataset.listId = list.id;

    listDiv.innerHTML = `
        <div class="list-header">
            <h3 class="list-title">${escapeHtml(list.title)}</h3>
            <div class="list-actions">
                <button class="icon-btn delete-list" title="删除列表">🗑️</button>
            </div>
        </div>
        <div class="list-cards" data-list-id="${list.id}">
            ${list.cards.map(card => createCardHTML(card, list.id)).join('')}
        </div>
        <button class="add-card-btn">+ 添加任务</button>
    `;

    // 删除列表
    listDiv.querySelector('.delete-list').addEventListener('click', () => {
        deleteList(list.id);
    });

    // 添加任务
    listDiv.querySelector('.add-card-btn').addEventListener('click', () => {
        openTaskModal(list.id);
    });

    // 设置拖拽
    const cardsContainer = listDiv.querySelector('.list-cards');
    setupDragAndDrop(cardsContainer);

    return listDiv;
}

// 创建卡片HTML
function createCardHTML(card, listId) {
    const deadlineInfo = getDeadlineInfo(card.deadline);
    const deadlineClass = deadlineInfo.class;
    const deadlineText = deadlineInfo.text;

    return `
        <div class="card priority-${card.priority}" draggable="true" data-card-id="${card.id}" data-list-id="${listId}">
            <div class="card-header">
                <div class="card-title">${escapeHtml(card.title)}</div>
                <div class="card-actions">
                    <button class="icon-btn edit-card" title="编辑">✏️</button>
                    <button class="icon-btn delete-card" title="删除">🗑️</button>
                </div>
            </div>
            ${card.description ? `<div class="card-description">${escapeHtml(card.description)}</div>` : ''}
            <div class="card-meta">
                ${card.deadline ? `<div class="card-deadline ${deadlineClass}">⏰ ${deadlineText}</div>` : ''}
                <div class="card-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${card.progress}%"></div>
                    </div>
                    <span class="progress-text">${card.progress}%</span>
                </div>
            </div>
        </div>
    `;
}

// 获取截止日期信息
function getDeadlineInfo(deadline) {
    if (!deadline) return { class: '', text: '' };

    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diff = deadlineDate - now;
    const hours = diff / (1000 * 60 * 60);

    let className = '';
    let text = deadlineDate.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });

    if (diff < 0) {
        className = 'overdue';
        text = '已逾期 ' + text;
    } else if (hours < 24) {
        className = 'soon';
        text = '即将到期 ' + text;
    }

    return { class: className, text: text };
}

// 设置拖拽功能
function setupDragAndDrop(container) {
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);
    container.addEventListener('dragleave', handleDragLeave);

    // 为所有卡片添加拖拽事件
    container.querySelectorAll('.card').forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
        
        // 编辑和删除按钮
        card.querySelector('.edit-card').addEventListener('click', (e) => {
            e.stopPropagation();
            const cardId = card.dataset.cardId;
            const listId = card.dataset.listId;
            openTaskModal(listId, cardId);
        });

        card.querySelector('.delete-card').addEventListener('click', (e) => {
            e.stopPropagation();
            const cardId = card.dataset.cardId;
            const listId = card.dataset.listId;
            deleteCard(listId, cardId);
        });
    });
}

let draggedCard = null;

function handleDragStart(e) {
    draggedCard = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
    return false;
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    this.classList.remove('drag-over');

    if (draggedCard) {
        const sourceListId = draggedCard.dataset.listId;
        const targetListId = this.dataset.listId;
        const cardId = draggedCard.dataset.cardId;

        if (sourceListId !== targetListId) {
            moveCard(cardId, sourceListId, targetListId);
        }
    }

    return false;
}

// 移动卡片
function moveCard(cardId, sourceListId, targetListId) {
    const sourceList = lists.find(l => l.id === sourceListId);
    const targetList = lists.find(l => l.id === targetListId);
    
    const cardIndex = sourceList.cards.findIndex(c => c.id === cardId);
    const card = sourceList.cards[cardIndex];
    
    sourceList.cards.splice(cardIndex, 1);
    targetList.cards.push(card);
    
    saveData();
    renderBoard();
}

// 检查截止日期并提醒
function checkDeadlines() {
    const now = new Date();
    
    lists.forEach(list => {
        list.cards.forEach(card => {
            if (card.deadline && !card.notified) {
                const deadlineDate = new Date(card.deadline);
                const diff = deadlineDate - now;
                const hours = diff / (1000 * 60 * 60);
                
                // 提前1小时提醒
                if (hours > 0 && hours <= 1) {
                    showNotification(card);
                    card.notified = true;
                    saveData();
                }
                
                // 已逾期提醒
                if (diff < 0 && !card.overdueNotified) {
                    showNotification(card, true);
                    card.overdueNotified = true;
                    saveData();
                }
            }
        });
    });
}

// 显示通知
function showNotification(card, isOverdue = false) {
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            const title = isOverdue ? '任务已逾期！' : '任务即将到期！';
            const body = `${card.title}\n截止时间: ${new Date(card.deadline).toLocaleString('zh-CN')}`;
            new Notification(title, { body: body, icon: '📋' });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    showNotification(card, isOverdue);
                }
            });
        }
    }
    
    // 浏览器提示
    const message = isOverdue 
        ? `任务"${card.title}"已逾期！` 
        : `任务"${card.title}"即将在1小时内到期！`;
    alert(message);
}

// 数据持久化
function saveData() {
    localStorage.setItem('taskBoard', JSON.stringify(lists));
}

function loadData() {
    const saved = localStorage.getItem('taskBoard');
    if (saved) {
        lists = JSON.parse(saved);
    } else {
        // 初始化默认列表
        lists = [
            { id: '1', title: '待办', cards: [] },
            { id: '2', title: '进行中', cards: [] },
            { id: '3', title: '已完成', cards: [] }
        ];
        saveData();
    }
}

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 导出数据到JSON文件
function exportData() {
    const dataStr = JSON.stringify(lists, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    
    // 生成文件名：任务管理板_日期时间.json
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 19).replace(/:/g, '-');
    link.download = `任务管理板_${dateStr}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('数据已导出成功！');
}

// 从JSON文件导入数据
function importData(file) {
    if (!file) return;
    
    if (!file.name.endsWith('.json')) {
        alert('请选择JSON格式的文件！');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // 验证数据格式
            if (!Array.isArray(importedData)) {
                throw new Error('数据格式不正确');
            }
            
            // 询问是否覆盖现有数据
            const shouldReplace = confirm('导入数据将覆盖当前所有数据，是否继续？');
            
            if (shouldReplace) {
                lists = importedData;
                saveData();
                renderBoard();
                alert('数据导入成功！');
            }
        } catch (error) {
            alert('导入失败：文件格式不正确或数据损坏！\n' + error.message);
        }
    };
    
    reader.onerror = () => {
        alert('读取文件失败！');
    };
    
    reader.readAsText(file);
    
    // 清空文件选择，允许重复导入同一文件
    document.getElementById('importFile').value = '';
}

// 请求通知权限
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}
