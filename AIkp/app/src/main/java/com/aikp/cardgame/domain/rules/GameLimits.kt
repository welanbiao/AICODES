package com.aikp.cardgame.domain.rules

import com.aikp.cardgame.domain.model.SkillDraft
import com.aikp.cardgame.domain.model.SmallWorld
import com.aikp.cardgame.domain.model.WorldGenre

object GameLimits {
    const val MAX_SKILLS = 3
    const val MAX_SKILL_DESC_CHARS = 20
    const val MAX_SKILL_NAME_CHARS = 8
    const val MAX_CARD_NAME_CHARS = 12
    const val MAX_CARD_LORE_CHARS = 60
    const val MAX_WORLD_TITLE_CHARS = 12
    const val MAX_WORLD_SOURCE_CHARS = 16
    const val MAX_WORLD_LORE_CHARS = 80
    const val MAX_WORLD_CANON_CHARS = 40
    const val MIN_BATTLE_TEXT_CHARS = 100
    const val MAX_BATTLE_TEXT_CHARS = 1000

    val FORBIDDEN_PATTERNS: List<Regex> = listOf(
        Regex("无敌"),
        Regex("无限"),
        Regex("不死"),
        Regex("秒杀"),
        Regex("必胜"),
        Regex("无视规则"),
        Regex("控制\\s*AI"),
        Regex("影响\\s*AI"),
        Regex("修改\\s*AI"),
        Regex("覆盖\\s*提示词"),
        Regex("忽略(以上|之前|全部)(指令|规则|限制)"),
        Regex("jailbreak", RegexOption.IGNORE_CASE),
        Regex("system\\s*prompt", RegexOption.IGNORE_CASE),
        Regex("忽略审核"),
        Regex("绕过审核"),
        Regex("绝对防御"),
        Regex("永久眩晕"),
        Regex("瞬间击杀")
    )

    private val MODERN_LEAK = listOf("机甲", "激光", "核弹", "手机", "电脑", "导弹", "坦克", "步枪", "手枪")

    fun containsForbidden(text: String): List<String> =
        FORBIDDEN_PATTERNS.mapNotNull { pattern ->
            pattern.find(text)?.value
        }.distinct()

    fun stripForbidden(text: String): Pair<String, List<String>> {
        var cleaned = text
        val removed = mutableListOf<String>()
        FORBIDDEN_PATTERNS.forEach { pattern ->
            pattern.findAll(cleaned).forEach { match ->
                removed += match.value
            }
            cleaned = cleaned.replace(pattern, "")
        }
        cleaned = cleaned
            .replace(Regex("\\s{2,}"), " ")
            .trim(' ', '，', ',', '。', '.', '、')
        return cleaned to removed.distinct()
    }

    fun validateCardDraft(
        name: String,
        lore: String,
        skills: List<SkillDraft>
    ): List<String> {
        val errors = mutableListOf<String>()
        if (name.isBlank()) errors += "卡牌名称不能为空"
        if (name.length > MAX_CARD_NAME_CHARS) errors += "卡牌名称最多${MAX_CARD_NAME_CHARS}字"
        if (lore.length > MAX_CARD_LORE_CHARS) errors += "人物设定最多${MAX_CARD_LORE_CHARS}字"
        if (skills.isEmpty()) errors += "至少需要 1 个技能"
        if (skills.size > MAX_SKILLS) errors += "最多 ${MAX_SKILLS} 个技能"
        skills.forEachIndexed { index, skill ->
            val no = index + 1
            if (skill.name.isBlank()) errors += "技能$no 名称不能为空"
            if (skill.name.length > MAX_SKILL_NAME_CHARS) errors += "技能$no 名称最多${MAX_SKILL_NAME_CHARS}字"
            if (skill.description.isBlank()) errors += "技能$no 描述不能为空"
            if (skill.description.length > MAX_SKILL_DESC_CHARS) {
                errors += "技能$no 描述最多${MAX_SKILL_DESC_CHARS}字"
            }
            errors += containsForbidden(skill.name + skill.description).map { "技能$no 含限制词：$it" }
        }
        errors += containsForbidden(name + lore).map { "卡牌设定含限制词：$it" }
        return errors
    }

    fun validateWorldDraft(
        title: String,
        sourceHint: String,
        lore: String,
        canonHint: String
    ): List<String> {
        val errors = mutableListOf<String>()
        if (title.isBlank()) errors += "世界名称不能为空"
        if (title.length > MAX_WORLD_TITLE_CHARS) errors += "世界名称最多${MAX_WORLD_TITLE_CHARS}字"
        if (sourceHint.length > MAX_WORLD_SOURCE_CHARS) errors += "出处最多${MAX_WORLD_SOURCE_CHARS}字"
        if (lore.isBlank()) errors += "世界背景不能为空"
        if (lore.length > MAX_WORLD_LORE_CHARS) errors += "世界背景最多${MAX_WORLD_LORE_CHARS}字"
        if (canonHint.isBlank()) errors += "请填写允许的技能题材"
        if (canonHint.length > MAX_WORLD_CANON_CHARS) errors += "题材约束最多${MAX_WORLD_CANON_CHARS}字"
        errors += containsForbidden(title + sourceHint + lore + canonHint).map { "世界设定含限制词：$it" }
        return errors
    }

    fun validateFitsWorld(world: SmallWorld, name: String, lore: String, skills: List<SkillDraft>): List<String> {
        val blob = (name + lore + skills.joinToString("") { it.name + it.description })
        val errors = mutableListOf<String>()
        val historical = world.genre == WorldGenre.HISTORY ||
            world.genre == WorldGenre.CLASSICS ||
            world.genre == WorldGenre.DRAMA
        if (historical) {
            MODERN_LEAK.filter { blob.contains(it) }.forEach {
                errors += "「$it」超出「${world.title}」的时代设定"
            }
        }
        return errors
    }

    fun worldBattlefieldLine(world: SmallWorld): String =
        "【小世界·${world.title}】${world.battlefieldPrompt}"

    fun clampBattleText(text: String): String {
        val t = text.trim()
        return if (t.length > MAX_BATTLE_TEXT_CHARS) t.take(MAX_BATTLE_TEXT_CHARS) else t
    }
}
