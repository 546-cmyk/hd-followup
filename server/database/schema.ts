/* eslint-disable */
/** auto generated, do not edit */
import { sql } from 'drizzle-orm';
import { date, foreignKey, index, integer, jsonb, numeric, pgTable, text, uniqueIndex, uuid, varchar, customType } from "drizzle-orm/pg-core"

export const customTimestamptz = customType<{
  data: Date;
  driverData: string;
  config: { precision?: number };
}>({
  dataType(config) {
    const precision = typeof config?.precision !== 'undefined'
      ? ` (${config.precision})`
      : '';
    return `timestamptz${precision}`;
  },
  toDriver(value: Date | string | number) {
    if (value == null) return value as any;
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    throw new Error('Invalid timestamp value');
  },
  fromDriver(value: string | Date): Date {
    if (value instanceof Date) return value;
    return new Date(value);
  },
});

export const userProfile = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'user_profile';
  },
  toDriver(value: string) {
    return sql`ROW(${value})::user_profile`;
  },
  fromDriver(value: string) {
    const [userId] = value.slice(1, -1).split(',');
    return userId.trim();
  },
});

export type FileAttachment = {
  bucket_id: string;
  file_path: string;
};

export const fileAttachment = customType<{
  data: FileAttachment;
  driverData: string;
}>({
  dataType() {
    return 'file_attachment';
  },
  toDriver(value: FileAttachment) {
    return sql`ROW(${value.bucket_id},${value.file_path})::file_attachment`;
  },
  fromDriver(value: string): FileAttachment {
    const [bucketId, filePath] = value.slice(1, -1).split(',');
    return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
  },
});

export function escapeLiteral(str: string): string {
  return "'" + str.replace(/'/g, "''") + "'";
}

export const userProfileArray = customType<{
  data: string[];
  driverData: string;
}>({
  dataType() {
    return 'user_profile[]';
  },
  toDriver(value: string[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::user_profile[]`;
    }
    const elements = value.map(id => `ROW(${escapeLiteral(id)})::user_profile`).join(',');
    return sql.raw(`ARRAY[${elements}]::user_profile[]`);
  },
  fromDriver(value: string): string[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => m.slice(1, -1).split(',')[0].trim());
  },
});

export const fileAttachmentArray = customType<{
  data: FileAttachment[];
  driverData: string;
}>({
  dataType() {
    return 'file_attachment[]';
  },
  toDriver(value: FileAttachment[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::file_attachment[]`;
    }
    const elements = value.map(f =>
      `ROW(${escapeLiteral(f.bucket_id)},${escapeLiteral(f.file_path)})::file_attachment`
    ).join(',');
    return sql.raw(`ARRAY[${elements}]::file_attachment[]`);
  },
  fromDriver(value: string): FileAttachment[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => {
      const [bucketId, filePath] = m.slice(1, -1).split(',');
      return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
    });
  },
});

