window.ZC_ENDINGS = {
  perfect: {
    title: "完美通关",
    settle: "结算 · 危机解除",
    body: "好感度触及 100 的瞬间，系统宣告公司危机解除。陆晏辞看着你，第一次把没说完的话咽回去——这次不是因为不会说，是因为不必再靠任务靠近你。"
  },
  salvage: {
    title: "力挽狂澜",
    settle: "结算 · 公司部分保全",
    body: "最后一天仍差一口气。公司没有彻底倒下，却元气大伤。陆晏辞卸任总裁。他站在雨里，没再让秘书撑伞，只说：这次，是我没学完。"
  },
  bankrupt: {
    title: "攻略失败 · 破产",
    settle: "结算 · 清算",
    body: "倒计时归零。系统没有再毒舌，只留下一行冷冰冰的完成项：晏辞集团进入清算。",
    bodyWarm: "清算文件摊在桌上。他最后看你一眼，声音仍短：「……对不起。」没有解释那100天。你只觉得这句不像总裁会说的话。",
    bodyMute: "他没有告别。电梯门关上之前，他点了一下头，像在对一个普通员工致意。公司的灯，一盏盏熄了。",
    bodyCold: "「散会。」这是他对你说的最后两个字。系统面板碎成空白。你甚至不知道自己错过了什么。"
  },
  collapse: {
    title: "攻略失败 · 崩溃",
    settle: "结算 · 强制中断",
    body: "好感度连续三日跌破阈值。系统惩罚叠加，陆晏辞在电梯里扶着墙，心跳乱得像被拍卖的公司。攻略中断。你后来只听说总裁住院了，原因不详。"
  }
};

