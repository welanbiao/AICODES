package com.aikp.cardgame.ui.components

import androidx.annotation.DrawableRes
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aikp.cardgame.R
import com.aikp.cardgame.domain.model.Card
import com.aikp.cardgame.domain.model.SkillDraft
import com.aikp.cardgame.domain.model.SmallWorld
import com.aikp.cardgame.ui.theme.Brass
import com.aikp.cardgame.ui.theme.BrassDim
import com.aikp.cardgame.ui.theme.Ink
import com.aikp.cardgame.ui.theme.Jade
import com.aikp.cardgame.ui.theme.Mist
import com.aikp.cardgame.ui.theme.MistDim
import coil.compose.AsyncImage
import androidx.compose.foundation.layout.aspectRatio

private val Plate = Color(0xFFFFF4D2)
private val CoverShape = RoundedCornerShape(16.dp)
private val CtaShape = RoundedCornerShape(14.dp)
private val PanelShape = RoundedCornerShape(12.dp)

@Composable
fun CharacterArtCard(
    cardId: String,
    name: String,
    modifier: Modifier = Modifier,
    grade: String = "R",
    nickname: String = "",
    skills: List<SkillDraft> = emptyList()
) {
    val shape = RoundedCornerShape(12.dp)
    val gradeKey = grade.uppercase()
    val nameColor = gradeNameColor(gradeKey)
    val badgeColor = gradeBadgeColor(gradeKey)
    Box(
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(3f / 4f)
            .clip(shape)
            .border(1.dp, Brass.copy(alpha = 0.5f), shape)
    ) {
        AsyncImage(
            model = "file:///android_asset/cards/$cardId.jpg",
            contentDescription = name,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        listOf(
                            Color.Transparent,
                            Color(0x140B1220),
                            Color(0xB80B1220),
                            Color(0xF00B1220)
                        ),
                        startY = 0f,
                        endY = Float.POSITIVE_INFINITY
                    )
                )
        )
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .fillMaxWidth()
                .padding(horizontal = 10.dp, vertical = 10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = name,
                        color = nameColor,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        style = MaterialTheme.typography.titleLarge.copy(
                            shadow = androidx.compose.ui.graphics.Shadow(
                                color = Color.Black.copy(alpha = 0.85f),
                                blurRadius = 6f
                            )
                        )
                    )
                    if (nickname.isNotBlank()) {
                        Text(
                            text = nickname,
                            color = Plate.copy(alpha = 0.88f),
                            fontSize = 11.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
                Text(
                    text = gradeKey,
                    color = Ink,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier
                        .background(badgeColor, RoundedCornerShape(5.dp))
                        .padding(horizontal = 7.dp, vertical = 3.dp)
                )
            }
            if (skills.isNotEmpty()) {
                Spacer(Modifier.height(6.dp))
                skills.take(3).forEach { skill ->
                    Text(
                        text = skill.name,
                        color = Plate,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = skill.description,
                        color = Color(0xFF96C4E6),
                        fontSize = 10.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(Modifier.height(3.dp))
                }
            }
        }
    }
}

private fun gradeNameColor(grade: String): Color = when (grade) {
    "UR", "SSR" -> Color(0xFFF5D76E)
    "SR" -> Color(0xFFD296FF)
    "R" -> Color(0xFFFF9C40)
    else -> Color(0xFF5AD296)
}

private fun gradeBadgeColor(grade: String): Color = when (grade) {
    "UR", "SSR" -> Color(0xFFE0C35A)
    "SR" -> Color(0xFFA86EE6)
    "R" -> Color(0xFFE88430)
    else -> Color(0xFF48A878)
}

fun coverRes(key: String): Int = when (key) {
    "xiyou" -> R.drawable.cover_xiyou
    "sanguo" -> R.drawable.cover_sanguo
    "shuihu" -> R.drawable.cover_shuihu
    "liaozhai" -> R.drawable.cover_liaozhai
    "classics" -> R.drawable.cover_classics
    "history" -> R.drawable.cover_history
    "drama" -> R.drawable.cover_drama
    else -> R.drawable.cover_novel
}

@Composable
fun HallBackground(
    @DrawableRes art: Int = R.drawable.bg_hall,
    content: @Composable ColumnScope.() -> Unit
) {
    Box(modifier = Modifier.fillMaxSize()) {
        Image(
            painter = painterResource(art),
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        listOf(
                            Ink.copy(alpha = 0.18f),
                            Ink.copy(alpha = 0.46f),
                            Ink.copy(alpha = 0.82f)
                        )
                    )
                )
        )
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            content = content
        )
    }
}

@Composable
fun ArenaBackground(content: @Composable ColumnScope.() -> Unit) {
    HallBackground(art = R.drawable.bg_battle, content = content)
}

