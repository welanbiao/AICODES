package com.aikp.cardgame.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.aikp.cardgame.data.GameRepository
import com.aikp.cardgame.data.online.AuthClient
import com.aikp.cardgame.data.online.LeaderboardEntryDto
import com.aikp.cardgame.data.online.MatchmakingClient
import com.aikp.cardgame.data.online.QueueRequest
import com.aikp.cardgame.data.online.toBattlefieldDto
import com.aikp.cardgame.data.online.toDomain
import com.aikp.cardgame.data.online.toMatchMode
import com.aikp.cardgame.data.online.toMatchRoleOrNull
import com.aikp.cardgame.data.online.toOnlineDto
import com.aikp.cardgame.domain.model.Card
import com.aikp.cardgame.domain.model.MatchMode
import com.aikp.cardgame.domain.model.MatchRecord
import com.aikp.cardgame.domain.model.MatchRole
import com.aikp.cardgame.domain.model.SkillDraft
import com.aikp.cardgame.domain.model.SmallWorld
import com.aikp.cardgame.domain.model.WorldCharacterPreset
import com.aikp.cardgame.domain.model.WorldGenre
import com.aikp.cardgame.domain.world.WorldCatalog
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class PlayKind {
    ONLINE,
    PRACTICE
}

data class HomeUiState(
    val playerId: String = "",
    val playerUsername: String = "",
    val playerNickname: String = "旅人",
    val isLoggedIn: Boolean = false,
    val playerTier: String = "新锐",
    val gloryScore: Int = 0,
    val rankPoints: Int = 0,
    val winStreak: Int = 0,
    val medals: List<String> = emptyList(),
    val medalDetails: List<Pair<String, String>> = emptyList(),
    val cards: List<Card> = emptyList(),
    val worlds: List<SmallWorld> = WorldCatalog.officialWorlds,
    val matches: List<MatchRecord> = emptyList(),
    val compositeScore: Int = 0,
    val busy: Boolean = false,
    val busyTip: String = "AI 演算中…",
    val message: String? = null,
    val lastMatch: MatchRecord? = null,
    val matchStatusText: String? = null,
    val queueTicketId: String? = null,
    val lobbyOnlineHint: String? = null,
    val leaderboard: List<LeaderboardEntryDto> = emptyList()
) {
    fun presetsFor(worldId: String) = WorldCatalog.presetsFor(worldId)
}