window.ZC_SCENES = [
  {
    id: "meet1",
    title: "第一次偶遇",
    place: "电梯间",
    bg: "elevator",
    jump: 1,
    play: "sysQuest",
    quest: "邀请{name}共进晚餐",
    questGate: true,
    nar: "下班点。电梯门开，陆晏辞走进来。这一层是裙楼，总裁很少出现。他站得离你偏近，像认错了楼层，又像有话要问。",
    act: "看了你一眼，抬手按了关门",
    line: "还在加班？",
    sys: [
      { who: "sys", text: "开始了。你这句像查勤。{name}现在在想：总裁为什么跟基层挤电梯。" },
      { who: "lu", text: "……自然。" },
      { who: "sys", text: "不许走。她要是不理你，你就站着。再逼她回一句。" }
    ],
    choices: [
      { text: "鞠躬致意。", aff: 1, next: "live", note: "吓了一跳，当他在问工作", judge: "doing" },
      { text: "点头应声。", aff: 2, next: "live", note: "他问得生硬，但你还是答了", flags: { spoke: true }, judge: "doing" },
      { text: "低头看手机，不接话。", aff: -2, next: "live", note: "被冷脸盯着，只觉得莫名其妙", flags: { wary: true }, judge: "fail" }
    ]
  },
  {
    id: "hint_phone",
    title: "电梯口",
    place: "电梯间",
    bg: "elevator",
    jump: 0,
    play: "sysQuest",
    quest: "邀请{name}共进晚餐",
    questGate: true,
    nar: "电梯到了。他先一步出去，却停在门外，没让开。裙楼厅里只剩你们两个。",
    act: "侧过身，像还有话要说",
    line: "你先走。",
    sys: [
      { who: "sys", text: "想逃？禁止。看完档案你必须再出现在她面前开口。" },
      { who: "lu", text: "……知道了。" },
      { who: "sys", text: "她不理你也得站着。这才叫攻略，暴君。" }
    ],
    choices: []
  },
  {
    id: "tea",
    title: "茶水间",
    place: "基层办公区",
    bg: "office",
    jump: 0,
    play: "dualTrack",
    quest: "请{name}喝一杯水",
    questGate: true,
    nar: "你刚回到工位。陆晏辞出现在隔间口，手里多了一杯温水。高管平时不下这层，周围键盘声轻了一拍。",
    act: "把杯子放到隔板上，目光没有停在你脸上",
    line: "喝点水。",
    sys: [
      { who: "sys", text: "任务是开口。你只丢了一个字。{name}现在觉得你有病。" },
      { who: "lu", text: "{name}会渴。" },
      { who: "sys", text: "她要是不接，你就继续站着。不许换地方，不许逃。" }
    ],
    choices: [
      { text: "接过杯子，微微鞠躬。", aff: 3, next: "desk", note: "态度差，但确实递了水", flags: { sawKindness: true }, judge: "ok" },
      { text: "看着杯子，没有立刻喝。", aff: 1, next: "desk", note: "不确定这算不算关心", judge: "doing" },
      { text: "侧身躲开，没有接。", aff: -3, next: "desk", note: "觉得这人来得奇怪", flags: { wary: true }, judge: "fail" }
    ]
  },
  {
    id: "desk",
    title: "工位",
    place: "基层办公区",
    bg: "office",
    jump: 0,
    play: "misread",
    quest: "帮{name}改对表格",
    questGate: true,
    nar: "你埋头改表，余光里那道黑色身影停在隔间外。周围瞬间没人敢键盘敲太响。他看了你屏幕三秒。",
    act: "指了指表格第三列，语气没有起伏",
    line: "错了。重做。",
    sys: [
      { who: "sys", text: "好感度预警：你现在像在审犯人。{name}的同事已经开始用目光问{name}是不是要被裁。" },
      { who: "lu", text: "那栏公式错了。" },
      { who: "sys", text: "你可以私下说。公开处刑不是攻略，是裁员预告。" }
    ],
    choices: [
      { text: "立刻低头改表。", aff: 2, next: "coffee", note: "被吓到，但承认他帮了忙", judge: "ok" },
      { text: "僵着肩，继续核对。", aff: 0, next: "coffee", note: "只觉得被盯上了", judge: "doing" },
      { text: "把屏幕侧过去，避开众人。", aff: -4, next: "coffee", note: "当众被点名，又羞又恼", flags: { embarrassed: true }, judge: "fail" }
    ]
  },
  {
    id: "coffee",
    title: "顺路",
    place: "基层办公区",
    bg: "office",
    jump: 0,
    play: "tsundereFeed",
    quest: "请{name}喝一杯咖啡",
    questGate: true,
    nar: "下午三点。一杯美式出现在你鼠标垫旁，杯套还是热的。陆晏辞已经走到两米外，像这杯咖啡是风吹来的。",
    act: "把咖啡放到你桌上，没看你",
    line: "顺路买的。",
    sys: [
      { who: "sys", text: "好感度判定中。{name}如果问「你怎么知道我喝美式」，请不要回答「系统说的」。" },
      { who: "lu", text: "闭嘴。" },
      { who: "sys", text: "口吻通过。内容不及格。建议补一句「不喝就扔」。你会的。" }
    ],
    choices: [
      { text: "接过咖啡，指尖碰了碰杯壁。", aff: 4, next: "overtime", note: "嘴硬，但你察觉到他在做小事", flags: { sawKindness: true }, judge: "ok" },
      { text: "把杯子往回推了推。", aff: 1, next: "overtime", note: "受宠若惊，有点不安", judge: "doing" },
      { text: "看着那杯咖啡，没有伸手。", aff: -3, next: "overtime", note: "觉得莫名其妙", flags: { suspicious: true }, judge: "fail" }
    ]
  },
  {
    id: "overtime",
    title: "加班灯",
    place: "办公室夜灯",
    bg: "night",
    jump: 3,
    play: "workplaceCover",
    quest: "给{name}送一份晚饭",
    questGate: true,
    nar: "整层只剩你和走廊尽头的灯。你本想赶完周报，门却被推开。陆晏辞站在光里，手里多了一份便当，还是热的。",
    act: "把便当搁在桌上，自己靠着门框",
    line: "吃。",
    sys: [
      { who: "sys", text: "关心检测到了。表达方式：命令。{name}不是你的项目经理。" },
      { who: "lu", text: "{name}连续加班两晚。" },
      { who: "sys", text: "所以你来了。很好。下一步试着说「辛苦了」。三个字，不会掉肉。" }
    ],
    choices: [
      { text: "打开便当，抬眼看他。", aff: 4, next: "file", note: "听出关心，心里一动", flags: { sawKindness: true }, judge: "ok" },
      { text: "把便当转到一边，继续敲字。", aff: 0, next: "file", note: "不敢跟总裁共处一室太久", judge: "doing" },
      { text: "皱眉，没有动筷子。", aff: -2, next: "file", note: "压力大于感动", flags: { wary: true }, judge: "fail" }
    ]
  },
  {
    id: "file",
    title: "文件",
    place: "基层办公区",
    bg: "office",
    jump: 0,
    play: "workplaceCover",
    quest: "帮{name}把文件整理好",
    questGate: true,
    nar: "你抱着一叠合同往会议室走，最上面那份封面装订反了。一只手伸过来，抽走，重新对齐，再塞回你怀里。全程不超过十秒。",
    act: "动作干净，脸上没有表情",
    line: "别让客户看见。",
    sys: [
      { who: "sys", text: "帮了忙。语气依然像在骂人。可以给分，但别得意。" },
      { who: "lu", text: "{name}会出丑。" },
      { who: "sys", text: "这句话如果你说出口，好感度会变成负数。你很有自知之明。" }
    ],
    choices: [
      { text: "点头接过，抱紧文件。", aff: 3, next: "rain", note: "态度差，但确实帮到你了", judge: "ok" },
      { text: "把文件抱得更紧，没有道谢。", aff: 0, next: "rain", note: "不想被当成需要照顾的人", judge: "doing" },
      { text: "盯着他，没有立刻接。", aff: -5, next: "rain", note: "开始怀疑他在刻意接近", flags: { suspicious: true }, judge: "fail" }
    ]
  },
  {
    id: "rain",
    title: "下雨",
    place: "公司楼下",
    bg: "rain",
    jump: 5,
    play: "tsundereFeed",
    quest: "把伞递给{name}",
    questGate: true,
    nar: "暴雨。你站在门廊里看天气预报，背包拉链只拉开一半。一把黑伞伸到你头顶，柄被塞进你手里。陆晏辞衬衫肩线已经深了一块。",
    act: "松开伞，往雨里走了半步，头也没回",
    line: "顺路。",
    sys: [
      { who: "sys", text: "你回家和{name}相反。这不叫顺路，叫撒谎。不过这次撒谎加分。" },
      { who: "lu", text: "别多想。" },
      { who: "sys", text: "这句话请对{name}说。对系统说没有用。" }
    ],
    choices: [
      { text: "追半步，把伞往回递。", aff: 5, next: "meeting", note: "确认他在关心，只是死不承认", flags: { rainUmbrella: true, sawKindness: true }, judge: "ok" },
      { text: "接过伞，点头收下。", aff: 3, next: "meeting", note: "收下了，心里有点乱", flags: { rainUmbrella: true }, judge: "ok" },
      { text: "侧身避开伞面。", aff: -4, next: "meeting", note: "觉得被看得太清楚，不舒服", flags: { wary: true }, judge: "fail" }
    ]
  },
  {
    id: "meeting",
    title: "例会",
    place: "基层办公区",
    bg: "office",
    jump: 0,
    play: "workplaceCover",
    quest: "让{name}在会上把话说完",
    questGate: true,
    nar: "季度例会。你本该坐最后一排做记录。陆晏辞点到你的名字，让你把上周那份修正后的数据念一遍。全场回头。",
    act: "坐在主位，手指敲了敲桌面",
    line: "说。",
    sys: [
      { who: "sys", text: "你这是在给{name}露脸，还是在公审？界限很薄。" },
      { who: "lu", text: "{name}做对了。" },
      { who: "sys", text: "那你可以说「这份很好」。两个字「很好」你不会写吗？" }
    ],
    choices: [
      { text: "站起来，把数据念完。", aff: 2, next: "lunch", note: "紧张，但感到被看见了", judge: "ok" },
      { text: "念完后补了一句判断。", aff: 4, next: "lunch", note: "他给了位置，你接住了", flags: { competent: true }, judge: "ok" },
      { text: "念完，散会后避开他走。", aff: -2, next: "lunch", note: "被点名的压力盖过一切", flags: { embarrassed: true }, judge: "fail" }
    ]
  },
  {
    id: "lunch",
    title: "走",
    place: "基层办公区",
    bg: "office",
    jump: 0,
    play: "sysQuest",
    quest: "邀请{name}共进晚餐",
    questGate: true,
    nar: "中午十二点零一分。陆晏辞停在你隔间口，所有人的筷子都还没拿出来。他看了你两秒，像在下指令。",
    act: "侧了侧身，给走廊让出位置",
    line: "走。",
    sys: [
      { who: "sys", text: "「走」不是邀请。这是押送。{name}的同事已经开始传「谁被叫去谈话了」。" },
      { who: "lu", text: "请{name}吃饭。" },
      { who: "sys", text: "那你至少加「有空吗」三个字。算了，你没有。去吧，暴君。" }
    ],
    choices: [
      { text: "拿上工牌，跟上去。", aff: 3, next: "cover", note: "紧张，但没有拒绝", flags: { ateTogether: true }, judge: "ok" },
      { text: "摇头，指了指自己的便当。", aff: 0, next: "cover", note: "不敢跟总裁吃饭", judge: "fail" },
      { text: "停住，没有跟。", aff: -6, next: "cover", note: "觉得被跟踪式点名", flags: { suspicious: true }, judge: "fail" }
    ]
  },
  {
    id: "cover",
    title: "挡锅",
    place: "基层办公区",
    bg: "office",
    jump: 0,
    play: "workplaceCover",
    quest: "帮{name}挡一次锅",
    questGate: true,
    nar: "客户把延期甩到你头上。你还在打腹稿，陆晏辞已经进了群，扔下一句「节点是我改的，找我」。群里安静了。他没有@你。",
    act: "路过你工位，连停都没停",
    line: "下次先报我。",
    sys: [
      { who: "sys", text: "帮了大忙。口吻仍像训下属。{name}现在可能在想：虽然态度差，但确实帮到我了。" },
      { who: "lu", text: "那锅不该{name}背。" },
      { who: "sys", text: "这句话很好。请对{name}说。你会说「下次先报我」，差得不远了。" }
    ],
    choices: [
      { text: "追到电梯口，点头致谢。", aff: 4, next: "secretary", note: "知道他在护你，心里发烫", flags: { wasCovered: true, sawKindness: true }, judge: "ok" },
      { text: "坐回工位，发了一封短邮件。", aff: 3, next: "secretary", note: "靠谱，但你还是不敢当面说", flags: { wasCovered: true }, judge: "ok" },
      { text: "关上聊天窗口，没有回应。", aff: -1, next: "secretary", note: "不想欠总裁人情", judge: "fail" }
    ]
  },
  {
    id: "secretary",
    title: "回避",
    place: "总裁办走廊",
    bg: "meeting",
    jump: 5,
    play: "misread",
    quest: "护{name}躲开镜头",
    questGate: true,
    nar: "秘书拦下你，声音很轻：「陆总让你以后走侧门，媒体在正面。」你还没问为什么，陆晏辞从里面出来，看了秘书一眼。秘书立刻消失。",
    act: "走过你身边，像只是提醒一句公司纪律",
    line: "别往镜头里站。",
    sys: [
      { who: "sys", text: "你在保护{name}，听起来却像嫌{name}碍事。建议补「会有人拍到你」。" },
      { who: "lu", text: "多余。" },
      { who: "sys", text: "对系统多余，对{name}刚刚好。" }
    ],
    choices: [
      { text: "侧过身，点头。", aff: 3, next: "track", note: "听出保护，只是说法难听", flags: { sawKindness: true }, judge: "ok" },
      { text: "皱眉，没有让开。", aff: 0, next: "track", note: "当他在挑刺", judge: "doing" },
      { text: "停住脚步，回头看他。", aff: -4, next: "track", note: "觉得被特殊对待得很奇怪", flags: { suspicious: true }, judge: "fail" }
    ]
  },
  {
    id: "track",
    title: "路线",
    place: "地下车库",
    bg: "night",
    jump: 6,
    play: "misread",
    quest: "送{name}安全回去",
    questGate: true,
    nar: "你加班到很晚。车库里只有两辆车。陆晏辞靠在柱子上，像是算好了你下楼的时间。风把地库的灯管吹得直响。",
    act: "抬眼，声音比平时更短",
    line: "上车。",
    sys: [
      { who: "sys", text: "警告：这看起来像跟踪。你有司机，{name}有地铁。如果你不解释「刚好开完会」，{name}会扣分，扣很多。" },
      { who: "lu", text: "晚上不安全。" },
      { who: "sys", text: "那就说这句话。不要说「上车」。你不是在绑人。" }
    ],
    choices: [
      { text: "站着没动，盯着他。", aff: -8, next: "night", note: "刻意接近被你抓到了", flags: { suspicious: true }, judge: "fail" },
      { text: "后退半步，摇头拒绝。", aff: -2, next: "night", note: "警戒，但没撕破脸", judge: "fail" },
      { text: "沉默两秒，拉开后车门。", aff: 2, next: "night", note: "奇怪，可你信他不是来伤害你的", flags: { sawKindness: true }, judge: "ok" }
    ]
  },
  {
    id: "night",
    title: "深夜办公室",
    place: "他的办公室",
    bg: "night",
    jump: 8,
    play: "dualTrack",
    quest: "再见{name}一面",
    questGate: true,
    nar: "你被叫去补签一份授权。落地窗外是城市的灯。陆晏辞把笔递过来，指节碰到你的手指，他像被烫到，收得很快。",
    act: "偏过脸，只留一个侧影",
    line: "签完回去。",
    sys: [
      { who: "sys", text: "心跳加速来自你，不是{name}。别把文件当借口，今晚没有紧急授权。" },
      { who: "lu", text: "需要签名。" },
      { who: "sys", text: "需要的是你。承认很难，比谈十个亿难。我知道。" }
    ],
    choices: [
      { text: "签字，停顿看了他一眼。", aff: 5, next: "almost", note: "你开始关心这个不会说话的人", flags: { sawKindness: true }, judge: "ok" },
      { text: "签完，把笔放正，起身。", aff: 1, next: "almost", note: "气氛奇怪，你选择退出", judge: "doing" },
      { text: "把笔放下，没有签。", aff: -3, next: "almost", note: "觉得借口拙劣", judge: "fail" }
    ]
  },
  {
    id: "almost",
    title: "差点",
    place: "茶水间",
    bg: "tea",
    jump: 6,
    play: "misread",
    quest: "别让{name}听见系统",
    questGate: true,
    nar: "你进去倒咖啡，听见他在打电话。没有第二个人。他对着空气说：「不是任务。」然后看见你，电话迅速按掉——如果那是电话。",
    act: "把杯子转了半圈，遮住屏幕一样的光",
    line: "路过。",
    sys: [
      { who: "sys", text: "你差点把我暴露了。{name}听见「任务」两个字。解释，立刻。" },
      { who: "lu", text: "工作。" },
      { who: "sys", text: "{name}不是傻的。好感度现在取决于你要不要继续装。" }
    ],
    choices: [
      { text: "看着他空着的手，没有装作没听见。", aff: -5, next: "fever", note: "你捕捉到不对劲", flags: { heardAlmost: true }, judge: "fail" },
      { text: "假装没听见，倒完水就走。", aff: 0, next: "fever", note: "选择不当面拆穿", judge: "doing" },
      { text: "把第二杯水推给他。", aff: 4, next: "fever", note: "你愿意听，即使他不会说", flags: { sawKindness: true }, judge: "ok" }
    ]
  },
  {
    id: "fever",
    title: "请假",
    place: "工位",
    bg: "office",
    jump: 6,
    play: "workplaceCover",
    quest: "让{name}回去休息",
    questGate: true,
    nar: "你低烧，还在撑着改方案。人事系统里突然多了一条已批准的病假。申请人不是你。陆晏辞的消息只有两个字。",
    act: "从你屏幕前拿走鼠标，扣上笔记本",
    line: "回去。",
    sys: [
      { who: "sys", text: "替{name}请假是越权。{name}可能感动，也可能觉得被管。你选了最像命令的那两个字。" },
      { who: "lu", text: "{name}在发烧。" },
      { who: "sys", text: "「好好休息」四个字。今天就练这个。" }
    ],
    choices: [
      { text: "愣住，还是合上了电脑。", aff: 4, next: "pressure", note: "被管着，可你觉得他是担心", flags: { sawKindness: true }, judge: "ok" },
      { text: "把电脑重新打开一条缝。", aff: 1, next: "pressure", note: "谢谢，但要保留自己的节奏", judge: "doing" },
      { text: "把电脑拉回来，声音冷下来。", aff: -6, next: "pressure", note: "越权让你非常不舒服", flags: { suspicious: true }, judge: "fail" }
    ]
  },
  {
    id: "pressure",
    title: "催促",
    place: "天台",
    bg: "rain",
    jump: 8,
    play: "countdown",
    quest: "把外套给{name}",
    questGate: true,
    nar: "风很大。陆晏辞站在栏杆内侧，像在开会间隙透气。看见你推门，他没有让你回去，也没有请你靠近。",
    act: "把风衣解下来，丢到你肩上，自己只剩衬衫",
    line: "别着凉。",
    sys: [
      { who: "sys", text: "时间在走。你能做的事越来越不像总裁，越来越像一个笨拙的人。这是好事。" },
      { who: "lu", text: "知道了。" },
      { who: "sys", text: "对{name}说，不是对我。" }
    ],
    choices: [
      { text: "把风衣裹紧，抬眼看他。", aff: 5, next: "ten", note: "心口发热，第一次觉得他没那么远", flags: { sawKindness: true }, judge: "ok" },
      { text: "把衣服递回去。", aff: 1, next: "ten", note: "感动和害怕同时存在", judge: "doing" },
      { text: "后退一步，没有接。", aff: -6, next: "ten", note: "边界被打破的不安", flags: { suspicious: true }, judge: "fail" }
    ]
  },
  {
    id: "ten",
    title: "只剩十天",
    place: "电梯间",
    bg: "elevator",
    jump: 13,
    play: "countdown",
    quest: "留{name}多待一会儿",
    questGate: true,
    nar: "你们又进了同一部电梯。这一次他没有装路过。楼层数字往上跳，他看着门上的倒影，像在练习开口。",
    act: "终于侧过脸，看了你一眼",
    line: "别走太早。",
    sys: [
      { who: "sys", text: "只剩十天了。这句话是「我想见你」的残次品。收下吧，{name}也许听得懂。" },
      { who: "lu", text: "别评价。" },
      { who: "sys", text: "我的工作就是评价。去吧。" }
    ],
    choices: [
      { text: "点头，等他说完。", aff: 5, next: "eve", note: "你决定给他时间", flags: { sawKindness: true }, judge: "ok" },
      { text: "把话题拨回工作。", aff: 0, next: "eve", note: "还是把他放在老板的位置", judge: "doing" },
      { text: "后退，划清距离。", aff: -7, next: "eve", note: "你想停在安全距离", flags: { suspicious: true }, judge: "fail" }
    ]
  },
  {
    id: "eve",
    title: "倒数前夜",
    place: "会议室",
    bg: "meeting",
    jump: 9,
    play: "countdown",
    quest: "对{name}把话说开",
    questGate: true,
    nar: "只剩一天。他没有开会，会议室的灯却开着。桌上是两杯已经凉掉的咖啡。陆晏辞坐在长桌尽头，第一次看起来不像暴君，像一个不会写检讨的人。",
    act: "把一份没有抬头的文件推过来——里面是空白",
    line: "不是工作。",
    sys: [
      { who: "sys", text: "最后的窗口。{name}如果问为什么是自己，你可以沉默，但不能撒谎。" },
      { who: "lu", text: "……不知道。" },
      { who: "sys", text: "「不知道为什么是你，但只能是你。」试试。" }
    ],
    choices: [
      { text: "坐下来，没有先逃。", aff: 6, next: "finale", note: "你愿意听完这个不会说话的人", judge: "ok" },
      { text: "轻轻把文件推回去。", aff: 1, next: "finale", note: "你在等他更明确", judge: "doing" },
      { text: "起身离开。", aff: -8, next: "finale", note: "你拒绝越界", flags: { suspicious: true }, judge: "fail" }
    ]
  },
  {
    id: "finale",
    title: "最后一句",
    place: "落地窗前",
    bg: "night",
    jump: 1,
    play: "endings",
    quest: "请{name}留下",
    questGate: true,
    nar: "城市在下面。陆晏辞站在你侧前方，喉结滚动一次。系统的倒计时在他眼里走完最后一格——你看不见。",
    act: "声音比任何一次都低，仍然很短",
    line: "留下。",
    sys: [
      { who: "sys", text: "结算在下一秒。看{name}怎么回答。" },
      { who: "lu", text: "……请。" },
      { who: "sys", text: "你终于说出一个不像命令的字。" }
    ],
    choices: [
      { text: "点头，留下。", aff: 8, next: "clear", note: "你留下了", judge: "ok" },
      { text: "停住，等他把话说完。", aff: 3, next: "clear", note: "你要一句人话", judge: "doing" },
      { text: "退开一步。", aff: -10, next: "clear", note: "你把关系钉回工牌上", judge: "fail" }
    ]
  },
  {
    id: "last_day",
    title: "最后一天",
    place: "天台",
    bg: "rain",
    jump: 0,
    play: "grace",
    quest: "请{name}跟你走",
    questGate: true,
    nar: "系统把时针按住了。风比昨晚更大。陆晏辞的脸色不好，可他还是站直。他看着你，像把一辈子要说的字压缩成一句。",
    act: "把手伸到你面前，掌心向上，没有抓",
    line: "跟我走。不是命令。",
    sys: [
      { who: "sys", text: "最后的机会。{name}如果伸手，危机还能改写。{name}如果不伸，你至少说过「不是命令」。" },
      { who: "lu", text: "……求你。" },
      { who: "sys", text: "记录：暴君学会了这两个字。" }
    ],
    choices: [
      { text: "把手放上去。", aff: 14, next: "clear", note: "你接住了他", judge: "ok" },
      { text: "没躲开，也没立刻握。", aff: 6, next: "clear", note: "你给他最后一点空间", judge: "ok" },
      { text: "摇头，抽回手。", aff: -4, ending: "salvage", note: "差一口气", judge: "fail" }
    ]
  },
  {
    id: "clear",
    title: "通关",
    place: "系统面板",
    bg: "ending",
    jump: 0,
    tone: false,
    nar: "好感度到达阈值。你仍不知道有系统，只看见陆晏辞肩背忽然松下来，像有人把一块巨石从他脊背上搬走。",
    act: "看着你，第一次把目光停留得稍久",
    line: "结束了。",
    sys: [
      { who: "sys", text: "通关。公司危机解除。你可以不当暴君了，陆晏辞。" },
      { who: "lu", text: "{name}还在。" },
      { who: "sys", text: "对。以后说话，可以多两个字。日谈已解锁。" }
    ],
    choices: [
      { text: "进入通关日谈。", aff: 0, next: "epilogue", note: "危机解除" },
      { text: "查看结算。", aff: 0, ending: "perfect", note: "通关结算" }
    ]
  },
  {
    id: "epilogue",
    title: "日谈",
    place: "茶水间",
    bg: "tea",
    jump: 0,
    tone: false,
    nar: "没有倒计时的早晨。他还是话少，可把水递给你的时候，补了一句以前系统逼了很久的话。",
    act: "杯子放稳，视线落在你手上",
    line: "辛苦了。",
    sys: [
      { who: "sys", text: "系统已静默。此面板仅作回顾。他不再需要我催。" },
      { who: "lu", text: "你可以走了。" },
      { who: "sys", text: "走之前留一句：{name}喜欢你现在这样。" }
    ],
    choices: [
      { text: "笑了一下。", aff: 0, ending: "perfect", note: "日谈收束" },
      { text: "点头，回顾最终状态。", aff: 0, ending: "perfect", note: "回顾结算" }
    ]
  }
];

