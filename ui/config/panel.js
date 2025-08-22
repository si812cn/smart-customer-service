// panel.js
// 浮动配置面板（优化增强版） - 与最新 DEFAULT_CONFIG 对齐

function injectConfigPanel(Config = {}) {
    // ========================
    // ✅ 默认配置（与最新 DEFAULT_CONFIG 对齐）
    // ========================
    const DEFAULT_CONFIG = {
        text: {
            autoSend: false,
            maxLength: 50,
            qaKeywords: '你好#你好呀\n发货#已安排',
            finalReplay: '感谢关注，有疑问随时问我哦～',
            questions: '欢迎来到直播间\n今天有新品上架',
            blockedKeywords: [
                '广告', '加微信', '刷单', '加V', '微信', 'qq', 'vx',
                'telegram', 'tg', '返现', '代运营', '测试', 'demo'
            ],
            douyinNickname: '小助手',
            blackWords: '测试#demo',
            replyCommentStatus: true
        },
        freq: {
            timeLimit: 3,        // 秒：回复评论最小间隔
            speakLimit: 30,      // 秒：主动话术推送频率
            speakBreak: 30,      // 秒：话术后休息时间
            cooldown: 3000,         // 毫秒：用户级冷却时间
            maxPerMinute: 20,       // 每分钟最多自动回复条数
            insertPlaceholder: true,
            kefuBreak: 2,
            feigeHumanWords: '人工#转人工',
            feigeHumanAccount: ''
        },
        auto: {
            speakNum: '',
            pushProduct: '',
            pushQuan: ''
        },
        api: {
            provider: 'coze',
            model: 'coze',
            gptApi: 'https://api.openai.com/v1/chat/completions',
            gptKey: '',
            cozeBotid: '7495623233941815337',
            cozeApikey: 'pat_mshRxvpwBCdBM6VbJbE3sHkUrOfZ6QgsKPjfGHcky5JqeUvsyFz3MLOPo1mJQE6H',
            apiBase: '',
            hookBase: '',
            audioBase: ''
        },
        sys: {
            dataCenterUrl : 'http://127.0.0.1:8089', //数据中心服务器地址
            lastUpdate : ''         //在 storage 中记录上次从服务器获取最新配置的更新时间，
        }
    };

    // 合并配置
    const configData = deepMerge(DEFAULT_CONFIG, Config);

    let panel = document.getElementById('auto-reply-config-panel');

    // ✅ 如果面板已存在：更新值并显示
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
        color: #333;
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

    // 初始化表单
    populateForm(configData);

    // 绑定事件
    bindEvents(panel);
}

// ========================
// 🔧 工具函数
// ========================

/**
 * 深度合并两个对象
 */
function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key] !== null) {
                result[key] = deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
    }
    return result;
}

/**
 * 构建面板 HTML
 */
