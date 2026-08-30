package com.aikp.cardgame.domain.xiaoqian

import com.aikp.cardgame.domain.model.CardGrade
import com.aikp.cardgame.domain.model.SkillDraft

/**
 * 小千世界：从热门小说题材提炼的合规预设（原创短设定，非原文摘录）。
 */
data class XiaoQianWorld(
    val id: String,
    val novelTitle: String,
    val tagline: String,
    val tags: List<String>,
    val characters: List<XiaoQianCharacter>,
    val battlefields: List<XiaoQianBattlefield>
)

data class XiaoQianCharacter(
    val id: String,
    val name: String,
    val lore: String,
    val skills: List<SkillDraft>,
    val suggestedGrade: CardGrade = CardGrade.R,
    val roleHint: String = ""
)

data class XiaoQianBattlefield(
    val id: String,
    val title: String,
    val description: String
)