window.ZC_PHONE = {
  dossier: {
    title: "档案",
    kicker: "HE IS HUNTING YOU",
    name: "陆晏辞",
    img: "img/card_lu.png",
    lines: [
      "36岁 · 晏辞集团总裁。商界叫他暴君。",
      "话少，冷脸，不习惯低头。系统要他在100天内攻略你。",
      "他至今没想明白：为什么是你。"
    ],
    stats: [
      ["身高", "188 cm"],
      ["体重", "76 kg"],
      ["生日", "11 / 08"],
      ["血型", "A"],
      ["视力", "5.0 / 裸眼"],
      ["惯用手", "右手"]
    ]
  },
  identity: {
    title: "身份",
    kicker: "PLAYER",
    lines: [
      "{age}岁 · 晏辞集团基层员工，入职三年。",
      "外貌：{appearance}",
      "性格：{personality}",
      "你和他隔着好几层。你知道他是总裁，他按理不该认识你。"
    ]
  },
  corp: {
    title: "集团",
    kicker: "YANCI GROUP",
    name: "晏辞集团",
    img: "img/corp_day.png",
    lines: [
      "滨江第一高楼。顶层是陆晏辞，你在裙楼办公区。",
      "专梯、会议层、空中花园都不对你开放——除非他下来找你。"
    ],
    facts: [
      ["总部", "滨江 CBD · 68 层"],
      ["估值", "约 1,200 亿"],
      ["员工", "12,400 人"],
      ["你的层", "裙楼 7F 基层"]
    ]
  },
  maps: {
    title: "地图",
    company: {
      name: "晏辞总部",
      img: "img/map_company.png",
      lines: [
        "上是总裁层，中是裙楼，下是车库。",
        "你的工位在裙楼。他要找你，就得一层层下来。"
      ]
    },
    city: {
      name: "滨江",
      img: "img/map_city.png",
      lines: [
        "中间那座塔是晏辞。左边旧城，右边商圈，下面是江。",
        "你走地铁。他走江岸。两条线本不该交。"
      ]
    }
  }
};

