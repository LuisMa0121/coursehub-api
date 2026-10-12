import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpgradeStageOneSchema1791676800000 implements MigrationInterface {
  name = 'UpgradeStageOneSchema1791676800000';
  public async up(q: QueryRunner): Promise<void> {
    // Existing books from stage one must be upgraded without losing rows.
    await q.query(`ALTER TABLE "books" ADD COLUMN IF NOT EXISTS "categoryId" integer`);
    await q.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_attribute a
        ON a.attrelid=c.conrelid AND a.attnum=ANY(c.conkey)
        WHERE c.conrelid='books'::regclass AND c.contype='f' AND a.attname='categoryId') THEN
        ALTER TABLE "books" ADD CONSTRAINT "FK_books_category_upgrade"
        FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL;
      END IF;
    END $$`);
    for (const [column, parent] of [['studentId', 'students'], ['courseId', 'courses']]) {
      const constraints: { conname: string }[] = await q.query(`
        SELECT c.conname FROM pg_constraint c JOIN pg_attribute a
        ON a.attrelid=c.conrelid AND a.attnum=ANY(c.conkey)
        WHERE c.conrelid='enrollments'::regclass AND c.contype='f' AND a.attname=$1`, [column]);
      for (const constraint of constraints) {
        await q.query(`ALTER TABLE "enrollments" DROP CONSTRAINT "${constraint.conname.replace(/"/g, '""')}"`);
      }
      await q.query(`ALTER TABLE "enrollments" ADD CONSTRAINT "FK_enrollments_${column}_cascade"
        FOREIGN KEY ("${column}") REFERENCES "${parent}"("id") ON DELETE CASCADE`);
    }
  }
  public async down(q: QueryRunner): Promise<void> {
    for (const [column, parent] of [['studentId', 'students'], ['courseId', 'courses']]) {
      await q.query(`ALTER TABLE "enrollments" DROP CONSTRAINT "FK_enrollments_${column}_cascade"`);
      await q.query(`ALTER TABLE "enrollments" ADD CONSTRAINT "FK_enrollments_${column}_restrict"
        FOREIGN KEY ("${column}") REFERENCES "${parent}"("id") ON DELETE NO ACTION`);
    }
    // Keep categoryId and its values: rollback must not discard stage two data.
  }
}
