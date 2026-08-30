package com.aikp.cardgame.domain.xiaoqian

import com.aikp.cardgame.domain.model.CardGrade
import com.aikp.cardgame.domain.model.SkillDraft

/**
 * 预设库：角色/技能/战场均已压到游戏限制内，并避开无敌无限等禁词。
 * 内容为题材化原创短句，仅作玩法灵感，不构成小说原文复用。
 */
object XiaoQianCatalog {

    val worlds: List<XiaoQianWorld> = listOf(
        worldQingShan(),
        worldChuShengMoMen(),
        worldExtraFanHua()
    )

    fun worldById(id: String): XiaoQianWorld? = worlds.find { it.id == id }

    private fun worldQingShan() = XiaoQianWorld(
        id = "xq_qingshan",
        novelTitle = "青山",
        tagline = "医馆学徒卷入朝堂谍影，冰流与侠气并存",
        tags = listOf("权谋", "医术", "谍战", "异世"),
        characters = listOf(
            XiaoQianCharacter(
                id = "xq_qs_chenji",
                name = "陈迹",
                lore = "冷静求生的异世医徒",
                skills = listOf(
                    SkillDraft("望诊", "看破伤势破绽"),
                    SkillDraft("冰流", "凝寒暂滞对手"),
                    SkillDraft("后手", "危局留反击隙")
                ),
                suggestedGrade = CardGrade.SR,
                roleHint = "主角·智谋"
            ),
            XiaoQianCharacter(
                id = "xq_qs_zhangxia",
                name = "张夏",
                lore = "敢爱敢恨的京城盟友",
                skills = listOf(
                    SkillDraft("直言", "震慑动摇人心"),
                    SkillDraft("联手", "协同强化攻势")
                ),
                suggestedGrade = CardGrade.R,
                roleHint = "伙伴"
            ),
            XiaoQianCharacter(
                id = "xq_qs_yao",
                name = "姚太医",
                lore = "深藏门径的医馆老人",
                skills = listOf(
                    SkillDraft("药引", "调息稳住己方"),
                    SkillDraft("传道", "点破一门路径")
                ),
                suggestedGrade = CardGrade.SR,
                roleHint = "引路人"
            ),
            XiaoQianCharacter(
                id = "xq_qs_wuyun",
                name = "乌云",
                lore = "能互通心意的黑猫",
                skills = listOf(
                    SkillDraft("夜巡", "探明潜藏杀机"),
                    SkillDraft("扑影", "迅捷撕开防线")
                ),
                suggestedGrade = CardGrade.R,
                roleHint = "灵伴"
            ),
            XiaoQianCharacter(
                id = "xq_qs_yunyang",
                name = "云羊",
                lore = "行事果决的密谍之刃",
                skills = listOf(
                    SkillDraft("暗线", "布置情报陷阱"),
                    SkillDraft("截杀", "突袭打断施法")
                ),
                suggestedGrade = CardGrade.SR,
                roleHint = "密谍"
            )
        ),
        battlefields = listOf(
            XiaoQianBattlefield("xq_qs_f_asylum", "青山长廊", "幽暗病房长廊杀机潜行"),
            XiaoQianBattlefield("xq_qs_f_clinic", "太平医馆", "药香弥漫的学徒医馆"),
            XiaoQianBattlefield("xq_qs_f_wangfu", "靖王偏殿", "权谋交织的王府诊室"),
            XiaoQianBattlefield("xq_qs_f_alley", "红衣暗巷", "赌坊背后的密谍巷战"),
            XiaoQianBattlefield("xq_qs_f_dream", "青山梦境", "梦中授剑的虚境战场")
        )
    )

