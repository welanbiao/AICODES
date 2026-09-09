type PartInfo = {
  name: string;
  role: string;
  material: string;
  note: string;
};

const p = (name: string, role: string, material: string, note: string): PartInfo => ({
  name,
  role,
  material,
  note,
});

/** 第四关康纳、第五关诺斯网格图鉴。键为归一化后的节点名。 */
export const HUMAN_CATALOG: Record<string, PartInfo> = {
  connor_jacket: p("外套", "仿生人常服外层", "合成纤维面料", "康纳深色风衣的主体布料。"),
  connor_shirt: p("衬衫", "外套内的正装衬衣", "白色仿棉织物", "RK900 套装里的白衬衫。"),
  connor_tie: p("领带", "正装领口装饰", "深色织物", "固定在衬衫领口。"),
  connor_pants: p("长裤", "下身正装", "深色织物", "与外套同色系的西裤。"),
  connor_lining: p("内衬", "外套内侧层", "光滑衬布", "风衣翻开后能看到的内层。"),
  connor_belt: p("腰带", "束住裤腰", "皮革 / 合成革", "腰间的皮带与扣具。"),
  connor_shoes: p("皮鞋", "行走与站立", "皮革鞋面 + 橡胶底", "正装皮鞋。"),
  connor_cuff: p("袖口", "衬衫或外套袖口", "织物包边", "手腕附近的窄边。"),
  connor_button: p("衣扣", "扣住外套或衬衫", "树脂 / 金属扣", "服装上的小扣件。"),
  connor_mouth: p("口腔", "说话与表情", "仿生黏膜", "面部内侧的口部网格。"),
  connor_brows: p("眉毛", "表情细节", "仿生毛发", "眼上方的眉形。"),
  connor_hair: p("头发", "头部外观", "仿生发丝", "康纳的深色短发。"),
  connor_head: p("头部", "仿生面部与颅骨", "仿生皮肤 + 内部骨架", "RK900 的脸与头颅。"),
  connor_eyes: p("眼睛", "光学传感器 / 视觉", "合成虹膜 + 透镜", "能看也能被鉴定的仿生眼。"),
  connor_lashes: p("睫毛", "眼周细节", "细纤维", "上下眼睑的睫毛。"),
  connor_led: p("太阳穴指示灯", "显示仿生人状态", "LED + 透明罩", "RK900 右侧太阳穴的光环。"),

  north_hair: p("头发", "头部外观", "仿生发丝", "诺斯的短发。"),
  north_body: p("躯体皮肤", "肢体与躯干外层", "仿生皮肤", "上衣没有覆盖到的皮肤层。"),
  north_eyes: p("眼睛", "光学传感器 / 视觉", "合成虹膜 + 透镜", "诺斯的仿生眼。"),
  north_hands: p("双手", "抓握与接触", "仿生皮肤 + 肌腱", "赤裸的手部网格。"),
  north_head: p("头部", "仿生面部与颅骨", "仿生皮肤 + 内部骨架", "诺斯的脸与头颅。"),
  north_shoes: p("鞋子", "行走与站立", "织物 / 橡胶底", "脚上的鞋子。"),
  north_teeth: p("牙齿", "口部结构", "仿生珐琅质", "张开嘴时可见。"),
  north_top: p("上衣", "上身服装", "深色织物", "诺斯常穿的短袖外套。"),
  north_lashes: p("睫毛", "眼周细节", "细纤维", "上下眼睑的睫毛。"),
};

export const HUMAN_ALIASES: [RegExp, string][] = [
  [/mat_11-mouth/i, "connor_mouth"],
  [/mat_12-eyebrows/i, "connor_brows"],
  [/mat_13-hair/i, "connor_hair"],
  [/mat_4-head_d/i, "connor_head"],
  [/mat_2-eye_d/i, "connor_eyes"],
  [/mat_14-lashes/i, "connor_lashes"],
  [/mat_7-led/i, "connor_led"],
  [/^Connor\.001\b/i, "connor_shirt"],
  [/^Connor\.004\b/i, "connor_button"],
  [/^Connor\.005\b/i, "connor_tie"],
  [/^Connor\.006\b/i, "connor_jacket"],
  [/^Connor\.007\b/i, "connor_pants"],
  [/^Connor\.008\b/i, "connor_belt"],
  [/^Connor\.009\b/i, "connor_shoes"],
  [/^Connor\.010\b/i, "connor_lining"],
  [/^Connor\.011\b/i, "connor_cuff"],
  [/Modelpart1_hair/i, "north_hair"],
  [/Modelpart1_body/i, "north_body"],
  [/Modelpart1_eyes/i, "north_eyes"],
  [/Modelpart1_hands/i, "north_hands"],
  [/Modelpart1_head/i, "north_head"],
  [/Modelpart1_shoes/i, "north_shoes"],
  [/Modelpart1_teeth/i, "north_teeth"],
  [/Modelpart1_top/i, "north_top"],
  [/Modelpart1_elashes/i, "north_lashes"],
];