window.ZC_TASKS = [
  { id: "meet", name: "制造一次自然偶遇", scene: "meet1" },
  { id: "phone", name: "电梯口再留住她", scene: "hint_phone" },
  { id: "water", name: "请她喝一杯水", scene: "tea" },
  { id: "coffee", name: "把咖啡放到她桌上", scene: "coffee" },
  { id: "overtime", name: "加班后送她下楼", scene: "overtime" },
  { id: "file", name: "改掉她桌上的错表", scene: "file" },
  { id: "rain", name: "下雨把伞给她", scene: "rain" },
  { id: "meeting", name: "会议上替她挡一句", scene: "meeting" },
  { id: "dinner", name: "邀请她共进晚餐", scene: "lunch" },
  { id: "cover", name: "替她扛一回锅", scene: "cover" }
];

window.ZC_MAPS = {
  company: {
    title: "晏辞总部",
    img: "img/map_company.png",
    spots: [
      { id: "ceo", name: "总裁层", x: 50, y: 10, text: "玻璃塔上段。专梯直达。", lu: 0.55, insides: [
        { id: "ceo-lift", name: "专梯口", cg: "img/cg_elevator.png", lu: 0.4 },
        { id: "ceo-office", name: "总裁办", cg: "img/cg_night.png", lu: 0.7 },
        { id: "ceo-garden", name: "空中花园", cg: "img/cg_rooftop.png", lu: 0.35 }
      ] },
      { id: "desk", name: "裙楼", x: 42, y: 41, text: "塔楼下面那截。你的工位在这一层。", quest: "desk", lu: 0.28, insides: [
        { id: "desk-seat", name: "你的工位", cg: "img/cg_office.png", lu: 0.3 },
        { id: "desk-tea", name: "茶水间", cg: "img/cg_tea.png", lu: 0.35 },
        { id: "desk-print", name: "打印室", cg: "img/cg_print.png", lu: 0.22 },
        { id: "desk-hall", name: "走廊", cg: "img/cg_corridor.png", lu: 0.25 }
      ] },
      { id: "meet", name: "会议翼", x: 78, y: 48, text: "右侧那栋矮楼。", lu: 0.3, insides: [
        { id: "meet-hall", name: "大会议室", cg: "img/cg_meeting.png", lu: 0.4 },
        { id: "meet-wait", name: "等候区", cg: "img/cg_corridor.png", lu: 0.2 },
        { id: "meet-tea", name: "茶歇", cg: "img/cg_tea.png", lu: 0.25 }
      ] },
      { id: "lobby", name: "大堂", x: 49, y: 52, text: "裙楼正门。你每天从这里刷卡。", lu: 0.18, insides: [
        { id: "lobby-desk", name: "前台", cg: "img/map_lobby.png", lu: 0.15 },
        { id: "lobby-gate", name: "闸机", cg: "img/map_lobby.png", lu: 0.12 },
        { id: "lobby-sofa", name: "休息沙发", cg: "img/map_lobby.png", lu: 0.2 }
      ] },
      { id: "tea", name: "庭院", x: 13, y: 54, text: "左手那片树和座椅。", lu: 0.2, insides: [
        { id: "yard-seat", name: "座椅区", cg: "img/cg_tea.png", lu: 0.22 },
        { id: "yard-path", name: "小径", cg: "img/cg_tea.png", lu: 0.15 }
      ] },
      { id: "garage", name: "车库", x: 39, y: 78, text: "回旋坡道下去。", lu: 0.32, insides: [
        { id: "gar-ramp", name: "坡道", cg: "img/cg_garage.png", lu: 0.25 },
        { id: "gar-car", name: "总裁车位", cg: "img/cg_garage.png", lu: 0.45 },
        { id: "gar-staff", name: "员工车位", cg: "img/cg_garage.png", lu: 0.1 }
      ] }
    ]
  },
  city: {
    title: "滨江",
    img: "img/map_city.png",
    spots: [
      { id: "air", name: "机场", x: 88, y: 12, text: "右上那两条跑道。", lu: 0.12, insides: [
        { id: "air-out", name: "出发层", cg: "img/cg_metro.png", lu: 0.12 },
        { id: "air-in", name: "到达口", cg: "img/cg_metro.png", lu: 0.18 }
      ] },
      { id: "tower", name: "晏辞大厦", x: 69, y: 17, text: "江对岸最高的那座。", quest: "tower", lu: 0.2, insides: [
        { id: "tower-door", name: "大厦正门", cg: "img/map_lobby.png", lu: 0.2 },
        { id: "tower-podium", name: "裙楼入口", cg: "img/cg_office.png", lu: 0.22 }
      ] },
      { id: "cbd", name: "CBD", x: 82, y: 22, text: "塔右侧那片楼。", lu: 0.16, insides: [
        { id: "cbd-street", name: "写字楼群", cg: "img/cg_company.png", lu: 0.14 },
        { id: "cbd-cafe", name: "街角咖啡", cg: "img/cg_cafe.png", lu: 0.22 }
      ] },
      { id: "mall", name: "滨湾", x: 74, y: 30, text: "江岸那栋玻璃盒子。购物中心。", lu: 0.18, insides: [
        { id: "mall-hall", name: "中庭", cg: "img/cg_mall.png", lu: 0.2 },
        { id: "mall-food", name: "餐饮层", cg: "img/cg_cafe.png", lu: 0.16 },
        { id: "mall-mart", name: "超市", cg: "img/cg_mall.png", lu: 0.1 },
        { id: "mall-park", name: "地下停车", cg: "img/cg_garage.png", lu: 0.25 }
      ] },
      { id: "river", name: "江岸", x: 58, y: 35, text: "中间这条水。", lu: 0.22, insides: [
        { id: "river-walk", name: "江岸步道", cg: "img/cg_rooftop.png", lu: 0.2 },
        { id: "river-bench", name: "长椅", cg: "img/cg_rooftop.png", lu: 0.28 }
      ] },
      { id: "old", name: "旧城", x: 26, y: 50, text: "江左那些灰瓦屋顶。", lu: 0.14, insides: [
        { id: "old-lane", name: "巷口", cg: "img/cg_rain.png", lu: 0.12 },
        { id: "old-tea", name: "旧茶馆", cg: "img/cg_tea.png", lu: 0.18 }
      ] },
      { id: "metro", name: "地铁", x: 62, y: 68, text: "近处这个站棚。", lu: 0.15, insides: [
        { id: "metro-plat", name: "站台", cg: "img/cg_metro.png", lu: 0.18 },
        { id: "metro-exit", name: "出站口", cg: "img/cg_metro.png", lu: 0.12 }
      ] }
    ]
  }
};