function buildPanelHTML(config) {
    return `
        <div class="tab-container">
            <!-- Tab 导航 -->
            <div class="tab-header" style="display:flex; border-bottom: 2px solid #eee; margin-bottom: 16px;">
                <div class="tab-item active" data-tab="account" style="padding: 8px 16px; cursor: pointer; font-weight: bold; border-bottom: 2px solid transparent;">账号信息</div>
                <div class="tab-item" data-tab="text" style="padding: 8px 16px; cursor: pointer; color: #666;">文本配置</div>
                <div class="tab-item" data-tab="freq" style="padding: 8px 16px; cursor: pointer; color: #666;">频率配置</div>
                <div class="tab-item" data-tab="auto" style="padding: 8px 16px; cursor: pointer; color: #666;">自动弹窗</div>
                <div class="tab-item" data-tab="api" style="padding: 8px 16px; cursor: pointer; color: #666;">接口对接</div>
            </div>

            <!-- 内容区 -->
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
                    <h4 style="margin:12px 0 8px; color:#333;">自动回复</h4>
                    <div style="margin: 10px 0;">
                        <label><input type="checkbox" id="autoReply"> 开启自动发送</label>
                    </div>
                    <div style="margin: 10px 0;">
                        <label>最大回复长度：</label>
                        <input type="number" id="maxLength" min="10" max="100" style="width:60px; padding:4px; border:1px solid #ccc; border-radius:4px;">
                    </div>

                    <h4 style="margin:12px 0 8px; color:#333;">关键词与回复</h4>
                    <p style="color:#666; margin:4px 0; font-size:13px;">格式：关键词#回复内容（每行一条）</p>
                    <textarea id="qaKeywords" style="width:100%; height:80px; padding:8px; border:1px solid #ccc; border-radius:4px; resize:vertical;"></textarea>

                    <p style="color:#666; margin:8px 0 4px; font-size:13px;">兜底回复（无匹配时使用）</p>
                    <textarea id="finalReplay" style="width:100%; height:80px; padding:8px; border:1px solid #ccc; border-radius:4px; resize:vertical;"></textarea>

                    <p style="color:#666; margin:8px 0 4px; font-size:13px;">循环话术（每行一条）</p>
                    <textarea id="questions" style="width:100%; height:60px; padding:8px; border:1px solid #ccc; border-radius:4px; resize:vertical;"></textarea>

                    <h4 style="margin:12px 0 8px; color:#333;">过滤设置</h4>
                    <p style="color:#666; margin:4px 0; font-size:13px;">每行一个关键词，支持部分匹配</p>
                    <textarea id="blockedKeywords" rows="3" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; resize:vertical;"></textarea>

                    <hr style="margin:16px 0; border-color: #eee;">

                    <h4 style="margin:12px 0 8px; color:#333;">直播间过滤</h4>
                    <p style="color:#666; margin:4px 0; font-size:13px;">自己的昵称（不回复）</p>
                    <input type="text" id="douyinNickname" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">

                    <p style="color:#666; margin:4px 0; font-size:13px;">忽略关键词（#分隔）</p>
                    <input type="text" id="blackWords" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">

                    <div style="margin:10px 0;">
                        <label><input type="checkbox" id="replyCommentStatus" checked> 回复用户评论</label>
                    </div>
                </div>

                <!-- 频率配置 -->
                <div class="tab-pane hidden" data-pane="freq">
                    <h4 style="margin:8px 0; color:#333;">评论回复最小间隔（秒）</h4>
                    <input type="number" id="timeLimit" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" placeholder="默认 3 秒">

                    <h4 style="margin:8px 0; color:#333;">主动话术频率（秒）</h4>
                    <input type="number" id="speakLimit" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" placeholder="默认 30 秒">

                    <h4 style="margin:8px 0; color:#333;">话术后休息时间（秒）</h4>
                    <input type="number" id="speakBreak" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" placeholder="默认 30 秒">

                    <h4 style="margin:8px 0; color:#333;">用户级冷却时间（毫秒）</h4>
                    <input type="number" id="cooldown" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" placeholder="默认 3 秒">

                    <h4 style="margin:8px 0; color:#333;">每分钟最多回复（条）</h4>
                    <input type="number" id="maxPerMinute" min="1" max="60" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" placeholder="默认 20 条">

                    <div style="margin:10px 0;">
                        <label><input type="checkbox" id="insertPlaceholder" checked> 随机插入两个 Emoji 表情</label>
                    </div>

                    <h4 style="margin:8px 0; color:#333;">客服延迟（秒）</h4>
                    <input type="number" id="kefuBreak" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" placeholder="默认 2 秒">

                    <h4 style="margin:8px 0; color:#333;">转人工关键词（#分隔）</h4>
                    <input type="text" id="feigeHumanWords" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" value="人工#转人工">

                    <h4 style="margin:8px 0; color:#333;">转人工客服账号</h4>
                    <input type="text" id="feigeHumanAccount" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                </div>

                <!-- 自动弹窗 -->
                <div class="tab-pane hidden" data-pane="auto">
                    <h4 style="margin:8px 0; color:#333;">循环讲解（几号#几秒）</h4>
                    <input type="text" id="speakNum" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" placeholder="如：1#60">

                    <h4 style="margin:8px 0; color:#333;">循环弹品（几号#几秒，多行）</h4>
                    <textarea id="pushProduct" style="width:100%; height:60px; padding:8px; border:1px solid #ccc; border-radius:4px; resize:vertical;"></textarea>

                    <h4 style="margin:8px 0; color:#333;">循环弹券（几号#几秒）</h4>
                    <input type="text" id="pushQuan" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" placeholder="如：1#120">
                </div>

                <!-- 接口对接 -->
                <div class="tab-pane hidden" data-pane="api">
                    <h4 style="margin:8px 0; color:#333;">AI 模型提供商</h4>
                    <select id="provider" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                        <option value="coze">Coze</option>
                        <option value="gpt">GPT (OpenAI)</option>
                    </select>

                    <h4 style="margin:8px 0; color:#333;">模型名称</h4>
                    <input type="text" id="model" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" value="coze">

                    <h4 style="margin:8px 0; color:#333;">GPT 接口地址</h4>
                    <input type="text" id="gptApi" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" placeholder="https://...">

                    <h4 style="margin:8px 0; color:#333;">GPT API Key</h4>
                    <input type="password" id="gptKey" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" placeholder="隐藏输入">

                    <h4 style="margin:8px 0; color:#333;">Coze 机器人 ID</h4>
                    <input type="text" id="cozeBotid" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">

                    <h4 style="margin:8px 0; color:#333;">Coze API Key</h4>
                    <input type="password" id="cozeApikey" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" placeholder="隐藏输入">

                    <h4 style="margin:8px 0; color:#333;">客服回复接口</h4>
                    <input type="text" id="apiBase" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" placeholder="http://...">

                    <h4 style="margin:8px 0; color:#333;">评论 WebHook</h4>
                    <input type="text" id="hookBase" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" placeholder="http://...">

                    <h4 style="margin:8px 0; color:#333;">回复 WebHook</h4>
                    <input type="text" id="audioBase" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" placeholder="http://...">
                </div>
            </div>
        </div>
    `;
}

