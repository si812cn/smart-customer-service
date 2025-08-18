// panel.js
// 浮动配置面板（优化版）

function injectConfigPanel(Config = {}) {
    const defaultConfig = {
        text: { autoSend: false, maxLength: 50, blockedKeywords: [] },
        freq: { timeLimit: 5, speakLimit: 30, speakBreak: 60, kefuBreak: 2 },
        api: {
            provider: 'coze',
            model: 'gpt-3.5-turbo',
            gptApi: 'https://api.openai.com/v1/chat/completions',
            gptKey: '',
            cozeBotid: '',
            cozeApikey: '',
            apiBase: '',
            hookBase: '',
            audioBase: ''
        }
    };

    // 合并配置
    const configData = deepMerge(defaultConfig, Config);

    let panel = document.getElementById('auto-reply-config-panel');

    // ✅ 如果已存在：更新值并显示
    if (panel) {
        panel.style.display = 'flex';
        populateForm(configData);
        return;
    }

    // 创建面板容器
    panel = document.createElement('div');
    panel.id = 'auto-reply-config-panel';
    panel.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        width: 440px;
        max-height: 85vh;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 999999;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        font-size: 14px;
    `;

    // 标题栏（可拖拽）
    const header = document.createElement('div');
    header.id = 'panel-header';
    header.style.cssText = `
        background: #0078d7;
        color: white;
        padding: 12px 16px;
        font-weight: bold;
        cursor: move;
        user-select: none;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    header.innerHTML = `
        <span>💬 直播助手配置</span>
        <span id="closePanel" style="cursor:pointer; font-size:18px;">×</span>
    `;
    panel.appendChild(header);

    // 内容区域
    const body = document.createElement('div');
    body.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: #f9f9f9;
    `;

    body.innerHTML = buildPanelHTML(configData);
    panel.appendChild(body);

    // 按钮区域
    const footer = document.createElement('div');
    footer.style.cssText = `
        padding: 12px 16px;
        background: #fff;
        border-top: 1px solid #eee;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
    `;
    footer.innerHTML = `
        <button id="mSaveButton" 
                style="flex:1; min-width:100px; padding:10px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer;">
            💾 保存配置
        </button>
        <button id="closeBtn" 
                style="flex:1; min-width:100px; padding:10px; background: #f44336; color: white; border: none; border-radius: 6px; cursor: pointer;">
            ❌ 关闭
        </button>
        <div style="width:100%; display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" id="startButton" style="flex:1; padding:10px; background:#28a745; color:white; border:none; border-radius:6px; cursor:pointer;">▶️ 开启直播回复</button>
            <button type="button" id="startLoopButton" style="flex:1; padding:10px; background:#17a2b8; color:white; border:none; border-radius:6px; cursor:pointer;">🔄 开启循环</button>
        </div>
        <div>
            <button type="button" id="douyinFeige" style="width:100%; padding:10px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer;">
                💬 小店客服回复
            </button>
        </div>
    `;
    panel.appendChild(footer);

    document.body.appendChild(panel);

    // 填充初始值
    populateForm(configData);

    // ============ 事件绑定 ============
    bindEvents(panel);
}

// ------------------------------
// 工具函数
// ------------------------------

// 深度合并对象
function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(result[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }
    return result;
}

// 构建面板 HTML
function buildPanelHTML(config) {
    return `
        <div class="tab-container">
            <div class="tab-header" style="display:flex; border-bottom: 2px solid #eee; margin-bottom: 16px;">
                <div class="tab-item active" data-tab="account" style="padding: 8px 16px; cursor: pointer; font-weight: bold; border-bottom: 2px solid transparent;">账号信息</div>
                <div class="tab-item" data-tab="text" style="padding: 8px 16px; cursor: pointer; color: #666;">文本配置</div>
                <div class="tab-item" data-tab="freq" style="padding: 8px 16px; cursor: pointer; color: #666;">频率配置</div>
                <div class="tab-item" data-tab="auto" style="padding: 8px 16px; cursor: pointer; color: #666;">自动弹窗</div>
                <div class="tab-item" data-tab="api" style="padding: 8px 16px; cursor: pointer; color: #666;">接口对接</div>
            </div>

            <div class="tab-content">

                <!-- 账号信息 -->
                <div class="tab-pane" data-pane="account">
                    <pre id="newMessageBox" style="background:#000; color:#0f0; padding:10px; border-radius:6px; font-size:12px; height:80px; overflow-y:auto; margin:0;">
此处显示消息列表，配置完成后，可以关闭配置弹窗
                    </pre>
                    <div style="color:red; margin-top:8px;" id="usernameBox"></div>
                </div>

                <!-- 文本配置 -->
                <div class="tab-pane hidden" data-pane="text">
                    <h4 style="margin:12px 0 8px; color:#333;">功能开关</h4>
                    <div style="margin: 10px 0;">
                        <label>
                            <input type="checkbox" id="autoReply">
                            开启自动发送
                        </label>
                    </div>
                    <div style="margin: 10px 0;">
                        <label>最大回复长度：</label>
                        <input type="number" id="maxLength" min="10" max="100" style="width:60px; padding:4px; border:1px solid #ccc; border-radius:4px;">
                    </div>

                    <h4 style="margin:12px 0 8px; color:#333;">关键词与回复</h4>
                    <h5 style="margin:8px 0; color:#555;">关键词话术（#分隔关键词和答案）</h5>
                    <textarea id="qaKeywords" class="input" style="width:100%; height:80px; padding:8px; border:1px solid #ccc; border-radius:4px; resize:vertical;"></textarea>

                    <h5 style="margin:8px 0; color:#555;">兜底回复</h5>
                    <textarea id="finalReplay" class="input" style="width:100%; height:80px; padding:8px; border:1px solid #ccc; border-radius:4px; resize:vertical;"></textarea>

                    <h5 style="margin:8px 0; color:#555;">循环话术列表（每行一条）</h5>
                    <textarea id="questions" class="input" style="width:100%; height:60px; padding:8px; border:1px solid #ccc; border-radius:4px; resize:vertical;"></textarea>

                    <h4 style="margin:12px 0 8px; color:#333;">过滤与屏蔽</h4>
                    <h5 style="margin:8px 0; color:#555;">屏蔽关键词（每行一个）</h5>
                    <textarea id="blockedKeywords" rows="3" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; resize:vertical;"></textarea>

                    <hr style="margin:16px 0; border-color: #eee;">

                    <h4 style="margin:12px 0 8px; color:#333;">直播间设置</h4>
                    <h5 style="margin:8px 0; color:#555;">本人昵称（忽略）</h5>
                    <input type="text" id="douyinNickname" class="input" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">

                    <h5 style="margin:8px 0; color:#555;">忽略关键词（#分隔）</h5>
                    <input type="text" id="blackWords" class="input" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">

                    <div style="margin:10px 0;">
                        <input type="checkbox" id="replyCommentStatus" name="replyCommentStatus" value="yes" checked>
                        <label for="replyCommentStatus">是否回复评论</label>
                    </div>
                </div>

                <!-- 频率配置 -->
                <div class="tab-pane hidden" data-pane="freq">
                    <h4 style="margin:8px 0;">回复评论频率（秒）</h4>
                    <input type="number" id="timeLimit" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">

                    <h4 style="margin:8px 0;">循环话术频率（秒）</h4>
                    <input type="number" id="speakLimit" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">

                    <h4 style="margin:8px 0;">每轮话术休息（秒）</h4>
                    <input type="number" id="speakBreak" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">

                    <h4 style="margin:8px 0;">随机补充两个Emoji表情</h4>
                    <div style="margin:10px 0;">
                        <input type="checkbox" id="insertPlaceholder" name="insertPlaceholder" value="yes" checked>
                        <label for="insertPlaceholder">是否补充</label>
                    </div>

                    <h4 style="margin:8px 0;">抖店|拼多多客服延迟（秒）</h4>
                    <input type="number" id="kefuBreak" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">

                    <h4 style="margin:8px 0;">转接人工关键词（#分隔）</h4>
                    <input type="text" id="feigeHumanWords" class="input" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" value="人工#转人工">

                    <h4 style="margin:8px 0;">转接人工客服账号</h4>
                    <input type="text" id="feigeHumanAccount" class="input" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                </div>

                <!-- 自动弹窗 -->
                <div class="tab-pane hidden" data-pane="auto">
                    <h4 style="margin:8px 0;">循环讲解（几号#几秒）</h4>
                    <input type="text" id="speakNum" class="input" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">

                    <h4 style="margin:8px 0;">循环弹品（几号#几秒，多行）</h4>
                    <textarea id="pushProduct" class="input" style="width:100%; height:60px; padding:8px; border:1px solid #ccc; border-radius:4px; resize:vertical;"></textarea>

                    <h4 style="margin:8px 0;">循环弹券（几号#几秒）</h4>
                    <input type="text" id="pushQuan" class="input" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                </div>

                <!-- 接口对接 -->
                <div class="tab-pane hidden" data-pane="api">
                    <h4 style="margin:8px 0;">AI 模型提供商</h4>
                    <select id="provider" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                        <option value="coze">Coze</option>
                        <option value="gpt">GPT</option>
                    </select>

                    <h4 style="margin:8px 0;">模型名称</h4>
                    <input type="text" id="model" class="input" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" value="gpt-3.5-turbo">

                    <h4 style="margin:8px 0;">兼容GPT接口地址</h4>
                    <input type="text" id="gptApi" class="input" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">

                    <h4 style="margin:8px 0;">兼容GPT接口密钥</h4>
                    <input type="password" id="gptKey" class="input" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">

                    <h4 style="margin:8px 0;">Coze 智能体机器人ID</h4>
                    <input type="text" id="cozeBotid" class="input" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">

                    <h4 style="margin:8px 0;">Coze API_KEY</h4>
                    <input type="password" id="cozeApikey" class="input" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">

                    <h4 style="margin:8px 0;">唯一客服回复接口</h4>
                    <input type="text" id="apiBase" class="input" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">

                    <h4 style="margin:8px 0;">评论消息 WebHook</h4>
                    <input type="text" id="hookBase" class="input" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">

                    <h4 style="margin:8px 0;">回复内容 WebHook</h4>
                    <input type="text" id="audioBase" class="input" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                </div>
            </div>
        </div>
    `;
}

// 填充表单数据
function populateForm(config) {
    // 文本配置
    setChecked('autoReply', config.text?.autoSend);
    setValue('maxLength', config.text?.maxLength);
    setValue('qaKeywords', config.text?.qaKeywords);
    setValue('finalReplay', config.text?.finalReplay);
    setValue('questions', config.text?.questions);
    setValue('blockedKeywords', Array.isArray(config.text?.blockedKeywords) ? config.text.blockedKeywords.join('\n') : '');
    setValue('douyinNickname', config.text?.douyinNickname);
    setValue('blackWords', config.text?.blackWords);
    setChecked('replyCommentStatus', config.text?.replyCommentStatus);

    // 频率配置
    setValue('timeLimit', config.freq?.timeLimit);
    setValue('speakLimit', config.freq?.speakLimit);
    setValue('speakBreak', config.freq?.speakBreak);
    setChecked('insertPlaceholder', config.freq?.insertPlaceholder);
    setValue('kefuBreak', config.freq?.kefuBreak);
    setValue('feigeHumanWords', config.freq?.feigeHumanWords);
    setValue('feigeHumanAccount', config.freq?.feigeHumanAccount);

    // 自动弹窗
    setValue('speakNum', config.auto?.speakNum);
    setValue('pushProduct', config.auto?.pushProduct);
    setValue('pushQuan', config.auto?.pushQuan);

    // 接口对接
    setValue('provider', config.api?.provider);
    setValue('model', config.api?.model);
    setValue('gptApi', config.api?.gptApi);
    setValue('gptKey', config.api?.gptKey);
    setValue('cozeBotid', config.api?.cozeBotid);
    setValue('cozeApikey', config.api?.cozeApikey);
    setValue('apiBase', config.api?.apiBase);
    setValue('hookBase', config.api?.hookBase);
    setValue('audioBase', config.api?.audioBase);
}

// 辅助函数
function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || '';
}

function setChecked(id, checked) {
    const el = document.getElementById(id);
    if (el) el.checked = !!checked;
}

// 事件绑定
function bindEvents(panel) {
    const header = document.getElementById('panel-header');
    const closeBtns = ['closePanel', 'closeBtn'];

    // 拖拽逻辑
    let isDragging = false, offsetX, offsetY;
    header.addEventListener('mousedown', e => {
        isDragging = true;
        offsetX = e.clientX - panel.getBoundingClientRect().left;
        offsetY = e.clientY - panel.getBoundingClientRect().top;
    });
    document.addEventListener('mousemove', e => {
        if (isDragging) {
            panel.style.left = `${e.clientX - offsetX}px`;
            panel.style.right = 'auto';
            panel.style.top = `${e.clientY - offsetY}px`;
        }
    });
    document.addEventListener('mouseup', () => isDragging = false);

    // 关闭按钮
    closeBtns.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', () => panel.style.display = 'none');
    });

    // Tab 切换
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
            tab.classList.add('active');
            document.querySelector(`.tab-pane[data-pane="${tab.dataset.tab}"]`).classList.remove('hidden');
        });
    });

    // 保存配置
    document.getElementById('mSaveButton').addEventListener('click', () => {
        const config = {
            text: {
                autoSend: document.getElementById('autoReply').checked,
                maxLength: parseInt(document.getElementById('maxLength').value) || 50,
                qaKeywords: document.getElementById('qaKeywords').value,
                finalReplay: document.getElementById('finalReplay').value,
                questions: document.getElementById('questions').value,
                blockedKeywords: document.getElementById('blockedKeywords').value
                    .split('\n').map(k => k.trim()).filter(k => k),
                douyinNickname: document.getElementById('douyinNickname').value,
                blackWords: document.getElementById('blackWords').value,
                replyCommentStatus: document.getElementById('replyCommentStatus').checked,
            },
            freq: {
                timeLimit: parseInt(document.getElementById('timeLimit').value) || 5,
                speakLimit: parseInt(document.getElementById('speakLimit').value) || 30,
                speakBreak: parseInt(document.getElementById('speakBreak').value) || 60,
                insertPlaceholder: document.getElementById('insertPlaceholder').checked,
                kefuBreak: parseInt(document.getElementById('kefuBreak').value) || 2,
                feigeHumanWords: document.getElementById('feigeHumanWords').value,
                feigeHumanAccount: document.getElementById('feigeHumanAccount').value,
            },
            auto: {
                speakNum: document.getElementById('speakNum').value,
                pushProduct: document.getElementById('pushProduct').value,
                pushQuan: document.getElementById('pushQuan').value,
            },
            api: {
                provider: document.getElementById('provider').value,
                model: document.getElementById('model').value,
                gptApi: document.getElementById('gptApi').value,
                gptKey: document.getElementById('gptKey').value,
                cozeBotid: document.getElementById('cozeBotid').value,
                cozeApikey: document.getElementById('cozeApikey').value,
                apiBase: document.getElementById('apiBase').value,
                hookBase: document.getElementById('hookBase').value,
                audioBase: document.getElementById('audioBase').value,
            }
        };

        // 使用 postMessage 发送给 content.js
        window.postMessage({
            type: 'FROM_PAGE_TO_CONTENT',
            data: { type: 'saveConfig', data: config }
        }, '*');
    });

    // ================================
    // ✅ 新增：监听保存结果响应
    // ================================
    window.addEventListener('message', (event) => {
        if (event.source !== window) return;

        const message = event.data;
        if (message.type === 'FROM_CONTENT_TO_PAGE') {
            const response = message.data;

            // 或者用更优雅的 toast（推荐）
            showSaveResult(response.success, response.error);
        }
    });

    // 可选：封装成函数
    function showSaveResult(success, error) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            padding: 12px 24px; border-radius: 6px;
            color: white; font-size: 14px; z-index: 9999;
            background: ${success ? '#4CAF50' : '#f44336'};
            opacity: 0; transition: opacity 0.3s; pointer-events: none;
        `;
        toast.textContent = success ? '✅ 保存成功' : '❌ ' + (error || '保存失败');
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '1'; }, 10);
        setTimeout(() => { toast.remove(); }, 3000);
    }

    // 其他按钮
    ['startButton', 'startLoopButton', 'douyinFeige'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', () => {
                window.postMessage({
                    type: 'FROM_PAGE_TO_CONTENT',
                    data: { type: id }
                }, '*');
            });
        }
    });
}

// 导出函数（供外部调用）
if (typeof module !== 'undefined') module.exports = { injectConfigPanel };