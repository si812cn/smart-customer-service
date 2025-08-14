console.log("唯一客服插件加载成功");
let isStarted = false;//是否运行
let isLoopStarted=false;//循环发送是否运行

var lastInvocationTime = 0;//记录上次的时间
var timeLimit=parseInt(localStorage.getItem("timeLimit"))*1000;//请求接口的时间频率
var apiBase=localStorage.getItem("apiBase");
var hookBase=localStorage.getItem("hookBase");
var audioBase=localStorage.getItem("audioBase");
let sourceQuestion=localStorage.getItem("questions");
var questions=sourceQuestion? sourceQuestion.replace(/^\s+|\s+$/g,'').replace("\r\n","\n").split("\n"):[];//循环话术文案
var questionsQueue=deepCopy(questions);//循环话术队列
var speakLimit=parseInt(localStorage.getItem("speakLimit"));//循环话术频率
var speakBreak=parseInt(localStorage.getItem("speakBreak"));//每轮话术休息
// var waitSendTime=10;//延迟回复
var finalReplay=localStorage.getItem("finalReplay");
var qaKeywords=localStorage.getItem("qaKeywords");
var blackWords=localStorage.getItem("blackWords");
var douyinNickname=localStorage.getItem("douyinNickname");
var speakNum=parseInt(localStorage.getItem("speakNum"));//循环讲解几号产品
var pushProduct=localStorage.getItem("pushProduct");//循环弹品
var pushQuan=localStorage.getItem("pushQuan");//循环弹券
var replyCommentStatus=localStorage.getItem("replyCommentStatus");//是否回复评论
var insertPlaceholder=localStorage.getItem("insertPlaceholder");//是否随机插入表情
var cozeBotid=localStorage.getItem("cozeBotid");//扣子机器人id
var cozeApikey=localStorage.getItem("cozeApikey");//扣子机器人API_KEY
var gptKey=localStorage.getItem("gptKey");
var gptApi=localStorage.getItem("gptApi");
var kefuBreak=parseInt(localStorage.getItem("kefuBreak"));//客服机器人间隔时间
var feigeHumanWords=localStorage.getItem("feigeHumanWords");//飞鸽客服转人工关键词
var feigeHumanAccount=localStorage.getItem("feigeHumanAccount");//飞鸽客服转人工员工账号
//监听页面元素变化
function startListening(){
    console.log("唯一客服插件开始直播监听...");
    if(isStarted){
        layer.msg("正在运行直播监听，请先刷新页面！",{icon:2});
        return;
    }
    layer.msg("唯一客服插件开始直播监听",{icon:1});
    isStarted=true;
    //防止多次重复
    let history={};
    let historyList=[];
    let weidianHistory=[];
    let taobaoHistory=[];
    let preContent="";
    function setupShadowObserver(shadowRoot) {
        const shadowObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                // 处理变动，可以在这里执行你想要的操作
                mutation.addedNodes.forEach(function (addedNode) {
                    var douyinNicknames=douyinNickname.split("#");
                    var blackWordArr=blackWords.split("#");



                    //视频号直播中控后台
                    // console.log(addedNode.outerHTML);
                    // 创建临时容器解析HTML
                    const container = document.createElement('div');
                    container.innerHTML = addedNode.outerHTML;
                    // 获取昵称（第二个span）
                    const nicknameSpan = container.querySelector('.message-username-desc');
                    // 获取内容（第三个span）
                    const contentSpan = container.querySelector('.message-content');
                    if(!nicknameSpan || !contentSpan) return;
                    let nickname=nicknameSpan?.textContent.replace(/:$/, '') || '';
                    let content=contentSpan?.textContent || '';
                    if(!nickname || !content) return;
                    let wujieApp = getNode(document, "//wujie-app");
                    let shadowRoot = wujieApp.shadowRoot;
                    console.log(douyinNicknames,nickname,content,"=================")
                    if(douyinNickname==nickname){
                        // 上墙
                        let replyContent=processQaKeywords(qaKeywords,content);
                        if(replyContent=="上墙"){
                            console.log(addedNode.outerHTML);
                            simulateClick(addedNode.querySelector('.message-content'));
                            // setTimeout(function(){
                            // 	simulateClick(getNode(document,"//div[@class='action-popover__action-item'][contains(text(), '上墙')]"));
                            // },1000)
                            setTimeout(function(){
                                const target = Array.from(
                                    shadowRoot.querySelectorAll('div.action-popover__action-item')
                                ).find(el => el.textContent.trim().includes('上墙'));
                                if (target) {
                                    simulateClick(target);
                                }
                            },2000)
                            return;
                        }
                    }
                    if(nickname.includes(douyinNickname) || containsKeyword(content,blackWordArr)) return;


                    requestBody=nickname+":"+content;
                    showNewMessageBox(requestBody);
                    console.log(requestBody);
                    Hook(nickname,content,'');
                    //自动回复
                    let replyContent=processQaKeywords(qaKeywords,content);
                    if(replyContent=="") replyContent=finalReplay;

                    if(replyContent!=""){
                        if(audioBase!="") sendPlayVoice(replyContent);
                        let textarea = shadowRoot.querySelector("textarea.message-input");
                        if(textarea){
                            replyContent=replyContent.replace("{昵称}",nickname);
                            let replys=splitStringByChunk(replyContent,60);

                            // simulateClick(addedNode.querySelector('.message-content'));
                            // setTimeout(function(){
                            // 	const target = Array.from(
                            // 		shadowRoot.querySelectorAll('div.action-popover__action-item')
                            // 	).find(el => el.textContent.trim().includes('回复'));
                            // 	if (target) {
                            // 		simulateClick(target);
                            // 	}
                            simulateInput(textarea,replys[0]);
                            simulateEnter(textarea);
                            // },1000)

                            // setTimeout(function(){
                            // 	simulateInput(textarea,replys[0]);
                            // 	simulateEnter(textarea);
                            // },1000)
                        }
                    }else{
                        sendAsyncAIQuestion(apiBase, nickname, "", content).then(replyContent => {
                            if(replyContent=="") return;
                            if(audioBase!="") sendPlayVoice(replyContent);
                            replyContent=replyContent.replace("{昵称}",nickname);
                            let textarea = shadowRoot.querySelector("textarea.message-input");
                            if(textarea){
                                let replys=splitStringByChunk(replyContent,60);

                                simulateInput(textarea,replys[0]);
                                simulateEnter(textarea);

                                // setTimeout(function(){
                                // 	simulateInput(textarea,replys[0]);
                                // 	simulateEnter(textarea);
                                // },1000)
                            }
                        }).catch();
                    }
                })
            });
        });

        shadowObserver.observe(shadowRoot, {
            childList: true,      // 监听子元素变化
            subtree: true,        // 监听所有后代元素
            attributes: false,    // 按需启用属性监听
            characterData: false  // 按需启用文本内容监听
        });
    }
    // 初始化时扫描已有 Shadow Host
    document.querySelectorAll('*').forEach(node => {
        if (node.shadowRoot) {
            // console.log("1111111",node);
            setupShadowObserver(node.shadowRoot);
        }
    });
    // 创建 MutationObserver 实例
    var observer = new MutationObserver(function (mutations) {

        mutations.forEach(function (mutation) {


            var douyinNicknames=douyinNickname.split("#");
            var blackWordArr=blackWords.split("#");


            // 58同城微聊
            let fivexpath='../span[contains(@class,"im-last-msg")]';
            let fivenewMessage=getNode(mutation.target,fivexpath);
            if(fivenewMessage){
                simulateClick(fivenewMessage);
                setTimeout(function(){
                    let lastMessage=getNode(document.body,"//li[contains(@class, 'im-session-active')]");
                    let nickname=getTextNodeContent(lastMessage,".//span[contains(@class,'im-session-username')]");
                    let content=getTextNodeContent(lastMessage,".//span[contains(@class,'im-last-msg')]");
                    let nickMessage=nickname+":"+content;
                    if(preContent!=nickMessage){
                        preContent=nickMessage;
                        console.log("58同城微聊-",nickMessage);
                        showNewMessageBox(nickMessage);
                        //自动回复
                        let replyContent=processQaKeywords(qaKeywords,content);
                        if(replyContent=="") replyContent=finalReplay;
                        if(replyContent!=""){
                            preContent=nickname+":"+replyContent
                            let fiveinput=getNode(document.body,"//div[@class='im-chatwindow']//div[@class='im-input-richtext']");
                            simulateInput2(fiveinput,replyContent);
                            simulateClick(getNode(document.body,"//div[@class='im-chatwindow']//div[@class='im-send']"));
                        }else{
                            sendAIQuestion(nickname,"",content,function(replyContent){
                                if(replyContent=="") return;
                                preContent=nickname+":"+replyContent
                                let fiveinput=getNode(document.body,"//div[@class='im-chatwindow']//div[@class='im-input-richtext']");
                                simulateInput2(fiveinput,replyContent);
                                simulateClick(getNode(document.body,"//div[@class='im-chatwindow']//div[@class='im-send']"));
                            })
                        }
                    }
                },1000)
            }


            //抖音网页直播间
            // console.log(mutation.target.outerHTML);
            let douyinGift=getNode(mutation.target,'./div[@style[contains(., "background-image")]]');
            if(douyinGift){
                let giftInfo=mutation.target.textContent;
                if(!historyList.includes(giftInfo)){
                    historyList.push(giftInfo);
                    console.log(giftInfo);
                    showNewMessageBox(giftInfo);
                    //hook 消息
                    Hook(giftInfo,giftInfo,mutation.target.outerHTML);
                    //判断关键词回复话术
                    let replyContent=searchKeywordReplys(qaKeywords,giftInfo);
                    if(replyContent=="") replyContent=finalReplay;
                    if(replyContent){
                        //判断频率
                        if(timeLimit && !isWithinTimeLimit(lastInvocationTime,timeLimit)) return;
                        async function delay() {
                            console.log("等待：",speakBreak);
                            if(speakBreak) await sleep(1000*speakBreak);
                            replyContent=replyContent.replace("{昵称}",nickname);
                            console.log("关键词回复命中回复----",replyContent);
                            sendReplyContent(replyContent);
                            lastInvocationTime = Date.now();
                        }
                        delay();
                        return;
                    }
                    //判断频率
                    if(timeLimit && !isWithinTimeLimit(lastInvocationTime,timeLimit)) return;
                    //判断AI
                    lastInvocationTime = Date.now();
                    sendAsyncAIQuestion(apiBase, nickname, "", giftInfo).then(replyContent => {
                        if (replyContent && replyContent != "") {
                            console.log("AI回复" + nickname + ":" + replyContent);
                            replyContent=replyContent.replace("{昵称}",nickname);
                            sendReplyContent(replyContent);
                        }
                    }).catch();
                }
                preContent=giftInfo;
            }
            let douyin=getNode(mutation.target,'./div[contains(@class,"webcast-chatroom___item-wrapper")]');
            if(douyin){
                // console.log(mutation.target.outerHTML);
                // return;
                var nickname;
                var commentInfo;
                //获取昵称
                nickname=getTextNodeContent(douyin,"./div/span[2]")
                //获取内容
                commentInfo=getTextNodeContent(douyin,"./div/span[3]")
                //判断
                if(!nickname || !commentInfo) return;
                // simulateClick(getNode(addedNode,'./div/span[2]'));
                let sourceHtml=getHtmlNodeContent(douyin,"./div/span[3]");
                let gift=detectGift(sourceHtml)
                if(gift!="") commentInfo+=" "+gift


                //判断黑名单
                if(douyinNicknames.includes(nickname) || containsKeyword(commentInfo,blackWordArr)) return;
                requestBody=nickname+":"+commentInfo;
                if(!historyList.includes(requestBody)){
                    historyList.push(requestBody);
                    showNewMessageBox(requestBody);
                    console.log(requestBody);
                    //hook 消息
                    Hook(nickname,commentInfo,getHtmlNodeContent(douyin,"./div/span[3]"));

                    //判断关键词回复话术
                    let replyContent=searchKeywordReplys(qaKeywords,commentInfo);
                    if(replyContent=="") replyContent=finalReplay;
                    if(replyContent){
                        //判断频率
                        if(timeLimit && !isWithinTimeLimit(lastInvocationTime,timeLimit)) return;
                        async function delay() {
                            console.log("等待：",speakBreak);
                            await sleep(1000*speakBreak);
                            replyContent=replyContent.replace("{昵称}",nickname);
                            replyContent=replyContent.replace("{评论}",commentInfo);
                            console.log("关键词回复命中回复----",replyContent);
                            sendReplyContent(replyContent);
                            lastInvocationTime = Date.now();
                        }
                        delay();
                        return;
                    }
                    //判断频率
                    if(timeLimit && !isWithinTimeLimit(lastInvocationTime,timeLimit)) return;
                    //判断AI
                    lastInvocationTime = Date.now();
                    sendAsyncAIQuestion(apiBase, nickname, "", commentInfo).then(replyContent => {
                        if (replyContent && replyContent != "") {
                            console.log("AI回复" + nickname + ":" + replyContent);
                            replyContent=replyContent.replace("{昵称}",nickname);
                            replyContent=replyContent.replace("{评论}",commentInfo);
                            sendReplyContent(replyContent);
                        }
                    }).catch();
                }
                if(historyList.length>200){
                    historyList.shift();
                }
                return;
            }




            // 处理变动，可以在这里执行你想要的操作
            mutation.addedNodes.forEach(function (addedNode) {

                // console.log(addedNode.outerHTML);



                //百度优选直播端
                // console.log(addedNode);
                //let baiduyouxuan=getNode(addedNode,'//div[@class="im-item"]');
                let baiduyouxuan=getNode(addedNode,'//div[@class="style_dialog-box__pYcgn"]');
                if(baiduyouxuan){
                    let nickname=getTextNodeContent(addedNode,'.//span[@class="style_name__818Sx"]');
                    let content=getTextNodeContent(addedNode,'.//span[@class="style_msg__p0O46"]');
                    let requestBody=nickname+":"+content;
                    if(!nickname || !content) return;
                    if(douyinNicknames.includes(nickname) || containsKeyword(content,blackWordArr)) return;

                    showNewMessageBox(requestBody);
                    console.log(requestBody);
                    Hook(nickname, content, '');
                    //自动回复
                    let replyContent = searchKeywordReplys(qaKeywords, content);
                    if (replyContent == "") replyContent = finalReplay;
                    if (replyContent != "") {
                        replyContent = replyContent.replace("{昵称}", nickname);
                        console.log("关键词回复" + nickname + ":" + replyContent);
                        let textarea = getNode(document, '//input[@id="input"]');
                        // console.log(textarea,replyContent)
                        simulateInput(textarea, replyContent);
                        setTimeout(function(){
                            simulateInput(textarea, replyContent);
                            simulateClick(getNode(document,'//div[text()="发送"]'))
                        },2000)
                    } else {
                        async function delayLog() {
                            await sendAsyncAIQuestion(apiBase, nickname, "", content).then(replyContent => {
                                if (replyContent && replyContent != "") {
                                    replyContent = replyContent.replace("{昵称}", nickname);
                                    console.log("AI回复" + nickname + ":" + replyContent);
                                    let textarea = getNode(document, '//input[@id="input"]');
                                    simulateInput(textarea, replyContent);
                                    setTimeout(function(){
                                        simulateInput(textarea, replyContent);
                                        simulateClick(getNode(document,'//div[text()="发送"]'))
                                    },2000)
                                }
                            }).catch();
                        }

                        delayLog()
                    }
                }

                //B站直播页面
                // console.log(addedNode.innerHTML);
                // let bili=getNode(addedNode,'//div[@id="chat-items"]/div[last()]');
                let bili=getNode(addedNode,'//div[@data-uname!=""]');
                if(addedNode && bili){
                    let nickname=getNodeAttr(addedNode,'',"data-uname");
                    if(!nickname) return;

                    // console.log("xxxxxxxxxx",addedNode,Object.prototype.toString.call(addedNode),nickname,"zzzzzz");
                    let content=getNodeAttr(addedNode,'',"data-danmaku");

                    let medal=getTextNodeContent(addedNode,'.//div[@class="fans-medal-item"]');
                    let oldnickname=nickname;
                    if(medal){
                        medal=medal.replace(/\n/g, '').replace(/\s/g, '');
                        nickname="["+medal+"]"+nickname;
                    }

                    if(!content){
                        content=getTextNodeContent(addedNode,'');
                        content=content.replace(/\n/g, '').replace(/\s/g, '');
                        content=content.replace(oldnickname, '').replace(medal,'');
                    }
                    if(douyinNickname.includes(nickname) || containsKeyword(content,blackWordArr)) return;
                    let requestBody=nickname+":"+content;
                    if(preContent!=requestBody){
                        showNewMessageBox(requestBody);
                        console.log(requestBody);
                        Hook(nickname,content,'');
                        //自动回复
                        let replyContent=searchKeywordReplys(qaKeywords,content);
                        if(replyContent=="") replyContent=finalReplay;
                        if(replyContent!=""){
                            replyContent=replyContent.replace("{昵称}",oldnickname);
                            console.log("关键词回复" + oldnickname + ":" + replyContent);
                            let textarea=getNode(document,'//textarea[@placeholder="发个弹幕呗~"]');
                            simulateInput(textarea,replyContent);
                            simulateEnter(textarea)
                        }else{
                            async function delayLog(){
                                await sendAsyncAIQuestion(apiBase, oldnickname, "", content).then(replyContent => {
                                    if (replyContent && replyContent != "") {
                                        replyContent=replyContent.replace("{昵称}",oldnickname);
                                        console.log("AI回复" + oldnickname + ":" + replyContent);
                                        let textarea=getNode(document,'//textarea[@placeholder="发个弹幕呗~"]');
                                        simulateInput(textarea,replyContent);
                                        simulateEnter(textarea)
                                    }
                                }).catch();
                            }
                            delayLog()
                        }
                    }
                    preContent=requestBody;
                }


                //淘宝直播中控台
                // console.log(addedNode);
                let taobaoZhongkong=getNode(addedNode,'//div[@class="tc-comment-item"]');
                if(taobaoZhongkong){
                    // console.log(addedNode);
                    let flyNickname=getTextNodeContent(addedNode,'.//div[@class="tc-comment-item-userinfo-name"]');
                    let flyContent=getTextNodeContent(addedNode,'.//div[@class="tc-comment-item-content"]/span');
                    if(!flyNickname || !flyContent) return;
                    if(!taobaoHistory.includes(flyNickname+":"+flyContent) && !douyinNickname.includes(flyNickname) && !containsKeyword(flyContent,blackWordArr)){
                        taobaoHistory.push(flyNickname+":"+flyContent);
                        console.log(flyNickname+":"+flyContent);
                        showNewMessageBox(flyNickname+":"+flyContent);
                        Hook(flyNickname,flyContent,'');
                        //自动回复
                        let replyContent=searchKeywordReplys(qaKeywords,flyContent);
                        if(replyContent=="") replyContent=finalReplay;
                        if(replyContent!=""){
                            if(audioBase!="") sendPlayVoice(replyContent);
                            replyContent=replyContent.replace("{评论}",flyContent);
                            console.log("关键词回复" + flyNickname + ":" + replyContent);
                            // setTimeout(function(addedNode,replyContent){
                            simulateClick(getNode(addedNode,'.//div[last()]//div[@class="tbla-space-item"][3]/div/div'));
                            tabaoTextArea=getNode(document.body,'//textarea[@placeholder="回复观众或直接enter发评论，输入/可快捷回复"]');
                            simulateInput(tabaoTextArea,replyContent);
                            simulateEnter(tabaoTextArea)
                            // }(addedNode,replyContent),3000);
                        }else{
                            async function delayLog(){
                                await sendAsyncAIQuestion(apiBase, flyNickname, "", flyContent).then(replyContent => {
                                    if (replyContent && replyContent != "") {
                                        console.log("AI回复" + flyNickname + ":" + replyContent);
                                        simulateClick(getNode(addedNode,'//div[@class="tc-comment-item"][last()]//div[@class="tbla-space-item"][3]/div/div'));
                                        tabaoTextArea=getNode(document.body,'//textarea[@placeholder="回复观众或直接enter发评论，输入/可快捷回复"]');
                                        simulateInput(tabaoTextArea,replyContent);
                                        simulateEnter(tabaoTextArea)
                                    }
                                }).catch();
                            }
                            delayLog()

                        }
                    }
                    if(taobaoHistory.length>200){
                        taobaoHistory.pop();
                    }
                }

                //tiktok直播页面
                // console.log(addedNode);
                let tiktok=getNode(addedNode,'//div[@data-e2e="chat-message"]') || getNode(addedNode,'//div[@data-e2e="social-message"]');
                if(tiktok){
                    // console.log(addedNode);
                    let nickname=getTextNodeContent(addedNode,'.//span[@data-e2e="message-owner-name"]');
                    let content=getTextNodeContent(addedNode,'./div[2]/div[2]') || getTextNodeContent(addedNode,'.//div[@data-e2e="social-message-text"]');
                    if(!nickname) return;
                    if(!content) content="已加入";
                    //判断黑名单
                    if(douyinNicknames.includes(nickname) || containsKeyword(content,blackWordArr)) return;
                    Hook(nickname,content,"");
                    requestBody=nickname+":"+content;
                    showNewMessageBox(requestBody);
                    console.log(requestBody);
                    //自动回复
                    let replyContent=processQaKeywords(qaKeywords,content);
                    if(replyContent=="") replyContent=finalReplay;
                    if(replyContent!=""){
                        //判断频率
                        if(timeLimit && !isWithinTimeLimit(lastInvocationTime,timeLimit)) return;
                        console.log("回复" + nickname + ":" + replyContent);
                        if(audioBase!="") sendPlayVoice(replyContent);
                        var textarea=getNode(document,'//div[@contenteditable="plaintext-only"]');
                        if(textarea){
                            let replys=splitStringByChunk(replyContent,60);
                            setTimeout(function(){
                                simulateInput3(textarea,replys[0]);
                                simulateClick2(getNode(document,'//div[@contenteditable="plaintext-only"]/../../../../div[2]'));
                            },1000)
                        }
                    }else{
                        // sendAIQuestion(nickname,"",content,function(replyContent){
                        // 	if(replyContent=="") return;
                        // 	if(audioBase!="") sendPlayVoice(replyContent);
                        // 	var textarea=getNode(document,'//div[@contenteditable="plaintext-only"]');
                        // 	if(textarea){
                        // 		let replys=splitStringByChunk(replyContent,60);
                        // 		setTimeout(function(){
                        // 				simulateInput3(textarea,replys[0]);
                        // 				simulateEnter(textarea);
                        // 		},1000)
                        // 	}
                        // })
                        async function delayLog(){
                            await sendAsyncAIQuestion(apiBase, nickname, "", content).then(replyContent => {
                                //判断频率
                                if(timeLimit && !isWithinTimeLimit(lastInvocationTime,timeLimit)) return;
                                if(!replyContent || replyContent=="") return;
                                console.log("AI回复" + nickname + ":" + replyContent);
                                if(audioBase!="") sendPlayVoice(replyContent);
                                var textarea=getNode(document,'//div[@contenteditable="plaintext-only"]');
                                if(textarea){
                                    let replys=splitStringByChunk(replyContent,60);
                                    setTimeout(function(){
                                        simulateInput3(textarea,replys[0]);
                                        simulateClick2(getNode(document,'//div[@contenteditable="plaintext-only"]/../../../../div[2]'));
                                    },1000)
                                }
                            }).catch();
                        }
                        delayLog()
                    }
                    return;
                }

                //小红书直播中控后台
                // console.log(addedNode);
                let xiaohongshu=getNode(addedNode,'//div[@class="comment-list-item"]');
                if(xiaohongshu){
                    let nickname=getTextNodeContent(addedNode,'./span[1]');
                    let content=getTextNodeContent(addedNode,'./span[2]');

                    if(!nickname || nickname=="主播" || !content) return;
                    //判断黑名单
                    if(douyinNicknames.includes(nickname) || containsKeyword(content,blackWordArr)) return;
                    requestBody=nickname+":"+content;
                    Hook(nickname,content,"");
                    showNewMessageBox(requestBody);
                    console.log(requestBody);
                    //自动回复
                    let replyContent=processQaKeywords(qaKeywords,content);
                    if(replyContent=="") replyContent=finalReplay;
                    if(replyContent!=""){
                        var textarea=getNode(document,'//textarea[contains(@class,"d-text")]');
                        if(textarea){
                            let replys=splitStringByChunk(replyContent,60);
                            setTimeout(function(){
                                replyContent=replys[0].replace("{nickname}",nickname);
                                simulateInput(textarea,replyContent);
                                setTimeout(function(){
                                    simulateClick(getNode(document,'//span[text()="发送"]'));
                                },1000);
                            },1000)
                        }
                    }else{
                        sendAIQuestion(nickname,"",content,function(replyContent){
                            if(replyContent=="") return;
                            var textarea=getNode(document,'//textarea[contains(@class,"d-text")]');
                            if(textarea){
                                let replys=splitStringByChunk(replyContent,60);
                                setTimeout(function(){
                                    replyContent=replys[0].replace("{nickname}",nickname);
                                    simulateInput(textarea,replyContent);
                                    setTimeout(function(){
                                        simulateClick(getNode(document,'//span[text()="发送"]'));
                                    },1000);
                                },1000)
                            }
                        })
                    }
                    return;
                }
                //抖音巨量百应后台
                // console.log(addedNode);
                let juliang=getNode(addedNode,'//div[contains(@class,"commentItem")]');
                if(juliang){
                    let nickname=getTextNodeContent(addedNode,'.//div[contains(@class,"nickname")]');
                    let content=getTextNodeContent(addedNode,'.//div[contains(@class,"description")]');

                    if(!nickname || !content) return;
                    //判断黑名单
                    if(douyinNicknames.includes(nickname) || containsKeyword(content,blackWordArr)) return;
                    nickname=nickname.replace("问询","").replace("粉丝","");
                    requestBody=nickname+":"+content;
                    if(!historyList.includes(requestBody)){
                        historyList.push(requestBody);
                        showNewMessageBox(requestBody);
                        console.log(requestBody);
                        Hook(nickname,content,getHtmlNodeContent(addedNode,'.//div[contains(@class,"description")]'));
                        //自动回复
                        let replyContent=searchKeywordReplys(qaKeywords,content);
                        if(replyContent=="") replyContent=finalReplay;
                        if(replyContent!=""){
                            replyContent=replyContent.replace("{昵称}",nickname);
                            var textarea=getNode(document,'//textarea[contains(@class,"auxo-input-borderless")]');
                            if(textarea){
                                let replys=splitStringByChunk(replyContent,50);
                                setTimeout(function(){
                                    replyContent=replys[0].replace("{nickname}",nickname);
                                    simulateInput(textarea,replyContent);
                                    simulateEnter(textarea);
                                    // simulateClick(getNode(document,'//div[contains(@class,"sendBtn")]'));
                                },1000)
                            }
                        }else{
                            async function delayLog(){
                                await sendAsyncAIQuestion(apiBase, nickname, "", content).then(replyContent => {
                                    if (replyContent && replyContent != "") {
                                        console.log("回复" + nickname + ":" + replyContent);
                                        let replys=splitStringByChunk(replyContent,50);
                                        setTimeout(function(){
                                            var textarea=getNode(document,'//textarea[contains(@class,"auxo-input-borderless")]');
                                            replyContent=replys[0].replace("{nickname}",nickname);
                                            simulateInput(textarea,replyContent);
                                            simulateEnter(textarea);
                                            // simulateClick(getNode(document,'//div[contains(@class,"sendBtn")]'));
                                        },1000)
                                    }
                                }).catch();
                            }
                            delayLog()
                            // replyContent=replyContent.replace("{昵称}",nickname);
                            // sendAIQuestion(nickname,"",content,function(replyContent){
                            // 	if(replyContent=="") return;
                            // 	var textarea=getNode(document,'//textarea[contains(@class,"auxo-input-borderless")]');
                            // 	if(textarea){
                            // 		let replys=splitStringByChunk(replyContent,50);
                            // 		setTimeout(function(){
                            // 				replyContent=replys[0].replace("{nickname}",nickname);
                            // 				simulateInput(textarea,replyContent);
                            // 				simulateEnter(textarea);
                            // 				// simulateClick(getNode(document,'//div[contains(@class,"sendBtn")]'));
                            // 		},1000)
                            // 	}
                            // })
                        }
                    }
                    if(historyList.length>200){
                        historyList.pop();
                    }
                    return;
                }

                //抖音直播主播版后台
                // console.log(addedNode);
                // let douyinZhubo=getNode(addedNode,'//div[@elementtiming="element-timing"]');
                // if(douyinZhubo){
                // 	let nickname=getTextNodeContent(addedNode,'.//span[contains(@class,"chatItemNickName")]');
                // 	let content=getTextNodeContent(addedNode,'.//span[contains(@class,"chatItemDesc")]');
                // 	if(!nickname || !content) return;
                // 	//判断黑名单
                // 	if(douyinNicknames.includes(nickname) || containsKeyword(content,blackWordArr)) return;
                // 	requestBody=nickname+":"+content;
                // 	if(!historyList.includes(requestBody)){
                // 		historyList.push(requestBody);
                // 		showNewMessageBox(requestBody);
                // 		console.log(requestBody);
                // 		//自动回复
                // 		let replyContent=searchKeywordReplys(qaKeywords,content);
                // 		if(replyContent=="") replyContent=finalReplay;
                // 		if(replyContent!=""){
                // 			replyContent=replyContent.replace("{昵称}",nickname);
                // 			var textarea=getNode(document,'//input[contains(@class,"sendInput")]');
                // 			if(textarea){
                // 				let replys=splitStringByChunk(replyContent,60);
                // 				setTimeout(function(){
                // 						replyContent=replys[0].replace("{nickname}",nickname);
                // 						simulateInput(textarea,replyContent);
                // 						simulateClick(getNode(document,'//div[contains(@class,"sendBtn")]'));
                // 				},1000)
                // 			}
                // 		}else{
                // 			replyContent=replyContent.replace("{昵称}",nickname);
                // 			sendAIQuestion(nickname,"",content,function(replyContent){
                // 				if(replyContent=="") return;
                // 				var textarea=getNode(document,'//input[contains(@class,"sendInput")]');
                // 				if(textarea){
                // 					let replys=splitStringByChunk(replyContent,60);
                // 					setTimeout(function(){
                // 							replyContent=replys[0].replace("{nickname}",nickname);
                // 							simulateInput(textarea,replyContent);
                // 							simulateClick(getNode(document,'//div[contains(@class,"sendBtn")]'));
                // 					},1000)
                // 				}
                // 			})
                // 		}
                // 	}
                // 	if(historyList.length>200){
                // 		historyList.pop();
                // 	}
                // 	return;
                // }

                //视频号直播中控后台
                //console.log(addedNode.outerHTML);
                let shipinhao=getNode(addedNode,'//div[contains(@class,"vue-recycle-scroller__item-view")]');
                if(shipinhao){
                    let nickname=getTextNodeContent(addedNode,'.//span[contains(@class,"message-username-desc")]');
                    let content=getTextNodeContent(addedNode,'.//span[contains(@class,"message-content")]');
                    if(!nickname || !content) return;
                    // 上墙


                    //判断黑名单
                    if(nickname.includes(douyinNicknames) || containsKeyword(content,blackWordArr)) return;
                    requestBody=nickname+":"+content;
                    showNewMessageBox(requestBody);
                    console.log(requestBody);
                    Hook(nickname,content,getHtmlNodeContent(addedNode,'.//span[contains(@class,"message-content")]'));
                    //自动回复
                    let replyContent=processQaKeywords(qaKeywords,content);
                    if(replyContent=="上墙"){
                        simulateClick(getNode(addedNode,'.//span[contains(@class,"message-content")]'));
                        setTimeout(function(){
                            simulateClick(getNode(document,"//div[@class='action-popover__action-item'][contains(text(), '上墙')]"));
                        },1000)
                        return;
                    }
                    if(replyContent=="") replyContent=finalReplay;
                    if(replyContent!=""){
                        if(audioBase!="") sendPlayVoice(replyContent);
                        //判断频率
                        if(timeLimit && !isWithinTimeLimit(lastInvocationTime,timeLimit)) return;
                        var textarea=getNode(document,'//textarea[@class="message-input"]');
                        if(textarea){
                            replyContent=replyContent.replace("{昵称}",nickname);
                            let replys=splitStringByChunk(replyContent,60);
                            simulateClick(getNode(addedNode,'.//span[contains(@class,"message-content")]'));
                            setTimeout(function(){
                                simulateClick(getNode(document,"//div[text()=' 回复 ']"));
                                simulateInput(textarea,replys[0]);
                                simulateEnter(textarea);
                            },1000)

                            lastInvocationTime = Date.now();
                        }
                    }else{
                        sendAIQuestion(nickname,"",content,function(replyContent){
                            if(replyContent=="") return;
                            if(audioBase!="") sendPlayVoice(replyContent);
                            if(timeLimit && !isWithinTimeLimit(lastInvocationTime,timeLimit)) return;
                            var textarea=getNode(document,'//textarea[@class="message-input"]');
                            if(textarea){
                                let replys=splitStringByChunk(replyContent,60);
                                simulateClick(getNode(addedNode,'.//span[contains(@class,"message-content")]'));
                                setTimeout(function(){
                                    simulateClick(getNode(document,"//div[text()=' 回复 ']"));
                                    simulateInput(textarea,replys[0]);
                                    simulateEnter(textarea);
                                },1000)
                                lastInvocationTime = Date.now();

                            }
                        })
                    }
                    return;
                }

                //支付宝直播中控后台
                // console.log(addedNode);
                let alipayCome=getNode(addedNode,'//div[contains(@class,"roomEvents")]');
                if(alipayCome){
                    let nickname=getTextNodeContent(addedNode,'.//span[contains(@class,"roomUserStyle")]');
                    let content=getTextNodeContent(addedNode,'.//div[contains(@class,"eventItem")]');
                    if(!content) return;
                    requestBody=content;
                    showNewMessageBox(requestBody);
                    console.log(requestBody);
                    //自动回复
                    let replyContent=processQaKeywords(qaKeywords,content);
                    if(replyContent=="") replyContent=finalReplay;
                    if(replyContent!=""){
                        setTimeout(function(){
                            var textarea=getNode(document,'//textarea[@id="content"]');
                            if(textarea){
                                replyContent=replyContent.replace("{nickname}",nickname);
                                simulateInput(textarea,replyContent);
                                simulateEnter(textarea);
                            }
                        },1000)

                    }
                    return;
                }

                let alipay=getNode(addedNode,'//div[contains(@class,"cmtItem")]');
                if(alipay){
                    let nickname=getTextNodeContent(addedNode,'.//span[contains(@class,"userName")]');
                    let content=getTextNodeContent(addedNode,'.//span[contains(@class,"cmtContent")]');
                    if(!nickname || !content) return;
                    //判断黑名单
                    if(douyinNicknames.includes(nickname) || containsKeyword(content,blackWordArr)) return;
                    requestBody=nickname+":"+content;
                    showNewMessageBox(requestBody);
                    console.log(requestBody);
                    //自动回复
                    let replyContent=processQaKeywords(qaKeywords,content);
                    if(replyContent=="") replyContent=finalReplay;
                    if(replyContent!=""){
                        setTimeout(function(){
                            var textarea=getNode(document,'//textarea[@id="content"]');
                            if(textarea){
                                simulateInput(textarea,replyContent);
                                simulateEnter(textarea);
                            }
                        },1000)

                    }else{
                        setTimeout(function(){
                            sendAIQuestion(nickname,"",content,function(replyContent){
                                if(replyContent=="") return;
                                var textarea=getNode(document,'//textarea[@id="content"]');
                                if(textarea){
                                    simulateInput(textarea,replyContent);
                                    simulateEnter(textarea);
                                }
                            })
                        },1000)
                    }
                    return;
                }


                //淘宝直播间
                let taobao=getNode(addedNode,'//div[contains(@class,"itemWrap")]');
                if(taobao){
                    let nickname=getTextNodeContent(addedNode,'.//span[contains(@class,"author")]');
                    let content=getTextNodeContent(addedNode,'.//span[contains(@class,"content")]');
                    if(!nickname || !content) return;
                    //判断黑名单
                    if(douyinNicknames.includes(nickname) || containsKeyword(content,blackWordArr)) return;
                    requestBody=nickname+":"+content;
                    showNewMessageBox(requestBody);
                    console.log(requestBody);
                    Hook(nickname,content,getHtmlNodeContent(addedNode,'.//span[contains(@class,"content")]'));
                    //自动回复
                    let replyContent=processQaKeywords(qaKeywords,content);
                    if(replyContent=="") replyContent=finalReplay;
                    if(replyContent!=""){
                        if(audioBase!=""){
                            sendPlayVoice(replyContent);return;
                        }
                        replyContent=replyContent.replace("{昵称}",nickname);
                        replyContent=replyContent.replace("{评论}",content);
                        var textarea=getNode(document,'//*[contains(@class,"chatInputCenterTextarea-")]');
                        if(textarea){
                            let replys=splitStringByChunk(replyContent,50);
                            simulateInput(textarea,replys[0]);
                            setTimeout(function(){
                                simulateEnter(textarea);
                            },2000)
                        }
                    }else{
                        sendAIQuestion(nickname,"",content,function(replyContent){
                            if(replyContent=="") return;
                            if(audioBase!=""){
                                sendPlayVoice(replyContent);return;
                            }
                            var textarea=getNode(document,'//*[contains@(class,"chatInputCenterTextarea-")]');
                            if(textarea){
                                let replys=splitStringByChunk(replyContent,50);
                                simulateInput(textarea,replys[0]);
                                setTimeout(function(){
                                    simulateEnter(textarea);
                                },2000)
                            }
                        })
                    }
                    return;
                }


                //快手网页版
                // console.log(addedNode.outerHTML);
                let kuaishouGift=getNode(addedNode,'//div[contains(@class,"gift-slot-item")]');
                if(kuaishouGift){
                    let content=kuaishouGift.textContent.trim();
                    if(!content) return;
                    if(preContent!=content){
                        preContent=content;
                        console.log(content);
                        showNewMessageBox(content);
                        Hook("",content,kuaishouGift.outerHTML);
                        //自动回复
                        let replyContent=searchKeywordReplys(qaKeywords,content);
                        if(replyContent=="") replyContent=finalReplay;
                        if(replyContent!=""){
                            var textarea=getNode(document,'//textarea[@placeholder="说点什么吧..."]');
                            console.log("回复" +":" + replyContent);
                            if(textarea){
                                simulateInput(textarea,replyContent);
                                simulateClick2(getNode(document.body,"//div[contains(@class,'submit-button')]"));
                            }
                        }else{
                            sendAIQuestion(nickname,"",content,function(replyContent){
                                if(replyContent=="") return;
                                console.log("回复" + ":" + replyContent);
                                var textarea=getNode(document,'//textarea[@placeholder="说点什么吧..."]');
                                if(textarea){
                                    simulateInput(textarea,replyContent);
                                    simulateClick2(getNode(document.body,"//div[contains(@class,'submit-button')]"));
                                }
                            })
                        }
                    }
                }
                let kuaishouWeb=getNode(addedNode,'//div[contains(@class,"comment-cell")]');
                if(kuaishouWeb){
                    let nickname=getTextNodeContent(addedNode,'.//span[contains(@class,"username")]');
                    let content=getTextNodeContent(addedNode,'.//span[contains(@class,"comment")]');
                    if(!nickname ||!content||content=="送") return;
                    //判断黑名单
                    if(douyinNicknames.includes(nickname) || containsKeyword(content,blackWordArr)) return;
                    requestBody=nickname+":"+content;
                    showNewMessageBox(requestBody);
                    console.log(requestBody);
                    Hook(nickname,content,getHtmlNodeContent(addedNode,'.//span[contains(@class,"comment")]'));
                    //自动回复
                    let replyContent=searchKeywordReplys(qaKeywords,content);
                    if(replyContent=="") replyContent=finalReplay;
                    if(replyContent!=""){
                        var textarea=getNode(document,'//textarea[@placeholder="说点什么吧..."]');
                        console.log("回复" + nickname + ":" + replyContent);
                        if(textarea){
                            simulateInput(textarea,replyContent);
                            simulateClick2(getNode(document.body,"//div[contains(@class,'submit-button')]"));
                        }
                    }else{
                        sendAIQuestion(nickname,"",content,function(replyContent){
                            if(replyContent=="") return;
                            console.log("回复" + nickname + ":" + replyContent);
                            var textarea=getNode(document,'//textarea[@placeholder="说点什么吧..."]');
                            if(textarea){
                                simulateInput(textarea,replyContent);
                                simulateClick2(getNode(document.body,"//div[contains(@class,'submit-button')]"));
                            }
                        })
                    }
                }

                //快手
                let kuaishou=getNode(addedNode,'//img[contains(@class,"icon-extend")]');
                if(kuaishou){
                    console.log("快手----");
                    let nickname=getTextNodeContent(document.body,'//div[@class="ReactVirtualized__Grid__innerScrollContainer"]/div[last()]//span[contains(@class,"username")]');
                    let content=getTextNodeContent(document.body,'//div[@class="ReactVirtualized__Grid__innerScrollContainer"]/div[last()]//span[contains(@class,"replied-content")]');
                    if(!nickname || !content) return;
                    nickname=nickname.replace(":","");
                    //判断黑名单
                    if(douyinNicknames.includes(nickname) || containsKeyword(content,blackWordArr)) return;
                    requestBody=nickname+":"+content;
                    showNewMessageBox(requestBody);
                    console.log(requestBody);
                    Hook(nickname,content,getHtmlNodeContent(document.body,'//div[@class="ReactVirtualized__Grid__innerScrollContainer"]/div[last()]//span[contains(@class,"replied-content")]'));
                    //自动回复
                    let replyContent=processQaKeywords(qaKeywords,content);
                    if(replyContent=="") replyContent=finalReplay;
                    if(replyContent!=""){
                        if(audioBase!=""){
                            sendPlayVoice(replyContent);return;
                        }
                        var textarea=getNode(document,'//input[@placeholder="一键回复观众或直接发评论"]');
                        if(textarea){
                            let replys=splitStringByChunk(replyContent,40);
                            for(let item in replys){
                                setTimeout(function(){
                                    simulateInput(textarea,replys[item]);
                                    simulateClick(getNode(document,"//span[text()='发送']"));
                                },item*1000);
                            }

                        }
                    }else{
                        sendAIQuestion(nickname,"",content,function(replyContent){
                            if(replyContent=="") return;
                            if(audioBase!=""){
                                sendPlayVoice(replyContent);return;
                            }
                            var textarea=getNode(document,'//input[@placeholder="一键回复观众或直接发评论"]');
                            if(textarea){
                                let replys=splitStringByChunk(replyContent,40);
                                for(let item in replys){
                                    setTimeout(function(){
                                        simulateInput(textarea,replys[item]);
                                        simulateClick(getNode(document,"//span[text()='发送']"));
                                    },item*1000);
                                }
                            }
                        })
                    }
                    return;
                }

                //抖音本地直播专业版
                // console.log(addedNode.innerHTML);

                let douyinBendizhibo=getNode(addedNode,'.//div[contains(@class,"item-")]');
                if(douyinBendizhibo){
                    let nickname=getTextNodeContent(addedNode,'.//div[contains(@class,"item-name-")]');
                    let content=getTextNodeContent(addedNode,'.//div[contains(@class,"item-content-")]');
                    if(!nickname || !content) return;
                    nickname=nickname.replace(":","");
                    //判断黑名单
                    if(douyinNicknames.includes(nickname) || containsKeyword(content,blackWordArr)) return;
                    requestBody=nickname+":"+content;
                    showNewMessageBox(requestBody);
                    console.log(requestBody);
                    //自动回复
                    let replyContent=processQaKeywords(qaKeywords,content);
                    if(replyContent=="") replyContent=finalReplay;
                    if(replyContent!=""){
                        replyContent=replyContent.replace("{昵称}",nickname);
                        // if(audioBase!=""){
                        // 	sendPlayVoice(replyContent);return;
                        // }
                        // var textarea=getNode(document,'//div[@id="current-live-room"]//textarea');
                        // if(textarea){
                        // 	simulateInput(textarea,replyContent);
                        // 	simulateEnter(textarea);
                        // }
                        simulateHover(douyinBendizhibo)
                        simulateHover(getNode(addedNode,'.//div[contains(@class,"hover-button-")]/*[2]'));
                        setTimeout(function(){
                            simulateClick(getNode(document,"//*[text()='回复Ta']"));
                            if(audioBase!=""){
                                sendPlayVoice(replyContent);return;
                            }
                            var textarea=getNode(document,'//div[@id="current-live-room"]//textarea');
                            if(textarea){
                                simulateInput(textarea,replyContent);
                                simulateEnter(textarea);
                            }
                        },2000)
                    }
                }
                // let tiktok=getNode(addedNode,'//div[@data-e2e="chat-message"]');
                // if(tiktok){
                // 	//获取昵称
                // 	nickname=getTextNodeContent(tiktok,'.//span[@data-e2e="message-owner-name"]');
                // 	commentInfo=getTextNodeContent(tiktok,"./div[2]/div[2]");
                // 	if(!nickname || !commentInfo) return;
                // 	requestBody=nickname+":"+commentInfo;
                // 	showNewMessageBox(requestBody);
                // 	console.log(requestBody);
                // }

                // sendAIQuestion(nickname,"",commentInfo,function(replyContent){
                // 	console.log("AI回复----",replyContent);
                // 	if(replyContent=="") return;
                // 	replyContent=replyContent.replace("{昵称}",nickname);
                // 	replyContent=replyContent.replace("{评论}",commentInfo);
                // 	sendReplyContent(replyContent);
                // })

            });
        });

    });
    // 配置观察选项
    var config = { childList: true,attributes:true,characterData:false,subtree:true };
    // 开始观察变化
    observer.observe(document.body, config);

}
function getNode(node, xpath) {
    var element = document.evaluate(xpath, node, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    return element ? element : null;
}
function getNodes(node, xpath) {
    var nodes = [];
    var iterator = document.evaluate(xpath, node, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
    var currentNode = iterator.iterateNext();

    while (currentNode) {
        nodes.push(currentNode);
        currentNode = iterator.iterateNext();
    }

    return nodes;
}
function getTextNodeContent(node, xpath) {
    if(xpath==""){
        return node ? node.textContent.replace("：", "").replace(":", "").trim() : null;
    }
    var element = document.evaluate(xpath, node, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    return element ? element.textContent.replace("：", "").replace(":", "").trim() : null;
}
function getHtmlNodeContent(node, xpath) {
    var element = document.evaluate(xpath, node, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    return element ? element.innerHTML.trim(): null;
}
function getNodeAttr(node, xpath, attributeName) {
    if (typeof node.getAttribute !== 'function') return null;
    if(xpath==""){
        return node? node.getAttribute(attributeName) : null;
    }
    // 使用 document.evaluate 函数根据 xpath 查找元素
    var element = document.evaluate(xpath, node, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    // 如果找到了元素，则返回该元素指定属性的值，否则返回 null
    return element? element.getAttribute(attributeName) : null;
}

function startDouyinFeige() {
    console.log("开启运行唯一客服店铺客服自动回复插件...");
    if (isStarted) {
        layer.msg("正在运行唯一客服店铺客服自动回复插件，请先刷新页面！",{icon:2});
        return;
    }
    layer.msg("唯一客服店铺客服自动回复插件执行",{icon:1});
    isStarted = true;

    //每秒执行
    async function delayLog() {
        while (true) {
            var feigeHumanWords=localStorage.getItem("feigeHumanWords");//飞鸽客服转人工关键词
            var feigeHumanAccount=getRandomSegment(localStorage.getItem("feigeHumanAccount"));//飞鸽客服转人工员工账号
            //京东京麦
            let jingdong = getNode(document, '//div[@id="t-alluser-item"]/div//span[contains(@class,"user-none-reply-t")]');
            if (jingdong) {
                simulateClick(jingdong);
                let nickname = getTextNodeContent(document, '//div[@id="t-alluser-item"]/div//span[contains(@class,"user-none-reply-t")]/parent::div/parent::div/span')
                let content = getTextNodeContent(document, '//div[@id="t-alluser-item"]/div//span[contains(@class,"user-none-reply-t")]/parent::div/parent::div/parent::div/parent::div/div[2]')

                let allMessage = nickname + ":" + content;

                console.log(allMessage);
                showNewMessageBox(allMessage);

                // 转接会话
                let feigeHumanWordsArr=feigeHumanWords.split("#");
                if(feigeHumanWordsArr.includes(content) || containsKeyword(content,feigeHumanWordsArr)){
                    await sleep(1000);
                    simulateClick(getNode(document.body,'//span[@class="chat-transfer-desc"]'))
                    await sleep(1000);
                    simulateClick(getNode(document.body,'//div[contains(@class,"transfer-list-item")]/span[text()="'+feigeHumanAccount+'"]'));
                    await sleep(1000);
                    // simulateClick(getNode(document.body,'//div[@class="c_model-operate"]/span[@id="t-btn"]'));
                    // await sleep(1000);
                    continue;
                }

                //自动回复
                let replyContent = processQaKeywords(qaKeywords, content);
                if (replyContent == "") replyContent = finalReplay;
                if (replyContent == "") replyContent = getRandomElement();
                if (replyContent && replyContent != "") {

                    if (speakLimit) await sleep(speakLimit * 1000);
                    console.log("关键词回复" + nickname + ":" + replyContent);
                    simulateInput3(getNode(document.body, '//div[@contenteditable="true"]'), replyContent);
                    simulateClick(getNode(document.body, '//span[@class="send-button"]'));
                } else {
                    await sendAsyncAIQuestion(apiBase, nickname, "", content).then(replyContent => {
                        if (replyContent && replyContent != "" && !containsKeyword(replyContent,feigeHumanWordsArr)) {
                            console.log("AI回复" + nickname + ":" + replyContent);
                            simulateInput3(getNode(document.body, '//div[@contenteditable="true"]'), replyContent);
                            simulateClick(getNode(document.body, '//span[@class="send-button"]'));
                        }
                    }).catch();
                    // 转接会话
                    let feigeHumanWordsArr=feigeHumanWords.split("#");
                    if(containsKeyword(replyContent,feigeHumanWordsArr)){
                        await sleep(1000);
                        simulateClick(getNode(document.body,'//span[@class="chat-transfer-desc"]'))
                        await sleep(1000);
                        simulateClick(getNode(document.body,'//div[contains(@class,"transfer-list-item")]/span[text()="'+feigeHumanAccount+'"]'));
                        await sleep(1000);
                        // simulateClick(getNode(document.body,'//div[@class="c_model-operate"]/span[@id="t-btn"]'));
                        // await sleep(1000);
                        continue;
                    }
                }
                let sleepSecond=1000
                if (kefuBreak) sleepSecond=kefuBreak*1000
                console.log("客服休息" + sleepSecond);
                await sleep(sleepSecond);
                continue;
            }
            //抖店飞鸽客服
            let feigeDao = getNode(document, '//div[@data-qa-id="qa-conversation-chat-item"]//div[contains(text(), \'秒\') or contains(text(), \'分钟\') or contains(text(), \'小时\')]');
            if (feigeDao) {
                simulateClick(feigeDao);
                let nickname = getTextNodeContent(document, "//div[@data-qa-id=\"qa-conversation-chat-item\"]//div[contains(text(), '秒') or contains(text(), '分钟')]/parent::div/preceding-sibling::div[1]/div[1]")
                let content = getTextNodeContent(document, "//div[@data-qa-id=\"qa-conversation-chat-item\"]//div[contains(text(), '秒') or contains(text(), '分钟')]/parent::div/preceding-sibling::div[1]/div[2]")
                await sleep(2000);




                if(!nickname || !content){
                    await sleep(1000);
                    continue;
                }

                try {
                    const div = await waitForDiv("(//div[contains(@style, 'flex-direction: row;')]//pre)[last()]",2000); // 使用XPath
                    first = div.textContent.trim();
                    if(first) content="用户昵称："+nickname+"\n咨询消息："+first;
                } catch (error) {
                    console.error(error);
                }




                goodsInfo=""
                try {
                    const div = await waitForDiv('(//div[contains(@style, "flex-direction: row;")]//div[@class="chatd-card-main"])[last()]',2000); // 使用XPath
                    goodsInfo=div.textContent.trim();
                    if(goodsInfo) content+="\n用户正在查看的产品："+goodsInfo;
                } catch (error) {}
                // if(!goodsInfo){
                // 	try {
                // 		const div = await waitForDiv('(//span[text()="用户正在查看商品，来自电商小助手的推荐"]/parent::div/parent::div/parent::div/parent::div/parent::div)[last()]/div[2]',2000); // 使用XPath
                // 		goodsInfo=div.textContent.trim();
                // 		if(goodsInfo) content+="\n用户正在查看的产品："+goodsInfo;
                // 	} catch (error) {}
                // }


                try {
                    const div = await waitForDiv('//div[@class="ecom-collapse-header"]/div[2]',1000); // 使用XPath
                    orderInfo=div.textContent.trim();
                    if(orderInfo){
                        content+="\n订单信息："+orderInfo;
                    }
                } catch (error) {}

                try {
                    const div = await waitForDiv('//div[text()="物流信息"]/following-sibling::*[1]',1000); // 使用XPath
                    orderInfo=div.textContent.trim();
                    if(orderInfo){
                        content+="\n物流信息："+orderInfo;
                    }
                } catch (error) {}

                try {
                    const div = await waitForDiv('(//img[@alt="图片"])[last()]',1000); // 使用XPath
                    imgSrc=getNodeAttr(document,'(//img[@alt="图片"])[last()]',"src");
                    if (imgSrc){
                        content+="\n图像链接："+imgSrc;
                    }
                } catch (error) {}

                console.log(content);
                showNewMessageBox(content);

                // 转接会话
                let feigeHumanWordsArr=feigeHumanWords.split("#");
                if((feigeHumanWordsArr.includes(content) || containsKeyword(content,feigeHumanWordsArr)) && !isNightTime()){
                    await sleep(1000);
                    simulateClick(getNode(document.body,'//span[@data-qa-id="qa-transfer-conversation"]'))
                    await sleep(1000);
                    if(getNode(document.body,'//div[@data-qa-id="qa-transfer-customer"]')){
                        simulateClick(getNode(document.body,'//div[@data-qa-id="qa-transfer-customer"]//div[@title="'+feigeHumanAccount+'"]'));
                        await sleep(1000);
                        continue;
                    }
                }

                //自动回复
                let replyContent = processQaKeywords(qaKeywords, content);
                if (replyContent == "") replyContent = finalReplay;
                if (replyContent == "") replyContent = getRandomElement();
                if (replyContent && replyContent != "") {

                    if (speakLimit) await sleep(speakLimit * 1000);
                    console.log("关键词回复" + nickname + ":" + replyContent);
                    simulateInput(getNode(document.body, '//textarea[@data-qa-id="qa-send-message-textarea"]'), replyContent);
                    simulateClick(getNode(document.body, '//div[@data-qa-id="qa-send-message-button"]'));
                } else {

                    await sendAsyncAIQuestion(apiBase, nickname, "", content).then(replyContent => {
                        if (replyContent && replyContent != "") {
                            console.log("AI回复" + nickname + ":" + replyContent);
                            simulateInput(getNode(document.body, '//textarea[@data-qa-id="qa-send-message-textarea"]'), replyContent);
                            simulateClick(getNode(document.body, '//div[@data-qa-id="qa-send-message-button"]'));


                            // if(feigeHumanWordsArr.includes(replyContent) || containsKeyword(replyContent,feigeHumanWordsArr)){
                            // 	console.log("ai回复转人工",replyContent);
                            // 	sleep(1000);
                            // 	simulateClick(getNode(document.body,'//span[@data-qa-id="qa-transfer-conversation"]'))
                            // 	sleep(1000);
                            // 	if(getNode(document.body,'//div[@data-qa-id="qa-transfer-customer"]')){
                            // 		simulateClick(getNode(document.body,'//div[@data-qa-id="qa-transfer-customer"]//div[@title="'+feigeHumanAccount+'"]'));
                            // 		sleep(1000);
                            // 	}
                            // }
                        }
                    }).catch();

                }
                let sleepSecond=1000
                if (kefuBreak) sleepSecond=kefuBreak*1000
                console.log("客服休息" + sleepSecond);
                await sleep(sleepSecond);
                continue;
            }
            // 百度优选小店客服
            let baiduyouxuan = getNode(document, '//div[@class="session-item"]//span[contains(@class,"countdown-time-text")  or contains(@class,"waiting-time-text")]');
            if (baiduyouxuan) {
                simulateClick2(baiduyouxuan);
                let nickname=getTextNodeContent(document,'//div[@style[contains(., "background-color")]]//div[@class="name"]');
                let content=getTextNodeContent(document,'//div[@style[contains(., "background-color")]]//div[@class="in-day-content"]');
                await sleep(2000);
                if(!nickname || !content){
                    await sleep(1000);
                    continue;
                }
                let allMessage = nickname + ":" + content;
                console.log(allMessage);
                showNewMessageBox(allMessage);

                // 转接会话
                let feigeHumanWordsArr=feigeHumanWords.split("#");
                if((feigeHumanWordsArr.includes(content) || containsKeyword(content,feigeHumanWordsArr))){
                    await sleep(1000);
                    simulateClick2(getNode(document.body,'//div[contains(@class,"im-header-icon-transfer")]/span'))
                    await sleep(1000);
                    simulateClick2(getNode(document.body,'//div[@class="transfer-service-list-item"]//div[text()="'+feigeHumanAccount+'"]/following-sibling::*[1]'));
                    await sleep(1000);
                    continue;
                }


                let replyContent=processQaKeywords(qaKeywords,content);
                if(replyContent=="") replyContent=finalReplay;
                if(replyContent=="") replyContent=getRandomElement();
                if(replyContent!=""){
                    console.log("回复" + nickname + ":" + replyContent);
                    var textarea=getNode(document,'//textarea[contains(@class,"santd-input")]');
                    // history.push(nickname+":"+replyContent);
                    if(textarea){
                        simulateInput(textarea,replyContent);
                        simulateEnter(textarea);
                        if (speakLimit){
                            await sleep(speakLimit * 1000);
                        }else{
                            await sleep(2000);
                        }
                    }
                }else{
                    await sendAsyncAIQuestion(apiBase,nickname,"",content).then(replyContent => {
                        if(replyContent!=""){
                            console.log("回复" + nickname + ":" + replyContent);
                            var textarea=getNode(document,'//textarea[contains(@class,"santd-input")]');
                            if(textarea){
                                simulateInput(textarea,replyContent);
                                simulateEnter(textarea);
                            }
                        }
                    })
                }
            }
            //拼多多客服
            let pinduoduo=getNode(document.body,"//div[@class='chat-time']/p[contains(text(), '秒') or contains(text(), '分钟')]/parent::div/parent::div");
            if(pinduoduo) {
                simulateClick2(pinduoduo);
                let nickname=getTextNodeContent(document,'//div[@class=\'chat-time\']/p[contains(text(), \'秒\') or contains(text(), \'分钟\')]/parent::div/parent::div//div[@class="chat-nickname"]');
                let content=getTextNodeContent(document,'//div[@class=\'chat-time\']/p[contains(text(), \'秒\') or contains(text(), \'分钟\')]/parent::div/parent::div//p[@class="chat-message-content"]');


                // 转接会话
                let feigeHumanWordsArr=feigeHumanWords.split("#");
                if(feigeHumanWordsArr.length > 0 && containsKeyword(content,feigeHumanWordsArr)){
                    await sleep(1000);
                    simulateClick(getNode(document.body,"//span[text()='转移会话']"))
                    await sleep(3000);
                    let dstKefu=getNode(document.body,'//div[text()="'+feigeHumanAccount+'"]/parent::td/parent::tr//span[text()="无原因直接转移"]')
                    if (dstKefu) simulateClick(dstKefu);
                    await sleep(2000);
                    continue;
                }

                await sleep(2000);
                // 商品卡片
                tmp=content;
                goodsCard=""
                try {
                    const div = await waitForDiv('//div[@class="notify-card"]/div[2]',2000); // 使用XPath
                    goodsCard=div.textContent.trim();
                } catch (error) {}
                if(!goodsCard){
                    try {
                        const div = await waitForDiv('(//div[@class="good-info"])[last()]',2000); // 使用XPath
                        goodsCard=div.textContent.trim();
                    } catch (error) {}
                }
                if(goodsCard) content="用户昵称:"+nickname+"\n咨询问题："+tmp+"\n用户正在查看的产品："+goodsCard;
                let allMessage=nickname+":"+content;
                console.log(allMessage);
                showNewMessageBox(allMessage);
                //自动回复
                let replyContent=processQaKeywords(qaKeywords,content);
                if(replyContent=="") replyContent=finalReplay;
                if(replyContent=="") replyContent=getRandomElement();
                if(replyContent!=""){
                    console.log("回复" + nickname + ":" + replyContent);
                    var textarea=getNode(document,'//textarea[@id="replyTextarea"]');
                    // history.push(nickname+":"+replyContent);
                    if(textarea){
                        simulateInput(textarea,replyContent);
                        simulateEnter(textarea);
                        if (speakLimit) await sleep(speakLimit * 1000);
                    }

                }else{
                    await sendAsyncAIQuestion(apiBase,nickname,"",content).then(replyContent => {
                        if(replyContent!=""){
                            console.log("回复" + nickname + ":" + replyContent);
                            var textarea=getNode(document,'//textarea[@id="replyTextarea"]');
                            if(textarea){
                                simulateInput(textarea,replyContent);
                                simulateEnter(textarea);
                            }
                        }
                    })
                }

                if(feigeHumanWordsArr.length > 0 && containsKeyword(replyContent,feigeHumanWordsArr)){
                    await sleep(1000);
                    simulateClick(getNode(document.body,"//span[text()='转移会话']"))
                    await sleep(3000);
                    let dstKefu=getNode(document.body,'//div[text()="'+feigeHumanAccount+'"]/parent::td/parent::tr//span[text()="无原因直接转移"]')
                    if (dstKefu) simulateClick(dstKefu);
                    await sleep(2000);
                    continue;
                }

                let sleepSecond=1000
                if (kefuBreak) sleepSecond=kefuBreak*1000
                console.log("客服休息" + sleepSecond);
                await sleep(sleepSecond);
                continue;
            }
            // 快手小店客服
            let kuaishoudian=getNode(document,'//div[@class="SessionBaseCard-info"]//span[contains(text(), "秒") or contains(text(), "分钟")]');
            if(kuaishoudian){
                simulateClick2(kuaishoudian);
                let nickname=getTextNodeContent(document,'//div[@class="SessionBaseCard-info"]//span[contains(text(), "秒") or contains(text(), "分钟")]/parent::div/parent::div//div[@class="SessionBaseCard-topHeadName"]');
                let content=getTextNodeContent(document,'//div[@class="SessionBaseCard-info"]//span[contains(text(), "秒") or contains(text(), "分钟")]/parent::div/parent::div//div[@class="SessionBaseCard-lastMessage"]');
                let allMessage=nickname+":"+content;
                console.log(allMessage);
                showNewMessageBox(allMessage);
                // 转接会话
                let feigeHumanWordsArr=feigeHumanWords.split("#");
                if(feigeHumanWordsArr.includes(content) || containsKeyword(content,feigeHumanWordsArr)){
                    await sleep(1000);
                    simulateClick(getNode(document.body,'//div[@class="TargetUserHeaderRight"]/img[2]'))
                    await sleep(3000);
                    let dstKefu=getNode(document.body,'//td[text()="'+feigeHumanAccount+'"]/parent::tr//button')
                    if (dstKefu) simulateClick(dstKefu);
                    await sleep(1000);
                    let sendBtn=getNode(document.body,'//div[@class="reasonList"]/span[6]/button')
                    if (sendBtn) simulateClick(sendBtn);
                    let closeBtn=getNode(document.body,'//div[@class="ant-modal-content"]/button[@aria-label="Close"]')
                    if (closeBtn) simulateClick(closeBtn);
                    await sleep(2000);
                    continue;
                }

                //自动回复
                let replyContent = processQaKeywords(qaKeywords, content);
                if (replyContent == "") replyContent = finalReplay;
                if (replyContent == "") replyContent = getRandomElement();
                if (replyContent && replyContent != "") {

                    if (speakLimit) await sleep(speakLimit * 1000);
                    console.log("关键词回复" + nickname + ":" + replyContent);
                    simulateInput3(getNode(document.body, '//div[@id="esim-editor5678"]/div[1]/p'), replyContent);
                    simulateClick(getNode(document.body, '//button/span[text()="发送 Enter"]'));
                    simulateInput3(getNode(document.body, '//div[@id="esim-editor5678"]/div[1]/p'), "");
                    await sleep(1000);
                } else {
                    await sendAsyncAIQuestion(apiBase, nickname, "", content).then(replyContent => {
                        if (replyContent && replyContent != "") {
                            console.log("AI回复" + nickname + ":" + replyContent);
                            simulateInput3(getNode(document.body, '//div[@id="esim-editor5678"]/div[1]/p'), replyContent);
                            simulateClick(getNode(document.body, '//button/span[text()="发送 Enter"]'));
                            simulateInput3(getNode(document.body, '//div[@id="esim-editor5678"]/div[1]/p'), "");
                        }
                    }).catch();
                    await sleep(1000);
                }

                let sleepSecond=1000
                if (kefuBreak) sleepSecond=kefuBreak*1000
                console.log("客服休息" + sleepSecond);
                await sleep(sleepSecond);
                continue;
            }
            // 微信小店客服
            let weixin=getNode(document,'//ul[@class="session-list-container"]//div[contains(@class,"waiting-time")]');
            let weixin2=getNode(document,'//ul[@class="session-list-container"]//span[contains(@class,"unread-badge")]');
            if(weixin || weixin2){
                nickname="";
                content="";
                if (weixin){
                    nickname=getTextNodeContent(document,'//ul[@class="session-list-container"]//div[contains(@class,"waiting-time")]/parent::div/parent::div//div[@class="user-nickname"]');
                    content=getTextNodeContent(document,'//ul[@class="session-list-container"]//div[contains(@class,"waiting-time")]/parent::div/parent::div//div[@class="text-content-wrap"]');
                    simulateClick2(weixin);
                    await sleep(1000);
                }else{
                    nickname=getTextNodeContent(document,'//ul[@class="session-list-container"]//span[contains(@class,"unread-badge")]/parent::div/parent::div//div[@class="user-nickname"]')
                    content=getTextNodeContent(document,'//ul[@class="session-list-container"]//span[contains(@class,"unread-badge")]/parent::div/parent::div//div[@class="text-content-wrap"]');
                    simulateClick2(weixin2);
                    await sleep(1000);
                }
                if(getNode(document,'//div[@data-type="1"][last()]//div[contains(@class,"justify-end")]')) continue;


                let allMessage=nickname+":"+content;
                console.log(allMessage);
                showNewMessageBox(allMessage);

                //自动回复
                let replyContent = processQaKeywords(qaKeywords, content);
                if (replyContent == "") replyContent = finalReplay;
                if (replyContent == "") replyContent = getRandomElement();
                if (replyContent && replyContent != "") {

                    if (speakLimit) await sleep(speakLimit * 1000);
                    console.log("关键词回复" + nickname + ":" + replyContent);
                    var textarea=getNode(document,'//textarea[@class="text-area"]');
                    if(textarea){
                        simulateInput(textarea,replyContent);
                        simulateEnter(textarea);
                    }
                    if(weixin2)  await sleep(4000);
                    await sleep(1000);
                } else {
                    await sendAsyncAIQuestion(apiBase, nickname, "", content).then(replyContent => {
                        if (replyContent && replyContent != "") {
                            console.log("AI回复" + nickname + ":" + replyContent);
                            var textarea=getNode(document,'//textarea[@class="text-area"]');
                            if(textarea){
                                simulateInput(textarea,replyContent);
                                simulateEnter(textarea);
                            }

                        }
                    }).catch();
                    if(weixin2)  await sleep(4000);
                    await sleep(1000);
                }

                let sleepSecond=1000
                if (kefuBreak) sleepSecond=kefuBreak*1000
                console.log("客服休息" + sleepSecond);
                await sleep(sleepSecond);
                continue;
            }

            let sleepSecond=1000
            if (kefuBreak) sleepSecond=kefuBreak*1000
            console.log("客服休息" + sleepSecond);
            await sleep(sleepSecond);
        }
    }
    delayLog();
}
//开启循环弹窗
isStartLoopSpeak=false
function startLoopSpeak() {
    console.log("唯一客服循环弹窗...");
    if (isStartLoopSpeak) {
        layer.msg("正在运行唯一客服循环弹窗，请先刷新页面！",{icon:2});
        return;
    }
    layer.msg("唯一客服执行循环弹窗",{icon:1});
    isStartLoopSpeak = true;
    loopSpeakSecond=-1;
    // 创建弹品队列
    getProductQueueElement=createQueue(pushProduct);
    //每秒执行
    async function delayLog() {
        while (true) {
            loopSpeakSecond++;
            console.log("循环：",loopSpeakSecond);
            //循环弹品
            let product=getProductQueueElement();
            if(product){
                pushArr=product.split("#");
                pushSec=0;
                if(pushArr.length=2) pushSec=pushArr[1]
                console.log("循环弹品:",product);
                //淘宝中控,循环弹品
                let taobao=getNode(document,'//div[@id="livePushed"]/div/div/div['+pushArr[0]+']//span[text()="弹品"]');
                if(taobao){
                    simulateClick(taobao);
                    await sleep(1000*pushSec);
                }
                // 小红书循环弹卡
                //tbody[@class='d-table__body']/tr[1]//span[text()="弹卡"]
                let xhs=getNode(document,'//tbody[@class="d-table__body"]/tr['+pushArr[0]+']//span[text()="弹卡"]');
                if(xhs){
                    simulateClick(xhs);
                }

            }

            //循环弹券
            if(pushQuan){
                pushQuanArr=pushQuan.split("#");
                pushQuanSec=60;
                if(pushQuanArr.length=2) pushQuanSec=pushQuanArr[1]
                if(loopSpeakSecond%pushQuanSec==0){
                    console.log("循环弹券:",pushQuan);
                    //淘宝中控,循环弹券
                    let taobao=getNode(document,'//div[@id="livePushed"]/div/div/div['+pushQuanArr[0]+']//span[text()="弹券"]');
                    if(taobao){
                        simulateClick(taobao);
                    }
                }
            }

            //循环讲解
            if (speakNum){
                speakArr=speakNum.split("#");
                speakSec=60;
                if(speakArr.length=2) speakSec=speakArr[1]


                if(loopSpeakSecond%speakSec==0){
                    //淘宝中控,循环讲解
                    let taobao=getNode(document,'//div[@id="livePushed"]/div/div/div['+speakArr[0]+']//span[text()="再次讲解"]');
                    if(taobao){
                        simulateClick(taobao);
                    }

                    //巨量
                    let juliang=getNode(document,'//div[contains(@class,"goodsItem")]['+speakArr[0]+']//button[text()="取消讲解"]');
                    if(juliang){
                        simulateClick(juliang);
                        setTimeout(function(){
                            let juliang=getNode(document,'//div[contains(@class,"goodsItem")]['+speakArr[0]+']//button[text()="讲解"]');
                            simulateClick(juliang);
                            console.log("巨量循环讲解:",speakArr[0]);
                        },1000);
                    }
                    let juliangJiangjie=getNode(document,'//div[contains(@class,"goodsItem")]['+speakArr[0]+']//button[text()="讲解"]');
                    if(juliangJiangjie){
                        console.log("巨量循环讲解:",speakArr[0]);
                        simulateClick(juliangJiangjie);
                    }

                    //快手
                    //div[@data-test-id="virtuoso-item-list"]/div[1]//button/span[text()='结束讲解']
                    let kuaishou=getNode(document,'//input[@value="'+speakArr[0]+'"]/parent::div//parent::div/button/span[text()="开始讲解"]');
                    if(kuaishou){
                        simulateClick(kuaishou);
                        console.log("快手循环讲解:",speakArr[0]);
                        setTimeout(function(){
                            let confirmBtn=getNode(document,"//button/span[text()='确 定']")
                            if(confirmBtn) simulateClick(confirmBtn)
                        },1000);
                    }
                }
            }
            await sleep(1000);
        }
    }
    delayLog();
}
//开始循环发送
function startLoopQuestions(){
    console.log("唯一客服插件开始循环...");
    if(isLoopStarted){
        layer.msg("正在运行执行循环发送，请先刷新页面！",{icon:2});
        return;
    }
    layer.msg("唯一客服插件开始执行循环发送",{icon:1});
    isLoopStarted=true;
    loopSecond=-1;
    let history=[];
    //每秒执行
    async function delayLog() {
        while(true){
            loopSecond++;
            console.log("循环发送：",loopSecond);


            //快手小店循环发送
            var textarea=getNode(document,'//input[@placeholder="一键回复观众或直接发评论"]');
            if(textarea && speakLimit && loopSecond%speakLimit==0){
                if(questionsQueue.length<=0){
                    questionsQueue=deepCopy(questions);
                    console.log("每轮休息：",speakBreak);
                    if(speakBreak) await sleep(1000*speakBreak);
                }
                let randomElement = questionsQueue.shift();
                let replys=splitStringByChunk(randomElement,40);
                for(let item in replys){
                    setTimeout(function(){
                        let reply=replys[item];
                        if(insertPlaceholder=="yes") reply+=getRandomEmoji();
                        console.log("回复评论：",reply);
                        simulateInput(textarea,reply);
                        simulateClick(getNode(document,"//span[text()='发送']"));
                    },item*1000);
                }

                await sleep(1000);
                continue;
            }

            //抖音循环发送
            var textareaElement=getNode(document.body,'//textarea[@class="webcast-chatroom___textarea"]');
            if(textareaElement && speakLimit && loopSecond%speakLimit==0 && replyCommentStatus=="yes"){
                if(questionsQueue.length<=0){
                    questionsQueue=deepCopy(questions);
                    console.log("每轮休息：",speakBreak);
                    if(speakBreak) await sleep(1000*speakBreak);
                }
                let reply = questionsQueue.shift();
                if(insertPlaceholder=="yes") reply+=getRandomEmoji();
                console.log("回复评论：",reply);
                simulateInput(textareaElement,reply);
                var btn=document.querySelector(".webcast-chatroom___send-btn");
                if(btn) simulateClick(btn);

                await sleep(1000);
                continue;
            }
            //视频号循环
            let wujieApp = getNode(document, "//wujie-app");
            if(wujieApp){
                let shadowRoot = wujieApp.shadowRoot;
                let textarea = shadowRoot.querySelector("textarea.message-input");
                if(textarea && speakLimit && loopSecond%speakLimit==0){
                    if(questionsQueue.length<=0){
                        questionsQueue=deepCopy(questions);
                        console.log("每轮休息：",speakBreak);
                        if(speakBreak) await sleep(1000*speakBreak);
                    }
                    let reply = questionsQueue.shift();
                    if(insertPlaceholder=="yes") reply+=getRandomEmoji();
                    console.log("回复评论：",reply);
                    simulateInput(textarea,reply);
                    simulateEnter(textarea);

                    await sleep(1000);
                    continue;
                }
            }

            //抖音本地直播专业版
            var textarea=getNode(document,'//div[@id="current-live-room"]//textarea');
            if(textarea && speakLimit && loopSecond%speakLimit==0){
                if(questionsQueue.length<=0){
                    questionsQueue=deepCopy(questions);
                    console.log("每轮休息：",speakBreak);
                    if(speakBreak) await sleep(1000*speakBreak);
                }
                let reply = questionsQueue.shift();
                if(insertPlaceholder=="yes") reply+=getRandomEmoji();


                replyArray=reply.split("#");
                sendContent=replyArray[0];
                waitSecond=1;
                if(replyArray.length>1){
                    waitSecond=replyArray[1];
                }
                console.log("回复评论：",sendContent);
                simulateInput(textarea,sendContent);
                simulateEnter(textarea);
                console.log("等待：",waitSecond);
                await sleep(1000*waitSecond);
                continue;
            }
            // b站循环发送
            var textarea=getNode(document,'//textarea[@placeholder="发个弹幕呗~"]');
            if(textarea && speakLimit && loopSecond%speakLimit==0){
                if(questionsQueue.length<=0){
                    questionsQueue=deepCopy(questions);
                    console.log("每轮休息：",speakBreak);
                    if(speakBreak) await sleep(1000*speakBreak);
                }
                let reply = questionsQueue.shift();
                if(insertPlaceholder=="yes") reply+=getRandomEmoji();
                console.log("回复评论：",reply);
                simulateInput(textarea,reply);
                simulateEnter(textarea);

                await sleep(1000);
                continue;
            }

            //淘宝直播中控循环主动发送
            tabaoTextArea=getNode(document.body,'//textarea[@placeholder="回复观众或直接enter发评论，输入/可快捷回复"]');
            if(tabaoTextArea && speakLimit && loopSecond%speakLimit==0){
                if(questionsQueue.length<=0){
                    questionsQueue=deepCopy(questions);
                    console.log("每轮休息：",speakBreak);
                    if(speakBreak) await sleep(1000*speakBreak);
                }
                let reply = questionsQueue.shift();
                if(insertPlaceholder=="yes") reply+=getRandomEmoji();
                console.log("回复评论：",reply);
                simulateInput(tabaoTextArea,reply);
                simulateEnter(tabaoTextArea);

                await sleep(1000);
                continue;
            }

            // 快手网页版循环发送
            var textarea=getNode(document,'//div[contains(@class,"comment-input")]/textarea');
            if(textarea && speakLimit && loopSecond%speakLimit==0){
                if(questionsQueue.length<=0){
                    questionsQueue=deepCopy(questions);
                    console.log("每轮休息：",speakBreak);
                    if(speakBreak) await sleep(1000*speakBreak);
                }
                let reply = questionsQueue.shift();
                if(insertPlaceholder=="yes") reply+=getRandomEmoji();
                console.log("回复评论：",reply);
                simulateInput(textarea,reply);
                simulateClick2(getNode(document.body,"//div[contains(@class,'submit-button')]"));
                await sleep(1000);
                continue;
            }

            // 百度优选直播端循环发送
            var textarea = getNode(document, '//input[@id="input"]');
            if(textarea && speakLimit && loopSecond%speakLimit==0){
                if(questionsQueue.length<=0){
                    questionsQueue=deepCopy(questions);
                    console.log("每轮休息：",speakBreak);
                    if(speakBreak) await sleep(1000*speakBreak);
                }
                let reply = questionsQueue.shift();
                if(insertPlaceholder=="yes") reply+=getRandomEmoji();
                console.log("回复评论：",reply);
                simulateInput(textarea,reply);
                simulateInput(textarea,reply);
                setTimeout(function(){
                    simulateClick2(getNode(document.body,'//div[text()="发送"]'));
                },1000)
                await sleep(1000);
                continue;
            }
            // 百度优选直播端循环发送
            var textarea = getNode(document, '//textarea[@class="chat-input"]');
            if(textarea && speakLimit && loopSecond%speakLimit==0){
                if(questionsQueue.length<=0){
                    questionsQueue=deepCopy(questions);
                    console.log("每轮休息：",speakBreak);
                    if(speakBreak) await sleep(1000*speakBreak);
                }
                let reply = questionsQueue.shift();
                if(insertPlaceholder=="yes") reply+=getRandomEmoji();
                console.log("回复评论：",reply);
                simulateInput(textarea,reply);
                simulateInput(textarea,reply);
                setTimeout(function(){
                    simulateClick2(getNode(document.body,'//button[text()="发送"]'));
                },1000)
                await sleep(1000);
                continue;
            }

            //循环自动发送
            if(speakLimit){
                if (loopSecond%speakLimit==0) await startLoopComment();
            }else{
                await startLoopComment();
            }
            await sleep(1000); // 等待1秒
        }

    }
    delayLog();

}
//开始循环评论
async function startLoopComment(){

    var comments=getRandomElement();
    if(!comments) return;
    commentsArray=comments.split("#");
    m=commentsArray[0];
    waitSecond=0;
    if(commentsArray.length>1){
        waitSecond=commentsArray[1];
    }

    if(insertPlaceholder=="yes") m+=getRandomEmoji();
    console.log("发送：",m);
    //抖音直播间
    sendReplyContent(m);

    //百度直播循环发送
    var baidutextarea=getNode(document,'//*[contains(@class,"chat-input")]');
    if(baidutextarea){
        simulateInput(baidutextarea,m);
        var baidubtn=getNode(document,'//*[contains(@class,"chat-btn")]');
        if(baidubtn) simulateClick(baidubtn);
    }

    //淘宝直播循环主动发送
    var textarea=getNode(document,'//*[contains(@class,"chatInputCenterTextarea-")]');
    if(textarea){
        simulateInput(textarea,m);
        // var btn=getNode(document,'//*[contains(@class,"chatInputCenterBtnSend-")]');
        // console.log(btn);
        setTimeout(function(textarea){
            simulateEnter(textarea);
        }(textarea),2000);
    }



    //支付宝直播后台
    var textarea=getNode(document,'//textarea[@id="content"]');
    if(textarea){
        simulateInput(textarea,m);
        simulateEnter(textarea);
    }



    //抖音直播主播版
    var textarea=getNode(document,'//input[contains(@class,"sendInput")]');
    if(textarea){
        simulateInput(textarea,m);
        simulateClick(getNode(document,'//div[contains(@class,"sendBtn")]'));
    }


    //小红书直播中控
    var textarea=getNode(document,'//textarea[contains(@class,"d-text")]');
    if(textarea){
        simulateInput(textarea,m);
        setTimeout(function(){
            simulateClick(getNode(document,'//span[text()="发送"]'));
        },1000);
    }

    //tiktok
    var textarea=getNode(document,'//div[@contenteditable="plaintext-only"]');
    if(textarea){
        simulateInput3(textarea,m);
        setTimeout(function(){
            // simulateEnter(textarea);
            // simulateClick(getNode(document,'//div[@data-e2e="comment-post"]'));
            simulateClick2(getNode(document,'//div[@contenteditable="plaintext-only"]/../../../../div[2]'));
        },1000);
    }

    //酷狗直播
    var textarea=getNode(document,'//input[@id="inputChatMessage"]');
    if(textarea){
        simulateInput(textarea,m);
        setTimeout(function(){
            simulateEnter(textarea);
        },1000);
    }

    // 百应循环发送
    var textarea=getNode(document,'//textarea[contains(@class,"auxo-input-borderless")]');
    if(textarea){
        setTimeout(function(){
            simulateInput(textarea,m);
            simulateEnter(textarea);
        },1000)
    }


    if(waitSecond){
        console.log("等待：",waitSecond);
        await sleep(1000*waitSecond);
    }
}
//发送回复内容
function sendReplyContent(replyContent){
    if(audioBase!=""){
        sendPlayVoice(replyContent);
    }
    if(replyCommentStatus!="yes") return;
    if(insertPlaceholder=="yes") replyContent+=getRandomEmoji();

    let replys=splitStringByChunk(replyContent,50);
    for(let index in replys){
        var textareaElement=getNode(document.body,'//textarea[@class="webcast-chatroom___textarea"]');
        if(textareaElement){
            simulateInput(textareaElement,replys[index]);
            var btn=document.querySelector(".webcast-chatroom___send-btn");
            if(btn) simulateClick(btn);
        }
    }

}

function simulateTextInput2(element, text) {
    // 确保元素是可编辑的
    if (element.contentEditable === "true") {
        // 设置焦点到元素
        element.focus();

        // 模拟按键事件
        text.split('').forEach(function(char) {
            // 创建一个合成事件
            var event = new Event('textInput', { bubbles: true, cancelable: true });
            // 设置event的data属性为当前字符
            event.data = char;

            // 触发事件
            element.dispatchEvent(event);

            // 直接插入文本到元素中
            element.textContent += char;
        });
    } else {
        console.error('Element is not contenteditable');
    }
}
// 辅助函数，模拟鼠标悬停事件
function simulateHover(element) {
    var event = new MouseEvent('mouseover', {
        bubbles: true,
        cancelable: true,
        view: window
    });
    element.dispatchEvent(event);
}

// 辅助函数，模拟点击事件
function simulateClick(element) {
    if(!element) return;
    var event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
    });
    element.dispatchEvent(event);
}
// 辅助函数，模拟输入事件
function simulateInput(element, text) {
    if(!element || !text) return;
    element.value = text;
    var event = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        view: window
    });
    element.dispatchEvent(event);
}
// 辅助函数，模拟输入事件
function simulateInput2(element, text) {
    if (!element || !text) return;

    // 创建一个临时的input元素来模拟输入
    var tempInput = document.createElement('input');
    tempInput.type = 'text';
    tempInput.value = text;

    // 同步input值到目标元素
    element.textContent = text;
    element.focus();
    // 触发input事件
    var event = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        view: window
    });
    element.dispatchEvent(event);
}
// 辅助函数，模拟输入事件
function simulateInput3(element, html) {
    if (!element || !html) return;
    // 同步input值到目标元素
    element.innerHTML = html;
}
function simulateEditableInput(xpath,input) {
    chrome.runtime.sendMessage({action: "simulateInput",xpath:xpath,input:input});
}
// 辅助函数，模拟键盘输入事件
function simulateEnter(element) {
    // 创建一个新的键盘事件（回车键）
    const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        keyCode: 13,
        code: 'Enter',
        which: 13,
        bubbles: true,
        cancelable: true
    });
    element.dispatchEvent(enterEvent);
}
function simulateClick2(element) {
    var mouseDownEvent = new MouseEvent('mousedown', { bubbles: true });
    var mouseUpEvent = new MouseEvent('mouseup', { bubbles: true });
    var clickEvent = new MouseEvent('click', { bubbles: true });

    element.dispatchEvent(mouseDownEvent);
    element.dispatchEvent(mouseUpEvent);
    element.dispatchEvent(clickEvent);
}

