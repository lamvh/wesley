// Typed mock-data layer. Screens read domain facts through these accessors;
// swapping to a real DB later touches only this directory.
export { getResidents, getResidentBySlug } from "./residents";
export { getRooms, getRoomByNum, getRoomKpis, getRoomWings } from "./rooms";
export { getShifts, getRosterCoverage, getLeaveRequests } from "./staff-shifts";
export { getStockGroups, getStockKpis } from "./stock";
export { getIncidents, getComplianceKpis } from "./incidents";
export { getMeals, getDiets } from "./meals";
export { getActivityWeek, getBirthdays } from "./activities";
export { getFamilyFeed, getVisits, getMessages } from "./family";
export { getDashboard } from "./dashboard";
export {
  getRoomStyles,
  getFeatures,
  getDayTimeline,
  getFacilities,
  getCareWings,
  getJobRoles,
  getBenefits,
  getTestimonial,
  getStats,
  getContactInfo,
} from "./marketing-content";
export { photoSrc } from "./photos";
export { getUsers, getModules, getDefaultPermissions, countGranted, ROLE_KEYS } from "./users";
export {
  getMealReportResidents,
  getDefaultMealLog,
  summariseMealLog,
  MEAL_SLOTS,
} from "./meal-report";
