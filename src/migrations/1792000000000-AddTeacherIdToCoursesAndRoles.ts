import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTeacherIdToCoursesAndRoles1792000000000
  implements MigrationInterface
{
  name = 'AddTeacherIdToCoursesAndRoles1792000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "teacherId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" character varying NOT NULL DEFAULT 'user'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "courses" DROP COLUMN IF EXISTS "teacherId"`,
    );
  }
}
