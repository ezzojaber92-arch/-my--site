export type ProductionLinkFallback = {
  id: number;
  url: string;
  platform: string;
  linkedAt: string;
  title: string;
};

// روابط منشورة فعلياً في السجل المنقول، وتظهر إلى أن تتصل TiDB في Vercel.
export const productionLinksFallback: Record<string, ProductionLinkFallback[]> = {
  "Z-001": [
    {
      id: 30001,
      url: "https://x.com/ra3y_lam7a/status/1501585060511764485?s=46",
      platform: "إكس",
      linkedAt: "2026-08-26T06:22:13.000Z",
      title: "راهي محمد بن علي الجنيبي",
    },
    {
      id: 1,
      url: "https://youtu.be/fBU_5oOx6B8",
      platform: "يوتيوب",
      linkedAt: "2026-08-26T05:54:54.000Z",
      title: "ش 8 (السريع) لـ عمير الحزمي قناص العامري 5:51:7، مهرجان ولي عهد دبي 2026/1/17 حقايق المرموم",
    },
  ],
};
