export type DepartmentUnit = {
  school: "國立臺北大學";
  college: string;
  name: string;
  unitType: "學系" | "研究所" | "學位學程" | "進修學系" | "產業碩士專班";
  levels: Array<"bachelor" | "master">;
  aliases: string[];
};

// v0.1 清洗版：目前只支援國立臺北大學。
// 來源基準為國立臺北大學課程查詢系統「學院／系所」選單，排除學院標題、輔系、中心、博士班、在職專班與非主修單位。
// `college` 只供系統推導使用，不顯示在前台，也不作為使用者輸入欄位。
export const departmentCatalog: DepartmentUnit[] = [
  { school: "國立臺北大學", college: "法律學院", name: "法律學系法學組", unitType: "學系", levels: ["bachelor"], aliases: ["法律", "法律系", "法學組"] },
  { school: "國立臺北大學", college: "法律學院", name: "法律學系司法組", unitType: "學系", levels: ["bachelor"], aliases: ["法律", "法律系", "司法組"] },
  { school: "國立臺北大學", college: "法律學院", name: "法律學系財經法組", unitType: "學系", levels: ["bachelor"], aliases: ["法律", "法律系", "財經法"] },
  { school: "國立臺北大學", college: "法律學院", name: "(進修)法律學系", unitType: "進修學系", levels: ["bachelor"], aliases: ["進修法律", "法律系"] },
  { school: "國立臺北大學", college: "法律學院", name: "法律學系碩士班一般生組", unitType: "研究所", levels: ["master"], aliases: ["法律碩", "法律研究所", "一般生組"] },
  { school: "國立臺北大學", college: "法律學院", name: "法律學系碩士班法律專業組", unitType: "研究所", levels: ["master"], aliases: ["法律碩", "法律研究所", "法律專業組"] },

  { school: "國立臺北大學", college: "商學院", name: "企業管理學系", unitType: "學系", levels: ["bachelor"], aliases: ["企管", "企管系", "企業管理"] },
  { school: "國立臺北大學", college: "商學院", name: "金融與合作經營學系", unitType: "學系", levels: ["bachelor"], aliases: ["金融", "金融系", "金合", "財金"] },
  { school: "國立臺北大學", college: "商學院", name: "會計學系", unitType: "學系", levels: ["bachelor"], aliases: ["會計", "會計系"] },
  { school: "國立臺北大學", college: "商學院", name: "統計學系", unitType: "學系", levels: ["bachelor"], aliases: ["統計", "統計系"] },
  { school: "國立臺北大學", college: "商學院", name: "休閒運動管理學系", unitType: "學系", levels: ["bachelor"], aliases: ["休運", "休閒運動管理"] },
  { school: "國立臺北大學", college: "商學院", name: "(進修)企業管理學系", unitType: "進修學系", levels: ["bachelor"], aliases: ["進修企管", "企管"] },
  { school: "國立臺北大學", college: "商學院", name: "(進修)金融與合作經營學系", unitType: "進修學系", levels: ["bachelor"], aliases: ["進修金融", "金融", "金合"] },
  { school: "國立臺北大學", college: "商學院", name: "(進修)數位行銷進修學士學位學程", unitType: "學位學程", levels: ["bachelor"], aliases: ["數位行銷", "行銷"] },
  { school: "國立臺北大學", college: "商學院", name: "企業管理學系碩士班", unitType: "研究所", levels: ["master"], aliases: ["企管碩", "企業管理碩士班"] },
  { school: "國立臺北大學", college: "商學院", name: "金融與合作經營學系碩士班", unitType: "研究所", levels: ["master"], aliases: ["金融碩", "金合碩"] },
  { school: "國立臺北大學", college: "商學院", name: "會計學系碩士班", unitType: "研究所", levels: ["master"], aliases: ["會計碩"] },
  { school: "國立臺北大學", college: "商學院", name: "統計學系碩士班", unitType: "研究所", levels: ["master"], aliases: ["統計碩"] },
  { school: "國立臺北大學", college: "商學院", name: "國際企業研究所碩士班", unitType: "研究所", levels: ["master"], aliases: ["國企所", "國際企業"] },
  { school: "國立臺北大學", college: "商學院", name: "資訊管理研究所", unitType: "研究所", levels: ["master"], aliases: ["資管所", "資訊管理"] },

  { school: "國立臺北大學", college: "社會科學學院", name: "經濟學系", unitType: "學系", levels: ["bachelor"], aliases: ["經濟", "經濟系"] },
  { school: "國立臺北大學", college: "社會科學學院", name: "社會學系", unitType: "學系", levels: ["bachelor"], aliases: ["社會", "社會系"] },
  { school: "國立臺北大學", college: "社會科學學院", name: "社會工作學系", unitType: "學系", levels: ["bachelor"], aliases: ["社工", "社工系", "社會工作"] },
  { school: "國立臺北大學", college: "社會科學學院", name: "(進修)經濟學系", unitType: "進修學系", levels: ["bachelor"], aliases: ["進修經濟", "經濟"] },
  { school: "國立臺北大學", college: "社會科學學院", name: "(進修)社會工作學系", unitType: "進修學系", levels: ["bachelor"], aliases: ["進修社工", "社會工作"] },
  { school: "國立臺北大學", college: "社會科學學院", name: "經濟學系碩士班", unitType: "研究所", levels: ["master"], aliases: ["經濟碩"] },
  { school: "國立臺北大學", college: "社會科學學院", name: "社會工作學系碩士班", unitType: "研究所", levels: ["master"], aliases: ["社工碩"] },
  { school: "國立臺北大學", college: "社會科學學院", name: "社會學系碩士班", unitType: "研究所", levels: ["master"], aliases: ["社會碩"] },
  { school: "國立臺北大學", college: "社會科學學院", name: "犯罪學研究所", unitType: "研究所", levels: ["master"], aliases: ["犯研所", "犯罪學"] },

  { school: "國立臺北大學", college: "公共事務學院", name: "公共行政暨政策學系", unitType: "學系", levels: ["bachelor"], aliases: ["公行", "公行系", "公共行政"] },
  { school: "國立臺北大學", college: "公共事務學院", name: "財政學系", unitType: "學系", levels: ["bachelor"], aliases: ["財政", "財政系"] },
  { school: "國立臺北大學", college: "公共事務學院", name: "不動產與城鄉環境學系", unitType: "學系", levels: ["bachelor"], aliases: ["不動產", "城鄉", "不動產系"] },
  { school: "國立臺北大學", college: "公共事務學院", name: "(進修)公共行政暨政策學系", unitType: "進修學系", levels: ["bachelor"], aliases: ["進修公行", "公共行政"] },
  { school: "國立臺北大學", college: "公共事務學院", name: "(進修)財政學系", unitType: "進修學系", levels: ["bachelor"], aliases: ["進修財政", "財政"] },
  { school: "國立臺北大學", college: "公共事務學院", name: "(進修)不動產與城鄉環境學系", unitType: "進修學系", levels: ["bachelor"], aliases: ["進修不動產", "城鄉"] },
  { school: "國立臺北大學", college: "公共事務學院", name: "公共事務學院碩士班", unitType: "研究所", levels: ["master"], aliases: ["公共事務碩"] },
  { school: "國立臺北大學", college: "公共事務學院", name: "公共行政暨政策學系碩士班", unitType: "研究所", levels: ["master"], aliases: ["公行碩", "公共行政碩士班"] },
  { school: "國立臺北大學", college: "公共事務學院", name: "財政學系碩士班", unitType: "研究所", levels: ["master"], aliases: ["財政碩"] },
  { school: "國立臺北大學", college: "公共事務學院", name: "不動產與城鄉環境學系碩士班", unitType: "研究所", levels: ["master"], aliases: ["不動產碩", "城鄉碩"] },
  { school: "國立臺北大學", college: "公共事務學院", name: "都市計劃研究所碩士班", unitType: "研究所", levels: ["master"], aliases: ["都計", "都市計劃"] },
  { school: "國立臺北大學", college: "公共事務學院", name: "自然資源與環境管理研究所碩士班", unitType: "研究所", levels: ["master"], aliases: ["自然資源", "環境管理", "自資所"] },

  { school: "國立臺北大學", college: "人文學院", name: "中國文學系", unitType: "學系", levels: ["bachelor"], aliases: ["中文", "中文系", "中國文學"] },
  { school: "國立臺北大學", college: "人文學院", name: "應用外語學系", unitType: "學系", levels: ["bachelor"], aliases: ["應外", "應外系", "應用外語"] },
  { school: "國立臺北大學", college: "人文學院", name: "歷史學系", unitType: "學系", levels: ["bachelor"], aliases: ["歷史", "歷史系"] },
  { school: "國立臺北大學", college: "人文學院", name: "民俗藝術與文化資產研究所", unitType: "研究所", levels: ["master"], aliases: ["民俗藝術", "文化資產", "民藝所"] },
  { school: "國立臺北大學", college: "人文學院", name: "中國文學系碩士班", unitType: "研究所", levels: ["master"], aliases: ["中文碩"] },
  { school: "國立臺北大學", college: "人文學院", name: "歷史學系碩士班", unitType: "研究所", levels: ["master"], aliases: ["歷史碩"] },

  { school: "國立臺北大學", college: "電機資訊學院", name: "資訊工程學系", unitType: "學系", levels: ["bachelor"], aliases: ["資工", "資工系", "資訊工程"] },
  { school: "國立臺北大學", college: "電機資訊學院", name: "電機工程學系", unitType: "學系", levels: ["bachelor"], aliases: ["電機", "電機系", "電機工程"] },
  { school: "國立臺北大學", college: "電機資訊學院", name: "通訊工程學系", unitType: "學系", levels: ["bachelor"], aliases: ["通訊", "通訊系", "通訊工程"] },
  { school: "國立臺北大學", college: "電機資訊學院", name: "通訊工程學系碩士班", unitType: "研究所", levels: ["master"], aliases: ["通訊碩"] },
  { school: "國立臺北大學", college: "電機資訊學院", name: "電機工程學系碩士班", unitType: "研究所", levels: ["master"], aliases: ["電機碩"] },
  { school: "國立臺北大學", college: "電機資訊學院", name: "資訊工程學系碩士班", unitType: "研究所", levels: ["master"], aliases: ["資工碩"] },
  { school: "國立臺北大學", college: "電機資訊學院", name: "資通科技產業碩士專班", unitType: "產業碩士專班", levels: ["master"], aliases: ["資通科技", "產業碩士"] },
  { school: "國立臺北大學", college: "電機資訊學院", name: "多媒體與網路科技產業碩士專班", unitType: "產業碩士專班", levels: ["master"], aliases: ["多媒體", "網路科技", "產業碩士"] },
  { school: "國立臺北大學", college: "電機資訊學院", name: "智慧製造與系統應用產業碩士專班", unitType: "產業碩士專班", levels: ["master"], aliases: ["智慧製造", "系統應用", "產業碩士"] },

  { school: "國立臺北大學", college: "永續創新國際學院", name: "創新華語文教學學士學位學程", unitType: "學位學程", levels: ["bachelor"], aliases: ["華語文教學", "華語"] },
  { school: "國立臺北大學", college: "永續創新國際學院", name: "智慧永續發展與管理英語學士學位學程", unitType: "學位學程", levels: ["bachelor"], aliases: ["智慧永續", "永續管理"] },
  { school: "國立臺北大學", college: "永續創新國際學院", name: "永續創新國際學院碩士班", unitType: "研究所", levels: ["master"], aliases: ["永續創新碩"] },
  { school: "國立臺北大學", college: "永續創新國際學院", name: "財務金融英語碩士學位學程", unitType: "學位學程", levels: ["master"], aliases: ["財務金融英語", "財金英語"] },
  { school: "國立臺北大學", college: "永續創新國際學院", name: "城市治理英語碩士學位學程", unitType: "學位學程", levels: ["master"], aliases: ["城市治理英語", "城市治理"] },
  { school: "國立臺北大學", college: "永續創新國際學院", name: "智慧醫療管理英語碩士學位學程", unitType: "學位學程", levels: ["master"], aliases: ["智慧醫療", "醫療管理英語"] },
];

export function getDepartmentUnitsForSchool(school: string): DepartmentUnit[] {
  if (school !== "國立臺北大學") {
    return [];
  }

  return departmentCatalog;
}

export function getDepartmentsForSchool(school: string): string[] {
  return getDepartmentUnitsForSchool(school).map((department) => department.name);
}

export function getDefaultDepartmentForSchool(school: string) {
  return getDepartmentsForSchool(school)[0] ?? "";
}

export function inferCollege(school: string, departmentName: string) {
  return getDepartmentUnitsForSchool(school).find((department) => department.name === departmentName)?.college ?? "";
}

export function findDepartmentUnit(school: string, departmentName: string) {
  return getDepartmentUnitsForSchool(school).find((department) => department.name === departmentName);
}

export function isDepartmentSearchMatch(department: DepartmentUnit, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [department.name, department.college, department.unitType, ...department.aliases]
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}
