import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw(`
            CREATE TYPE task_type_enum AS ENUM ('exercise', 'quiz', 'sheet');
        `)

    // 2. Créer la table tasks (orchestrateur polymorphe)
    this.schema.createTable('tasks', (table) => {
      table.increments('id').primary()
      table.integer('module_id').unsigned().notNullable().references('id').inTable('modules')
      table
        .enum('type', ['exercise', 'quiz', 'sheet'], {
          useNative: true,
          enumName: 'task_type_enum',
          existingType: true,
        })
        .notNullable()
      table.string('display_name').notNullable()
      table.integer('order_index').notNullable().defaultTo(0)
      table.boolean('is_visible').defaultTo(true)
      table.integer('estimated_time_minutes').defaultTo(15)
      table.text('description').nullable()
      table.timestamps(true, true)

      // 🗑️ Soft delete
      table.timestamp('deleted_at').nullable()

      // Index
      table.index(['module_id', 'order_index'], 'tasks_module_order_idx')
      table.index(['module_id', 'type'], 'tasks_module_type_idx')
      table.index(['deleted_at'], 'tasks_deleted_at_idx')
      table.unique(['module_id', 'type', 'order_index'], {
        indexName: 'tasks_module_type_order_unique',
      })
    })

    // 3. Ajouter task_id aux tables de contenu existantes
    this.schema.alterTable('exercices', (table) => {
      table.integer('task_id').unsigned().nullable().references('id').inTable('tasks')
      table.index('task_id', 'exercices_task_id_idx')
    })

    this.schema.alterTable('sheets', (table) => {
      table.integer('task_id').unsigned().nullable().references('id').inTable('tasks')
      table.index('task_id', 'sheets_task_id_idx')
    })

    this.schema.raw(`
            DO $$ 
            DECLARE constraint_name text;
            BEGIN
                SELECT conname INTO constraint_name 
                FROM pg_constraint 
                WHERE conrelid = 'student_task_activities'::regclass 
                AND contype = 'c' 
                AND pg_get_constraintdef(oid) LIKE '%task_type%';
                
                IF constraint_name IS NOT NULL THEN
                    EXECUTE 'ALTER TABLE student_task_activities DROP CONSTRAINT ' || constraint_name;
                END IF;
            END $$;
        `)

    this.schema.raw(`
            ALTER TABLE student_task_activities 
            ADD CONSTRAINT student_task_activities_task_type_check 
            CHECK (task_type IN ('quiz', 'exercise', 'sheet'));
        `)

    this.schema.raw(`
            ALTER TABLE student_task_activities 
            ALTER COLUMN task_id DROP NOT NULL;
        `)

    this.schema.raw(`
            ALTER TABLE student_task_activities 
            ADD CONSTRAINT student_task_activities_task_id_fkey 
            FOREIGN KEY (task_id) REFERENCES tasks(id);
        `)

    this.schema.alterTable('student_task_activities', (table) => {
      table.index(['student_id', 'task_id'], 'student_task_activities_student_task_idx')
      table.index(['task_id', 'status'], 'student_task_activities_task_status_idx')
    })
  }

  async down() {
    this.schema.alterTable('student_task_activities', (table) => {
      table.dropIndex(['student_id', 'task_id'], 'student_task_activities_student_task_idx')
      table.dropIndex(['task_id', 'status'], 'student_task_activities_task_status_idx')
    })

    this.schema.raw(`
            ALTER TABLE student_task_activities 
            DROP CONSTRAINT IF EXISTS student_task_activities_task_id_fkey;
        `)

    this.schema.raw(`
            ALTER TABLE student_task_activities 
            ALTER COLUMN task_id SET NOT NULL;
        `)

    this.schema.alterTable('exercices', (table) => {
      table.dropIndex(['task_id'], 'exercices_task_id_idx')
      table.dropColumn('task_id')
    })

    this.schema.alterTable('sheets', (table) => {
      table.dropIndex(['task_id'], 'sheets_task_id_idx')
      table.dropColumn('task_id')
    })

    this.schema.dropTable('tasks')

    this.schema.raw(`
            ALTER TABLE student_task_activities 
            DROP CONSTRAINT IF EXISTS student_task_activities_task_type_check;
        `)

    this.schema.raw(`
            ALTER TABLE student_task_activities 
            ADD CONSTRAINT student_task_activities_task_type_check 
            CHECK (task_type IN ('quiz', 'exercise', 'sheet'));
        `)

    this.schema.raw('DROP TYPE IF EXISTS task_type_enum CASCADE')
  }
}
