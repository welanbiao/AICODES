package com.aikp.cardgame.data.online

import com.aikp.cardgame.BuildConfig
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
data class AuthUserDto(
    val id: String = "",
    val username: String = "",
    val nickname: String = "",
    val role: String = "user",
    val isAdmin: Boolean = false,
    val rankPoints: Int = 0,
    val gloryScore: Int = 0,
    val winStreak: Int = 0,
    val wins: Int = 0,
    val losses: Int = 0,
    val createdAt: Long = 0
)

@Serializable
data class AuthResponseDto(
    val token: String = "",
    val expiresAt: Long = 0,
    val user: AuthUserDto = AuthUserDto()
)

@Serializable
data class AuthMeDto(
    val user: AuthUserDto = AuthUserDto()
)

@Serializable
data class AdminUsersDto(
    val users: List<AuthUserDto> = emptyList()
)

@Serializable
private data class AuthCredentialsBody(
    val username: String,
    val password: String,
    val nickname: String = ""
)

@Serializable
private data class AuthNicknameBody(
    val nickname: String
)

@Serializable
private data class PasswordBody(
    val password: String
)

class AuthClient(
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
    suspend fun login(username: String, password: String): Result<AuthResponseDto> =
        postAuth("/v1/auth/login", AuthCredentialsBody(username, password))

    suspend fun me(token: String): Result<AuthUserDto> = withContext(Dispatchers.IO) {
        runCatching {
            val httpReq = Request.Builder()
                .url("$baseUrl/v1/auth/me")
                .header("Authorization", "Bearer $token")
                .get()
                .build()
            client.newCall(httpReq).execute().use { resp ->
                val raw = resp.body?.string().orEmpty()
                if (!resp.isSuccessful) error(parseError(raw) ?: "登录已失效")
                json.decodeFromString(AuthMeDto.serializer(), raw).user
            }
        }
    }

    suspend fun updateNickname(token: String, nickname: String): Result<AuthUserDto> =
        withContext(Dispatchers.IO) {
            runCatching {
                val body = json.encodeToString(AuthNicknameBody.serializer(), AuthNicknameBody(nickname))
                    .toRequestBody("application/json".toMediaType())
                val httpReq = Request.Builder()
                    .url("$baseUrl/v1/auth/profile")
                    .header("Authorization", "Bearer $token")
                    .put(body)
                    .build()
                client.newCall(httpReq).execute().use { resp ->
                    val raw = resp.body?.string().orEmpty()
                    if (!resp.isSuccessful) error(parseError(raw) ?: "更新失败")
                    json.decodeFromString(AuthMeDto.serializer(), raw).user
                }
            }
        }

    suspend fun logout(token: String): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val httpReq = Request.Builder()
                .url("$baseUrl/v1/auth/logout")
                .header("Authorization", "Bearer $token")
                .post("{}".toRequestBody("application/json".toMediaType()))
                .build()
            client.newCall(httpReq).execute().use { /* ignore */ }
            Unit
        }
    }

    suspend fun listUsers(token: String): Result<List<AuthUserDto>> = withContext(Dispatchers.IO) {
        runCatching {
            val httpReq = Request.Builder()
                .url("$baseUrl/v1/admin/users")
                .header("Authorization", "Bearer $token")
                .get()
                .build()
            client.newCall(httpReq).execute().use { resp ->
                val raw = resp.body?.string().orEmpty()
                if (!resp.isSuccessful) error(parseError(raw) ?: "加载账号失败")
                json.decodeFromString(AdminUsersDto.serializer(), raw).users
            }
        }
    }

    suspend fun createUser(
        token: String,
        username: String,
        password: String,
        nickname: String
    ): Result<AuthUserDto> = withContext(Dispatchers.IO) {
        runCatching {
            val body = json.encodeToString(
                AuthCredentialsBody.serializer(),
                AuthCredentialsBody(username, password, nickname)
            ).toRequestBody("application/json".toMediaType())
            val httpReq = Request.Builder()
                .url("$baseUrl/v1/admin/users")
                .header("Authorization", "Bearer $token")
                .post(body)
                .build()
            client.newCall(httpReq).execute().use { resp ->
                val raw = resp.body?.string().orEmpty()
                if (!resp.isSuccessful) error(parseError(raw) ?: "创建失败")
                json.decodeFromString(AuthMeDto.serializer(), raw).user
            }
        }
    }

    suspend fun resetPassword(token: String, userId: String, password: String): Result<AuthUserDto> =
        withContext(Dispatchers.IO) {
            runCatching {
                val body = json.encodeToString(PasswordBody.serializer(), PasswordBody(password))
                    .toRequestBody("application/json".toMediaType())
                val httpReq = Request.Builder()
                    .url("$baseUrl/v1/admin/users/${java.net.URLEncoder.encode(userId, Charsets.UTF_8.name())}/password")
                    .header("Authorization", "Bearer $token")
                    .put(body)
                    .build()
                client.newCall(httpReq).execute().use { resp ->
                    val raw = resp.body?.string().orEmpty()
                    if (!resp.isSuccessful) error(parseError(raw) ?: "重置失败")
                    json.decodeFromString(AuthMeDto.serializer(), raw).user
                }
            }
        }

    suspend fun deleteUser(token: String, userId: String): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val httpReq = Request.Builder()
                .url("$baseUrl/v1/admin/users/${java.net.URLEncoder.encode(userId, Charsets.UTF_8.name())}")
                .header("Authorization", "Bearer $token")
                .delete()
                .build()
            client.newCall(httpReq).execute().use { resp ->
                val raw = resp.body?.string().orEmpty()
                if (!resp.isSuccessful) error(parseError(raw) ?: "删除失败")
            }
            Unit
        }
    }

    private suspend fun postAuth(path: String, body: AuthCredentialsBody): Result<AuthResponseDto> =
        withContext(Dispatchers.IO) {
            runCatching {
                val payload = json.encodeToString(AuthCredentialsBody.serializer(), body)
                    .toRequestBody("application/json".toMediaType())
                val httpReq = Request.Builder()
                    .url("$baseUrl$path")
                    .post(payload)
                    .build()
                client.newCall(httpReq).execute().use { resp ->
                    val raw = resp.body?.string().orEmpty()
                    if (!resp.isSuccessful) error(parseError(raw) ?: "请求失败 HTTP ${resp.code}")
                    json.decodeFromString(AuthResponseDto.serializer(), raw)
                }
            }
        }

    private fun parseError(raw: String): String? = runCatching {
        json.parseToJsonElement(raw).jsonObject["error"]?.jsonPrimitive?.content
    }.getOrNull()
}
