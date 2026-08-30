package com.aikp.cardgame.data.ai

import com.aikp.cardgame.domain.ai.AiPrompts
import com.aikp.cardgame.domain.ai.BattleNarration
import com.aikp.cardgame.domain.model.BattleResult
import com.aikp.cardgame.domain.model.BattleRound
import com.aikp.cardgame.domain.model.Card
import com.aikp.cardgame.domain.model.CardGrade
import com.aikp.cardgame.domain.model.CardRateResult
import com.aikp.cardgame.domain.model.MatchMode
import com.aikp.cardgame.domain.model.MatchRole
import com.aikp.cardgame.domain.model.PromptReviewResult
import com.aikp.cardgame.domain.model.SkillDraft
import com.aikp.cardgame.domain.model.SmallWorld
import com.aikp.cardgame.domain.rules.GameLimits
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

class GameAiService(
    private val bridge: AiBridgeClient = AiBridgeClient(),
    private val json: Json = Json { ignoreUnknownKeys = true; isLenient = true }
) {

    suspend fun reviewText(kind: String, raw: String, world: SmallWorld? = null): PromptReviewResult {
        val (preCleaned, preRemoved) = GameLimits.stripForbidden(raw)
        val prompt = if (world != null) {
            AiPrompts.reviewCardInWorldPrompt(world, kind, preCleaned)
        } else {
            AiPrompts.reviewPrompt(kind, preCleaned)
        }
        val response = bridge.complete("review", prompt)
        val obj = parseObject(response.text)
        val aiCleaned = obj.str("cleanedText").ifBlank { preCleaned }
        val (finalText, moreRemoved) = GameLimits.stripForbidden(aiCleaned)
        val removed = (preRemoved + obj.strList("removedParts") + moreRemoved).distinct()
        val fitsWorld = obj.bool("fitsWorld", true)
        val passed = obj.bool("passed", finalText.isNotBlank()) && finalText.isNotBlank() && fitsWorld
        return PromptReviewResult(
            cleanedText = finalText,
            removedParts = removed,
            passed = passed,
            reason = obj.str("reason").ifBlank {
                when {
                    !fitsWorld -> "设定超出当前小世界"
                    response.mock -> "本地审核"
                    else -> "AI审核"
                }
            },
            fitsWorld = fitsWorld
        )
    }

    suspend fun reviewWorld(
        title: String,
        genreLabel: String,
        source: String,
        lore: String,
        canonHint: String
    ): Pair<PromptReviewResult, String> {
        val (preCleaned, preRemoved) = GameLimits.stripForbidden(lore)
        val response = bridge.complete(
            "review",
            AiPrompts.reviewWorldPrompt(title, genreLabel, source, preCleaned, canonHint)
        )
        val obj = parseObject(response.text)
        val aiCleaned = obj.str("cleanedText").ifBlank { preCleaned }
        val (finalText, moreRemoved) = GameLimits.stripForbidden(aiCleaned)
        val canon = obj.str("canonHint").ifBlank { canonHint }.take(GameLimits.MAX_WORLD_CANON_CHARS)
        val removed = (preRemoved + obj.strList("removedParts") + moreRemoved).distinct()
        val passed = obj.bool("passed", finalText.isNotBlank()) && finalText.isNotBlank()
        return PromptReviewResult(
            cleanedText = finalText.take(GameLimits.MAX_WORLD_LORE_CHARS),
            removedParts = removed,
            passed = passed,
            reason = obj.str("reason").ifBlank { if (response.mock) "本地审核" else "AI审核" }
        ) to canon
    }

    suspend fun reviewCard(
        name: String,
        lore: String,
        skills: List<SkillDraft>,
        world: SmallWorld
    ): Triple<PromptReviewResult, List<SkillDraft>, CardRateResult> {
        val loreReview = reviewText("卡牌人物设定", lore, world)
        val skillsBlob = skills.joinToString("\n") { "${it.name}|${it.description}" }
        val skillsReview = reviewText("卡牌技能列表", skillsBlob, world)
        val reviewedSkills = skillsReview.cleanedText
            .lines()
            .mapNotNull { line ->
                val parts = line.split("|", limit = 2).map { it.trim() }
                if (parts.size < 2 || parts[0].isBlank() || parts[1].isBlank()) {
                    null
                } else {
                    SkillDraft(
                        name = parts[0].take(GameLimits.MAX_SKILL_NAME_CHARS),
                        description = parts[1].take(GameLimits.MAX_SKILL_DESC_CHARS)
                    )
                }
            }
            .ifEmpty {
                skills.map { skill ->
                    val (n, _) = GameLimits.stripForbidden(skill.name)
                    val (d, _) = GameLimits.stripForbidden(skill.description)
                    SkillDraft(
                        n.take(GameLimits.MAX_SKILL_NAME_CHARS),
                        d.take(GameLimits.MAX_SKILL_DESC_CHARS)
                    )
                }
            }
            .filter { it.name.isNotBlank() && it.description.isNotBlank() }
            .take(GameLimits.MAX_SKILLS)

        val skillsText = reviewedSkills.joinToString("\n") { "- ${it.name}:${it.description}" }
        val rateResp = bridge.complete(
            "rate_card",
            AiPrompts.rateCardPrompt(name, loreReview.cleanedText, skillsText, world.title)
        )
        val rateObj = parseObject(rateResp.text)
        val grade = CardGrade.fromLabel(rateObj.str("grade"))
        val comment = rateObj.str("comment").ifBlank { "初创评级完成" }
        val passed = loreReview.passed && skillsReview.fitsWorld && loreReview.fitsWorld
        val combined = loreReview.copy(
            passed = passed && reviewedSkills.isNotEmpty(),
            reason = when {
                !loreReview.fitsWorld || !skillsReview.fitsWorld -> "卡牌超出小世界「${world.title}」设定"
                else -> loreReview.reason
            },
            fitsWorld = loreReview.fitsWorld && skillsReview.fitsWorld
        )
        return Triple(combined, reviewedSkills, CardRateResult(grade, comment))
    }

    suspend fun generateBattle(
        mode: MatchMode,
        world: SmallWorld,
        defenders: List<Card>,
        challengers: List<Card>
    ): BattleResult {
        val fieldReview = reviewText("小世界战场", world.battlefieldPrompt, world)
        val battlefieldWorld = world.copy(reviewedLore = fieldReview.cleanedText.ifBlank { world.lore })
        val response = bridge.complete(
            "battle",
            AiPrompts.battlePrompt(mode, battlefieldWorld, defenders, challengers)
        )
        val obj = parseObject(response.text)
        val winner = when (obj.str("winnerSide").uppercase()) {
            "CHALLENGER" -> MatchRole.CHALLENGER
            else -> MatchRole.DEFENDER
        }
        val rounds = obj.arr("rounds").mapIndexed { index, el ->
            val r = el.jsonObject
            BattleRound(
                round = r.int("round", index + 1),
                narrative = GameLimits.clampBattleText(r.str("narrative")),
                effectHint = r.str("effectHint").ifBlank { "slash" }
            )
        }.ifEmpty {
            val fallback = BattleNarration.fromPrompt(
                AiPrompts.battlePrompt(mode, battlefieldWorld, defenders, challengers),
                "DEFENDER"
            )
            fallback.second.map { (round, narrative, hint) ->
                BattleRound(round, narrative, hint)
            }
        }
        return BattleResult(
            winnerSide = winner,
            summary = GameLimits.clampBattleText(obj.str("summary").ifBlank { "对战结束。双方在同一小世界里交锋，先机、护体与破绽决定胜负，没有秒杀。" }),
            rounds = rounds,
            entranceEffects = obj.strList("entranceEffects"),
            commonEffects = obj.strList("commonEffects"),
            defenderScoreDelta = obj.int("defenderScoreDelta", if (winner == MatchRole.DEFENDER) 10 else -5),
            challengerScoreDelta = obj.int("challengerScoreDelta", if (winner == MatchRole.CHALLENGER) 12 else -5)
        )
    }

    private fun parseObject(text: String): JsonObject {
        val start = text.indexOf('{')
        val end = text.lastIndexOf('}')
        val sliced = if (start >= 0 && end > start) text.substring(start, end + 1) else "{}"
        return runCatching { json.parseToJsonElement(sliced).jsonObject }
            .getOrElse { JsonObject(emptyMap()) }
    }

    private fun JsonObject.str(key: String): String =
        this[key]?.jsonPrimitive?.contentOrNull.orEmpty()

    private fun JsonObject.bool(key: String, default: Boolean): Boolean =
        this[key]?.jsonPrimitive?.booleanOrNull ?: default

    private fun JsonObject.int(key: String, default: Int): Int =
        this[key]?.jsonPrimitive?.intOrNull ?: default

    private fun JsonObject.strList(key: String): List<String> =
        this[key]?.jsonArray?.mapNotNull { it.jsonPrimitive.contentOrNull } ?: emptyList()

    private fun JsonObject.arr(key: String): JsonArray =
        this[key]?.jsonArray ?: JsonArray(emptyList())
}
