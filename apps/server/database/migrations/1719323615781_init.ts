import { BaseSchema } from '@adonisjs/lucid/schema'
import { grade, level, subject, userRole } from '@viastud/utils'

export default class extends BaseSchema {
  protected userTable = 'users'
  protected adminsTable = 'admins'
  protected professorsTable = 'professors'
  protected modulesTable = 'modules'
  protected sheetsTable = 'sheets'
  protected quizzesTable = 'quizzes'
  protected exercicesTable = 'exercices'
  protected userRegisterTokensTable = 'user_register_tokens'
  protected filesTable = 'files'
  protected sheetImagesTable = 'sheet_images'
  protected studentDetailsTable = 'student_details'
  protected moduleToStudentTable = 'module_to_students'
  protected professorAvailabilitiesTable = 'professor_availabilities'

  async up() {
    this.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    this.schema.createTable(this.userTable, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.string('email', 254).notNullable().unique()
      table.string('first_name')
      table.string('last_name')
      table.string('password')
      table.string('phone_number')
      table.enum('role', userRole, {
        useNative: true,
        enumName: 'user_role',
      })

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })

    this.schema.createTable(this.adminsTable, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.string('first_name').notNullable()
      table.string('last_name').notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })

    this.schema.createTable(this.professorsTable, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.string('first_name').notNullable()
      table.string('last_name').notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('password')
      table.string('phone_number', 254).notNullable()

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })

    this.schema.createTable(this.modulesTable, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table
        .enum('grade', grade, {
          useNative: true,
          enumName: 'grade',
        })
        .notNullable()
      table
        .enum('subject', subject, {
          useNative: true,
          enumName: 'subject',
        })
        .notNullable()

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })

    this.schema.createTable(this.sheetsTable, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.enum('level', level, {
        useNative: true,
        enumName: 'level',
      })
      table
        .integer('module_id')
        .unsigned()
        .references('modules.id')
        .onDelete('CASCADE')
        .notNullable()
      table.text('content').notNullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      table.unique(['module_id', 'level'])
    })

    this.schema.createTable(this.quizzesTable, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table
        .integer('module_id')
        .unsigned()
        .references('modules.id')
        .onDelete('CASCADE')
        .notNullable()

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })

    this.schema.createTable(this.exercicesTable, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table
        .integer('module_id')
        .unsigned()
        .references('modules.id')
        .onDelete('CASCADE')
        .notNullable()

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })

    this.schema.createTable(this.userRegisterTokensTable, (table) => {
      table.increments('id')
      table.uuid('token').notNullable().unique()
      table.uuid('user_id').unsigned().references('users.id').onDelete('CASCADE').notNullable()

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })

    this.schema.createTable(this.filesTable, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))

      table.string('file_name')

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })

    this.schema.createTable(this.sheetImagesTable, (table) => {
      table.integer('sheet_id').references('sheets.id').onDelete('CASCADE')
      table.uuid('file_id').references('files.id').unique().onDelete('CASCADE')

      table.unique(['sheet_id', 'file_id'])
    })

    this.schema.createTable(this.studentDetailsTable, (table) => {
      table.uuid('user_id').unsigned().primary().references('users.id').onDelete('CASCADE')
      table.enum('grade', grade, {
        useNative: true,
        enumName: 'grade',
        existingType: true,
      })
      table.specificType('interested_in', 'subject[]').defaultTo('{}')
      table.boolean('is_finished').defaultTo('false').notNullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })

    this.schema.createTable(this.moduleToStudentTable, (table) => {
      table.increments('id').primary()
      table.uuid('user_id').unsigned().references('users.id').onDelete('CASCADE').notNullable()
      table
        .integer('module_id')
        .unsigned()
        .references('modules.id')
        .onDelete('CASCADE')
        .notNullable()
      table.boolean('doing').defaultTo(false).notNullable()
      table.boolean('done').defaultTo(false).notNullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      table.unique(['user_id', 'module_id'])
    })

    this.schema.createTable(this.professorAvailabilitiesTable, (table) => {
      table.increments('id').primary()
      table.uuid('professor_id').unsigned().references('professors.id').onDelete('CASCADE')
      table.date('week_start').notNullable()
      table.tinyint('day_of_week').notNullable().checkBetween([0, 6])
      table.tinyint('hour').notNullable().checkBetween([7, 20])
      table.boolean('is_available').defaultTo(false)
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      table.unique(['professor_id', 'week_start', 'day_of_week', 'hour'])
    })
  }

  async down() {
    this.schema.dropTable(this.professorAvailabilitiesTable)
    this.schema.dropTable(this.moduleToStudentTable)
    this.schema.dropTable(this.studentDetailsTable)
    this.schema.dropTable(this.userRegisterTokensTable)
    this.schema.dropTable(this.exercicesTable)
    this.schema.dropTable(this.quizzesTable)
    this.schema.dropTable(this.userTable)
    this.schema.dropTable(this.sheetImagesTable)
    this.schema.dropTable(this.filesTable)
    this.schema.dropTable(this.sheetsTable)
    this.schema.dropTable(this.modulesTable)
    this.schema.dropTable(this.professorsTable)
    this.schema.dropTable(this.adminsTable)

    this.schema.raw('DROP TYPE IF EXISTS grade CASCADE')
    this.schema.raw('DROP TYPE IF EXISTS level CASCADE')
    this.schema.raw('DROP TYPE IF EXISTS subject CASCADE')
    this.schema.raw('DROP TYPE IF EXISTS user_role CASCADE')
  }
}
