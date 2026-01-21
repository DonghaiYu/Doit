// 数据存储
let lists = [];
let currentEditingTask = null;
let currentEditingList = null;

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 检测运行环境
    detectEnvironment();
    
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
        if (confirm('确定要清空所有数据吗？此操作将清空所有任务，但会保留"已完成"列表！')) {
            console.log('清空前，列表数量:', lists.length);
            console.log('清空前，列表详情:', lists.map(l => ({ title: l.title, cardCount: l.cards.length })));
            
            // 只保留"已完成"列表，并清空其中的任务
            const completedList = lists.find(list => list.title === '已完成');
            
            lists = [];
            
            if (completedList) {
                // 保留"已完成"列表，但清空其中的任务
                lists.push({
                    id: completedList.id,
                    title: '已完成',
                    cards: []  // 清空任务
                });
                console.log('已保留"已完成"列表');
            } else {
                // 如果之前没有"已完成"列表，创建一个新的空列表
                lists.push({
                    id: Date.now().toString(),
                    title: '已完成',
                    cards: []
                });
                console.log('已创建新的"已完成"列表');
            }
            
            console.log('清空后，列表数量:', lists.length);
            console.log('清空后，列表详情:', lists.map(l => ({ title: l.title, cardCount: l.cards.length })));
            
            saveData();
            renderBoard();
        }
    });

    // 导出数据按钮
    document.getElementById('exportBtn').addEventListener('click', () => {
        exportData();
    });

    // 导入数据按钮
    document.getElementById('importBtn').addEventListener('click', async () => {
        // 检查是否在 Electron 环境中
        if (window.electronAPI) {
            // Electron 环境：使用系统对话框
            const result = await window.electronAPI.openFile();
            
            if (result.success) {
                try {
                    const importedData = JSON.parse(result.content);
                    
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
            } else if (!result.cancelled && result.error) {
                alert(`导入失败：${result.error}`);
            }
        } else {
            // 浏览器环境：使用文件选择器
            document.getElementById('importFile').click();
        }
    });

    // 文件选择（浏览器环境）
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
    const list = lists.find(l => l.id === listId);
    
    // 禁止删除"已完成"列表
    if (list && list.title === '已完成') {
        alert('"已完成"列表不能删除，因为涉及任务状态和提醒弹窗功能。您可以删除该列表中的具体任务。');
        return;
    }
    
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
        // 编辑时保留completedAt和lastNotifiedDate字段
        
        // 编辑后执行智能排序，确保优先级变化后位置正确
        applySmartSort(list);
    } else {
        // 创建新任务
        const card = {
            id: Date.now().toString(),
            title: title,
            description: description,
            deadline: deadline,
            priority: priority,
            progress: progress,
            createdAt: new Date().toISOString(),
            completedAt: null,  // 完成时间
            lastNotifiedDate: null  // 上次提醒日期
        };
        
        // 将新任务添加到列表最后，然后执行智能排序
        list.cards.push(card);
        applySmartSort(list);
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
    
    // 添加列表拖拽属性
    listDiv.draggable = true;
    listDiv.dataset.listTitle = list.title;
    
    // 渲染时执行智能排序：按优先级分组，保持同优先级内部的顺序
    const sortedCards = smartSortCards(list.cards);
    
    // "已完成"列表不显示删除按钮
    const isCompletedList = list.title === '已完成';
    
    listDiv.innerHTML = `
        <div class="list-header">
            <h3 class="list-title">${escapeHtml(list.title)}</h3>
            <div class="list-actions">
                ${!isCompletedList ? '<button class="icon-btn delete-list" title="删除列表">🗑️</button>' : ''}
            </div>
        </div>
        <div class="list-cards" data-list-id="${list.id}">
            ${sortedCards.map(card => createCardHTML(card, list.id)).join('')}
        </div>
        <button class="add-card-btn">+ 添加任务</button>
    `;

    // 删除列表（仅非"已完成"列表）
    if (!isCompletedList) {
        listDiv.querySelector('.delete-list').addEventListener('click', () => {
            deleteList(list.id);
        });
    }

    // 添加任务
    listDiv.querySelector('.add-card-btn').addEventListener('click', () => {
        openTaskModal(list.id);
    });

    // 设置列表拖拽事件
    setupListDragAndDrop(listDiv);

    // 设置卡片拖拽
    const cardsContainer = listDiv.querySelector('.list-cards');
    setupDragAndDrop(cardsContainer);

    return listDiv;
}

