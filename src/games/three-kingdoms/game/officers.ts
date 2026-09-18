/**
 * The 194 officer roster.
 *
 * Authored as a tuple table rather than object literals on purpose: 39 officers times
 * nine hand-typed columns will eventually drop a value, and a tuple makes that a `tsc`
 * error instead of an `undefined` stat that only shows up in combat three weeks later.
 */
import type { CityId, FactionId, Officer, OfficerId, TacticId } from "./types";

/** [id, 이름, 漢字, 통솔, 무력, 지력, 정치, 매력, 세력, 소속 도시] */
export type OfficerRow = readonly [
  OfficerId, string, string, number, number, number, number, number, FactionId | null, CityId,
];

const OFFICER_ROWS = [
  // PK heroes across eras, explicitly presented as an alternate-history roster.
  ['zhugeliang', '제갈량', '諸葛亮', 92, 38, 100, 95, 92, 'liubei', 'xiapi'],
  ['pangtong', '방통', '龐統', 78, 34, 98, 85, 69, 'liubei', 'xiapi'],
  ['simayi', '사마의', '司馬懿', 98, 63, 98, 94, 82, 'caocao', 'chenliu'],
  ['machao', '마초', '馬超', 91, 97, 44, 29, 82, 'lijue', 'changan'],
  ['mateng', '마등', '馬騰', 82, 82, 51, 54, 88, 'lijue', 'changan'],
  ['madai', '마대', '馬岱', 78, 85, 61, 47, 69, 'lijue', 'changan'],
  ['handang', '한당', '韓當', 78, 85, 52, 43, 64, 'yuanshu', 'shouchun'],
  ['huanggai', '황개', '黃蓋', 82, 84, 74, 58, 81, 'yuanshu', 'shouchun'],
  ['taishici', '태사자', '太史慈', 88, 95, 67, 58, 79, 'yuanshu', 'shouchun'],
  ['ganning', '감녕', '甘寧', 86, 94, 74, 18, 58, 'yuanshu', 'runan'],
  ['lvmeng', '여몽', '呂蒙', 91, 81, 89, 78, 80, 'yuanshu', 'runan'],
  ['lusu', '노숙', '魯肅', 78, 52, 94, 92, 89, 'yuanshu', 'shouchun'],
  ['luxun', '육손', '陸遜', 97, 69, 96, 91, 90, 'yuanshu', 'runan'],
  ['sunquan', '손권', '孫權', 76, 67, 80, 89, 95, 'yuanshu', 'shouchun'],
  ['zhoutai', '주태', '周泰', 79, 91, 47, 31, 61, 'yuanshu', 'runan'],
  ['jiangqin', '장흠', '蔣欽', 78, 83, 56, 42, 65, 'yuanshu', 'runan'],
  ['dingfeng', '정봉', '丁奉', 82, 86, 69, 51, 68, 'yuanshu', 'runan'],
  ['xusheng', '서성', '徐盛', 86, 81, 76, 64, 72, 'yuanshu', 'shouchun'],
  ['zhuran', '주연', '朱然', 84, 72, 75, 65, 70, 'yuanshu', 'runan'],
  ['zhugejin', '제갈근', '諸葛瑾', 69, 34, 81, 90, 89, 'yuanshu', 'shouchun'],
  ['buzhi', '보즐', '步騭', 58, 31, 81, 87, 76, 'yuanshu', 'runan'],
  ['zhangzhao', '장소', '張昭', 43, 22, 85, 97, 81, 'yuanshu', 'shouchun'],
  ['zhanghong', '장굉', '張紘', 40, 20, 86, 95, 81, 'yuanshu', 'shouchun'],
  ['guanping', '관평', '關平', 76, 83, 63, 49, 74, 'liubei', 'xiapi'],
  ['guanxing', '관흥', '關興', 77, 86, 66, 51, 73, 'liubei', 'xiapi'],
  ['zhangbao', '장포', '張苞', 76, 88, 52, 43, 63, 'liubei', 'xiaopei'],
  ['jiangwei', '강유', '姜維', 92, 89, 90, 67, 80, 'liubei', 'xiapi'],
  ['huangyueying', '황월영', '黃月英', 51, 31, 95, 88, 79, 'liubei', 'xiaopei'],
  ['wangyi', '왕이', '王異', 73, 62, 82, 69, 78, 'caocao', 'juancheng'],
  ['zhurong', '축융', '祝融', 73, 90, 38, 24, 68, 'liubiao', 'wan'],
  ['menghuo', '맹획', '孟獲', 78, 87, 42, 48, 85, 'liubiao', 'wan'],
  ['fazheng', '법정', '法正', 80, 47, 96, 83, 56, 'liubei', 'xiaopei'],
  ['mengda', '맹달', '孟達', 74, 73, 71, 61, 51, 'liubiao', 'wan'],
  ['liuyan', '유언', '劉焉', 52, 31, 77, 82, 86, 'liubiao', 'wan'],
  ['liuzhang', '유장', '劉璋', 34, 25, 43, 63, 78, 'liubiao', 'wan'],
  ['zhangren', '장임', '張任', 86, 85, 78, 55, 74, 'liubiao', 'wan'],
  ['yanyan', '엄안', '嚴顏', 79, 83, 64, 54, 82, 'liubiao', 'wan'],
  ['zhangsong', '장송', '張松', 32, 21, 89, 86, 32, 'liubiao', 'wan'],
  ['wangping', '왕평', '王平', 85, 79, 75, 52, 71, 'liubei', 'xiaopei'],
  ['liyan', '이엄', '李嚴', 83, 81, 74, 83, 49, 'liubei', 'xiapi'],
  ['zhangyi', '장의', '張翼', 76, 72, 67, 65, 69, 'liubei', 'xiaopei'],
  ['dongyun', '동윤', '董允', 41, 27, 78, 91, 82, 'liubei', 'xiapi'],
  ['feiyi', '비의', '費禕', 73, 29, 84, 94, 86, 'liubei', 'xiapi'],
  ['jiangwan', '장완', '蔣琬', 74, 34, 85, 95, 89, 'liubei', 'xiaopei'],
  ['dengai', '등애', '鄧艾', 94, 87, 89, 82, 68, 'caocao', 'juancheng'],
  ['zhonghui', '종회', '鍾會', 85, 56, 92, 82, 54, 'caocao', 'chenliu'],
  ['yanghu', '양호', '羊祜', 92, 65, 88, 87, 94, 'caocao', 'juancheng'],
  ['duyu', '두예', '杜預', 89, 32, 86, 91, 80, 'caocao', 'chenliu'],
  ['zhangchunhua', '장춘화', '張春華', 47, 44, 87, 76, 63, 'caocao', 'chenliu'],
  // PK expanded roster. Placements are a playable 194-inspired arrangement.
  ["guojia", "곽가", "郭嘉", 51, 15, 98, 84, 76, "caocao", "chenliu"],
  ["xunyou", "순유", "荀攸", 73, 26, 94, 89, 74, "caocao", "juancheng"],
  ["xuchu", "허저", "許褚", 65, 96, 32, 20, 58, "caocao", "chenliu"],
  ["xuhuang", "서황", "徐晃", 91, 90, 74, 54, 71, "caocao", "juancheng"],
  ["caohong", "조홍", "曹洪", 78, 81, 44, 35, 56, "caocao", "chenliu"],
  ["manchong", "만총", "滿寵", 84, 64, 82, 85, 70, "caocao", "juancheng"],
  ["liuye", "유엽", "劉曄", 52, 32, 92, 78, 68, "caocao", "chenliu"],
  ["maojie", "모개", "毛玠", 48, 30, 73, 86, 67, "caocao", "juancheng"],
  ["caochun", "조순", "曹純", 82, 77, 56, 44, 66, "caocao", "juancheng"],
  ["chenqun", "진군", "陳群", 32, 14, 84, 96, 76, "liubei", "xiapi"],
  ["mifang", "미방", "麋芳", 45, 58, 38, 44, 50, "liubei", "xiapi"],
  ["chentao", "진도", "陳到", 82, 79, 65, 51, 66, "liubei", "xiaopei"],
  ["chenlian", "성렴", "成廉", 66, 79, 30, 22, 36, "lubu", "puyang"],
  ["houcheng", "후성", "侯成", 62, 72, 42, 35, 48, "lubu", "puyang"],
  ["songxian", "송헌", "宋憲", 61, 71, 34, 29, 39, "lubu", "puyang"],
  ["weixu", "위속", "魏續", 59, 68, 40, 32, 44, "lubu", "puyang"],
  ["gaolan", "고람", "高覽", 81, 82, 57, 40, 62, "yuanshao", "ye"],
  ["xuyou", "허유", "許攸", 36, 22, 90, 61, 33, "yuanshao", "ye"],
  ["fengji", "봉기", "逢紀", 43, 24, 83, 71, 41, "yuanshao", "ye"],
  ["shenpei", "심배", "審配", 80, 58, 83, 76, 55, "yuanshao", "ye"],
  ["chunyuqiong", "순우경", "淳于瓊", 72, 75, 38, 34, 42, "yuanshao", "ye"],
  ["yuantan", "원담", "袁譚", 65, 68, 47, 52, 64, "yuanshao", "ye"],
  ["huangzhong", "황충", "黃忠", 88, 93, 60, 52, 74, "liubiao", "wan"],
  ["weiyan", "위연", "魏延", 85, 92, 64, 38, 47, "liubiao", "wan"],
  ["huangzu", "황조", "黃祖", 70, 65, 42, 38, 30, "liubiao", "wan"],
  ["caimao", "채모", "蔡瑁", 74, 62, 71, 77, 46, "liubiao", "wan"],
  ["kuaiyue", "괴월", "蒯越", 58, 33, 89, 86, 72, "liubiao", "wan"],
  ["sunce", "손책", "孫策", 93, 93, 69, 70, 92, "yuanshu", "shouchun"],
  ["zhouyu", "주유", "周瑜", 96, 71, 96, 86, 94, "yuanshu", "shouchun"],
  ["chengpu", "정보", "程普", 85, 79, 78, 74, 82, "yuanshu", "shouchun"],
  ["hansui", "한수", "韓遂", 81, 72, 82, 63, 72, "lijue", "changan"],
  ["zhangji", "장제", "張濟", 71, 73, 46, 39, 51, "lijue", "changan"],
  // --- 유비 (소패 / 하비) ---
  ["liubei", "유비", "劉備", 72, 73, 75, 80, 99, "liubei", "xiaopei"],
  ["zhangfei", "장비", "張飛", 92, 98, 30, 22, 44, "liubei", "xiaopei"],
  ["jianyong", "간옹", "簡雍", 40, 30, 72, 70, 80, "liubei", "xiaopei"],
  ["guanyu", "관우", "關羽", 95, 97, 75, 62, 93, "liubei", "xiapi"],
  ["zhaoyun", "조운", "趙雲", 91, 96, 76, 65, 81, "liubei", "xiapi"],
  ["chendeng", "진등", "陳登", 60, 40, 85, 80, 70, "liubei", "xiapi"],
  ["mizhu", "미축", "麋竺", 25, 16, 72, 82, 85, "liubei", "xiapi"],
  ["sunqian", "손건", "孫乾", 38, 30, 70, 72, 78, "liubei", "xiapi"],

  // --- 조조 (진류 / 견성) ---
  ["caocao", "조조", "曹操", 96, 72, 91, 94, 96, "caocao", "chenliu"],
  ["xunyu", "순욱", "荀彧", 60, 30, 96, 98, 88, "caocao", "chenliu"],
  ["xiahoudun", "하후돈", "夏侯惇", 89, 90, 60, 50, 76, "caocao", "chenliu"],
  ["yuejin", "악진", "樂進", 78, 85, 55, 40, 56, "caocao", "chenliu"],
  ["dianwei", "전위", "典韋", 60, 97, 25, 15, 50, "caocao", "chenliu"],
  ["xiahouyuan", "하후연", "夏侯淵", 91, 91, 65, 50, 68, "caocao", "juancheng"],
  ["caoren", "조인", "曹仁", 90, 88, 70, 72, 72, "caocao", "juancheng"],
  ["chengyu", "정욱", "程昱", 70, 40, 92, 86, 70, "caocao", "juancheng"],
  ["lidian", "이전", "李典", 76, 73, 78, 70, 65, "caocao", "juancheng"],
  ["yujin", "우금", "于禁", 88, 78, 64, 60, 58, "caocao", "juancheng"],

  // --- 여포 (복양) ---
  ["lubu", "여포", "呂布", 88, 100, 26, 13, 37, "lubu", "puyang"],
  ["zhangliao", "장료", "張遼", 93, 92, 78, 62, 78, "lubu", "puyang"],
  ["gaoshun", "고순", "高順", 85, 86, 60, 40, 45, "lubu", "puyang"],
  ["chengong", "진궁", "陳宮", 75, 40, 90, 80, 72, "lubu", "puyang"],
  ["zangba", "장패", "臧霸", 80, 82, 64, 56, 60, "lubu", "puyang"],

  // --- 원소 (업) ---
  ["yuanshao", "원소", "袁紹", 78, 64, 66, 74, 90, "yuanshao", "ye"],
  ["zhanghe", "장합", "張郃", 90, 89, 78, 65, 74, "yuanshao", "ye"],
  ["yanliang", "안량", "顏良", 79, 91, 32, 22, 50, "yuanshao", "ye"],
  ["wenchou", "문추", "文醜", 78, 90, 30, 20, 48, "yuanshao", "ye"],
  ["jushou", "저수", "沮授", 76, 40, 92, 84, 72, "yuanshao", "ye"],
  ["tianfeng", "전풍", "田豊", 65, 30, 94, 88, 60, "yuanshao", "ye"],

  // --- 원술 (수춘 / 여남) ---
  ["yuanshu", "원술", "袁術", 55, 62, 45, 40, 58, "yuanshu", "shouchun"],
  ["qiaorui", "교유", "橋蕤", 65, 70, 45, 45, 48, "yuanshu", "shouchun"],
  ["jiling", "기령", "紀靈", 74, 80, 50, 40, 50, "yuanshu", "runan"],
  ["yanghong", "양홍", "楊弘", 40, 25, 70, 66, 50, "yuanshu", "runan"],

  // --- 유표 (완) ---
  ["liubiao", "유표", "劉表", 60, 45, 72, 80, 85, "liubiao", "wan"],
  ["wenpin", "문빙", "文聘", 80, 78, 62, 58, 66, "liubiao", "wan"],
  ["kuailiang", "괴량", "蒯良", 50, 30, 88, 85, 70, "liubiao", "wan"],

  // --- 이각 (장안) ---
  ["lijue", "이각", "李傕", 72, 85, 50, 25, 20, "lijue", "changan"],
  ["guosi", "곽사", "郭汜", 70, 83, 45, 23, 18, "lijue", "changan"],
  ["jiaxu", "가후", "賈詡", 70, 40, 97, 85, 62, "lijue", "changan"],
] as const satisfies readonly OfficerRow[];

/**
 * Tactics are derived from stats rather than listed per officer. One rule table beats 39
 * hand-maintained arrays, and it keeps the roster honest: anybody with 여포's 무력 gets
 * 돌격, nobody gets 혼란 without the 지력 to pull it off.
 */
export function tacticsFor(lead: number, war: number, int: number, cha: number): TacticId[] {
  const out: TacticId[] = [];
  if (war >= 85) out.push("charge");
  if (lead >= 80) out.push("pike", "volley");
  if (int >= 70) out.push("fire");
  if (int >= 85) out.push("confuse");
  if (cha >= 80) out.push("rally");
  return out;
}

export function createOfficers(): Record<OfficerId, Officer> {
  const out: Record<OfficerId, Officer> = {};
  for (const [id, name, hanja, lead, war, int, pol, cha, faction, cityId] of OFFICER_ROWS) {
    out[id] = {
      id, name, hanja, lead, war, int, pol, cha,
      faction,
      cityId,
      duty: "idle",
      unitId: null,
      tactics: tacticsFor(lead, war, int, cha),
    };
  }
  return out;
}

export const OFFICER_COUNT = OFFICER_ROWS.length;
export const PK_ROSTER_VERSION = 2;
