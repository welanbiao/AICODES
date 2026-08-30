package com.aikp.cardgame.data.online

import com.aikp.cardgame.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import kotlinx.serialization.KSerializer
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

class MatchmakingClient(
    private val baseUrl: String = BuildConfig.AI_BRIDGE_URL,
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build(),
    private val json: Json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }
) {
    suspend fun fetchLobby(): Result<LobbyDto> =
        get("/v1/match/lobby", LobbyDto.serializer())

    suspend fun fetchLeaderboard(): Result<LeaderboardDto> =
        get("/v1/match/leaderboard", LeaderboardDto.serializer())

    suspend fun enqueue(request: QueueRequest): Result<TicketStatusDto> = withContext(Dispatchers.IO) {
        runCatching {
            val body = json.encodeToString(QueueRequest.serializer(), request)
                .toRequestBody("application/json".toMediaType())
            val httpReq = Request.Builder()
                .url("$baseUrl/v1/match/queue")
                .post(body)
                .build()
            client.newCall(httpReq).execute().use { resp ->
                val raw = resp.body?.string().orEmpty()
                if (!resp.isSuccessful) error(parseError(raw) ?: "匹配入队失败 HTTP ${resp.code}")
                json.decodeFromString(TicketStatusDto.serializer(), raw)
            }
        }
    }

    suspend fun pollTicket(ticketId: String): Result<TicketStatusDto> =
        get("/v1/match/ticket/$ticketId", TicketStatusDto.serializer())

    suspend fun cancel(ticketId: String): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val httpReq = Request.Builder()
                .url("$baseUrl/v1/match/ticket/$ticketId")
                .delete()
                .build()
            client.newCall(httpReq).execute().use { resp ->
                if (!resp.isSuccessful) error("取消失败 HTTP ${resp.code}")
            }
            Unit
        }
    }

    suspend fun waitUntilSettled(
        ticketId: String,
        maxWaitMs: Long = 120_000L,
        onUpdate: (TicketStatusDto) -> Unit = {}
    ): Result<TicketStatusDto> {
        val start = System.currentTimeMillis()
        while (System.currentTimeMillis() - start < maxWaitMs) {
            val ticket = pollTicket(ticketId).getOrElse { return Result.failure(it) }
            onUpdate(ticket)
            when (ticket.status) {
                "finished" -> return Result.success(ticket)
                "cancelled" -> return Result.failure(IllegalStateException("已取消匹配"))
                "timeout" -> return Result.failure(IllegalStateException("匹配超时，请重试或改用练习战"))
            }
            delay(1500)
        }
        return Result.failure(IllegalStateException("匹配等待超时"))
    }

    private suspend fun <T> get(path: String, serializer: KSerializer<T>): Result<T> =
        withContext(Dispatchers.IO) {
            runCatching {
                val httpReq = Request.Builder().url("$baseUrl$path").get().build()
                client.newCall(httpReq).execute().use { resp ->
                    val raw = resp.body?.string().orEmpty()
                    if (!resp.isSuccessful) error(parseError(raw) ?: "请求失败 HTTP ${resp.code}")
                    json.decodeFromString(serializer, raw)
                }
            }
        }

    private fun parseError(raw: String): String? = runCatching {
        json.parseToJsonElement(raw).jsonObject["error"]?.jsonPrimitive?.content
    }.getOrNull()
}
