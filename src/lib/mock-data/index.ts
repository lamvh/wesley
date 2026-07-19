// Typed mock-data layer. Screens read domain facts through these accessors;
// swapping to a real DB later touches only this directory.
export { getResidents, getResidentBySlug } from "./residents";
export { getRooms, getRoomByNum, getRoomKpis, getRoomWings } from "./rooms";
export { getShifts, getRosterCoverage, getLeaveRequests } from "./staff-shifts";
export { getIncidents, getComplianceKpis } from "./incidents";
export { getMeals, getDiets } from "./meals";
export { getActivityWeek, getBirthdays } from "./activities";
export { getFamilyFeed, getVisits, getMessages } from "./family";
export { getDashboard } from "./dashboard";
// Marketing site copy now lives in the Website CMS (lib/data/site-content.ts +
// site-content-defaults.ts). Only the job roles remain static here.
export { getJobRoles } from "./marketing-content";
export { photoSrc } from "./photos";
export { getUsers, getModules, getDefaultPermissions, countGranted, ROLE_KEYS } from "./users";
export {
  getMealReportResidents,
  getDefaultMealLog,
  summariseMealLog,
  MEAL_SLOTS,
} from "./meal-report";
export { getBuildings, getBuildingById, occupancyPct } from "./buildings";
export { getProviders, getProductCatalog } from "./stock-catalog";
export {
  getRosterDays,
  rosterWeekTitle,
  weekStartOf,
  toISODate,
  parseISODate,
  shiftWeek,
  dailyTotals,
  totalShifts,
} from "./roster-schedule";