window.ZC_WX_CITIES = [
  { id: "binjiang", name: "滨江", sub: "CBD · 江岸", shift: 0, wind: 2, wet: 0 },
  { id: "hq", name: "晏辞总部", sub: "68 层观景", shift: -2, wind: 4, wet: -8 },
  { id: "mall", name: "滨湾", sub: "购物中心", shift: 1, wind: 2, wet: 10 }
];

window.ZC_SHOP_CATS = ["全部", "餐饮", "饮品", "日用", "服饰", "个护", "办公"];

window.ZC_STORES = [
  { id: "cafe", name: "滨湾咖啡", score: "4.8", eta: 22, tag: "咖啡", month: "2.1万" },
  { id: "desk", name: "7F便利", score: "4.6", eta: 15, tag: "便利店", month: "8904" },
  { id: "mart", name: "即达优选", score: "4.7", eta: 35, tag: "超市", month: "1.6万" }
];

window.ZC_SHOP = [
  { id: "coffee", name: "美式咖啡", price: 18, tag: "饮品", store: "cafe", sold: 1284, eta: 22, emoji: "☕", desc: "热美式。不加糖，提神用。" },
  { id: "milk", name: "拿铁", price: 22, tag: "饮品", store: "cafe", sold: 2106, eta: 22, emoji: "🥛", desc: "热拿铁。牛奶偏少，咖啡偏浓。" },
  { id: "tea", name: "柠檬茶", price: 16, tag: "饮品", store: "cafe", sold: 876, eta: 22, emoji: "🍋", desc: "冰柠檬茶。少冰去糖可备注。" },
  { id: "bento", name: "照烧鸡腿便当", price: 28, tag: "餐饮", store: "desk", sold: 964, eta: 18, emoji: "🍱", desc: "7F 便利热柜。米饭偏硬。" },
  { id: "noodle", name: "番茄鸡蛋面", price: 24, tag: "餐饮", store: "desk", sold: 633, eta: 20, emoji: "🍜", desc: "出餐快。汤会洒，骑手会竖着放。" },
  { id: "cake", name: "切件蛋糕", price: 32, tag: "餐饮", store: "cafe", sold: 412, eta: 25, emoji: "🍰", desc: "当日蛋糕。冷藏配送。" },
  { id: "salad", name: "鸡胸蔬菜碗", price: 26, tag: "餐饮", store: "desk", sold: 508, eta: 18, emoji: "🥗", desc: "少油。酱在单独小盒。" },
  { id: "umb", name: "折叠伞", price: 39, tag: "日用", store: "mart", sold: 220, eta: 40, emoji: "☂️", desc: "黑伞。江边风大，骨架偏紧。" },
  { id: "towel", name: "洗脸巾", price: 19.9, tag: "日用", store: "mart", sold: 1540, eta: 35, emoji: "🧻", desc: "抽取式。一提 80 抽。" },
  { id: "water", name: "矿泉水 12 瓶", price: 15.8, tag: "日用", store: "mart", sold: 3201, eta: 40, emoji: "💧", desc: "整箱。上楼可能分两趟。" },
  { id: "lip", name: "口红", price: 128, tag: "个护", store: "mart", sold: 86, eta: 45, emoji: "💄", desc: "哑光。色号偏豆沙。" },
  { id: "wash", name: "洗手液", price: 22, tag: "个护", store: "desk", sold: 441, eta: 15, emoji: "🧴", desc: "无香。工位用。" },
  { id: "shirt", name: "白衬衫", price: 199, tag: "服饰", store: "mart", sold: 57, eta: 50, emoji: "👔", desc: "通勤款。尺码偏正，建议拍平时码。" },
  { id: "socks", name: "短袜三双", price: 29, tag: "服饰", store: "mart", sold: 702, eta: 40, emoji: "🧦", desc: "黑白灰各一。不易起球。" },
  { id: "book", name: "笔记本", price: 16, tag: "办公", store: "desk", sold: 318, eta: 15, emoji: "📓", desc: "A5 横线。封面是灰的。" },
  { id: "pen", name: "中性笔 3 支", price: 9.9, tag: "办公", store: "desk", sold: 1544, eta: 15, emoji: "🖊️", desc: "0.5 黑。笔帽会掉。" }
];

