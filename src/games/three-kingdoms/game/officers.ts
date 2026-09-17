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
