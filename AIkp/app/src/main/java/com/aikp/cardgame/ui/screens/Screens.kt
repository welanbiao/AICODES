package com.aikp.cardgame.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Public
import androidx.compose.material.icons.outlined.Style
import androidx.compose.material.icons.outlined.Bolt
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import coil.compose.AsyncImage
import com.aikp.cardgame.R
import com.aikp.cardgame.domain.model.MatchMode
import com.aikp.cardgame.domain.model.MatchRole
import com.aikp.cardgame.domain.model.SkillDraft
import com.aikp.cardgame.domain.model.SmallWorld
import com.aikp.cardgame.domain.model.WorldCharacterPreset
import com.aikp.cardgame.domain.model.WorldGenre
import com.aikp.cardgame.domain.rules.GameLimits
import com.aikp.cardgame.ui.HomeUiState
import com.aikp.cardgame.ui.PlayKind
import com.aikp.cardgame.ui.components.ArtCta
import com.aikp.cardgame.ui.components.BusyOverlay
import com.aikp.cardgame.ui.components.CardTile
import com.aikp.cardgame.ui.components.CharacterArtCard
import com.aikp.cardgame.ui.components.CommonBattleAura
import com.aikp.cardgame.ui.components.EntranceEffectBanner
import com.aikp.cardgame.ui.components.MatchWaitAnimation
import com.aikp.cardgame.ui.components.GradeChip
import com.aikp.cardgame.ui.components.HallBackground
import com.aikp.cardgame.ui.components.SectionTitle
import com.aikp.cardgame.ui.components.WorldCoverCard
import com.aikp.cardgame.ui.theme.Brass
import com.aikp.cardgame.ui.theme.Ink
import com.aikp.cardgame.ui.theme.Jade
import com.aikp.cardgame.ui.theme.Mist
import com.aikp.cardgame.ui.theme.MistDim

object Routes {
    const val HOME = "home"
    const val WORLDS = "worlds"
    const val WORLD = "world/{worldId}"
    const val CREATE_WORLD = "create_world"
    const val CREATE_CARD = "create_card/{worldId}"
    const val RANKED = "ranked"
    const val BATTLE = "battle"
    const val COLLECTION = "collection"
    const val PROFILE = "profile"

    fun world(id: String) = "world/$id"
    fun createCard(id: String) = "create_card/$id"
}

private data class Tab(val route: String, val label: String, val icon: ImageVector)

private val Tabs = listOf(
    Tab(Routes.HOME, "大厅", Icons.Outlined.Home),
    Tab(Routes.WORLDS, "世界", Icons.Outlined.Public),
    Tab(Routes.RANKED, "对战", Icons.Outlined.Bolt),
    Tab(Routes.COLLECTION, "卡册", Icons.Outlined.Style),
    Tab(Routes.PROFILE, "我的", Icons.Outlined.Person)
)