window.ZC_CORP_SITE = {
  nav: [
    ["home", "首页"],
    ["about", "关于"],
    ["annual", "年报"],
    ["press", "采访"],
    ["news", "新闻"],
    ["org", "架构"]
  ],
  pages: {
    home: {
      kicker: "YANCI GROUP",
      title: "晏辞集团",
      body: [
        "滨江第一高楼。总部 68 层，员工约 12,400 人。估值约 1,200 亿。",
        "裙楼办公区对外，专梯、会议层、空中花园需权限。",
        "查阅 <a data-page=\"annual\">2025 年终汇报</a>，或阅读 <a data-page=\"press\">《滨江财经》专访</a>。"
      ]
    },
    about: {
      kicker: "ABOUT",
      title: "关于我们",
      body: [
        "成立于滨江。主业地产、金融与城市基建。",
        "总部在 CBD 江岸。地铁通勤可达裙楼大堂。",
        "组织关系见 <a data-page=\"org\">集团架构</a>。"
      ]
    },
    annual: {
      kicker: "ANNUAL REPORT",
      title: "2025 年终汇报",
      body: [
        "营收同比增长 6.2%。滨江江岸项目按期封顶。",
        "第四季度会议加密，跨层权限收紧。",
        "完整口径见 <a data-page=\"news\">集团新闻</a>。"
      ]
    },
    press: {
      kicker: "INTERVIEW",
      title: "《滨江财经》专访",
      body: [
        "问：下一年最大的风险？答：节奏。",
        "问：会不会放权？答：该放的会放。",
        "访谈全文与 <a data-page=\"annual\">年报</a> 互为注脚。"
      ]
    },
    news: {
      kicker: "NEWSROOM",
      title: "集团新闻",
      body: [
        "本周例会照常。基层请提前十分钟到场。",
        "加班走侧门。正面有媒体。",
        "更多背景：<a data-page=\"about\">关于我们</a>。"
      ]
    },
    org: {
      kicker: "STRUCTURE",
      title: "组织架构",
      body: [
        "董事会 — 总裁办 — 事业部 — 裙楼基层。",
        "专梯只到总裁层。你在 7F。",
        "回到 <a data-page=\"home\">首页</a>。"
      ]
    }
  }
};

