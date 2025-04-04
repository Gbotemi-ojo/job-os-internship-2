import { serial, varchar, pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    created_at: timestamp("created_at").defaultNow()
});

export const uploads = pgTable("uploads", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .notNull()
        .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    fileUrl: text("file_url").notNull(),   
    fileType: varchar("file_type", { length: 50 }).notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    publicId: varchar("public_id", { length: 255 }).notNull(),
    uploaded_at: timestamp("uploaded_at").defaultNow()
});

export const userRelations = relations(users, ({ many }) => ({
    uploads: many(uploads)
}));

export const uploadRelations = relations(uploads, ({ one }) => ({
    user: one(users, {
        fields: [uploads.userId],
        references: [users.id]
    })
}));
