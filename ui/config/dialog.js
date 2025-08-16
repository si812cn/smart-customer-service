var _0x3b3d7b = _0x5b2a;

function _0x225b() {
    var _0x556d74 = ['登录成功！刷新页面', 'gptKey', 'getElementById', 'yes', 'body', '2064FMFMWt', 'blackWords', 'speakBreak', 'feigeHumanAccount', 'pushProduct', 'token', 'audioBase', '4709907cBNMuT', 'douyinFeige', 'sendMessage', 'simpleTestBtn', 'douyinNickname', 'kefuBreak', 'scrollBy', 'addEventListener', 'scrollPageBtn', '保存成功！', 'mSaveButton', '228wXflrF', 'expired_at', '580px', '300px', 'questions', '5937LCFAyd', 'networkCatch', 'gptApi', 'finalReplay', 'value', 'name', 'msg', 'timeLimit', 'checked', 'cozeApikey', 'click', 'apiBase', '1284HtttaZ', 'replace', '19033OhIcpG', 'onMessage', 'speakNum', 'startLoopButton', 'pushQuan', '18970358pXJxag', 'parse', 'split', 'setItem', 'kefuUsername', 'code', '400px', 'hookBase', '//ul[@class="el-pager"]/li[', 'forEach', 'feigeHumanWords', '257914UgOHTf', 'speakLimit', '唯一客服浏览器插件配置', '1840xTzLgV', '3ODajvZ', 'result', '用户名：', '&nbsp;&nbsp;&nbsp;&nbsp;过期时间：', 'innerHeight', '4633890VDhrtR', 'kefuLoginCheck', 'getItem', 'kefuPassword', 'cozeBotid', 'kefu_token', 'qaKeywords', 'replyCommentStatus', 'insertPlaceholder', 'startLoopSpeak', '
    <style>
    *{
        margin:0;
        padding: 0;
    }
        .box{
        height: auto;
        padding: 10px;
        color: #333;
}
</style>
    <div class="box">
        <div class="layui-form">
            <div class="layui-form-item">
                <input type="text" id="kefuUsername" placeholder="用户名" class="layui-input">
            </div>
            <div class="layui-form-item">
                <input type="password" id="kefuPassword" placeholder="密码" class="layui-input">
            </div>
            <div class="layui-form-item">
                <button type="button" class="layui-btn" id="kefuLoginCheck">登录</button>
                <a type="button" class="layui-btn" target="_blank" href="https://gofly.v1kf.com/main">注册</a>
            </div>
        </div>

    </div>
', 'innerHTML', 'open', 'usernameBox'];
_0x225b = function() {
    return _0x556d74;
};
return _0x225b();
}(function(_0x263132, _0x15479c) {
    var _0x3985bc = _0x5b2a,
        _0x259e0a = _0x263132();
    while (!![]) {
        try {
            var _0x31f63e = parseInt(_0x3985bc(0xeb)) / 0x1 * (-parseInt(_0x3985bc(0xe7)) / 0x2) + parseInt(_0x3985bc(0x11a)) / 0x3 * (-parseInt(_0x3985bc(0xd5)) / 0x4) + -parseInt(_0x3985bc(0xea)) / 0x5 * (-parseInt(_0x3985bc(0x115)) / 0x6) + -parseInt(_0x3985bc(0xd7)) / 0x7 * (-parseInt(_0x3985bc(0x103)) / 0x8) + -parseInt(_0x3985bc(0x10a)) / 0x9 + -parseInt(_0x3985bc(0xf0)) / 0xa + parseInt(_0x3985bc(0xdc)) / 0xb;
            if (_0x31f63e === _0x15479c) break;
            else _0x259e0a['push'](_0x259e0a['shift']());
        } catch (_0x2ba0f9) {
            _0x259e0a['push'](_0x259e0a['shift']());
        }
    }
}(_0x225b, 0x69476));

function _0x5b2a(_0x1f955f, _0x259f49) {
    var _0x225b99 = _0x225b();
    return _0x5b2a = function(_0x5b2a8e, _0xd466d7) {
        _0x5b2a8e = _0x5b2a8e - 0xd2;
        var _0x6dfd22 = _0x225b99[_0x5b2a8e];
        return _0x6dfd22;
    }, _0x5b2a(_0x1f955f, _0x259f49);
}
let isShowDialog = ![];
kefuUsername = '', kefuExpire = '';

function checkLogin() {
    var _0xee0809 = _0x5b2a;
    sendGetRequest('https://gofly.v1kf.com/kefu/kefuinfo', getCookie(_0xee0809(0xf5)), function(_0x597f64) {
        var _0x55c0db = _0xee0809,
            _0x597f64 = JSON['parse'](_0x597f64);
        if (_0x597f64[_0x55c0db(0xe1)] != 0xc8) {
            dialogLogin();
            return;
        }
        kefuUsername = _0x597f64[_0x55c0db(0xec)][_0x55c0db(0x11f)], kefuExpire = _0x597f64['result'][_0x55c0db(0x116)], dialogConfig();
    });
}
chrome['runtime'][_0x3b3d7b(0xd8)]['addListener'](function(_0x1b98c6, _0x24e0d5, _0x10cec3) {
    checkLogin();
});

function dialogLogin() {
    var _0x56e8af = _0x3b3d7b;
    if (isShowDialog) return;
    let _0x64b79a = _0x56e8af(0xfa);
    layer['open']({
        'type': 0x1,
        'area': [_0x56e8af(0xe2), _0x56e8af(0x118)],
        'title': '唯一客服浏览器插件登录',
        'shade': 0x0,
        'shadeClose': !![],
        'maxmin': ![],
        'anim': 0x0,
        'content': _0x64b79a,
        'end': function() {
            isShowDialog = ![];
        },
        'success': function(_0x23b481, _0x114788, _0x4df27a) {
            var _0x19f6c5 = _0x56e8af;
            isShowDialog = !![], document['getElementById'](_0x19f6c5(0xf1))[_0x19f6c5(0x111)]('click', function() {
                var _0x501a10 = _0x19f6c5,
                    _0x2e462a = document[_0x501a10(0x100)](_0x501a10(0xe0))[_0x501a10(0x11e)],
                    _0x4fad97 = document[_0x501a10(0x100)](_0x501a10(0xf3))['value'];
                sendPostRequest('https://gofly.v1kf.com/check', {
                    'username': _0x2e462a,
                    'password': _0x4fad97
                }, function(_0xc5435c) {
                    var _0x4d4a40 = _0x501a10;
                    _0xc5435c = JSON[_0x4d4a40(0xdd)](_0xc5435c);
                    if (_0xc5435c[_0x4d4a40(0xe1)] != 0xc8) alert('登录失败');
                    else {
                        alert(_0x4d4a40(0xfe));
                        var _0x8da8e4 = _0xc5435c[_0x4d4a40(0xec)][_0x4d4a40(0x108)];
                        setCookie('kefu_token', _0x8da8e4, 0x1), location['reload']();
                    }
                });
            });
        }
    });
}

function dialogConfig() {
    var _0x853d6f = _0x3b3d7b;
    if (isShowDialog) return;
    let _0x722361 = '
        <style>
        /* 基础样式重置 */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
}

    /* 主容器样式 */
.box {
        padding:0px 20px;
        color: #333;
        background: #fff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }

    /* 标题样式 */
.box h3 {
        font-size: 18px;
        margin: 15px 0 10px;
        color: #1a1a1a;
        font-weight: 600;
    }

.box h4 {
        font-size: 15px;
        margin: 12px 0 8px;
        color: #444;
        font-weight: 500;
    }

    /* 输入框统一样式 */
.layui-input, .layui-textarea {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #e2e2e2;
        border-radius: 4px;
        transition: all 0.3s ease;
        margin: 8px 0;
    }

.layui-input:focus, .layui-textarea:focus {
        border-color: rgb(22, 186, 170);
        box-shadow: 0 0 0 2px rgba(22, 186, 170, 0.2);
        outline: none;
    }

    /* 消息框样式 */
    #newMessageBox {
        background: #f8f9fa;
        padding: 12px;
        border-radius: 6px;
        border-left: 4px solid rgb(22, 186, 170);
        margin: 10px 0;
        font-family: monospace;
        color:#333;
    }

    /* 时间限制框样式 */
.timeLimitBox {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 12px 0;
    }

.timeLimitBox .layui-input {
        width: 80px;
        text-align: center;
    }

    /* 按钮样式 */

.box .layui-btn:hover {
        background-color: rgb(18, 166, 150);
        box-shadow: 0 2px 8px rgba(22, 186, 170, 0.3);
    }

    /* 按钮组样式 */
.btns {
        display: flex;
        flex-wrap: wrap;
        margin: 15px 0;
    }
.btns button {
        color:#fff!important;
    }
</style>

    <div class="box">

        <div class="layui-tab">
            <ul class="layui-tab-title">
                <li class="layui-this">账号信息</li>
                <li>文本配置</li>
                <li>频率配置</li>
                <li>自动弹窗</li>
                <li>接口对接</li>
            </ul>
            <div class="layui-tab-content">
                <div class="layui-tab-item layui-show">
                    <pre class="layui-code code-demo layui-code-theme-dark" id="newMessageBox">此处显示消息列表，配置完成后，可以关闭配置弹窗</pre>
                    <div style="color:red;" id="usernameBox"></div>
                </div>
                <div class="layui-tab-item">
                    <h4>关键词话术，每行一条，#分隔关键词和答案，例如， 你好#你也好</h4>
                    <textarea id="qaKeywords" class="layui-input" style="height: 80px;"></textarea>
                    <h4>兜底回复</h4>
                    <textarea id="finalReplay" class="layui-input" style="height: 80px;"></textarea>
                    <h4>循环话术列表（每行一条）：</h4>
                    <textarea id="questions" class="layui-textarea" style="height: 60px;"></textarea>
                    <hr>
                        <!-- 配置框 -->
                        <h3>🎥 直播间</h3>
                        <h4>本人昵称（忽略评论的昵称）：</h4>
                        <input type="text" id="douyinNickname"  class="layui-input">
                            <h4>忽略评论内容的关键词（#分隔）：</h4>
                            <input type="text" id="blackWords"  class="layui-input">
                                <div>
                                    <input type="checkbox" id="replyCommentStatus" name="replyCommentStatus" value="yes" checked />
                                    <label for="replyCommentStatus">是否回复评论</label>
                                </div>
                </div>
                <div class="layui-tab-item">

                    <h4>回复评论频率(秒)：</h4>
                    <input type="text" id="timeLimit"  class="layui-input">
                        <h4>循环话术频率(秒)：</h4>
                        <input type="text" id="speakLimit"  class="layui-input">
                            <h4>每轮话术休息(秒)：</h4>
                            <input type="text" id="speakBreak"  class="layui-input">

                                <h4>随机补充两个Emoji表情：</h4>
                                <div>
                                    <input type="checkbox" id="insertPlaceholder" name="insertPlaceholder" value="yes" checked />
                                    <label for="insertPlaceholder">是否补充</label>
                                </div>
                                <h4>抖店|拼多多客服延迟(秒)：</h4>
                                <input type="text" id="kefuBreak"  class="layui-input">
                                    <h4>转接人工关键词(多个以#分隔)：</h4>
                                    <input type="text" id="feigeHumanWords"  class="layui-input">
                                        <h4>转接人工客服账号：</h4>
                                        <input type="text" id="feigeHumanAccount"  class="layui-input">
                </div>
                <div class="layui-tab-item">
                    <h4>循环讲解(几号#几秒)：</h4>
                    <input type="text" id="speakNum"  class="layui-input">
                        <h4>循环弹品(几号#几秒,多个回车换行)：</h4>
                        <textarea id="pushProduct" class="layui-textarea" style="height: 60px;"></textarea>
                        <h4>循环弹券(几号#几秒)：</h4>
                        <input type="text" id="pushQuan"  class="layui-input">
                </div>
                <div class="layui-tab-item">
                    <h4>兼容GPT接口地址：</h4>
                    <input type="text" id="gptApi" class="layui-input">
                        <h4>兼容GPT接口密钥：</h4>
                        <input type="text" id="gptKey" class="layui-input">
                            <h4>coze扣子智能体机器人ID：</h4>
                            <input type="text" id="cozeBotid" class="layui-input">
                                <h4>coze扣子智能体API_KEY：</h4>
                                <input type="text" id="cozeApikey" class="layui-input">
                                    <h4>唯一客服回复接口：</h4>
                                    <input type="text" id="apiBase" class="layui-input">
                                        <h4>评论消息WebHook接口：</h4>
                                        <input type="text" id="hookBase" class="layui-input">
                                            <h4>回复内容WebHook接口：</h4>
                                            <input type="text" id="audioBase" class="layui-input">
                </div>
            </div>
        </div>



        <!-- 按钮 -->
        <div class="btns">
            <button type="button" class="layui-btn" id="mSaveButton">保存配置</button>
            <button type="button" class="layui-btn" id="startButton">开启直播回复</button>
            <button type="button" class="layui-btn" id="startLoopButton">开启循环发送</button>
            <button type="button" class="layui-btn" id="startLoopSpeak">循环讲解弹窗</button>
        </div>
        <div class="btns">
            <button type="button" class="layui-btn" id="douyinFeige">抖音小店 | 拼多多 | 快手小店 | 微信小店 客服回复</button>
        </div>

    </div>
';
layer[_0x853d6f(0xfc)]({
    'type': 0x1,
        'area': [_0x853d6f(0x117), '700px'],
        'title': _0x853d6f(0xe9),
        'shade': 0x0,
        'shadeClose': !![],
        'maxmin': ![],
        'anim': 0x0,
        'content': _0x722361,
        'end': function() {
        isShowDialog = ![];
    },
    'success': function(_0x1090d7, _0x334e6e, _0x303dd1) {
        var _0x2c0a4c = _0x853d6f;
        if (kefuUsername) document['getElementById'](_0x2c0a4c(0xfd))[_0x2c0a4c(0xfb)] = _0x2c0a4c(0xed) + kefuUsername + _0x2c0a4c(0xee) + kefuExpire;
        isShowDialog = !![], loadLocalStorage([_0x2c0a4c(0xd4), 'hookBase', _0x2c0a4c(0x109), 'douyinNickname', _0x2c0a4c(0x119), _0x2c0a4c(0x104), 'timeLimit', _0x2c0a4c(0xf6), 'speakLimit', 'finalReplay', 'speakNum', _0x2c0a4c(0x107), _0x2c0a4c(0xdb), _0x2c0a4c(0x105), _0x2c0a4c(0xf8), _0x2c0a4c(0xd2), _0x2c0a4c(0xf4), _0x2c0a4c(0xff), _0x2c0a4c(0x11c), _0x2c0a4c(0x10f), _0x2c0a4c(0xe6), _0x2c0a4c(0x106)]);
        var _0x424dbd = document[_0x2c0a4c(0x100)]('startButton');
        _0x424dbd[_0x2c0a4c(0x111)]('click', function() {
            var _0x303be4 = _0x2c0a4c,
                _0x5534cd = getConfigValues();
            saveToLocalStorage(_0x5534cd), timeLimit = parseInt(_0x5534cd[_0x303be4(0x121)]) * 0x3e8, apiBase = _0x5534cd[_0x303be4(0xd4)], hookBase = _0x5534cd[_0x303be4(0xe3)], audioBase = _0x5534cd[_0x303be4(0x109)], finalReplay = _0x5534cd[_0x303be4(0x11d)], speakLimit = parseInt(_0x5534cd['speakLimit']), questions = _0x5534cd['questions'][_0x303be4(0xd6)](/^\s+|\s+$/g, '')[_0x303be4(0xd6)]('
            ', '
            ')[_0x303be4(0xde)]('
            '), questionsQueue = deepCopy(questions), qaKeywords = _0x5534cd[_0x303be4(0xf6)], douyinNickname = _0x5534cd['douyinNickname'], blackWords = _0x5534cd[_0x303be4(0x104)], replyCommentStatus = _0x5534cd['replyCommentStatus'], cozeBotid = _0x5534cd['cozeBotid'], cozeApikey = _0x5534cd['cozeApikey'], gptKey = _0x5534cd[_0x303be4(0xff)], gptApi = _0x5534cd['gptApi'], startListening();
        });
        var _0x244b07 = document[_0x2c0a4c(0x100)](_0x2c0a4c(0xda));
        _0x244b07['addEventListener'](_0x2c0a4c(0xd3), function() {
            var _0x24dbcf = _0x2c0a4c,
                _0xfb8470 = getConfigValues();
            saveToLocalStorage(_0xfb8470), speakLimit = parseInt(_0xfb8470[_0x24dbcf(0xe8)]), speakBreak = parseInt(_0xfb8470[_0x24dbcf(0x105)]), questions = _0xfb8470['questions'][_0x24dbcf(0xd6)](/^\s+|\s+$/g, '')[_0x24dbcf(0xd6)]('
            ', '
            ')[_0x24dbcf(0xde)]('
            '), questionsQueue = deepCopy(questions), speakNum = _0xfb8470[_0x24dbcf(0xd9)], pushProduct = _0xfb8470[_0x24dbcf(0x107)], pushQuan = _0xfb8470[_0x24dbcf(0xdb)], insertPlaceholder = _0xfb8470[_0x24dbcf(0xf8)], startLoopQuestions();
        }), document['getElementById'](_0x2c0a4c(0xf9))[_0x2c0a4c(0x111)]('click', function() {
            var _0x140a37 = _0x2c0a4c,
                _0x2ca269 = getConfigValues();
            saveToLocalStorage(_0x2ca269), speakNum = _0x2ca269[_0x140a37(0xd9)], pushProduct = _0x2ca269['pushProduct'], pushQuan = _0x2ca269[_0x140a37(0xdb)], startLoopSpeak();
        }), document['getElementById'](_0x2c0a4c(0x10b))[_0x2c0a4c(0x111)](_0x2c0a4c(0xd3), function() {
            var _0x2cd095 = _0x2c0a4c,
                _0x579ea6 = getConfigValues();
            saveToLocalStorage(_0x579ea6), speakLimit = parseInt(_0x579ea6[_0x2cd095(0xe8)]), questions = _0x579ea6[_0x2cd095(0x119)][_0x2cd095(0xd6)](/^\s+|\s+$/g, '')[_0x2cd095(0xd6)]('
            ', '
            ')[_0x2cd095(0xde)]('
            '), questionsQueue = deepCopy(questions), kefuBreak = parseInt(_0x579ea6[_0x2cd095(0x10f)]), feigeHumanWords = _0x579ea6[_0x2cd095(0xe6)], feigeHumanAccount = _0x579ea6[_0x2cd095(0x106)], cozeBotid = _0x579ea6['cozeBotid'], cozeApikey = _0x579ea6[_0x2cd095(0xd2)], gptKey = _0x579ea6[_0x2cd095(0xff)], gptApi = _0x579ea6[_0x2cd095(0x11c)], startDouyinFeige();
        });
        var _0x643166 = document[_0x2c0a4c(0x100)](_0x2c0a4c(0x114));
        _0x643166[_0x2c0a4c(0x111)](_0x2c0a4c(0xd3), function() {
            var _0x3dfe40 = _0x2c0a4c,
                _0x43c5d6 = getConfigValues();
            saveToLocalStorage(_0x43c5d6), timeLimit = parseInt(_0x43c5d6[_0x3dfe40(0x121)]) * 0x3e8, apiBase = _0x43c5d6['apiBase'], hookBase = _0x43c5d6[_0x3dfe40(0xe3)], audioBase = _0x43c5d6['audioBase'], finalReplay = _0x43c5d6['finalReplay'], speakLimit = parseInt(_0x43c5d6[_0x3dfe40(0xe8)]), speakBreak = parseInt(_0x43c5d6[_0x3dfe40(0x105)]), questions = _0x43c5d6[_0x3dfe40(0x119)][_0x3dfe40(0xd6)](/^\s+|\s+$/g, '')[_0x3dfe40(0xd6)]('
            ', '
            ')[_0x3dfe40(0xde)]('
            '), questionsQueue = deepCopy(questions), qaKeywords = _0x43c5d6[_0x3dfe40(0xf6)], douyinNickname = _0x43c5d6['douyinNickname'], blackWords = _0x43c5d6[_0x3dfe40(0x104)], speakNum = _0x43c5d6[_0x3dfe40(0xd9)], pushProduct = _0x43c5d6[_0x3dfe40(0x107)], pushQuan = _0x43c5d6['pushQuan'], replyCommentStatus = _0x43c5d6['replyCommentStatus'], insertPlaceholder = _0x43c5d6[_0x3dfe40(0xf8)], cozeBotid = _0x43c5d6[_0x3dfe40(0xf4)], cozeApikey = _0x43c5d6['cozeApikey'], gptKey = _0x43c5d6[_0x3dfe40(0xff)], gptApi = _0x43c5d6[_0x3dfe40(0x11c)], kefuBreak = parseInt(_0x43c5d6[_0x3dfe40(0x10f)]), feigeHumanWords = _0x43c5d6[_0x3dfe40(0xe6)], feigeHumanAccount = _0x43c5d6['feigeHumanAccount'], layer[_0x3dfe40(0x120)](_0x3dfe40(0x113), {
            'icon': 0x1
        });
    });
}
});
}

function showTestDialog(_0x1034f0) {
    var _0x357ed2 = _0x3b3d7b;
    chrome['runtime'][_0x357ed2(0x10c)]({
        'type': _0x357ed2(0x11b),
        'tabId': _0x1034f0
    });
    let _0x1973c4 = '
        <button type="button" class="layui-btn" id="simpleTestBtn">点击测试</button>
    <button type="button" class="layui-btn" id="scrollPageBtn">滚动测试</button>
    ';
    layer['open']({
        'type': 0x1,
        'area': ['500px', '400px'],
        'title': _0x357ed2(0xe9),
        'shade': ![],
        'shadeClose': ![],
        'maxmin': !![],
        'anim': 0x0,
        'content': _0x1973c4,
        'end': function() {},
        'success': function(_0x1781a8, _0x3f990f, _0x590dee) {
            var _0x23a4dd = _0x357ed2,
                _0x5bd408 = document['getElementById'](_0x23a4dd(0x10d));
            _0x5bd408[_0x23a4dd(0x111)](_0x23a4dd(0xd3), function() {
                for (let _0x5b4016 = 0x5; _0x5b4016 >= 0x1; _0x5b4016--) {
                    (function(_0x25c372) {
                        setTimeout(function() {
                            var _0x1f4620 = _0x5b2a;
                            let _0x1e4a0d = getNode(document[_0x1f4620(0x102)], _0x1f4620(0xe4) + _0x25c372 + ']');
                            simulateClick(_0x1e4a0d);
                        }, _0x25c372 * 0x7d0);
                    }(_0x5b4016));
                }
            });
            var _0x25504a = document[_0x23a4dd(0x100)](_0x23a4dd(0x112));
            _0x25504a['addEventListener']('click', function() {
                function _0x7e45c0() {
                    var _0x30185f = _0x5b2a;
                    window[_0x30185f(0x110)](0x0, window[_0x30185f(0xef)]);
                }
                setInterval(_0x7e45c0, 0x7d0);
            });
        }
    });
}

function loadLocalStorage(_0x19d756) {
    var _0x392af5 = _0x3b3d7b;
    _0x47949c: localStorage['getItem'](_0x392af5(0xe3));
    _0x19d756[_0x392af5(0xe5)](function(_0x4f235e) {
        var _0x11c202 = _0x392af5,
            _0x3e2557 = document[_0x11c202(0x100)](_0x4f235e),
            _0x182d31 = localStorage['getItem'](_0x4f235e);
        _0x182d31 && (_0x3e2557[_0x11c202(0x11e)] = _0x182d31);
    });
    let _0x210e4c = localStorage[_0x392af5(0xf2)](_0x392af5(0xf7));
    document[_0x392af5(0x100)](_0x392af5(0xf7))['checked'] = ![];
    _0x210e4c == _0x392af5(0x101) && (document['getElementById'](_0x392af5(0xf7))[_0x392af5(0x122)] = !![]);
    let _0x369f0d = localStorage[_0x392af5(0xf2)]('insertPlaceholder');
    document['getElementById'](_0x392af5(0xf8))[_0x392af5(0x122)] = ![], _0x369f0d == _0x392af5(0x101) && (document['getElementById'](_0x392af5(0xf8))['checked'] = !![]);
}

function getConfigValues() {
    var _0x29119d = _0x3b3d7b;
    return {
        'apiBase': document[_0x29119d(0x100)]('apiBase')[_0x29119d(0x11e)],
        'hookBase': document[_0x29119d(0x100)](_0x29119d(0xe3))['value'],
        'audioBase': document[_0x29119d(0x100)]('audioBase')[_0x29119d(0x11e)],
        'douyinNickname': document[_0x29119d(0x100)](_0x29119d(0x10e))[_0x29119d(0x11e)],
        'questions': document[_0x29119d(0x100)](_0x29119d(0x119))[_0x29119d(0x11e)],
        'blackWords': document[_0x29119d(0x100)](_0x29119d(0x104))[_0x29119d(0x11e)],
        'timeLimit': document[_0x29119d(0x100)](_0x29119d(0x121))[_0x29119d(0x11e)],
        'speakLimit': document[_0x29119d(0x100)]('speakLimit')[_0x29119d(0x11e)],
        'speakBreak': document[_0x29119d(0x100)](_0x29119d(0x105))['value'],
        'qaKeywords': document[_0x29119d(0x100)]('qaKeywords')[_0x29119d(0x11e)][_0x29119d(0xd6)]('：', ':'),
        'finalReplay': document[_0x29119d(0x100)](_0x29119d(0x11d))[_0x29119d(0x11e)],
        'speakNum': document[_0x29119d(0x100)]('speakNum')[_0x29119d(0x11e)],
        'pushProduct': document['getElementById'](_0x29119d(0x107))[_0x29119d(0x11e)],
        'pushQuan': document[_0x29119d(0x100)]('pushQuan')[_0x29119d(0x11e)],
        'replyCommentStatus': document[_0x29119d(0x100)]('replyCommentStatus')[_0x29119d(0x122)] ? 'yes' : 'no',
        'insertPlaceholder': document[_0x29119d(0x100)](_0x29119d(0xf8))[_0x29119d(0x122)] ? _0x29119d(0x101) : 'no',
        'gptKey': document['getElementById'](_0x29119d(0xff))[_0x29119d(0x11e)],
        'gptApi': document['getElementById'](_0x29119d(0x11c))[_0x29119d(0x11e)],
        'cozeBotid': document[_0x29119d(0x100)]('cozeBotid')[_0x29119d(0x11e)],
        'cozeApikey': document[_0x29119d(0x100)](_0x29119d(0xd2))[_0x29119d(0x11e)],
        'kefuBreak': document[_0x29119d(0x100)](_0x29119d(0x10f))[_0x29119d(0x11e)],
        'feigeHumanWords': document[_0x29119d(0x100)](_0x29119d(0xe6))[_0x29119d(0x11e)],
        'feigeHumanAccount': document[_0x29119d(0x100)](_0x29119d(0x106))[_0x29119d(0x11e)]
    };
}

function saveToLocalStorage(_0x3885be) {
    var _0x535747 = _0x3b3d7b;
    for (var _0x4ab3dd in _0x3885be) {
        _0x3885be['hasOwnProperty'](_0x4ab3dd) && localStorage[_0x535747(0xdf)](_0x4ab3dd, _0x3885be[_0x4ab3dd]);
    }
}