function getRandomElement() {
    if(questionsQueue.length<=0){
        questionsQueue=deepCopy(questions);
    }
    let randomElement = questionsQueue.shift();
    return randomElement;
}
//关键词自动回复的匹配内容
function processQaKeywords(qaKeywords, commentInfo) {
    if (!qaKeywords || !commentInfo) {
        return "";
    }
    let qaKeywordsArr = qaKeywords.split("\n");
    let bestReplies = []; // 用于存储所有可能的最佳回复
    for (let index in qaKeywordsArr) {
        let row = qaKeywordsArr[index];
        let qa = row.split("#");
        if (qa.length !== 2) {
            continue;
        }
        let keywords = qa[0].split("|");
        if (containsKeyword(commentInfo, keywords)) {
            // 将所有可能的回复添加到数组中
            bestReplies.push(qa[1].split("|"));
        }
    }
    if (bestReplies.length === 0) {
        return "";
    } else {
        // 随机选择一个回复
        let randomIndex = Math.floor(Math.random() * bestReplies.length);
        return bestReplies[randomIndex][Math.floor(Math.random() * bestReplies[randomIndex].length)];
    }
}
// searchKeywordReplys 搜索关键词并返回对应的回复内容
function searchKeywordReplys(replys, keyword) {
    if (replys === "" || keyword === "") {
        return "";
    }
    const replyLines = replys.split("\n");
    let bestReplies = []; // 用于存储所有可能的最佳回复
    for (const reply of replyLines) {
        const qa = reply.split("#");
        if (qa.length === 2) {
            const questions = qa[0].split("|");
            const matchCount = countMatchingKeywords(keyword, questions);
            if (matchCount > 0) {
                // 如果匹配成功，将所有可能的回复添加到数组中
                const possibleReplies = qa[1].split("|");
                bestReplies.push(...possibleReplies);
            }
        }
    }
    if (bestReplies.length === 0) {
        return "";
    } else {
        // 随机选择一个回复
        const randomIndex = Math.floor(Math.random() * bestReplies.length);
        return bestReplies[randomIndex];
    }
}