@Composable
fun AikpNav(
    state: HomeUiState,
    onClearMessage: () -> Unit,
    onCreateCard: (String, String, String, List<SkillDraft>, String?) -> Unit,
    onCreateWorld: (String, WorldGenre, String, String, String) -> Unit,
    onStartMatch: (PlayKind, MatchMode, List<String>, String, MatchRole?) -> Unit,
    onCancelQueue: () -> Unit,
    onRefreshLobby: () -> Unit,
    onUpdateNickname: (String) -> Unit,
    onClaimCharacter: (WorldCharacterPreset) -> Unit,
    onLogin: (String, String) -> Unit,
    onRegister: (String, String, String) -> Unit,
    onLogout: () -> Unit
) {
    val nav = rememberNavController()
    val snackbar = remember { SnackbarHostState() }
    val backStack by nav.currentBackStackEntryAsState()
    val route = backStack?.destination?.route.orEmpty()
    val showBar = state.isLoggedIn &&
        route in setOf(Routes.HOME, Routes.WORLDS, Routes.RANKED, Routes.COLLECTION, Routes.PROFILE)

    LaunchedEffect(state.message) {
        val msg = state.message ?: return@LaunchedEffect
        snackbar.showSnackbar(msg)
        onClearMessage()
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbar) },
        containerColor = Color.Transparent,
        bottomBar = {
            if (showBar) {
                NavigationBar(
                    modifier = Modifier.border(1.dp, Brass.copy(alpha = 0.22f)),
                    containerColor = Ink.copy(alpha = 0.9f),
                    contentColor = Mist
                ) {
                    Tabs.forEach { tab ->
                        val selected = route == tab.route ||
                            (tab.route == Routes.WORLDS && route.startsWith("world"))
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                nav.navigate(tab.route) {
                                    popUpTo(nav.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(tab.icon, contentDescription = tab.label) },
                            label = { Text(tab.label) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = Brass,
                                selectedTextColor = Brass,
                                indicatorColor = Brass.copy(alpha = 0.18f),
                                unselectedIconColor = MistDim,
                                unselectedTextColor = MistDim
                            )
                        )
                    }
                }
            }
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            if (!state.isLoggedIn) {
                AuthScreen(
                    busy = state.busy,
                    onLogin = onLogin,
                    onRegister = onRegister
                )
                BusyOverlay(visible = state.busy, tip = state.busyTip)
            } else {
            NavHost(navController = nav, startDestination = Routes.HOME) {
                composable(Routes.HOME) { HomeScreen(state, nav, onRefreshLobby) }
                composable(Routes.WORLDS) { WorldsScreen(state, nav) }
                composable(
                    Routes.WORLD,
                    arguments = listOf(navArgument("worldId") { type = NavType.StringType })
                ) { entry ->
                    val id = entry.arguments?.getString("worldId").orEmpty()
                    WorldDetailScreen(
                        state = state,
                        worldId = id,
                        onBack = { nav.popBackStack() },
                        onForge = { nav.navigate(Routes.createCard(id)) },
                        onFight = {
                            nav.navigate(Routes.RANKED) { launchSingleTop = true }
                        },
                        onClaim = onClaimCharacter,
                        onSubmitEdited = { n, l, s -> onCreateCard(id, n, l, s, null) }
                    )
                }
                composable(Routes.CREATE_WORLD) {
                    CreateWorldScreen(
                        busy = state.busy,
                        onBack = { nav.popBackStack() },
                        onSubmit = { t, g, s, l, c ->
                            onCreateWorld(t, g, s, l, c)
                            nav.popBackStack()
                        }
                    )
                }
                composable(
                    Routes.CREATE_CARD,
                    arguments = listOf(navArgument("worldId") { type = NavType.StringType })
                ) { entry ->
                    val id = entry.arguments?.getString("worldId").orEmpty()
                    val world = state.worlds.find { it.id == id }
                    CreateCardScreen(
                        world = world,
                        busy = state.busy,
                        onBack = { nav.popBackStack() },
                        onSubmit = { n, l, s, uri -> onCreateCard(id, n, l, s, uri) }
                    )
                }
                composable(Routes.RANKED) {
                    RankedScreen(
                        state = state,
                        onFight = { kind, mode, cards, worldId, role ->
                            onStartMatch(kind, mode, cards, worldId, role)
                            nav.navigate(Routes.BATTLE)
                        },
                        onCancelQueue = onCancelQueue,
                        onRefreshLobby = onRefreshLobby
                    )
                }
                composable(Routes.BATTLE) {
                    BattleScreen(
                        state = state,
                        onBack = { nav.popBackStack(Routes.HOME, false) },
                        onCancelQueue = onCancelQueue
                    )
                }
                composable(Routes.COLLECTION) { CollectionScreen(state, nav) }
                composable(Routes.PROFILE) {
                    ProfileScreen(state, onUpdateNickname, onRefreshLobby, onLogout)
                }
            }
            BusyOverlay(
                visible = state.busy &&
                    state.queueTicketId == null &&
                    !state.busyTip.contains("练习") &&
                    !state.busyTip.contains("匹配") &&
                    !state.busyTip.contains("演算"),
                tip = state.busyTip,
                subtitle = state.matchStatusText
            )
            }
        }
    }
}