/**
 * 填充表单数据
 */
function populateForm(config) {
    // 文本配置
    setChecked('autoReply', config.text.autoSend);
    setValue('maxLength', config.text.maxLength);
    setValue('qaKeywords', config.text.qaKeywords);
    setValue('finalReplay', config.text.finalReplay);
    setValue('questions', config.text.questions);
    setValue('blockedKeywords', Array.isArray(config.text.blockedKeywords) ? config.text.blockedKeywords.join('\n') : '');
    setValue('douyinNickname', config.text.douyinNickname);
    setValue('blackWords', config.text.blackWords);
    setChecked('replyCommentStatus', config.text.replyCommentStatus);

    setValue('timeLimit', config.freq.timeLimit);
    setValue('speakLimit', config.freq.speakLimit);
    setValue('speakBreak', config.freq.speakBreak);
    setValue('cooldown', config.freq.cooldown);//毫秒
    setValue('maxPerMinute', config.freq.maxPerMinute);
    setChecked('insertPlaceholder', config.freq.insertPlaceholder);
    setValue('kefuBreak', config.freq.kefuBreak);
    setValue('feigeHumanWords', config.freq.feigeHumanWords);
    setValue('feigeHumanAccount', config.freq.feigeHumanAccount);

    // 自动弹窗
    setValue('speakNum', config.auto.speakNum);
    setValue('pushProduct', config.auto.pushProduct);
    setValue('pushQuan', config.auto.pushQuan);

    // 接口对接
    setValue('provider', config.api.provider);
    setValue('model', config.api.model);
    setValue('gptApi', config.api.gptApi);
    setValue('gptKey', config.api.gptKey);
    setValue('cozeBotid', config.api.cozeBotid);
    setValue('cozeApikey', config.api.cozeApikey);
    setValue('apiBase', config.api.apiBase);
    setValue('hookBase', config.api.hookBase);
    setValue('audioBase', config.api.audioBase);
}