// countMatchingKeywords 计算字符串包含的关键词数量
function countMatchingKeywords(inputString, keywords) {
    let count = 0;
    for (const kw of keywords) {
        if (kw === "") {
            continue;
        }
        if (inputString.includes(kw)) {
            count++;
        }
    }
    return count;
}

//是否在评论频率范围内
function isWithinTimeLimit(lastInvocationTime, timeLimit) {
    return (Date.now() - lastInvocationTime) > timeLimit;
}

function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}


//发送AI问答
function sendAIQuestion(nickname,avatar,question,callback) {
    // 调用coze
    if(cozeBotid && cozeApikey){
        replyContent=chatCozeAPI(cozeBotid, cozeApikey,question);
        callback(replyContent);
        return
    }
    if(apiBase=="") return;
    let url=removeSlashes(apiBase)
    sendPostRequest(url,{
        "type":"question",
        "visitor_id":nickname,
        "visitor_name":nickname,
        "avatar":avatar,
        "content": question
    },function(message){
        var messageResult=JSON.parse(message);
        replyContent = removeHtmlTags(messageResult.result.content);
        callback(replyContent);
    })
}
//发送Hook
function Hook(nickname,content,html) {
    if(hookBase=="") return;
    sendPostRequest(hookBase,{
        "type":"question",
        "nickname":nickname,
        "content":content,
        "html":html,
    },function(message){
    })
}
//发送AI生成语音
function sendPlayVoice(content){
    if(audioBase=="") return;
    sendPostRequest(audioBase,{"type":"answer","nickname":douyinNickname,"content":content,"html":content},function(res){
        console.log(res);
    });
}
//发送输入命令
function sendInputCmd(content){
    sendPostRequest("http://127.0.0.1:8089/input",{"message":content},function(res){
        console.log(res);
    });
}