export const healthArticles = pgTable("health_articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 200 }).notNull(),
  summary: varchar("summary", { length: 500 }),
  content: text("content").notNull(),
  coverImageUrl: text("cover_image_url"),
  category: varchar("category", { length: 50 }).notNull().default('general'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const followupNotes = pgTable("followup_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  childId: uuid("child_id").notNull(),
  doctorId: uuid("doctor_id").notNull(),
  content: text("content").notNull(),
  nextFollowupDate: date("next_followup_date"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_followup_child_id").on(table.childId),
  index("idx_followup_doctor_id").on(table.doctorId),
  foreignKey({
    columns: [table.childId],
    foreignColumns: [children.id],
    name: "followup_notes_child_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.doctorId],
    foreignColumns: [doctorUsers.id],
    name: "followup_notes_doctor_id_fkey",
  }).onDelete("cascade"),
]);

export const rintalaRecords = pgTable("rintala_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  childId: uuid("child_id").notNull(),
  totalScore: integer("total_score").notNull().default(0),
  level: varchar("level", { length: 10 }).notNull().default('good'),
  /**
   * @type { control: number, sensation: number, frequency: number, soiling: number, accidental: number, constipation: number, social: number }
   */
  dimensions: jsonb("dimensions").notNull().default('{}'),
  postOpMonths: integer("post_op_months").notNull().default(0),
  completedAt: customTimestamptz("completed_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_rintala_child_id").on(table.childId),
  index("idx_rintala_completed_at").on(table.completedAt),
  foreignKey({
    columns: [table.childId],
    foreignColumns: [children.id],
    name: "rintala_records_child_id_fkey",
  }).onDelete("cascade"),
]);

export const bowelDiaryRecords = pgTable("bowel_diary_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  childId: uuid("child_id").notNull(),
  recordDate: date("record_date").notNull(),
  bowelCount: integer("bowel_count").notNull().default(0),
  stoolType: integer("stool_type").notNull().default(4),
  bloatingLevel: varchar("bloating_level", { length: 20 }).notNull().default('none'),
  temperature: numeric("temperature").notNull().default('36.5'),
  notes: text("notes"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_bowel_diary_child_id").on(table.childId),
  index("idx_bowel_diary_record_date").on(table.recordDate),
  uniqueIndex("idx_bowel_diary_child_date").on(table.childId, table.recordDate),
  foreignKey({
    columns: [table.childId],
    foreignColumns: [children.id],
    name: "bowel_diary_records_child_id_fkey",
  }).onDelete("cascade"),
]);

export const redFlagRecords = pgTable("red_flag_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  childId: uuid("child_id").notNull(),
  /**
   * @type { bloating: boolean, fever: boolean, diarrhea: boolean, blood: boolean, vomit: boolean, lethargy: boolean }
   */
  answers: jsonb("answers").notNull().default('{}'),
  riskLevel: varchar("risk_level", { length: 10 }).notNull(),
  advice: text("advice").notNull(),
  postOpDays: integer("post_op_days").notNull().default(0),
  checkedAt: customTimestamptz("checked_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_red_flag_child_id").on(table.childId),
  index("idx_red_flag_risk_level").on(table.riskLevel),
  index("idx_red_flag_checked_at").on(table.checkedAt),
  foreignKey({
    columns: [table.childId],
    foreignColumns: [children.id],
    name: "red_flag_records_child_id_fkey",
  }).onDelete("cascade"),
]);

export const children = pgTable("children", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: uuid("parent_id").notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  gender: varchar("gender", { length: 10 }),
  birthDate: date("birth_date"),
  surgeryDate: date("surgery_date").notNull(),
  diagnosisType: varchar("diagnosis_type", { length: 20 }).notNull().default('短段型'),
  currentRiskLevel: varchar("current_risk_level", { length: 10 }).notNull().default('green'),
  latestCheckDate: date("latest_check_date"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_children_parent_id").on(table.parentId),
  index("idx_children_risk_level").on(table.currentRiskLevel),
  foreignKey({
    columns: [table.parentId],
    foreignColumns: [parentUsers.id],
    name: "children_parent_id_fkey",
  }).onDelete("cascade"),
]);

export const doctorUsers = pgTable("doctor_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull().default('123456'),
  name: varchar("name", { length: 50 }).notNull(),
  department: varchar("department", { length: 100 }),
  title: varchar("title", { length: 50 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("doctor_users_phone_key").on(table.phone),
]);

export const parentUsers = pgTable("parent_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull().default('123456'),
  name: varchar("name", { length: 50 }).notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("parent_users_phone_key").on(table.phone),
]);

// table aliases
export const bowelDiaryRecordsTable = bowelDiaryRecords;
export const childrenTable = children;
export const doctorUsersTable = doctorUsers;
export const followupNotesTable = followupNotes;
export const healthArticlesTable = healthArticles;
export const parentUsersTable = parentUsers;
export const redFlagRecordsTable = redFlagRecords;
export const rintalaRecordsTable = rintalaRecords;