// 智能排序卡片：按优先级分组，保持同优先级内部的顺序
function smartSortCards(cards) {
    const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
    
    // 创建一个副本，避免修改原数组
    const sortedCards = [...cards];
    
    // 按优先级分组，同时记录原始索引以保持同优先级内部的顺序
    sortedCards.sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) {
            return priorityDiff; // 不同优先级，按优先级排序
        }
        // 同优先级，按原始顺序排序（通过记录原始索引）
        // 但我们需要在卡片对象中记录原始索引
        const aIndex = cards.indexOf(a);
        const bIndex = cards.indexOf(b);
        return aIndex - bIndex;
    });
    
    return sortedCards;
}

// 对列表中的卡片进行智能排序（修改原数组）
function applySmartSort(list) {
    const sortedCards = smartSortCards(list.cards);
    list.cards = sortedCards;
}

// 创建卡片HTML
function createCardHTML(card, listId) {
    const deadlineInfo = getDeadlineInfo(card.deadline, card.completedAt);
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
function getDeadlineInfo(deadline, completedAt) {
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

    // 如果任务已完成,不显示逾期或即将到期状态
    if (completedAt) {
        return { class: 'completed', text: text + ' (已完成)' };
    }

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
let draggedCardData = null;

function handleDragStart(e) {
    draggedCard = this;
    draggedCardData = {
        cardId: this.dataset.cardId,
        listId: this.dataset.listId
    };
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.cardId);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedCard = null;
    draggedCardData = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // 如果是同一列表内的拖拽，提供视觉反馈
    if (draggedCardData) {
        const rect = this.getBoundingClientRect();
        const y = e.clientY - rect.top;
        
        // 移除所有卡片的拖拽位置指示
        this.querySelectorAll('.card').forEach(card => {
            card.classList.remove('drag-above', 'drag-below');
        });
        
        // 遍历所有卡片，找到拖拽位置所在的卡片
        const cards = Array.from(this.querySelectorAll('.card'));
        for (let card of cards) {
            if (card.dataset.cardId === draggedCardData.cardId) continue;
            
            const cardRect = card.getBoundingClientRect();
            const cardTop = cardRect.top - rect.top;
            const cardBottom = cardRect.bottom - rect.top;
            
            // 如果拖拽位置在卡片的上方或下方
            if (y >= cardTop - 10 && y <= cardBottom + 10) {
                const cardCenter = cardTop + cardRect.height / 2;
                if (y < cardCenter) {
                    card.classList.add('drag-above');
                } else {
                    card.classList.add('drag-below');
                }
                break;
            }
        }
    }
    
    this.classList.add('drag-over');
    return false;
}

function handleDragLeave(e) {
    // 只有当真正离开容器时才移除样式
    const rect = this.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        this.classList.remove('drag-over');
        this.querySelectorAll('.card').forEach(card => {
            card.classList.remove('drag-above', 'drag-below');
        });
    }
}

// 设置列表拖拽
function setupListDragAndDrop(listElement) {
    // 列表拖拽开始
    listElement.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', listElement.dataset.listId);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => {
            listElement.classList.add('list-dragging');
        }, 0);
    });
    
    // 列表拖拽结束
    listElement.addEventListener('dragend', (e) => {
        listElement.classList.remove('list-dragging');
    });
    
    // 列表拖拽经过其他列表
    listElement.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const board = document.getElementById('board');
        const lists = Array.from(board.querySelectorAll('.list'));
        const rect = board.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        // 清除所有列表的拖拽样式
        lists.forEach(list => {
            list.classList.remove('list-drag-left', 'list-drag-right');
        });
        
        // 找到最近的列表
        for (let list of lists) {
            if (list === listElement || list.classList.contains('list-dragging')) continue;
            
            const listRect = list.getBoundingClientRect();
            const listLeft = listRect.left - rect.left;
            const listRight = listRect.right - rect.left;
            
            if (x >= listLeft && x <= listRight) {
                const listCenter = listLeft + listRect.width / 2;
                if (x < listCenter) {
                    list.classList.add('list-drag-left');
                } else {
                    list.classList.add('list-drag-right');
                }
                break;
            }
        }
    });
    
    // 列表拖拽离开
    listElement.addEventListener('dragleave', (e) => {
        const rect = listElement.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            const board = document.getElementById('board');
            board.querySelectorAll('.list').forEach(list => {
                list.classList.remove('list-drag-left', 'list-drag-right');
            });
        }
    });
    
    // 列表放置
    listElement.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // 清除拖拽样式
        const board = document.getElementById('board');
        board.querySelectorAll('.list').forEach(list => {
            list.classList.remove('list-drag-left', 'list-drag-right', 'list-dragging');
        });
        
        const draggedListId = e.dataTransfer.getData('text/plain');
        const targetListId = listElement.dataset.listId;
        
        if (draggedListId && targetListId && draggedListId !== targetListId) {
            moveList(draggedListId, targetListId, e.clientX);
        }
        
        return false;
    });
}

