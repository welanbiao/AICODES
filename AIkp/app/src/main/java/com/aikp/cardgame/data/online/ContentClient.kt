package com.aikp.cardgame.data.online

import com.aikp.cardgame.BuildConfig
import com.aikp.cardgame.domain.model.Card
import com.aikp.cardgame.domain.model.CardGrade
import com.aikp.cardgame.domain.model.SkillDraft
import com.aikp.cardgame.domain.model.SmallWorld
import com.aikp.cardgame.domain.model.WorldGenre
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

@Serializable
data class CloudSkillDto(
    val name: String = "",
    val description: String = ""
)

@Serializable
data class CloudWorldDto(
    val id: String = "",
    val title: String = "",
    val genre: String = "CUSTOM",
    val sourceHint: String = "",
    val lore: String = "",
    val reviewedLore: String = "",
    val fullLore: String = "",
    val canonHint: String = "",
    val coverKey: String = "novel",
    val isOfficial: Boolean = false,
    val creatorId: String? = null,
    val createdAt: Long = 0
)

@Serializable
data class CloudCardDto(
    val id: String = "",
    val name: String = "",
    val lore: String = "",
    val skills: List<CloudSkillDto> = emptyList(),
    val worldId: String = "",
    val worldTitle: String = "",
    val imageUri: String? = null,
    val createGrade: String = "N",
    val battleGrade: String = "N",
    val gloryGrade: String = "N",
    val wins: Int = 0,
    val losses: Int = 0,
    val createdAt: Long = 0,
    val reviewedLore: String = "",
    val reviewedSkills: List<CloudSkillDto> = emptyList()
)

@Serializable
data class UserContentDto(
    val worlds: List<CloudWorldDto> = emptyList(),
    val cards: List<CloudCardDto> = emptyList(),
    val updatedAt: Long = 0
)

@Serializable
private data class ContentBody(
    val worlds: List<CloudWorldDto>,
    val cards: List<CloudCardDto>
)

fun SmallWorld.toCloudDto(): CloudWorldDto = CloudWorldDto(
    id = id,
    title = title,
    genre = genre.name,
    sourceHint = sourceHint,
    lore = lore,
    reviewedLore = reviewedLore.ifBlank { lore },
    fullLore = fullLore.ifBlank { lore },
    canonHint = canonHint,
    coverKey = coverKey,
    isOfficial = isOfficial,
    creatorId = creatorId,
    createdAt = createdAt
)

fun Card.toCloudDto(): CloudCardDto = CloudCardDto(
    id = id,
    name = name,
    lore = lore,
    skills = skills.map { CloudSkillDto(it.name, it.description) },
    worldId = worldId,
    worldTitle = worldTitle,
    imageUri = imageUri,
    createGrade = createGrade.name,
    battleGrade = battleGrade.name,
    gloryGrade = gloryGrade.name,
    wins = wins,
    losses = losses,
    createdAt = createdAt,
    reviewedLore = reviewedLore.ifBlank { lore },
    reviewedSkills = reviewedSkills.map { CloudSkillDto(it.name, it.description) }
)

fun CloudWorldDto.toDomain(): SmallWorld = SmallWorld(
    id = id,
    title = title,
    genre = WorldGenre.fromLabel(genre),
    sourceHint = sourceHint,
    lore = lore,
    reviewedLore = reviewedLore.ifBlank { lore },
    fullLore = fullLore.ifBlank { lore },
    canonHint = canonHint,
    coverKey = coverKey.ifBlank { "novel" },
    isOfficial = false,
    creatorId = creatorId,
    createdAt = if (createdAt > 0) createdAt else System.currentTimeMillis()
)

fun CloudCardDto.toDomain(): Card {
    val sk = (if (reviewedSkills.isNotEmpty()) reviewedSkills else skills)
        .map { SkillDraft(it.name, it.description) }
    return Card(
        id = id,
        name = name,
        lore = lore,
        skills = sk,
        worldId = worldId,
        worldTitle = worldTitle,
        imageUri = imageUri,
        createGrade = CardGrade.fromLabel(createGrade),
        battleGrade = CardGrade.fromLabel(battleGrade),
        gloryGrade = CardGrade.fromLabel(gloryGrade),
        wins = wins,
        losses = losses,
        createdAt = if (createdAt > 0) createdAt else System.currentTimeMillis(),
        reviewedLore = reviewedLore.ifBlank { lore },
        reviewedSkills = sk
    )
}

class ContentClient(
    private val baseUrl: String = BuildConfig.AI_BRIDGE_URL,
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build(),
    private val json: Json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }
) {
    suspend fun fetchContent(token: String): Result<UserContentDto> = withContext(Dispatchers.IO) {
        runCatching {
            val httpReq = Request.Builder()
                .url("$baseUrl/v1/me/content")
                .header("Authorization", "Bearer $token")
                .get()
                .build()
            client.newCall(httpReq).execute().use { resp ->
                val raw = resp.body?.string().orEmpty()
                if (!resp.isSuccessful) error(parseError(raw) ?: "拉取存档失败")
                json.decodeFromString(UserContentDto.serializer(), raw)
            }
        }
    }

    suspend fun pushContent(token: String, worlds: List<SmallWorld>, cards: List<Card>): Result<UserContentDto> =
        withContext(Dispatchers.IO) {
            runCatching {
                val body = json.encodeToString(
                    ContentBody.serializer(),
                    ContentBody(
                        worlds = worlds.filter { !it.isOfficial }.map { it.toCloudDto() },
                        cards = cards.filterNot { it.id.startsWith("demo_") }.map { it.toCloudDto() }
                    )
                ).toRequestBody("application/json".toMediaType())
                val httpReq = Request.Builder()
                    .url("$baseUrl/v1/me/content")
                    .header("Authorization", "Bearer $token")
                    .put(body)
                    .build()
                client.newCall(httpReq).execute().use { resp ->
                    val raw = resp.body?.string().orEmpty()
                    if (!resp.isSuccessful) error(parseError(raw) ?: "保存存档失败")
                    json.decodeFromString(UserContentDto.serializer(), raw)
                }
            }
        }

    private fun parseError(raw: String): String? = runCatching {
        json.parseToJsonElement(raw).jsonObject["error"]?.jsonPrimitive?.content
    }.getOrNull()
}
