package com.aikp.cardgame.domain.world

import com.aikp.cardgame.domain.model.CardGrade
import com.aikp.cardgame.domain.model.SkillDraft
import com.aikp.cardgame.domain.model.WorldCharacterPreset

internal fun preset(
    worldId: String,
    key: String,
    name: String,
    nick: String,
    faction: String,
    lore: String,
    grade: CardGrade,
    role: String,
    vararg skills: Pair<String, String>,
    fullLore: String = lore
): WorldCharacterPreset = WorldCharacterPreset(
    id = "${worldId}_$key",
    worldId = worldId,
    name = name,
    lore = lore,
    skills = skills.map { SkillDraft(it.first, it.second) },
    suggestedGrade = grade,
    roleHint = role,
    faction = faction,
    nickname = nick,
    fullLore = fullLore
)