// 移动列表
function moveList(sourceListId, targetListId, mouseX) {
    const sourceIndex = lists.findIndex(l => l.id === sourceListId);
    const targetIndex = lists.findIndex(l => l.id === targetListId);
    
    if (sourceIndex === -1 || targetIndex === -1) return;
    
    const sourceList = lists[sourceIndex];
    
    // 移除源列表
    lists.splice(sourceIndex, 1);
    
    // 计算新的插入位置
    let insertIndex = lists.findIndex(l => l.id === targetListId);
    if (insertIndex === -1) insertIndex = targetIndex;
    
    // 判断是在目标列表的左边还是右边
    const targetElement = document.querySelector(`[data-list-id="${targetListId}"]`);
    if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        if (mouseX > centerX) {
            insertIndex++;
        }
    }
    
    // 插入列表
    lists.splice(insertIndex, 0, sourceList);
    
    saveData();
    renderBoard();
}

function handleDrop(e) {
    e.stopPropagation();
    this.classList.remove('drag-over');
    
    // 清理指示器样式
    this.querySelectorAll('.card').forEach(card => {
        card.classList.remove('drag-above', 'drag-below');
    });

    if (!draggedCardData) return false;
    
    const sourceListId = draggedCardData.listId;
    const targetListId = this.dataset.listId;
    const cardId = draggedCardData.cardId;

    if (sourceListId !== targetListId) {
        // 移动到不同列表
        moveCard(cardId, sourceListId, targetListId);
    } else {
        // 在同一列表内重新排序
        const rect = this.getBoundingClientRect();
        const y = e.clientY - rect.top;
        
        // 找到拖拽位置最近的卡片
        const cards = Array.from(this.querySelectorAll('.card'));
        let targetCardId = null;
        let insertBefore = true; // 是否插入到目标卡片前面
        let minDistance = Infinity;
        
        for (let card of cards) {
            if (card.dataset.cardId === cardId) continue;
            
            const cardRect = card.getBoundingClientRect();
            const cardTop = cardRect.top - rect.top;
            const cardCenter = cardTop + cardRect.height / 2;
            const cardBottom = cardRect.bottom - rect.top;
            
            // 检查拖拽位置是否在卡片附近（扩大范围，更容易触发）
            if (y >= cardTop - 20 && y <= cardBottom + 20) {
                // 计算距离卡片中心的距离
                const distance = Math.abs(y - cardCenter);
                if (distance < minDistance) {
                    minDistance = distance;
                    targetCardId = card.dataset.cardId;
                    insertBefore = y < cardCenter;
                }
            }
        }
        
        if (targetCardId) {
            reorderCard(cardId, targetListId, targetCardId, insertBefore);
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
    
    // 检查目标列表是否为"已完成"列
    if (targetList.title === '已完成') {
        card.completedAt = new Date().toISOString();
    } else if (sourceList.title === '已完成' && targetList.title !== '已完成') {
        // 如果从"已完成"列移到其他列,清除完成时间
        card.completedAt = null;
    }
    
    sourceList.cards.splice(cardIndex, 1);
    targetList.cards.push(card);
    
    // 移动到目标列表后执行智能排序
    applySmartSort(targetList);
    
    saveData();
    renderBoard();
}

// 在同一列表内重新排序卡片
function reorderCard(cardId, listId, targetCardId, insertBefore) {
    const list = lists.find(l => l.id === listId);
    if (!list) return;
    
    // 找到被拖动的卡片
    const draggedIndex = list.cards.findIndex(c => c.id === cardId);
    if (draggedIndex === -1) return;
    
    const draggedCardObj = list.cards[draggedIndex];
    
    // 找到目标卡片
    const targetIndex = list.cards.findIndex(c => c.id === targetCardId);
    if (targetIndex === -1) return;
    
    const targetCardObj = list.cards[targetIndex];
    
    // 检查是否是同优先级任务
    if (draggedCardObj.priority !== targetCardObj.priority) {
        alert('只能在相同优先级的任务之间进行拖拽排序！');
        return;
    }
    
    // 计算插入位置
    let insertIndex;
    if (insertBefore) {
        insertIndex = targetIndex;
    } else {
        insertIndex = targetIndex + 1;
    }
    
    // 如果被拖动的卡片在目标卡片前面，需要调整插入索引
    if (draggedIndex < insertIndex) {
        insertIndex--;
    }
    
    // 移动卡片
    list.cards.splice(draggedIndex, 1);
    list.cards.splice(insertIndex, 0, draggedCardObj);
    
    console.log('拖拽排序完成:', {
        cardId,
        draggedIndex,
        targetIndex,
        insertIndex,
        insertBefore
    });
    
    // 拖拽排序后执行智能排序，确保优先级顺序正确
    // 但会保留同优先级内部的顺序
    applySmartSort(list);
    
    saveData();
    renderBoard();
}

// 检查截止日期并提醒
function checkDeadlines() {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10); // 获取今天的日期字符串 YYYY-MM-DD
    
    lists.forEach(list => {
        list.cards.forEach(card => {
            // 跳过已完成的任务
            if (card.completedAt) {
                return;
            }
            
            // 跳过没有截止日期的任务
            if (!card.deadline) {
                return;
            }
            
            const deadlineDate = new Date(card.deadline);
            const diff = deadlineDate - now;
            const hours = diff / (1000 * 60 * 60);
            
            // 检查今天是否已经提醒过
            const lastNotifiedDate = card.lastNotifiedDate;
            const alreadyNotifiedToday = lastNotifiedDate === todayStr;
            
            // 提前1小时提醒
            if (hours > 0 && hours <= 1 && !alreadyNotifiedToday) {
                showNotification(card);
                card.lastNotifiedDate = todayStr;
                saveData();
            }
            
            // 已逾期提醒（每天最多一次）
            if (diff < 0 && !alreadyNotifiedToday) {
                showNotification(card, true);
                card.lastNotifiedDate = todayStr;
                saveData();
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
        
        // 兼容旧数据:为每个任务添加缺失的字段
        lists.forEach(list => {
            if (list.cards) {
                list.cards.forEach(card => {
                    if (card.completedAt === undefined) {
                        card.completedAt = null;
                    }
                    if (card.lastNotifiedDate === undefined) {
                        card.lastNotifiedDate = null;
                    }
                });
                
                // 加载数据后执行智能排序
                applySmartSort(list);
            }
        });
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
async function exportData() {
    const dataStr = JSON.stringify(lists, null, 2);
    
    // 生成默认文件名：Doit_日期时间.json
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 19).replace(/:/g, '-');
    const defaultFileName = `Doit_${dateStr}.json`;
    
    // 检查是否在 Electron 环境中
    if (window.electronAPI) {
        // Electron 环境：使用系统对话框保存文件
        const result = await window.electronAPI.saveFile(dataStr, defaultFileName);
        
        if (result.success) {
            alert(`数据已成功导出到：\n${result.filePath}`);
        } else if (!result.cancelled) {
            alert(`导出失败：${result.error || '未知错误'}`);
        }
    } else {
        // 浏览器环境：使用下载方式
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = defaultFileName;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // 提供更详细的导出信息
        let message = '数据已导出成功！\n\n';
        message += '文件名：' + defaultFileName + '\n';
        message += '文件类型：JSON\n\n';
        
        // 检测浏览器类型并提供下载位置提示
        const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
        const isFirefox = typeof InstallTrigger !== 'undefined';
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        if (isChrome) {
            message += '📁 下载位置：\n';
            message += '1. 点击浏览器右上角的下载图标（↓）\n';
            message += '2. 或按 Ctrl+J 打开下载页面\n';
            message += '3. 默认保存到"下载"文件夹\n';
        } else if (isFirefox) {
            message += '📁 下载位置：\n';
            message += '1. 点击浏览器右上角的下载图标（↓）\n';
            message += '2. 或按 Ctrl+J 打开下载页面\n';
            message += '3. 默认保存到"下载"文件夹\n';
        } else if (isSafari) {
            message += '📁 下载位置：\n';
            message += '1. 查看Safari右上角的下载进度\n';
            message += '2. 或按 Option+Command+L 打开下载列表\n';
            message += '3. 默认保存到"下载"文件夹\n';
        } else {
            message += '📁 文件已保存到浏览器的默认下载位置\n';
            message += '（通常是"下载"文件夹）\n';
        }
        
        message += '\n💡 提示：在Electron桌面应用中，您可以选择保存位置。';
        
        alert(message);
    }
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
                
                // 导入数据后对所有列表执行智能排序
                lists.forEach(list => {
                    if (list.cards) {
                        applySmartSort(list);
                    }
                });
                
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

// 检测运行环境
function detectEnvironment() {
    const isElectron = window.electronAPI !== undefined;
    const isBrowser = !isElectron;
    
    console.log('运行环境检测:');
    console.log('- Electron环境:', isElectron);
    console.log('- 浏览器环境:', isBrowser);
    console.log('- User Agent:', navigator.userAgent);
    
    if (isBrowser) {
        console.log('提示：当前在浏览器中运行，某些功能可能受限。');
        console.log('建议：使用Electron桌面应用以获得完整功能。');
    }
}

// 请求通知权限
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}
