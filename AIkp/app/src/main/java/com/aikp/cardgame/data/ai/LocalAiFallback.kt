package com.aikp.cardgame.data.ai

import com.aikp.cardgame.domain.ai.BattleNarration
import com.aikp.cardgame.domain.rules.GameLimits
import org.json.JSONArray
import org.json.JSONObject

/**
 * Local deterministic fallback when Cursor AI bridge is unavailable.
 * Keeps create → review → battle flow debuggable without network.
 */
object LocalAiFallback {

    fun complete(task: String, prompt: String): AiChatResponse {
        val text = when (task) {
            "review" -> review(prompt)
            "rate_card" -> rate(prompt)
            "battle" -> battle(prompt)
            else -> """{"ok":true,"note":"unsupported task"}"""
        }
        return AiChatResponse(text = text, source = "local_fallback", mock = true)
    }

    private fun extractAfter(label: String, prompt: String): String {
        val idx = prompt.indexOf(label)
        if (idx < 0) return prompt.takeLast(120)
        return prompt.substring(idx + label.length).trim().lines().firstOrNull().orEmpty()
    }

    private fun review(prompt: String): String {
        val raw = when {
            prompt.contains("原文：") -> prompt.substringAfter("原文：").substringBefore("请只输出").trim()
            else -> prompt.takeLast(80)
        }
        val (cleaned, removed) = GameLimits.stripForbidden(raw)
        val passed = cleaned.length >= 2
        return JSONObject()
            .put("cleanedText", cleaned.ifBlank { "平静的训练场" })
            .put("removedParts", JSONArray(removed))
            .put("passed", passed)
            .put("reason", if (removed.isEmpty()) "通过本地规则清洗" else "已移除限制词：${removed.joinToString()}")
            .toString()
    }

    private fun rate(prompt: String): String {
        val name = extractAfter("卡牌：", prompt)
        val lore = extractAfter("设定：", prompt)
        val skillBlock = prompt.substringAfter("技能：", "").substringBefore("只输出").trim()
        val score = name.length * 3 + lore.length + skillBlock.length / 2
        val grade = when {
            score >= 90 -> "SSR"
            score >= 60 -> "SR"
            score >= 35 -> "R"
            else -> "N"
        }
        return JSONObject()
            .put("grade", grade)
            .put("comment", "本地评级：创意密度约 $score，定级 $grade")
            .toString()
    }

    private fun battle(prompt: String): String {
        val winner = if ((prompt.hashCode() and 1) == 0) "DEFENDER" else "CHALLENGER"
        val (summary, roundsData, fx) = BattleNarration.fromPrompt(prompt, winner)
        val rounds = JSONArray()
        roundsData.forEach { (round, narrative, hint) ->
            rounds.put(
                JSONObject()
                    .put("round", round)
                    .put("narrative", narrative)
                    .put("effectHint", hint)
            )
        }
        return JSONObject()
            .put("winnerSide", winner)
            .put("summary", summary)
            .put("rounds", rounds)
            .put("entranceEffects", JSONArray(fx.first))
            .put("commonEffects", JSONArray(fx.second))
            .put("defenderScoreDelta", if (winner == "DEFENDER") 12 else -6)
            .put("challengerScoreDelta", if (winner == "CHALLENGER") 14 else -5)
            .toString()
    }
}
