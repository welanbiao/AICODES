package com.aikp.cardgame.data

import com.aikp.cardgame.data.ai.GameAiService
import com.aikp.cardgame.data.db.AppDatabase
import com.aikp.cardgame.data.db.toDomain
import com.aikp.cardgame.data.db.toEntity
import com.aikp.cardgame.domain.model.BattleResult
import com.aikp.cardgame.domain.model.Card
import com.aikp.cardgame.domain.model.CardGrade
import com.aikp.cardgame.domain.model.MatchMode
import com.aikp.cardgame.domain.model.MatchRecord
import com.aikp.cardgame.domain.model.MatchRole
import com.aikp.cardgame.domain.model.MedalType
import com.aikp.cardgame.domain.model.PlayerProfile
import com.aikp.cardgame.domain.model.SkillDraft
import com.aikp.cardgame.domain.model.SmallWorld
import com.aikp.cardgame.domain.model.WorldCharacterPreset
import com.aikp.cardgame.domain.model.WorldGenre
import com.aikp.cardgame.domain.rules.GameLimits
import com.aikp.cardgame.domain.world.WorldCatalog
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.UUID

class GameRepository(
    private val db: AppDatabase,
    private val ai: GameAiService = GameAiService()
) {
    private val dao get() = db.gameDao()

    fun observeCards(): Flow<List<Card>> =
        dao.observeCards().map { list -> list.map { it.toDomain() } }

    fun observeWorlds(): Flow<List<SmallWorld>> =
        dao.observeWorlds().map { stored ->
            mergeWorlds(stored.map { it.toDomain() })
        }

    fun observeMatches(): Flow<List<MatchRecord>> =
        dao.observeMatches().map { list -> list.map { it.toDomain() } }

    fun observePlayer(): Flow<PlayerProfile> =
        dao.observePlayer().map { it?.toDomain() ?: PlayerProfile() }

    private fun mergeWorlds(userWorlds: List<SmallWorld>): List<SmallWorld> {
        val official = WorldCatalog.officialWorlds
        val officialIds = official.map { it.id }.toSet()
        return official + userWorlds.filter { it.id !in officialIds }
    }

    suspend fun resolveWorld(worldId: String): SmallWorld? =
        WorldCatalog.worldById(worldId) ?: dao.getWorld(worldId)?.toDomain()

    suspend fun ensurePlayer() {
        val existing = dao.getPlayer()?.toDomain()
        when {
            existing == null -> {
                dao.upsertPlayer(
                    PlayerProfile(onlineId = UUID.randomUUID().toString()).toEntity()
                )
            }
            existing.onlineId.isBlank() -> {
                dao.upsertPlayer(existing.copy(onlineId = UUID.randomUUID().toString()).toEntity())
            }
        }
    }

    suspend fun currentPlayer(): PlayerProfile {
        ensurePlayer()
        return dao.getPlayer()?.toDomain() ?: PlayerProfile(onlineId = UUID.randomUUID().toString()).also {
            dao.upsertPlayer(it.toEntity())
        }
    }

    suspend fun updateNickname(nickname: String) {
        val player = currentPlayer()
        val cleaned = nickname.trim().take(12).ifBlank { player.nickname }
        dao.upsertPlayer(player.copy(nickname = cleaned).toEntity())
    }

    suspend fun applyAuthSession(
        userId: String,
        username: String,
        nickname: String,
        token: String,
        rankPoints: Int? = null,
        gloryScore: Int? = null,
        winStreak: Int? = null
    ) {
        val player = currentPlayer()
        dao.upsertPlayer(
            player.copy(
                onlineId = userId,
                username = username,
                authToken = token,
                nickname = nickname.trim().take(12).ifBlank { player.nickname },
                rankPoints = rankPoints ?: player.rankPoints,
                gloryScore = gloryScore ?: player.gloryScore,
                winStreak = winStreak ?: player.winStreak
            ).toEntity()
        )
    }

    suspend fun clearAuthSession() {
        val player = currentPlayer()
        dao.upsertPlayer(
            player.copy(
                username = "",
                authToken = "",
                onlineId = UUID.randomUUID().toString()
            ).toEntity()
        )
    }

    suspend fun createWorld(
        title: String,
        genre: WorldGenre,
        sourceHint: String,
        lore: String,
        canonHint: String
    ): Result<SmallWorld> {
        val errors = GameLimits.validateWorldDraft(title, sourceHint, lore, canonHint)
        if (errors.isNotEmpty()) return Result.failure(IllegalArgumentException(errors.joinToString("\n")))
        val (review, canon) = ai.reviewWorld(
            title.trim(),
            genre.label,
            sourceHint.trim(),
            lore.trim(),
            canonHint.trim()
        )
        if (!review.passed) {
            return Result.failure(IllegalArgumentException("世界审核未通过：${review.reason}"))
        }
        val player = currentPlayer()
        val world = SmallWorld(
            id = "u_${UUID.randomUUID()}",
            title = title.trim().take(GameLimits.MAX_WORLD_TITLE_CHARS),
            genre = genre,
            sourceHint = sourceHint.trim().take(GameLimits.MAX_WORLD_SOURCE_CHARS).ifBlank { genre.label },
            lore = lore.trim(),
            reviewedLore = review.cleanedText.take(GameLimits.MAX_WORLD_LORE_CHARS),
            canonHint = canon.take(GameLimits.MAX_WORLD_CANON_CHARS),
            coverKey = genre.coverKey,
            isOfficial = false,
            creatorId = player.onlineId.ifBlank { player.id }
        )
        dao.upsertWorld(world.toEntity())
        grantMedal(MedalType.WORLD_MAKER)
        return Result.success(world)
    }

    suspend fun createCard(
        worldId: String,
        name: String,
        lore: String,
        skills: List<SkillDraft>,
        imageUri: String?
    ): Result<Card> {
        val world = resolveWorld(worldId)
            ?: return Result.failure(IllegalArgumentException("请先选择一个小世界"))
        val errors = GameLimits.validateCardDraft(name, lore, skills) +
            GameLimits.validateFitsWorld(world, name, lore, skills)
        if (errors.isNotEmpty()) return Result.failure(IllegalArgumentException(errors.joinToString("\n")))

        val (loreReview, reviewedSkills, rate) = ai.reviewCard(name.trim(), lore.trim(), skills, world)
        if (!loreReview.passed || reviewedSkills.isEmpty()) {
            return Result.failure(IllegalArgumentException("审核未通过：${loreReview.reason}"))
        }

        val card = Card(
            id = UUID.randomUUID().toString(),
            name = name.trim().take(GameLimits.MAX_CARD_NAME_CHARS),
            lore = lore.trim(),
            skills = skills,
            worldId = world.id,
            worldTitle = world.title,
            imageUri = imageUri,
            createGrade = rate.grade,
            battleGrade = CardGrade.N,
            gloryGrade = CardGrade.N,
            reviewedLore = loreReview.cleanedText,
            reviewedSkills = reviewedSkills
        )
        dao.upsertCard(card.toEntity())
        recomputePlayerMedals()
        return Result.success(card)
    }

    suspend fun claimWorldCharacter(preset: WorldCharacterPreset): Result<Card> {
        val world = resolveWorld(preset.worldId)
            ?: return Result.failure(IllegalArgumentException("世界不存在"))
        val errors = GameLimits.validateCardDraft(preset.name, preset.lore, preset.skills)
        if (errors.isNotEmpty()) {
            return Result.failure(IllegalArgumentException(errors.joinToString("\n")))
        }
        val existing = dao.getCard(preset.id)
        if (existing != null) return Result.success(existing.toDomain())
        val card = Card(
            id = preset.id,
            name = preset.name,
            lore = preset.lore,
            skills = preset.skills,
            worldId = world.id,
            worldTitle = world.title,
            createGrade = preset.suggestedGrade,
            battleGrade = CardGrade.N,
            gloryGrade = CardGrade.N,
            reviewedLore = preset.lore,
            reviewedSkills = preset.skills
        )
        dao.upsertCard(card.toEntity())
        grantMedal(MedalType.WORLD_GUEST)
        recomputePlayerMedals()
        return Result.success(card)
    }

    suspend fun runRankedMatch(
        mode: MatchMode,
        world: SmallWorld,
        defenderCards: List<Card>,
        challengerCards: List<Card>,
        localIsChallenger: Boolean
    ): Result<MatchRecord> {
        if (defenderCards.size != mode.teamSize || challengerCards.size != mode.teamSize) {
            return Result.failure(IllegalArgumentException("卡组数量需为 ${mode.teamSize}"))
        }
        val offWorld = (defenderCards + challengerCards).filter {
            it.worldId.isNotBlank() && it.worldId != world.id && !it.id.startsWith("demo_")
        }
        if (offWorld.isNotEmpty()) {
            return Result.failure(IllegalArgumentException("出战卡必须属于小世界「${world.title}」"))
        }
        val result = ai.generateBattle(
            mode = mode,
            world = world,
            defenders = defenderCards,
            challengers = challengerCards
        )
        val record = MatchRecord(
            id = UUID.randomUUID().toString(),
            mode = mode,
            defenderCardIds = defenderCards.map { it.id },
            challengerCardIds = challengerCards.map { it.id },
            worldId = world.id,
            worldTitle = world.title,
            battlefieldMerged = GameLimits.worldBattlefieldLine(world),
            result = result,
            isOnline = false,
            localRole = if (localIsChallenger) MatchRole.CHALLENGER else MatchRole.DEFENDER
        )
        dao.upsertMatch(record.toEntity())

        val localWon = if (localIsChallenger) {
            result.winnerSide == MatchRole.CHALLENGER
        } else {
            result.winnerSide == MatchRole.DEFENDER
        }
        val localDelta = if (localIsChallenger) result.challengerScoreDelta else result.defenderScoreDelta

        updateCardsAfterMatch(
            winners = if (result.winnerSide == MatchRole.DEFENDER) defenderCards else challengerCards,
            losers = if (result.winnerSide == MatchRole.DEFENDER) challengerCards else defenderCards
        )
        updatePlayerAfterMatch(localWon, localDelta, online = false)
        return Result.success(record)
    }

    suspend fun applyOnlineMatch(
        matchId: String,
        mode: MatchMode,
        defenderCards: List<Card>,
        challengerCards: List<Card>,
        worldId: String,
        worldTitle: String,
        battlefieldMerged: String,
        result: BattleResult,
        localIsChallenger: Boolean,
        opponentId: String?,
        opponentNickname: String?
    ): Result<MatchRecord> {
        val record = MatchRecord(
            id = matchId,
            mode = mode,
            defenderCardIds = defenderCards.map { it.id },
            challengerCardIds = challengerCards.map { it.id },
            worldId = worldId,
            worldTitle = worldTitle,
            battlefieldMerged = battlefieldMerged,
            result = result,
            isOnline = true,
            opponentId = opponentId,
            opponentNickname = opponentNickname,
            localRole = if (localIsChallenger) MatchRole.CHALLENGER else MatchRole.DEFENDER
        )
        dao.upsertMatch(record.toEntity())

        val localCards = if (localIsChallenger) challengerCards else defenderCards
        val localWon = if (localIsChallenger) {
            result.winnerSide == MatchRole.CHALLENGER
        } else {
            result.winnerSide == MatchRole.DEFENDER
        }
        val localDelta = if (localIsChallenger) result.challengerScoreDelta else result.defenderScoreDelta

        if (localWon) {
            updateCardsAfterMatch(winners = localCards, losers = emptyList())
        } else {
            updateCardsAfterMatch(winners = emptyList(), losers = localCards)
        }
        updatePlayerAfterMatch(localWon, localDelta, online = true)
        return Result.success(record)
    }

    private suspend fun updateCardsAfterMatch(winners: List<Card>, losers: List<Card>) {
        winners.forEach { card ->
            dao.upsertCard(
                card.copy(
                    wins = card.wins + 1,
                    battleGrade = bumpGrade(card.battleGrade, +1),
                    gloryGrade = bumpGrade(card.gloryGrade, +1)
                ).toEntity()
            )
        }
        losers.forEach { card ->
            dao.upsertCard(
                card.copy(
                    losses = card.losses + 1,
                    battleGrade = bumpGrade(card.battleGrade, -1)
                ).toEntity()
            )
        }
    }

    private fun bumpGrade(current: CardGrade, delta: Int): CardGrade {
        val order = CardGrade.entries
        val idx = (order.indexOf(current) + delta).coerceIn(0, order.lastIndex)
        return order[idx]
    }

    private suspend fun updatePlayerAfterMatch(won: Boolean, delta: Int, online: Boolean) {
        val player = dao.getPlayer()?.toDomain() ?: PlayerProfile()
        val streak = if (won) player.winStreak + 1 else 0
        val gloryGain = if (won) maxOf(delta, 0) + if (online) 12 else 8 else maxOf(delta, 0)
        val updated = player.copy(
            gloryScore = (player.gloryScore + gloryGain).coerceAtLeast(0),
            winStreak = streak,
            rankPoints = (player.rankPoints + delta).coerceAtLeast(0)
        )
        dao.upsertPlayer(updated.toEntity())
        recomputePlayerMedals(justWon = won, onlineWin = won && online)
    }

    private suspend fun grantMedal(type: MedalType) {
        val player = dao.getPlayer()?.toDomain() ?: return
        if (player.medals.contains(type)) return
        dao.upsertPlayer(player.copy(medals = player.medals + type).toEntity())
    }

    private suspend fun recomputePlayerMedals(justWon: Boolean = false, onlineWin: Boolean = false) {
        val player = dao.getPlayer()?.toDomain() ?: PlayerProfile()
        val cards = dao.getAllCards().map { it.toDomain() }.filterNot { it.id.startsWith("demo_") }
        val worlds = dao.getAllWorlds().map { it.toDomain() }
        val medals = linkedSetOf<MedalType>().apply { addAll(player.medals) }
        if (cards.isNotEmpty()) medals += MedalType.FIRST_CARD
        if (justWon) medals += MedalType.FIRST_WIN
        if (onlineWin) medals += MedalType.ONLINE_WIN
        if (worlds.any { !it.isOfficial }) medals += MedalType.WORLD_MAKER
        if (cards.any { it.id.startsWith("w_") }) medals += MedalType.WORLD_GUEST
        if (player.winStreak >= 3) medals += MedalType.STREAK_3
        if (player.winStreak >= 5) medals += MedalType.STREAK_5
        if (cards.size >= 5) medals += MedalType.COLLECTOR_5
        if (cards.any { it.createGrade.score >= CardGrade.SSR.score || it.overallGrade.score >= CardGrade.SSR.score }) {
            medals += MedalType.SSR_OWNER
        }
        if (player.gloryScore >= 100) medals += MedalType.GLORY_100
        if (player.gloryScore >= 300) medals += MedalType.GLORY_300
        dao.upsertPlayer(player.copy(medals = medals.toList()).toEntity())
    }

    suspend fun mergeCloudContent(worlds: List<SmallWorld>, cards: List<Card>) {
        worlds.filter { !it.isOfficial }.forEach { dao.upsertWorld(it.toEntity()) }
        cards.filterNot { it.id.startsWith("demo_") }.forEach { dao.upsertCard(it.toEntity()) }
    }

    suspend fun snapshotForSync(): Pair<List<SmallWorld>, List<Card>> {
        val worlds = dao.getAllWorlds().map { it.toDomain() }.filter { !it.isOfficial }
        val cards = dao.getAllCards().map { it.toDomain() }.filterNot { it.id.startsWith("demo_") }
        return worlds to cards
    }

    suspend fun seedDemoOpponentCards(): List<Card> {
        val demo = listOf(
            Card(
                id = "demo_guard",
                name = "青石守卫",
                lore = "镇守旧桥的沉默石像",
                skills = listOf(SkillDraft("石盾", "格挡一次冲击"), SkillDraft("震地", "短暂迟滞对手")),
                worldId = "demo",
                worldTitle = "投影",
                createGrade = CardGrade.R,
                battleGrade = CardGrade.R,
                reviewedLore = "镇守旧桥的沉默石像",
                reviewedSkills = listOf(SkillDraft("石盾", "格挡一次冲击"), SkillDraft("震地", "短暂迟滞对手"))
            ),
            Card(
                id = "demo_flame",
                name = "烬羽使",
                lore = "以余烬编织羽翼的行者",
                skills = listOf(SkillDraft("烬羽", "灼烧前方区域"), SkillDraft("回旋", "拉开距离反击")),
                worldId = "demo",
                worldTitle = "投影",
                createGrade = CardGrade.SR,
                battleGrade = CardGrade.R,
                gloryGrade = CardGrade.R,
                reviewedLore = "以余烬编织羽翼的行者",
                reviewedSkills = listOf(SkillDraft("烬羽", "灼烧前方区域"), SkillDraft("回旋", "拉开距离反击"))
            ),
            Card(
                id = "demo_tide",
                name = "潮语人",
                lore = "倾听暗流的海岸旅者",
                skills = listOf(SkillDraft("潮涌", "推开近身敌人"), SkillDraft("雾隐", "短暂降低被察觉")),
                worldId = "demo",
                worldTitle = "投影",
                createGrade = CardGrade.R,
                reviewedLore = "倾听暗流的海岸旅者",
                reviewedSkills = listOf(SkillDraft("潮涌", "推开近身敌人"), SkillDraft("雾隐", "短暂降低被察觉"))
            )
        )
        demo.forEach { dao.upsertCard(it.toEntity()) }
        return demo
    }

    fun playerRankScore(cards: List<Card>, player: PlayerProfile): Int {
        val cardScore = cards
            .filterNot { it.id.startsWith("demo_") }
            .sumOf { it.overallGrade.score + it.wins * 2 }
        return player.rankPoints + cardScore / 2 + player.medals.size * 8
    }

    fun presetsFor(worldId: String) = WorldCatalog.presetsFor(worldId)
}
