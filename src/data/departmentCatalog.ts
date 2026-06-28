// TODO: 暫用正式名稱 mock data；後續需整理北聯大各校正式系所架構後替換。
// `college` 只供系統推導使用，不顯示在前台，也不作為使用者輸入欄位。
const departmentCatalog = {
  國立臺北大學: [
    { name: "金融與合作經營學系", college: "商學院" },
    { name: "法律學系", college: "法律學院" },
    { name: "企業管理學系", college: "商學院" },
    { name: "資訊工程學系", college: "電機資訊學院" },
    { name: "公共行政暨政策學系", college: "公共事務學院" },
  ],
  國立臺北科技大學: [
    { name: "資訊工程系", college: "電資學院" },
    { name: "互動設計系", college: "設計學院" },
    { name: "經營管理系", college: "管理學院" },
  ],
  臺北醫學大學: [
    { name: "醫務管理學系", college: "管理學院" },
    { name: "保健營養學系", college: "營養學院" },
    { name: "公共衛生學系", college: "公共衛生學院" },
  ],
  國立臺灣海洋大學: [
    { name: "資訊工程學系", college: "電機資訊學院" },
    { name: "航運管理學系", college: "海運暨管理學院" },
    { name: "海洋法政學士學位學程", college: "海洋法律與政策學院" },
  ],
} as const;

export function getDepartmentsForSchool(school: string): string[] {
  return [...(departmentCatalog[school as keyof typeof departmentCatalog] ?? []).map((department) => department.name)];
}

export function inferCollege(school: string, departmentName: string) {
  return (
    departmentCatalog[school as keyof typeof departmentCatalog]?.find((department) => department.name === departmentName)?.college ??
    ""
  );
}
