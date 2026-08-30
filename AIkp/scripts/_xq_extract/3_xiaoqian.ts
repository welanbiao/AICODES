export type XqSkill = { name: string; description: string }
export type XqCharacter = {
  id: string
  name: string
  lore: string
  skills: XqSkill[]
  grade: string
  roleHint: string
}
export type XqField = { id: string; title: string; description: string }
export type XqWorld = {
  id: string
  novelTitle: string
  tagline: string
  tags: string[]
  characters: XqCharacter[]
  battlefields: XqField[]
}

/** 题材化原创短设定，非小说原文 */
export const xiaoQianWorlds: XqWorld[] = [
  {
    id: 'xq_qingshan',
    novelTitle: '青山',
    tagline: '医馆学徒卷入朝堂谍影，冰流与侠气并存',
    tags: ['权谋', '医术', '谍战'],
    characters: [
      {
        id: 'xq_qs_chenji',
        name: '陈迹',
        lore: '冷静求生的异世医徒',
        grade: 'SR',
        roleHint: '主角·智谋',
        skills: [
          { name: '望诊', description: '看破伤势破绽' },
          { name: '冰流', description: '凝寒暂滞对手' },
          { name: '后手', description: '危局留反击隙' },
        ],
      },
      {
        id: 'xq_qs_zhangxia',
        name: '张夏',
        lore: '敢爱敢恨的京城盟友',
        grade: 'R',
        roleHint: '伙伴',
        skills: [
          { name: '直言', description: '震慑动摇人心' },
          { name: '联手', description: '协同强化攻势' },
        ],
      },
      {
        id: 'xq_qs_yao',
        name: '姚太医',
        lore: '深藏门径的医馆老人',
        grade: 'SR',
        roleHint: '引路人',
        skills: [
          { name: '药引', description: '调息稳住己方' },
          { name: '传道', description: '点破一门路径' },
        ],
      },
    ],
    battlefields: [
      { id: 'xq_qs_f_clinic', title: '太平医馆', description: '药香弥漫的学徒医馆' },
      { id: 'xq_qs_f_wangfu', title: '靖王偏殿', description: '权谋交织的王府诊室' },
      { id: 'xq_qs_f_dream', title: '青山梦境', description: '梦中授剑的虚境战场' },
    ],
  },
  {
    id: 'xq_chusheng',
    novelTitle: '苟在初圣魔门当人材',
    tagline: '魔门人材遍地，苟道布局步步为营',
    tags: ['修仙', '魔门', '苟道'],
    characters: [
      {
        id: 'xq_cs_luyang',
        name: '吕阳',
        lore: '谨慎布局的魔门弟子',
        grade: 'SSR',
        roleHint: '主角·苟道',
        skills: [
          { name: '苟道', description: '避锋蓄力再战' },
          { name: '敛气', description: '掩藏气息误导' },
          { name: '后手咒', description: '失手也能反制' },
        ],
      },
      {
        id: 'xq_cs_yusu',
        name: '玉素真',
        lore: '合欢殿危险的师姐',
        grade: 'SR',
        roleHint: '早期关卡',
        skills: [
          { name: '媚杀', description: '扰乱对手心神' },
          { name: '收割', description: '乘胜压制资源' },
        ],
      },
      {
        id: 'xq_cs_liuxin',
        name: '刘信',
        lore: '把同门当材料的接引者',
        grade: 'R',
        roleHint: '剥削者',
        skills: [
          { name: '诱饵', description: '以利诱入圈套' },
          { name: '精炼', description: '削弱对手根基' },
        ],
      },
    ],
    battlefields: [
      { id: 'xq_cs_f_gate', title: '初圣外门', description: '人材遍地的魔门外门广场' },
      { id: 'xq_cs_f_hehuan', title: '合欢殿廊', description: '香雾缭绕的试炼殿廊' },
      { id: 'xq_cs_f_panlong', title: '盘龙岛礁', description: '黑吃黑的孤岛布局场' },
    ],
  },
]
