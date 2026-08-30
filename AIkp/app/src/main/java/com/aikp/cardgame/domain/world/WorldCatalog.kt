package com.aikp.cardgame.domain.world

import com.aikp.cardgame.domain.model.SmallWorld
import com.aikp.cardgame.domain.model.WorldCharacterPreset
import com.aikp.cardgame.domain.model.WorldGenre

/**
 * 四个官方小世界：西游记、三国演义、水浒传、聊斋志异。
 * 背景与人物为题材化原创短设定（非百科/原文摘录），供选用后修改入库。
 */
object WorldCatalog {

    val officialWorlds: List<SmallWorld> = listOf(
        worldXiYou(),
        worldSanGuo(),
        worldShuiHu(),
        worldLiaoZhai()
    )

    fun worldById(id: String): SmallWorld? = officialWorlds.find { it.id == id }

    fun presetsFor(worldId: String): List<WorldCharacterPreset> = when (worldId) {
        "w_xiyou" -> CharactersXiYou.all
        "w_sanguo" -> CharactersSanGuo.all
        "w_shuihu" -> CharactersShuiHu.all
        "w_liaozhai" -> CharactersLiaoZhai.all
        else -> emptyList()
    }

    fun factionsFor(worldId: String): List<String> =
        presetsFor(worldId).map { it.faction }.filter { it.isNotBlank() }.distinct()

    private fun worldXiYou() = SmallWorld(
        id = "w_xiyou",
        title = "西游记",
        genre = WorldGenre.CLASSICS,
        sourceHint = "吴承恩",
        lore = "西天取经路，八十一难精怪拦道",
        fullLore = "唐僧奉旨西行求取真经，收悟空、八戒、沙僧与白龙马为伴。沿途有天庭仙佛点拨，也有洞府精怪劫僧。战场是取经路：山岭、流沙、火焰山与西天雷音之间的试炼。神通可变可战，但须受金箍、因果与佛门约束，不得写成无敌不死。",
        canonHint = "神通、金箍、变化、禅机；禁无敌不死与热兵器",
        coverKey = "xiyou",
        isOfficial = true
    )

    private fun worldSanGuo() = SmallWorld(
        id = "w_sanguo",
        title = "三国演义",
        genre = WorldGenre.CLASSICS,
        sourceHint = "罗贯中",
        lore = "汉末群雄逐鹿，魏蜀吴三分天下",
        fullLore = "黄巾乱后，董卓入京、诸侯讨伐，曹操挟天子令诸侯，刘备以仁义聚将，孙权坐断江东。赤壁之后三国鼎立，战场是中原、荆襄、巴蜀与江淮。计谋、阵法、水战火攻与坐骑兵刃并存，禁仙术飞升与现代枪械。",
        canonHint = "冷兵器、阵法、坐骑、权谋；禁枪械与仙术飞升",
        coverKey = "sanguo",
        isOfficial = true
    )

    private fun worldShuiHu() = SmallWorld(
        id = "w_shuihu",
        title = "水浒传",
        genre = WorldGenre.CLASSICS,
        sourceHint = "施耐庵",
        lore = "水泊梁山聚义，替天行道较武",
        fullLore = "北宋末年，好汉因冤案、义气或被逼上梁山。晁盖劫生辰纲开局，宋江聚一百零八将排座次，有马军、步军、水军与头领。战场是梁山水泊、祝家庄、曾头市与征途关隘。拳脚兵刃、水战弓马皆可，禁法术飞升与火器。公孙胜道术按“呼风借势”弱化，不得无敌。",
        canonHint = "兵刃、拳脚、水战、义气；禁飞升与枪炮",
        coverKey = "shuihu",
        isOfficial = true
    )

    private fun worldLiaoZhai() = SmallWorld(
        id = "w_liaozhai",
        title = "聊斋志异",
        genre = WorldGenre.CLASSICS,
        sourceHint = "蒲松龄",
        lore = "花妖狐魅入世，书生侠客夜遇奇缘",
        fullLore = "蒲松龄笔下的狐鬼花妖与人间交错：兰若寺、画皮、婴宁之笑、席方平告阴司。战场是夜巷、废寺、园林与冥司边缘。可写狐术、鬼影、剑客与科举冷暖，须守人情分寸，禁无敌不死、秒杀与现代武器。",
        canonHint = "狐魅、鬼影、剑客、人情；禁无敌秒杀与热兵器",
        coverKey = "liaozhai",
        isOfficial = true
    )
}