class AppViewModel(
    private val repo: GameRepository,
    private val matchmaking: MatchmakingClient = MatchmakingClient(),
    private val auth: AuthClient = AuthClient()
) : ViewModel() {

    private val ephemeral = MutableStateFlow(Ephemeral())
    private var queueJob: Job? = null

    private data class Ephemeral(
        val busy: Boolean = false,
        val busyTip: String = "AI 演算中…",
        val message: String? = null,
        val lastMatch: MatchRecord? = null,
        val matchStatusText: String? = null,
        val queueTicketId: String? = null,
        val lobbyOnlineHint: String? = null,
        val leaderboard: List<LeaderboardEntryDto> = emptyList()
    )

    val uiState: StateFlow<HomeUiState> = combine(
        repo.observePlayer(),
        repo.observeCards(),
        repo.observeWorlds(),
        repo.observeMatches(),
        ephemeral
    ) { player, cards, worlds, matches, epi ->
        HomeUiState(
            playerId = player.onlineId.ifBlank { player.id },
            playerUsername = player.username,
            playerNickname = player.nickname,
            isLoggedIn = player.isLoggedIn,
            playerTier = player.playerTier,
            gloryScore = player.gloryScore,
            rankPoints = player.rankPoints,
            winStreak = player.winStreak,
            medals = player.medals.map { it.title },
            medalDetails = player.medals.map { it.title to it.description },
            cards = cards,
            worlds = worlds,
            matches = matches,
            compositeScore = repo.playerRankScore(cards, player),
            busy = epi.busy,
            busyTip = epi.busyTip,
            message = epi.message,
            lastMatch = epi.lastMatch,
            matchStatusText = epi.matchStatusText,
            queueTicketId = epi.queueTicketId,
            lobbyOnlineHint = epi.lobbyOnlineHint,
            leaderboard = epi.leaderboard
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), HomeUiState())

    init {
        viewModelScope.launch {
            repo.ensurePlayer()
            restoreSession()
            repo.seedDemoOpponentCards()
            refreshLobby()
        }
    }

    private suspend fun restoreSession() {
        val player = repo.currentPlayer()
        if (!player.isLoggedIn) return
        auth.me(player.authToken).fold(
            onSuccess = { user ->
                repo.applyAuthSession(
                    userId = user.id,
                    username = user.username,
                    nickname = user.nickname,
                    token = player.authToken,
                    rankPoints = user.rankPoints,
                    gloryScore = user.gloryScore,
                    winStreak = user.winStreak
                )
            },
            onFailure = { repo.clearAuthSession() }
        )
    }

    fun register(username: String, password: String, nickname: String) {
        viewModelScope.launch {
            ephemeral.update { it.copy(busy = true, busyTip = "注册中…") }
            auth.register(username.trim(), password, nickname.trim()).fold(
                onSuccess = { applyAuth(it) },
                onFailure = { err ->
                    ephemeral.update {
                        it.copy(busy = false, message = err.message ?: "注册失败")
                    }
                }
            )
        }
    }

    fun login(username: String, password: String) {
        viewModelScope.launch {
            ephemeral.update { it.copy(busy = true, busyTip = "登录中…") }
            auth.login(username.trim(), password).fold(
                onSuccess = { applyAuth(it) },
                onFailure = { err ->
                    ephemeral.update {
                        it.copy(busy = false, message = err.message ?: "登录失败")
                    }
                }
            )
        }
    }

    fun logout() {
        viewModelScope.launch {
            val token = repo.currentPlayer().authToken
            if (token.isNotBlank()) auth.logout(token)
            repo.clearAuthSession()
            ephemeral.update { it.copy(message = "已退出登录") }
        }
    }

    private suspend fun applyAuth(resp: com.aikp.cardgame.data.online.AuthResponseDto) {
        val user = resp.user
        repo.applyAuthSession(
            userId = user.id,
            username = user.username,
            nickname = user.nickname,
            token = resp.token,
            rankPoints = user.rankPoints,
            gloryScore = user.gloryScore,
            winStreak = user.winStreak
        )
        ephemeral.update {
            it.copy(busy = false, message = "欢迎，${user.nickname}")
        }
        refreshLobby()
    }

    fun clearMessage() {
        ephemeral.update { it.copy(message = null) }
    }

    fun refreshLobby() {
        viewModelScope.launch {
            val lobby = matchmaking.fetchLobby().getOrNull()
            val board = matchmaking.fetchLeaderboard().getOrNull()?.entries.orEmpty()
            ephemeral.update {
                it.copy(
                    lobbyOnlineHint = lobby?.let { l ->
                        "队列 1v1:${l.queue["ONE_V_ONE"] ?: 0} · 3v3:${l.queue["THREE_V_THREE"] ?: 0} · 进行中:${l.activeMatches}"
                    } ?: "联机服未连接（可先练习战）",
                    leaderboard = board
                )
            }
        }
    }

    fun updateNickname(nickname: String) {
        viewModelScope.launch {
            val cleaned = nickname.trim().take(12)
            repo.updateNickname(cleaned)
            val player = repo.currentPlayer()
            if (player.isLoggedIn) {
                auth.updateNickname(player.authToken, cleaned).fold(
                    onSuccess = {
                        ephemeral.update { it.copy(message = "昵称已同步") }
                    },
                    onFailure = { err ->
                        ephemeral.update { it.copy(message = err.message ?: "昵称本地已改，云端同步失败") }
                    }
                )
            } else {
                ephemeral.update { it.copy(message = "昵称已更新") }
            }
        }
    }

    fun createWorld(
        title: String,
        genre: WorldGenre,
        sourceHint: String,
        lore: String,
        canonHint: String
    ) {
        viewModelScope.launch {
            ephemeral.update { it.copy(busy = true, busyTip = "审核小世界中…") }
            val result = repo.createWorld(title, genre, sourceHint, lore, canonHint)
            ephemeral.update {
                it.copy(
                    busy = false,
                    message = result.fold(
                        onSuccess = { world -> "小世界「${world.title}」已开启，背景即战场" },
                        onFailure = { err -> err.message ?: "创建失败" }
                    )
                )
            }
        }
    }

    fun createCard(
        worldId: String,
        name: String,
        lore: String,
        skills: List<SkillDraft>,
        imageUri: String?
    ) {
        viewModelScope.launch {
            ephemeral.update { it.copy(busy = true, busyTip = "审核卡牌是否越界…") }
            val result = repo.createCard(worldId, name, lore, skills, imageUri)
            ephemeral.update {
                it.copy(
                    busy = false,
                    message = result.fold(
                        onSuccess = { card -> "「${card.name}」已入「${card.worldTitle}」· ${card.createGrade.label}" },
                        onFailure = { err -> err.message ?: "创建失败" }
                    )
                )
            }
        }
    }

    fun claimWorldCharacter(preset: WorldCharacterPreset) {
        viewModelScope.launch {
            ephemeral.update { it.copy(busy = true, busyTip = "领取世界角色…") }
            val result = repo.claimWorldCharacter(preset)
            ephemeral.update {
                it.copy(
                    busy = false,
                    message = result.fold(
                        onSuccess = { card -> "已领取「${card.name}」· ${card.createGrade.label}" },
                        onFailure = { err -> err.message ?: "领取失败" }
                    )
                )
            }
        }
    }

    fun startMatch(
        kind: PlayKind,
        mode: MatchMode,
        myCardIds: List<String>,
        worldId: String,
        preferredRole: MatchRole?
    ) {
        when (kind) {
            PlayKind.PRACTICE -> startPracticeMatch(mode, myCardIds, worldId, preferredRole != MatchRole.DEFENDER)
            PlayKind.ONLINE -> startOnlineMatch(mode, myCardIds, worldId, preferredRole)
        }
    }

    fun cancelQueue() {
        val ticketId = ephemeral.value.queueTicketId ?: return
        viewModelScope.launch {
            matchmaking.cancel(ticketId)
            queueJob?.cancel()
            ephemeral.update {
                it.copy(
                    busy = false,
                    queueTicketId = null,
                    matchStatusText = null,
                    message = "已取消匹配"
                )
            }
        }
    }

    private fun startPracticeMatch(
        mode: MatchMode,
        myCardIds: List<String>,
        worldId: String,
        asChallenger: Boolean
    ) {
        viewModelScope.launch {
            ephemeral.update { it.copy(busy = true, busyTip = "练习战演算中…", matchStatusText = "练习战演算中…") }
            val state = uiState.value
            val world = state.worlds.find { it.id == worldId }
            val mine = myCardIds.mapNotNull { id -> state.cards.find { it.id == id } }
            if (world == null || mine.size != mode.teamSize) {
                ephemeral.update { it.copy(busy = false, message = "请选择小世界与完整卡组") }
                return@launch
            }
            if (mine.any { it.worldId.isNotBlank() && it.worldId != world.id }) {
                ephemeral.update { it.copy(busy = false, message = "出战卡必须属于当前小世界") }
                return@launch
            }

            val opponents = state.cards.filter { it.id.startsWith("demo_") }.take(mode.teamSize)
            if (opponents.size < mode.teamSize) {
                ephemeral.update { it.copy(busy = false, message = "对手卡组不足，请重启应用") }
                return@launch
            }

            val result = repo.runRankedMatch(
                mode = mode,
                world = world,
                defenderCards = if (asChallenger) opponents else mine,
                challengerCards = if (asChallenger) mine else opponents,
                localIsChallenger = asChallenger
            )
            ephemeral.update {
                it.copy(
                    busy = false,
                    matchStatusText = null,
                    lastMatch = result.getOrNull(),
                    message = result.fold(
                        onSuccess = { match -> "练习战完成：${match.result.summary}" },
                        onFailure = { err -> err.message ?: "对战失败" }
                    )
                )
            }
        }
    }

    private fun startOnlineMatch(
        mode: MatchMode,
        myCardIds: List<String>,
        worldId: String,
        preferredRole: MatchRole?
    ) {
        queueJob?.cancel()
        queueJob = viewModelScope.launch {
            ephemeral.update {
                it.copy(
                    busy = true,
                    busyTip = "联机匹配中…",
                    matchStatusText = "正在进入同世界匹配队列"
                )
            }
            val state = uiState.value
            val world = state.worlds.find { it.id == worldId }
            val mine = myCardIds.mapNotNull { id -> state.cards.find { it.id == id } }
            if (world == null || mine.size != mode.teamSize) {
                ephemeral.update { it.copy(busy = false, matchStatusText = null, message = "请选择小世界与完整卡组") }
                return@launch
            }
            if (mine.any { it.worldId.isNotBlank() && it.worldId != world.id }) {
                ephemeral.update { it.copy(busy = false, matchStatusText = null, message = "出战卡必须属于当前小世界") }
                return@launch
            }

            val player = repo.currentPlayer()
            val enqueueResult = matchmaking.enqueue(
                QueueRequest(
                    playerId = player.onlineId.ifBlank { player.id },
                    nickname = player.nickname,
                    rankPoints = player.rankPoints,
                    mode = mode.name,
                    preferredRole = preferredRole?.name ?: "ANY",
                    cards = mine.map { it.toOnlineDto() },
                    world = world.toOnlineDto(),
                    battlefield = world.toBattlefieldDto()
                )
            )
            val ticket = enqueueResult.getOrElse { err ->
                ephemeral.update {
                    it.copy(
                        busy = false,
                        matchStatusText = null,
                        message = "联机失败：${err.message ?: "无法连接匹配服"}"
                    )
                }
                return@launch
            }

            ephemeral.update {
                it.copy(
                    queueTicketId = ticket.ticketId,
                    matchStatusText = statusLabel(ticket.status, ticket.queuePosition, ticket.opponent?.nickname)
                )
            }

            val settled = matchmaking.waitUntilSettled(ticket.ticketId) { update ->
                ephemeral.update { epi ->
                    epi.copy(
                        busyTip = when (update.status) {
                            "queued" -> "同世界匹配中…"
                            "matched", "battling" -> "已匹配，服务端演算对战…"
                            else -> "联机结算中…"
                        },
                        matchStatusText = statusLabel(
                            update.status,
                            update.queuePosition,
                            update.opponent?.nickname
                        )
                    )
                }
            }

            val finished = settled.getOrElse { err ->
                ephemeral.update {
                    it.copy(
                        busy = false,
                        queueTicketId = null,
                        matchStatusText = null,
                        message = err.message ?: "匹配失败"
                    )
                }
                return@launch
            }

            val onlineMatch = finished.match
            val battleResult = onlineMatch?.result
            if (onlineMatch == null || battleResult == null) {
                ephemeral.update {
                    it.copy(
                        busy = false,
                        queueTicketId = null,
                        matchStatusText = null,
                        message = "对战结果缺失"
                    )
                }
                return@launch
            }

            val myRole = onlineMatch.myRole.toMatchRoleOrNull()
                ?: finished.assignedRole.toMatchRoleOrNull()
                ?: MatchRole.CHALLENGER
            val localIsChallenger = myRole == MatchRole.CHALLENGER
            val opponent = if (localIsChallenger) onlineMatch.defender else onlineMatch.challenger

            val applied = repo.applyOnlineMatch(
                matchId = onlineMatch.id,
                mode = onlineMatch.mode.toMatchMode(),
                defenderCards = onlineMatch.defender.cards.map { it.toDomain() },
                challengerCards = onlineMatch.challenger.cards.map { it.toDomain() },
                worldId = onlineMatch.worldId.ifBlank { world.id },
                worldTitle = onlineMatch.worldTitle.ifBlank { world.title },
                battlefieldMerged = onlineMatch.battlefieldMerged,
                result = battleResult.toDomain(),
                localIsChallenger = localIsChallenger,
                opponentId = opponent.playerId,
                opponentNickname = opponent.nickname
            )

            ephemeral.update {
                it.copy(
                    busy = false,
                    queueTicketId = null,
                    matchStatusText = null,
                    lastMatch = applied.getOrNull(),
                    message = applied.fold(
                        onSuccess = { match ->
                            "联机对决 vs ${opponent.nickname}：${match.result.summary}"
                        },
                        onFailure = { err -> err.message ?: "结算失败" }
                    )
                )
            }
            refreshLobby()
        }
    }

    private fun statusLabel(status: String, queuePosition: Int?, opponentName: String?): String =
        when (status) {
            "queued" -> "同世界排队中${queuePosition?.let { " · 位置 $it" } ?: ""}"
            "matched" -> "已匹配对手 ${opponentName ?: ""}"
            "battling" -> "对战 AI 演算中（双方同一战报）"
            "finished" -> "对战完成"
            "timeout" -> "匹配超时"
            "cancelled" -> "已取消"
            else -> status
        }

    companion object {
        fun factory(repo: GameRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return AppViewModel(repo) as T
                }
            }
    }
}
