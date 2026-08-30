package com.aikp.cardgame.data.ai

import com.aikp.cardgame.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

@Serializable
data class AiChatRequest(
    val task: String,
    val prompt: String,
    val model: String = "composer-2.5"
)

@Serializable
data class AiChatResponse(
    val text: String,
    val source: String = "bridge",
    val mock: Boolean = false
)

class AiBridgeClient(
    private val baseUrl: String = BuildConfig.AI_BRIDGE_URL,
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(120, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build(),
    private val json: Json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }
) {
    suspend fun complete(task: String, prompt: String): AiChatResponse = withContext(Dispatchers.IO) {
        val body = json.encodeToString(
            AiChatRequest.serializer(),
            AiChatRequest(task = task, prompt = prompt)
        ).toRequestBody("application/json".toMediaType())

        val request = Request.Builder()
            .url("$baseUrl/v1/ai/complete")
            .post(body)
            .build()

        runCatching {
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    error("AI bridge HTTP ${response.code}")
                }
                val raw = response.body?.string().orEmpty()
                json.decodeFromString(AiChatResponse.serializer(), raw)
            }
        }.getOrElse {
            // Offline / bridge down: deterministic local mock so UI flow still works
            LocalAiFallback.complete(task, prompt)
        }
    }
}
