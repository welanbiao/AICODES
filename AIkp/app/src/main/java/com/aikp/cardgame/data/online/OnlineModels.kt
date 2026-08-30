package com.aikp.cardgame.data.online

import com.aikp.cardgame.domain.model.BattleResult
import com.aikp.cardgame.domain.model.BattleRound
import com.aikp.cardgame.domain.model.Card
import com.aikp.cardgame.domain.model.CardGrade
import com.aikp.cardgame.domain.model.MatchMode
import com.aikp.cardgame.domain.model.MatchRole
import com.aikp.cardgame.domain.model.SkillDraft
import com.aikp.cardgame.domain.model.SmallWorld
import kotlinx.serialization.Serializable

@Serializable
data class OnlineSkillDto(
    val name: String = "",
    val description: String = ""
)

@Serializable
data class OnlineCardDto(
    val id: String = "",
    val name: String = "",
    val lore: String = "",
    val skills: List<OnlineSkillDto> = emptyList(),
    val reviewedLore: String = "",
    val reviewedSkills: List<OnlineSkillDto> = emptyList(),
    val imageUri: String? = null,
    val createGrade: String = "N",
    val battleGrade: String = "N",
    val gloryGrade: String = "N",
    val worldId: String = "",
    val worldTitle: String = ""
)

@Serializable
data class OnlineWorldDto(
    val id: String = "",
    val title: String = "",
    val lore: String = "",
    val reviewedLore: String = "",
    val canonHint: String = "",
    val genre: String = "CUSTOM",
    val sourceHint: String = ""
)

@Serializable
data class OnlineBattlefieldDto(
    val id: String = "",
    val title: String = "",
    val description: String = "",
    val reviewedDescription: String = ""
)

@Serializable
data class QueueRequest(
    val playerId: String,
    val nickname: String,
    val rankPoints: Int,
    val mode: String,
    val preferredRole: String,
    val cards: List<OnlineCardDto>,
    val world: OnlineWorldDto,
    val battlefield: OnlineBattlefieldDto
)

@Serializable
data class OnlineOpponentDto(
    val playerId: String = "",
    val nickname: String = "",
    val rankPoints: Int = 0,
    val preferredRole: String = "ANY"
)

@Serializable
data class OnlineSideDto(
    val playerId: String = "",
    val nickname: String = "",
    val rankPoints: Int = 0,
    val cards: List<OnlineCardDto> = emptyList(),
    val battlefield: OnlineBattlefieldDto = OnlineBattlefieldDto()
)

@Serializable
data class OnlineBattleRoundDto(
    val round: Int = 1,
    val narrative: String = "",
    val effectHint: String = "slash"
)

@Serializable
data class OnlineBattleResultDto(
    val winnerSide: String = "DEFENDER",
    val summary: String = "",
    val rounds: List<OnlineBattleRoundDto> = emptyList(),
    val entranceEffects: List<String> = emptyList(),
    val commonEffects: List<String> = emptyList(),
    val defenderScoreDelta: Int = 0,
    val challengerScoreDelta: Int = 0
)

@Serializable
data class OnlineMatchDto(
    val id: String = "",
    val mode: String = "ONE_V_ONE",
    val status: String = "matched",
    val myRole: String? = null,
    val defender: OnlineSideDto = OnlineSideDto(),
    val challenger: OnlineSideDto = OnlineSideDto(),
    val worldId: String = "",
    val worldTitle: String = "",
    val battlefieldMerged: String = "",
    val result: OnlineBattleResultDto? = null,
    val finishedAt: Long? = null
)

@Serializable
data class TicketStatusDto(
    val ticketId: String = "",
    val status: String = "queued",
    val mode: String = "ONE_V_ONE",
    val preferredRole: String = "ANY",
    val assignedRole: String? = null,
    val opponent: OnlineOpponentDto? = null,
    val matchId: String? = null,
    val queuePosition: Int? = null,
    val createdAt: Long = 0,
    val match: OnlineMatchDto? = null
)

@Serializable
data class LobbyDto(
    val queue: Map<String, Int> = emptyMap(),
    val activeMatches: Int = 0,
    val ladderSize: Int = 0
)

@Serializable
data class LeaderboardEntryDto(
    val playerId: String = "",
    val nickname: String = "",
    val rankPoints: Int = 0,
    val wins: Int = 0,
    val losses: Int = 0
)

@Serializable
data class LeaderboardDto(
    val entries: List<LeaderboardEntryDto> = emptyList()
)

fun Card.toOnlineDto(): OnlineCardDto = OnlineCardDto(
    id = id,
    name = name,
    lore = lore,
    skills = skills.map { OnlineSkillDto(it.name, it.description) },
    reviewedLore = reviewedLore,
    reviewedSkills = reviewedSkills.map { OnlineSkillDto(it.name, it.description) },
    imageUri = imageUri,
    createGrade = createGrade.name,
    battleGrade = battleGrade.name,
    gloryGrade = gloryGrade.name,
    worldId = worldId,
    worldTitle = worldTitle
)

fun SmallWorld.toOnlineDto(): OnlineWorldDto = OnlineWorldDto(
    id = id,
    title = title,
    lore = lore,
    reviewedLore = reviewedLore,
    canonHint = canonHint,
    genre = genre.name,
    sourceHint = sourceHint
)

fun SmallWorld.toBattlefieldDto(): OnlineBattlefieldDto = OnlineBattlefieldDto(
    id = id,
    title = title,
    description = battlefieldPrompt,
    reviewedDescription = battlefieldPrompt
)

fun OnlineCardDto.toDomain(): Card = Card(
    id = id,
    name = name,
    lore = lore,
    skills = skills.map { SkillDraft(it.name, it.description) },
    worldId = worldId,
    worldTitle = worldTitle,
    imageUri = imageUri,
    createGrade = CardGrade.fromLabel(createGrade),
    battleGrade = CardGrade.fromLabel(battleGrade),
    gloryGrade = CardGrade.fromLabel(gloryGrade),
    reviewedLore = reviewedLore.ifBlank { lore },
    reviewedSkills = reviewedSkills
        .ifEmpty { skills }
        .map { SkillDraft(it.name, it.description) }
)

fun OnlineBattleResultDto.toDomain(): BattleResult = BattleResult(
    winnerSide = if (winnerSide.equals("CHALLENGER", true)) MatchRole.CHALLENGER else MatchRole.DEFENDER,
    summary = summary,
    rounds = rounds.map {
        BattleRound(round = it.round, narrative = it.narrative, effectHint = it.effectHint)
    },
    entranceEffects = entranceEffects,
    commonEffects = commonEffects,
    defenderScoreDelta = defenderScoreDelta,
    challengerScoreDelta = challengerScoreDelta
)

fun String.toMatchMode(): MatchMode =
    if (equals("THREE_V_THREE", true)) MatchMode.THREE_V_THREE else MatchMode.ONE_V_ONE

fun String?.toMatchRoleOrNull(): MatchRole? = when (this?.uppercase()) {
    "DEFENDER" -> MatchRole.DEFENDER
    "CHALLENGER" -> MatchRole.CHALLENGER
    else -> null
}
