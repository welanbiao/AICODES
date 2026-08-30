package com.aikp.cardgame.domain.ai

import com.aikp.cardgame.domain.rules.GameLimits

/**
 * 战报话术：从家族修仙斗法与魔门算计斗法中提炼结构，不抄原文。
 * 每段 summary / narrative 须在 100~1000 字。
 */
object BattleNarration {

    const val STYLE_GUIDE: String = """
文风（必须遵守，禁止写成口号短句）：
- 每段 narrative、summary 均须 100~1000 字（汉字计）。不足 100 视为失败；超过 1000 自行删减。
- 回合按五拍写：气机对上 → 手段落地 → 护体/身躯反应 → 换招或退距 → 这一击划不划算。
- 禁无敌/无限/秒杀/必胜。越界技能被小世界规则压弱或失效，写成「落空」「只余声势」。

【路数甲·落地见血】适合刀兵、符器、近身：
先手试探不亮底牌；第二拍写护体碎裂、法器暗澹、吐血、退开半丈；第三拍写符箓/兵器换命，并算「两败俱伤值不值」。修为差只写层数压制与节奏乱，不写一招定生死。旁白冷静，可夹一句暗道。

【路数乙·先算后打】适合谋略、神通、气机：
出手前先算得失（诱饵、偷袭、夺回主动权）；写气机捕捉、手段对撞、轰然一散；打完立刻复盘：成则拿先机，败则最多亏一层护体。底牌点到为止，不写永久控制。

【收束】
胜负由破绽、耗尽、地利或世界规则决定。胜者收势，不赶尽杀绝。
""".trimIndent()

    data class Fighter(val name: String, val skill: String, val lore: String)

    fun fromPrompt(prompt: String, winner: String): Triple<String, List<Triple<Int, String, String>>, Pair<List<String>, List<String>>> {
        val world = after(prompt, "小世界：").substringBefore("（").substringBefore("\n").trim().ifBlank { "小世界" }
        val field = after(prompt, "战场：").substringBefore("\n").trim().ifBlank { "双方同一战场" }
        val defenders = parseSide(between(prompt, "守擂方：", "挑战方："))
        val challengers = parseSide(between(prompt, "挑战方：", "只输出"))
        val d = defenders.firstOrNull() ?: Fighter("守擂者", "护体", "")
        val c = challengers.firstOrNull() ?: Fighter("挑战者", "试探", "")
        val defenderWins = winner == "DEFENDER"
        val rounds = listOf(
            Triple(1, roundOne(world, field, d, c), "entrance"),
            Triple(2, roundTwo(world, d, c), "burst"),
            Triple(3, roundThree(world, d, c, defenderWins), if (defenderWins) "guard" else "slash")
        )
        val summary = summaryOf(world, field, d, c, defenderWins)
        val entrance = listOf(
            "${d.name}踏场，气机先收三分，护体未全亮。",
            "${c.name}破空入阵，先手试探，不肯把底牌一次打完。"
        )
        val common = listOf("气机对撞", "护体金光一亮一暗", "场地只认本世界手段")
        return Triple(summary, rounds, entrance to common)
    }

    private fun summaryOf(world: String, field: String, d: Fighter, c: Fighter, defenderWins: Boolean): String {
        val end = if (defenderWins) {
            "几十息后先乱节奏的是${c.name}。${d.name}没有赶尽杀绝，收势定胜——地利只帮了一手，真正把胜负钉住的，是对方把底牌打早了。"
        } else {
            "${c.name}在同一套规则里找到破绽，${d.name}护体裂开后只能换退。挑战方同样不赶尽杀绝，点到为止，胜负已明。"
        }
        return GameLimits.clampBattleText(
            "【$world】$field ${d.name}守擂，${c.name}来挑战。开场双方都只拿气机量距离，谁也不肯先亮压箱底的手段。" +
                "${d.name}以「${d.skill}」占位，${c.name}用「${c.skill}」拆招。交锋里护体碎、吐血、退开，都是代价，不是结局。" +
                "越界的花活被世界规则压成空响。$end"
        )
    }

    private fun roundOne(world: String, field: String, d: Fighter, c: Fighter): String =
        GameLimits.clampBattleText(
            "双方踏入$world。$field 气压先压在脚底，守擂方只有轻微地利，远不够定胜。" +
                "${d.name}把气机收进护体里，先不亮全貌；${c.name}对上这股气息，也只伸出一指试探。" +
                "「${d.skill}」刚起半寸，${c.name}便以「${c.skill}」去撞。金光一亮一暗，谁也没把第二手打出来。" +
                "这一息只是量距离：谁先急，谁先把破绽送给对方。暗道一声——此时亮底牌，太不划算。"
        )

    private fun roundTwo(world: String, d: Fighter, c: Fighter): String =
        GameLimits.clampBattleText(
            "${d.name}第二手不再留情，「${d.skill}」直取中宫。${c.name}护体被震得发闷，退开半丈，掌心已有血意，却在退势里甩出「${c.skill}」。" +
                "两道手段在$world的规则里对撞，轰然散成碎屑，法器光芒暗澹，符光也只剩下残响。" +
                "若有越界的招式，此刻只会落空，只余声势，连护体都肯不动。" +
                "双方各吐一口浊气：这一击换得见血，再硬撼就要把压箱底的手段赔进去。先算得失的人，才会把下一手留到破绽真正出现。"
        )

    private fun roundThree(world: String, d: Fighter, c: Fighter, defenderWins: Boolean): String {
        val close = if (defenderWins) {
            "${c.name}想抢先机，气机却被战场压矮半分，「${c.skill}」来得猛，落点却虚。" +
                "${d.name}借这半息把「${d.skill}」送进破绽，护体寸寸裂开的是挑战方。${c.name}只能换退，再打下去便是两败俱伤。" +
                "守擂方没有把地利写成必胜，只是用这半息把节奏钉死。${d.name}收势，不取首级。险胜，胜在先机，不在口号。"
        } else {
            "${d.name}把地利当成胜券，「${d.skill}」打满却露出收势的空当。" +
                "${c.name}算过了：最多亏一层护体，值得一搏。于是「${c.skill}」专打那道裂口，守擂护体先乱。" +
                "世界规则不帮任何越界的狠招，只认贴合$world的手段。${d.name}退开，承认先机已失。挑战方点到为止，逆转定胜。"
        }
        return GameLimits.clampBattleText(close)
    }

    private fun parseSide(block: String): List<Fighter> =
        block.lines().mapNotNull { line ->
            val t = line.trim().removePrefix("-").trim()
            if (t.isEmpty() || t.startsWith("（")) return@mapNotNull null
            val name = t.substringBefore("｜").substringBefore("|").trim().ifBlank { return@mapNotNull null }
            val lore = t.substringAfter("｜", "").substringBefore("｜").trim()
            val skillBlob = t.substringAfter("技能：", "").substringBefore("｜").trim()
            val skill = skillBlob.split("；", ";", "、")
                .map { it.substringBefore("：").substringBefore(":").trim() }
                .firstOrNull { it.isNotEmpty() }
                ?: "护体"
            Fighter(name.take(12), skill.take(8), lore)
        }

    private fun after(prompt: String, label: String): String {
        val i = prompt.indexOf(label)
        return if (i < 0) "" else prompt.substring(i + label.length)
    }

    private fun between(prompt: String, a: String, b: String): String {
        val left = prompt.indexOf(a)
        if (left < 0) return ""
        val start = left + a.length
        val right = prompt.indexOf(b, start)
        return if (right < 0) prompt.substring(start) else prompt.substring(start, right)
    }
}
