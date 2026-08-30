package com.aikp.cardgame.ui.components

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.aikp.cardgame.ui.theme.Brass
import com.aikp.cardgame.ui.theme.Jade
import com.aikp.cardgame.ui.theme.Mist
import com.aikp.cardgame.ui.theme.MistDim
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun MatchWaitAnimation(
    title: String = "同世界匹配中",
    subtitle: String = "双方进入同一小世界，战场为世界背景。",
    modifier: Modifier = Modifier
) {
    val infinite = rememberInfiniteTransition(label = "matchWait")
    val pulse by infinite.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(1600, easing = LinearEasing), RepeatMode.Restart),
        label = "pulse"
    )
    val sway by infinite.animateFloat(
        initialValue = -1f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(1200, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "sway"
    )
    val spin by infinite.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(4200, easing = LinearEasing), RepeatMode.Restart),
        label = "spin"
    )
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(168.dp),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val cx = size.width * 0.5f
                val cy = size.height * 0.52f
                val maxR = size.minDimension * 0.42f
                for (i in 0..2) {
                    val t = (pulse + i * 0.28f) % 1f
                    drawCircle(
                        color = Brass.copy(alpha = (1f - t) * 0.32f),
                        radius = maxR * (0.35f + t * 0.7f),
                        center = Offset(cx, cy),
                        style = Stroke(width = 2.5f)
                    )
                }
                rotate(spin, Offset(cx, cy)) {
                    drawCircle(
                        color = Jade.copy(alpha = 0.28f),
                        radius = maxR * 0.78f,
                        center = Offset(cx, cy),
                        style = Stroke(width = 1.6f)
                    )
                    for (i in 0..5) {
                        val a = Math.toRadians((i * 60).toDouble())
                        val px = cx + cos(a).toFloat() * maxR * 0.78f
                        val py = cy + sin(a).toFloat() * maxR * 0.78f
                        drawCircle(color = Brass.copy(alpha = 0.55f), radius = 3.2f, center = Offset(px, py))
                    }
                }
                val gap = 18f + sway * 8f
                val cardW = size.width * 0.18f
                val cardH = cardW * 4f / 3f
                val left = Offset(cx - gap - cardW, cy - cardH * 0.5f)
                val right = Offset(cx + gap, cy - cardH * 0.5f)
                drawRoundRect(
                    color = Brass.copy(alpha = 0.18f),
                    topLeft = left,
                    size = Size(cardW, cardH),
                    cornerRadius = CornerRadius(10f, 10f)
                )
                drawRoundRect(
                    brush = Brush.verticalGradient(listOf(Brass.copy(alpha = 0.7f), Color(0xFF2A3348))),
                    topLeft = left,
                    size = Size(cardW, cardH),
                    cornerRadius = CornerRadius(10f, 10f),
                    style = Stroke(width = 3f)
                )
                drawRoundRect(
                    color = Jade.copy(alpha = 0.18f),
                    topLeft = right,
                    size = Size(cardW, cardH),
                    cornerRadius = CornerRadius(10f, 10f)
                )
                drawRoundRect(
                    brush = Brush.verticalGradient(listOf(Jade.copy(alpha = 0.7f), Color(0xFF2A3348))),
                    topLeft = right,
                    size = Size(cardW, cardH),
                    cornerRadius = CornerRadius(10f, 10f),
                    style = Stroke(width = 3f)
                )
                val sparkAlpha = 0.35f + (1f - abs(sway)) * 0.55f
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(Mist.copy(alpha = sparkAlpha), Color.Transparent),
                        center = Offset(cx, cy),
                        radius = 28f
                    ),
                    radius = 22f,
                    center = Offset(cx, cy)
                )
                drawLine(
                    color = Mist.copy(alpha = sparkAlpha),
                    start = Offset(cx - 16f, cy),
                    end = Offset(cx + 16f, cy),
                    strokeWidth = 2.4f
                )
            }
        }
        Text(title, color = Mist, style = MaterialTheme.typography.titleLarge, textAlign = TextAlign.Center)
        Spacer(Modifier.height(6.dp))
        Text(subtitle, color = MistDim, style = MaterialTheme.typography.bodyMedium, textAlign = TextAlign.Center)
        Spacer(Modifier.height(10.dp))
        WaitDots()
    }
}

@Composable
private fun WaitDots() {
    val infinite = rememberInfiniteTransition(label = "dots")
    val phase by infinite.animateFloat(
        initialValue = 0f,
        targetValue = 3f,
        animationSpec = infiniteRepeatable(tween(1200, easing = LinearEasing), RepeatMode.Restart),
        label = "phase"
    )
    Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        repeat(3) { i ->
            val on = (phase.toInt() % 3) == i
            Canvas(modifier = Modifier.size(10.dp)) {
                drawCircle(
                    color = if (on) Brass else Brass.copy(alpha = 0.28f),
                    radius = if (on) 5f else 3.5f
                )
            }
        }
    }
}

@Composable
fun EntranceEffectBanner(active: Boolean) {
    if (!active) return
    val progress = remember { Animatable(0f) }
    LaunchedEffect(active) {
        progress.snapTo(0f)
        progress.animateTo(1f, tween(1200, easing = FastOutSlowInEasing))
    }
    Canvas(
        modifier = Modifier
            .fillMaxWidth()
            .height(72.dp)
    ) {
        val w = size.width
        val h = size.height
        val x = w * progress.value
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(Brass.copy(alpha = 0.55f), Color.Transparent),
                center = Offset(x, h * 0.5f),
                radius = h * 0.9f
            ),
            radius = h * 0.7f,
            center = Offset(x, h * 0.5f)
        )
        drawLine(
            color = Mist.copy(alpha = 0.35f + 0.4f * progress.value),
            start = Offset(0f, h * 0.5f),
            end = Offset(w * progress.value, h * 0.5f),
            strokeWidth = 3f
        )
    }
}

@Composable
fun CommonBattleAura(effectHint: String) {
    val infinite = rememberInfiniteTransition(label = "aura")
    val pulse by infinite.animateFloat(
        initialValue = 0.2f,
        targetValue = 0.85f,
        animationSpec = infiniteRepeatable(tween(900, easing = LinearEasing), RepeatMode.Reverse),
        label = "pulse"
    )
    val color = when (effectHint.lowercase()) {
        "burst" -> Brass
        "guard" -> Jade
        "entrance" -> Mist
        else -> Color(0xFF7EB6FF)
    }
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(56.dp)
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            drawCircle(
                color = color.copy(alpha = pulse * 0.35f),
                radius = size.minDimension * (0.35f + pulse * 0.2f),
                center = Offset(size.width * 0.5f, size.height * 0.5f),
                style = Stroke(width = 4f)
            )
            drawCircle(
                color = color.copy(alpha = pulse * 0.2f),
                radius = size.minDimension * 0.2f,
                center = Offset(size.width * 0.5f, size.height * 0.5f)
            )
        }
    }
}
