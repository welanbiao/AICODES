// 歌词数据（时间戳单位：秒）
const LYRICS = {
  s1: [
    { time: 0, text: '故事的小黄花 从出生那年就飘着' },
    { time: 8, text: '童年的荡秋千 随记忆一直晃到现在' },
    { time: 16, text: 'Re So So Si Do Si La So La Si Si Si Si La Si La So' },
    { time: 24, text: '吹着前奏望着天空 我想起花瓣试着掉落' },
    { time: 32, text: '为你翘课的那一天 花落的那一天' },
    { time: 40, text: '教室的那一间 我怎么看不见' },
    { time: 48, text: '消失的下雨天 我好想再淋一遍' },
    { time: 56, text: '没想到失去的勇气我还留着' },
    { time: 64, text: '好想再问一遍 你会等待还是离开' },
    { time: 72, text: '刮风这天我试过握着你手' },
    { time: 80, text: '但偏偏雨渐渐大到我看你不见' },
    { time: 88, text: '还要多久我才能在你身边' },
    { time: 96, text: '等到放晴的那天也许我会比较好一点' },
    { time: 104, text: '从前从前有个人爱你很久' },
    { time: 112, text: '但偏偏风渐渐把距离吹得好远' },
    { time: 120, text: '好不容易又能再多爱一天' },
    { time: 128, text: '但故事的最后你好像还是说了拜拜' },
  ],
  s2: [
    { time: 0, text: '窗外的麻雀在电线杆上多嘴' },
    { time: 8, text: '你说这一句很有夏天的感觉' },
    { time: 16, text: '手中的铅笔在纸上来来回回' },
    { time: 24, text: '我用几行字形容你是我的谁' },
    { time: 32, text: '秋刀鱼的滋味猫跟你都想了解' },
    { time: 40, text: '初恋的香味就这样被我们寻回' },
    { time: 48, text: '那温暖的阳光像刚摘的鲜艳草莓' },
    { time: 56, text: '你说你舍不得吃掉这一种感觉' },
    { time: 64, text: '雨下整夜我的爱溢出就像雨水' },
    { time: 72, text: '院子落叶跟我的思念厚厚一叠' },
    { time: 80, text: '几句是非也无法将我的热情冷却' },
    { time: 88, text: '你出现在我诗的每一页' },
    { time: 96, text: '雨下整夜我的爱溢出就像雨水' },
    { time: 104, text: '窗台蝴蝶像诗里纷飞的美丽章节' },
    { time: 112, text: '我接着写把永远爱你写进诗的结尾' },
    { time: 120, text: '你是我唯一想要的了解' },
  ],
  s6: [
    { time: 0, text: '这一路上走走停停' },
    { time: 6, text: '顺着少年漂流的痕迹' },
    { time: 12, text: '迈出车站的前一刻' },
    { time: 18, text: '竟有些犹豫' },
    { time: 24, text: '不禁笑这近乡情怯' },
    { time: 30, text: '仍无可避免' },
    { time: 36, text: '而长野的天依旧那么暖' },
    { time: 42, text: '风吹起了从前' },
    { time: 48, text: '从前初识这世间' },
    { time: 54, text: '万般流连' },
    { time: 60, text: '看着天边似在近眼前' },
    { time: 66, text: '也甘愿赴汤蹈火去走它一遍' },
    { time: 72, text: '如今走过这世间' },
    { time: 78, text: '万般过路' },
    { time: 84, text: '不及你初识人间' },
    { time: 90, text: '我曾难自拔于世界之大' },
    { time: 96, text: '也沉溺于其中梦话' },
    { time: 102, text: '不得真假不做挣扎不惧笑话' },
    { time: 108, text: '我曾将青春翻涌成她' },
    { time: 114, text: '也曾指尖弹出盛夏' },
    { time: 120, text: '心之所动且就随缘去吧' },
    { time: 126, text: '逆着光行走任风吹雨打' },
  ],
  s11: [
    { time: 0, text: '都 是勇敢的' },
    { time: 4, text: '你额头的伤口 你的不同 你犯的错' },
    { time: 10, text: '都 不必隐藏' },
    { time: 14, text: '你破旧的玩偶 你的面具 你的自我' },
    { time: 20, text: '他们说 要带着光 驯服每一头怪兽' },
    { time: 26, text: '他们说 要缝好你的伤 没有人爱小丑' },
    { time: 32, text: '为何不等 就让他们 去说' },
    { time: 38, text: '爱你孤身走暗巷 爱你不跪的模样' },
    { time: 44, text: '爱你对峙过绝望 不肯哭一场' },
    { time: 50, text: '爱你破烂的衣裳 却敢堵命运的枪' },
    { time: 56, text: '爱你和我那么像 缺口都一样' },
    { time: 62, text: '去吗 配吗 这褴褛的披风' },
    { time: 68, text: '战吗 战啊 以最卑微的梦' },
    { time: 74, text: '致那黑夜中的呜咽与怒吼' },
    { time: 80, text: '谁说站在光里的才算英雄' },
  ],
};

// 为没有专属歌词的歌曲生成通用歌词
function getLyrics(song) {
  if (LYRICS[song.id]) return LYRICS[song.id];

  const templates = [
    '♪ 前奏缓缓响起',
    `♪ ${song.name}`,
    `♪ ${song.artist} 倾情演绎`,
    '♪ 让旋律带走所有烦恼',
    '♪ 闭上眼睛感受这一刻',
    '♪ 音乐是灵魂的语言',
    '♪ 每个音符都是故事',
    '♪ 在这首歌里找到自己',
    '♪ 让心跳跟着节拍跳动',
    '♪ 云村音乐 仿真体验',
    '♪ 感谢你的聆听',
    '♪ 愿音乐与你同在',
  ];
  const interval = Math.max(6, Math.floor(song.duration / templates.length));
  return templates.map((text, i) => ({ time: i * interval, text }));
}

function getCurrentLyricIndex(lyrics, currentTime) {
  let idx = 0;
  for (let i = 0; i < lyrics.length; i++) {
    if (currentTime >= lyrics[i].time) idx = i;
    else break;
  }
  return idx;
}
