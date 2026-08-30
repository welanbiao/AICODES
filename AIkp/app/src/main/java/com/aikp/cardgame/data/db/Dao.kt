package com.aikp.cardgame.data.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface GameDao {
    @Query("SELECT * FROM cards ORDER BY id DESC")
    fun observeCards(): Flow<List<CardEntity>>

    @Query("SELECT * FROM cards ORDER BY id DESC")
    suspend fun getAllCards(): List<CardEntity>

    @Query("SELECT * FROM cards WHERE id = :id LIMIT 1")
    suspend fun getCard(id: String): CardEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertCard(entity: CardEntity)

    @Query("DELETE FROM cards WHERE id = :id")
    suspend fun deleteCard(id: String)

    @Query("SELECT * FROM worlds ORDER BY id DESC")
    fun observeWorlds(): Flow<List<WorldEntity>>

    @Query("SELECT * FROM worlds ORDER BY id DESC")
    suspend fun getAllWorlds(): List<WorldEntity>

    @Query("SELECT * FROM worlds WHERE id = :id LIMIT 1")
    suspend fun getWorld(id: String): WorldEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertWorld(entity: WorldEntity)

    @Query("SELECT * FROM matches ORDER BY createdAt DESC")
    fun observeMatches(): Flow<List<MatchEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertMatch(entity: MatchEntity)

    @Query("SELECT * FROM player WHERE id = :id LIMIT 1")
    fun observePlayer(id: String = "local_player"): Flow<PlayerEntity?>

    @Query("SELECT * FROM player WHERE id = :id LIMIT 1")
    suspend fun getPlayer(id: String = "local_player"): PlayerEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertPlayer(entity: PlayerEntity)
}
