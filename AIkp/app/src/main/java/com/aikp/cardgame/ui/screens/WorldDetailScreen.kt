package com.aikp.cardgame.ui.screens

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.aikp.cardgame.R
import com.aikp.cardgame.domain.model.SkillDraft
import com.aikp.cardgame.domain.model.WorldCharacterPreset
import com.aikp.cardgame.domain.rules.GameLimits
import com.aikp.cardgame.ui.HomeUiState
import com.aikp.cardgame.ui.components.ArtCta
import com.aikp.cardgame.ui.components.CharacterArtCard
import com.aikp.cardgame.ui.components.GlassPanel
import com.aikp.cardgame.ui.components.HallBackground
import com.aikp.cardgame.ui.components.WorldCoverCard
import com.aikp.cardgame.ui.theme.Brass
import com.aikp.cardgame.ui.theme.Jade
import com.aikp.cardgame.ui.theme.Mist
import com.aikp.cardgame.ui.theme.MistDim

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun WorldDetailScreen(
    state: HomeUiState,
    worldId: String,
    onBack: () -> Unit,
    onForge: () -> Unit,
    onFight: () -> Unit,
    onClaim: (WorldCharacterPreset) -> Unit,
    onSubmitEdited: (String, String, List<SkillDraft>) -> Unit
) {
    val world = state.worlds.find { it.id == worldId }
    val presets = state.presetsFor(worldId)
    val factions = presets.map { it.faction }.filter { it.isNotBlank() }.distinct()
    val owned = state.cards.filter { it.worldId == worldId && !it.id.startsWith("demo_") }
    var query by remember { mutableStateOf("") }
    var faction by remember { mutableStateOf<String?>(null) }
    var editing by remember { mutableStateOf<WorldCharacterPreset?>(null) }
    val filtered = presets.filter { p ->
        (faction == null || p.faction == faction) &&
            (
                query.isBlank() ||
                    p.name.contains(query) ||
                    p.nickname.contains(query) ||
                    p.lore.contains(query) ||
                    p.faction.contains(query)
                )
    }
    HallBackground {
        TextButton(onClick = onBack) { Text("返回", color = Brass) }
        if (world == null) {
            Text("世界不存在", color = MistDim)
            return@HallBackground
        }
        val current = editing
        if (current != null) {
            CharacterEditPane(
                preset = current,
                busy = state.busy,
                onCancel = { editing = null },
                onUseOriginal = {
                    onClaim(current)
                    editing = null
                },
                onSubmitEdited = { n, l, s ->
                    onSubmitEdited(n, l, s)
                    editing = null
                }
            )
            return@HallBackground
        }
        WorldCoverCard(world) {}
        Spacer(Modifier.height(10.dp))
        GlassPanel {
            Text("详细背景", color = Brass)
            Spacer(Modifier.height(4.dp))
            Text(world.fullLore, color = Mist, style = MaterialTheme.typography.bodyMedium)
            Spacer(Modifier.height(8.dp))
            Text("战场（锁定）：${world.battlefieldPrompt}", color = Jade, style = MaterialTheme.typography.bodyMedium)
            Text("题材约束：${world.canonHint}", color = MistDim, style = MaterialTheme.typography.bodyMedium)
        }
        Spacer(Modifier.height(10.dp))
        ArtCta(art = R.drawable.btn_forge, title = "空白铸造") { onForge() }
        Spacer(Modifier.height(8.dp))
        ArtCta(art = R.drawable.btn_battle, title = "在此对战") { onFight() }
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            label = { Text("搜索人物 / 绰号 / 阵营") },
            modifier = Modifier.fillMaxWidth(),
            colors = fieldColors(),
            singleLine = true
        )
        Spacer(Modifier.height(8.dp))
        Row(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
        ) {
            FilterChip(
                selected = faction == null,
                onClick = { faction = null },
                label = { Text("全部 ${presets.size}") },
                colors = chipColors()
            )
            factions.forEach { f ->
                FilterChip(
                    selected = faction == f,
                    onClick = { faction = f },
                    label = { Text("$f ${presets.count { it.faction == f }}") },
                    colors = chipColors()
                )
            }
        }
        Spacer(Modifier.height(10.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.weight(1f)) {
            item {
                Text(
                    "点选人物：可原样入库，也可改设定后再提交审核",
                    color = Brass,
                    style = MaterialTheme.typography.titleLarge
                )
            }
            items(filtered.chunked(2), key = { row -> row.joinToString("-") { it.id } }) { pair ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    pair.forEach { preset ->
                        val claimed = owned.any { it.id == preset.id }
                        Column(Modifier.weight(1f)) {
                            CharacterArtCard(
                                preset.id,
                                preset.name,
                                grade = preset.suggestedGrade.label,
                                nickname = preset.nickname,
                                skills = preset.skills
                            )
                            Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                                TextButton(
                                    onClick = { onClaim(preset) },
                                    enabled = !state.busy && !claimed
                                ) { Text(if (claimed) "已选用" else "选用", color = Jade) }
                                TextButton(onClick = { editing = preset }) {
                                    Text("修改", color = Brass)
                                }
                            }
                        }
                    }
                    if (pair.size == 1) Spacer(Modifier.weight(1f))
                }
            }
            item { Text("本世界卡牌 ${owned.size}", color = Brass, style = MaterialTheme.typography.titleLarge) }
            items(owned.chunked(2), key = { row -> row.joinToString("-") { it.id } }) { pair ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    pair.forEach { card ->
                        CharacterArtCard(
                            card.id,
                            card.name,
                            Modifier.weight(1f),
                            grade = card.createGrade.label,
                            skills = card.reviewedSkills
                        )
                    }
                    if (pair.size == 1) Spacer(Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun CharacterEditPane(
    preset: WorldCharacterPreset,
    busy: Boolean,
    onCancel: () -> Unit,
    onUseOriginal: () -> Unit,
    onSubmitEdited: (String, String, List<SkillDraft>) -> Unit
) {
    var name by remember(preset.id) { mutableStateOf(preset.name) }
    var lore by remember(preset.id) { mutableStateOf(preset.lore) }
    val s0 = preset.skills.getOrNull(0)
    val s1 = preset.skills.getOrNull(1)
    val s2 = preset.skills.getOrNull(2)
    var n1 by remember(preset.id) { mutableStateOf(s0?.name.orEmpty()) }
    var d1 by remember(preset.id) { mutableStateOf(s0?.description.orEmpty()) }
    var n2 by remember(preset.id) { mutableStateOf(s1?.name.orEmpty()) }
    var d2 by remember(preset.id) { mutableStateOf(s1?.description.orEmpty()) }
    var n3 by remember(preset.id) { mutableStateOf(s2?.name.orEmpty()) }
    var d3 by remember(preset.id) { mutableStateOf(s2?.description.orEmpty()) }
    var localError by remember { mutableStateOf<String?>(null) }
    Column(Modifier.verticalScroll(rememberScrollState())) {
        TextButton(onClick = onCancel) { Text("取消", color = Brass) }
        Text("修改人物设定", color = Mist, style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(8.dp))
        CharacterArtCard(
            preset.id,
            preset.name,
            Modifier.fillMaxWidth(0.72f),
            grade = preset.suggestedGrade.label,
            nickname = preset.nickname,
            skills = preset.skills
        )
        Spacer(Modifier.height(8.dp))
        Text(preset.fullLore, color = MistDim, style = MaterialTheme.typography.bodyMedium)
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = name,
            onValueChange = { if (it.length <= GameLimits.MAX_CARD_NAME_CHARS) name = it },
            label = { Text("名称") },
            modifier = Modifier.fillMaxWidth(),
            colors = fieldColors(),
            singleLine = true
        )
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = lore,
            onValueChange = { if (it.length <= GameLimits.MAX_CARD_LORE_CHARS) lore = it },
            label = { Text("人物设定 ≤${GameLimits.MAX_CARD_LORE_CHARS}字") },
            modifier = Modifier.fillMaxWidth(),
            colors = fieldColors(),
            minLines = 2
        )
        Spacer(Modifier.height(8.dp))
        SkillInputs("技能一", n1, d1, { n1 = it }, { d1 = it })
        SkillInputs("技能二（可选）", n2, d2, { n2 = it }, { d2 = it })
        SkillInputs("技能三（可选）", n3, d3, { n3 = it }, { d3 = it })
        if (localError != null) Text(localError!!, color = MaterialTheme.colorScheme.error)
        Spacer(Modifier.height(8.dp))
        ArtCta(
            art = R.drawable.btn_jade,
            title = "按原设定选用",
            enabled = !busy
        ) { onUseOriginal() }
        Spacer(Modifier.height(8.dp))
        ArtCta(
            art = R.drawable.btn_brass,
            title = "提交修改并审核入库",
            enabled = !busy
        ) {
            val skills = buildList {
                if (n1.isNotBlank() || d1.isNotBlank()) add(SkillDraft(n1.trim(), d1.trim()))
                if (n2.isNotBlank() || d2.isNotBlank()) add(SkillDraft(n2.trim(), d2.trim()))
                if (n3.isNotBlank() || d3.isNotBlank()) add(SkillDraft(n3.trim(), d3.trim()))
            }
            val errors = GameLimits.validateCardDraft(name, lore, skills)
            if (errors.isNotEmpty()) localError = errors.joinToString("\n")
            else {
                localError = null
                onSubmitEdited(name, lore, skills)
            }
        }
        Spacer(Modifier.height(24.dp))
    }
}