window.ZC_INBOX = [
  {
    id: "archive",
    name: "档案通知",
    avatar: "档",
    tone: "sys",
    after: "hint_phone",
    time: "刚刚",
    lines: [
      { who: "them", text: "档案已更新。", after: "hint_phone" },
      { who: "them", text: "陆晏辞。晏辞集团。倒计时仍在走。", after: "hint_phone" }
    ]
  },
  {
    id: "unknown",
    name: "未知号码",
    avatar: "?",
    tone: "lu",
    ai: true,
    persona: "lu",
    after: "hint_phone",
    time: "今天",
    lines: [
      { who: "missed", text: "未接通来电", after: "hint_phone" },
      { who: "them", text: "……", after: "hint_phone" },
      { who: "them", text: "茶水间。水是热的。", after: "tea" },
      { who: "them", text: "别在公司过夜。", after: "overtime" },
      { who: "them", text: "伞收下。", after: "rain" },
      { who: "them", text: "中午。", after: "lunch" },
      { who: "them", text: "侧门。", after: "secretary" },
      { who: "them", text: "车库。", after: "track" },
      { who: "them", text: "留下。", after: "finale" }
    ],
    replies: [
      {
        after: "hint_phone",
        until: "tea",
        options: [
          { text: "哪位？", aff: 1, reply: "公司内部。" },
          { text: "不回。", aff: 0, skip: true }
        ]
      },
      {
        after: "tea",
        until: "lunch",
        options: [
          { text: "谢谢。", aff: 2, reply: "不必。" },
          { text: "陆总？", aff: 1, reply: "……嗯。" }
        ]
      },
      {
        after: "lunch",
        until: "track",
        options: [
          { text: "好。", aff: 2, reply: "准时。" },
          { text: "我有安排。", aff: -1, reply: "改掉。" }
        ]
      },
      {
        after: "track",
        options: [
          { text: "不用送。", aff: 1, reply: "送。" },
          { text: "……谢谢。", aff: 3, reply: "快上车。" }
        ]
      }
    ]
  },
  {
    id: "hr",
    name: "集团通知",
    avatar: "集",
    tone: "corp",
    after: "hint_phone",
    time: "今天",
    lines: [
      { who: "them", text: "【人事】本周例会照常。基层请提前十分钟到场。", after: "hint_phone" },
      { who: "them", text: "【行政】加班请走侧门。正面有媒体。", after: "secretary" },
      { who: "them", text: "【公告】陆总行程加密。非对口请勿在大堂停留。", after: "track" }
    ]
  },
  {
    id: "chen",
    name: "陈予",
    avatar: "陈",
    tone: "pal",
    ai: true,
    persona: "chen",
    after: "desk",
    time: "今天",
    lines: [
      { who: "them", text: "陆总刚才是不是来你工位了？？", after: "desk" },
      { who: "them", text: "他从来不下裙楼。你没事吧。", after: "desk" },
      { who: "them", text: "中午被叫走的也是你？同事群炸了。", after: "lunch" }
    ],
    replies: [
      {
        after: "desk",
        until: "lunch",
        options: [
          { text: "随便看看表格。", aff: 0, reply: "随便？他看表格从来不是随便。" },
          { text: "我也不知道。", aff: 0, reply: "……你小心点。" }
        ]
      }
    ]
  }
];
