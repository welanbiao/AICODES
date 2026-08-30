/** 战报话术：落地见血 + 先算后打。每段 100~1000 字。 */

export type BattleFighter = { name: string; skill: string }

function clamp(text: string, max = 1000): string {
  const t = text.trim()
  return t.length > max ? t.slice(0, max) : t
}

export function composeBattleReport(
  worldTitle: string,
  field: string,
  defender: BattleFighter,
  challenger: BattleFighter,
  challengerWins = true,
) {
  const d = defender
  const c = challenger
  const summary = clamp(
    `【${worldTitle}】${field}${d.name}守擂，${c.name}来挑战。开场双方都只拿气机量距离，谁也不肯先亮压箱底的手段。` +
      `${d.name}以「${d.skill}」占位，${c.name}用「${c.skill}」拆招。交锋里护体碎、吐血、退开，都是代价，不是结局。` +
      `越界的花活被世界规则压成空响。` +
      (challengerWins
        ? `${c.name}在同一套规则里找到破绽，${d.name}护体裂开后只能换退。挑战方同样不赶尽杀绝，点到为止，胜负已明。`
        : `几十息后先乱节奏的是${c.name}。${d.name}没有赶尽杀绝，收势定胜——地利只帮了一手，真正把胜负钉住的，是对方把底牌打早了。`),
  )
  const rounds = [
    {
      round: 1,
      hint: 'entrance',
      narrative: clamp(
        `双方踏入${worldTitle}。${field}气压先压在脚底，守擂方只有轻微地利，远不够定胜。` +
          `${d.name}把气机收进护体里，先不亮全貌；${c.name}对上这股气息，也只伸出一指试探。` +
          `「${d.skill}」刚起半寸，${c.name}便以「${c.skill}」去撞。金光一亮一暗，谁也没把第二手打出来。` +
          `这一息只是量距离：谁先急，谁先把破绽送给对方。暗道一声——此时亮底牌，太不划算。`,
      ),
    },
    {
      round: 2,
      hint: 'burst',
      narrative: clamp(
        `${d.name}第二手不再留情，「${d.skill}」直取中宫。${c.name}护体被震得发闷，退开半丈，掌心已有血意，却在退势里甩出「${c.skill}」。` +
          `两道手段在${worldTitle}的规则里对撞，轰然散成碎屑，法器光芒暗澹，符光也只剩下残响。` +
          `若有越界的招式，此刻只会落空，只余声势，连护体都肯不动。` +
          `双方各吐一口浊气：这一击换得见血，再硬撼就要把压箱底的手段赔进去。先算得失的人，才会把下一手留到破绽真正出现。`,
      ),
    },
    {
      round: 3,
      hint: challengerWins ? 'slash' : 'guard',
      narrative: clamp(
        challengerWins
          ? `${d.name}把地利当成胜券，「${d.skill}」打满却露出收势的空当。` +
            `${c.name}算过了：最多亏一层护体，值得一搏。于是「${c.skill}」专打那道裂口，守擂护体先乱。` +
            `世界规则不帮任何越界的狠招，只认贴合${worldTitle}的手段。${d.name}退开，承认先机已失。挑战方点到为止，逆转定胜。`
          : `${c.name}想抢先机，气机却被战场压矮半分，「${c.skill}」来得猛，落点却虚。` +
            `${d.name}借这半息把「${d.skill}」送进破绽，护体寸寸裂开的是挑战方。${c.name}只能换退，再打下去便是两败俱伤。` +
            `守擂方没有把地利写成必胜，只是用这半息把节奏钉死。${d.name}收势，不取首级。险胜，胜在先机，不在口号。`,
      ),
    },
  ]
  return { summary, rounds }
}
