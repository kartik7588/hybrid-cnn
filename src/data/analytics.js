export const weeklyScans = [
  { day: "Mon", scans: 42, detected: 9 },
  { day: "Tue", scans: 55, detected: 12 },
  { day: "Wed", scans: 49, detected: 11 },
  { day: "Thu", scans: 63, detected: 16 },
  { day: "Fri", scans: 58, detected: 14 },
  { day: "Sat", scans: 34, detected: 6 },
  { day: "Sun", scans: 27, detected: 4 },
];

export const detectionDistribution = [
  { name: "Normal", value: 48, color: "#0f766e" },
  { name: "Benign", value: 32, color: "#94a3a0" },
  { name: "Malignant", value: 20, color: "#f43f5e" },
];

export const monthlyDiagnoses = [
  { month: "Jan", normal: 118, benign: 62, malignant: 24 },
  { month: "Feb", normal: 126, benign: 58, malignant: 31 },
  { month: "Mar", normal: 134, benign: 71, malignant: 29 },
  { month: "Apr", normal: 129, benign: 68, malignant: 35 },
  { month: "May", normal: 146, benign: 76, malignant: 38 },
  { month: "Jun", normal: 152, benign: 80, malignant: 42 },
  { month: "Jul", normal: 139, benign: 74, malignant: 37 },
];

export const modelMetrics = [
  { month: "Jan", latency: 216 },
  { month: "Feb", latency: 205 },
  { month: "Mar", latency: 198 },
  { month: "Apr", latency: 190 },
  { month: "May", latency: 184 },
  { month: "Jun", latency: 181 },
  { month: "Jul", latency: 180 },
];

export const usageByDepartment = [
  { name: "Radiology", usage: 46 },
  { name: "Oncology", usage: 28 },
  { name: "Screening", usage: 18 },
  { name: "Research", usage: 8 },
];