@Composable
fun ArtCta(
    @DrawableRes art: Int,
    title: String,
    subtitle: String? = null,
    modifier: Modifier = Modifier,
    compact: Boolean = false,
    enabled: Boolean = true,
    onClick: () -> Unit
) {
    val height: Dp = when {
        compact -> 54.dp
        subtitle != null -> 84.dp
        else -> 70.dp
    }
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(height)
            .clip(CtaShape)
            .border(1.dp, Brass.copy(alpha = if (enabled) 0.7f else 0.28f), CtaShape)
            .alpha(if (enabled) 1f else 0.45f)
            .clickable(enabled = enabled, onClick = onClick)
    ) {
        Image(
            painter = painterResource(art),
            contentDescription = title,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.horizontalGradient(
                        listOf(
                            Ink.copy(alpha = 0.42f),
                            Ink.copy(alpha = 0.22f),
                            Ink.copy(alpha = 0.42f)
                        )
                    )
                )
        )
        Column(
            modifier = Modifier
                .align(Alignment.Center)
                .padding(horizontal = 14.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                title,
                color = Plate,
                style = if (compact) MaterialTheme.typography.titleLarge.copy(fontSize = 16.sp) else MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            if (subtitle != null) {
                Spacer(Modifier.height(2.dp))
                Text(subtitle, color = Mist, style = MaterialTheme.typography.labelLarge)
            }
        }
    }
}

@Composable
fun WorldCoverCard(world: SmallWorld, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(148.dp)
            .clip(CoverShape)
            .border(1.dp, Brass.copy(alpha = 0.55f), CoverShape)
            .clickable(onClick = onClick)
    ) {
        Image(
            painter = painterResource(coverRes(world.coverKey)),
            contentDescription = world.title,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        listOf(Color.Transparent, Ink.copy(alpha = 0.55f), Ink.copy(alpha = 0.9f))
                    )
                )
        )
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(12.dp)
        ) {
            Text(world.genre.label, color = Brass, style = MaterialTheme.typography.labelLarge)
            Text(world.title, color = Plate, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text(
                world.battlefieldPrompt,
                color = Mist,
                style = MaterialTheme.typography.bodyMedium,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
        if (world.isOfficial) {
            Text(
                "官方",
                color = Ink,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(10.dp)
                    .background(Brass, RoundedCornerShape(4.dp))
                    .padding(horizontal = 7.dp, vertical = 3.dp)
            )
        }
    }
}

@Composable
fun GlassPanel(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .border(1.dp, Brass.copy(alpha = 0.28f), PanelShape)
            .background(Ink.copy(alpha = 0.58f), PanelShape)
            .padding(12.dp),
        content = content
    )
}

@Composable
fun SectionTitle(title: String, subtitle: String? = null) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = title,
            style = MaterialTheme.typography.headlineMedium,
            color = Plate
        )
        if (subtitle != null) {
            Spacer(Modifier.height(4.dp))
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = MistDim
            )
        }
    }
}

@Composable
fun GradeChip(text: String) {
    Text(
        text = text,
        color = Ink,
        style = MaterialTheme.typography.labelLarge,
        modifier = Modifier
            .background(Brass, RoundedCornerShape(4.dp))
            .padding(horizontal = 8.dp, vertical = 3.dp)
    )
}

@Composable
fun CardTile(card: Card, selected: Boolean = false, onClick: (() -> Unit)? = null) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .border(
                width = if (selected) 2.dp else 1.dp,
                color = if (selected) Brass else BrassDim.copy(alpha = 0.45f),
                shape = PanelShape
            )
            .background(Ink.copy(alpha = 0.62f), PanelShape)
            .padding(14.dp)
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(card.name, style = MaterialTheme.typography.titleLarge, color = Plate)
            GradeChip(card.overallGrade.label)
        }
        if (card.worldTitle.isNotBlank()) {
            Spacer(Modifier.height(4.dp))
            Text("世界 · ${card.worldTitle}", style = MaterialTheme.typography.labelLarge, color = Brass)
        }
        Spacer(Modifier.height(6.dp))
        Text(card.reviewedLore, style = MaterialTheme.typography.bodyMedium, color = MistDim)
        Spacer(Modifier.height(8.dp))
        Text(
            "初创 ${card.createGrade.label} · 对战 ${card.battleGrade.label} · 荣耀 ${card.gloryGrade.label}",
            style = MaterialTheme.typography.labelLarge,
            color = Jade
        )
        Spacer(Modifier.height(6.dp))
        card.reviewedSkills.forEach { skill ->
            Text(
                "· ${skill.name}：${skill.description}",
                style = MaterialTheme.typography.bodyMedium,
                color = Mist
            )
        }
    }
}

@Composable
fun BusyOverlay(visible: Boolean, tip: String = "AI 演算中…", subtitle: String? = null) {
    if (!visible) return
    val glow by rememberInfiniteTransition(label = "busy").animateFloat(
        initialValue = 0.45f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(900), RepeatMode.Reverse),
        label = "glow"
    )
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Ink.copy(alpha = 0.72f)),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = Brass.copy(alpha = glow), modifier = Modifier.size(42.dp))
            Spacer(Modifier.height(12.dp))
            Text(tip, color = Mist, style = MaterialTheme.typography.bodyLarge)
            if (!subtitle.isNullOrBlank()) {
                Spacer(Modifier.height(6.dp))
                Text(subtitle, color = MistDim, style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}
