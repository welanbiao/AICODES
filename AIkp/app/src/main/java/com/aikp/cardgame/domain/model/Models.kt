package com.aikp.cardgame.domain.model

import kotlinx.serialization.Serializable

@Serializable
enum class CardGrade(val label: String, val score: Int) {
    N("N", 10),
    R("R", 25),
    SR("SR", 50),
    SSR("SSR", 80),
    UR("UR", 100);

    companion object {
        fun fromLabel(value: String): CardGrade =
            entries.firstOrNull { it.name.equals(value, true) || it.label.equals(value, true) }
                ?: N
    }
}

@Serializable
enum class MatchMode(val label: String, val teamSize: Int) {
    ONE_V_ONE("一对一", 1),
    THREE_V_THREE("三对三", 3)
}

@Serializable
enum class MatchRole {
    DEFENDER,
    CHALLENGER
}

@Serializable
enum class WorldGenre(val label: String, val coverKey: String) {
    HISTORY("历史国度", "history"),
    CLASSICS("四大名著", "classics"),
    DRAMA("著名剧集", "drama"),
    NOVEL("热门小说", "novel"),
    CUSTOM("自定义", "novel");

    companion object {
        fun fromLabel(value: String): WorldGenre =
            entries.firstOrNull { it.name.equals(value, true) || it.label == value } ?: CUSTOM
    }
}

@Serializable
enum class MedalType(val title: String, val description: String) {
    FIRST_CARD("初创者", "创建第一张卡牌"),
    FIRST_WIN("破阵", "赢得首场排位"),
    ONLINE_WIN("联阵", "赢得首场真人联机排位"),
    WORLD_MAKER("创世", "创建第一个小世界"),
    WORLD_GUEST("入世", "进入官方小世界并领取角色"),
    STREAK_3("连胜三", "连胜三场排位"),
    STREAK_5("五连冠", "连胜五场排位"),
    SSR_OWNER("辉光", "拥有一张 SSR 及以上卡牌"),
    COLLECTOR_5("集结", "拥有五张卡牌"),
    GLORY_100("荣耀百", "排位荣耀分达到 100"),
    GLORY_300("荣耀三百", "排位荣耀分达到 300")
}

@Serializable
data class SkillDraft(
    val name: String = "",
    val description: String = ""
)

@Serializable
data class SmallWorld(
    val id: String,
    val title: String,
    val genre: WorldGenre,
    val sourceHint: String,
    val lore: String,
    val reviewedLore: String = lore,
    /** Longer encyclopedia-style setting for the world screen; battlefield still uses lore. */
    val fullLore: String = lore,
    val canonHint: String,
    val coverKey: String = genre.coverKey,
    val isOfficial: Boolean = false,
    val creatorId: String? = null,
    val createdAt: Long = System.currentTimeMillis()
) {
    val battlefieldPrompt: String get() = reviewedLore.ifBlank { lore }
}

@Serializable
data class WorldCharacterPreset(
    val id: String,
    val worldId: String,
    val name: String,
    val lore: String,
    val skills: List<SkillDraft>,
    val suggestedGrade: CardGrade = CardGrade.R,
    val roleHint: String = "",
    val faction: String = "",
    val nickname: String = "",
    val fullLore: String = lore
)

@Serializable
data class Card(
    val id: String,
    val name: String,
    val lore: String,
    val skills: List<SkillDraft>,
    val worldId: String = "",
    val worldTitle: String = "",
    val imageUri: String? = null,
    val createGrade: CardGrade = CardGrade.N,
    val battleGrade: CardGrade = CardGrade.N,
    val gloryGrade: CardGrade = CardGrade.N,
    val wins: Int = 0,
    val losses: Int = 0,
    val createdAt: Long = System.currentTimeMillis(),
    val reviewedLore: String = lore,
    val reviewedSkills: List<SkillDraft> = skills
) {
    val overallGrade: CardGrade
        get() {
            val avg = (createGrade.score + battleGrade.score + gloryGrade.score) / 3.0
            return when {
                avg >= 90 -> CardGrade.UR
                avg >= 70 -> CardGrade.SSR
                avg >= 45 -> CardGrade.SR
                avg >= 25 -> CardGrade.R
                else -> CardGrade.N
            }
        }
}

@Serializable
data class PlayerProfile(
    val id: String = "local_player",
    /** Stable ID used for online matchmaking / ladder. */
    val onlineId: String = "",
    val username: String = "",
    val authToken: String = "",
    val nickname: String = "旅人",
    val gloryScore: Int = 0,
    val winStreak: Int = 0,
    val medals: List<MedalType> = emptyList(),
    val rankPoints: Int = 0
) {
    val isLoggedIn: Boolean get() = authToken.isNotBlank() && onlineId.isNotBlank()

    val playerTier: String
        get() = when {
            rankPoints >= 800 -> "传奇"
            rankPoints >= 500 -> "大师"
            rankPoints >= 300 -> "钻石"
            rankPoints >= 150 -> "铂金"
            rankPoints >= 60 -> "黄金"
            else -> "新锐"
        }
}

@Serializable
data class BattleRound(
    val round: Int,
    val narrative: String,
    val effectHint: String = "slash"
)

@Serializable
data class BattleResult(
    val winnerSide: MatchRole,
    val summary: String,
    val rounds: List<BattleRound>,
    val entranceEffects: List<String> = emptyList(),
    val commonEffects: List<String> = emptyList(),
    val defenderScoreDelta: Int = 0,
    val challengerScoreDelta: Int = 0
)

@Serializable
data class MatchRecord(
    val id: String,
    val mode: MatchMode,
    val defenderCardIds: List<String>,
    val challengerCardIds: List<String>,
    val worldId: String = "",
    val worldTitle: String = "",
    val battlefieldMerged: String,
    val result: BattleResult,
    val createdAt: Long = System.currentTimeMillis(),
    val isOnline: Boolean = false,
    val opponentId: String? = null,
    val opponentNickname: String? = null,
    val localRole: MatchRole? = null
)

data class PromptReviewResult(
    val cleanedText: String,
    val removedParts: List<String>,
    val passed: Boolean,
    val reason: String = "",
    val fitsWorld: Boolean = true
)

data class CardRateResult(
    val grade: CardGrade,
    val comment: String
)
