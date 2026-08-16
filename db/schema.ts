import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const siteSettings = sqliteTable("site_settings", {
  id: text("id").primaryKey(), value: text("value").notNull(), updatedAt: integer("updated_at").notNull(), updatedBy: text("updated_by"),
});

export const inquiries = sqliteTable("inquiries", {
  id: text("id").primaryKey(), name: text("name").notNull(), phone: text("phone").notNull(), channel: text("channel").notNull().default("phone"),
  stayType: text("stay_type").notNull().default("monthly"), roomNumber: text("room_number").notNull().default(""), arrivalDate: text("arrival_date"), message: text("message"), locale: text("locale").notNull().default("en"),
  status: text("status").notNull().default("new"), notes: text("notes").notNull().default(""), convertedResidentId: text("converted_resident_id").notNull().default(""), createdAt: integer("created_at").notNull(), updatedAt: integer("updated_at"),
}, (table) => [index("idx_inquiries_status_created_at").on(table.status, table.createdAt)]);

export const media = sqliteTable("media", {
  id: text("id").primaryKey(), objectKey: text("object_key").notNull().unique(), fileName: text("file_name").notNull(), contentType: text("content_type").notNull(),
  caption: text("caption").notNull().default(""), visible: integer("visible", { mode: "boolean" }).notNull().default(true), sortOrder: integer("sort_order").notNull().default(0), createdAt: integer("created_at").notNull(),
});
