export const mockPayrollData = [
  {
    id: 1,
    key: 1,
    stt: 1,
    documentNumber: "PL-001",
    documentDate: "2025-01-05",
    productName: "BP 18-98-01",
    nationalDefense: 25000000,
    economy: "",
    nationalDefenseEconomy: "",
    manager: "Nguyễn Văn A, Trần Văn B",
    note: "Hoàn thành đúng tiến độ",
    progress: 85,
    remainingBudget: 12000000,
    approvalStatus: "approved",
    assessment: {
      quality: 4,
      comment: "Chất lượng tốt, đúng yêu cầu",
      assessor: "Trưởng phòng KH-KD",
      assessmentDate: "2025-01-20"
    }
  },
  {
    id: 2,
    key: 2,
    stt: 2,
    documentNumber: "PL-002",
    documentDate: "2025-01-10",
    productName: "Cái mép 19",
    nationalDefense: "",
    economy: 20000000,
    nationalDefenseEconomy: "",
    manager: "Trần Văn B",
    note: "Đang chờ nghiệm thu",
    progress: 60,
    remainingBudget: 8000000,
    approvalStatus: "pending",
    assessment: {
      quality: 3,
      comment: "Chất lượng tốt, đúng yêu cầu",
      assessor: "Trưởng phòng KH-KD",
      assessmentDate: "2025-01-20"
    }
  },
  {
    id: 3,
    key: 3,
    stt: 3,
    documentNumber: "PL-003",
    documentDate: "2025-01-15",
    productName: "HQ 98",
    nationalDefense: "",
    economy: "",
    nationalDefenseEconomy: 4000000,
    manager: "Lê Văn C",
    note: "Có phát sinh vật tư",
    progress: 40,
    remainingBudget: 3000000,
    approvalStatus: "rejected",
    assessment: {
      quality: 2,
      comment: "Chậm tiến độ, cần cải thiện",
      assessor: "Ban kiểm soát",
      assessmentDate: "2025-01-25"
    }
  },
];