@Composable
private fun HomeScreen(
    state: HomeUiState,
    nav: NavHostController,
    onRefreshLobby: () -> Unit
) {
    LaunchedEffect(Unit) { onRefreshLobby() }
    val featured = state.worlds.firstOrNull()
    val myCards = state.cards.filterNot { it.id.startsWith("demo_") }
    HallBackground {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Column {
                Text("AI卡牌", color = Brass, style = MaterialTheme.typography.displayLarge)
                Text("${state.playerNickname} · ${state.playerTier}", color = Mist)
            }
            Column(horizontalAlignment = Alignment.End) {
                Text("综合 ${state.compositeScore}", color = Jade)
                Text(state.lobbyOnlineHint ?: "", color = MistDim, style = MaterialTheme.typography.bodyMedium)
            }
        }
        Spacer(Modifier.height(16.dp))
        if (featured != null) {
            WorldCoverCard(featured) { nav.navigate(Routes.world(featured.id)) }
            Spacer(Modifier.height(14.dp))
        }
        ArtCta(
            art = R.drawable.btn_battle,
            title = "开  战",
            subtitle = "进入小世界排位 · 背景即战场"
        ) { nav.navigate(Routes.RANKED) }
        Spacer(Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
            Box(Modifier.weight(1f)) {
                ArtCta(art = R.drawable.btn_world, title = "小世界") { nav.navigate(Routes.WORLDS) }
            }
            Box(Modifier.weight(1f)) {
                ArtCta(art = R.drawable.btn_forge, title = "铸造") {
                    val wid = featured?.id ?: state.worlds.firstOrNull()?.id
                    if (wid != null) nav.navigate(Routes.createCard(wid))
                    else nav.navigate(Routes.WORLDS)
                }
            }
        }
        Spacer(Modifier.height(10.dp))
        ArtCta(art = R.drawable.btn_create, title = "创建小世界", subtitle = "四大名著官方世界 · 也可自创") {
            nav.navigate(Routes.CREATE_WORLD)
        }
        Spacer(Modifier.height(18.dp))
        SectionTitle("最近卡牌", "卡牌必须属于某个小世界")
        Spacer(Modifier.height(8.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.weight(1f)) {
            items(myCards.take(6)) { card -> CardTile(card) }
            if (myCards.isEmpty()) {
                item { Text("还没有卡。先进入一个小世界铸造或选用人物。", color = MistDim) }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun WorldsScreen(state: HomeUiState, nav: NavHostController) {
    var genre by remember { mutableStateOf<WorldGenre?>(null) }
    val list = state.worlds.filter { genre == null || it.genre == genre }
    HallBackground {
        SectionTitle("小世界", "西游 / 三国 / 水浒 / 聊斋 · 点选人物可选用或修改")
        Spacer(Modifier.height(10.dp))
        Row(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState())
        ) {
            FilterChip(
                selected = genre == null,
                onClick = { genre = null },
                label = { Text("全部") },
                colors = chipColors()
            )
            WorldGenre.entries.filter { it != WorldGenre.CUSTOM }.forEach { g ->
                FilterChip(
                    selected = genre == g,
                    onClick = { genre = g },
                    label = { Text(g.label) },
                    colors = chipColors()
                )
            }
        }
        Spacer(Modifier.height(10.dp))
        ArtCta(art = R.drawable.btn_create, title = "创建我的小世界") { nav.navigate(Routes.CREATE_WORLD) }
        Spacer(Modifier.height(12.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.weight(1f)) {
            items(list) { world ->
                WorldCoverCard(world) { nav.navigate(Routes.world(world.id)) }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CreateWorldScreen(
    busy: Boolean,
    onBack: () -> Unit,
    onSubmit: (String, WorldGenre, String, String, String) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var genre by remember { mutableStateOf(WorldGenre.NOVEL) }
    var source by remember { mutableStateOf("") }
    var lore by remember { mutableStateOf("") }
    var canon by remember { mutableStateOf("") }
    var localError by remember { mutableStateOf<String?>(null) }
    HallBackground {
        TextButton(onClick = onBack) { Text("返回", color = Brass) }
        SectionTitle("创建小世界", "背景将作为唯一战场，他人进入后只能按此设定铸卡")
        Spacer(Modifier.height(10.dp))
        Column(Modifier.verticalScroll(rememberScrollState()).weight(1f)) {
            OutlinedTextField(
                value = title,
                onValueChange = { if (it.length <= GameLimits.MAX_WORLD_TITLE_CHARS) title = it },
                label = { Text("世界名") },
                modifier = Modifier.fillMaxWidth(),
                colors = fieldColors(),
                singleLine = true
            )
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                WorldGenre.entries.forEach { g ->
                    FilterChip(
                        selected = genre == g,
                        onClick = { genre = g },
                        label = { Text(g.label) },
                        colors = chipColors()
                    )
                }
            }
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = source,
                onValueChange = { if (it.length <= GameLimits.MAX_WORLD_SOURCE_CHARS) source = it },
                label = { Text("出处（如三国演义 / 大秦 / 自定义）") },
                modifier = Modifier.fillMaxWidth(),
                colors = fieldColors(),
                singleLine = true
            )
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = lore,
                onValueChange = { if (it.length <= GameLimits.MAX_WORLD_LORE_CHARS) lore = it },
                label = { Text("世界背景＝战场 ≤${GameLimits.MAX_WORLD_LORE_CHARS}字") },
                modifier = Modifier.fillMaxWidth(),
                colors = fieldColors(),
                minLines = 2,
                supportingText = { Text("${lore.length}/${GameLimits.MAX_WORLD_LORE_CHARS}", color = MistDim) }
            )
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = canon,
                onValueChange = { if (it.length <= GameLimits.MAX_WORLD_CANON_CHARS) canon = it },
                label = { Text("允许的技能题材 ≤${GameLimits.MAX_WORLD_CANON_CHARS}字") },
                modifier = Modifier.fillMaxWidth(),
                colors = fieldColors(),
                minLines = 2
            )
            if (localError != null) {
                Spacer(Modifier.height(8.dp))
                Text(localError!!, color = MaterialTheme.colorScheme.error)
            }
            Spacer(Modifier.height(16.dp))
            ArtCta(
                art = R.drawable.btn_create,
                title = if (busy) "审核中…" else "提交审核并开启世界",
                enabled = !busy
            ) {
                val errors = GameLimits.validateWorldDraft(title, source, lore, canon)
                if (errors.isNotEmpty()) localError = errors.joinToString("\n")
                else {
                    localError = null
                    onSubmit(title, genre, source, lore, canon)
                }
            }
        }
    }
}

@Composable
private fun CreateCardScreen(
    world: SmallWorld?,
    busy: Boolean,
    onBack: () -> Unit,
    onSubmit: (String, String, List<SkillDraft>, String?) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var lore by remember { mutableStateOf("") }
    var skill1Name by remember { mutableStateOf("") }
    var skill1Desc by remember { mutableStateOf("") }
    var skill2Name by remember { mutableStateOf("") }
    var skill2Desc by remember { mutableStateOf("") }
    var skill3Name by remember { mutableStateOf("") }
    var skill3Desc by remember { mutableStateOf("") }
    var imageUri by remember { mutableStateOf<String?>(null) }
    var localError by remember { mutableStateOf<String?>(null) }
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        imageUri = uri?.toString()
    }
    HallBackground {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            TextButton(onClick = onBack) { Text("返回", color = Brass) }
            Text("铸造卡牌", color = Mist, style = MaterialTheme.typography.titleLarge)
            Spacer(Modifier.height(1.dp))
        }
        if (world == null) {
            Text("请先选择小世界", color = MistDim)
            return@HallBackground
        }
        Text("${world.title} · ${world.genre.label}", color = Brass)
        Text("战场：${world.battlefieldPrompt}", color = MistDim, style = MaterialTheme.typography.bodyMedium)
        Text("不得超出：${world.canonHint}", color = Jade, style = MaterialTheme.typography.bodyMedium)
        Column(modifier = Modifier.verticalScroll(rememberScrollState()).weight(1f)) {
            Spacer(Modifier.height(10.dp))
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
                label = { Text("人物设定") },
                modifier = Modifier.fillMaxWidth(),
                colors = fieldColors(),
                minLines = 2
            )
            Spacer(Modifier.height(12.dp))
            SkillInputs("技能一", skill1Name, skill1Desc, { skill1Name = it }, { skill1Desc = it })
            SkillInputs("技能二（可选）", skill2Name, skill2Desc, { skill2Name = it }, { skill2Desc = it })
            SkillInputs("技能三（可选）", skill3Name, skill3Desc, { skill3Name = it }, { skill3Desc = it })
            Button(
                onClick = { picker.launch("image/*") },
                colors = ButtonDefaults.buttonColors(containerColor = Jade, contentColor = Ink)
            ) { Text(if (imageUri == null) "上传入场特效图" else "已选择入场图") }
            if (imageUri != null) {
                Spacer(Modifier.height(8.dp))
                AsyncImage(model = imageUri, contentDescription = "入场图", modifier = Modifier.fillMaxWidth().height(140.dp))
            }
            if (localError != null) {
                Spacer(Modifier.height(8.dp))
                Text(localError!!, color = MaterialTheme.colorScheme.error)
            }
            Spacer(Modifier.height(16.dp))
            ArtCta(
                art = R.drawable.btn_forge,
                title = if (busy) "AI 审核中…" else "提交审核入库",
                enabled = !busy
            ) {
                val skills = buildList {
                    if (skill1Name.isNotBlank() || skill1Desc.isNotBlank()) add(SkillDraft(skill1Name.trim(), skill1Desc.trim()))
                    if (skill2Name.isNotBlank() || skill2Desc.isNotBlank()) add(SkillDraft(skill2Name.trim(), skill2Desc.trim()))
                    if (skill3Name.isNotBlank() || skill3Desc.isNotBlank()) add(SkillDraft(skill3Name.trim(), skill3Desc.trim()))
                }
                val errors = GameLimits.validateCardDraft(name, lore, skills) +
                    GameLimits.validateFitsWorld(world, name, lore, skills)
                if (errors.isNotEmpty()) localError = errors.joinToString("\n")
                else {
                    localError = null
                    onSubmit(name, lore, skills, imageUri)
                    onBack()
                }
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
internal fun SkillInputs(
    label: String,
    name: String,
    desc: String,
    onName: (String) -> Unit,
    onDesc: (String) -> Unit
) {
    Text(label, color = MistDim)
    Spacer(Modifier.height(4.dp))
    OutlinedTextField(
        value = name,
        onValueChange = { if (it.length <= GameLimits.MAX_SKILL_NAME_CHARS) onName(it) },
        label = { Text("技能名") },
        modifier = Modifier.fillMaxWidth(),
        colors = fieldColors(),
        singleLine = true
    )
    Spacer(Modifier.height(6.dp))
    OutlinedTextField(
        value = desc,
        onValueChange = { if (it.length <= GameLimits.MAX_SKILL_DESC_CHARS) onDesc(it) },
        label = { Text("描述≤${GameLimits.MAX_SKILL_DESC_CHARS}字") },
        modifier = Modifier.fillMaxWidth(),
        colors = fieldColors(),
        singleLine = true
    )
    Spacer(Modifier.height(10.dp))
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun RankedScreen(
    state: HomeUiState,
    onFight: (PlayKind, MatchMode, List<String>, String, MatchRole?) -> Unit,
    onCancelQueue: () -> Unit,
    onRefreshLobby: () -> Unit
) {
    var mode by remember { mutableStateOf(MatchMode.ONE_V_ONE) }
    var kind by remember { mutableStateOf(PlayKind.ONLINE) }
    var preferDefender by remember { mutableStateOf(false) }
    var preferChallenger by remember { mutableStateOf(true) }
    val selected = remember { mutableStateListOf<String>() }
    var worldId by remember { mutableStateOf(state.worlds.firstOrNull()?.id) }
    val world = state.worlds.find { it.id == worldId } ?: state.worlds.firstOrNull()
    val myCards = state.cards.filterNot { it.id.startsWith("demo_") }
        .filter { world == null || it.worldId == world.id || it.worldId.isBlank() }

    LaunchedEffect(Unit) { onRefreshLobby() }
    LaunchedEffect(worldId) { selected.clear() }

    HallBackground(art = R.drawable.bg_battle) {
        SectionTitle("排位对决", "同一小世界匹配；战场锁定为该世界背景")
        if (state.lobbyOnlineHint != null) {
            Text(state.lobbyOnlineHint, color = MistDim, style = MaterialTheme.typography.bodyMedium)
        }
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(selected = kind == PlayKind.ONLINE, onClick = { kind = PlayKind.ONLINE }, label = { Text("联机排位") }, colors = chipColors())
            FilterChip(selected = kind == PlayKind.PRACTICE, onClick = { kind = PlayKind.PRACTICE }, label = { Text("练习战") }, colors = chipColors(Jade))
        }
        Spacer(Modifier.height(6.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(selected = mode == MatchMode.ONE_V_ONE, onClick = { mode = MatchMode.ONE_V_ONE; selected.clear() }, label = { Text("一对一") }, colors = chipColors())
            FilterChip(selected = mode == MatchMode.THREE_V_THREE, onClick = { mode = MatchMode.THREE_V_THREE; selected.clear() }, label = { Text("三对三") }, colors = chipColors())
        }
        Spacer(Modifier.height(6.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(selected = preferDefender && !preferChallenger, onClick = { preferDefender = true; preferChallenger = false }, label = { Text("守擂") }, colors = chipColors(Jade))
            FilterChip(selected = preferChallenger && !preferDefender, onClick = { preferChallenger = true; preferDefender = false }, label = { Text("挑战") }, colors = chipColors(Jade))
            FilterChip(selected = preferDefender == preferChallenger, onClick = { preferDefender = true; preferChallenger = true }, label = { Text("任意") }, colors = chipColors(Jade))
        }
        Spacer(Modifier.height(10.dp))
        Text("选择小世界（战场）", color = Mist)
        Spacer(Modifier.height(6.dp))
        LazyColumn(modifier = Modifier.height(120.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            items(state.worlds) { w ->
                Text(
                    "${w.title}｜${w.battlefieldPrompt}",
                    color = if (worldId == w.id) Brass else MistDim,
                    modifier = Modifier.fillMaxWidth().clickable { worldId = w.id }.padding(8.dp)
                )
            }
        }
        if (world != null) {
            Text("题材约束：${world.canonHint}", color = Jade, style = MaterialTheme.typography.bodyMedium)
        }
        Spacer(Modifier.height(8.dp))
        Text("选择卡组（${selected.size}/${mode.teamSize}）· 仅本世界卡", color = Mist)
        Spacer(Modifier.height(6.dp))
        LazyColumn(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(myCards) { card ->
                CardTile(card, selected = selected.contains(card.id)) {
                    if (selected.contains(card.id)) selected.remove(card.id)
                    else if (selected.size < mode.teamSize) selected.add(card.id)
                }
            }
            if (myCards.isEmpty()) {
                item { Text("该世界还没有卡。去世界页铸造或选用人物。", color = MistDim) }
            }
        }
        if (state.queueTicketId != null) {
            Text(state.matchStatusText ?: "匹配中…", color = Jade)
            Spacer(Modifier.height(8.dp))
            Button(onClick = onCancelQueue, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.buttonColors(containerColor = MistDim, contentColor = Ink)) {
                Text("取消匹配")
            }
        } else {
            ArtCta(
                art = R.drawable.btn_battle,
                title = if (kind == PlayKind.ONLINE) "开始同世界匹配" else "开始练习战",
                enabled = selected.size == mode.teamSize && worldId != null && !state.busy
            ) {
                val wid = worldId ?: return@ArtCta
                val role = when {
                    preferDefender && !preferChallenger -> MatchRole.DEFENDER
                    preferChallenger && !preferDefender -> MatchRole.CHALLENGER
                    else -> null
                }
                onFight(kind, mode, selected.toList(), wid, role)
            }
        }
    }
}

@Composable
private fun BattleScreen(
    state: HomeUiState,
    onBack: () -> Unit,
    onCancelQueue: () -> Unit
) {
    val match = state.lastMatch
    HallBackground(art = R.drawable.bg_battle) {
        TextButton(onClick = onBack) { Text("返回大厅", color = Brass) }
        if (match == null) {
            if (state.busy || state.queueTicketId != null) {
                SectionTitle("同世界演武", state.matchStatusText ?: state.busyTip)
                Spacer(Modifier.height(20.dp))
                MatchWaitAnimation(
                    title = state.matchStatusText ?: state.busyTip,
                    subtitle = "双方进入同一小世界，战场为世界背景。"
                )
                if (state.queueTicketId != null) {
                    Spacer(Modifier.height(20.dp))
                    Button(onClick = onCancelQueue, colors = ButtonDefaults.buttonColors(containerColor = MistDim, contentColor = Ink)) {
                        Text("取消匹配")
                    }
                }
            } else {
                SectionTitle("暂无战报", "请先发起一场排位")
            }
            return@HallBackground
        }
        val winner = if (match.result.winnerSide == MatchRole.DEFENDER) "守擂方胜" else "挑战方胜"
        val onlineTag = if (match.isOnline) "联机" else "练习"
        val vs = match.opponentNickname?.let { " vs $it" }.orEmpty()
        SectionTitle("$onlineTag · $winner$vs", "同一世界交锋 · 战报")
        Spacer(Modifier.height(8.dp))
        Text("小世界：${match.worldTitle.ifBlank { "未知" }}", color = Brass)
        Text(match.battlefieldMerged, color = MistDim)
        match.localRole?.let {
            Text("你的身份：${if (it == MatchRole.DEFENDER) "守擂者" else "挑战者"}", color = Jade)
        }
        Spacer(Modifier.height(8.dp))
        Text("战报总述", color = Brass)
        Text(match.result.summary, color = Mist)
        Spacer(Modifier.height(8.dp))
        EntranceEffectBanner(active = true)
        Spacer(Modifier.height(8.dp))
        AnimatedVisibility(visible = true, enter = fadeIn() + slideInVertically(), exit = fadeOut()) {
            Column {
                Text("入场特效", color = Brass)
                match.result.entranceEffects.forEach { Text("◆ $it", color = Mist) }
                Spacer(Modifier.height(8.dp))
                Text("通用特效", color = Brass)
                match.result.commonEffects.forEach { Text("◇ $it", color = Mist) }
            }
        }
        Spacer(Modifier.height(12.dp))
        LazyColumn(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(match.result.rounds) { round ->
                Column {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        GradeChip("第${round.round}回合")
                        Text(round.effectHint, color = Jade)
                    }
                    CommonBattleAura(round.effectHint)
                    Spacer(Modifier.height(4.dp))
                    Text(round.narrative, color = Mist)
                }
            }
        }
    }
}

@Composable
private fun CollectionScreen(state: HomeUiState, nav: NavHostController) {
    val myCards = state.cards.filterNot { it.id.startsWith("demo_") }
    HallBackground {
        SectionTitle("卡册", "按小世界收录")
        Spacer(Modifier.height(10.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.weight(1f)) {
            items(myCards.chunked(2), key = { row -> row.joinToString("-") { it.id } }) { pair ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    pair.forEach { card ->
                        CharacterArtCard(
                            card.id,
                            card.name,
                            Modifier.weight(1f),
                            grade = card.overallGrade.label,
                            skills = card.reviewedSkills
                        )
                    }
                    if (pair.size == 1) Spacer(Modifier.weight(1f))
                }
            }
            if (myCards.isEmpty()) {
                item {
                    Text("卡册为空。", color = MistDim)
                    TextButton(onClick = { nav.navigate(Routes.WORLDS) }) { Text("去小世界", color = Brass) }
                }
            }
        }
    }
}

@Composable
private fun AuthScreen(
    busy: Boolean,
    onLogin: (String, String) -> Unit,
    onRegister: (String, String, String) -> Unit
) {
    var modeRegister by remember { mutableStateOf(false) }
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var nickname by remember { mutableStateOf("") }
    HallBackground {
        SectionTitle("AI卡牌", if (modeRegister) "注册账号 · 数据存于服务器文件" else "登录进入小世界")
        Spacer(Modifier.height(16.dp))
        OutlinedTextField(
            value = username,
            onValueChange = { if (it.length <= 16) username = it },
            label = { Text("账号") },
            modifier = Modifier.fillMaxWidth(),
            colors = fieldColors(),
            singleLine = true,
            enabled = !busy
        )
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = password,
            onValueChange = { if (it.length <= 64) password = it },
            label = { Text("密码（至少6位）") },
            modifier = Modifier.fillMaxWidth(),
            colors = fieldColors(),
            singleLine = true,
            enabled = !busy
        )
        if (modeRegister) {
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = nickname,
                onValueChange = { if (it.length <= 12) nickname = it },
                label = { Text("昵称（可选）") },
                modifier = Modifier.fillMaxWidth(),
                colors = fieldColors(),
                singleLine = true,
                enabled = !busy
            )
        }
        Spacer(Modifier.height(16.dp))
        Button(
            onClick = {
                if (modeRegister) onRegister(username, password, nickname.ifBlank { username })
                else onLogin(username, password)
            },
            enabled = !busy && username.isNotBlank() && password.length >= 6,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = Brass, contentColor = Ink)
        ) {
            Text(if (modeRegister) "注册并进入" else "登录")
        }
        TextButton(
            onClick = { modeRegister = !modeRegister },
            enabled = !busy
        ) {
            Text(if (modeRegister) "已有账号？去登录" else "没有账号？去注册", color = Brass)
        }
        Text("需先启动 ai-bridge（默认 8787）", color = MistDim, style = MaterialTheme.typography.bodySmall)
    }
}

@Composable
private fun ProfileScreen(
    state: HomeUiState,
    onUpdateNickname: (String) -> Unit,
    onRefreshLobby: () -> Unit,
    onLogout: () -> Unit
) {
    var nickname by remember(state.playerNickname) { mutableStateOf(state.playerNickname) }
    LaunchedEffect(Unit) { onRefreshLobby() }
    HallBackground {
        SectionTitle("荣耀册", "联机排位分同步至匹配服天梯")
        Spacer(Modifier.height(12.dp))
        Text("账号：${state.playerUsername}", color = MistDim)
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = nickname,
            onValueChange = { if (it.length <= 12) nickname = it },
            label = { Text("昵称") },
            modifier = Modifier.fillMaxWidth(),
            colors = fieldColors(),
            singleLine = true,
            trailingIcon = {
                TextButton(onClick = { onUpdateNickname(nickname) }) { Text("保存", color = Brass) }
            }
        )
        Spacer(Modifier.height(10.dp))
        Text("段位：${state.playerTier}", color = Mist, style = MaterialTheme.typography.titleLarge)
        Text("综合评分 ${state.compositeScore}", color = Jade)
        Text("荣耀分 ${state.gloryScore} · 排位分 ${state.rankPoints} · 连胜 ${state.winStreak}", color = MistDim)
        Text("小世界 ${state.worlds.size} · 卡牌 ${state.cards.count { !it.id.startsWith("demo_") }}", color = MistDim)
        Spacer(Modifier.height(12.dp))
        Text("联机天梯", color = Brass)
        LazyColumn(modifier = Modifier.height(110.dp)) {
            items(state.leaderboard) { entry ->
                Text("${entry.nickname} · ${entry.rankPoints}分 · ${entry.wins}胜${entry.losses}负", color = MistDim, modifier = Modifier.padding(vertical = 3.dp))
            }
            if (state.leaderboard.isEmpty()) item { Text("暂无天梯数据。", color = MistDim) }
        }
        Spacer(Modifier.height(8.dp))
        Text("勋章", color = Brass)
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.weight(1f)) {
            items(state.medalDetails) { (title, desc) ->
                Column {
                    Text(title, color = Mist)
                    Text(desc, color = MistDim)
                }
            }
            if (state.medalDetails.isEmpty()) item { Text("尚无勋章。", color = MistDim) }
        }
        Spacer(Modifier.height(8.dp))
        TextButton(onClick = onLogout) { Text("退出登录", color = MistDim) }
    }
}

@Composable
internal fun fieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = Brass,
    unfocusedBorderColor = MistDim.copy(alpha = 0.4f),
    focusedLabelColor = Brass,
    unfocusedLabelColor = MistDim,
    cursorColor = Brass,
    focusedTextColor = Mist,
    unfocusedTextColor = Mist
)

@Composable
internal fun chipColors(selected: Color = Brass) = FilterChipDefaults.filterChipColors(
    selectedContainerColor = selected,
    selectedLabelColor = Ink
)