function showNewMessageBox(msg){
    let obj=document.getElementById('newMessageBox');
    if(!obj) return;

    // 获取或初始化消息队列
    let messages = obj.getAttribute('data-messages');
    messages = messages ? JSON.parse(messages) : [];

    // 添加新消息到队列末尾
    messages.push(msg);

    // 保持队列最多10条消息
    if(messages.length > 15) {
        messages = messages.slice(-15);
    }

    // 保存消息队列到DOM
    obj.setAttribute('data-messages', JSON.stringify(messages));

    // 展示所有消息
    obj.innerHTML = messages.join('<br>');

    // 滚动到底部
    obj.scrollTop = obj.scrollHeight;
}
// 检测礼物
// 检测礼物类型
function detectGift(html) {
    // 礼物哈希值与名称的映射
    const gifts = {
        'e9b7db267d0501b8963d8000c091e123': '人气票',
        '7ef47758a435313180e6b78b056dda4e': '小心心',
        '96e9bc9717d926732e37351fae827813': '玫瑰',
        '722e56b42551d6490e5ebd9521287c67': '粉丝团灯牌',
        '34ca755520ab0ef2e67848c3f810550a': '粉丝团灯牌',
        '5ddfcd51beaa7cad1294a4e517bc80fb': '点亮粉丝团',
        '11bcb8bdc16b66fb330346cb478c1c98': '荧光棒',
        '0e176c2d0ac040ae0cad13d100f61b02': '热气球',
        '2756f07818a73a8c79f024e959665110': '棒棒糖',
        '8155c7cfcb680890bb1062fc664da3e7': '皇冠',
        '42d4cd329e5c01be43c3432567847507': '鲜花',
        '4960c39f645d524beda5d50dc372510e': '你最好看',
        '632fb87caf1844e8235462e3fd020b7f': '多元勋章',
        '71801c53df3977b1470ac2afb8250ac1': '大啤酒',
        '46c8e1f2f933d5af7c275b11decfb436': '妙手生花'
    };

    // 查找匹配的礼物哈希值
    const matchedHash = Object.keys(gifts).find(hash => html.includes(hash));

    // 返回礼物名称，未匹配到则返回空字符串
    return matchedHash ? gifts[matchedHash] : '';
}