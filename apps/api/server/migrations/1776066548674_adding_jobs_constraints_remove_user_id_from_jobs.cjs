/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
//export const shorthands = undefined;
exports.shorthands = undefined;
/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
    //pgm.addConstraint( tablename, constraint_name, expression )
    pgm.dropConstraint("jobs", "jobs_foreign_user_id", { ifExists: true });
    pgm.dropColumn("jobs", "user_id", { ifExists: true });
    pgm.createIndex("jobs", "repo_id", {
        name: "unique_active_job_per_repo",
        unique: true,
        where: "status IN ('PENDING','RUNNING')",
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
*/
exports.down = (pgm) => {
  // 1. remove index
  pgm.dropIndex("jobs", "repo_id", {
    name: "unique_active_job_per_repo",
    ifExists: true,
  });

  // 2. add user_id column back
  pgm.addColumn("jobs", {
    user_id: {
      type: "uuid",
      notNull: true,
    },
  });

  // 3. restore foreign key
  pgm.addConstraint("jobs", "jobs_foreign_user_id", {
    foreignKeys: {
      columns: ["user_id"],
      references: "users(user_id)",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
  });
};