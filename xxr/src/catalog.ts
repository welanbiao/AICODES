export type PartInfo = {
  name: string;
  role: string;
  material: string;
  note: string;
};

const SCREW: PartInfo = {
  name: "螺丝",
  role: "把中框、屏蔽罩和各模块锁在一起",
  material: "不锈钢 / 镀层钢",
  note: "iPhone 12 内部大量使用十字与特殊头螺丝，拆机时需对口批头。",
};

export const CATALOG: Record<string, PartInfo> = {
  iphone12_teardown: {
    name: "iPhone 12 整机",
    role: "第一关场景：把人缩进手机内部",
    material: "铝合金中框 + 玻璃盖板",
    note: "2020 年 A14 机型，支持 5G 与 MagSafe。",
  },
  body: {
    name: "中框 / 机身结构",
    role: "承力与天线窗口的主结构",
    material: "铝合金",
    note: "侧边集成音量、电源键轨道。",
  },
  battery: {
    name: "锂离子电池",
    role: "为整机供电",
    material: "锂聚合物电芯 + 铝塑膜",
    note: "约占机身内部最大面积，禁止穿刺与短路。",
  },
  backplate: {
    name: "背板加强件",
    role: "支撑无线充电线圈与后盖",
    material: "复合材料 / 金属片",
    note: "爆炸图中会明显离开电池平面。",
  },
  back_cam_cover: {
    name: "后摄模组盖",
    role: "保护双摄模组",
    material: "金属屏蔽罩",
    note: "盖住广角与超广角摄像头。",
  },
  back_cam: {
    name: "后置双摄模组",
    role: "广角 + 超广角成像",
    material: "镜片组 + CMOS + 音圈马达",
    note: "iPhone 12 为 1200 万像素双摄。",
  },
  antenn: {
    name: "蜂窝天线条",
    role: "收发 4G/5G 射频",
    material: "天线柔性电路 / 金属辐射体",
    note: "中框断开处即天线窗口。",
  },
  wifi_antenn: {
    name: "Wi-Fi / 蓝牙天线",
    role: "2.4/5GHz 无线与蓝牙",
    material: "FPC 天线",
    note: "通常靠近顶部或侧边。",
  },
  btn_off: {
    name: "电源 / 侧键",
    role: "开关机、Apple Pay、截屏",
    material: "不锈钢键帽",
    note: "右侧键，内部有齿轮与弹片。",
  },
  btn_off_gears: {
    name: "侧键传动件",
    role: "把按压传到开关",
    material: "工程塑料 + 金属弹片",
    note: "小零件，易在拆机时丢失。",
  },
  btn_volume_up: {
    name: "音量 + 键",
    role: "提高铃声音量 / 快门",
    material: "不锈钢键帽",
    note: "左侧上方按键。",
  },
  btn_volume_down: {
    name: "音量 − 键",
    role: "降低音量",
    material: "不锈钢键帽",
    note: "左侧下方按键。",
  },
  btn_volume_off: {
    name: "响铃 / 静音拨杆",
    role: "切换响铃与静音",
    material: "金属拨杆",
    note: "iPhone 经典物理静音键。",
  },
  btn_volume_up_gears: {
    name: "音量 + 传动件",
    role: "按键行程传递",
    material: "塑料齿轮 / 支架",
    note: "与音量键配套。",
  },
  btn_volume_down_gears: {
    name: "音量 − 传动件",
    role: "按键行程传递",
    material: "塑料齿轮 / 支架",
    note: "与音量键配套。",
  },
  charging_cable: {
    name: "充电排线",
    role: "Lightning 口到主板的信号与供电",
    material: "柔性电路板",
    note: "常与麦克风、充电口做成一条组件。",
  },
  charging_port: {
    name: "Lightning 充电口",
    role: "有线充电与数据",
    material: "不锈钢壳体 + 触点",
    note: "iPhone 12 仍为 Lightning。",
  },
  cover: {
    name: "屏蔽盖",
    role: "电磁屏蔽与保护",
    material: "镀镍钢罩",
    note: "压在主板或排线上方。",
  },
  cover_flex_cables: {
    name: "排线压盖",
    role: "固定显示与摄像头排线",
    material: "金属压片",
    note: "拆屏时需先松开。",
  },
  flashlight: {
    name: "闪光灯",
    role: "拍照补光 / 手电筒",
    material: "LED + 透镜",
    note: "后摄模组旁的方形灯。",
  },
  flashlight_dummy: {
    name: "闪光灯装饰 / 导光",
    role: "外观与光束整形",
    material: "透明塑料",
    note: "与后盖开孔对齐。",
  },
  front_cam: {
    name: "前置摄像头",
    role: "自拍与 Face ID 相关成像",
    material: "微型镜头模组",
    note: "位于刘海区域。",
  },
  front_cam_bracket: {
    name: "前摄支架",
    role: "固定前摄位置",
    material: "金属支架",
    note: "保证对焦距离。",
  },
  front_sensor: {
    name: "前部传感器组",
    role: "环境光、距离、红外点阵相关",
    material: "传感器芯片 + 透镜",
    note: "Face ID 系统的一部分。",
  },
  glue_sticker: {
    name: "电池胶贴",
    role: "固定电池，可拉胶拆卸",
    material: "拉伸离型胶带",
    note: "官方拆机靠拉胶而不是撬电芯。",
  },
  grid_wires: {
    name: "天线 / 接地网格",
    role: "射频接地与走线",
    material: "铜箔 / 导电布",
    note: "贴在中框或后盖内侧。",
  },
  inside_body: {
    name: "内部中框结构",
    role: "零件定位基准",
    material: "铝合金铣削件",
    note: "螺丝柱与卡位都在这里。",
  },
  inside_cam_holder: {
    name: "后摄内支架",
    role: "把摄像头模组定位在中框",
    material: "金属支架",
    note: "决定后摄凸起高度。",
  },
  inside_power_port: {
    name: "充电口内支架",
    role: "把 Lightning 口锁在中框底部",
    material: "金属支架",
    note: "承受插拔力。",
  },
  magnets: {
    name: "MagSafe 磁环",
    role: "吸附充电器与配件对位",
    material: "钕铁硼磁铁阵列",
    note: "iPhone 12 首次加入 MagSafe。",
  },
  mic: {
    name: "麦克风",
    role: "通话、视频、降噪拾音",
    material: "MEMS 麦克风",
    note: "底部与顶部通常各有一只。",
  },
  motherboard: {
    name: "逻辑主板",
    role: "A14、基带、存储与电源管理",
    material: "多层 PCB + 屏蔽罩",
    note: "iPhone 12 主板为叠层设计，体积很小。",
  },
  motherboard_cables_cover: {
    name: "主板排线盖",
    role: "压住连接器",
    material: "金属盖板",
    note: "拆主板前需卸下。",
  },
  motherboard_cover: {
    name: "主板屏蔽罩",
    role: "EMI 屏蔽与散热",
    material: "镀镍钢",
    note: "覆盖 A14 与射频区。",
  },
  profile_housing_bottom: {
    name: "底部中框",
    role: "扬声器、充电口、麦克风开孔",
    material: "铝合金",
    note: "爆炸图中向下分离。",
  },
  profile_housing_top: {
    name: "顶部中框",
    role: "听筒、天线窗口",
    material: "铝合金",
    note: "爆炸图中向上分离。",
  },
  profile_housing_left: {
    name: "左侧中框",
    role: "音量键与静音键侧墙",
    material: "铝合金",
    note: "带按键孔。",
  },
  profile_housing_right: {
    name: "右侧中框",
    role: "电源键侧墙",
    material: "铝合金",
    note: "带侧键孔。",
  },
  profile_housing_dummies: {
    name: "中框填充件",
    role: "结构补强与天线隔离",
    material: "塑料嵌件",
    note: "与金属中框注塑结合。",
  },
  screw_pentalobe: {
    name: "五角梅花螺丝",
    role: "锁底部显示屏与中框",
    material: "钢材，五角梅花槽",
    note: "机身外部两颗，需 P2 批头。",
  },
  simholder: {
    name: "SIM 卡托组件",
    role: "承载 nano-SIM",
    material: "不锈钢卡托",
    note: "侧边插槽，单卡或单卡+eSIM。",
  },
  simholder_box: {
    name: "SIM 卡座",
    role: "读卡接触簧片",
    material: "连接器 + 塑料座",
    note: "焊在或连接到主板上。",
  },
  simholder_cable_cover: {
    name: "卡座排线盖",
    role: "固定 SIM 相关排线",
    material: "金属压盖",
    note: "小盖板。",
  },
  speaker: {
    name: "底部扬声器",
    role: "外放与立体声下扬声器",
    material: "磁路 + 振膜",
    note: "与听筒组成立体声。",
  },
  speaker_cover: {
    name: "扬声器网罩 / 支架",
    role: "防尘与定位",
    material: "金属网 + 支架",
    note: "对准底部开孔。",
  },
  taptick: {
    name: "Taptic Engine",
    role: "线性马达，提供震动反馈",
    material: "铜线圈 + 磁铁质量块",
    note: "3D Touch 取消后仍用它做敲击感。",
  },
  wireless_charge: {
    name: "无线充电线圈",
    role: "Qi / MagSafe 感应充电",
    material: "铜线圈 + 铁氧体",
    note: "贴在后盖内侧，中央有磁环。",
  },
  front_panel: {
    name: "显示总成（屏幕）",
    role: "Super Retina XDR OLED 触控显示",
    material: "OLED + 玻璃盖板",
    note: "6.1 英寸，与金属中框用胶密封。",
  },
  front_panel_screw01: SCREW,
  front_panel_screw02: SCREW,
  front_panel_screw03: SCREW,
  front_panel_screw04: SCREW,
  earspeaker: {
    name: "听筒扬声器",
    role: "通话听筒 + 立体声上扬声器",
    material: "微型扬声器",
    note: "刘海顶部。",
  },
  back_cover: {
    name: "玻璃后盖",
    role: "外观、无线充电窗口",
    material: "玻璃 + 油墨",
    note: "与铝合金中框胶接。",
  },
  back_cam_glass: {
    name: "后摄镜片玻璃",
    role: "保护摄像头镜片",
    material: "蓝宝石玻璃",
    note: "凸起正方形模组上的镜片。",
  },
  back_cam_hole1: {
    name: "后摄开孔 A",
    role: "广角镜头窗口",
    material: "后盖开孔 + 密封圈",
    note: "与镜头对齐。",
  },
  back_cam_hole2: {
    name: "后摄开孔 B",
    role: "超广角镜头窗口",
    material: "后盖开孔 + 密封圈",
    note: "与镜头对齐。",
  },
  back_cam_flashlight_hole: {
    name: "闪光灯开孔",
    role: "LED 出光窗口",
    material: "后盖开孔",
    note: "与闪光灯透镜对齐。",
  },
};

export function partKeyFromName(name: string): string {
  const base = name.split("_$Assimp")[0].replace(/_node$/i, "").trim();
  if (CATALOG[base]) return base;
  if (/^Screw/i.test(base) || /^screw/i.test(base)) return "__screw__";
  return base;
}

export function infoFor(name: string): PartInfo {
  const key = partKeyFromName(name);
  if (CATALOG[key]) return CATALOG[key];
  if (key === "__screw__") {
    return {
      name: `螺丝（${name.split("_$Assimp")[0]}）`,
      role: SCREW.role,
      material: SCREW.material,
      note: SCREW.note,
    };
  }
  return {
    name: name.split("_$Assimp")[0],
    role: "机内部件",
    material: "待鉴定",
    note: "该网格未写入图鉴，显示原始名称。",
  };
}