    private fun worldChuShengMoMen() = XiaoQianWorld(
        id = "xq_chusheng",
        novelTitle = "苟在初圣魔门当人材",
        tagline = "魔门人材遍地，苟道布局步步为营",
        tags = listOf("修仙", "魔门", "苟道", "智斗"),
        characters = listOf(
            XiaoQianCharacter(
                id = "xq_cs_luyang",
                name = "吕阳",
                lore = "谨慎布局的魔门弟子",
                skills = listOf(
                    SkillDraft("苟道", "避锋蓄力再战"),
                    SkillDraft("敛气", "掩藏气息误导"),
                    SkillDraft("后手咒", "失手也能反制")
                ),
                suggestedGrade = CardGrade.SSR,
                roleHint = "主角·苟道"
            ),
            XiaoQianCharacter(
                id = "xq_cs_yusu",
                name = "玉素真",
                lore = "合欢殿危险的师姐",
                skills = listOf(
                    SkillDraft("媚杀", "扰乱对手心神"),
                    SkillDraft("收割", "乘胜压制资源")
                ),
                suggestedGrade = CardGrade.SR,
                roleHint = "早期关卡"
            ),
            XiaoQianCharacter(
                id = "xq_cs_liuxin",
                name = "刘信",
                lore = "把同门当材料的接引者",
                skills = listOf(
                    SkillDraft("诱饵", "以利诱入圈套"),
                    SkillDraft("精炼", "削弱对手根基")
                ),
                suggestedGrade = CardGrade.R,
                roleHint = "剥削者"
            ),
            XiaoQianCharacter(
                id = "xq_cs_zhao",
                name = "赵旭河",
                lore = "善功殿精于算计的执事",
                skills = listOf(
                    SkillDraft("放贷", "迟滞对手行动"),
                    SkillDraft("泡沫", "虚势扰乱判断")
                ),
                suggestedGrade = CardGrade.R,
                roleHint = "资本局"
            ),
            XiaoQianCharacter(
                id = "xq_cs_sisui",
                name = "司祟",
                lore = "神秘点拨的导师级存在",
                skills = listOf(
                    SkillDraft("点破", "揭示战场关键"),
                    SkillDraft("护道", "短暂稳住阵脚")
                ),
                suggestedGrade = CardGrade.SSR,
                roleHint = "导师"
            )
        ),
        battlefields = listOf(
            XiaoQianBattlefield("xq_cs_f_gate", "初圣外门", "人材遍地的魔门外门广场"),
            XiaoQianBattlefield("xq_cs_f_hehuan", "合欢殿廊", "香雾缭绕的试炼殿廊"),
            XiaoQianBattlefield("xq_cs_f_butian", "补天峰径", "接引新人的险峰小径"),
            XiaoQianBattlefield("xq_cs_f_shangong", "善功殿堂", "规则与借贷交织的殿中"),
            XiaoQianBattlefield("xq_cs_f_panlong", "盘龙岛礁", "黑吃黑的孤岛布局场")
        )
    )

    /** 额外热门题材包，丰富小千世界货架 */
    private fun worldExtraFanHua() = XiaoQianWorld(
        id = "xq_fanhua",
        novelTitle = "繁华修真辑",
        tagline = "都市与宗门夹缝中的热门人设合集",
        tags = listOf("合集", "热门", "速开"),
        characters = listOf(
            XiaoQianCharacter(
                id = "xq_fh_guixu",
                name = "归墟行者",
                lore = "游走秘境边缘的拾荒客",
                skills = listOf(
                    SkillDraft("拾遗", "搜刮战场残势"),
                    SkillDraft("遁烟", "拉开交锋距离")
                ),
                suggestedGrade = CardGrade.R,
                roleHint = "速开"
            ),
            XiaoQianCharacter(
                id = "xq_fh_qingluan",
                name = "青鸾使",
                lore = "传讯四方的宗门信使",
                skills = listOf(
                    SkillDraft("传羽", "加速己方节奏"),
                    SkillDraft("惊鸣", "打断对手咏唱")
                ),
                suggestedGrade = CardGrade.R,
                roleHint = "辅助"
            )
        ),
        battlefields = listOf(
            XiaoQianBattlefield("xq_fh_f_market", "坊市夜灯", "灵物叫卖的喧闹夜市"),
            XiaoQianBattlefield("xq_fh_f_rift", "秘境裂口", "时稳时裂的边缘战场")
        )
    )
}