// ========================
// 🔧 辅助函数
// ========================
function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || '';
}

function setChecked(id, checked) {
    const el = document.getElementById(id);
    if (el) el.checked = !!checked;
}

// ========================
// 🎯 事件绑定
// ========================
function bindEvents(panel) {
    const header = document.getElementById('panel-header');
    const closeBtns = ['closePanel', 'closeBtn'];

    // 拖拽逻辑
    let isDragging = false;
    let offsetX, offsetY;

    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - panel.getBoundingClientRect().left;
        offsetY = e.clientY - panel.getBoundingClientRect().top;
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            panel.style.left = `${e.clientX - offsetX}px`;
            panel.style.right = 'auto';
            panel.style.top = `${e.clientY - offsetY}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // 关闭按钮
    closeBtns.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', () => {
                panel.style.display = 'none';
            });
        }
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
                autoSend: getChecked('autoReply'),
                maxLength: getInt('maxLength', 50),
                qaKeywords: getValue('qaKeywords'),
                finalReplay: getValue('finalReplay'),
                questions: getValue('questions'),
                blockedKeywords: getLines('blockedKeywords'),
                douyinNickname: getValue('douyinNickname'),
                blackWords: getValue('blackWords'),
                replyCommentStatus: getChecked('replyCommentStatus')
            },
            freq: {
                timeLimit: getInt('timeLimit', 3),
                speakLimit: getInt('speakLimit', 30),
                speakBreak: getInt('speakBreak', 30),
                cooldown: getInt('cooldown', 3000),          // 毫秒
                maxPerMinute: getInt('maxPerMinute', 20),
                insertPlaceholder: getChecked('insertPlaceholder'),
                kefuBreak: getInt('kefuBreak', 2),
                feigeHumanWords: getValue('feigeHumanWords'),
                feigeHumanAccount: getValue('feigeHumanAccount')
            },
            auto: {
                speakNum: getValue('speakNum'),
                pushProduct: getValue('pushProduct'),
                pushQuan: getValue('pushQuan')
            },
            api: {
                provider: getValue('provider'),
                model: getValue('model'),
                gptApi: getValue('gptApi'),
                gptKey: getValue('gptKey'),
                cozeBotid: getValue('cozeBotid'),
                cozeApikey: getValue('cozeApikey'),
                apiBase: getValue('apiBase'),
                hookBase: getValue('hookBase'),
                audioBase: getValue('audioBase')
            }
        };

        // 发送配置给 content.js
        window.postMessage({
            type: 'FROM_PAGE_TO_CONTENT',
            data: { type: 'saveConfig', data: config }
        }, '*');
    });

    // 监听保存结果
    window.addEventListener('message', (event) => {
        if (event.source !== window) return;
        const message = event.data;
        if (message.type === 'FROM_CONTENT_TO_PAGE' && message.data) {
            const { success, error } = message.data;
            showSaveResult(success, error);
        }
    });

    // 显示保存结果提示
    function showSaveResult(success, error) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            padding: 12px 24px; border-radius: 6px; color: white;
            font-size: 14px; z-index: 999999; opacity: 0;
            transition: opacity 0.3s; pointer-events: none;
            background: ${success ? '#4CAF50' : '#f44336'};
        `;
        toast.textContent = success ? '✅ 保存成功' : `❌ ${error || '保存失败'}`;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '1'; }, 100);
        setTimeout(() => { toast.remove(); }, 3000);
    }

    // 快捷按钮事件
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

    // 新增：输入框获取值的辅助函数
    function getValue(id) {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    }

    function getChecked(id) {
        const el = document.getElementById(id);
        return el ? el.checked : false;
    }

    function getInt(id, fallback) {
        const val = parseInt(getValue(id));
        return isNaN(val) ? fallback : val;
    }

    function getLines(id) {
        return getValue(id)
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }
}

// 导出（用于模块化环境）
if (typeof module !== 'undefined') {
    module.exports = { injectConfigPanel };
}