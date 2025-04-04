"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRelations = exports.userRelations = exports.uploads = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    email: (0, pg_core_1.varchar)("email", { length: 255 }).notNull().unique(),
    password: (0, pg_core_1.varchar)("password", { length: 255 }).notNull(),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow()
});
exports.uploads = (0, pg_core_1.pgTable)("uploads", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id")
        .notNull()
        .references(() => exports.users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    fileUrl: (0, pg_core_1.text)("file_url").notNull(),
    fileType: (0, pg_core_1.varchar)("file_type", { length: 50 }).notNull(),
    fileName: (0, pg_core_1.varchar)("file_name", { length: 255 }).notNull(),
    publicId: (0, pg_core_1.varchar)("public_id", { length: 255 }).notNull(),
    uploaded_at: (0, pg_core_1.timestamp)("uploaded_at").defaultNow()
});
exports.userRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many }) => ({
    uploads: many(exports.uploads)
}));
exports.uploadRelations = (0, drizzle_orm_1.relations)(exports.uploads, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.uploads.userId],
        references: [exports.users.id]
    })
}));
