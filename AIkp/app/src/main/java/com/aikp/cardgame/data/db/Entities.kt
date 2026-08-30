package com.aikp.cardgame.data.db

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverter
import com.aikp.cardgame.domain.model.Card
import com.aikp.cardgame.domain.model.CardGrade
import com.aikp.cardgame.domain.model.MatchMode
import com.aikp.cardgame.domain.model.MatchRecord
import com.aikp.cardgame.domain.model.MedalType
import com.aikp.cardgame.domain.model.PlayerProfile
import com.aikp.cardgame.domain.model.SkillDraft
import com.aikp.cardgame.domain.model.SmallWorld
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

private val json = Json { ignoreUnknownKeys = true }

@Entity(tableName = "cards")
data class CardEntity(
    @PrimaryKey val id: String,
    val payload: String
)

@Entity(tableName = "worlds")
data class WorldEntity(
    @PrimaryKey val id: String,
    val payload: String
)

@Entity(tableName = "matches")
data class MatchEntity(
    @PrimaryKey val id: String,
    val payload: String,
    val createdAt: Long
)

@Entity(tableName = "player")
data class PlayerEntity(
    @PrimaryKey val id: String = "local_player",
    val payload: String
)

class Converters {
    @TypeConverter
    fun gradesToString(value: CardGrade): String = value.name

    @TypeConverter
    fun stringToGrade(value: String): CardGrade = CardGrade.fromLabel(value)
}

fun Card.toEntity() = CardEntity(id, json.encodeToString(this))
fun CardEntity.toDomain() = json.decodeFromString<Card>(payload)

fun SmallWorld.toEntity() = WorldEntity(id, json.encodeToString(this))
fun WorldEntity.toDomain() = json.decodeFromString<SmallWorld>(payload)

fun MatchRecord.toEntity() = MatchEntity(id, json.encodeToString(this), createdAt)
fun MatchEntity.toDomain() = json.decodeFromString<MatchRecord>(payload)

fun PlayerProfile.toEntity() = PlayerEntity(id, json.encodeToString(this))
fun PlayerEntity.toDomain() = json.decodeFromString<PlayerProfile>(payload)

fun List<SkillDraft>.encodeSkills(): String = json.encodeToString(this)
fun String.decodeSkills(): List<SkillDraft> = json.decodeFromString(this)

fun List<MedalType>.encodeMedals(): String = json.encodeToString(this.map { it.name })
fun String.decodeMedals(): List<MedalType> =
    json.decodeFromString<List<String>>(this).mapNotNull { runCatching { MedalType.valueOf(it) }.getOrNull() }

fun MatchMode.encode(): String = name
